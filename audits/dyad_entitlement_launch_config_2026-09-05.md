# Dyad entitlement — launch configuration (doctrine v0.81, 2026-09-05)

**Status (2026-09-05): steps 1 and 2 done; step 3 is the operator's
routine.** Both constants are now set, so a deployed build PRESENTS the
offer and the about modal's open paragraph to unentitled devices, and a
signed link under key 1 files the dyad. What remains is operational:
sending one signed link per sale (step 3). The original status text is
kept below as the record of what this document described when written.

*As written:* the code on this branch implements the model "free
complete single sheet + paid dyad at USD $3 once" and ships with both
configuration constants EMPTY. Until the three operator-hand steps below
are done, the deployed product presents no offer and grants the dyad to
no one: every device renders the complete single sheet, free and
unlimited, and nothing else. Nothing here creates the Gumroad product,
generates a key, or deploys.

## What the runtime does (so the steps make sense)

- `ui/payments.js getRenderTier()` answers `t3` (the complete single
  sheet) for every device, and `t5` (the dyad added) only after
  `resolveDyadEntitlement()` has verified a **signed access token**.
- A token is `base64url(payload).base64url(signature)`; the payload is
  `{ v: 1, p: 'dyad', id: <Gumroad sale id>, iat: <unix seconds> }`; the
  signature is ECDSA P-256 / SHA-256 by the operator's private key.
- The page verifies the token **offline** with Web Crypto against
  `DYAD_PUBLIC_KEYS` in `core/entitlement.js`. No network call is made
  (§5 is unchanged); no backend exists (§12).
- A verified token is stored verbatim under
  `eight_ball_dyad_entitlement_v1` and re-verified at every boot. It is
  never deleted by the product.
- The old unsigned `?paid=t5` parameter is stripped from the url and
  grants nothing. A stored `eight_ball_tier_v1` grants nothing and is
  still boot-scrubbed (v0.71).

## The three steps, in order

### 1. Create the Gumroad product and set the Buy Link

1. In the operator's Gumroad account create a new product: **8ball Dyad**,
   one-time price **USD $3**, no subscription, no variants, no license
   keys required (license keys cannot be verified without a network call,
   which §5 forbids — they would be decorative).
2. Product description, in the registry register (no urgency, no score,
   no soulmate language): the two shipped lines are fine —
   `dyad · $3 once` / `two complete sheets, read beside each other.
   permanent access.` — plus one sentence: *after purchase an access link
   is sent to the email used at checkout; opening it on a device files
   the dyad there, permanently. the second entry is never saved.*
3. Product **Content** (what a buyer sees after paying): the same
   sentence. Do NOT add a button to `/?paid=t5` — the parameter is dead.
   Gumroad cannot put a per-sale token in this static content, which is
   why step 3 exists.
4. Publish, copy the **bare** Buy Link (`https://<shop>.gumroad.com/l/<slug>`,
   no query string), and set it in `core/entitlement.js`:
   `export const DYAD_PRODUCT_URL = 'https://<shop>.gumroad.com/l/<slug>';`
   `tests/public_surface.test.js` pins that this constant is the only
   checkout url anywhere in shipped source; `tests/dyad_entitlement.test.js`
   pins its shape.

### 2. Generate the signing pair and set the public key

```
node scripts/dyad_entitlement.mjs keygen --out ~/dev/8ball-private/dyad_signing_key.json
```

- The private key file goes in the operator's private tree (the path
  above is a suggestion in the existing private-authoring location). It
  is never committed, never copied into the repo, never pasted anywhere
  but this machine. `keygen` refuses to overwrite an existing file.
- Paste the printed public JWK into `core/entitlement.js`:
  `export const DYAD_PUBLIC_KEYS = Object.freeze([{ kty: 'EC', crv: 'P-256', x: '…', y: '…' }]);`
- Rotation later = run `keygen` to a NEW file and APPEND the new public
  JWK. Never remove an old public key: tokens signed under it are
  purchases. (Before the first sale under a key there are no such tokens,
  and replacing it is free.)
- Step 2 may land before step 1 and did: a public key with no product url
  is inert (no offer, no token to verify). The suite pins the other
  direction only — a url without a key fails.

### 3. Deliver one signed access link per sale (the load-bearing step)

For each Gumroad sale:

```
node scripts/dyad_entitlement.mjs sign --key ~/dev/8ball-private/dyad_signing_key.json --id <gumroad sale id>
```

- The second output line is the access link
  (`https://the-eight-ball.netlify.app/?dyad=<token>`). Send it to the
  buyer at the email used at checkout, through Gumroad's own
  contact-buyer surface (the product never sees the email; §5.B).
- The sale id is Gumroad's identifier from the sale record — never the
  buyer's name or email. The shape `[A-Za-z0-9_+/=-]{1,64}` is enforced by
  both `sign` and the verifier, so an email or a name is refused rather
  than signed into a link that lives in a url and in storage. It is the
  only thing in the token besides a timestamp, and it exists so a shared
  link is attributable to a sale.
- Opening the link on any device files the dyad there. The buyer keeps
  the link to use a second device. There is no counter, nothing to
  consume, nothing to renew.

Until step 3 is operationally sustainable (a human sending each link),
this is a manual fulfilment product. The two ways to automate it are
both OUTSIDE this amendment and need their own doctrine decision:

- **Gumroad Ping → signer**: a webhook receiver (e.g. a Netlify Function)
  holding the private key that signs and emails the link on each sale.
  That is a server holding a secret — a fresh §5/§12 amendment, and a
  reconsideration of the "no backend" invariant, not something to slip
  in.
- **Gumroad license-key verification from the page**: needs a `fetch` to
  `api.gumroad.com` from the client — forbidden by §5 and by the
  `privacy_scan` stage. Not taken.

## Security boundary — read before launching

- Forged, altered, truncated, unsigned or wrong-key links grant nothing.
  Hand-editing local storage grants nothing (the stored token is
  re-verified). The unsigned `?paid=t5` grants nothing.
- **The about modal tracks the build.** While the constants are empty the
  modal says the dyad is not on sale on this build and names no price or
  processor; the $3 / Gumroad paragraph appears only once the url is set.
  Merging this PR before the steps above therefore closes the dyad for
  every current visitor (v0.71 had it open to all) and says so honestly.
  The controller may prefer to merge AFTER steps 1–2 so the open paragraph
  and the offer appear on the same deploy that closes the free dyad.
- **A valid link is a bearer credential.** With no server there is no
  one-time use, no revocation and no device binding. Anyone who obtains
  a buyer's link can use it. This is honest offline verification; it is
  not a licensing server, and the about copy does not pretend otherwise.
- The private key is the whole trust root. If it leaks, every token
  signed under it must be treated as unverifiable — which, given the
  never-remove-a-key rule, means a leak is not recoverable without
  downgrading real buyers. Keep it offline.

## Migration facts (v0.71 → v0.81)

- The v0.71 boot scrub removed `eight_ball_tier_v1`, `eight_ball_credits_v1`
  and `eight_ball_pending_profile_v1` from every device that visited
  since 2026-09-02. **That removal is irreversible; no migration can
  recover those values.**
- It costs no one anything under this model: t1/t2/t3 bought the single
  sheet, which is free for everyone now; the dyad checkout never went
  live before v0.71 (the `neysyv` listing was never published — doctrine
  §4.B v0.71 (6)) so **no device ever held a purchased dyad entitlement**.
  Every stored `t5` was an unsigned hand-entry, which is exactly what
  this amendment stops honouring.
- Nothing in the old model needs migrating into the new key. There is
  no list of past dyad buyers to re-issue tokens to, because there were
  none.

## Launch checklist

- [x] Gumroad product created, published, $3 one-time — Buy Link set in
      `DYAD_PRODUCT_URL` — **set 2026-09-05** to the controller's
      `https://theeightball.gumroad.com/l/dyad` (bare, no query). The
      listing's existence, price and published state were the controller's
      statement; they were NOT verified from the Claude Code session (its
      egress policy blocks the storefront). Verify once from a browser
      before announcing: the Buy Link opens a $3 one-time checkout.
- [x] key pair generated; public JWK set in `DYAD_PUBLIC_KEYS`; private
      key stored outside the repo — **done 2026-09-05 (key 1).** Generated
      in the Claude Code session that shipped v0.81, in a scratch directory
      outside the repository, and handed to the operator as a file; it was
      never written under the repo root. Because it transited that session,
      the operator could have generated a pair locally and replaced key 1
      before the first sale at zero cost. **Decided 2026-09-05, on the
      controller's word: key 1 is KEPT.** It is the signing key of record;
      the never-remove-a-key rule applies to it from the first sale on.
- [ ] `npm test` green with both constants filled — every pin follows the
      build's state (`CONFIGURED` in `tests/dyad_entitlement.test.js`; the
      shape pins then run against the real values). Proven before merge:
      62 files / 2192 tests green with the constants empty AND with a test
      url + throwaway key filled in.
- [ ] one end-to-end trial: `sign` a test id, open the link on a fresh
      browser profile, see `dyad · filed on this device.`, open the dyad,
      reload, still open; open `?paid=t5` on another fresh profile, see
      nothing granted
- [ ] a per-sale delivery routine the operator can actually keep up with
- [ ] L48 cross-model audit artifact filed against the PR
