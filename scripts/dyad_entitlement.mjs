#!/usr/bin/env node
// 8ball / scripts / dyad_entitlement.mjs — the operator-side half of the
// dyad entitlement (DOCTRINE §4.B v0.81 / §5.B Call 2 v0.81).
//
// Node stdlib only; no dependency, no network. The runtime half is
// core/entitlement.js (verification, in the browser, offline). This script
// exists so the per-sale step is one command rather than a ritual:
//
//   node scripts/dyad_entitlement.mjs keygen --out <private key file>
//       Generates an ECDSA P-256 key pair. The PRIVATE key is written to
//       the file you name — keep it OUTSIDE this repository (the
//       operator's private tree, never a tracked path). The PUBLIC JWK is
//       printed; paste it into DYAD_PUBLIC_KEYS in core/entitlement.js.
//
//   node scripts/dyad_entitlement.mjs sign --key <private key file> --id <sale id> [--origin <url>]
//       Signs one access token for one sale and prints the token and the
//       access link (`<origin>/?dyad=<token>`). The sale id is Gumroad's
//       sale identifier from the receipt/dashboard — never the buyer's
//       name or email (nothing personal enters the token).
//
//   node scripts/dyad_entitlement.mjs verify --token <token> [--public <jwk file>]
//       Verifies a token against the repository's configured public keys
//       (or a given public JWK) — the same check the product runs at boot.
//
// Rotation: generate a new pair and APPEND its public JWK to
// DYAD_PUBLIC_KEYS. Never remove an old public key — tokens signed under it
// are purchases, and a purchase is permanent.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const subtle = webcrypto.subtle;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ORIGIN = 'https://the-eight-ball.netlify.app';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

function usage(code = 1) {
  console.error('usage:\n  dyad_entitlement.mjs keygen --out <private key file>\n' +
    '  dyad_entitlement.mjs sign --key <private key file> --id <sale id> [--origin <url>]\n' +
    '  dyad_entitlement.mjs verify --token <token> [--public <jwk file>]');
  process.exit(code);
}

async function keygen() {
  const out = arg('out');
  if (!out) usage();
  if (existsSync(out)) {
    console.error(`refusing to overwrite ${out} — an existing signing key may already back sold tokens`);
    process.exit(1);
  }
  const pair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const priv = await subtle.exportKey('jwk', pair.privateKey);
  const pub = await subtle.exportKey('jwk', pair.publicKey);
  writeFileSync(out, JSON.stringify(priv, null, 2) + '\n', { mode: 0o600 });
  const publicJwk = { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y };
  console.log(`private key written to ${out} (keep it outside the repository)`);
  console.log('public JWK — append to DYAD_PUBLIC_KEYS in core/entitlement.js:');
  console.log(JSON.stringify(publicJwk));
}

async function sign() {
  const keyFile = arg('key');
  const id = arg('id');
  const origin = arg('origin', DEFAULT_ORIGIN);
  if (!keyFile || !id) usage();
  const { signDyadToken } = await import(join(__dirname, '..', 'core', 'entitlement.js'));
  const privateJwk = JSON.parse(readFileSync(keyFile, 'utf-8'));
  const token = await signDyadToken({ id }, privateJwk, { subtle });
  console.log(token);
  console.log(`${origin.replace(/\/$/, '')}/?dyad=${token}`);
}

async function verify() {
  const token = arg('token');
  if (!token) usage();
  const mod = await import(join(__dirname, '..', 'core', 'entitlement.js'));
  const publicFile = arg('public');
  const keys = publicFile ? [JSON.parse(readFileSync(publicFile, 'utf-8'))] : mod.DYAD_PUBLIC_KEYS;
  const result = await mod.verifyDyadToken(token, { keys, subtle });
  console.log(JSON.stringify(result));
  process.exit(result.ok ? 0 : 2);
}

const cmd = process.argv[2];
if (cmd === 'keygen') await keygen();
else if (cmd === 'sign') await sign();
else if (cmd === 'verify') await verify();
else usage(cmd ? 1 : 0);
