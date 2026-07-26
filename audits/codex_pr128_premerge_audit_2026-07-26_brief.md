# CODEX PRE-MERGE AUDIT PACKET — PR #128 (DOCTRINE v0.55 footer flip: STAGED → SHIPPED naming 94cf1bc) — 2026-07-26
#
# Fire line (from any terminal):
#   cd ~/dev/8ball && git checkout claude/doctrine-v055-footer-flip && \
#   ~/ai-relay/relay --models codex --base origin/main \
#     "$(cat audits/codex_pr128_premerge_audit_2026-07-26_brief.md)"
# The verdict files on-branch as
# audits/codex_pr128_premerge_audit_2026-07-26_response.md.

## Who you are and what this is
You are an independent pre-merge auditor for PR #128 of the 8ball
repository (local checkout: ~/dev/8ball, branch
claude/doctrine-v055-footer-flip, base origin/main @ 969e912).
The project is a static single-page divination web app (no backend, no
analytics; Netlify). This PR is a DOCS-ONLY doctrine-coherence
micro-cycle: it performs the pending mechanical footer flip that the
journal's #127 close-out queued, and files the release-log record for
the two queue-clearing merges (#124, #126) that landed earlier the same
day. It deliberately changes NO code, NO tests, NO content.

Rules that bind this audit:
- A PR may not merge until an auditor who did not write it returns a
  verdict. You are that auditor; re-derive every claim yourself.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.

## Context (why this PR exists)
PR #127 (ownership pricing, DOCTRINE v0.54 → v0.55) squash-merged to
main as 94cf1bc on 2026-07-26. Its DOCTRINE v0.55 changelog entry was
authored pre-merge and still reads "STAGED on
`claude/pricing-model-1-2-3`; §10/L48 cross-model audit required before
merge." — true when written, stale since the merge. The house precedent
(v0.48, v0.49, v0.50, v0.51 changelog entries) is a mechanical
correction: APPEND a bold SHIPPED sentence naming the squash + PR
inside the entry, leaving the STAGED text verbatim per L17
(supersede-not-edit). The journal's #127 entry explicitly queued this
flip "for the next doctrine-touching cycle." This PR is that cycle, run
on the controller's path-B word.

## What the PR claims
- DOCTRINE.md: exactly ONE appended sentence, inside the `- v0.55:`
  footer changelog entry, after "…cross-model audit required before
  merge." and before the closing paren: a bold SHIPPED sentence naming
  squash `94cf1bc` (#127), the 2026-07-26 merge, and the in-PR verdict
  file `audits/codex_pr127_premerge_audit_2026-07-26_response.md`
  (MERGE WITH FIXES — 1 Med DECLINED with rationale, 1 Low absorbed
  in-PR). No other DOCTRINE line touched; the `**doctrine version:**`
  line untouched; NO version bump (v0.56 does not exist).
- journal.md: two new entries at top, newest-first, both dated
  2026-07-26, standard `## date — title — STATUS` headers:
  (1) the flip-cycle entry (STAGED on this branch), and (2) a
  queue-clear record (SHIPPED) for #124 (squash `fc11d61`, including
  the pre-merge supersession annotation `90f70a5` on its salvaged
  master-numbers entry) and #126 (squash `969e912`, 67 salvaged tests;
  post-merge suite 40 files / 1428 tests; sole production-code touch an
  `export` keyword on `rowSections` in ui/share.js). Tracker lines and
  every pre-existing entry byte-unchanged.
- audits/: this brief (and, post-relay, the `_response.md` sibling) —
  satisfies the journal-touch gate's audits/-file requirement for
  DOCTRINE-touching PRs.
- Explicitly OUT of scope: the R2 sub-unit legacy-credit widening
  (`Number(value) > 0`) — it stays a DECLINED #127 F1 disposition; no
  word was given for it. Any R2/code change in this diff is a finding.
- Suite on this branch: 40 files / 1428 tests, unchanged from main.

## Adversarial checklist
1. DIFF PERIMETER. `git diff --stat origin/main...HEAD` — only
   DOCTRINE.md, journal.md, and audits/codex_pr128_* files may appear.
   `git diff origin/main...HEAD -- core/ ui/ content/ tests/ index.html
   CLAUDE.md README.md 8BALL.md` must be EMPTY. Any code/test/content
   touch is an automatic NO-GO for a cycle sold as docs-only.
2. L17 DISCIPLINE ON THE FLIP. `git diff origin/main...HEAD --
   DOCTRINE.md` must show a single modified line (the `- v0.55:` entry)
   whose change is PURE APPEND: the pre-existing text up to and
   including "cross-model audit required before merge." survives
   byte-identical; nothing deleted; the appended sentence sits inside
   the closing paren. Verify the `**doctrine version:**` line (v0.55)
   is untouched and no v0.56 entry was invented. Compare the appended
   sentence's shape against the v0.48–v0.51 entries' own SHIPPED
   corrections — same mechanism, or flag the deviation.
3. FACT TRUTH OF THE APPENDED SENTENCE. On main: `git log --oneline
   main | head` and `gh pr view 127 --json state,mergeCommit` — confirm
   94cf1bc is the real #127 squash and 2026-07-26 the real date.
   Confirm `audits/codex_pr127_premerge_audit_2026-07-26_response.md`
   exists on main and actually records MERGE WITH FIXES with 1 Med
   declined + 1 Low absorbed. A wrong sha, wrong PR number, or
   misstated verdict in a constitution footer is the highest-severity
   class here.
4. JOURNAL TRUTH. Verify the queue-clear entry's checkable claims:
   `fc11d61` = #124 squash, `969e912` = #126 squash (gh pr view 124/126
   --json mergeCommit); the supersession annotation text is present on
   main's journal.md above the salvaged master-numbers entry; current
   main suite = 40 files / 1428 tests (`npm test`); CLAUDE.md tests/
   line reads 40. Spot-check the coverage/count claims against
   #126's own in-PR audit records rather than trusting this PR's prose.
5. ORDERING + SHAPE. journal.md: the two new entries sit between the
   tracker lines and the #127 entry, newest-first, headers match the
   `## YYYY-MM-DD — Title — STATUS` shape; the tracker lines
   (`next_strategic_read` / `next_analytics_read`) are byte-unchanged;
   no pre-existing entry was reflowed.
6. GATES + SCANS. `npm test` → 40 files / 1428 tests green (the
   pii_scan and privacy_scan stages run inside it — DOCTRINE.md and
   journal.md are DOCTRINE_ALLOW'd, so any scan failure means this PR
   introduced something worse than prose). `/bin/bash
   audits/run_local_audit.sh` if the gitignored pattern file exists —
   must be clean. Journal-touch gate logic: DOCTRINE touched → journal
   touched ✓ + audits/ file added ✓. l48-gate: all changed files end
   .md → docs-only exempt by the letter; the §10 house rule (DOCTRINE
   touch → cross-model audit) is why you are reading this anyway.
7. SCOPE CREEP HUNT. Grep the diff for any smuggled normative change:
   a new rule, a reworded constraint, an R2/credits semantic, a price,
   a tier composition. This PR may DOCUMENT reality; it may not ALTER
   doctrine substance. Any sentence that changes what the constitution
   requires (vs. records what shipped) is a finding.

## Required output shape (so the verdict files cleanly)
- Line 1: `Verdict: MERGE` | `MERGE WITH FIXES` | `NO-GO`
- Findings table: # | High/Med/Low | finding | evidence (file:line/output)
- Then: the exact commands you ran and what they returned.
Zero findings is acceptable only after you actually ran the checks.
