# CODEX PRE-MERGE AUDIT PACKET — PR #130 (revenue reset: single $3 complete offer, cold-visitor legibility, channel paths) — 2026-07-26
#
# Operator fire line (from any terminal):
#   cd ~/dev/8ball && git fetch origin && git checkout claude/revenue-reset-single-offer && \
#   ~/ai-relay/relay --models codex --base origin/main \
#     "$(cat audits/codex_pr130_premerge_audit_2026-07-26_brief.md)"
# Paste the verdict back to the orchestrator chat; it is filed on-branch as
# audits/codex_pr130_premerge_audit_2026-07-26_response.md (the L48 artifact).

## Who you are and what this is
You are an independent pre-merge auditor for PR #130 of the 8ball
repository (local checkout: ~/dev/8ball, branch
claude/revenue-reset-single-offer, base origin/main @ 969e912).
The project is a static single-page divination web app (no backend, no
client analytics; Netlify). Layers: index.html · core/ (pure calculation)
· ui/ (DOM controllers) · content/ (versioned data) · tests/ (vitest).
Two privacy laws matter especially here: paid-tier ("sealed") coordinate
values must NEVER reach the DOM/share surface below their tier for the
VISITOR'S OWN sheet, and localStorage keys are a doctrine-gated allow-list.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.

## Commercial context (why this PR exists)
The payment path works and has zero outside-customer orders (the one $9
historical order was the operator's own checkout self-test). The cold
first screen and paywall demanded internal vocabulary; the strongest paid
output — the complete written card — was never demonstrated before
checkout; three rungs added choice friction and the $1 rung nets ~$0.07
after Gumroad's direct-sale card fees. The sprint decision: sell ONE
complete $3 offer for 14 days (2026-07-26 → 2026-08-08 inclusive),
presentation-only — DOCTRINE.md moves v0.55 → v0.56 (§4.B amendment with
a named expiry). Entitlement mechanics deliberately do not move.

Setup:
  cd ~/dev/8ball && git fetch origin
  git checkout claude/revenue-reset-single-offer
  git diff --stat origin/main...HEAD   # 2 commits, 9 files (8 + this brief), ~ +430/−68

## What the PR claims
- index.html: paywall = ONE CTA (`paywall-cta-t3`, href
  https://theeightball.gumroad.com/l/xjpvp, "$3", bare URL); heading
  `complete 8ball · $3 once`; body keeps ownership framing + "the highest
  rung bought holds"; NEW collapsed `<details id="paywall-specimen">`
  preview — /cards/spec_no-v.jpg (the already-public 1080×1350 catalog
  sheet) + the SAME fixed cell's written entry (CARDS.aries.dragon:
  name/type/habit/note.mid) filled at boot from the public deck bundle,
  labeled "an example, not your sheet"; NEW result-rail `offer-btn`
  ("open the complete sheet · $3 once", hidden at t3) sharing ONE
  openPurchase() staging function with the lock icon (Path B unchanged:
  setPendingProfile → openPaywall, still the only paywall trigger);
  mechanism strip = plain-English promise (no $ / CTA); title/meta/JSON-LD
  = "8 ball · specimen registry" + plain-English descriptions (≤160 chars,
  clinical, "stored only on your device"); about-modal UNTOUCHED
  (deliberate: it is the disclosure surface and the three-rung disclosure
  stays true). 1401 → 1465 lines.
- netlify.toml: five NEW exact-match, non-forced 200 rewrites — /r /x /ig
  /tt /pin → /index.html — ABOVE the pre-existing /* catch-all; headers
  and cities.json cache rule untouched. Server-log-only attribution per
  DOCTRINE §5 v0.35 (no client event, cookie, pixel, query param).
- core/payments.js, ui/payments.js, ui/tiers.js, content/, core/,
  tests/fixtures.json: BYTE-UNTOUCHED (the load-bearing claim).
- DOCTRINE.md v0.56: ONE new dated §4.B amendment block + footer header
  line replaced + new `- v0.56:` changelog entry. The `- v0.55:` entry
  (including its "STAGED on claude/pricing-model-1-2-3" clause) is NOT
  touched — PR #128 owns that mechanical flip.
- tests: payments_markup re-pinned to the one-offer surface (exactly one
  CTA; rzqezp/neysyv absent from the modal; one dollar figure; specimen
  labeling; offer wiring) + NEW retained-ownership describe (t2 return
  persists t2; t1 + ?paid=t3 upgrades; t2 + ?paid=t1 never downgrades);
  prose_coordinate_count meta pin "paid rungs" → "$3"/"complete"; NEW
  tests/channel_routes.test.js (dependency-free TOML walk: rule shape,
  order above catch-all, non-forced, no query/conditions/headers, no
  repo-root entry shadowing a channel path, catch-all intact).
- CLAUDE.md: tests count 40 → 41; index.html line count 1464 → 1465.
- journal.md: new top entry (v0.56, STAGED), including the overdue
  next_analytics_read flag and the ops-desk APPROACH.md sales-sprint
  amendment note (that file lives outside this repo).
- Suite on this branch: 41 files / 1438 tests green (main: 40/1436).
  Local PII audit clean (243 files). Browser pass 37/37 via headless
  Chrome + `netlify dev` (evidence on the ops desk:
  ~/8ball/audits/browser_pass_revenue_reset_2026-07-26/).

## Adversarial checklist
1. ENTITLEMENT PERIMETER (load-bearing). `git diff origin/main...HEAD --
   core/ ui/ content/ tests/fixtures.json` must be EMPTY. Then prove the
   t1/t2 compatibility claims from source + tests: ?paid=t1|t2 still
   persists those tiers; maxTier monotonicity; R2 legacy-credits→t3
   grandfather; a stored t1/t2 device still renders its owned density
   (TIER_COORDS untouched). Try to construct any state where hiding the
   t1/t2 CTAs changes what an EXISTING buyer's device renders.
2. PREVIEW LEAK SURFACE. The specimen preview must be CONSTANT: verify
   the fill code reads only CARDS.aries.dragon (never the visitor's
   profile/tier/facet); verify the visitor's own #card-name/#card-habit/
   #card-note stay EMPTY below t3 (v0.37 DOM purity unchanged); verify
   the share path (ui/share.js reading shareRowRefs from #card-face)
   cannot serialize the specimen nodes (they live inside the paywall
   modal, outside #card-face). Then judge the doctrine question directly:
   is rendering one fixed public-bundle cell on the purchase surface
   consistent with §5.C's source-visible posture + the §4 carve-out
   (content strings live only in content/cards.v1.full.js — confirm no
   card-content STRING was added to index.html or any other tracked file)?
3. SINGLE-OFFER TRUTH. Grep index.html for rzqezp/neysyv — must be absent
   entirely. Exactly one .modal-cta. The offer button and lock icon share
   ONE setPendingProfile→openPaywall sequence (payments_markup pins it at
   exactly 1 occurrence — verify the pin is real, not satisfied
   accidentally). Confirm ?paid=t2 manual entry still works end-to-end
   (trust-based return, §5.C v0.55 — the sprint must not orphan it).
4. CHANNEL ROUTES. netlify.toml: five rules exact-match, non-forced,
   status 200, ABOVE /* (Netlify first-match-wins); no force=true; no
   query/conditions; no repo-root file/dir named r/x/ig/tt/pin (which
   would shadow silently). Confirm zero client-side attribution: no JS
   reads location.pathname for channel purposes, no new query param, no
   cookie. Confirm the paid return (/?paid=tN at root) and share caption
   (hardcoded bare production URL in ui/share.js) are unaffected by a
   visitor sitting on /r. Judge tests/channel_routes.test.js: behavioral
   or regex-cosmetic?
5. DOCTRINE L17 DISCIPLINE. `git diff origin/main...HEAD -- DOCTRINE.md`:
   additions only — the §4.B v0.56 block, the replaced footer header
   line, the new `- v0.56:` entry. No historical amendment text,
   operator-locked table, or the `- v0.55:` entry (PR #128's flip target)
   edited. The amendment must carry the window AND the expiry
   (2026-08-08, auto-lapse unless renewed) — flag if the revert path is
   vague. Cross-check the amendment's claims against the actual diff.
6. COPY TRUTH. Every user-visible money claim must match behavior:
   "$3 once" / "permanently, for every reading on this device" / "the
   highest rung bought holds" / meta "$3 opens the complete sheet, for
   good". The about-modal still says "one, two, or three dollars" — the
   PR argues this stays TRUE (t1/t2 remain live products + honored
   returns) and that the about modal is disclosure, not offer. Judge that
   argument adversarially: is any surface now a user-visible falsehood in
   either direction? Acceptance test: can a cold visitor answer (a) what
   does 8ball do, (b) what will I receive, (c) what does $3 unlock,
   (d) is it permanent — within one screen + one paywall interaction,
   all four true?
7. SCANNER TRUTH. No allow-list widened: privacy_scan FORBIDDEN +
   LOCALSTORAGE_KEY_ALLOW byte-unchanged; pii_scan DOCTRINE_ALLOW
   byte-unchanged; no new localStorage key, fetch/XHR/sendBeacon, or
   third-party anything. reach_surface pins hold: meta description ≤160,
   clinical (no magic/predict/future tokens on the indexable head),
   JSON-LD parity. mechanism-strip pin holds (no $/CTA on the cold
   screen). Run `/bin/bash audits/run_local_audit.sh` if the pattern
   file exists — must be clean.
8. COUNT TRUTH. `ls tests/*.test.js | wc -l` → 41; CLAUDE.md tests/ line
   agrees; `npm test` → 1438/1438; `wc -l index.html` → 1465 (≤1500).
9. STALENESS / CROSS-PR. PR #128 (claude/doctrine-v055-footer-flip)
   flips the v0.55 footer entry's STAGED clause and files its own L48
   artifacts. Verify PR #130's DOCTRINE diff does not touch that line
   (adjacent-line rebase only, whichever merges second). Also confirm
   nothing in #130 pins the OLD three-CTA ladder anywhere that #128 or a
   later revert would trip. Name any interference; the list is part of
   the verdict, not an afterthought.

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
Zero findings is acceptable only after you actually ran the checks.
