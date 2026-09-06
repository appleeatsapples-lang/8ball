// 8ball / tests / dyad_activation.test.js — DOCTRINE v0.91: the complete example
// before checkout and the one stateless activation function.
//
// Three boundaries, each pinned by name:
//   1. the example page renders exactly ONE fixed pair and can be steered
//      to no other: no form, no query read, no storage, no token, no share;
//   2. the activation function is the only server-side code in the product:
//      key shape first, Gumroad once, the buyer's email never leaves the
//      verify function, every failure is a reason code, success is a token
//      that verifies under the public half of the same key;
//   3. the wiring: netlify.toml routes, the env example, no private JWK
//      tracked, the stub dead outside `netlify dev`.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { webcrypto } from 'node:crypto';
import { verifyDyadToken, parseDyadToken } from '../core/entitlement.js';
import { activate, verifyWithGumroad, stubVerifyIfEnabled, KEY_SHAPE, REASONS, STUB_KEY, GUMROAD_VERIFY_URL } from '../netlify/functions/activate.mjs';
import { EXAMPLE_PAIR, EXAMPLE_LABEL, EXAMPLE_REMOVED_IDS } from '../ui/example.js';
import { ACTIVATE_REASONS, reasonFrom, initActivatePage } from '../ui/activate.js';
import { DYAD_OFFER_COPY, DYAD_EXAMPLE_PATH } from '../ui/dyad.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const read = f => readFileSync(join(ROOT, f), 'utf-8');
const subtle = webcrypto.subtle;

async function testPair() {
  const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const priv = await subtle.exportKey('jwk', pair.privateKey);
  const pub = await subtle.exportKey('jwk', pair.publicKey);
  return { priv, pub: { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y } };
}
const GOOD_KEY = '85DB262A-C19D4B06-A5335A6B-8C079166';
// A Gumroad-shaped fixture, INCLUDING the fields the function must drop.
const gumroadFixture = (over = {}) => ({
  success: true, uses: 1,
  purchase: { sale_id: 'sale_ABC123', product_permalink: 'dyad', email: 'someone@example.test', full_name: 'Some One',
    refunded: false, chargebacked: false, disputed: false, ...over },
});

describe('the complete example before checkout (§1.J v0.91)', () => {
  const html = read('example.html');
  const js = read('ui/example.js');

  it('the page carries no form, no input, no script but its own module, and the fixed label twice', () => {
    expect(html).not.toMatch(/<form|<input|<textarea|<select/);
    expect((html.match(/<script/g) || []).length).toBe(1);
    expect(html).toMatch(/import \{ initExamplePage \} from '\.\/ui\/example\.js'/);
    expect((html.match(/a fixed pair, not yours · your own pair opens after purchase/g) || []).length).toBe(2);
    expect(html).toMatch(/id="rail-read"/); // the offer anchor's home
  });

  it('the module can render exactly one pair: constants only, no query, no storage, no token, no share', () => {
    expect(EXAMPLE_PAIR.a.name).toBeTruthy(); expect(EXAMPLE_PAIR.b.dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.isFrozen(EXAMPLE_PAIR)).toBe(true);
    for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'fetch(', 'XMLHttpRequest', 'sendBeacon',
      'location.search', 'URLSearchParams', 'resolveDyadEntitlement', 'getRenderTier', 'initPairShareUI', 'pairShare', 'payments.js', 'entitlement.js\'.*verify']) {
      expect(js, forbidden).not.toMatch(new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    expect(js).toMatch(/getTier: \(\) => 't5'/);            // page-local, by construction
    expect(js).toMatch(/getNoteSlot: \(\) => 'mid'/);        // no facet storage
    expect(js).toMatch(/onRelationChange: \(\) => \{\}/);    // no share controller
  });

  it('after render, every way to change or export the pair is REMOVED, and the offer is the sheet\'s own', () => {
    for (const id of ['dyad-form', 'dyad-share-btn', 'dyad-share-disclosure', 'dyad-compare-btn', 'dyad-back', 'dyad-open-btn']) {
      expect(EXAMPLE_REMOVED_IDS, id).toContain(id);
    }
    expect(js).toMatch(/el\.remove\(\)/);
    expect(js).toMatch(/syncDyadEntry\('t3', DYAD_PRODUCT_URL\)/);
    expect(EXAMPLE_LABEL).not.toMatch(/soulmate|compatib|score|hurry|only|now\b/i);
  });

  it('the offer names the example and the route serves it at a bare path above the catch-all', () => {
    expect(DYAD_OFFER_COPY.example).toBe('see a complete example first');
    expect(DYAD_EXAMPLE_PATH).toBe('/example');
    const toml = read('netlify.toml');
    const ex = toml.indexOf('from = "/example"'); const act = toml.indexOf('from = "/activate"'); const all = toml.indexOf('from = "/*"');
    expect(ex).toBeGreaterThan(-1); expect(act).toBeGreaterThan(-1);
    expect(ex).toBeLessThan(all); expect(act).toBeLessThan(all);
    expect(toml.slice(ex, ex + 80)).toMatch(/to = "\/example\.html"\s+status = 200/);
    expect(toml.slice(act, act + 80)).toMatch(/to = "\/activate\.html"\s+status = 200/);
    expect(toml).not.toMatch(/from = "\/(example|activate)"[\s\S]{0,80}force = true/);
    const index = read('index.html');
    expect(index).toMatch(/href="\/example"/); expect(index).toMatch(/href="\/activate"/);
    const dyad = read('ui/dyad.js');
    expect(dyad).toMatch(/id = 'dyad-example-line'/); expect(dyad).toMatch(/example\.hidden = !offer/);
  });

  it('the publish scrub keeps the pages and the function', () => {
    const toml = read('netlify.toml');
    const cmd = (toml.match(/command = "([^"]+)"/) || [, ''])[1];
    for (const kept of ['example.html', 'activate.html', 'netlify', 'core', 'ui']) expect(cmd.split(' ')).not.toContain(kept);
  });
});

describe('the activation function (§12 / §5.B v0.91)', () => {
  it('rejects a malformed key BEFORE any verification is attempted', async () => {
    let called = 0;
    for (const bad of ['', 'TEST-KEY', 'abc', '85DB262A-C19D4B06-A5335A6B', '85DB262A-C19D4B06-A5335A6B-8C07916G', ' ' + GOOD_KEY + 'x']) {
      const r = await activate({ licenseKey: bad, verify: async () => { called++; return { ok: true, saleId: 'x' }; }, signingKey: { kty: 'EC', d: 'x' } });
      expect(r.redirect, bad).toBe('/activate?e=shape');
    }
    expect(called).toBe(0);
    expect(KEY_SHAPE.test(GOOD_KEY)).toBe(true);
  });

  it('answers unconfigured with no signing key, and never calls verify then', async () => {
    let called = 0;
    const r = await activate({ licenseKey: GOOD_KEY, verify: async () => { called++; return { ok: true, saleId: 'x' }; }, signingKey: null });
    expect(r.redirect).toBe('/activate?e=unconfigured'); expect(called).toBe(0);
  });

  it('maps every verify outcome to a reason code and nothing else', async () => {
    const { priv } = await testPair();
    for (const [result, reason] of [[{ ok: false, reason: 'invalid' }, 'invalid'], [{ ok: false, reason: 'refunded' }, 'refunded'],
      [{ ok: false, reason: 'unavailable' }, 'unavailable'], [{ ok: false, reason: 'nonsense' }, 'unavailable'], [null, 'unavailable']]) {
      const r = await activate({ licenseKey: GOOD_KEY, verify: async () => result, signingKey: priv, subtle });
      expect(r.redirect, reason).toBe(`/activate?e=${reason}`);
    }
    const thrown = await activate({ licenseKey: GOOD_KEY, verify: async () => { throw new Error('boom'); }, signingKey: priv, subtle });
    expect(thrown.redirect).toBe('/activate?e=unavailable');
    for (const r of REASONS) expect(Object.keys(ACTIVATE_REASONS), r).toContain(r);
  });

  it('on success signs a token that verifies under the SAME key\'s public half and carries only the sale id', async () => {
    const { priv, pub } = await testPair();
    const r = await activate({ licenseKey: GOOD_KEY, verify: async () => ({ ok: true, saleId: 'sale_ABC123' }), signingKey: priv, subtle, now: 1800000000 });
    expect(r.redirect).toMatch(/^\/\?dyad=[A-Za-z0-9_.%-]+$/);
    const token = decodeURIComponent(r.redirect.slice('/?dyad='.length));
    const verified = await verifyDyadToken(token, { keys: [pub], subtle });
    expect(verified.ok).toBe(true); expect(verified.id).toBe('sale_ABC123');
    const { payload } = parseDyadToken(token);
    expect(Object.keys(payload).sort()).toEqual(['iat', 'id', 'p', 'v']);
    expect(payload.iat).toBe(1800000000);
    // and NOT under a different key
    const other = await testPair();
    expect((await verifyDyadToken(token, { keys: [other.pub], subtle })).ok).toBe(false);
  });

  it('verifyWithGumroad posts the three fields once and returns ONLY ok/saleId — the email never leaves it', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => gumroadFixture() }; };
    const r = await verifyWithGumroad(GOOD_KEY, { permalink: 'dyad', fetchImpl });
    expect(r).toEqual({ ok: true, saleId: 'sale_ABC123' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(GUMROAD_VERIFY_URL);
    const body = new URLSearchParams(calls[0].init.body);
    expect(body.get('product_permalink')).toBe('dyad'); expect(body.get('license_key')).toBe(GOOD_KEY); expect(body.get('increment_uses_count')).toBe('false');
    expect(JSON.stringify(r)).not.toMatch(/example\.test|Some One|full_name|email/);
  });

  it('end to end with the fixture: the redirect and the token carry no byte of the buyer\'s email or name', async () => {
    const { priv } = await testPair();
    const fetchImpl = async () => ({ ok: true, status: 200, json: async () => gumroadFixture() });
    const r = await activate({ licenseKey: GOOD_KEY, verify: key => verifyWithGumroad(key, { permalink: 'dyad', fetchImpl }), signingKey: priv, subtle });
    expect(r.redirect).toMatch(/^\/\?dyad=/);
    const token = decodeURIComponent(r.redirect.slice('/?dyad='.length));
    const decoded = Buffer.from(token.split('.')[0], 'base64url').toString('utf8');
    for (const secret of ['someone', 'example.test', 'Some One', 'full_name', 'email']) {
      expect(r.redirect, secret).not.toContain(secret); expect(decoded, secret).not.toContain(secret);
    }
  });

  it('refunded, chargebacked, disputed and unknown-sale responses never sign', async () => {
    for (const over of [{ refunded: true }, { chargebacked: true }, { disputed: true }, { sale_id: 'not a sale id!' }, { sale_id: undefined, id: undefined }]) {
      const fetchImpl = async () => ({ ok: true, status: 200, json: async () => gumroadFixture(over) });
      const r = await verifyWithGumroad(GOOD_KEY, { permalink: 'dyad', fetchImpl });
      expect(r.ok, JSON.stringify(over)).toBe(false);
      expect(['refunded', 'invalid']).toContain(r.reason);
    }
    const notFound = await verifyWithGumroad(GOOD_KEY, { permalink: 'dyad', fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ success: false, message: 'That license does not exist for the provided product.' }) }) });
    expect(notFound).toEqual({ ok: false, reason: 'invalid' });
    const down = await verifyWithGumroad(GOOD_KEY, { permalink: 'dyad', fetchImpl: async () => { throw new Error('ECONNRESET'); } });
    expect(down).toEqual({ ok: false, reason: 'unavailable' });
    const noPermalink = await verifyWithGumroad(GOOD_KEY, { permalink: '', fetchImpl: async () => { throw new Error('must not be called'); } });
    expect(noPermalink).toEqual({ ok: false, reason: 'unconfigured' });
  });

  it('the local-dev stub is dead outside `netlify dev`', () => {
    expect(stubVerifyIfEnabled({ DYAD_VERIFY_STUB: '1' })).toBeNull();
    expect(stubVerifyIfEnabled({ NETLIFY_DEV: 'true' })).toBeNull();
    expect(stubVerifyIfEnabled({ NETLIFY_DEV: 'true', DYAD_VERIFY_STUB: '1' })).toBeTypeOf('function');
    expect(KEY_SHAPE.test(STUB_KEY)).toBe(true);
    const fn = read('netlify/functions/activate.mjs');
    expect(fn).toMatch(/env\.NETLIFY_DEV === 'true' && env\.DYAD_VERIFY_STUB === '1'/);
  });
});

describe('the activation page and the wiring (§5.B call 3 v0.91)', () => {
  const html = read('activate.html');

  it('is one native POST form to the one same-origin function, one field, no script needed to submit', () => {
    expect((html.match(/<form/g) || []).length).toBe(1);
    expect(html).toMatch(/<form id="activate-form" method="POST" action="\/\.netlify\/functions\/activate" autocomplete="off">/);
    expect((html.match(/<input/g) || []).length).toBe(1);
    expect(html).toMatch(/name="license_key"/);
    expect(html).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|localStorage|type="email"|name="email"/);
    expect(html).toMatch(/nothing else is sent\. the key is checked with gumroad once and not kept\./);
    expect(html).toMatch(/<meta name="robots" content="noindex">/);
  });

  it('the page script shows exactly the reason it was sent back with, then strips the query', () => {
    expect(reasonFrom('?e=invalid')).toBe('invalid'); expect(reasonFrom('')).toBeNull(); expect(reasonFrom('?e=')).toBeNull();
    const status = { textContent: 'x', hidden: true }; let replaced = 0;
    expect(initActivatePage({ status, search: '?e=refunded', replace: () => { replaced++; } })).toBe(ACTIVATE_REASONS.refunded);
    expect(status.hidden).toBe(false); expect(status.textContent).toBe(ACTIVATE_REASONS.refunded); expect(replaced).toBe(1);
    expect(initActivatePage({ status, search: '?e=<script>', replace: () => { replaced++; } })).toBeNull();
    expect(status.hidden).toBe(true); expect(status.textContent).toBe(''); expect(replaced).toBe(2);
    expect(initActivatePage({ status, search: '', replace: () => { replaced++; } })).toBeNull(); expect(replaced).toBe(2);
    for (const t of Object.values(ACTIVATE_REASONS)) expect(t).not.toMatch(/[A-Z]{2,}|!/);
  });

  it('the env example names the two variables with empty values; no tracked file carries a private JWK', () => {
    const env = read('.env.example');
    expect(env).toMatch(/^DYAD_SIGNING_KEY=$/m); expect(env).toMatch(/^GUMROAD_PRODUCT_PERMALINK=dyad$/m);
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter(Boolean);
    const offenders = [];
    for (const f of tracked) {
      if (/\.(png|jpg|jpeg|ico|woff2?|pdf)$/i.test(f)) continue;
      let text; try { text = readFileSync(join(ROOT, f), 'utf-8'); } catch (_) { continue; }
      if (/"kty"\s*:\s*"EC"[\s\S]{0,200}"d"\s*:\s*"[A-Za-z0-9_-]{20,}"/.test(text) || /"d"\s*:\s*"[A-Za-z0-9_-]{40,}"[\s\S]{0,200}"crv"\s*:\s*"P-256"/.test(text)) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it('the function is the only server-side code and imports the product\'s own signer', () => {
    const fns = readdirSync(join(ROOT, 'netlify', 'functions')).filter(f => statSync(join(ROOT, 'netlify', 'functions', f)).isFile());
    expect(fns).toEqual(['activate.mjs']);
    const fn = read('netlify/functions/activate.mjs');
    expect(fn).toMatch(/import \{ signDyadToken, isSaleId \} from '\.\.\/\.\.\/core\/entitlement\.js'/);
    expect(fn).toMatch(/'cache-control': 'no-store'/);
    expect(fn).not.toMatch(/console\.log|\.email|full_name/);
  });
});
