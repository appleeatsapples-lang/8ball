# PRE-MERGE AUDIT PACKET — PR #137 (test-coverage audit + P1–P9) — 2026-07-29
#
# WHICH LANE — the independence test, not a vendor (#172, #175). This packet
# may be run by any lane that is NOT the lane that authored the change and NOT
# the lane that authored this brief. Both are Claude Code, so **Claude does not
# satisfy the test for this PR** — a Claude-run verdict would be the same
# lineage checking itself, which is exactly what the adversarial pass recorded
# below already is. Any other lane qualifies, Codex included: the "Codex is
# retired" premise behind sighting #14 was **false when written** and is
# corrected on main by #170 (`a0d577c`), which cites two genuine relay verdicts
# dated the same day. The vendor prefix is dropped here because hard-coding any
# lane is the defect #166 names, not because a particular lane is unavailable.

## Who you are and what this is
You are an independent pre-merge auditor for PR #137 of the 8ball
repository (branch `claude/test-coverage-analysis-qdsbh3`, base
origin/main @ current, head `7885764` or later — verify against the PR).
This PR is a 12-stage test-coverage initiative: an audit document,
then P1–P9 against that document's own findings. 20+ files, ~2600
insertions, one product behavior change.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.
- Do not create branches; leave the checkout exactly as found.

## Why this packet exists at all

`l48-gate` is **green**, and that is precisely why this packet still matters.
It is satisfied by `audits/L48_override_pr137_2026-07-29.md` (sighting #22),
filed by a lane that did not author the PR — **an override records a decision,
not a review.** In its own words it "does not make #137 mergeable" and "is
still not an audit."

So the gate no longer signals anything about whether this change was examined.
Per `DOCTRINE.md` §10 the implementing lane cannot self-certify, and no verdict
response exists. Your read is the first actual audit this PR would receive;
filing it as `audits/<lane>_pr137_..._response.md` also replaces the override
with an artifact that earned the green. This brief alone does **not** satisfy
the gate — that hole was closed in #131, and `_brief` deliberately fails the
predicate.

Be aware of one thing when weighing your independence: an adversarial
review pass was already run against this PR by a *same-vendor* model
(Claude), and it confirmed every claim it sampled. That is corroboration
from a correlated source, not a substitute for a cross-vendor read, and
it is the reason this packet is still being sent. Do not treat its
agreement as evidence; re-derive independently.

## What the PR claims

- **"39 distinct regressions demonstrated invisible before / caught
  after."** Spread across commits 2–11, each commit message naming its
  specific mutations. This is the load-bearing claim of the whole PR.
- **Coverage** (re-measured at `7885764`, not carried forward): `ui/modals.js`
  100/100/100/100 (66/66 stmts, 51/51 branches, 13/13 funcs, 48/48 lines);
  `ui/payments.js` 100 stmts / 95.55 branch / 100 funcs / 100 lines — the
  branch figure is deliberately **not** claimed as 100; overall `core/`+`ui/`
  96.53 / 87.7 / 100 / 98.58. Note the payments figure dipped to 97.19/96.59
  while the t4 rung existed (its fail-closed offer path was unreachable) and
  returned to 100 when #178 retired the rung — worth knowing if you compare
  against any figure quoted earlier in the PR's history.
- **Byte-identical browser behavior** across cold boot, submit,
  reload-rehydrate, corrupt-payload and `?paid=t3` return for the
  `ui/boot.js` extraction; and a `validationMessage` before/after for the
  DOB fix. Verified in real Chromium because no jsdom exists here.
- **`tests/countries.test.js` collapse** — two 277-iteration loops become
  two collected-failure assertions, "verified equivalent across 7
  corruption classes, coverage byte-identical."
- **One product change only:** `index.html`'s pre-1900 DOB submit
  dead-end. Everything else is tests, one refactor, and CI config.
- Suite green; `index.html` at 1489 lines, ~11 under the §7 stage-5 ceiling.

## Adversarial checklist

1. **DIFF PERIMETER.** `git diff --name-status origin/main...HEAD`. No
   `core/*.js` source file may be modified — `core/` is claimed read-only
   in this PR (tests only). `content/*.js` and `DOCTRINE.md` must be
   untouched. Any deviation is a finding.
2. **THE 39.** Do not accept the aggregate. Pick at least 5 named
   mutations across different commits, reconstruct each from its commit
   message, apply it, and confirm (a) the new test fails, and (b) it was
   genuinely invisible before — `git show <parent>:<test> > /tmp/old.js`
   and run that against the mutated source, or for added files confirm no
   pre-existing test catches it. Restore between each. Report the count
   you actually verified and treat the remainder as unverified rather
   than inferring from a sample.
3. **VACUOUS-TEST HUNT.** The author self-reported catching two of their
   own tests asserting less than their comments claimed (a `!focusables.length`
   bail in `ui/modals.js`, a `utcDateParts` split in `core/rising.js`) and
   rewrote the comments rather than deleting the tests. Look for the ones
   they did **not** catch: assertions that pass against both mutated and
   unmutated source. `tests/markup_contract.test.js` is the highest-risk
   file here — its extractor silently reported a false match on
   `ui/profile.js` during development because that module aliases
   `const r = _refs;`. Verify the extractor cannot return zero required
   keys and call that a pass.
4. **THE BOOT EXTRACTION.** `ui/boot.js` takes 14 hooks and no `refs`,
   departing from §6 v0.23's `init*UI({refs},{hooks})`. Judge whether the
   `ui/concordance.js` precedent it cites actually licenses that shape
   (note concordance takes *zero* injected hooks, so the analogy is
   imprecise). Then diff the moved block against `index.html`'s prior
   inline `boot()` and confirm the logic moved verbatim.
5. **THE PRODUCT CHANGE.** The DOB fix is the only behavior change in an
   otherwise test-only PR. Confirm `dobInput.min` and the error path match
   `core/calendar.js`'s actual floor, that the sync-pin in
   `tests/dob_validation.test.js` would catch a future divergence, and
   that nothing else in `index.html` moved with it.
6. **CI CONFIG.** The coverage step must not be able to redden `test` —
   confirm `continue-on-error: true` and that it is a separate step.
   Confirm no `thresholds` block was added to `vitest.config.js`, and that
   the comment there does not overstate what the config does. The new
   `@vitest/coverage-v8` devDependency must keep
   `tests/dependency_discipline.test.js` under its threshold of 5.
7. **MERGE INTEGRITY — the highest-yield check here.** This branch has taken
   **eleven** merges from `main` while open, several carrying doctrine-level
   changes. Two silent-loss incidents are already on record, both caught only
   after the fact:
   - a merge auto-resolved `CLAUDE.md`'s test-file count to a wrong value with
     **no conflict raised**, caught by `tests/repo_shape.test.js`;
   - resolving the `boot()` conflict to this branch's side would have silently
     reverted #168's entitlement change, because the function had been
     extracted to `ui/boot.js` and git presented it as a whole-block conflict.

   Re-verify the three counted lines against the filesystem
   (`find core ui -name '*.js' | wc -l`, `ls tests/*.test.js | wc -l`), the
   `index.html` figure in the single-file-rule prose, and that no `journal.md`
   entry from either side was dropped or reordered. Then look for a third
   incident nobody has caught: **diff each merged-in commit's own changes
   against what survives at HEAD**, rather than trusting a green suite. A
   green suite did not catch either incident above.
8. **CALC INTERACTION.** `main` landed calc v3.1 (`core/calendar.js`,
   1916 LNY) while this PR was open. This PR's P6 pins exact ascendant
   degrees and calendar values. Confirm the merged result is genuinely
   green rather than green-because-the-pins-are-loose.
8b. **THE t4 RETIREMENT (#178, §1.D v0.60).** The rung shipped and was
   withdrawn the same day. `TIER_COORDS` has no t4, `RETIRED_TIERS = {t4:'t3'}`
   migrates stored devices, and `coordsForTier('t4')` is now empty. This
   branch's `ui/boot.js` consumes `coordsForTier`, and its `tests/boot.test.js`
   **mocks** it — a mock that silently disagreed with the shipped ladder for
   one merge (it granted `cardEntry` to t4, citing a deleted `T4_COORDS`) and
   the suite stayed green throughout, because mocks cannot go stale loudly.
   That was found and corrected in `7885764`. **Check for the same class of
   defect elsewhere**: any test double in this PR whose fidelity to the real
   module is asserted only in a comment. That is the most likely place a real
   defect is still hiding.
9. **SCANS.** `npm test` → expect 47 files / 1195 tests. `npm run coverage`
   for the figures in §"What the PR claims".
   `bash audits/run_local_audit.sh` if `audits/local_personal_data.txt`
   exists (it will not in a fresh container — that is expected, not a
   finding).

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
- State explicitly how many of the 39 mutation claims you verified.
Zero findings is acceptable only after you actually ran the checks.
- File as `audits/<lane>_pr137_premerge_audit_<YYYY-MM-DD>_response.md`, using
  the lane that actually ran it. The l48-gate predicate accepts any
  `[a-z0-9_]+` prefix, so the filename records provenance rather than
  satisfying a hard-coded vendor.
