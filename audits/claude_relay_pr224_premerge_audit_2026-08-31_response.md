# PR #224 pre-merge cross-model audit — reconciled response

**PR:** 8ball #224 — desktop layout pass: the t3 rail's $6 offer was below
the fold; the rail goes top-aligned + sticky
**Base → head:** `7a5df07` → `2b582b0` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review. Both lanes drove
the real app on base AND head worktrees, byte-verifying the tree their
server actually served (the prior audit's port-collision lesson, applied).

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 P2, 3 P3 |
| Lane B | MERGE WITH FIXES | 1 MED, 1 LOW + a brief-premise correction |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The change, verified sound — and its base defect broader than claimed

Both lanes reproduced the base defect exactly (`#dyad-offer-link` at
~730–739px against a 720px fold at t3) and found it BROADER than the PR
claimed: t5 and revealed-label states clip too, including `#forget-btn`
below the fold at three viewports in free-revealed. The head fix holds
across every viewport × state driven (one lane: 6 × 6, 36 runs, zero
failures): all eleven rail controls in-fold, sticky docking clean at full
scroll with no feedback/footer/banner/modal overlap and no scroll trap
even at 720×480, mobile byte-identical across nine base/head pairs, and
the +3 suite delta exact.

## Findings and dispositions

**F1 (Lane A P2; Lane B LOW from the other end) — the sticky offset
double-counted the topbar.** `top: calc(var(--topbar-height) + 24px)`
resolves against the BODY scroll container (`html { overflow-x: hidden }`
keeps body the scroller) whose padding-top already clears the fixed bar —
so the shipped rule parked the rail 64px below its intended line (152 vs
the card's 88; sticky disabled measured 88, meaning sticky was pushing
the rail DOWN), the rule's own "matches the card top" comment was false,
and at 150% browser zoom on a 1280×800 display (853×533 CSS px, still
≥720 wide) the $6 offer fell below the fold — the exact defect under
repair. **Landed:** `top: 24px`; live-fire verified — rail = card top at
load (88=88), stuck at 88 across a 400px scroll, and the zoom case
in-fold (offer 422–478, note 486–506 in a 533px viewport). The dead
`56px` var fallback (the `:root` value is 64px) went with the calc.

**F2 (Lane A P2; Lane B MED independently) — the first-cut pins tested
presence, not cascade.** A later `#result .result-rail { align-self:
center; position: static; top: auto }` restored the full defect with all
pins green and render-verified below-fold; a double-spaced selector, a
child combinator, a bare-class selector and a shell `display: flex →
block` dodge all rode green too. **Landed:** the pins are rebuilt
cascade-aware — selector whitespace normalized, ANY selector shape naming
the element matched across BOTH host stylesheets, and every declaration
of the guarded properties must carry the contract value (`position:
sticky`, `align-self: flex-start`, `top: 24px`, `align-items:
flex-start` only, shell `display: flex` pinned). Six dodge mutants now
die, mutation-verified, on top of the original three.

**F3–F5 (Lane A P3, record) — all corrected in the journal and the
rule's comment:** the rail's tallest-tier figure (~485px with status
lines, not ~420); the false "the free tier escaped" claim (see the
broader base defect above); the pin over-breadth concern resolved by the
rebuild (value checks rather than blanket bans, so a legitimate
mobile-scoped rule cannot false-positive).

**Brief-premise correction (Lane B), owned by the relay:** the audit
brief asserted `--topbar-height` is unset at ≥720; it is defined at
`:root` as 64px. The lanes verified against the real cascade rather than
the brief's premise — which is what the briefs ask for.

## Reconciled verification (post-fix head)

- Live-fire: rail/card alignment and stick-through-scroll at 1280×800
  t3; the 150%-zoom case in-fold; full-scroll dock clear of the feedback
  block at 1280×720; the six-viewport fold audit re-run clean (every
  offer/share control in-fold wherever it renders); mobile unchanged.
- Nine mutants killed across the PR (the original three + six dodges),
  every restore byte-verified.
- Suite 57 files / 2011 tests green; product audit PASS, 0 blocking;
  PII scans clean; CLAUDE.md counts unchanged.

qualifier: recorded, not certified. Merge authority remains the controller's.
