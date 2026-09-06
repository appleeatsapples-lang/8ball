// 8ball / netlify/functions/activate.mjs — the one stateless signing function (DOCTRINE §12 v0.91)
//
// Receives a Gumroad license key by a native form POST from /activate.html,
// verifies it ONCE with Gumroad server-side, signs the §4.B v0.81 dyad
// access token with key 1's private half from the environment, and answers
// with a 303 redirect into the product. It stores nothing, keeps no log of
// its own, and discards every field of Gumroad's response except success,
// refund and chargeback status and the sale id — the buyer's email arrives
// in that response and never leaves `verifyWithGumroad`'s local scope.
//
// Everything with a decision in it is exported and pure so tests can drive
// it with fixtures; the default export is the thin HTTP wrapper.
import { signDyadToken, isSaleId } from '../../core/entitlement.js';

export const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';
/** Gumroad's key shape: four groups of eight hex characters. Checked before any network call. */
export const KEY_SHAPE = /^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{8}){3}$/;
export const REASONS = Object.freeze(['shape', 'invalid', 'refunded', 'unavailable', 'unconfigured']);
export const ACTIVATE_PAGE = '/activate';
export const STUB_KEY = '00000000-00000000-00000000-00000000';

/**
 * Ask Gumroad whether a license key belongs to a live sale of the product.
 * Returns ONLY { ok, saleId } or { ok:false, reason } — the response object
 * (which carries the buyer's email) is dropped here and nowhere else.
 */
export async function verifyWithGumroad(licenseKey, { permalink, productId = '', fetchImpl = globalThis.fetch } = {}) {
  if (!permalink) return { ok: false, reason: 'unconfigured' };
  const body = new URLSearchParams({ product_permalink: permalink, license_key: licenseKey, increment_uses_count: 'false' });
  let res;
  try {
    res = await fetchImpl(GUMROAD_VERIFY_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  } catch (_) { return { ok: false, reason: 'unavailable' }; }
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok || !data || data.success !== true) {
    return { ok: false, reason: res.status === 404 || (data && data.success === false) ? 'invalid' : 'unavailable' };
  }
  const p = data.purchase || {};
  // The sale must be OUR product: the permalink we asked about must come
  // back as the permalink of the sale, and — when the controller pins the
  // unique product id in the environment — that id too (pr248 grok lane).
  if (typeof p.product_permalink === 'string' && p.product_permalink !== permalink) return { ok: false, reason: 'invalid' };
  if (productId && String(p.product_id || '') !== String(productId)) return { ok: false, reason: 'invalid' };
  if (p.refunded === true || p.chargebacked === true || p.disputed === true) return { ok: false, reason: 'refunded' };
  const saleId = String(p.sale_id ?? p.id ?? '');
  if (!isSaleId(saleId)) return { ok: false, reason: 'invalid' };
  return { ok: true, saleId };
}

/**
 * The decision: key → redirect. `verify` is injected (Gumroad, or a fixture).
 * Every failure is a reason code on the activation page; success is the
 * product's own return url with a token signed under `signingKey`.
 */
export async function activate({ licenseKey, verify, signingKey, subtle, now } = {}) {
  const key = String(licenseKey || '').trim();
  if (!KEY_SHAPE.test(key)) return { redirect: `${ACTIVATE_PAGE}?e=shape` };
  if (!isPrivateJwk(signingKey)) return { redirect: `${ACTIVATE_PAGE}?e=unconfigured` };
  let result;
  try { result = await verify(key); } catch (_) { result = { ok: false, reason: 'unavailable' }; }
  if (!result || result.ok !== true) {
    const reason = result && REASONS.includes(result.reason) ? result.reason : 'unavailable';
    return { redirect: `${ACTIVATE_PAGE}?e=${reason}` };
  }
  const iat = Number.isFinite(now) ? Math.floor(now) : Math.floor(Date.now() / 1000);
  let token;
  try { token = await signDyadToken({ id: result.saleId, iat }, signingKey, { subtle }); }
  catch (_) { return { redirect: `${ACTIVATE_PAGE}?e=unconfigured` }; }   // a key that cannot sign is a configuration fault, never a 500
  return { redirect: `/?dyad=${encodeURIComponent(token)}` };
}

/** A usable P-256 private JWK: the four fields present and string-shaped, checked BEFORE any verify is spent. */
export function isPrivateJwk(k) {
  return !!k && typeof k === 'object' && k.kty === 'EC' && k.crv === 'P-256'
    && ['d', 'x', 'y'].every(f => typeof k[f] === 'string' && /^[A-Za-z0-9_-]{32,}$/.test(k[f]));
}

function parseSigningKey(raw) {
  if (!raw) return null;
  try { const k = JSON.parse(raw); return k && typeof k === 'object' ? k : null; } catch (_) { return null; }
}

/** Local-dev stub: honoured ONLY under `netlify dev` (NETLIFY_DEV=true), never in the production context, AND with an explicit flag. Dead in production by construction. */
export function stubVerifyIfEnabled(env) {
  if (env.NETLIFY_DEV === 'true' && env.CONTEXT !== 'production' && env.DYAD_VERIFY_STUB === '1') {
    return async key => (key === STUB_KEY ? { ok: true, saleId: 'stub_sale_local' } : { ok: false, reason: 'invalid' });
  }
  return null;
}

/** Netlify platform rate limit — a control outside product state (§12 v0.91): 30 posts per ip per minute. */
export const config = { rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip'] } };

/** Largest body the function will read: a key is 35 bytes; anything past this is not a form we sent. */
export const MAX_BODY_BYTES = 4096;

/** Every response goes through here, so `no-store` cannot be forgotten on a path. The Location is RELATIVE, never built from the request's host (pr248 grok lane, P1). */
export function redirectResponse(location) {
  return new Response(null, { status: 303, headers: { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', location } });
}

/** Read the one field from a small urlencoded body; anything else is an empty key (→ shape). */
export async function licenseKeyFrom(request) {
  try {
    const type = String(request.headers.get('content-type') || '');
    if (!type.startsWith('application/x-www-form-urlencoded')) return '';
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return '';
    return String(new URLSearchParams(text).get('license_key') || '');
  } catch (_) { return ''; }
}

export default async function handler(request) {
  if (request.method !== 'POST') return redirectResponse(ACTIVATE_PAGE);
  const licenseKey = await licenseKeyFrom(request);
  const env = process.env;
  const signingKey = parseSigningKey(env.DYAD_SIGNING_KEY);
  const permalink = env.GUMROAD_PRODUCT_PERMALINK || 'dyad';
  const productId = env.GUMROAD_PRODUCT_ID || '';
  const verify = stubVerifyIfEnabled(env) || (key => verifyWithGumroad(key, { permalink, productId }));
  const { redirect } = await activate({ licenseKey, verify, signingKey, subtle: globalThis.crypto && globalThis.crypto.subtle });
  return redirectResponse(redirect);
}
