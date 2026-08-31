# PR #222 pre-merge cross-model audit — reconciled response

**PR:** 8ball #222 — class-parity differential: host vs dyad-sheet register
classes, runtime-derived
**Base → head:** `5aeb392` → `b4ecb6a` at audit start; every finding lands
in the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the
CC lane. Both lanes reproduced every claim in scratch worktrees (one lane
ran 24 sha-verified mutant/probe cycles), swept every CSS source for the
hook-class exclusion's soundness, and verified the capture re-init claim by
instrumentation and order-shuffled runs.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 7 (2 MED, 2 LOW, 1 NIT, 2 INFO) |
| Lane B | MERGE WITH FIXES | 3 (1 MED, 1 LOW, 1 NIT) + a process note |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The differential, verified sound by both lanes

Non-vacuous in every direction attacked: all six claimed mutants die at
head; the emptiness guard bites; both regex parsers fail CLOSED on host id
reorder, sheet attribute reorder, and host class reorder alike; no other
stylesheet keys presentation on the excluded kua hook classes (full sweep
of shell.css, experience.css, every injected ui/*.js style, and
index.html), so the hook exclusion plus the style-companion contract is
sound; module state after the captures is clean (probes assert the kua and
public renderers return null; order-shuffled, multi-file and full-suite
runs agree). Suite 57 files / 2002 tests at audit head, product audit
PASS 0 blocking, assurance suite 104/104, tests+journal-only confirmed by
diff stat, CLAUDE.md count lines still true.

## Findings and dispositions

**MED (both lanes, independently, live-proven) — five presentation-bearing
shared classes could drift on the sheet with the full suite green.**
`public-title` and `kua-title` sat in the register vocabulary with no pair
reaching them (they carry no id and no data attribute), and
`card-prose-rule`, `coord-val`, `coord-seal` were equally unguarded — all
five are keyed in shell.css/experience.css/the injected kua style, and the
first pair keys the labels-reveal visibility toggle, so a sheet-side
rename would leave the dyad's "DOMAIN FIT"/"KUA" titles permanently hidden
with nothing catching it. **Landed:** a structural-class test — per-class
count parity over the combined runtime host surface (shipped card face +
the two runtime-appended blocks) against the sheet markup, with a
vacuity guard, plus title-label TEXT parity. Five new mutants die,
mutation-verified: both title renames on the sheet, a dropped prose rule,
a coord-seal rename, and a host-side label drift.

**MED (Lane A, F1) — the six-mutant claim overstated the NEW kill power.**
Three of the six (the sheet-side F9 revert, the same drift on the host,
the margin rule losing its companion) already die at base, killed by the
tests/kua_surface.test.js source regexes this differential backs rather
than replaces; the new kills were the other three. **Landed:** the journal
now carries the honest split, and with the structural test the change's
total is eleven mutants killed, eight of them new.

**LOW (Lane A, F3) — misattribution.** The journal and test header said
"pr218's F9"; F9 is the pr208 audit's finding, fixed in PR #218.
**Landed:** corrected in both places.

**LOW (Lane A, F4) — "the last named repo queue item is closed" was an
overclaim** (other named non-ordered items remain queued). **Landed:**
softened to name exactly what closed.

**NIT (Lane B) — un-guarded capture results.** A dropped bridge append
crashed the test with a raw TypeError rather than a clean assertion.
**Landed:** both captures are asserted truthy before use.

**LOW/NIT (both lanes, recorded) — the parsers are attribute-order
fragile but fail closed.** Both lanes probed every direction and none
fails silently; the assertion messages now name reordering beside
"missing" so a cosmetic reorder reads as what it is. Recorded, no
structural change — fail-closed is the designed posture.

**INFO (Lane A, F6) — l48-gate red until this artifact lands.** This file
is the artifact.

**INFO (Lane A, F8) — one cold-cache cities.test.js timeout** on a first
full-suite run, gone on three warm runs and clean at base. Not this PR's;
recorded.

**Process note (Lane B), recorded:** a backgrounded product-audit run
overlapping a live mutation briefly produced a stray false FAIL; the lane
caught it, cleaned up, and re-ran on a verified-clean tree. Future briefs
keep audit runs foreground-only during mutation cycles.

## Reconciled verification (post-fix head)

- Eleven mutants killed in total (six original — three of them base-dead,
  as now stated honestly — plus the five structural ones), every one in a
  shipped module and byte-restored after.
- Suite 57 files / 2003 tests green (+4 over base); product audit PASS,
  0 blocking; PII and journal-touch gates clean.
- Both lanes' cleared lists stand: hook-class exclusion sound across every
  CSS source, no cross-file module-state pollution, tests+journal-only
  scope, CLAUDE.md counts true.

qualifier: recorded, not certified. Merge authority remains the controller's.
