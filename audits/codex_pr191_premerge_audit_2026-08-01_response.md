SAFE TO MERGE

# Codex pre-merge audit — PR #191 · gitignore the auditor's report output · L48 response

**PR:** #191 — ignore `audits/automated/`, the product-auditor's local report output
**Base:** `origin/main` @ `09c85c2`
**Head cleared:** `0159929`
**Auditor:** Codex, independent of the Claude Code implementation lane, via
`~/ai-relay/relay --models codex --base origin/main --repo <detached worktree>`
**Brief of record:** `audits/codex_pr191_premerge_audit_2026-08-01_brief.md`
**Date:** 2026-08-01

The run used a detached worktree pinned at `0159929`. The brief was committed at
`e67f9f4`, *after* that head, so unlike the PR #190 chain it was not inside the
audited range at all.

## Verdict as received

> **SAFE TO MERGE — P3 advisory only; no P0–P2 findings.**

Cleared on the first round.

## The P0 the brief asked for, disproven by construction

The brief's load-bearing concern was that the new rule sits **inside** `audits/`,
the directory this project's L48 artifacts, CI fixtures and auditor scripts live
in — so a pattern that over-matched could silently swallow a required artifact,
failing `l48-gate` in CI while showing the author a clean `git status`.

The auditor proved it does not, by running `git check-ignore -v --no-index`
against real paths rather than reading the pattern:

- L48 response and override paths — **not ignored**
- `audits/RELEASE_CHECKLIST.md` — **not ignored**
- `audits/fixtures/hko_calendar_authority_1901_2100.json` — **not ignored**
- all auditor scripts — **not ignored**
- only `audits/automated/*` matches

And `git ls-files -i -c --exclude-standard` returns **0** — no tracked file is
newly ignored.

## Independent verification

| Check | Result |
|---|---|
| Ignore-rule blast radius | only `audits/automated/*`; L48 artifacts, fixtures and scripts unaffected |
| Newly-ignored tracked files | **0** |
| Tracked scanner corpus | **834**, unchanged |
| The 875 → 847 claim | reconstructed exactly: **847 + 28 = 875**; the 28 are 13 timestamped JSON/markdown pairs plus two `latest.*` |
| Comment claims | verified against `project_audit.py:1030,1037`, `ci.yml:134,140`, `run_local_audit.sh:32` |
| Auditor writing into the now-ignored dir | correct generated-output behaviour, not a defect |
| `git diff --check` | pass |
| PII scan (equivalent, at the exact head) | clean |

## P3 · advisory — a real point that cuts against this change

All 28 reports contain an **absolute user path** (`/Users/8ball/...`), and a
report can capture failure output that may one day include a PII match. Ignoring
them means later local scans no longer inspect that history, which is a
disclosure risk **if a report is ever shared manually**.

The auditor is explicit that this is *not* a tracked-content risk: ordinary
staging is now blocked, and a force-staged report re-enters `--cached` scanning
anyway. The suggested mitigation is to redact `product_root` from the reports, or
scrub before sharing.

Recorded rather than closed here — it is a property of the auditor's report
format, not of this ignore rule, and fixing it belongs in
`audits/project_audit.py` as its own change. **This finding was solicited**: the
brief asked whether removing files from a security-adjacent scan's selection
loses a surface that was accidentally being usefully scanned. It did, slightly.

## Gates the auditor could NOT run — stated plainly

The relay sandbox is read-only and network-blocked, so these rest on the
implementer's local runs alone and are **not** independently confirmed:

- `npx vitest run` — dependencies absent, network blocked
- `python3 -m unittest audits.test_project_audit` — needs writable temp
- `python3 audits/project_audit.py` — needs report writes
- `bash audits/run_local_audit.sh` — `audits/local_personal_data.txt` is
  operator-local and absent from the scratch checkout (the auditor ran an
  equivalent scan instead, clean)

Implementer's local runs at `0159929`: **51 files / 1826 tests passed**, PII
audit clean, `git diff --check` clean.

## One correction the auditor volunteered

The 875 → 847 figure is **checkout-dependent**, and filing the audit brief adds
one path — so the same reconstruction against a checkout carrying the brief
yields 848, not 847. The PR body's figure is correct as measured at `0159929`
before the brief existed; it is not a stable number and should not be quoted as
one. The stable figure is the tracked corpus: **834**.

## L48 disposition

**Audit cleared at `0159929`.** Per L48 this artifact records the cleared
signal; it does not itself authorize the merge. The merge is the controller's
word.

Full run record: `~/ai-relay/runs/20260801-220159-pr191-audit/`.
