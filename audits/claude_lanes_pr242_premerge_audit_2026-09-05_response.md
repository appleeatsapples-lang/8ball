# PR #242 pre-merge cross-model audit — reconciled response

**PR:** 8ball #242 — DOCTRINE v0.81: free complete single sheet + paid dyad —
the signed access token
**Base → head:** `464c400` (#240) → `013a0f3` / `605d154` at audit start;
Lane B's findings landed in `970a2c1` while Lane A was still running (a
mid-audit push, recorded rather than hidden — Lane A audited from its own
worktree at `605d154` and was not affected); Lane A's findings and the
record corrections land in the reconciliation commit carrying this
artifact.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review. Each lane
worked in its own git worktree, ran the full suite, the auditor's assurance
suite and the product audit, planted mutants, and live-fired in-container
Chromium against the shipped (unconfigured) build AND a scratch copy with a
throwaway P-256 key and a test product url. Lane A led with entitlement
correctness, the single-sheet invariant, record accuracy and test quality;
Lane B led with the runtime and the user-facing surface. Neither lane wrote
a fix.

## Lane verdicts

| Lane | Verdict | Findings | Mutants |
|---|---|---|---|
| Lane A | MERGE WITH FIXES | 2 HIGH, 4 MED, 6 LOW | 34 planted, 26 killed, 8 survived (1 equivalent) |
| Lane B | MERGE WITH FIXES | 0 HIGH, 2 MED, 2 LOW | 8 planted, 7 killed, 1 survived |

**Reconciled outcome: MERGE WITH FIXES — all fixes landed. The security core
held under both lanes: no unsigned, forged, replayed-legacy, hand-written,
wrong-key, wrong-product or malformed input reaches `t5` or renders the
dyad, every mutant that would have was killed, the single sheet is provably
not re-locked, and privacy holds. What the lanes found was about what the
build SAYS and what the launch DOES, plus four tests that could not fail.
Final call remains with the controller per §10/L48; this artifact claims no
merge authority.**

## What held (both lanes, independently)

- **Entitlement.** Strict base64url; try-wrapped JSON; version, product,
  id and `iat` shape checks; junk key entries and a smuggled private `d`
  ignored; explicit `subtle: null` honoured as "no crypto"; throwing
  `importKey`/`verify` fail closed; four distinct failure reasons; nothing
  throws. The flag is write-once-true within a session; 1000 render-time
  resolutions touch storage zero times; a re-opened link on an entitled
  device writes nothing.
- **The single sheet.** Lane A rendered the same profile at `t3` and at a
  forced `t5` and diffed `#result`: the only byte difference in 13.8 KB of
  markup is the `hidden` attribute on the entry control.
  `tierDensitySummary('t3').sealed === 0`; the "sealed at this device tier"
  strings in readings/meanings/public are unreachable because concordance
  receives `getRenderTier()`.
- **Privacy.** One new key, in `ui/payments.js` only; `ui/dyad.js` and
  `core/entitlement.js` name none; no `fetch`; zero cross-origin requests in
  every live-fire scenario including one with a live Buy Link configured
  (an `href`, never fetched); `Referrer-Policy` already prevents a token
  leaking in a Referer before the strip. Person B: both lanes rendered a
  real pair and found nothing of B in storage afterwards.
- **Boot ordering, live.** `await resolveDyadEntitlement` precedes the
  baseline prime, the profile load and the first render. Shipped build:
  `?paid=t5` stripped, nothing granted; a foreign-key `?dyad=` link
  rejected with the banner and nothing stored. Configured scratch build:
  signed link → filed banner, token stored verbatim, entry visible, offer
  hidden with the href removed; reload → still entitled; blocked storage →
  entitled for the visit, url kept, storage banner; Web Crypto removed →
  free sheet renders, zero errors, stored token left in place.
- **L17.** Word-diffing DOCTRINE.md across the change removes exactly one
  token — the footer's `**doctrine version, prior:**` rotation. Every
  supersession is an appended marker.
- **Baselines reproduced:** 62 files / 2184 tests, assurance 126 OK,
  product audit PASS 0 blocking, `index.html` 681 lines, counts core 15 ·
  ui 14 · tests 62.

## Findings and dispositions

### HIGH-1 (Lane A) — the unconfigured build withdrew the dyad from everyone while advertising a checkout that was not on the page

`main` at v0.71 renders the dyad for every device. This PR ships both
constants empty, so on merge the dyad closes for every current visitor —
correct per the controller's model — but the about modal (static markup)
and README (served on the production origin) said "$3 once … checkout is
on gumroad" with no offer control anywhere on the page. A price and a
processor named on a page that cannot honour them is the one commerce
claim a product must not make.

**Fixed:** the about modal follows the offer's own predicate. The static
markup ships a **closed** paragraph visible (the dyad "is the one part of
8ball that is not free, and it is not on sale on this build" — no price, no
processor) and the **open** paragraph ($3 · Gumroad · the access link)
`hidden`; `ui/dyad.js syncDyadAboutCopy(url)` swaps them at init only when
`DYAD_PRODUCT_URL` is non-empty. README rewritten to say what a build does
until the launch steps are done. Pinned: the static state, the swap in both
directions, the price and processor confined to the open paragraph, and
the init call. Lane A's alternative — merge only after steps 1–2 so the
open paragraph and the offer land on the same deploy that closes the free
dyad — is a sequencing choice for the controller and is written into the
launch doc. Lane A's third option (keep `t5` for everyone while
unconfigured) was not taken: it contradicts the controller's order that
the dyad is gated.

### HIGH-2 (Lane A) — the launch checklist asserted `npm test` stays green with the constants filled; it did not

Performing the amendment's own steps 1 and 2 turned five tests red, four of
them undeclared "not launched yet" tripwires and one a wrong expectation
(the CLI exit code for a foreign-key token was expected to be 0 once a key
is configured — it is correctly 2). The launch doc told the operator to
expect green; the first thing the launch would have produced was a red
`test` check with no explanation, in a repo whose CLAUDE.md warns that red
is advisory-but-binding by convention.

**Fixed:** every state pin now states the contract of the state the build
is actually in (`CONFIGURED = DYAD_PRODUCT_URL !== ''` in
`tests/dyad_entitlement.test.js`; the same in `tests/dyad_surface.test.js`),
the two constants are pinned to move together, the CLI pin expects exit 2
unconditionally with the reason matching the state, and the claim was
**proven rather than asserted**: 2192 green with the constants empty, 2192
green with a test url and a throwaway public key filled in, then restored.
The checklist line now says what the operator will see.

### MED-1 (Lane A) — the "person B is never persisted" test never rendered person B

`open()` blanks the seeded entry, so `submitSecond()` failed validation on
every iteration; the storage assertion proved only that a failed submit
writes nothing (the file's own `entryFor` helper existed for exactly this
and was used in the sibling test). The behaviour was correct — both lanes'
live-fire drove a real render and found nothing of B in storage — the test
was the defect. **Fixed:** the loop re-seeds, asserts `submitSecond()` is
`true`, asserts B's head is filled, then blanked on close.

### MED-2 (Lane A) — nothing constrained the sale id, so an operator slip could sign an email into a permanent link

`signDyadToken({ id: 'alice.smith@example.com' })` signed and verified; the
payload is base64url, not encryption, so the email would sit readably in
the access link and in a storage key nothing ever deletes — contradicting
the doctrine's "nothing about the person" and the test title "refuses a
personal-looking id", which tested only `''` and 65 chars. **Fixed:** the
id shape `[A-Za-z0-9_+/=-]{1,64}` is enforced on BOTH sides (`isSaleId` in
`signDyadToken` and `parseDyadToken`); an email, a name, a sentence and a
dated string are refused by the signer and read as malformed by the
verifier even when signed by other means; Gumroad's own hex and url-safe
base64 shapes pass. Doctrine and the launch doc state the shape.

### MED-3 (Lane A) — forget-device leaves the entitlement token behind and the modal copy implied totality

By design (a purchase is permanent) the forget flow does not erase
`eight_ball_dyad_entitlement_v1`, but "erase the paperwork … no paperwork
exists elsewhere" did not say so. **Fixed in copy:** "a filed dyad access
stays on this device — it is a purchase, not paperwork", pinned. Lane A's
further ask — an explicit "release dyad access on this device" control for
shared devices — is **named as open work in the doctrine clause, not
shipped**: it is a new control with its own copy and tests, and with MED-2
fixed the token carries no personal data.

### MED-4 (Lane A) — the never-downgrade invariant had no test that could fail

Two planted downgrades (`_dyadEntitled = false` after a failed return
verify; after a failed stored verify) survived the suite, because the
existing tests either held a valid stored token that immediately
re-granted or asserted only the outcome fields, and the module is a
singleton. **Fixed:** a `vi.resetModules()` fresh-module test earns `t5`,
replaces the stored token with garbage, fails both verify paths and the
three environment failures, and asserts `isDyadEntitled()` — not
`outcome.granted` — stays true throughout. Both mutants now die.

### MED-1 (Lane B) — an entitled device opening a bad link was told its purchase failed

A tampered or stale link on a device holding a valid stored token left the
device fully entitled but bannered the bare rejection. **Fixed:** a fourth
message — "that access link did not verify. the dyad is already filed on
this device." — chosen whenever the device is entitled from storage; the
boot wiring is pinned.

### MED-2 (Lane B) — the offer copy phrased a manual step as automatic

"the access link is sent to that email" read as a system guarantee; the
launch doc's own step 3 says delivery is the operator's hand. **Fixed:**
"after purchase the operator sends an access link to that email" in the
offer note and the about modal, pinned in both.

### LOW (all landed)

- **Lane A LOW-1** — the `?sent=1` handler ran at module top level and
  stripped the whole query before boot read it, so `?sent=1&dyad=<token>`
  yielded no entitlement and no banner. The url is now captured once
  (`bootSearch`) before any handler; boot never reads `location.search`.
  Pinned, including in `tests/feedback_surface.test.js`.
- **Lane A LOW-2** — the keep-for-retry branch left `?paid=` beside the
  token; it now rewrites the url to exactly `?dyad=<token>`. Pinned.
- **Lane A LOW-3** — the disclosure note measured 4.13:1 on the dark
  ground (under AA); opacity raised to 0.85. The dead `hint` class
  replaced by the module's own.
- **Lane A LOW-4** — the offer anchor carries `aria-describedby` to its
  disclosure note.
- **Lane A LOW-5** — "ten assurance mutants" was nine plus one conforming
  case, and one of them asserted status only; corrected in the clause,
  the §7 extension, the footer, the changelog and the journal, and the
  mutant now asserts the probe's message. "The about copy names the free
  sheet and the paid dyad and nothing in between" overstated (the
  prior-buyers sentence says "rung"); reworded.
- **Lane A LOW-6** — defence-in-depth without coverage: the token length
  cap and the 64-byte signature check are pinned against a verifier that
  says yes to anything; `submitSecond`'s own gate is pinned as refusing
  before validation or build (the `buildSecond` hook is never called below
  `t5`). The `render()` gate remains covered only by the composite tests —
  accepted, named.
- **Lane A M25/M28** — the keep-url branch and the no-href-at-injection
  invariant are now pinned (source pin and harness pin respectively).
- **Lane B L1** — the surviving 63-byte-signature mutant now fails by name.
- **Lane B L2** — `rel="noopener"` on a `target="_self"` anchor dropped.

## Mutant record, reconciled

Lane A: 34 planted, 26 killed at audit; of the 8 survivors, 1 was
equivalent, 5 are now killed by pins added in reconciliation (both
downgrade mutants, the token-length cap, the signature-length check, the
`submitSecond` gate), and 2 remain accepted and named (the `render()` gate
in isolation; the href-while-hidden injection, now pinned at the harness
level). Lane B: 8 planted, 7 killed at audit, the eighth killed in
reconciliation. Every mutant that would have granted `t5` to an unentitled
device or removed a purchase was killed at audit time by both lanes.

## Final state

Suite **62 files / 2192 tests green** in both build states; assurance
**126 OK**; product audit **PASS, 0 blocking**; `index.html` under the
budget. The security boundary is unchanged and stated: a valid token is a
bearer credential; there is no server. **Not production-ready as a store**
until the controller's three launch steps are done — and the served page
now says so itself while unconfigured.
