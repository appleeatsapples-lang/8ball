# PR #237 pre-merge cross-model audit — reconciled response

**PR:** 8ball #237 — DOCTRINE v0.78: the host panel closes when the paired
screen opens
**Base → head:** `d8d86d1` → `66f176a` at audit start; every finding lands in
the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane
subdirectories and port bands; both lanes worked from their own clones and
left the working tree untouched. Both live-fired at 390 and 1440; Lane A also
drove the base at `d8d86d1` on a third port for side-by-side comparison.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 4 MED, 4 LOW; 24 mutants, 20 killed, 4 real survivors |
| Lane B | MERGE WITH FIXES | 1 MED, 1 LOW; 10 mutants, 10 killed (6 source-shape only) |

**Reconciled outcome: MERGE WITH FIXES — no functional defect in either lane.
The timing question this audit was briefed to lead with came back clean from
both, measured on frame timelines rather than end states. Every fix was record
accuracy or test coverage. All landed. Final call remains with the controller
per L48 (no advance authorization covered this pass).**

## The timing question, answered

The brief made this the priority because #236 had just made `close()` defer its
blank 300ms, and v0.78 calls `close()` immediately before the dyad takes the
screen. Both lanes drove it with real wall-clock timing rather than end-state
checks:

- `#result` becomes `display:none` in the SAME task as the class removal, so no
  frame ever renders a collapse; the pending blank fires ~300ms later against
  nodes that can only live inside `#card-face` or `#reading-pane`, both inside
  `#result`.
- Returning inside the window (measured at 40 / 100 / 150 / 290 / 400ms, at both
  widths): no flash, no half-blanked frame, no stale reading restored. On base
  at the same instant the panel came back OPEN — which is what this PR removes.
- Reopening a compartment inside the window: the fresh reading survives past the
  original deadline; `openFor`'s cancel genuinely covers the path, and there is
  no dead first tap.
- Opening the dyad twice inside 300ms: each entry reschedules; the stale text
  lives in a `max-height:0; overflow:hidden` box — invisible, no layout change.
- The deferred blank cannot trigger the card observer (it early-returns on a
  null `activeCell`, which `close()` has already nulled).

## Findings and dispositions

**MED (Lane A) — the v0.78 amendment paragraph did not exist.** The rebase onto
the merged base rewrote the docs and produced the closure marker, the footer and
the changelog line, but not the amendment body. §1.E's normative text therefore
ended with v0.77's "still open for the controller" followed by a marker pointing
at "the amendment below", which was §1.F. Every prior bump in this chain wrote
one. Written now, carrying the footer's substance plus the structural fact and
the scope note below.

**MED (Lane A) — the consistency argument was half-true.** `ui/readings.js` also
hides `#result` (`openPage`/`closePage`) and still restores the host panel open,
so "returning lands on a sheet, not on a reading opened a screen ago" held for
the paired screen only. Lane A live-fired it: open a compartment, go to previous
readings, come back — the panel is open with its reading intact. The claim is
narrowed to the paired screen in both the amendment and the footer, and the
readings case is named as open work for the controller rather than widened into
unasked. (Noted in passing: the readings path already restores focus to its own
opener, which is the hygiene the dyad exit lacks.)

**MED (Lane A) — the dyad root focus was pinned by nothing.** Deleting
`_root.focus({preventScroll:true})` survived all 2097 tests; live-fired, the
screen presents with focus on `<body>`. v0.78 is precisely what makes it
load-bearing: `close()` parks focus on a cell that index.html hides on the very
next statement, and that one line repairs it. Pinned, and the dependency is now
written into the amendment.

**MED (Lane A) — `onExit` was never asserted to be called.** Deleting the call
from the back handler survived all 2097 tests, and with it pressing back leaves
every screen hidden — a blank app, CI green. The PR had added the symmetric
`onOpen` pin and stopped one line short. Pinned.

**LOW (Lane A) — `close()`'s unconditional contract was unpinned.** An early
return when nothing is open survived; v0.77's own comment claims unconditional
and index.html now calls it on every dyad entry. Pinned.

**LOW (Lane A) — `onOpen` was not pinned to fire only when the dyad will
open.** Hook-before-guard survived: at a non-entitled tier it would close the
host panel and hide `#result` while `open()` refuses. Unreachable under the free
ceiling, hence LOW, but v0.78 gives the mis-ordering a second destructive
effect. Pinned across all four lower tiers.

**MED (Lane B) — the journal narrated an eventual state as an immediate one.**
The live-fire line read "open the dyad → panel `open:false`, `inert:true`, body
length 0". The first two are same-task; the body only reaches 0 when v0.77's
300ms deferral fires, and the probe had read at T+500ms. No user-visible
consequence — the panel is already collapsed and transparent — but inaccurate in
an append-only record, and pointed, since that same entry credits catching the
#236 HIGH to distrusting end-state checks. Corrected, with the correction stated
rather than quietly rewritten.

**LOW (both lanes) — recorded, not fixed: the index.html half is pinned by
source shape only.** Its four kills all come from one literal regex over
index.html, and Lane A demonstrated two equivalent mutants it false-kills (same
statement in double quotes; same statement extracted to a named function).
§12's no-jsdom rule makes a composed end-to-end test unavailable, so this is a
limit to state, not a gap to close. The dyad half is genuine behavioural
coverage — the harness test drives the real module and kills hook-swallowing,
reveal-before-hook and double-call mutants.

**Also verified, no change needed.** The structural claim is true and stronger
than stated: `mountPanel` can only target `#card-face` or `#reading-pane`, both
inside `#result`, so the panel cannot be outside it at ANY width, not merely the
two measured. The dropped third test was correctly dropped — both lanes
independently confirmed #236's pin calls the real handle from the live init and
covers close, focus, idempotence and the deferred blank. Focus lands on the dyad
root at both widths with no trap and no scroll jump. The double-Escape
retirement is real, verified against base. Shape is clean: index.html 647,
counts unchanged, no dependency, fetch, key or jsdom. Pre-existing and unchanged
by this PR: returning from the dyad leaves focus on `<body>`, on branch and base
alike.

## Reconciled verification (post-fix head)

- Suite 61 files / 2100 tests green; product audit PASS, 0 blocking.
- Lane A's four surviving mutants re-run against the new pins — all four killed
  (root focus deleted; back not calling `onExit`; `close()` early-returning;
  `onOpen` before the entitlement guard).
- Gates: the `test` job's DOCTRINE-artifact leg and `l48-gate` were red by
  design until this artifact; this file satisfies both.

qualifier: recorded, not certified. Merge authority remains the controller's.
