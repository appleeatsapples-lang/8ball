# PR-B — Stale-branch disposition record (deep-clean F2) — 2026-07-25

**Lane:** Claude chat (orchestrator, DC shell) · **Word:** operator "ALL" on
`8ball_deepclean_packet_2026-07-25.md`. Evidence gathered before any
deletion, per propose-before-mutate. Deletions execute in
`tools/PUSH_AND_PR_deepclean.sh` (push auth required), guarded by the same
patch-id checks recorded here.

## Evidence table (verified on disk, 2026-07-25)

| Branch | PR | Unmerged commits (patch-id) | Content vs main | Disposition |
|---|---|---|---|---|
| `claude/ci-node24-runtime-bump` | #119 merged | 0 | in main | **DELETE** |
| `claude/claude-md-documentation-cgmzvr` | #122 merged (squash of 2) | 2 (squash artifact) | `git diff branch main -- .github audits` EMPTY | **DELETE** |
| `claude/test-coverage-analysis-27tc7k` | none ever opened | 6 — real work | merges clean; suite **1437/1437** on merged tree | **SALVAGE — do not delete** |

## Salvage detail
`claude/test-coverage-analysis-27tc7k` (2026-07-24, the blocked-lane branch
noted around #85's close-out) carries: 45 Saved Readings controller
behavioral tests (`tests/readings_ui.test.js`), 22 share live-path tests
(`tests/share_behavior.test.js`), a §5.D sealed-value snapshot pin, the
25-module coverage table, the core/ mutation-survivor listing, and
`audits/test_quality_audit_2026-07-24.md` (which satisfies the L48
artifact gate for its own PR). Merge test against current main: clean,
full suite green. Disposition: open PR from the existing remote branch;
Codex pre-merge verdict per L48.

## L48
This PR is docs/audits-only but not gate-exempt (governance rule since
#92). Codex verdict pending pre-merge via operator relay.
