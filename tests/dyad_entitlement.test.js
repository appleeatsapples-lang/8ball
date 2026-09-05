// 8ball / tests / dyad_entitlement.test.js
// The dyad entitlement (DOCTRINE §4.B v0.81 / §5 / §5.B Call 2 v0.81).
//
// The single sheet is free and unlimited; the dyad is the one paid surface,
// USD $3 once, permanent, unlimited — and the ONLY thing that grants it is a
// signed access token verified offline (core/entitlement.js) against the
// configured public key, stored verbatim (ui/payments.js DYAD_KEY) and
// re-verified at every boot. This file drives that path end to end with a
// throwaway key pair generated per run: the real signer, the real verifier,
// the real storage shim, the real CLI in a subprocess.
//
// What it proves, in the order the task stated it:
//   · unentitled devices cannot obtain t5 from any unsigned or forged input
//     (a stored tier, `?paid=t5`, a hand-written key, a tampered token,
//     a token under the wrong key, a token for another product/version);
//   · a signed token grants t5, is stored, and grants again at every later
//     boot — permanent, and nothing is consumed by any number of resolutions
//     or renders;
//   · a bad return link never LOWERS an entitled device, and a failed
//     verification never deletes a stored token (no downgrade);
//   · every failure mode fails CLOSED (no Web Crypto, no configured key).

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DYAD_PRODUCT_URL, DYAD_PUBLIC_KEYS, TOKEN_VERSION, TOKEN_PRODUCT,
  parseDyadToken, verifyDyadToken, signDyadToken, isSaleId,
  returnTokenFrom, hasLegacyPaidParam,
  base64urlEncode, base64urlDecode,
} from '../core/entitlement.js';
import {
  DYAD_KEY, TIER_KEY, CREDITS_KEY, PENDING_KEY,
  getRenderTier, isDyadEntitled, resolveDyadEntitlement, scrubRetiredCommerceKeys,
} from '../ui/payments.js';
import { dyadEntitled, dyadOfferVisible } from '../ui/dyad.js';
import { coordsForTier } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const subtle = globalThis.crypto.subtle;

const originalLocalStorage = globalThis.localStorage;
afterEach(() => {
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

function mockStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    snapshot: () => Object.fromEntries(store),
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
  };
}

async function keyPair() {
  const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = await subtle.exportKey('jwk', pair.publicKey);
  const priv = await subtle.exportKey('jwk', pair.privateKey);
  return { publicJwk: { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y }, privateJwk: priv };
}

// Re-sign an arbitrary payload object (to forge version / product fields)
async function signRaw(payload, privateJwk) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const key = await subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes));
  return `${base64urlEncode(bytes)}.${base64urlEncode(sig)}`;
}

let K, OTHER, token;
beforeAll(async () => {
  K = await keyPair();
  OTHER = await keyPair();
  token = await signDyadToken({ id: 'sale_0001', iat: 1_757_000_000 }, K.privateJwk);
});

// ── the shipped configuration ─────────────────────────────────────

// The two constants are either BOTH empty (the unconfigured build this PR
// ships) or BOTH filled (the controller's launch steps 1–2 done). Every pin
// below states the contract of the state the checkout is actually in, so
// the suite stays green across the launch instead of teaching the operator
// that red is expected (pr242 audit, Lane A HIGH-2).
const CONFIGURED = DYAD_PRODUCT_URL !== '';

describe(`shipped configuration — ${CONFIGURED ? 'configured' : 'empty'}, and fail-closed either way`, () => {
  it('the two constants move together — a url without a key or a key without a url is a half-launch', () => {
    expect(DYAD_PUBLIC_KEYS.length > 0).toBe(CONFIGURED);
    expect(Object.isFrozen(DYAD_PUBLIC_KEYS)).toBe(true);
  });

  it('while unconfigured: no url, no key, nothing is invented here', () => {
    if (CONFIGURED) return;
    expect(DYAD_PRODUCT_URL).toBe('');
    expect(DYAD_PUBLIC_KEYS).toEqual([]);
  });

  it('a token signed under a key that is NOT configured is refused — unconfigured while the list is empty, unverified once it is not', async () => {
    expect(await verifyDyadToken(token)).toEqual({ ok: false, reason: CONFIGURED ? 'unverified' : 'unconfigured' });
  });

  it('a configured url must be a bare Gumroad Buy Link — no query, no tracking', () => {
    if (!CONFIGURED) return;
    expect(DYAD_PRODUCT_URL).toMatch(/^https:\/\/[a-z0-9-]+\.gumroad\.com\/l\/[a-z0-9]+$/);
  });

  it('a configured public key is a P-256 JWK with no private component', () => {
    for (const jwk of DYAD_PUBLIC_KEYS) {
      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('P-256');
      expect(typeof jwk.x).toBe('string');
      expect(typeof jwk.y).toBe('string');
      expect(jwk.d).toBeUndefined();
    }
  });
});

// ── the token ─────────────────────────────────────────────────────

describe('the token — shape, signature, and every way it fails closed', () => {
  it('base64url round-trips and refuses characters outside the alphabet', () => {
    for (const len of [0, 1, 2, 3, 4, 31, 32, 33, 64]) {
      const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + len) & 255);
      const enc = base64urlEncode(bytes);
      expect(enc).not.toMatch(/[+/=]/);
      expect([...base64urlDecode(enc) || []]).toEqual([...bytes]);
    }
    expect(base64urlDecode('ab+c')).toBeNull();
    expect(base64urlDecode('a')).toBeNull();
    expect(base64urlDecode('')).toBeNull();
  });

  it('a signed token parses with the declared payload', () => {
    const parsed = parseDyadToken(token);
    expect(parsed.ok).toBe(true);
    expect(parsed.payload).toEqual({ v: TOKEN_VERSION, p: TOKEN_PRODUCT, id: 'sale_0001', iat: 1_757_000_000 });
    expect(parsed.signature.length).toBe(64);
  });

  it('verifies under its key and carries the sale id back', async () => {
    expect(await verifyDyadToken(token, { keys: [K.publicJwk] })).toEqual({ ok: true, id: 'sale_0001' });
  });

  it('verifies under a rotated key list as long as the signing key is still present (rotation never downgrades)', async () => {
    expect((await verifyDyadToken(token, { keys: [OTHER.publicJwk, K.publicJwk] })).ok).toBe(true);
    expect((await verifyDyadToken(token, { keys: [K.publicJwk, OTHER.publicJwk] })).ok).toBe(true);
  });

  it('fails under the wrong key', async () => {
    expect(await verifyDyadToken(token, { keys: [OTHER.publicJwk] })).toEqual({ ok: false, reason: 'unverified' });
  });

  it('fails on every tampering of the payload or the signature', async () => {
    const [p, s] = token.split('.');
    const flip = (str, i) => str.slice(0, i) + (str[i] === 'A' ? 'B' : 'A') + str.slice(i + 1);
    const forged = [
      `${flip(p, 5)}.${s}`, `${p}.${flip(s, 5)}`, `${p}.${s.slice(0, -1)}`, `${p}x.${s}`,
      `${p}.${s}.${s}`, p, s, `.${s}`, `${p}.`, '', 'not a token', `${p}.${'A'.repeat(86)}`,
    ];
    // a re-encoded payload with a different sale id under the SAME signature
    const other = JSON.parse(new TextDecoder().decode(base64urlDecode(p)));
    other.id = 'sale_0002';
    forged.push(`${base64urlEncode(new TextEncoder().encode(JSON.stringify(other)))}.${s}`);
    for (const t of forged) {
      const verdict = await verifyDyadToken(t, { keys: [K.publicJwk] });
      expect(verdict.ok, JSON.stringify(t.slice(0, 40))).toBe(false);
    }
  });

  it('pins the raw-signature length at exactly 64 bytes — 63 and 65 are malformed before any crypto runs (pr242 audit, Lane B L1)', async () => {
    const [p, s] = token.split('.');
    const sig = base64urlDecode(s);
    expect(sig.length).toBe(64);
    const shorter = base64urlEncode(sig.slice(0, 63));
    const longer = base64urlEncode(Uint8Array.from([...sig, 0]));
    for (const bad of [shorter, longer]) {
      expect(parseDyadToken(`${p}.${bad}`)).toEqual({ ok: false, reason: 'malformed' });
      // and with a verifier that would say yes to anything, the shape check still refuses
      const yes = { importKey: async () => ({}), verify: async () => true };
      expect(await verifyDyadToken(`${p}.${bad}`, { keys: [K.publicJwk], subtle: yes })).toEqual({ ok: false, reason: 'malformed' });
    }
  });

  it('refuses a correctly SIGNED token for another product, another version, or a malformed claim set', async () => {
    const good = { v: 1, p: 'dyad', id: 'sale_0003', iat: 1_757_000_000 };
    for (const payload of [
      { ...good, p: 'sheet' }, { ...good, p: 't5' }, { ...good, v: 2 }, { ...good, v: '1' },
      { ...good, id: '' }, { ...good, id: 'x'.repeat(65) }, { ...good, id: 7 },
      { ...good, iat: 0 }, { ...good, iat: 1.5 }, { ...good, iat: '1757000000' },
      { v: 1, p: 'dyad' }, [], null, 'dyad', 42,
    ]) {
      const t = await signRaw(payload, K.privateJwk);
      const verdict = await verifyDyadToken(t, { keys: [K.publicJwk] });
      expect(verdict, JSON.stringify(payload)).toEqual({ ok: false, reason: 'malformed' });
    }
  });

  it('fails closed without Web Crypto and never throws', async () => {
    expect(await verifyDyadToken(token, { keys: [K.publicJwk], subtle: null })).toEqual({ ok: false, reason: 'no-crypto' });
    const broken = { importKey: async () => { throw new Error('nope'); }, verify: async () => true };
    expect((await verifyDyadToken(token, { keys: [K.publicJwk], subtle: broken })).ok).toBe(false);
    const lying = { importKey: async () => ({}), verify: async () => { throw new Error('nope'); } };
    expect((await verifyDyadToken(token, { keys: [K.publicJwk], subtle: lying })).ok).toBe(false);
  });

  it('ignores junk entries in the key list and a private component smuggled into it', async () => {
    expect((await verifyDyadToken(token, { keys: [null, {}, { kty: 'RSA' }, K.publicJwk] })).ok).toBe(true);
    expect((await verifyDyadToken(token, { keys: [{ ...K.publicJwk, d: K.privateJwk.d }] })).ok).toBe(true);
    expect((await verifyDyadToken(token, { keys: 'not-a-list' })).ok).toBe(false);
  });

  it('the sale id is an identifier shape on BOTH sides — an email, a name or a sentence can neither be signed nor verified (pr242 audit, Lane A MED-2)', async () => {
    const personal = ['', 'x'.repeat(65), 'alice.smith@example.com', 'alice smith', 'Alice Smith 1990-05-15',
      'sale 0001', 'sale#1', 'sale:1', 'sale.1', '\u00e9'];
    for (const id of personal) {
      expect(isSaleId(id), JSON.stringify(id)).toBe(false);
      await expect(signDyadToken({ id }, K.privateJwk), JSON.stringify(id)).rejects.toThrow();
      // and a token carrying one, signed by other means, is malformed before any crypto
      const raw = await signRaw({ v: 1, p: 'dyad', id, iat: 1_757_000_000 }, K.privateJwk);
      expect(await verifyDyadToken(raw, { keys: [K.publicJwk] }), JSON.stringify(id)).toEqual({ ok: false, reason: 'malformed' });
    }
    // Gumroad's own id shapes pass: hex, and url-safe base64 with padding
    for (const id of ['sale_0004', 'FO8TXN-dvxYbBbahG97Y-Q==', 'a1b2c3d4e5f6', 'x']) {
      expect(isSaleId(id), id).toBe(true);
    }
    const t = await signDyadToken({ id: 'sale_0004' }, K.privateJwk);
    expect(Object.keys(parseDyadToken(t).payload).sort()).toEqual(['iat', 'id', 'p', 'v']);
  });

  it('a token over the length cap is malformed before any crypto runs — even against a verifier that says yes to anything (pr242 audit, Lane A LOW-6)', async () => {
    const yes = { importKey: async () => ({}), verify: async () => true };
    const [, s] = token.split('.');
    const bigPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify({ v: 1, p: 'dyad', id: 'sale_big', iat: 1, pad: 'x'.repeat(1000) })));
    const big = `${bigPayload}.${s}`;
    expect(big.length).toBeGreaterThan(1024);
    expect(parseDyadToken(big)).toEqual({ ok: false, reason: 'malformed' });
    expect(await verifyDyadToken(big, { keys: [K.publicJwk], subtle: yes })).toEqual({ ok: false, reason: 'malformed' });
  });
});

// ── the return url ────────────────────────────────────────────────

describe('the return url — a signed link is read; the unsigned parameter is recognised only to be stripped', () => {
  it('reads ?dyad= and nothing else', () => {
    expect(returnTokenFrom(`?dyad=${token}`)).toBe(token);
    expect(returnTokenFrom(`?sent=1&dyad=${token}`)).toBe(token);
    expect(returnTokenFrom('?dyad=')).toBeNull();
    expect(returnTokenFrom('')).toBeNull();
    expect(returnTokenFrom(null)).toBeNull();
    expect(returnTokenFrom('?paid=t5')).toBeNull();
    expect(returnTokenFrom('?tier=t5&entitled=1')).toBeNull();
  });

  it('flags the retired ?paid= parameter for stripping without reading a value from it', () => {
    expect(hasLegacyPaidParam('?paid=t5')).toBe(true);
    expect(hasLegacyPaidParam('?paid=t3')).toBe(true);
    expect(hasLegacyPaidParam('?paid=')).toBe(true);
    expect(hasLegacyPaidParam(`?dyad=${token}`)).toBe(false);
    expect(hasLegacyPaidParam('')).toBe(false);
  });
});

// ── resolution: the storage half, driven through the real module ──

describe('resolveDyadEntitlement — grants only on a verified token, stores it, never downgrades', () => {
  it('starts on the complete single sheet: nothing stored, nothing on the url → t3', async () => {
    const storage = mockStorage();
    globalThis.localStorage = storage;
    const outcome = await resolveDyadEntitlement({ keys: [K.publicJwk] });
    expect(outcome.granted).toBe(false);
    expect(getRenderTier()).toBe('t3');
    expect(storage.snapshot()).toEqual({});
  });

  it('the unsigned era grants nothing: a stored t5 tier, credits, a pending stage, ?paid=t5 — all resolve t3', async () => {
    const storage = mockStorage({ [TIER_KEY]: 't5', [CREDITS_KEY]: '9', [PENDING_KEY]: '{"name":"x","dob":"2000-01-01"}' });
    globalThis.localStorage = storage;
    expect(returnTokenFrom('?paid=t5')).toBeNull();
    const outcome = await resolveDyadEntitlement({ returnToken: returnTokenFrom('?paid=t5'), keys: [K.publicJwk] });
    expect(outcome.granted).toBe(false);
    expect(getRenderTier()).toBe('t3');
    expect(dyadEntitled(getRenderTier())).toBe(false);
    // and the boot scrub then removes the unsigned record, as under v0.71
    expect(scrubRetiredCommerceKeys()).toBe(true);
    expect(storage.snapshot()).toEqual({});
  });

  it('a forged or tampered return link grants nothing and writes nothing', async () => {
    const storage = mockStorage();
    globalThis.localStorage = storage;
    const [p, s] = token.split('.');
    for (const bad of ['t5', 'true', `${p}.${s.slice(0, -2)}AA`, await signDyadToken({ id: 'sale_x' }, OTHER.privateJwk)]) {
      const outcome = await resolveDyadEntitlement({ returnToken: bad, keys: [K.publicJwk] });
      expect(outcome.granted, bad.slice(0, 20)).toBe(false);
      expect(getRenderTier()).toBe('t3');
    }
    expect(storage.snapshot()).toEqual({});
  });

  it('a hand-written entitlement key grants nothing and is left alone', async () => {
    const storage = mockStorage({ [DYAD_KEY]: 'entitled' });
    globalThis.localStorage = storage;
    const outcome = await resolveDyadEntitlement({ keys: [K.publicJwk] });
    expect(outcome).toMatchObject({ granted: false, source: 'stored', reason: 'malformed' });
    expect(getRenderTier()).toBe('t3');
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: 'entitled' });
  });

  it('a signed return link grants t5 and stores the token verbatim — the whole grant, no counter, no credit', async () => {
    const storage = mockStorage({ eight_ball_profile_v1: '{"name":"a","dob":"2000-01-01"}' });
    globalThis.localStorage = storage;
    const outcome = await resolveDyadEntitlement({ returnToken: token, keys: [K.publicJwk] });
    expect(outcome).toEqual({ granted: true, source: 'return', stored: true });
    expect(getRenderTier()).toBe('t5');
    expect(isDyadEntitled()).toBe(true);
    expect(dyadEntitled(getRenderTier())).toBe(true);
    expect(coordsForTier(getRenderTier()).has('dyadRelation')).toBe(true);
    expect(dyadOfferVisible(getRenderTier(), 'https://example.test/l/x')).toBe(false);
    expect(storage.snapshot()).toEqual({
      eight_ball_profile_v1: '{"name":"a","dob":"2000-01-01"}',
      [DYAD_KEY]: token,
    });
  });

  it('is permanent: the stored token grants again at the next boot, with no url, and again after that', async () => {
    const storage = mockStorage({ [DYAD_KEY]: token });
    globalThis.localStorage = storage;
    for (let boot = 0; boot < 5; boot++) {
      const outcome = await resolveDyadEntitlement({ keys: [K.publicJwk] });
      expect(outcome).toEqual({ granted: true, source: 'stored', stored: true });
      expect(getRenderTier()).toBe('t5');
    }
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
  });

  it('is unlimited: a thousand render-time resolutions consume nothing and touch storage never', async () => {
    const storage = mockStorage({ [DYAD_KEY]: token });
    let reads = 0;
    const counting = { ...storage, getItem: k => { reads++; return storage.getItem(k); } };
    globalThis.localStorage = counting;
    await resolveDyadEntitlement({ keys: [K.publicJwk] });
    const readsAfterBoot = reads;
    for (let i = 0; i < 1000; i++) expect(getRenderTier()).toBe('t5');
    expect(reads).toBe(readsAfterBoot);
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
  });

  it('re-opening the same link on an entitled device is idempotent — no second write, nothing stacked', async () => {
    const storage = mockStorage({ [DYAD_KEY]: token });
    let writes = 0;
    globalThis.localStorage = { ...storage, setItem: (k, v) => { writes++; storage.setItem(k, v); } };
    const outcome = await resolveDyadEntitlement({ returnToken: token, keys: [K.publicJwk] });
    expect(outcome).toEqual({ granted: true, source: 'return', stored: true });
    expect(writes).toBe(0);
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
  });

  it('a second valid token (a second purchase, or another device\'s link) replaces nothing that matters — still t5, one key', async () => {
    const second = await signDyadToken({ id: 'sale_0002' }, K.privateJwk);
    const storage = mockStorage({ [DYAD_KEY]: token });
    globalThis.localStorage = storage;
    const outcome = await resolveDyadEntitlement({ returnToken: second, keys: [K.publicJwk] });
    expect(outcome.granted).toBe(true);
    expect(getRenderTier()).toBe('t5');
    expect(Object.keys(storage.snapshot())).toEqual([DYAD_KEY]);
    expect((await verifyDyadToken(storage.getItem(DYAD_KEY), { keys: [K.publicJwk] })).ok).toBe(true);
  });

  it('never downgrades: a bad return link on an entitled device keeps t5 and the stored token', async () => {
    const storage = mockStorage({ [DYAD_KEY]: token });
    globalThis.localStorage = storage;
    const outcome = await resolveDyadEntitlement({ returnToken: 'forged.link', keys: [K.publicJwk] });
    expect(outcome).toEqual({ granted: true, source: 'stored', stored: true, reason: 'malformed' });
    expect(getRenderTier()).toBe('t5');
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
  });

  it('never deletes: a stored token that cannot verify in THIS environment stays for the next boot', async () => {
    // no configured key (the shipped state) and no Web Crypto — both are
    // environment failures, and a purchase must survive them.
    for (const opts of [{ keys: [] }, { keys: [K.publicJwk], subtle: null }]) {
      const storage = mockStorage({ [DYAD_KEY]: token });
      globalThis.localStorage = storage;
      // a fresh module state is not reachable here (module singleton), so
      // assert the storage contract and the outcome rather than the flag
      const outcome = await resolveDyadEntitlement(opts);
      expect(outcome.source).toBe('stored');
      expect(['unconfigured', 'no-crypto']).toContain(outcome.reason);
      expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
    }
  });

  it('never downgrades, on a FRESH module: a failed return verify and a failed stored verify both leave an earned t5 standing (pr242 audit, Lane A MED-4)', async () => {
    // The module holds its flag as a singleton, so the two tests above cannot
    // see a transient downgrade masked by a valid stored token re-granting.
    // A fresh module instance can: earn t5 once, then fail both verify paths
    // with NO valid token anywhere, and the flag must still read true.
    vi.resetModules();
    const fresh = await import('../ui/payments.js');
    const storage = mockStorage();
    globalThis.localStorage = storage;
    expect(fresh.getRenderTier()).toBe('t3');
    expect((await fresh.resolveDyadEntitlement({ returnToken: token, keys: [K.publicJwk] })).granted).toBe(true);
    expect(fresh.isDyadEntitled()).toBe(true);
    // the stored token is now replaced by garbage (a hostile or corrupt write)
    storage.setItem(DYAD_KEY, 'garbage.token');
    const badReturn = await fresh.resolveDyadEntitlement({ returnToken: 'forged.link', keys: [K.publicJwk] });
    expect(badReturn.granted).toBe(true);
    expect(fresh.isDyadEntitled()).toBe(true);
    expect(fresh.getRenderTier()).toBe('t5');
    const badStored = await fresh.resolveDyadEntitlement({ keys: [K.publicJwk] });
    expect(badStored.granted).toBe(true);
    expect(fresh.isDyadEntitled()).toBe(true);
    // and the environment failures, same module, same answer
    for (const opts of [{ keys: [] }, { keys: [K.publicJwk], subtle: null }, { returnToken: token, keys: [] }]) {
      await fresh.resolveDyadEntitlement(opts);
      expect(fresh.isDyadEntitled(), JSON.stringify(Object.keys(opts))).toBe(true);
    }
    vi.resetModules();
  });

  it('a verified link on a device with blocked storage is entitled for the visit and reports stored:false so the host can retry', async () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const outcome = await resolveDyadEntitlement({ returnToken: token, keys: [K.publicJwk] });
    expect(outcome).toEqual({ granted: true, source: 'return', stored: false });
    expect(getRenderTier()).toBe('t5');
  });

  it('the boot scrub and forget-device never touch the entitlement key (source + behavior)', async () => {
    const storage = mockStorage({ [DYAD_KEY]: token, [TIER_KEY]: 't3' });
    globalThis.localStorage = storage;
    expect(scrubRetiredCommerceKeys()).toBe(true);
    expect(storage.snapshot()).toEqual({ [DYAD_KEY]: token });
    const modalsJs = readFileSync(join(REPO_ROOT, 'ui', 'modals.js'), 'utf-8');
    expect(modalsJs).not.toMatch(/dyad|entitle/i);
  });
});

// ── the operator CLI, end to end in a subprocess ──────────────────

describe('scripts/dyad_entitlement.mjs — keygen, sign, verify agree with the runtime verifier', () => {
  const script = join(REPO_ROOT, 'scripts', 'dyad_entitlement.mjs');
  const run = (args, opts = {}) => execFileSync(process.execPath, [script, ...args], { encoding: 'utf-8', ...opts });

  it('generates a P-256 pair, signs a sale, and the runtime verifier accepts exactly that token', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dyad-ent-'));
    try {
      const keyFile = join(dir, 'private.json');
      const out = run(['keygen', '--out', keyFile]);
      const pub = JSON.parse(out.trim().split('\n').pop());
      expect(pub).toMatchObject({ kty: 'EC', crv: 'P-256' });
      expect(pub.d).toBeUndefined();
      expect(JSON.parse(readFileSync(keyFile, 'utf-8')).d).toBeTypeOf('string');

      const signed = run(['sign', '--key', keyFile, '--id', 'sale_cli_1', '--origin', 'https://example.test']).trim().split('\n');
      expect(signed[1]).toBe(`https://example.test/?dyad=${signed[0]}`);
      expect(returnTokenFrom(new URL(signed[1]).search)).toBe(signed[0]);
      expect(await verifyDyadToken(signed[0], { keys: [pub] })).toEqual({ ok: true, id: 'sale_cli_1' });
      expect((await verifyDyadToken(signed[0], { keys: [K.publicJwk] })).ok).toBe(false);

      const pubFile = join(dir, 'public.json');
      writeFileSync(pubFile, JSON.stringify(pub));
      expect(JSON.parse(run(['verify', '--token', signed[0], '--public', pubFile]))).toEqual({ ok: true, id: 'sale_cli_1' });
      // refuses to overwrite a key that may already back sold tokens
      expect(() => run(['keygen', '--out', keyFile], { stdio: 'pipe' })).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('verify against the SHIPPED configuration is exit 2 for a foreign-key token — unconfigured or configured alike (fail closed, end to end)', () => {
    // The token is signed by this run's throwaway key, which is never the
    // configured one; the CLI must refuse it in every state of the build.
    let code = 0;
    let out = '';
    try { run(['verify', '--token', token], { stdio: 'pipe' }); }
    catch (e) { code = e.status; out = String(e.stdout || ''); }
    expect(code).toBe(2);
    expect(out).toMatch(CONFIGURED ? /unverified/ : /unconfigured/);
  });
});
