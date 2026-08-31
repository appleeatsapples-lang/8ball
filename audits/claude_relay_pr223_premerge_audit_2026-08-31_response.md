# PR #223 pre-merge cross-model audit — reconciled response

**PR:** 8ball #223 — field fix: the mobile flip-stage intrinsic-height rule
is unconditional (iOS in-app overlap)
**Base → head:** `cac1755` → `6b9da9a` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the
CC lane, seeded with the controller's live-device screenshot as the field
evidence. Both lanes live-fired base AND head from scratch worktrees on
ports they verified free first.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 6 (1 P1, 3 MED, 2 LOW) |
| Lane B | MERGE WITH FIXES | 1 (1 MED) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The fix, verified sound by both lanes

The no-op-on-growing-engines claim is proven, not asserted: one lane ran
48 paired base-vs-head geometry measurements (four tiers × three mobile
viewports × four states, zero differences) with byte-identical full-page
screenshots by `cmp`; the other measured 7 viewports × 5 states
numerically identical with sha256-identical PNGs, swept 17 widths
(280→719) confirming the ratio box never wins below 720 (worst margin
208px; 708.28 vs 572.80 at 390 matches the journal's figures), and
verified the $3-offer clearance (112–127px), the 719/720 boundary, no
back-face collapse at any tier or width, dyad/share isolation
(`.flip-stage` reaches no other surface), and all three claimed mutants
dying exactly as stated. Suite, assurance suite and product audit all
reproduce.

## Findings and dispositions

**P1 (Lane A) — this PR's journal entry ATE the previous entry's
heading** — the #222 entry left titleless, its body orphaned inside the
new entry; the third occurrence of the same insertion defect in one day,
the first caught by self-review and the other two only by audit lanes.
**Landed twice over:** the heading restored (`SHIPPED (#222)`), and the
defect class converted into CI — a journal structural guard in
`tests/repo_shape.test.js` pins that no `## ` section carries two
line-anchored entry-body markers, mutation-verified against today's
exact corruption (and the guard's first draft was itself caught by its
own run flagging a mid-sentence prose mention — anchored to line starts,
re-verified in both directions).

**MED (both lanes, different dodges) — the first-draft pins were
vacuous in the file's own documented class.** Lane A appended
`and (min-width: 700px)` to the media prelude — the entire fix disabled
at the exact field viewport, suite green — and rode a decoy-block
variant green too; Lane B reintroduced the field regression through a
descendant-combinator selector the compound-class regex never matched.
**Landed:** the pins now operate on the EXTRACTED media block —
brace-matched from an exact prelude that must run straight into its
brace (no appended condition), all three rules asserted inside it, and
a whole-block token ban on `labels-revealed` covering every selector
shape. Four dodge mutants killed: appended condition, decoy block,
min-height deletion, descendant-shape reintroduction — seven total
across the change.

**MED (Lane A) — `min-height: 0` was unpinned and Chromium-invisible.**
Deleting it left the suite green and Chromium geometry unchanged; only
a pin can hold a WKWebView-load-bearing declaration. **Landed:** pinned
inside the extracted block; the deletion mutant dies.

**MED (Lane A) — the same trap is live on two surfaces this fix does
not reach,** and the first-draft journal read one as a clearance: the
≥720px desktop rail (576px ratio box vs 722px resting / 1041px revealed
content — bites only ≥720-wide embedded WebViews, e.g. iPad in-app) and
the t5 dyad's two standalone sheets (5/8 box vs 804/887px content at
390 wide, driven through the real flow). Neither is this PR's
regression. **Landed as the honest record:** the journal now names both
as the same unfixed trap, QUEUED — the dyad one first in line, since it
breaks the paid screen in the very environment the field report came
from — and the "desktop rail untouched" sentence reworded to claim only
what the diff does.

**LOW (Lane A) — a stale ownership comment** beside the
duplicate-definition scan said the shell "owns" a selector this module
no longer emits. **Landed:** reworded to the rule's real post-fix
meaning.

**LOW (Lane A) — no artifact on the branch.** This file is the
artifact.

## Reconciled verification (post-fix head)

- Seven mutants killed across the change (re-conditioning,
  aspect-ratio: auto deletion, back-face drag, appended media condition,
  decoy block, min-height deletion, descendant-shape reintroduction),
  plus the journal-guard mutant (the eaten heading itself).
- Suite 57 files / 2006 tests green (+3 over base); product audit PASS,
  0 blocking; PII scans clean.
- Both lanes' cleared lists stand: no-op proven to the byte, offer
  clearance exact, boundary and tier sweeps clean, share PNG independent
  of DOM geometry, main checkout untouched by either lane.
- WKWebView remains unrunnable from the container: the counterfactual is
  structural (no sub-720 ratio box exists to under-size), and the
  closing verification is the controller re-checking the deployed site —
  or the Netlify deploy preview — on the reporting device.

qualifier: recorded, not certified. Merge authority remains the controller's.
