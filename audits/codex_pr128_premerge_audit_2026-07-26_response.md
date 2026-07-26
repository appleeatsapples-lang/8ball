# Codex pre-merge audit — PR #128 response — filed 2026-07-26

Relay run: `~/ai-relay/runs/20260726-041732-8ball` (codex, read-only
sandbox, xhigh reasoning; single-reviewer run — the claude reconciler
seat remains logged out, and with one reviewer there is nothing to
reconcile). Brief: `audits/codex_pr128_premerge_audit_2026-07-26_brief.md`.
Dispositions appended below the verbatim verdict; each finding carries a
named action per the L48 record discipline.

---

## Verbatim verdict

Verdict: MERGE WITH FIXES

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | Med | The new #126 release record cites its Codex verdict but omits that #126 merged without the required F2 fix. The verdict says "MERGE WITH FIXES," requires F2 before merge, and identifies malformed states leaking values. The squash changed only `rowSections`'s `export` keyword; the defect still reproduces. This leaves the release log masking an L48 clearance failure. Amend the entry with the unresolved finding and its explicit disposition/follow-up. | journal.md:24; `audits/codex_pr126_premerge_audit_2026-07-25_response.md` lines 11, 20, 47 |

Commands and results (as reported by the auditor):

```text
git diff --stat origin/main...HEAD ; git diff --name-status origin/main...HEAD
# 3 Markdown files, 140 insertions / 1 deletion

git diff --exit-code origin/main...HEAD -- core/ ui/ content/ tests/ index.html CLAUDE.md README.md 8BALL.md
# exit 0, empty

git diff --check origin/main...HEAD
# clean

gh pr view 124/126/127 --json ...
# claimed SHAs/dates confirmed; #128 open

npm test
# 40/40 files, 1428/1428 tests passed

/bin/bash audits/run_local_audit.sh
# clean, 243 files

# Byte comparisons: doctrine prefix/version and pre-existing journal
# text unchanged; no v0.56.

git diff fc11d61..969e912 -- ui/share.js
# export-only change

node --input-type=module -e "...rowSections..."
# missing/unknown/`unres` states retain `SECRET`

gh pr checks 128
# test and l48-gate pass
```

What others may miss (verbatim): the footer flip itself is flawless; the
defect is only exposed by following the queue-clear entry into #126's
cited audit record.

---

## Dispositions (orchestrator, same session, pre-merge)

**F1 (Med) — #126 release record masks an unmet merge condition.
ABSORBED IN-PR, same session.** The queue-clear entry's #126 paragraph
is amended in this branch's follow-on commit. It now records: the MERGE
WITH FIXES verdict (2 Med + 2 Low); the unmet "merges only after the F2
fix commit lands" condition; F2 still OPEN on `main` — `rowSections` is
not fail-closed (only exact `sealed` strips; missing/unknown/`unres`
states wrongly carrying a value pass it into the §5.D snapshot),
independently re-reproduced in this cycle against `main` before the
amendment was written; the #126 audit's own live-risk bound (the sole
producer emits well-formed rows — no live leak today); the still-owed
F4 errata and F1 gate-tightening follow-ups from that audit; and an
explicit **L48 sighting** — the #126 merge word was executed on
artifact PRESENCE without a content re-read for unmet conditions, the
provenance-vs-presence question sighting #7 left open, now fired live.
A parallel one-sentence L48 note was added for #124 (no dedicated
verdict; surfaced before the word; docs-only gate-exempt by the
letter). Follow-up queued for its own word: the staged F2 fail-closed
state-whitelist fix plus adversarial pins as a small dedicated code
cycle — NOT smuggled into this docs-only PR, per this PR's own brief
(checklist item 1).

**Audit-integrity note, on record.** Mid-run the reviewer sandbox
created and switched the repo checkout to a stray local branch
`claude/paid-return-persistence` at the identical tip `9a3e244`
(reflog 04:18:14; zero commits, clean tree, never pushed — the name
echoes the brief's applyPaidReturn/R2 vocabulary). No content impact:
every diff and test the verdict relies on resolves identically at that
sha. The checkout was restored to `claude/doctrine-v055-footer-flip`;
the stray branch is left in place for controller disposition per the
no-unworded-branch-deletion rule.

Merge remains gated on the controller's word (L48) — the pre-verdict
merge word for this PR was held rather than executed, per the same
presence-vs-content lesson this cycle's F1 records. This artifact plus
the in-PR brief constitute the cross-model audit record for PR #128.
