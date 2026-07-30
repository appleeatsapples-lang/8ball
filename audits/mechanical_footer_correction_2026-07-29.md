# Mechanical-edit note — DOCTRINE.md v0.57 footer STAGED→SHIPPED correction

**Date:** 2026-07-29
**Subject:** DOCTRINE.md v0.57 footer head entry (`**doctrine version:**`), status clause only
**Classification:** Mechanical edit — no cross-model audit run for this change.

## Why no cross-model audit

Same basis as `audits/mechanical_footer_correction_2026-07-08.md` (v0.48) and
`audits/mechanical_footer_correction_2026-07-20.md` (v0.51): §10 draws the line
at "Doctrine amendments go through the auditor before merge. Mechanical edits do
not." This edit changes no doctrine substance, rule, or mechanic — it appends a
SHIPPED marker to a staging clause left stale by the #140 merge.

## Where this differs from its precedents, and why that matters

The v0.48 and v0.51 corrections were clean flips: in both cases the substantive
change had already been through a real audit chain, and the footer clause was
the last stale status line from a cycle that had otherwise done everything it
said it would. **That is not the case here.**

The v0.57 clause did not merely say "STAGED." It said:

> per §10/L48 a cross-model audit is REQUIRED before merge — this is a calc
> change and a DOCTRINE change, the case the don't-do list names explicitly,
> and an override is not an appropriate substitute here.

**That requirement was not satisfied. It was overridden.** #140 merged with no
cross-model read, cleared by `audits/L48_override_pr140_2026-07-29.md` (L48
sighting #12) — an override the implementing lane objected to in writing before
it was instructed to write, and which opens by calling itself the weakest use of
that instrument in the chain.

So a naive SHIPPED flip would have been a quiet falsification. It would convert
a rule that was **bypassed** into one that reads as **met**, simply by marking
the surrounding text as delivered. The appended clause therefore says
`Corrected, NOT vindicated` and names the override, the sighting number, and the
outstanding items. A footer correction is allowed to update a status; it is not
allowed to retire an unmet requirement by implication.

## What changed

One clause appended inside the v0.57 footer entry, preserving the original
STAGED text verbatim per the lineage-preserving convention (§10 / `agents/auditor.md`:
lineage-preserving changes, no rewriting of superseded text). The clause records:

- SHIPPED — squash-merged to `main` as `8b51c38` (#140) on 2026-07-29.
- The stated cross-model requirement was overridden, not met; sighting #12 named.
- A retroactive read has since been commissioned —
  `audits/pr140_retroactive_audit_2026-07-29_brief.md` (#145, `a9957b5`) —
  **verdict outstanding**, and deliberately named so it cannot retroactively
  satisfy any gate.
- The HKO re-confirmation named in the entry's own NOTE remains open.

`journal.md` gains a follow-ups block appended to the existing #140 entry rather
than a new entry, so the #140 record stays in one place and this correction
creates no fresh status line that would itself need flipping later.

## Known-stale and deliberately NOT fixed here

Recorded so the omission is a decision rather than an oversight:

- **v0.56 changelog line** — carries `STAGED on claude/revenue-reset-single-offer;
  §10/L48 cross-model audit required before merge`. **Verified stale:** PR #130
  merged 2026-07-26. Unlike this one it had an in-PR Codex verdict, so its flip
  is a clean one.
- **v0.52, v0.53, v0.54 changelog lines** — carry similar STAGED language.
  Not verified either way by this note.

The house pattern is a dedicated footer-flip cycle per merge (v0.55's own clause
records exactly that: "corrected in the dedicated footer-flip cycle the journal's
#127 close-out queued"). Bundling unrelated merges into one mechanical-edit note
would make this file cover cycles it did not examine, which is the opposite of
what it is for.

## Gates

All changed files are `.md` and none is `audits/RELEASE_CHECKLIST.md` or
`agents/*.md`, so `l48-gate` exempts this PR as docs-only. The two gates inside
`test` that a `DOCTRINE.md` touch does fire are both satisfied: the
journal-touch gate by the `journal.md` follow-ups block, and the audit-artifact
gate by this file.
