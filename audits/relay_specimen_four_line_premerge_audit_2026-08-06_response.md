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
