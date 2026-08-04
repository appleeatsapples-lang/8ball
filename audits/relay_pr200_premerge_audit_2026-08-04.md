# Cross-model pre-merge audit — PR #200

**PR:** #200 — UI refinement: state-truth timers, search recovery, a11y forms, specimen registry redesign
**Branch:** `codex/ui-refinement-post-pr199` (forked from `origin/main` @ `520242a`)
**Date:** 2026-08-04
**Auditor:** `relay --base origin/main` fan-out (codex + grok + claude, reconciled by claude). Gemini errored on auth (rc=41, same known pattern as PR #194/#199 — not counted).

## Verdict

**Initial reconciled verdict: DO NOT MERGE** (real regressions + an inaccurately-scoped L48 sighting). All five blockers are now fixed and re-verified. **SAFE TO MERGE per this artifact's own read — pending the operator's own read and the explicit merge word (§10/L48); this response does not self-clear the PR.**

**Update, same date:** the operator reviewed the Outstanding item below and chose **restore** — the permanence language is back in both the about-modal and paywall-modal copy, and the corresponding test assertions were reverted to require it. See the "Outstanding, resolved" section at the end of this artifact for the exact wording and verification.

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

## Outstanding, resolved — operator chose restore

**The purchase-permanence copy change (Consensus finding #1).** Operator word: restore the permanence language. Applied:

- **About-modal** (`index.html`, the offer paragraph): restored *"...permanently, for every reading in this browser... a higher rung bought later upgrades the sheet — what you bought stays bought."* The written-card rotation/anchor disclosure that had also been silently dropped in the same rewrite (a separate, lower-severity finding from the earlier transplant-review pass) was restored in the same edit: *"the written card entry (name, type, habit, and one of three rotating note positions, first anchored by your life path)"*. The `"access is stored here; clearing this site's data removes that local record"` sentence was removed from this paragraph — it directly undercut the restored promise; the general local-storage disclosure already lives in the modal's earlier paragraph (*"nothing leaves your device on its own... stored locally..."*), so removing the redundant, contradictory copy here is not a coverage loss.
- **Paywall-modal**: `#paywall-value` restored to *"...permanently, for every reading in this browser. a one-time purchase, yours for good; the highest rung bought holds."* `#paywall-disclosure` had the same contradictory clearing-data sentence removed, for the same reason.
- Both retain everything genuinely new and correct from the redesign: the "10 sealed coordinates" / kua-line description, the `optional gender` privacy mention (a real DOCTRINE §1.D v0.63 requirement, not part of the permanence issue), and the `paywall-value`/`paywall-facts`/`paywall-disclosure` `aria-describedby` structure.
- `tests/payments_markup.test.js`: the flipped `not.toMatch(/permanent|yours for good/i)` assertion reverted to require the restored language (`toMatch`); the about-modal offer-paragraph test and the "t3 written-entry ceiling" test (which had independently been updated to assert the now-removed `"upgrades the stored access... without downgrading it"` phrasing) updated to match the restored wording.

Verified after restoration: **56 files / 1927 tests green**, product audit PASS 13/0/1/0, PII scan clean (856 files), `index.html` 1452/1500, `git diff origin/main --check` clean. Both modals visually checked on a live local dev server — render correctly, no markup breakage.

## Full reconciliation output

`~/ai-relay/runs/20260804-031620-8ball-ui-post-pr199/RECONCILIATION.md` (operator-local, off-repo — this file is the in-repo summary the L48 gate requires). Individual model responses in the same run directory's `responses/` subdirectory.

## Recommendation

All five blockers fixed and re-verified, including the operator-resolved permanence disclosure. Ready for the operator's own read and the explicit merge word per §10/L48.
