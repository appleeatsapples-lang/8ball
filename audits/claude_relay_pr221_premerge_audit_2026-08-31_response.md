# PR #221 pre-merge cross-model audit — reconciled response

**PR:** 8ball #221 — 320×568 design pass: the short-viewport submit goes
sticky (pr208 F8)
**Base → head:** `5349bdf` → `63f6bce` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the
CC lane. Both lanes live-fired base AND head trees in Chromium from scratch
worktrees, ran their own mutants beyond the claimed three, and swept
boundary geometries.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | DO NOT MERGE | 11 (2 P1, 2 MED, 7 LOW/NIT/INFO) |
| Lane B | MERGE WITH FIXES | 3 (1 MED, 1 LOW, 1 NIT) + a process note |

**Reconciled outcome: the DO NOT MERGE was earned — the design is
REDESIGNED, not patched, and every fix-class finding landed; verified
below. Final call remains with the controller per L48.**

## Findings and dispositions

**P1 F1 (Lane A) — unbounded sticky intercepted taps meant for the form's
own inputs.** `position: sticky; bottom: 0` has no upward bound short of
the form's top edge, so below ~512px of viewport height the stuck opaque
button rode over the time/birthplace inputs: `elementFromPoint` at the
birthplace field's centre returned the button, and a real click there
SUBMITTED THE FORM (head) where base focused the field. That is the fixed
circle's original sin back in a new shape, in exactly the chrome-reduced
band the PR's own journal cited as motivation; the `aria-expanded`
withdraw cannot help because the occlusion bites before the listbox can
open. **Landed as a redesign:** sticky now lives in its own
`(min-height: 520px)` band — clear of the measured ~512px worst-case
interception ceiling — and below it the previous static in-flow shape is
the floor (recoverable by scroll, never an occluder). Re-verified by a
53-geometry live-fire sweep: 28 sub-band geometries static with zero
interception on any input centre, 25 band geometries sticky, on-screen
and interception-free, and the lane's exact 320×480 reproduction now
focuses the birthplace field instead of submitting.

**P1 F2 (Lane A) — the diff deleted the previous journal entry's
heading,** orphaning a shipped entry's body in an append-only log — the
second occurrence of this defect in one session (the first was caught by
self-review). **Landed:** the heading restored (as `SHIPPED (#220)`), and
the journal records the process lesson: stop editing the journal head by
string-replacing the previous heading.

**MED F3 (Lane A) / MED (Lane B, independently) — the new pins were
dodgeable in the file's own documented failure class.** Lane B reordered
the two media blocks (no content change) and reverted live behavior with
all pins green; Lane A kept the whole suite green through a later
duplicate rule, a duplicate media block, and `overflow: hidden` on
`#profile-form` (computed position still "sticky", behavior dead).
**Landed:** a file-wide inventory pin — every `#enter-btn` position
declaration, exactly `[fixed, static, sticky, static]`, cross-checked via
two independent scans — plus source-order assertions on the three blocks
and an overflow/contain guard on the button's inner ancestor chain
(html/body excluded deliberately: their `overflow-x: hidden` is the page
scroller sticky rides on). Six dodge mutants now die, mutation-verified:
block reorder, stale-block duplication, appended second rule, form
overflow, polar-escape deletion, band sticky revert.

**MED F4 (Lane A) — the stuck button fully occluded `#polar-message`,**
the only signal that rising could not be computed, with no live-region
fallback. **Landed:** a
`#profile-form:has(#polar-message:not([hidden])) #enter-btn` escape
inside the band returns the button in-flow while the notice shows.
Live-fire verified with a real arctic pick at 320×568: notice shown and
unoccluded, button static; pinned, and the deletion mutant dies.

**LOW (Lane B) — the stuck button covers the tail of the birthplace
hint** until scroll or dock. Non-interactive text, revealed by the same
scroll that was previously the only way to find the submit itself.
**Recorded as a decided exposure in the journal, controller's to
overrule.**

**F5–F10 (Lane A, LOW/NIT/INFO), all landed or recorded:** the "43 of
48px" figure measured the hidden state's translateY (real revealed
figure ~31px) — corrected in journal, comments and PR body; the focus
ring clipped at the viewport edge — fixed by the 2px floor in
`bottom: max(2px, env(safe-area-inset-bottom, 0px))`; `env()` inert
without `viewport-fit=cover` — kept for parity with the fixed circle's
identical use, now said honestly in the comment; the inert
`right/left: auto` neutralizers and their wrong "inherited" justification
— dropped entirely; 400×640 "nothing moves" — softened to
behaviorally-identical (sub-pixel antialiasing deltas); landscape
short-and-wide viewports sit in neither mobile branch — pre-existing
shape, unchanged by this PR, noted.

**NIT (Lane B) / F11 (Lane A) — no artifact on the branch.** This file
is the artifact.

**Process note (Lane B), recorded:** the port assigned to that lane was
already bound by a concurrent process serving stale content, briefly
producing a false reading before the lane switched to verified-free
ports and re-ran everything. Future briefs should have lanes verify
port ownership before measuring.

## Reconciled verification (post-fix head)

- Live-fire: 53-geometry sweep with zero failures and zero page errors
  (sub-band static/no-interception, band sticky/on-screen/no-
  interception, tap-birthplace-focuses at 320×480, polar escape, the
  withdraw/return/submit-from-stuck flow, 390×844 fixed circle
  untouched).
- Nine mutants killed in total across the change (the original three
  plus the six dodge-class ones above).
- Suite 57 files / 1999 tests green; product audit PASS, 0 blocking;
  palette/privacy/PII scans clean (both lanes).
- Both lanes' cleared lists stand: docking on the body scroller,
  480/680 boundary values, halo pointer-through, suggestion-list
  stacking above the button, modal stacking, repo-shape counts.

qualifier: recorded, not certified. Merge authority remains the controller's.
