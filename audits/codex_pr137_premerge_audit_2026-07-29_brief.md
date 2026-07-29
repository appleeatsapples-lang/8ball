# CODEX PRE-MERGE AUDIT PACKET — PR #137 (test-coverage audit + P1–P9) — 2026-07-29

## Who you are and what this is
You are an independent pre-merge auditor for PR #137 of the 8ball
repository (branch `claude/test-coverage-analysis-qdsbh3`, base
origin/main @ a9957b5, head after the merge commit resolving it).
This PR is a 12-stage test-coverage initiative: an audit document,
then P1–P9 against that document's own findings. 20+ files, ~2600
insertions, one product behavior change.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.
- Do not create branches; leave the checkout exactly as found.

## Why this packet exists at all

The `l48-gate` on this PR is currently RED and has been since it opened —
no `audits/*_pr137_*_response.md` exists. Per `CLAUDE.md`'s gate letter
and `DOCTRINE.md` §10, the implementing lane cannot self-certify, so the
artifact that greens the gate has to be your verdict response. This brief
alone does **not** satisfy the gate (that hole was closed in #131) — it
commissions the read that produces the artifact.

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
- **Coverage:** `ui/modals.js` 100% on statements/branches/functions/lines;
  `ui/payments.js` 100% on statements/functions/lines (branch deliberately
  not claimed); overall `core/`+`ui/` 96.49 / 87.39 / 100 / 98.68.
- **Byte-identical browser behavior** across cold boot, submit,
  reload-rehydrate, corrupt-payload and `?paid=t3` return for the
  `ui/boot.js` extraction; and a `validationMessage` before/after for the
  DOB fix. Verified in real Chromium because no jsdom exists here.
- **`tests/countries.test.js` collapse** — two 277-iteration loops become
  two collected-failure assertions, "verified equivalent across 7
  corruption classes, coverage byte-identical."
- **One product change only:** `index.html`'s pre-1900 DOB submit
  dead-end. Everything else is tests, one refactor, and CI config.
- Suite green; `index.html` at 1460 lines, under the §7 stage-5 ceiling.

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
7. **MERGE INTEGRITY.** This branch has taken four merges from `main`
   (#132, #133, and now #140/#142's calc v3.1 + CI-trigger work). One
   earlier merge silently auto-resolved `CLAUDE.md`'s test-file count to a
   wrong value with **no conflict raised**, caught only by
   `tests/repo_shape.test.js`. Re-verify the three counted lines against
   the filesystem (`find core ui -name '*.js' | wc -l`,
   `ls tests/*.test.js | wc -l`), the `index.html` line figure in the
   single-file-rule prose, and that the latest merge did not drop or
   reorder any `journal.md` entry from either side.
8. **CALC INTERACTION.** `main` landed calc v3.1 (`core/calendar.js`,
   1916 LNY) while this PR was open. This PR's P6 pins exact ascendant
   degrees and calendar values. Confirm the merged result is genuinely
   green rather than green-because-the-pins-are-loose.
9. **SCANS.** `npm test` → expect 45 files / 1109 tests. `npm run coverage`
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
- File as `audits/codex_pr137_premerge_audit_2026-07-29_response.md`.
