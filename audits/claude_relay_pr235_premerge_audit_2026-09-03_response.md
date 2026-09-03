# PR #235 pre-merge cross-model audit — reconciled response

**PR:** 8ball #235 — DOCTRINE v0.76: the paired sheets' labels and
derivation surface — the dyad's thirty compartments open
**Base → head:** `8e6e604` → `7b702ad` at audit start; every finding
lands in the reconciliation commit carrying this artifact — no
mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review — the
mandatory cross-model read for a DOCTRINE-touching PR; per-lane
subdirectories and port bands; both lanes worked from their own clones
and left the working tree untouched (verified `git status` clean).
Both lanes drove the host and the paired screen in Chromium; Lane A
diffed the host panel's live output against the base at 390 and 1440.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 1 HIGH, 4 MED, 7 LOW; 26 mutants, 19 killed |
| Lane B | MERGE WITH FIXES | 2 HIGH, 1 MED, 2 LOW; 15 mutants, 11 killed |

**Reconciled outcome: MERGE WITH FIXES — the product claims held on
both drives (the host panel byte-identical to the base in markup,
attributes and all fifteen readings; every paired compartment reads the
tapped sheet in its own context, thirty of thirty, on a pair built to
differ on every partner; the labels loop in both directions at four
widths). The fixes were one privacy defect both lanes reproduced —
hidden is not deletion — one inherited Escape-order defect the PR had
copied onto a second surface, a storage-denied latch, a stale storage
claim, and the interaction pins the suite never drove. All landed.
Final call remains with the controller per L48 (no advance
authorization covered this pass).**

## The product claims, cleared by driving

- Host regression: `buildPanelMarkup('meaning')` is byte-equal to the
  literal it replaced; the live host panel's innerHTML, attributes, the
  fifteen cells' a11y tuples and the full eight-field output for every
  coordinate are identical base vs head at 390 and 1440; docked pane at
  ≥1100 unchanged; zero page errors.
- Paired correctness: an adversarial pair sharing a life path but
  differing on every partner reads two different contexts; a thirty-of-
  thirty in-page cross-check against `panelDetailFor` over each sheet's
  own values shows no mismatch; arcana split, pillar `animal · element`,
  unresolved copy, the context label and the filed relation all read the
  tapped sheet.
- Labels: one key, allow-list unchanged, applied on open and render,
  both sync directions live (paired toggle → host; host toggle → open →
  sheets), copy and `aria-pressed` parity, titles visible at 320 / 390 /
  720 / 1440 on both sheets, no overflow.
- Shape: index.html 646; module and test-file counts unchanged; no
  dependency, fetch, key or jsdom.

## Findings and dispositions

**HIGH (both lanes) — the paired panel's text survived a close.**
`closePairedPanel()` removed `.open`, set `inert`/`aria-hidden` and
dropped the active cell, but never blanked the panel's text nodes, so
person B's first name and reading stayed in live DOM across a close, a
re-open and a fresh pair with a third person — while every other node
was correctly cleared, and while the amendment stated the opposite.
Fixed: a close blanks the six text nodes and hides the two heads
(`blankPairedPanel`, derived from a constant list, the sheet's own
clear-list shape); pinned by a test that names any panel node still
carrying B's name after a close, a re-open and a third pair, and by a
live-fire that searches the paired screen's text for the name. The
amendment sentence now states the mechanism. The host panel carries
the same gap for the device owner's own label and reading only —
recorded as a follow-up, not widened here.

**HIGH (Lane B) / MED-2 (Lane A) — the Escape modal guard never held.**
`ui/modals.js`'s bubble-phase Escape handler registers first at boot and
strips `.open` before a later bubble handler sees it, so one keystroke
closed the modal AND the panel, and the modal's focus restoration was
clobbered. Pre-existing on the host (Lane A verified on the base); the
PR copied the pattern and re-asserted the guarantee. Fixed on both
surfaces with a capture-phase listener — the one host-behaviour change
this PR makes, named in the amendment — and the paired listener is bound
once per document. Live-fired: with a modal open, Escape closes the modal
only and focus returns to the opener; a second Escape closes the panel.

**MED-3 (Lane A) / MED (Lane B) — Escape was untested.** The harness's
document had no `addEventListener`, so the listener was never attached
under test and two mutants survived. Fixed: the harness records document
listeners with their capture flag and can fire Escape under a document
with or without an open modal; tests pin capture, the modal yield, the
close, the focus return and the no-op with nothing active.

**MED-4 (Lane A) — a one-way latch when storage writes are denied.** The
paired toggle derived its next state from storage, so a device that
refuses `setItem` could turn labels on and never off. Fixed: `next`
comes from sheet A's own class, as the host derives it from `#card-face`;
pinned under a throwing `setItem`, live-fired the same way.

**MED-1 (Lane A) — a stale storage claim.** §1.J and the module header
said the dyad reads and writes no storage; since this PR it reads and
writes the one labels preference through `ui/labels.js`. Both carry the
correction (a dated marker in DOCTRINE, the header rewritten).

**LOWs.** Focus return on close pinned (Lane A LOW-1). `panelDetailFor`
never reads the sheet on the sealed/unresolved branches — pinned with a
counting reader; `coordinateLabel`'s fallback pinned (Lane B). The
document listener no longer stacks on a re-entered init (Lane A LOW-5).
Recorded, not changed: the paired sealed branch is unreachable at the
free ceiling (Lane A LOW-2; the host's is the same); the 44px tap target
grows each paired sheet by roughly a fifth, the same growth the host
sheet took when its cells became interactive (LOW-4, now stated in the
journal); the host panel stays open, non-inert, behind the paired screen
and a paired-screen Escape now closes it too (LOW-6 / Lane B) — a
follow-up for the controller, not widened here; the two heads' hidden
flags are set on open and reset on close.

**Recorded process note (Lane B, disclosed by the lane):** its first
mutant pass used an invalid vitest reporter flag that failed every run
before any test ran; the lane caught it and re-ran all fifteen without
the flag. The table in its report is the corrected one.

## Reconciled verification (post-fix head)

- Suite 61 files / 2086 tests green; product audit PASS, 0 blocking.
- Mutation re-run against the new pins: close without the blank, the
  paired Escape at bubble phase, the paired modal guard removed, the host
  Escape at bubble phase, the toggle deriving from storage, close without
  the focus return, `readSheet` called on the sealed branch — all killed.
- Live-fired at 390: host and paired Escape with a modal open close the
  modal only; the paired panel blank after Escape, after back, and across
  a third pair (the second person's name absent from the screen's text);
  the storage-denied toggle flips on and off.
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red
  by design until this artifact; this file satisfies both; journal-touch
  already passed.

qualifier: recorded, not certified. Merge authority remains the controller's.
