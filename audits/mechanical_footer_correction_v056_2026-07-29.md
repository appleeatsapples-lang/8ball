# Mechanical-edit note — DOCTRINE.md v0.56 footer STAGED→SHIPPED correction

**Date:** 2026-07-29
**Subject:** DOCTRINE.md v0.56 changelog entry, status clause only, plus the
matching `journal.md` entry header and status paragraph
**Classification:** Mechanical edit — no cross-model audit run for this change.

## Why no cross-model audit

Same basis as `audits/mechanical_footer_correction_2026-07-08.md` (v0.48),
`audits/mechanical_footer_correction_2026-07-20.md` (v0.51), and
`audits/mechanical_footer_correction_2026-07-29.md` (v0.57, the sibling
correction this one follows): §10 draws the line at "Doctrine amendments go
through the auditor before merge. Mechanical edits do not." This changes no
doctrine substance, rule, or mechanic — it appends a SHIPPED marker to a staging
clause left stale by the #130 merge, and flips the matching journal entry.

## This is the clean case, and the contrast is the point

The v0.57 correction filed hours earlier had to say `Corrected, NOT vindicated`,
because the clause it flipped stated a cross-model requirement that was then
**overridden** rather than met. **v0.56 is the opposite, and it deserves to be
recorded as such rather than flattened into the same shape.**

The requirement stated in the v0.56 clause was satisfied, in full, with the
chain on disk:

1. Codex pre-merge verdict — **MERGE WITH FIXES**, 3 Medium truth/control-plane
   findings and 2 Low
   (`audits/codex_pr130_premerge_audit_2026-07-26_response.md`).
2. All three Mediums closed in an in-branch fix cycle before merge.
3. A **re-audit of the fix delta**, which is what the journal entry had made the
   merge conditional on — **MERGE WITH FIXES**, one Low
   (`audits/codex_pr130_premerge_reaudit_2026-07-26_response.md`).
4. That Low (R1) was the journal entry's own pre-fix snapshots stated in present
   tense. It was reconciled in place as initial-state → corrected-state history;
   the entry's Tests paragraph now reads *"Suite green at the initial cut's 41
   files / 1438 tests … after the fix cycle and the #129 merge-forward below, the
   merged suite passes 41 files / 1444 tests."* **Verified closed before writing
   this note**, rather than assumed from the verdict's presence.

Worth stating plainly, since the surrounding run does not look like this: seven
consecutive L48 sightings record no cross-model read. #130 is what the process
looks like when it runs as designed — verdict, disposition, re-audit, close —
and the correction should not read the same as one that skipped all four steps.

## What changed

- **`DOCTRINE.md`** — one clause appended inside the v0.56 changelog entry, the
  original STAGED text preserved verbatim per the lineage-preserving convention.
  Names the squash commit, both verdict artifacts, the disposition, and that the
  requirement was met rather than overridden.
- **`journal.md`** — the `2026-07-26 — Revenue reset …` entry header flipped
  `STAGED` → `SHIPPED`, and a status correction prepended with the original OPEN
  text retained behind `Was:`. The entry had said `OPEN as PR #130` and set the
  re-audit condition; both are now resolved on the record.

## Live queue item surfaced, not fixed

The v0.56 sprint presentation **expires 2026-08-08 unless renewed** — ten days
out from this correction. Revert is mechanical and the clause says so. This note
does not act on it; it is recorded here because a footer flip is the moment the
expiry becomes easy to miss, the clause having just been marked delivered.

## Still stale after this change

`DOCTRINE.md` v0.52, v0.53 and v0.54 carry similar STAGED language. Not verified
either way by this note or its sibling. The house pattern is a dedicated
footer-flip cycle per merge, so they are named rather than absorbed.

## Gates

All changed files are `.md` and none is `audits/RELEASE_CHECKLIST.md` or
`agents/*.md`, so `l48-gate` exempts this PR as docs-only. The two gates a
`DOCTRINE.md` touch does fire inside `test` are both satisfied: journal-touch by
the entry flip, audit-artifact by this file.
