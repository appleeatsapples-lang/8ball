# PR #217 pre-merge cross-model audit — reconciled response

**PR:** 8ball #217 — comprehension hint + fix the #213 panel self-close regression
**Base → head:** `27b6fcc` → `7a0b631` at audit start. One lane's LOW landed
mid-audit (`aa7bd78`); the second lane re-based its line numbers to that head
and flagged the mid-run push as a §10 lane-collision hazard — noted below and
owned. The remaining findings land in the reconciliation commit carrying this
artifact.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the CC
lane. Both lanes served BOTH trees in Chromium and independently reproduced
the #213 P1 on untouched base; one lane additionally instrumented a shadow
MutationObserver with the identical config and filter and dumped every real
delivery on both open and re-render paths.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | SAFE TO MERGE | 1 (1 LOW) |
| Lane B | MERGE WITH FIXES | 9 (3 MED, 4 LOW, 2 NIT) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The P1, independently confirmed by both lanes

On base `27b6fcc` (current production main), every compartment tap renders
`open:false, inert:true, aria-hidden:"true", max-height:0` while the panel
body holds 100–215 chars of real prose — the panel writes into an invisible,
inert box. Shipped in #213: its observer watches the card-face subtree and
`openFor`'s own textContent writes fire the delivery microtask's `close()`.
Lane B's shadow-observer dump proved the fix's premise empirically: panel
opens emit 5–6 records ALL inside the panel; real re-renders emit records ALL
on coordinate spans outside it; no production path mixes them; `close()`
emits no observed records (no loop). §1.D v0.52's interaction minimum was
silently unmet in production from #213 through #216. Journal-only is the
right doctrine posture — no clause changed; the clause's contract is
RESTORED. The deploy is the remedy, not the risk.

## Findings and dispositions

**MED 1 (Lane B) — the hint was below the fold on the t3 sheet.** Appended
last it sat at DOM index 15, ~190px below the fold at 390×844 — off screen
for the tier with the most compartments to explore, and retired on first tap
so it might never be seen. **Landed:** inserted before `#card-entry` (with an
append fallback when that block is absent); placement pinned behaviorally
(reverting to append fails); live-fire shows it in viewport at free AND t3.

**MED 2 (Lane B) — the copy promised what sealed compartments do not
deliver.** Ten of fourteen free-tier compartments open a status, not a
"filed meaning". **Landed:** mechanism-true copy — `each compartment opens —
tap any value` — with the canonical voice-register scans kept on the new
string.

**MED 3 (Lane B, mutation-proven) — the filter's `every()` was unpinned.**
`every→some` (fail-open — the exact #213 class returning on any future mixed
delivery) survived the entire 1994-test suite. **Landed:** a mixed-delivery
pin — one self-noise record plus one real one must close; the mutant now
dies.

**LOW 4 (Lane B) — the `r.target === hint` clause was unreachable dead code
with a comment presenting it as load-bearing.** Hint mutations are
attribute-only and the config observes none. **Landed:** clause deleted,
comment corrected to say exactly that.

**LOW 5 (Lane B) — the older stale-close pin only exercised a delivery shape
real browsers never produce.** **Landed:** it now drives a realistic
non-empty records array first, then the bare fire as a separately labelled
fail-safe assertion.

**LOW 6 (Lane B, mutation-proven) — `hint.className` was unpinned.**
**Landed:** pinned; the deletion mutant dies.

**LOW 7 (Lane B) — `try another` leaves an open panel behind in the hidden
result screen.** Present on base too but masked by the blanket close.
**Accepted via the lane's own cheapest option and named in the journal:**
`display:none` removes it from the a11y tree and focus order, and the next
submit's render records close it — self-correcting, no user-visible state,
no new wiring.

**LOW (Lane A) — the hint was announced to AT redundantly.** Every cell
already carries `role="button"` + an aria-label, and the card face is a
polite live region. **Landed** (mid-audit, `aa7bd78`): `aria-hidden="true"`
on the hint, pinned.

**NIT 8 (Lane B) — `ui/experience.css` was outside the absent-from-host
scan.** **Landed:** joined the `not.toMatch(/meaning-hint/)` union.

**NIT 9 (Lane B, process) — no artifact yet, and the branch tip moved during
the audit.** This file is the artifact. The mid-audit push is owned as a
relay-process defect: a stop-hook-prompted commit of the first lane's fix
landed while the second lane was reading the tree. The second lane re-based
and its findings were unaffected, but future relays should hold pushes until
both lanes report.

## Reconciled verification (post-fix head)

- Suite 57 files / 1994 tests green; product audit PASS, 0 blocking.
- Nine mutants killed across the change: hint never retires, injection
  dropped, [hidden] guard dropped, second-person copy, observer filter
  removed (the #213 shape), observer never closes, every→some, className
  dropped, placement reverted to append; plus aria-hidden dropped.
- Live-fire: hint in viewport at free and t3 with the new copy; panel opens
  to its real box and stays open; hint retires on first open and stays
  retired; shake-again still closes a stale panel; zero page errors.
- Claims re-verified by the lanes: `index.html` byte-unchanged, no DOCTRINE
  or content touch, no storage surface added, the hint absent from the share
  PNG and caption, all originally claimed mutants genuinely killed.

qualifier: recorded, not certified. Merge authority remains the controller's.
