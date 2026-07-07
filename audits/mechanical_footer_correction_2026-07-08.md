# Mechanical-edit note — DOCTRINE.md v0.48 footer STAGED→SHIPPED correction

**Date:** 2026-07-08
**Subject:** DOCTRINE.md line 483 (v0.48 footer entry), status clause only
**Classification:** Mechanical edit — no cross-model audit run for this change.

## Why no cross-model audit

§10 lane discipline: "Doctrine amendments go through the auditor before merge.
Mechanical edits do not." §8 gate 6 draws the same line. This edit changes no
doctrine substance, rule, or mechanic — it corrects a stale status clause
("STAGED, not yet audited, not yet pushed, not yet merged") left over from
before the v0.48 change actually merged. The underlying change (§4.A
retirement) already went through its own cross-model audit — Codex + Claude
relay, verdict MERGE WITH FIXES, logged in `journal.md`'s 2026-07-06 entry —
before it merged as `1a70756` (#80). `journal.md` itself was flipped
STAGED→SHIPPED the same cycle (commit `57f35f4`, #81); this DOCTRINE.md footer
line was simply missed at the time.

Direct precedent already on file: the v0.44 footer entry (DOCTRINE.md, line
486) corrects its own stale "audit pending" note in place with the same
reasoning — "this 'audit pending' note was stale in-file and is corrected
here on sighting, not silently."

## What changed

One clause in the v0.48 footer entry: the stale STAGED status line now
reads SHIPPED, cites the actual merge commit/PR (`1a70756`, #80), and
references the cross-model audit that already happened for the substantive
change.

## Gate satisfied

This file exists to satisfy the #83 CI gate (`audit-artifact gate`), which
requires any PR touching `DOCTRINE.md` to also touch a file under `audits/`.
The gate is intentionally blunt (any `audits/` touch, not necessarily a new
full audit) — this note documents that the blunt requirement was satisfied
by an honest mechanical-edit record, not by an unrelated file touch.
