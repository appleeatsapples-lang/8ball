# Cross-model pre-merge audit — PR #200

**PR:** #200 — UI refinement: state-truth timers, search recovery, a11y forms, specimen registry redesign
**Branch:** `codex/ui-refinement-post-pr199` (forked from `origin/main` @ `520242a`)
**Date:** 2026-08-04
**Auditor:** `relay --base origin/main` fan-out (codex + grok + claude, reconciled by claude). Gemini errored on auth (rc=41, same known pattern as PR #194/#199 — not counted).

## Verdict

**Initial reconciled verdict: DO NOT MERGE** (real regressions + an inaccurately-scoped L48 sighting). Four of five blockers are now fixed and re-verified in this response's commit. **The fifth is a genuine product-promise question that needs the operator's decision, not an implementer's** — see Outstanding below. Not self-clearing this PR.

## What was reviewed

The full PR diff vs `origin/main` (3089 diff lines): `ui/result.js` (new), `core/cities.js` + `ui/citysearch.js`, `ui/modals.js` + `ui/profile.js`, `ui/experience.css` (new) + `index.html`, and this PR's own pre-filed sighting (`audits/L48_override_pr200_2026-08-04.md`) and transplant audit (`audits/ui_refinement_post_pr199_transplant_2026-08-04.md`), which reviewers were directed to follow and independently re-verify rather than trust.

## Findings

### Consensus (≥2 reviewers, verified against source)

1. **HIGH — purchase-permanence disclosure silently dropped, with the enforcing test flipped to match.** `index.html`'s about-modal and paywall-modal copy changed from *"opens the sheet to that rung on this device — permanently, for every reading... what you bought stays bought"* to *"access is stored here; clearing this site's data removes that local record."* `tests/payments_markup.test.js` was itself changed in the same diff from requiring `/permanent|yours for good/i` to requiring it **not** appear. `DOCTRINE.md` v0.55 states *"A rung purchase is permanent and unlimited"* and calls the disclosure load-bearing. This PR's own L48 sighting claimed "no DOCTRINE.md change... no pricing change" — that claim is inaccurate. **Not fixed in this response — see Outstanding.**
2. **MEDIUM — the primary onboarding city-search controller's `reset()` handle was discarded.** `initCitySearchUI(...)`'s return value wasn't kept, so `try-another`/forget-device never reset suggestions, `aria-busy`, status text, or the polar message on the host path (dyad's own city field did call `reset()` correctly). **Fixed** — the handle is now kept (`const cityUI = initCitySearchUI(...)`) and `cityUI.reset()` is called from both `tryAnotherBtn`'s handler and the forget-device `resetFormDisplay` hook.
3. **Confirmed, not a bug worth re-litigating.** PR #199's dyad gender-clear fix (`ui/dyad.js` `clearEntryFields()` including `'dyad-gender-input'`) is untouched by this diff — independently verified by all three reviewers.

### Unique findings — verified and disposed

- **HIGH, confirmed real regression (claude).** `saveProfile()`'s new read-verified boolean return was discarded at both the archive-reopen and form-submit call sites in `index.html`. A blocked-storage write (private browsing, quota) would render a full result as if nothing was wrong, and the failure would only surface later — confusingly — when `stagePurchase()` correctly refused to open the paywall on a profile it couldn't re-read. **Fixed**: both call sites now check the return and call `showPaidBanner(PROFILE_SAVE_STORAGE_MESSAGE)` immediately on failure; the reading still renders (not blocked), the user is just warned. New source-pin regression test added (`tests/payments_markup.test.js`). Live-fire verified: forced a real `localStorage.setItem` failure on the profile key and confirmed the banner fires with the correct text and the write genuinely didn't land.
- **HIGH, real but pre-existing — not a new regression (codex).** `eight_ball_pending_profile_v1` was never cleared by the forget-device flow, before or after this diff. A cancelled-checkout pending profile could survive "forget this device" and be resurrected via `?paid=`. **Fixed** in this PR since it heavily touched this exact flow: `clearPendingProfile` added as a fourth required, read-verified erasure hook in `ui/modals.js`'s `forgetConfirm` handler.
- **MEDIUM, real, low-probability edge case (codex).** `ensureFacetIndex`'s `null`-on-failed-write return is discarded at all three call sites; a write failing at exactly a reset moment could leave a new profile showing the prior profile's card-entry slot. **Not fixed** — same disposition as the reconciliation gave it: real but low-probability, and out of scope for this already-large fix batch. Flagged as a fast-follow, consistent with the pattern the rest of this diff hardened for other keys.
- **Needs live verification, disposition: inconclusive, left open (codex).** `ui/experience.css`'s `:has()`-based mobile `#enter-btn` reveal hides the button (`visibility: hidden`) while an optional field (`#rising-fields`/`.kua-gender-field`) has focus, which would drop it from tab order at that moment for keyboard users. Attempted live verification this session (real dev server, mobile viewport, native `<select>` focus via automated input) produced inconsistent/inconclusive results — not a confirmation either way, likely a tooling artifact with native-select focus + `:has()` reactivity rather than evidence of a real bug. Codex itself flagged this as "needs an actual live Tab-key pass, not a hallucination" rather than a certainty. **Recommend a real manual device/keyboard pass before or shortly after merge** rather than a guessed CSS fix for an unconfirmed issue.
- **LOW, confirmed (claude).** `#card-back`'s `aria-label` read "flip card again" even on the very first reveal, before any flip happened (the old pre-diff label, "card back — tap to reveal", was equally wrong on *subsequent* flips — neither version worked for both states). **Fixed**: relabeled to "flip card" (correct in both cases); the one test pinning the old string updated.
- **LOW, confirmed, gap now closed (grok).** `openForget()`'s stale-status-clear-on-reopen fix (from the earlier transplant-review pass) had no regression test. **Fixed**: added `tests/modals.test.js` "reopening after a failed erase clears the stale status instead of showing it again".
- **LOW/noise-adjacent (grok).** Non-transactional forget-erase messaging — already an explicitly-documented tradeoff in `ui/modals.js`'s own comment (not silent data loss; all hooks are idempotent and none are short-circuited). No change made; already disclosed.
- **Pre-existing, self-assessed non-blocking by grok, unchanged.** Dyad's second birthplace field still has no `cityStatus` wiring (same gap already flagged in the transplant audit); `ui/profile.js` has no `y > 2100` ceiling (dormant, DOB is bounded to ≤ today regardless).

## Disposition

Fixed and re-verified in this response's commit:
1. City-search `reset()` wiring (host `try-another` + forget-device).
2. `saveProfile()` failure now surfaces `PROFILE_SAVE_STORAGE_MESSAGE` immediately via `showPaidBanner`, at both call sites — live-fire verified with a real forced storage failure.
3. `clearPendingProfile()` added as a fourth read-verified forget-device erasure.
4. `card-back` aria-label corrected to work on both first and subsequent flips.
5. Missing regression test for the stale-forget-status-clear-on-reopen fix, added.
6. This PR's own L48 sighting artifact's PII-scan trip (`operator` near an ISO date) — fixed and verified clean.

Full suite re-verified green after all fixes: **56 files / 1927 tests** (1925 before this response's two new regression tests). Product audit: PASS 13/0/1/0. Local PII scan: clean, 855 files. `git diff origin/main --check`: clean.

## Outstanding — operator decision required, not fixed here

**The purchase-permanence copy change (Consensus finding #1).** This is a genuine change to what a paying customer is promised, sitting inside a PR framed as pure UI refinement, contradicting `DOCTRINE.md`'s own load-bearing language. It is not this response's place to unilaterally pick a resolution. Two paths, named so neither is silently chosen:

- **Restore** the permanence language ("permanently... what you bought stays bought") in both the about-modal and paywall-modal copy, and revert `tests/payments_markup.test.js`'s flipped assertions — treats this as an unintended copy regression from the redesign pass.
- **Keep** the new, arguably more technically honest wording (this product has no account/server backend, so "permanent" was always contingent on not clearing browser data) — but that requires an actual `DOCTRINE.md` amendment with a journal entry, per this project's own rules for load-bearing copy changes, not a silent change inside a UI PR.

This PR does not merge until that decision is made and applied.

## Full reconciliation output

`~/ai-relay/runs/20260804-031620-8ball-ui-post-pr199/RECONCILIATION.md` (operator-local, off-repo — this file is the in-repo summary the L48 gate requires). Individual model responses in the same run directory's `responses/` subdirectory.

## Recommendation

Once the permanence-disclosure decision is made and applied (either path), re-run `npm test` + `project_audit.py` to confirm still green, and this PR is ready for the operator's own read and the explicit merge word per §10/L48.
