# Cross-model pre-merge audit — PR #201

**PR:** #201 — feat(moon): moon-sign coordinate at t1 — DOCTRINE §1.K v0.64 (ASTRO-MOON-ADD-01)
**Branch:** `claude/astro-moon-sign-1k` (forked from `origin/main` @ `69235ee`)
**Date:** 2026-08-06
**Auditor:** `relay --base origin/main` (grok review; claude reconciliation — the reconciler independently re-derived each finding from the diff and code rather than relaying the review). Run of record: `~/ai-relay/runs/20260806-010205-8ball` (1,235 diff lines, 104,310B context).

## Verdict

**MERGE WITH FIXES → both fixes landed in `24f8076`, now SAFE TO MERGE** (pending the operator's own read of this artifact and the explicit merge word — this response is not a substitute for either).

## What was reviewed

The full PR diff vs `origin/main`: new `core/moon.js` (Meeus ch.47 longitude series — constants, E eccentricity scaling, JD/UT-vs-TT treatment, sign bucketing), the `buildProfile` gating parity with `risingSign` including the deliberate no-polar-guard asymmetry, `tests/moon.test.js` + `tests/fixtures.json` `moon_cases` (fixture-honesty disclosure adequacy), the count-pin sweep across ten suites (census 15→16, 9 rows, 15 cells), and `DOCTRINE.md` §1.K/v0.64 coherence with §1.D/§1.F/§1.G including the two disclosed residuals.

## Findings

### Confirmed by the reconciler (independently re-derived from the diff)

1. **HIGH — false tz-parity fixture label + weak parity assert (`tests/fixtures.json` moon_cases row 2, `tests/moon.test.js`).**
   Row 2 claimed "same UTC instant as row 1" at 19:00 America/New_York — but
   US DST began 1992-04-05, so April 11 was **EDT (UTC-4)**: 19:00 local =
   23:00 UTC, one hour off row 1's 1992-04-12 00:00 UTC. The moon still
   landed in leo across that hour (~0.5°/hr drift inside a 30° bucket), so
   the sign-string-only parity assert stayed green while its own label was
   false — the test did not prove the tz-resolution wiring it claimed to.
   **FIXED (`24f8076`):** row 2 → 20:00 EDT, which lands on JD 2448724.5
   exactly; the parity test now resolves both rows' offsets through
   `offsetMinutesForWallTime` + `julianDay` and asserts **JD identity**
   (`toBe(2448724.5)`), longitude identity, and sign equality — a future
   tz-wiring regression can no longer hide inside a sign bucket.

2. **MEDIUM — live paywall copy undercounted the paid offer (`index.html:993`, `:1019`).**
   The about-modal's "opens the ten sealed coordinates" and the paywall's
   "adds 10 coordinates" predate this PR's census move to 5 open / 11
   sealed / 16 total and were not touched by the original diff. This is
   buyer-facing copy understating what $3 unlocks.
   **FIXED (`24f8076`):** eleven / 11, with both `tests/payments_markup.test.js`
   pins updated in lockstep.

3. **LOW (cosmetic) — stale gating-rationale comment (`core/profile.js`).**
   The moon-gating comment claimed the coordinate shares "the SUN ↑
   RISING-style card row"; the shipped DOM gives moon its own MOON
   coord-section. Comment-only, no functional effect.
   **FIXED (`24f8076`):** reworded to the actual rationale (§1.K pair
   coherence; moon renders in its own row).

### Reviewed and resolved as non-defects

- **`share_surface.test.js` 8-row references** — grok flagged then
  self-resolved: the real wiring pin was correctly bumped 8→9 in this PR;
  the remaining "8-row" strings are synthetic SVG-builder fixtures
  unrelated to the wiring count.
- **Paywall "their meanings" phrasing vs the missing moon meanings tap** —
  real but **already disclosed** as §1.K known residual (2), tracked for
  its own §1.G content cycle; scored a nit, no new action.
- **Meeus Example 47.a recompute** — the reconciler did not independently
  re-run the 59-term sum; the claim is consistent with the test's
  `toBeCloseTo(133.162655, 5)` tolerance, and an error here fails loudly
  in CI rather than silently.

### Reconciler's positive findings

The core ch.47 implementation, the tz/gating design (moon piggybacks on
rising's validated tz path and correctly carries no polar guard, the math
needing no lat/lng), and the count-pin sweep across
density/labels/payments/tiers/dyad/kua/public/atlas/provenance were all
found sound and internally consistent; §1.K's two known residuals (stale
card art; no meanings tap) were scored as honest, pre-acknowledged
disclosures rather than hidden defects.

## Verification pre-conditions (implementer's recorded runs — the reviewing lane cannot execute node/npm)

Recorded at the audited HEAD and re-recorded after the fix commit `24f8076`:

- vitest suite: **57 files / 1953 tests green** (`npm test`)
- `audits/project_audit.py`: **PASS 13 / 0 fail / 1 warn / 0 skip**
- local PII audit (`audits/run_local_audit.sh`): **clean, 858 files**
- `index.html` 1457/1500
- Live browser fire on a local static server: free tier seals the MOON
  cell (empty value node, census "5 of 16 coordinates open · 11 sealed");
  t3 with no stored birthplace renders the `—` unres field (F4
  sealed ≠ unresolvable contract); t3 with 1992-04-12 00:00
  Europe/London renders **moon: leo** — the Meeus Example 47.a anchor
  instant resolved through the product's own form → city-lookup →
  buildProfile path; provenance "lunar longitude" and atlas "moon sign"
  render under reveal-labels.

## Process note

Build and merge intent are authorized by the operator's freeze-override
word ASTRO-MOON-ADD-01 (2026-08-06), which reverses the 2G-3+ "may not
return" deferral recorded in 8BALL.md item 10. Per the
no-self-certification law this artifact records an independent
cross-model read of the implementer's diff; the merge itself remains the
operator's word, and this PR does not self-merge.
