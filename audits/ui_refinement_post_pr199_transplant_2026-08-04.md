# UI refinement — transplant onto post-PR199 main, and finish — 2026-08-04

## Scope and authority

The user assigned the 8ball UI lane to Codex while Claude worked ops/Grok, per the same 2026-08-04
authorization as `audits/codex_ui_refinement_2026-08-04.md` (the source work, done in the preserved
`/private/tmp/8ball-ui-refinement` worktree, based on the much older `ed9bfec`). Meanwhile PR #199
(kua trigram + gender input) merged to `main` as `520242a`. This entry documents porting that UI
refinement onto current post-merge `main` — a fresh worktree, `codex/ui-refinement-post-pr199`,
rather than replaying the old worktree's stale-based commits — plus finishing verification and two
additional fixes found during review. Work stayed local: no commit prior to this entry, no push, no
PR, no deploy, no reach mutation, no measurement read. The active Instagram measurement hold and its
heartbeat were untouched.

**Protected invariant, explicitly checked:** PR #199's dyad gender-clear fix (`ui/dyad.js`
`clearEntryFields()` including `'dyad-gender-input'`, closing the stale-hidden-DOM leak the L48 audit
caught in PR #199) was verified intact both before and after every change in this entry — the port's
own diff never touches that function, confirmed by direct code read.

## What the transplant carries

Same four areas as the source audit, re-verified against post-199 main rather than assumed:

1. **Result and written-entry state truth** — `ui/result.js` (new): a single `transitionGeneration`
   counter shared by the arrival and shake timers, so a stale queued callback can never repaint/flip/
   announce over a newer profile or an explicit reset. `try another` and a fully-verified forget-device
   both invalidate pending transitions. Facet writes (`ui/payments.js`) are read-verified end to end;
   a blocked/silent-no-op write returns `null` and suppresses the "written entry changed" announcement
   rather than lying about it.
2. **Birthplace recovery** — `core/cities.js` + `ui/citysearch.js`: per-instance search generations
   invalidate stale fulfillments/rejections after reset or a newer input (including identical text
   retyped after reset); polite loading/no-results/transient-retry/terminal-reload states with
   `aria-busy`; bounded 3-attempt retry across the same-origin city-module identities, tagged
   exhausted on the third failure with no fourth request. New test `tests/cities_recovery.test.js`
   proves the bound by mock call-count, not by reading a comment.
3. **Forms, dialogs, status, erasure** — modal focus trapping now includes native `<summary>`
   (reaches the paywall specimen disclosure by keyboard); DOB errors get real calendar-day/leap-year
   validation (previously e.g. Feb 30 could pass) plus `aria-describedby`/`aria-invalid`/focus-move;
   profile, saved-reading, and facet deletion are read-verified, and forget-device only closes/resets
   after all three verify — partial failure stays open with a persistent retry status.
4. **Visual redesign** — `ui/experience.css` (new, 534 lines): the "specimen registry" monochrome
   language (underline inputs, 44px minimum touch targets, generous spacing, one recurring circular
   8-ball mark). `index.html` restructured to use it; net effect is index.html **shrinking** (1486 →
   1450 lines) because ~60 lines of result/flip/shake logic were extracted into `ui/result.js`.

New files: `ui/experience.css`, `ui/result.js`, `tests/cities_recovery.test.js`, `tests/result_ui.test.js`.
21 pre-existing files modified.

## Two fixes made during this transplant's review (not present in the source worktree)

1. **`index.html` `#dob-error`** gets `role="alert" aria-live="assertive"` (previously plain, relying
   only on `.focus()` for a screen reader to notice — silent on a second failure of an already-focused
   field, since a repeat `.focus()` on the same element fires no DOM focus event).
   `tests/dob_validation.test.js`'s markup pin updated to match.
2. **`ui/modals.js` `openForget()`** now clears any stale `forget-status` text before opening the
   dialog — previously a prior failed erase attempt's message persisted if the user closed and
   reopened without a fresh attempt.

Both were caught by independent review (see Verification below), fixed, and live-fire verified via a
real click path (not just unit tests): filled an invalid DOB and confirmed `#dob-error` announces with
the new attributes; generated a real reading, manually staged a stale `forget-status` message, clicked
**forget this device** for real, and confirmed the dialog opened with the status cleared.

Also corrected: `CLAUDE.md`'s single-file-rule sentence still said "at 1497, so there are 3 lines of
headroom" — stale twice over (base 520242a was 1486; this branch is 1450). Updated to the real count.

## Review (five dimensions, independent)

Each area read against the real diff, not the description — verified by tracing code, not trusting
comments:

- **Accessibility/forms/dialogs**: all three named behaviors (focus trap, DOB errors, read-verified
  deletion) correct and non-vacuously tested (confirmed by stashing the diff and watching the new
  tests fail). Found and fixed the two items above. Noted (not fixed, inherent to `localStorage`, and
  already documented in a code comment as a conscious tradeoff): the three forget-device deletions
  aren't transactional — a partial failure after e.g. `clearProfile` succeeds leaves that key already
  gone even though the UI says "try again." Retries are safe (idempotent), but worth the operator
  knowing the framing is best-effort-per-key, not atomic.
- **Birthplace/city-search recovery**: generation-guard and bounded-retry logic both correct, hand-
  traced through a reset-mid-fetch race and confirmed against the passing tests. One non-blocking,
  **pre-existing** gap (not introduced by this diff): the dyad screen's second birthplace field never
  got a `cityStatus` ref wired, so the new loading/no-results/retry/exhausted messaging only surfaces
  on the primary onboarding field, not the dyad person-B field. Flagged as a follow-up, not fixed here
  to avoid widening this pass's already-broad scope further.
- **State/timer guards + result consolidation**: all four behaviors correct and tested; explicitly
  confirmed the PR #199 gender-clear fix is untouched.
- **CSS/index.html**: 1450/1500 lines, zero rule violations (no external fonts/scripts, no new deps,
  no fetch/analytics, no new storage keys), the "specimen registry" visual description verified
  accurate against the actual CSS rule-by-rule. Caught the stale CLAUDE.md line count (fixed above).
- **Doctrine/scope-creep/privacy sweep**: no violations. No new/undocumented localStorage keys, no
  edits to `content/*.js`/`cards/*.jpg`/`tests/fixtures.json`/`core/profile.js`/`package.json`, no
  pricing or Gumroad-URL change. Two non-violations worth the operator's awareness: modal copy in the
  about/paywall dialogs changed somewhat beyond pure a11y wording (price and checkout link unchanged),
  and `ui/profile.js`'s `validateBirthInput` picked up a genuine leap-year/day-range input-validation
  bugfix bundled into this pass.

**On scope**: this diff is materially broader than a narrow "accessibility patch" — it's the full UI
refinement pass finishing on the current codebase, which is what was asked. Nothing found is unsafe,
undocumented, or doctrine-violating; the breadth is intentional, not creep.

## Verification gate

- `npm test`: 56 files / **1925 tests** — PASS (1889 baseline on `main`@520242a + 36 new).
- `python3 audits/project_audit.py`: verdict PASS, 13 pass / 0 fail / 1 warn (advisory dirty-tree) / 0 skip.
- `bash audits/run_local_audit.sh`: clean, 853 files.
- `index.html`: 1450 / 1500 lines.
- `git diff 520242a --check`: clean.
- Live-fire (real local dev server, `serve` on port 5174, not just static/unit tests): onboarding →
  invalid-DOB submit → `#dob-error` correctly `role="alert" aria-live="assertive"`, `aria-invalid="true"`;
  full reading generated end to end (name/DOB → card); **forget this device** clicked through the real
  UI with a staged stale status message, confirmed cleared on open. Screenshots match the visual
  language described above.
- Auditor's own assurance suite (`python3 -m unittest audits.test_project_audit`) has one pre-existing
  failure (`PathRedactionHelperTests.test_guard_can_fail`) that sits entirely outside this diff
  (`audits/` has a zero-line diff against `520242a`) — environmental, not caused by or fixable within
  this branch.

## Recommendation

Safe to commit as reviewed. Next step for whoever picks this up: open a PR from
`codex/ui-refinement-post-pr199` against `main`, which will need the normal L48 cross-model audit
(this entry is a thorough self/multi-pass review, not a substitute for that gate) before a merge word.
Two residual, non-blocking follow-ups worth a later pass: the dyad second-birthplace-field status
wiring, and the operator's awareness of the non-transactional forget-device deletion order.
