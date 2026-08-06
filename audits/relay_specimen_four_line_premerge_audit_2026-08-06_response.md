# Cross-model pre-merge audit — `claude/specimen-four-line-symbolic`

**Branch:** `claude/specimen-four-line-symbolic` @ `748c1f7` (16 commits, 39 files, +2257/−1554 vs `origin/main`)
**Date:** 2026-08-06
**Run of record:** `~/ai-relay/runs/20260806-042710-8ball` (5,375 diff lines, 384,565B context)
**Requested lanes:** codex + grok, reconciled by claude.

## Lane outcome — read this before the verdict

**This run delivered ONE reviewer, not three.** Recorded plainly because a
partial audit that reads like a full one is worse than no audit.

- **grok — COMPLETED.** Full adversarial review, verdict + six ranked
  findings. This is the entire evidentiary basis below.
- **codex — FAILED.** Its response file is the echoed prompt and diff,
  terminating in `ERROR codex_core::tools::router: error=timeout_ms must
  be at least 10000`. It produced no verdict and no findings. The
  "verdict" strings that appear inside `responses/codex.md` are diff
  content (this repo's own prior audit artifacts) being quoted back, not
  codex's opinion — do not mistake them for a second lane.
- **claude reconciliation — FAILED.** `RECONCILIATION.md` is 0 bytes,
  almost certainly because codex's 1.4MB output exhausted the reconciler's
  context.

**Consequence for L48:** one independent lane cleared this branch. Every
finding below was additionally re-verified by the implementer against the
files before absorption, but that is self-verification and does not
substitute for a second lane. **A codex (or other second-lane) read
remains outstanding.**

## Verdict (grok)

**MERGE WITH FIXES** — "No sealed-value leak, entitlement bypass, or
moon/ΔT correctness bug found. Ship-blocking risk is false orientation
claims + one test that no longer asserts anything, not runtime security."

All six findings were absorbed; see below.

## Findings — all six confirmed and fixed

1. **MEDIUM — `tests/dyad_surface.test.js`, a tautological pin.** The
   rewritten "fold changes no sheet cell" assertion read
   `expect(cellRenderState(A, key, entitled)).toEqual(cellRenderState(A, key, entitled))`
   — the same value compared with itself. It could never fail, so the
   suite would stay green if a compartment's entitlement silently moved.
   **This is the implementer's own defect, and it repeats a failure mode
   this repo has already recorded** (PR #187 F7.1 caught the identical
   self-comparison on `newlyEntitledCells`). **FIXED:** the assertion now
   pins the real property — at t3 every compartment is entitled and none
   is sealed, no compartment is keyed to the `dyadRelation` block — plus a
   discriminating counter-case (an unentitled render of the same cell IS
   sealed with `textContent === ''`), so the test fails if the property
   breaks in either direction.

2. **MEDIUM — `8BALL.md:77`, a half-edited ladder.** The row's header was
   updated to "three-rung entitlement ladder (§1.D as amended through
   v0.68)" while its body still listed `t5 = + a second complete sheet` as
   a live rung, omitted moon from t1, and omitted both the public read and
   the comparative from t3. A header and body that disagree are worse than
   either being uniformly stale. **FIXED:** t1 names moon, t3 names the
   public read and the comparative, and t5 is stated as retired into t3
   with the not-a-downgrade reasoning.

3. **MEDIUM — `ui/dyad.js` (+ `core/dyad.js`, `ui/sheet.js`,
   `ui/tiers.js`, `ui/payments.js`) still say "below t5" / "tier t5".**
   Runtime is correct — `dyadEntitled` resolves through
   `coordsForTier(tier).has('dyadRelation')`, which is t3 — but the
   headers and JSDoc describe the retired threshold. grok named the risk
   precisely: "next edit can 'restore' a t5 check and re-break F2."
   **FIXED:** 12 comment sites in `ui/dyad.js` plus four sibling modules
   now describe the entitled rung.

4. **LOW — `ui/profile.js:86`, `ui/readings.js:33` claim gender is
   calc-driving.** Both said gender must be forwarded/archived "because
   the kua block reads profile.gender". The kua block was deleted at
   §1.D v0.67; those comments assert a purpose the field no longer has —
   the exact error the operator's instruction forbids. **FIXED:** both now
   state the field is forwarded because it is user-entered and persisted,
   explicitly noting it has NO reader and drives no coordinate. No new
   purpose invented, no privacy claim added.

5. **LOW — `core/payments.js:220`, `@returns` still advertises `'t5'`.**
   A prior fix corrected `tierRank`'s docstring but missed this second
   `@returns` (different format), so the function still documented a
   return value it can never produce post-normalization. **FIXED.**

6. **NIT — `ui/share.js:50-51,72` say "8 rows".** The §5.D layout is
   driven by `SHARE_ROWS.length` (four since §1.L), not a fixed count; the
   functional seal path is correct. **FIXED:** comments now describe the
   count as derived.

## What grok checked and passed (no finding)

- **Moon / ΔT:** 59 Table 47.A terms, E-scaling, A1/A2, Espenak–Meeus ΔT
  1900–2100 with clamp, UT→TT applied before the ch.47 evaluation, cusp
  flip pinned. Explicitly judged "complete, not decorative."
- **Kua deletion:** no runtime import or module left; gender inert and
  disclosed; person-B gender input removed.
- **Sheet / share / a11y:** per-cell seal ⇒ `textContent === ''`; meanings
  refuse sealed cells; the a11y accessible name is label+value only (no
  sealed value reaches the accessibility tree); ATLAS covers all 15 cells;
  share forces sealed values to `''`.
- **t5 → t3 fold:** `RETIRED_TIERS` correct, successor is a superset, F2
  gates rewritten rather than weakened, `getRenderTier` migrates storage.

## Verification after absorption

- vitest **54 files / 1904 tests green**
- `audits/project_audit.py` **PASS 13 / 0 fail / 1 warn / 0 skip**
- local PII audit **clean, 854 files**
- `index.html` **1466/1500**
- `git diff --check` clean; residual scan for `below t5` / `tier t5` /
  `calc-driving` across `ui/` and `core/` returns nothing.

## Process

STAGED. No push, no PR opened or modified, no merge, no deploy, no
storefront mutation, and no sibling repository touched. Merge remains
the operator's word — and
per the lane outcome above, a second independent lane has NOT yet read
this branch.

---

# ADDENDUM — the second lane, obtained (same day)

**Scope reviewed:** the specimen-only delta `a463a27...fe946fb`
(36 files, +1371/−1637) — the work carried by this branch beyond the two
already-audited PRs it merges.
**Lane:** codex, four bounded runs.
**Status of the L48 gap this artifact opened: CLOSED.**

## Why the earlier codex runs failed — the recorded cause was wrong

The lane outcome above, and the handoff derived from it, attributed the
two failures to oversized relay input (~5,000 diff lines) and prescribed
splitting by commit. **That diagnosis does not survive testing.** A
control run on the smallest commit on the branch — `ee72770`, 163 diff
lines, a 10KB context — reproduced the failure exactly: `codex exec`
explores the repository and echoes whole files to stdout, so the
response file grew past 340KB with no verdict in it. Size was a
correlate, not the cause.

**The actual cause is that the response captured is the agent's whole
transcript, not its answer.** `codex exec` accepts
`-o/--output-last-message <FILE>`, which writes only the final message.
Adding that, plus an instruction that the diff is the complete corpus and
that no file is to be opened, produced a clean sub-400-word verdict on
every run. This is a property of the adapter, not of this branch, and it
will recur on any branch until the relay's codex adapter passes `-o`.

## Lane design, and the mistake in it

Four runs. Three were path-scoped by subsystem (surface · engine ·
tests+doctrine); the fourth reviewed the whole code corpus at once
(~1,100 lines) after the first three came back.

**The path-scoping was a mistake and is recorded as one.** A lane that
cannot see `ui/tiers.js` reports that `dyadRelation` is missing from t3;
a lane that cannot see `ui/profile.js` reports that the gender control
was deleted; a lane that cannot see `index.html` reports that the kua
imports were never removed. All three arrived as blockers. **Six of the
fourteen findings were artifacts of the corpus boundary rather than
defects in the code** — which is why the fourth, whole-corpus run was
added rather than the three scoped verdicts being taken at face value.
Every finding below was checked against the files before absorption.

## Verdicts

| lane | corpus | verdict |
|---|---|---|
| surface | index.html, ui/{sheet,tiers,meanings,share,readings,profile}.js, experience.css | DO NOT MERGE |
| engine | core/, content/, ui/{dyad,payments,kua}.js | DO NOT MERGE |
| tests+doctrine | tests/, DOCTRINE.md, 8BALL.md, CLAUDE.md | MERGE WITH FIXES |
| wiring (corrected) | index.html, core/, content/, ui/, DOCTRINE.md | DO NOT MERGE |

The two `DO NOT MERGE` verdicts from the scoped lanes rest on findings
that verification refuted; the corrected whole-corpus lane's verdict
rests on two blockers that are themselves corpus artifacts (it was not
given `tests/`, and reported that the deleted kua suites were never
deleted). **The verdict this addendum records after verification is
MERGE WITH FIXES, all fixes landed.**

## Findings ABSORBED (8, each verified against the files first)

1. **HIGH — `ui/experience.css:195`, a rule with no opening brace.**
   Flagged independently by two lanes. §1.D v0.67 deleted the kua half of
   a two-selector list and left the trailing comma. This does not fail
   locally: CSS error recovery consumes a malformed prelude up to the
   next `{`, so the declarations were absorbed into the selector list and
   the rule that followed, `.card-back .glyph`, was swallowed with them.
   **Two surfaces were dead in production and 1904 tests said nothing**,
   because no test in this repo read a stylesheet.
   **Verified in-browser, both directions:** feeding the engine the
   pre-fix text yields exactly ONE parsed rule (a sentinel placed after
   it); the fixed text yields all three. Post-fix, the live CSSOM carries
   `.card:not(.labels-revealed) .public-title` and `.card-back .glyph`
   with their full declarations. **FIXED**, plus
   `tests/css_structure.test.js` — brace balance, no declaration inside a
   selector prelude, no dangling comma, over both tracked stylesheets —
   which fails on the reintroduced bug (counterfactual run, not assumed).

2. **HIGH — `tests/dyad_surface.test.js`, the comparative test asserted
   almost nothing.** The test titled "t3 renders both sheets and the
   relation" checked person B's head and one B value. Person A's sheet
   and the entire relation layer could vanish while it stayed green —
   and the relation layer is precisely what §1.D v0.68 moved into the $3
   rung. **FIXED:** both heads plus all three relation axes
   (`dyad-element-ab`/`-ba`, `dyad-numerology-reduction`/`-meaning`,
   `dyad-cardpair-body`) asserted by name.

3. **HIGH — the gender field's only contract tests were deleted with the
   kua suite.** `tests/kua.test.js` held the `buildProfile` strict-
   vocabulary test and the non-interference differential. Neither tested
   kua; both test the FIELD, which §1.D v0.67 explicitly RETAINED.
   Deleting by feature ownership removed the protection for the one
   thing deliberately kept. **FIXED:** restored to
   `tests/profile.test.js` and strengthened with a second direction
   (male-vs-female as well as valued-vs-absent — a single comparison
   would still pass if a coordinate keyed off mere presence).

4. **MEDIUM — the gender control's DOM-creation branch was exercised by
   no test.** Every test handed `genderSelect` in directly, which is the
   branch `resolveGenderSelect` returns on its first line; the browser
   path (`form` + `anchor`, no node) ran nowhere. The control could have
   been deleted outright with the suite green. **FIXED:** two tests drive
   the real branch, and it is additionally confirmed rendering in-browser.

5. **MEDIUM — `DOCTRINE.md` §1.F described a census the product does not
   compute.** The clause still read "14 sheet cells plus the catalog
   numeral — base 15" after §1.K made it 15 + 1 = 16; the v0.64 footer
   recorded the move and the clause body never followed. The half-edited
   shape §1.D's ladder row was corrected for earlier in this cycle.
   **FIXED** as an L17 currency amendment (the clause body preserved).
   Live census confirmed in-browser: `5 of 16 coordinates open`.

6. **LOW — `8BALL.md`'s orientation paragraph contradicted its own
   row 9.** Pointed at "§1.D as amended through v0.38", omitted moon from
   t1, and omitted both the public read and the comparative from t3.
   **FIXED.**

7. **LOW — `core/dyad.js:29` pointed readers at `T5_COORDS`**, a constant
   that no longer exists. The grok pass fixed twelve sites in `ui/dyad.js`
   and four sibling modules and missed this one. **FIXED.**

8. **LOW/GOVERNANCE — the deleted `content/kua.v1.js` declared itself
   immutable.** Its §4 header said a change must be a `kua.v2.js`
   carrying the tables unedited. Deleting a file that says that deserves
   stating. **Not a §4 breach** — §4 governs editing a shipped pool in
   place, and this was a withdrawal of the whole surface on the
   controller's word — and **not lost**, since `a463a27:content/kua.v1.js`
   holds it. The lane's proposed remedy (retain it unreferenced) was
   **declined**: a content module with no reader is dead code, and the
   same cycle spent a refinement pass removing exactly that. **FIXED** by
   recording the archival pointer and the reasoning in §1.D v0.67.

## Findings REJECTED (6, with the reason each is wrong)

- **`ui/kua.js` host imports/calls survive the deletion** (engine,
  blocker) — no kua module exists and no host import or call remains;
  only comments mention the deleted block. The lane was not given
  `index.html`.
- **`dyadRelation` still lives in `T5_COORDS`, so t3 buyers cannot open
  the comparative** (engine, high) — `ui/tiers.js:96` carries it in
  `T3_COORDS` and `dyadEntitled` resolves through
  `coordsForTier(tier).has('dyadRelation')`. The lane was not given
  `ui/tiers.js`. **Confirmed in-browser:** a t3 device shows the entry
  control and opens the screen.
- **The gender control was deleted, so users cannot enter or rehydrate
  it** (engine, high) — it was rehomed to `ui/profile.js`. The lane was
  not given that file. **Confirmed in-browser:** the control renders with
  its label, its three options and its note.
- **`tierRank`/`maxTier` can downgrade a device holding a retired token**
  (engine, medium) — all three call sites normalize first
  (`core/payments.js:290`, `ui/payments.js:139`, `:144`), and the
  behaviour is documented at length in the function's own JSDoc. No live
  defect; hardening it would change documented semantics for no gain.
- **A stored `t5` falls through to `free`, revoking paid coordinates**
  (surface, blocker) — every tier source in `index.html` is
  `getRenderTier()`, which runs `normalizeTier` and persists the rewrite,
  so `coordsForTier` never receives a raw `t5`. The lane was not given
  `core/payments.js`.
- **`typeof document.createElement` throws when `document` is undefined**
  (surface + wiring, medium) — `ui/meanings.js` already dereferences a
  global `document` unguarded at line 108, long before line 321, so the
  module's precondition is module-wide and pre-existing. The guard at
  that line is about the CELL mock, not the global. Not introduced here;
  changing it would be churn.

Also rejected: **the screen-reader label makes a sealed cell's
`textContent` non-empty** (wiring, high). The purity contract is about
the withheld VALUE, and the assertions target the value node — the
`sr-only` span carries a coordinate LABEL, a public static string, and
sits on the cell root. No sealed value reaches the DOM or the
accessibility tree.

## Verification after absorption

- vitest **56 files / 1936 tests green** (1904 → 1936: +32, of which the
  css-structure suite is 7 and the measurement suite 21)
- `audits/project_audit.py` **PASS 13 / 0 fail / 1 warn / 0 skip**
- local PII audit **clean, 860 files**
- `index.html` **1474/1500**
- **Browser pass at 320 / 390 / desktop** — no horizontal scroll at any
  width; the offer control, paywall title, body, CTA and disclosure all
  wrap inside their boxes and inside the viewport (measured with
  `Range.getClientRects`, not `scrollWidth`, because `overflow: hidden`
  makes `scrollWidth` report the clipped box); the gender control's tap
  target is 44px at 320. No console errors.

## Process

STAGED. No push, no PR opened or modified, no merge, no deploy, no
storefront mutation, and no sibling repository touched. Merge remains the
controller's word. The L48 second-lane gap this artifact was opened to
record is now closed; what replaces it is a narrower open item — the
relay's codex adapter should pass `-o/--output-last-message`, or every
future codex lane will keep returning transcripts instead of verdicts.

---

# ADDENDUM 2 — the offer/measurement delta, reviewed and absorbed

**Scope reviewed:** `fe946fb..73bac41` — the five commits this cycle added
(offer copy, gender disclosure, measurement contract, artifacts).
**Verdict received:** MERGE WITH FIXES, 7 findings (4×P1, 3×P2).
**Verdict after verification: all 7 CONFIRMED. All 7 absorbed.**

**Nothing was rejected this round**, which is itself worth recording: the
previous addendum rejected 6 of 14 as artifacts of a path-scoped corpus. This
lane was given the whole delta and its hit rate went to 100%. That is the
clearest evidence available that the corpus boundary, not the reviewer, was
the problem — and it retires the "verify everything because half of it is
phantom" posture in favour of "verify everything because that is the rule".

Each finding was verified by an agent required to REPRODUCE or refute it
against the files rather than reason from its description. Three findings had
proposed fixes that were wrong in a way worth recording.

## The two that were real defects in shipped behaviour

**F1 — `ui/dyad.js` recorded `comparative_opened` before the screen opened.**
The record sat after the first entitlement gate but before `_hooks.onOpen()`
and before `open()` — and `open()` carries its OWN gate, returning `false`
without touching the DOM. `currentTier()` was also called twice, so the record
could name a rung the gate never checked. Reproduced by driving the real
listener through a fake DOM: a throwing host hook and a mid-handler tier
change each emitted `{comparative_opened, t3}` with the screen still hidden.
**FIXED:** one tier snapshot, hook, then `if (!open()) return;` before the
record. **Severity honestly low, not P1:** the shipped `onOpen` is a single
`classList` write on a static element and cannot throw; the stored tier is
monotonic with no clearing path; and the sink is null with no collector, so no
number anywhere was ever wrong. Fixed because it is three lines and the
contract is entirely about when a thing is counted.

**F3 — `tests/css_structure.test.js` was blind to the shape it was written
for.** Its `preludes()` scan reset at every `}` without examining what it had
accumulated, so a malformed rule that is the LAST rule in a block was never
handed to any check. The lane's counterexample —
`@media(max-width:480px){.victim, height:0;}` — passed brace balance, the
declaration-leak check and the dangling-comma check, while a real CSS engine
dropped `.victim` entirely. **This is the same class as the bug the file was
created to catch, one nesting level down.** FIXED with a block-aware scan that
tracks whether each open block holds rules or declarations, plus the assertion
the heuristics could not express: *text in a rule position that no `{` opens*.
**21 fixtures added** — 7 malformed shapes it must catch, 14 legal ones it must
not flag (`:has()` chains, `rgba()` commas, `grid-template-areas`,
`@keyframes`, a brace inside a string). A checker that only reports green on
good input proves nothing about itself.

## The one that was a claim this repo had just finished making

**F2 — three of four call-site tests matched SOURCE TEXT while the file header
and DOCTRINE §5 v0.70 both said all four were driven against real functions.**
One of those string matches was pinning the exact call ordering F1 proves
wrong — a test asserting the defect. FIXED by driving three of them with
harnesses that already existed (`tests/dyad_surface.test.js` `harness()`;
`tests/share_behavior.test.js`, which already boots the real `onShare()` end to
end), covering the refusal paths as well as the happy ones. The dyad drive was
counterfactually checked: reintroducing F1 reds two of the new tests.

`reading_completed` **cannot** be driven — `renderCard` lives inside
`index.html`'s single inline module and nothing in `tests/` evaluates it.
Extracting it would refactor the §6 single-file posture for a call site nobody
disputes, so it stays a source pin, is **labelled** one, and both overclaiming
sentences were corrected. Claiming behavioural coverage one does not have is
the same defect as the false greens this cycle spent its time deleting.

## The four documentation/precision findings

- **F4** — version metadata still read v0.68 with two amendments landed.
  Promoted to v0.70, v0.69 as prior, older entries demoted to superseded with
  bodies byte-identical per L17.
- **F5** — "nothing reads gender" was false. `saveProfile`, `optsFromPayload`,
  `populateRisingFields`, the archive round-trip and `buildProfile` all read
  it; every one is persistence or rehydration, none is a **calculation or
  output reader**. That is the precise form and the precision is load-bearing,
  because the easier sentence is the false one. The differential also only
  compared `buildProfile` OUTPUT, so a reader added downstream would have
  stayed green — a second differential now compares what the profile
  **produces** (`getCard`'s catalog cell, `cellRenderState` over every
  compartment at full entitlement), both directions, with vacuity guards.
- **F6** — the storefront draft overclaimed: "your reading never leaves your
  browser" and "there is no server" are both false, because share deliberately
  exports the sheet and the feedback form posts (§5.B's two permitted
  user-initiated calls). Rewritten to the product's own boundary — *nothing
  leaves on its own* — naming the three things that travel and only when
  pressed. **The name/DOB clause was NOT hedged**: it is unconditionally true
  under §5.D and both §5.B calls, and is the strongest line in the section.
- **F7** — the plan called `reading_completed` "the denominator" and never
  wrote a formula. Three rates added with their tier restrictions, plus what
  the payload makes uncomputable (not a funnel, not per person, not a cohort,
  not attribution). The finding's second half — restate "no collector" — was
  **declined**: it is already stated four times and a fifth is churn.

## Fixes deliberately NOT made, with reasons

- **Extracting `renderCard`** into a `ui/` module to make it testable (F2) —
  a §6 posture refactor for an undisputed call site.
- **A rollback path when `open()` returns false** (F1) — dead code under a
  monotonic tier.
- **Aiming the gender differential at `ui/share.js`** (F5) — that module
  imports nothing and never receives a profile; it serializes DOM refs, so it
  is covered transitively.
- **A fifth restatement of "no collector"** in the plan (F7).

## Verification after absorption

- vitest **56 files / 1970 tests green** (1936 → 1970, +34)
- `audits/project_audit.py` **PASS 13 / 0 / 1 / 0**
- local PII audit **clean, 861 files**
- `index.html` **1474/1500**
- **Browser re-verified**: `comparative_opened` fires with the dyad screen
  actually revealed and the result screen hidden; a refused tap at t1 emits
  nothing and the entry control is absent. No console errors.

STAGED. No push, no PR, no merge, no deploy, no storefront mutation. Merge
remains the controller's word.

---

# ADDENDUM 3 — re-audit of `fc1a2de`: 3 residuals, all real

**Verdict received:** MERGE WITH FIXES, 3 residuals (1×P1, 2×P2). PASS on
runtime event ordering, share paths, the CSS counterexample, doctrine v0.70
lineage and the Gumroad privacy copy.
**After verification: all 3 CONFIRMED, all 3 absorbed.**

**Two of the three were defects in the fixes from the previous round.** That is
the part worth recording: absorbing an audit finding is itself a change that
can be wrong, and twice here it was wrong in exactly the way the finding it was
fixing had been.

## R1 — the fix for a tautological test was itself tautological

The driven open-assertion added last round read
`expect(h.byId.get('dyad-screen') || h.root).toBeTruthy()`. `h.root` is a
pre-created harness node, so this can never fail.

**Proven, not argued:** deleting `_root.classList.remove('hidden')` from
`ui/dyad.js` — the single line that actually reveals the screen — left **all 72
tests in that file green**. The record fired, the screen stayed hidden, and
nothing noticed.

This is the **third** instance of the self-comparison / vacuous-assertion class
in this repo's record (PR #187 F7.1, the grok finding on `cellRenderState`, and
now this), and it was written **in the commit whose message describes fixing
tautological assertions**. Recorded plainly rather than as a routine absorb.

**FIXED:** asserts `h.byId.get('dyad-screen')` IS the module's `_root` and that
the root lost `hidden`. Counterfactual re-run: deleting the reveal now reds the
test.

## R2 — the gender differential was blind twice over

**(a) Coverage.** It compared only `getCard` and the sheet cells. The written
card entry, the note anchor, the public read, the dyad relation, the
concordance axes, the share artifact and the meanings drawer were all absent —
and every one is reachable from a pure export, so the omission was not forced
by §12.

**(b) A dead fixture.** It supplied `{ time: '08:30' }` with no tz/lat/lng.
`buildProfile` gates rising AND moon on `time && lat && lng` plus a resolvable
tz, so **both coordinates were `undefined` in all three variants** and their
compartments compared `—` to `—`. The existing vacuity guard did not catch it,
because 13 of 15 cells still resolved.

**The live counterexample settles it.** With a real gender reader patched onto
the rising path, the shipped suite reported **3 passed, 0 failed** — fully
blind. The replacement reports 4 failed.

**FIXED:** a full fixture (`time` + `tz` + `lat` + `lng`, which resolves rising
to `leo` and moon to `pisces`), a second and DIFFERENT partner profile so the
pair surfaces are not identity cases, and the differential run over **every
output surface a pure function can reach** — sheet, catalog, written entry
across all three note slots, note anchor, public read, dyad relation in both
positions, concordance axes, share rows + SVG + caption, meanings drawer. Each
row carries a probe asserting the surface produced real content, and an
anti-vacuity test fails FIRST with "rising must RESOLVE — fixture needs
tz+lat+lng" if the fixture is ever thinned.

Two further points the repair had to face honestly:

- **The archive is the ONE deliberate carrier.** `ui/readings.js` stores gender
  by design (§5.E — a reopened reading must reproduce the user's own input), so
  that surface asserts the token survives and everything else in the record is
  identical, rather than demanding equality.
- **A reader added inside `index.html`'s inline `renderCard` reaches no pure
  function**, so a runtime differential cannot see it. Covered by a static scan
  instead — the same honest substitution `reading_completed` already uses.

**Verified by mutation battery**, each reverted, tree clean after: a reader in
`cellRenderState` → 4 failures; in `getCard` → 4; in `formatPublicRead` → 1; in
`formatDyadRelation` → 1; on the rising path → 4; inside `renderCard` → 1 (the
static scan); fixture thinned → 5, naming the fixture first. I re-ran the
`cellRenderState` mutation independently: 4 failed, 188 passed.

**(c) The wording.** "No surface reads it" survived in current text at
`index.html`'s about modal and two doctrine sentences. It is false even on the
narrow reading of *surface* as a rendered one — `populateRisingFields` writes
the persisted value back into the visible control on every rehydration, which
is precisely why a stale gender could once survive a form reset. **Two
canonical forms from here on:** "no calculation or output reader" in doctrine
and comments, "does not affect your reading" in user copy. The about modal and
the control now make one claim, in the same words, and it is the claim the
differentials pin. §1.D v0.67's imprecise phrasing was superseded through the
v0.69 amendment rather than edited in place — L17, and PR #190 already blocked
an in-place "correction" once for violating the rule it was written to serve.

## R3 — the plan claimed a measurement the four events cannot make

`paid_t3_cta_clicked / reading_completed` was named "offer tap rate" and the
events table said it "separates 'nobody sees the offer' from 'everybody sees it
and declines'". **It cannot.** Three uncounted steps sit between the two
counted ones: the lock icon and offer control emit nothing and being in the DOM
is not being in a viewport; `stagePurchase` can refuse to open the modal at all
if storage is blocked; and only then does the CTA exist to tap. A render with
no tap is equally consistent with never noticed, storage blocked, opened and
dismissed, or read in full and refused — and **no combination of the four
events can separate them**, because none fires when the paywall opens.

**FIXED** by renaming the METRIC to "checkout-start rate per unentitled render"
and stating the limitation, in the plan and in DOCTRINE §5 v0.70. The EVENT
name is unchanged — it is load-bearing in `MEASUREMENT_EVENTS` and three test
files. **No fifth event was added:** an offer-exposure event is what would
close this, and that is a doctrine amendment, not an edit.

Also corrected: the plan said the counts were "structurally zero". They are
**unobserved**, not zero. Zero would be a finding about the world; under a null
sink nothing accumulates and no counter exists, so every rate is undefined
rather than 0.

## Verification after absorption

- vitest **56 files / 1983 tests green** (1970 → 1983)
- `audits/project_audit.py` **PASS 13 / 0 / 1 / 0**
- local PII audit **clean, 861 files** · `index.html` **1474/1500**
- Browser: the about modal and the gender control now carry the same claim in
  the same words; no console errors.

STAGED. No push, no PR, no merge, no deploy, no storefront mutation.

---

# ADDENDUM 4 — final re-audit of `60366cf`: 3 findings, all real

**Verdict received:** MERGE WITH FIXES. PASS on current runtime and copy, the
full gender fixture and pure-surface matrix, the dyad hidden-state assertion,
the exposure/refusal limitation, and "unobserved, not zero".
**After verification: all 3 CONFIRMED, all 3 absorbed.**

**ERRATUM, and it governs how the rest of this file must be read.** Addendum 3
above describes §1.D v0.67 being superseded through the v0.69 amendment. It does
**not** disclose that the same commit, `60366cf`, **rewrote the already-locked
v0.69 amendment, the v0.70 four-events clause, and both footer entries in
place.** That is an L17 breach (DOCTRINE.md:693 — amendments supersede, never
edit; historical clause text and prior footer entries preserved verbatim), and
it is compounded twice over: the same commit applied supersession correctly to
the older clause, and its own text cites the PR #190 precedent for not doing
what it then did. Addendum 3 is therefore **incomplete as written**. It is left
standing and corrected here rather than edited, because rewriting a record to
fix a record about rewriting is the same error one level up.

## F1 — the L17 breach [P1]

**CONFIRMED by diff.** `git diff 76e84cf 60366cf -- DOCTRINE.md` shows five
substantive rewrites of locked text: the v0.69 gender-field amendment, v0.69's
"open question" paragraph, the §5 v0.70 "four events" clause, the v0.70 footer
entry and the v0.69 footer entry.

**ABSORBED as prescribed.** All five restored **byte-for-byte** from `76e84cf`
(verified programmatically, not by eye — each restored block compared string-
equal to its `76e84cf` original). The two footer entries keep their bodies
verbatim and change only their labels, which is the mechanism this document
already uses when a version is demoted. The substance is re-expressed as a new
dated **§5 v0.71 amendment**, with a new `**doctrine version:** v0.71` footer
entry and a `- v0.71:` changelog bullet; **v0.70 becomes prior**, v0.69 becomes
superseded.

The v0.71 amendment records the breach itself rather than quietly carrying the
corrections, because a reader comparing `76e84cf` to `HEAD` would otherwise see
locked text move with no explanation.

## F2 — the metric's asymmetric filter [P2]

**CONFIRMED.** The ratio filtered only its denominator
(`count(paid_t3_cta_clicked) / count(reading_completed where tier in {free,t1,t2})`),
counting t3 taps in the numerator that the denominator deliberately excluded —
two halves describing different populations, while the surrounding prose argued
t3 taps are ineligible. The label "how often does an unentitled render **end
in** a hand-off" also asserted per-render attribution that the plan's own *Not a
funnel* bullet denies.

**ABSORBED:** renamed to **checkout-click intensity per unentitled render**,
both sides filtered to `{free, t1, t2}`, and an explicit paragraph stating it is
an intensity rather than a per-render probability — the two counts are
independent totals sharing a window, so their quotient is a ratio, not a
conversion. The doctrine correction rides the **v0.71** amendment; v0.70 was not
touched.

## F3 — the static render guard missed destructuring [P2]

**CONFIRMED by counterexample, run twice.** The guard matched only `.gender` and
`['gender']`. Injecting the auditor's exact case into `renderCard` —

```js
const { gender } = profile;
cardName.textContent = gender === 'female' ? 'f-' + cell.name : cell.name;
```

— changes what the card visibly displays and left **all 192 tests green**. The
pure-function matrix cannot reach it either, because `renderCard` lives in
`index.html`'s inline module and no harness executes it.

**ABSORBED:** the guard now brace-matches `renderCard`'s body out of
`index.html`, strips comments and string literals, and rejects the **identifier**
`gender` in any form — property, computed, destructured, shorthand or bare.
`getGenderInput` is excluded by word boundary; the submit handler is out of
scope because the extraction is scoped to `renderCard` alone. A **discriminating
counter-case** ships with it: it applies the mutation, asserts the new guard
fires, and asserts the old property-only pattern would not have — so the guard
cannot later be satisfied by a matcher that matches nothing. Re-run with the
mutation injected: **2 failed**, where before it was 0.

## Verification after absorption

- vitest **56 files / 1985 tests green** (1983 → 1985)
- `audits/project_audit.py` **PASS 14/0/0/0** on a clean tree
  (`product.git_status` warns only while changes are uncommitted)
- local PII audit **clean, 861 files** · `index.html` **1474/1500**
- DOCTRINE now at **v0.71**; v0.70 prior; v0.69 superseded; all three bodies
  byte-identical to their locked originals.

STAGED. No push, no PR, no merge, no deploy, no storefront mutation. Merge
remains the controller's word.

---

# ADDENDUM 5 — re-audit of `6c98f9d`: one P2, and a red-team behind it

**Verdict received:** MERGE WITH FIXES, 1 P2 test-surface residual. Doctrine/L17
and KPI lanes PASS.
**After verification: CONFIRMED, absorbed — and an adversarial pass found three
more holes of the same class, all closed.**

## The finding, reproduced exactly

The widened `renderCard` gender guard still had false negatives, both from
getting an ORDER wrong:

- **The matcher stripped string literals before matching**, so
  `profile["gender"]` became `profile[""]`. Reproduced: that reader, and the
  template-interpolation form, each returned `tokens: []` while changing what
  the card displays.
- **The extractor brace-matched before stripping comments**, so a `// }}}}`
  prefix truncated the extracted body from **3348 characters to 4**.

## What a red-team then found — three more, same class

Not asked for by the audit; run because a guard that has now failed twice
deserves an adversary rather than another careful re-read.

1. **`getGenderInput()` called inside `renderCard`.** The accessor reads the
   live form control and changes the card **while naming no property at all**,
   and `\bgender\b` could not see its name. **This is ordinary code a
   maintainer could write by accident** — the most important of the three, and
   the reason the matcher is now boundary-free.
2. **A reader in a sibling helper of the same inline module.** The guard read
   only `renderCard`, so any other function in the host was unscanned.
3. **A destructured read in `ui/result.js`.** The separate `core/`+`ui/` scan
   still used the property-only regex — **the same defect I had just repaired
   in the host, left standing one directory over.** That is the half-applied-
   rule pattern this cycle keeps producing, and it is why the two scans now
   share one function.

## The repair

Lexical, in a new `tests/helpers/js-lex.js`: one pass classifies every
character CODE / COMMENT / STRING with template `${...}` interpolations
classified as code. Braces are counted only where they are code; the function
signature is located only in code (a comment quoting it had hijacked the
extraction to an unrelated block); the identifier scan drops comment text and
**keeps string text**, because a computed property key lives in a literal —
which is precisely what stripping literals destroyed.

The primary guard is now **module-wide**, not function-scoped: exactly two
lines of the inline module may touch the identifier, the accessor's import and
its single call at the submit seam. The `core/`+`ui/` scan uses the same
function, so the two cannot drift apart again.

## What it guarantees — stated exactly, because this record has overclaimed three times

Every **spelled** read fails the suite, wherever it sits: property, computed
with any quote style, destructured, aliased, template-interpolated, or through
the accessor.

**It does not stop an adversary.** The red-team still got past it with a
runtime-built key (`profile['gen' + 'der']`), a Unicode escape inside the
property name, and a `JSON.stringify(profile).includes('"female"')` sniff. Each
executes and changes the card; none writes the identifier. No lexical check
closes that class — only executing `renderCard` would, and §6 keeps it in the
inline module while §12 forbids jsdom. **The runtime differential over the pure
surfaces is the real guarantee; this is the fence around what it cannot reach.**

It **fails closed** by design. Prospective false positives were confirmed —
user-visible copy, an aria-label, a CSS class or a data attribute carrying the
word would all trip it; none exists today. The remedy when one is wanted is to
add it to the pinned lines, a reviewed act, never to loosen the matcher.

## L17, this time

The corrections are a **new §5 v0.72 amendment**. v0.71 item (4)'s claim that
the guard "rejects the identifier in any form" was false and is superseded
there, not edited. v0.71 and v0.70 footer bodies were verified **byte-identical**
to `6c98f9d` after only their labels were demoted — checked programmatically,
and the whole-file diff contains no removal beyond those two label lines.

## Verification

- Every bypass above re-run against the repaired guard: each now fails the
  suite. The two structural ones (sibling helper, `ui/result.js`) verified by
  live mutation and restore.
- vitest **56 files / 1999 tests green** (1985 → 1999)
- `audits/project_audit.py` **PASS 14/0/0/0** on a clean tree
- local PII audit **clean, 862 files** · `index.html` **1474/1500**

STAGED. No push, no PR, no merge, no deploy, no storefront mutation.

---

# ADDENDUM 6 — audit of `69c77ed`: four bounded findings, all real

**Verdict received:** MERGE WITH FIXES — F1/F2/F3 P2, F4 P3. PASS on every
originally reported bypass form, no product-runtime or privacy drift,
v0.71/v0.70 bodies byte-identical, audit and journal additions append-only.
**After verification: all four CONFIRMED, all four absorbed.**

**Three of the four are defects in the repair v0.72 announced**, so v0.72's
guarantee — "every SPELLED read fails the suite, wherever it sits" — **was
false as written**. Corrected additively in §5 v0.73; v0.72 stands unedited.

## F1 — the lexer still swallowed live code

Four sub-forms tested against the real helper. Three were already closed by
the in-flight repair; **one was live and is the one that matters**, because it
fires on ordinary code:

| form | before | after |
|---|---|---|
| `/\//` after a control head | caught | caught |
| `/}/`, `/[}]/`, `/{/` | caught (regex kind) | caught |
| identifier-before-division | correct | correct |
| **`plain / 2 /* } */`** | **body 43, tokens `[]`** | **body 94, tokens found** |

The live one: the regex-start test matched its keyword alternation
**unanchored**, so the `in` inside the identifier `plain` made the following
`/` open a regex. Nobody writes `if (x) /[//]/.test(x)` by accident — but
everybody writes `plain / 2`. **FIXED** by anchoring the keyword half on an
identifier boundary, judging punctuation on the last character only, and
widening the token window so `instanceof` survives.

Also carried in this change (found by the red-team, before this audit landed):
regex characters became their own lexical kind so a `}` in a regex cannot move
a brace counter, and control-head parens are tracked so the `)` of `if (...)`
is distinguished from the `)` of `(a+b)/2`. **Seven counter-cases now pin the
class, plus a division case pinning the other direction** — because a lexer
that is too eager swallows real code just as effectively as one that is too
lax.

## F2 — the guarantee was written broader than the scan reached

The `core/`+`ui/` sweep read only top-level `.js`; the host guard matched only
the **first** `<script type="module">`. A module in a future subdirectory, or a
second inline module, would have carried a reader neither saw. Both are flat
and single today and nothing forbade either.

**FIXED** by doing both things the finding offered rather than choosing:
the sweep recurses, the host guard concatenates every module block, and the
scan now asserts it actually reached its corpus — including that every file on
its own allow-list was visited, so an allow-list entry can no longer point at
a file the scan never opens. The single-inline-module count is pinned
separately as a §6 invariant that the guard no longer depends on.

## F3 — v0.72 miscounted its own scope

"Defeated three ways" appears in the amendment heading, the footer entry and
the changelog bullet, while the amendment enumerates four categories —
literal-stripping order, brace/comment order, scope, word boundary — across
five concrete bypasses. **Correct count: four categories, five bypasses.**
Corrected in v0.73; v0.72's text stands per L17.

## F4 — two assurance claims overclaimed

"They share one function, so they cannot drift apart again" was too strong:
the host guard and the module sweep share the **classifier and the matcher
constant**, not one whole function, because they answer different questions (a
count per file versus which lines carry it). Narrowed to what is true and now
literally so — the two things that were separately wrong before, how source is
stripped and what pattern is matched, have exactly one definition each.

And the limits prose named a Unicode-escape bypass (`profile.gender`)
that **no test asserted**. It now ships as a counter-case beside the other two,
so the documented limits are all pinned rather than two of three.

## The guarantee, restated

Every SPELLED read fails the suite — anywhere in the host's inline module or in
any `core/`/`ui/` module outside the three-file input path, **at any nesting
depth**. It still does not stop an adversary: a runtime-built key, a Unicode
escape in the property name, and a value-scanning sniff all pass, and no
lexical check closes that class. The runtime differential over the pure
surfaces remains the real guarantee; this is the fence around what it cannot
reach, and it fails closed.

## Verification

- vitest **56 files / 2001 tests green** (1999 → 2001)
- `audits/project_audit.py` **PASS 14/0/0/0** on a clean tree
- local PII audit **clean, 862 files** · `index.html` **1474/1500**
- L17 re-checked programmatically before commit: the §5 v0.72 clause and the
  v0.72/v0.71 footer bodies are byte-identical to `69c77ed`; the whole-file
  diff removes nothing but the two demoted labels.

STAGED. No push, no PR, no merge, no deploy, no storefront mutation.
