# CODEX PRE-MERGE AUDIT PACKET — PR #127 (ownership pricing v2: $1/$2/$3, purchases permanent, free surface open) — 2026-07-26
#
# Operator fire line (from any terminal):
#   cd ~/dev/8ball && git checkout claude/pricing-model-1-2-3 && \
#   ~/ai-relay/relay --models codex --base origin/main \
#     "$(cat ~/8ball/audits/codex_pr127_premerge_audit_2026-07-26_PASTE.md)"
# Paste the verdict back to the orchestrator chat; the orchestrator files it
# on-branch as audits/codex_pr127_premerge_audit_2026-07-26_response.md.

## Who you are and what this is
You are an independent pre-merge auditor for PR #127 of the 8ball
repository (local checkout: ~/dev/8ball,
branch claude/pricing-model-1-2-3, base origin/main @ 4249b0d).
The project is a static single-page divination web app (no backend, no
analytics; Netlify). Layers: index.html · core/ (pure calculation) · ui/
(DOM controllers) · content/ (versioned data) · tests/ (vitest).
Two privacy laws matter especially here: paid-tier ("sealed") coordinate
values must NEVER reach the DOM/share surface below their tier, and
localStorage keys are a doctrine-gated allow-list.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.

## Commercial context (why this PR exists)
The three Gumroad rungs were repriced 2026-07-26: t1 $1 /
t2 $2 / t3 $3 (was $3/$6/$9), and all three listings now promise the
purchase is permanent ("yours for good"). The old code granted +3
credits per purchase, decremented per read, capped free reads at 3, and
debited t3 flips. This PR makes the code honour the listings: a purchase
is the monotonic stored tier and nothing else; renders are unlimited at
every tier including free. DOCTRINE.md moves v0.54 → v0.55.

Setup:
  cd ~/dev/8ball && git fetch origin
  git checkout claude/pricing-model-1-2-3
  git diff --stat origin/main...HEAD   # 1 commit, 13 files, ~ +554/−723

## What the PR claims
- core/payments.js: FREE_TRIES_CAP + CREDITS_PER_PURCHASE deleted;
  nextShakeState({isNew}) → 'render' | 'render-idempotent' only;
  applyPaidReturn({pendingProfile, tier, purchasedTier}) → monotonic
  tier write + optional pending render, NO credits; nextFacetState
  ({facetIndex}) always advances (t3 flip owned); resolveRenderTier and
  the R2 legacy-credits→t3 grandfather UNCHANGED.
- ui/payments.js: TRIES_KEY + getTriesUsed/setTriesUsed/setCredits
  deleted; getCredits survives read-only (feeds R2 via getRenderTier);
  handlePaidReturn persists tier only; consumeFacetShake always
  advances+persists the facet.
- ui/tiers.js: BYTE-UNTOUCHED (the load-bearing claim).
- index.html: paywall CTAs → $1/$2/$3 (hrefs/order unchanged:
  rzqezp/neysyv/xjpvp); title "three rungs · yours for good"; banner
  "rung opened. yours for good."; about-modal "readings are free and
  unlimited" / "one, two, or three dollars"; reads chip deleted; Path A
  (submit-time paywall) deleted — Path B lock-tap is the only paywall
  trigger; boot/submit/shake/openReading all render {tier} only.
  1464 → 1401 lines.
- DOCTRINE.md v0.55: new dated L17-style amendment blocks at §1.D, §1.H,
  §2 (third arcade-toy re-amendment), §4.B, §5, §5.B Call 2, §5.C, §7
  stages 2+6, footer + changelog. Historical/operator-locked text
  claimed untouched.
- tests: payments_state + tiers rewritten to the ownership contract;
  payments_markup / facet_rotation / readings / privacy_scan re-pinned;
  privacy allow-list retires eight_ball_tries_used_v1.
- README.md + 8BALL.md current-state paragraphs reconciled.
- Suite with this branch on main @ 4249b0d: 1360/1360 across 38 files.

## Adversarial checklist
1. DENSITY PERIMETER (load-bearing — brief §D). Verify ui/tiers.js is
   byte-identical to origin/main: `git diff origin/main...HEAD -- ui/tiers.js`
   must be EMPTY. Then verify the four surfaces still prove out in tests
   AND source: TIER_COORDS free/t1/t2/t3 compositions, tierDensitySummary
   (5 of 15 / 10 / 14 / 15), cardEntry at t3 only. Try to construct any
   input where a tier renders a different coordinate set than before.
2. GRANDFATHER R2. Read resolveRenderTier + getRenderTier: legacy
   credits (any positive int, string, fractional) with no stored tier →
   t3, persisted on first detection; a stored tier always wins; credits
   NEVER written anywhere in the diff (grep setItem against the credits
   key repo-wide). The one real $9 t3 buyer must have no downgrade path:
   enumerate every write to eight_ball_tier_v1 and confirm monotonicity.
3. DELETION COMPLETENESS. Grep the runtime (core/ ui/ index.html) for
   any reachable remnant: FREE_TRIES_CAP, CREDITS_PER_PURCHASE,
   tries_used, render-locked, show-paywall, reads chip, credit debit.
   Confirm ?paid=t1|t2|t3 grants no credits, unknown ?paid= values stay
   replay-safe (no tier write, no banner, no query strip), and Path B
   still stages pending before openPaywall.
4. DOCTRINE L17 DISCIPLINE. `git diff origin/main...HEAD -- DOCTRINE.md`:
   every change must be an ADDED dated v0.55 block, an extension of the
   living Table-currency note, the §7 stage notes, or the footer — no
   historical amendment text or operator-locked table cells/prices edited
   in place. Flag any deletion or in-place rewrite of pre-v0.55 text.
5. PRIVACY + SCANNER TRUTH. privacy_scan allow-list: tries key removed —
   confirm no runtime file names it (the scan only covers core/ content/
   ui/ index.html; check those roots yourself, don't trust the list).
   No new localStorage keys, no fetch/XHR/sendBeacon introduced, deck
   gate now reads the tier flag. Run `/bin/bash audits/run_local_audit.sh`
   if the pattern file exists — must be clean.
6. TESTS ARE REAL. Spot-read the rewritten payments_state + tiers suites
   and the re-pins in payments_markup / facet_rotation / readings. Are
   the new pins behavioral, or regex-cosmetic where behavior was
   available? Try to construct a state the old model handled that the
   new suites silently dropped (e.g. corrupt counters, stacked
   purchases, zero-credit t3 flip, fourth-new-pair submit) — each must
   have a v0.55-correct pinned outcome, not a coverage hole.
7. COPY TRUTH. Every user-visible money claim must match behavior:
   paywall ladder, about-modal, banner, README, 8BALL.md. Grep for any
   surviving "$3 / $6 / $9"-as-current, "three free", "three more
   reads", "reads left", or cap language OUTSIDE lineage/changelog
   blocks. A stale price or cap claim is a user-visible falsehood —
   highest severity class in this house.
8. COUNT TRUTH. `ls tests/*.test.js | wc -l` → 38; CLAUDE.md tests/
   line agrees; `npm test` → 1360/1360; index.html ≤ 1500 lines
   (`wc -l index.html` — claim is 1401).
9. STALENESS / CROSS-PR. Open PRs #124 (docs/audit salvage) and #126
   (67 salvaged tests: readings_ui + share_behavior, written 2026-07-24
   against the CREDIT model — e.g. showResult opts carrying
   credits/tries and cap behaviors). If #126 merges after #127, do its
   tests still pass? Name every #126 test that pins retired behavior —
   that interference list is part of the verdict, not an afterthought.

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
Zero findings is acceptable only after you actually ran the checks.
