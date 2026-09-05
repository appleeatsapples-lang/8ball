// core/entitlement.js
// The dyad entitlement adapter (DOCTRINE §4.B v0.81 / §5 / §5.B Call 2).
//
// Pure in the §6 sense: no DOM, no localStorage, no timers, no network.
// The one platform surface it touches is Web Crypto (`crypto.subtle`), which
// is same-origin, offline and injected as a parameter so it can be replaced
// or withheld under test. Storage I/O lives in ui/payments.js.
//
// ── WHAT THIS IS, AND WHAT IT IS NOT ──────────────────────────────
// The single sheet is free and unlimited. The dyad (§1.J) is the one paid
// surface: USD $3 once, permanent, unlimited. There is no backend (§12
// [PERMANENT]) and no network call from the page (§5), so a purchase cannot be looked up at
// render time. What CAN be checked offline is a SIGNATURE: the operator
// signs a small access token per sale with a private key that never enters
// this repository, the buyer opens `/?dyad=<token>`, and this module
// verifies the token against the public key(s) below before anything is
// granted or stored. A token that does not verify grants nothing — and so
// does the old unsigned `?paid=t5` parameter, which is recognised only so
// the host can strip it from the URL (§5.B v0.81: the trust-based return is
// retired; an unsigned parameter is never proof of purchase).
//
// The boundary, stated plainly (§5.B v0.81 records the same words):
//   · a forged, altered, truncated or unsigned link grants nothing;
//   · a stored token is re-verified at every boot, so hand-editing storage
//     grants nothing either;
//   · a VALID token is a bearer credential. Without a server there is no
//     one-time-use, no revocation and no device binding: whoever opens a
//     valid link is entitled on that device, permanently. That is also how
//     a buyer takes their purchase to a second device. The payload carries
//     the sale id so a shared link is at least attributable to its sale.
//
// ── CONFIGURATION (operator-hand, never invented here) ────────────
// Both constants ship EMPTY and the runtime fails closed on both: with no
// product URL the offer is not presented, and with no public key nothing
// verifies. The values are set by the controller when the Gumroad product
// exists — see audits/dyad_entitlement_launch_config_2026-09-05.md for the
// exact steps and `scripts/dyad_entitlement.mjs` for keygen / sign / verify.
// Order matters and is safe in one direction only: a public key WITHOUT a
// product url is inert (nothing is offered, and no token exists to verify),
// while a url without a key would present an offer whose purchases could
// never be filed — tests/dyad_entitlement.test.js pins that asymmetry.

/** The live Gumroad Buy Link for the dyad — a BARE url, no query (§5.B).
 *  Set 2026-09-05 (launch step 1, controller's word); non-empty ⇒ the offer
 *  and the about modal's open paragraph render for unentitled devices. */
export const DYAD_PRODUCT_URL = 'https://theeightball.gumroad.com/l/dyad';

/**
 * Public verification keys — ECDSA P-256 as JWK objects
 * ({ kty: 'EC', crv: 'P-256', x, y }). A LIST so a key can be rotated by
 * ADDING its successor: tokens signed under an earlier key keep verifying,
 * because a purchase is permanent and a rotation must never downgrade one.
 */
export const DYAD_PUBLIC_KEYS = Object.freeze([
  // key 1 — generated 2026-09-05 (launch step 2). The private half lives in
  // the operator's private tree, never here. Rotate by APPENDING key 2.
  { kty: 'EC', crv: 'P-256', x: 'UoLIL8uUdh9z38oo8T9OPvbGrn2j6xCUNPInqjZbyYc', y: 'nuUvaSSkfp_kU0m_mxVJakNSumb271lQe2JJdSnyzlM' },
]);

export const TOKEN_VERSION = 1;
export const TOKEN_PRODUCT = 'dyad';
/** The query parameter a signed access link carries. */
export const RETURN_PARAM = 'dyad';
/** The RETIRED unsigned parameter (§5.B v0.36–v0.67). Recognised to be stripped, never honoured. */
export const LEGACY_PAID_PARAM = 'paid';

const SIGN_ALGO = Object.freeze({ name: 'ECDSA', namedCurve: 'P-256' });
const VERIFY_ALGO = Object.freeze({ name: 'ECDSA', hash: 'SHA-256' });
const MAX_TOKEN_LENGTH = 1024;
const MAX_ID_LENGTH = 64;
// The sale id is a Gumroad sale IDENTIFIER, never anything about a person.
// The shape is enforced on both sides (sign and parse), not left to
// convention: `@`, `.` and whitespace are excluded precisely so an email or
// a name cannot be signed into a link that lives in a url and in storage
// permanently (pr242 audit, Lane A MED-2).
const SALE_ID_RE = /^[A-Za-z0-9_+/=-]{1,64}$/;
export function isSaleId(id) {
  return typeof id === 'string' && id.length <= MAX_ID_LENGTH && SALE_ID_RE.test(id);
}

// ── base64url, without depending on atob/btoa quirks ──────────────
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

export function base64urlEncode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (b !== undefined) out += B64[(n >> 6) & 63];
    if (c !== undefined) out += B64[n & 63];
  }
  return out;
}

/** Strict decode: returns null on any character outside the alphabet or a bad length. */
export function base64urlDecode(text) {
  if (typeof text !== 'string' || text.length === 0 || text.length % 4 === 1) return null;
  const out = [];
  let buffer = 0, bits = 0;
  for (const ch of text) {
    const v = B64_INDEX.get(ch);
    if (v === undefined) return null;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 255);
    }
  }
  return new Uint8Array(out);
}

// ── the token ─────────────────────────────────────────────────────
// `<base64url(payload json)>.<base64url(ecdsa-p256-sha256 signature)>`
// payload: { v: 1, p: 'dyad', id: <sale id, ≤64 chars>, iat: <unix seconds> }

/**
 * Split and shape-check a token WITHOUT verifying it. Total: never throws.
 * A malformed token is `{ ok: false, reason: 'malformed' }`.
 */
export function parseDyadToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: 'malformed' };
  }
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  const payloadBytes = base64urlDecode(parts[0]);
  const signature = base64urlDecode(parts[1]);
  if (!payloadBytes || !signature || signature.length !== 64) return { ok: false, reason: 'malformed' };
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(payloadBytes)); }
  catch (_) { return { ok: false, reason: 'malformed' }; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, reason: 'malformed' };
  if (payload.v !== TOKEN_VERSION || payload.p !== TOKEN_PRODUCT) return { ok: false, reason: 'malformed' };
  if (!isSaleId(payload.id)) return { ok: false, reason: 'malformed' };
  if (!Number.isInteger(payload.iat) || payload.iat <= 0) return { ok: false, reason: 'malformed' };
  return { ok: true, payload, payloadBytes, signature };
}

// An EXPLICIT override wins even when it is null (a test or probe withholding
// Web Crypto); only an absent argument falls back to the platform's.
function subtleFrom(subtle) {
  if (subtle !== undefined) return subtle || null;
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  return c && c.subtle ? c.subtle : null;
}

async function importPublicKey(subtle, jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || typeof jwk.x !== 'string' || typeof jwk.y !== 'string') {
    return null;
  }
  try {
    // Only the public coordinates are imported — a private `d` in the
    // configured list would be a leak, and it is dropped here regardless.
    return await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y },
      SIGN_ALGO, false, ['verify']);
  } catch (_) { return null; }
}

/**
 * Verify a token against the configured public keys. FAIL CLOSED on every
 * path: no Web Crypto → 'no-crypto'; no keys → 'unconfigured'; bad shape →
 * 'malformed'; signature valid under none of the keys → 'unverified'.
 * Never throws.
 *
 * @param {string} token
 * @param {{keys?: readonly object[], subtle?: SubtleCrypto}} [opts]
 * @returns {Promise<{ok: boolean, id?: string, reason?: string}>}
 */
export async function verifyDyadToken(token, { keys = DYAD_PUBLIC_KEYS, subtle } = {}) {
  const parsed = parseDyadToken(token);
  if (!parsed.ok) return parsed;
  const s = subtleFrom(subtle);
  if (!s) return { ok: false, reason: 'no-crypto' };
  const list = Array.isArray(keys) ? keys : [];
  if (list.length === 0) return { ok: false, reason: 'unconfigured' };
  for (const jwk of list) {
    const key = await importPublicKey(s, jwk);
    if (!key) continue;
    try {
      if (await s.verify(VERIFY_ALGO, key, parsed.signature, parsed.payloadBytes)) {
        return { ok: true, id: parsed.payload.id };
      }
    } catch (_) { /* a throwing verify is a failed verify */ }
  }
  return { ok: false, reason: 'unverified' };
}

/**
 * Sign a payload — the operator-side half, used by scripts/dyad_entitlement.mjs
 * and by the tests. Never called by the product runtime (nothing in ui/ or
 * index.html imports it; the private key never exists on a device).
 */
export async function signDyadToken({ id, iat = Math.floor(Date.now() / 1000) }, privateJwk, { subtle } = {}) {
  const s = subtleFrom(subtle);
  if (!s) throw new Error('Web Crypto unavailable');
  if (!isSaleId(id)) throw new Error('bad sale id: a Gumroad sale identifier only ([A-Za-z0-9_+/=-], 1-64 chars) — never a name or an email');
  const payload = { v: TOKEN_VERSION, p: TOKEN_PRODUCT, id, iat };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const key = await s.importKey('jwk', privateJwk, SIGN_ALGO, false, ['sign']);
  const sig = new Uint8Array(await s.sign(VERIFY_ALGO, key, payloadBytes));
  return `${base64urlEncode(payloadBytes)}.${base64urlEncode(sig)}`;
}

// ── the return url ────────────────────────────────────────────────

/** The signed token a return url carries, or null. Never grants anything by itself. */
export function returnTokenFrom(search) {
  try {
    const value = new URLSearchParams(String(search || '')).get(RETURN_PARAM);
    return value === null || value === '' ? null : value;
  } catch (_) { return null; }
}

/** True when the RETIRED unsigned `?paid=` parameter is present — strip it, never honour it. */
export function hasLegacyPaidParam(search) {
  try { return new URLSearchParams(String(search || '')).has(LEGACY_PAID_PARAM); }
  catch (_) { return false; }
}
