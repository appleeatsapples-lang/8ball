# Cross-model pre-merge audit — PR #205

**PR:** #205 — the specimen dev line (moon sign · kua removal · four-line sheet + hexagon · comparative in $3 · calc v5 name fold)
**Branch:** `claude/specimen-four-line-symbolic`, 45 ahead / 0 behind `main`
**Date:** 2026-08-12

## Why this PR exists, and what it supersedes

**#201 and #202 are CLOSED and were never merged** — verified via the API
(`mergedAt: null`, `mergeCommit: null`). Both were retired on operator
decision as redundant rather than defective, and both closure notes name
*this* line as the one that should land:

- **#201** — "already absorbed by the active dev line"; its head commit is
  an ancestor of this branch, so merging it would have created a second
  path to identical content. CI was fully green at close.
- **#202** — closed "on confirmation that the v0.67 line is landing on
  `main`", because merging it would move production through an
  *intermediate* kua state that v0.67 then deletes outright. Its note
  carries a conditional: **if this line does not land, #202 must be
  reopened**, or `main` keeps the v0.63 both-values render that the
  2026-08-06 word ruled against.

At the time of writing, `main` (`2ba6264`) contains **neither** the moon
coordinate (`core/moon.js` absent) nor the kua removal (`core/kua.js`
still present). This PR is the path that resolves both.

## Audit chain — stated honestly, because it is incomplete

**The 2026-08-06 round delivered ONE reviewer, not three.**

- **grok — COMPLETED.** Verdict **MERGE WITH FIXES**; six findings, all
  absorbed. Full record:
  `audits/relay_specimen_four_line_premerge_audit_2026-08-06_response.md`.
- **codex — FAILED TWICE.** 1.4MB and 1.48MB responses, both dominated by
  the echoed diff, neither containing a verdict; the second attempt failed
  identically after an explicit output cap, which is what established that
  the cap cannot bite when the harness prepends the whole diff.
- **claude reconciliation — FAILED**, 0 bytes, its context starved by the
  above.

A caution that cost real time and is recorded so it does not recur: the
failed codex files **contain the strings "MERGE WITH FIXES" and "SAFE TO
MERGE"** — quoted from this repo's own prior audit artifacts inside the
diff under review, not opinions. Always grep a response for a genuine
verdict line and confirm `RECONCILIATION.md` is non-empty before counting
a lane.

Later sessions on this branch ran further codex rounds whose findings
were absorbed (see the `audit:` commits in the log, including one round
where two of the absorbs were defects in the seat's own prior fixes).
**Whether those satisfy §10/L48 for the branch as a whole is the
operator's call, not this artifact's claim.**

## Defects caught and fixed pre-merge

1. **The paid sheet was inaudible.** `aria-label="<coord> details"` on 14
   of 15 compartments overrode name-from-contents under `role="button"`,
   so the coordinate VALUE never reached assistive tech — also an SC 2.5.3
   failure. Fixed with a visually-hidden first-child label (`sun aries`),
   including the trailing space accname computation needs.
2. **The card ran off a 375px viewport.** `flex-wrap: nowrap` pushed
   `#card-face` past its `.flip-stage`, and `body{overflow-x:hidden}`
   **clipped it silently** rather than scrolling — a `scrollWidth` probe
   reported clean while a compartment and the catalog numeral were gone.
   Caught by screenshot, not by the suite.
3. **The §1.F legend misaligned.** It is read positionally against its
   cells; the four-line regrouping left three notes against the ANIMALS
   line's five compartments, so `water` (year five-element) could not be
   told from `rat · water` (hour pillar stem). All 15 cells now carry a
   note, pinned as a general one-entry-per-cell invariant.
4. **A tautological pin** — `expect(f(x)).toEqual(f(x))`, written by the
   implementer while inverting a test for the comparative fold, repeating
   a failure mode PR #187 F7.1 had already recorded. Caught by grok;
   replaced with a discriminating assertion.
5. **`#public-read` retained `unsealing` forever** — latent F4 conflation
   in the paint layer (`sealOut` is fill-mode both, ending at opacity 0).
6. **ΔT was missing from the moon math** — caught by an earlier codex
   round on #201; a ~67s TT−UT error silently misfiled birth instants
   inside a sign-cusp window.

**One predicted defect did NOT reproduce** and no change was made: a
computed 320/390 card overflow was flagged NEEDS-LIVE-CHECK, and the
browser showed card bottom == stage bottom with no clipping in both label
states. Recorded so it is not re-derived.

## Open items — none are blockers, all are operator-only

1. **§3 step 1 is OUTSTANDING by design for calc v5.**
   `tests/fixtures.json` is deliberately untouched: the seat that verified
   the canonical name fold would otherwise be writing its own fixtures,
   collapsing implementer and verifier on one change (L48). Eight
   accented-name cases are drafted at
   `sessions/packet_calc_version_note_nfc_fold_2026-08-08.md` §11, with a
   recorded warning against pinning NFC/NFD equivalence as a byte-twin
   pair in JSON — a formatter that re-normalizes on write would collapse
   the twin and leave a green assertion proving nothing.
2. **`gender` is stored with no reader.** §5 admitted it because it "feeds
   only the kua line"; that consumer was deleted at §1.D v0.67. The field
   is retained by operator word. It needs a named purpose or removal from
   the §5 allow-list — §1.D v0.67 records the justification as vacant and
   deliberately does not resolve it.
3. **The Gumroad listing is stale.** The shipped surface includes the
   comparative at $3; the store description does not say so. No agent may
   mutate the store.

## Verification (implementer's recorded runs — reviewer lanes cannot execute node/npm)

- vitest **59 files / 2104 tests green**
- `audits/project_audit.py` **PASS 14 / 0 fail / 0 warn / 0 skip**
- local PII audit **clean, 867 files**
- `index.html` **1469/1500**
- `git diff --check` clean; merged `origin/main` cleanly (45 ahead / 0 behind)
- Live-fire at 320 / 390 / desktop, both label states, host sheet and dyad
  screen, tiers t3 / t2 / stored-t5-migrates
- The calc v5 fold verified with explicitly constructed forms (distinct
  source strings, lengths 4 vs 5): `getNameNumberSum` agrees at 13/13,
  `nameNumber` 4, `soulUrge` 11

## Process

STAGED. No merge, no deploy, no storefront mutation, and no sibling
repository touched. Merge is the operator's word.
