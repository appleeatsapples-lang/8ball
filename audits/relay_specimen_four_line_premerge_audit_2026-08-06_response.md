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
