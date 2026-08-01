SAFE TO MERGE

# Codex pre-merge audit — PR #190 · calc-v4 doctrine drift follow-up · L48 response

**PR:** #190 — close stale-active statements left by the calc-v4 widening
**Base:** `origin/main` @ `82da0ae`
**Head cleared:** `d1d8c51`
**Auditor:** Codex, independent of the Claude Code implementation lane, via
`~/ai-relay/relay --models codex --base origin/main --repo <detached worktree>`
**Brief of record:** `audits/codex_pr190_premerge_audit_2026-08-01_brief.md`
**Date:** 2026-08-01

Each round ran against a **detached worktree pinned at the exact audited
commit**, so the audit artifacts themselves were never inside the audited range.

## Verdict as received

> **SAFE TO MERGE. No P0–P3 findings.**

Reached on the third round. The first two returned **DO NOT MERGE**, and the
blockers were all in this lane's own work:

| Round | Head | Verdict | Blockers |
|---|---|---|---|
| 1 | `951b69f` | DO NOT MERGE | P1 L17 violation in the correction itself · P1 journal contradicted its own diff |
| 2 | `11c88ba` | DO NOT MERGE | P1 journal still narrated the rejected approach |
| 3 | `d1d8c51` | **SAFE TO MERGE** | none |

## Findings and closure

### R1 · P1 — the correction violated the rule it was written to serve

`DOCTRINE.md` §1.I's Register-law clause was rewritten **in place** with inline
parenthetical qualifiers. L17 (§13) requires that amendments *supersede, never
edit*: the historical clause is preserved **verbatim** and the change is a new
dated amendment block. Quoting fragments of a clause is not preserving it, and
no amendment block was added.

This is the sharpest finding of the cycle. The PR's entire thesis was
L17-compliant lineage preservation, and its first draft broke L17.

**Closed at `11c88ba`.** The clause is restored byte-identical to `origin/main`
— the auditor independently confirmed matching SHA-256 `dec8d60e…` — and a
distinct **v0.62 registry-currency amendment** sits beneath it carrying both
corrections. The irony is recorded *in* the amendment rather than quietly
patched out.

### R1 · P1 — the journal contradicted its own diff

`journal.md` said "no content file, `package.json`, or calculation module
touched." False: `core/birthcard.js` **is** modified. Comments only, but
modified. Understating the audited surface in canonical history is precisely
what this journal exists to prevent.

**Closed at `11c88ba`** — the line now says no executable calculation code
changed and names `core/birthcard.js` as comments-only.

### R2 · P1 — the journal narrated the rejected approach

After R1's remediation, `journal.md:27` still read "fixed in place, old wording
preserved as explicit lineage" — describing the approach the audit had just
**rejected**, and directly contradicting the v0.62 amendment above it. Canonical
history asserted the opposite of the shipped diff.

**Closed at `d1d8c51`.** It now describes the actual structure: corrected by a
separate dated amendment, base clause byte-identical as lineage. The retired
wording is quoted in a parenthetical that marks it as rejected rather than
reasserting it, and a sweep confirmed no sibling sentence narrates the old
approach.

**This was the third stale-active statement in a change whose entire purpose is
to eliminate stale-active statements, and the second one authored by the lane
doing the eliminating.** Recorded because it is the pattern, not the incident.

## Independent verification at `d1d8c51`

| Check | Result |
|---|---|
| `DOCTRINE.md` Register-law clause | **byte-identical to `origin/main`** (SHA-256 match) |
| v0.62 amendment | distinct block beneath the clause, not an edit of it |
| `core/` + `tests/` diff | **comments only** — executable-only hashes match `origin/main` |
| Runtime + tests registry import | `content/concordance.v3.js` |
| Life-path pair enumeration | 66 pairs: **3 registered, 63 unfiled, 0 adjacent**; other inventories 66/33/10/21 intact; 10/12/44 reject |
| Soul urge | preserves 11/22 |
| Birth-card reduction | unchanged, separately capped at 22 |
| New stale-active statements | none |
| L53 labelled-DOB | clean |
| `git diff --check` | pass |
| `index.html` | unchanged, 1497 lines |

The three statements this PR corrects were independently confirmed **actually
false** on `origin/main` — the premise was not taken on trust.

## Gates the auditor could NOT run — stated plainly

The relay sandbox is read-only and network-blocked, so these rest on the
implementer's local runs alone and are **not** independently confirmed:

- `npx vitest run` — dependencies absent, network blocked
- `python3 -m unittest audits.test_project_audit` — needs writable temp
- `python3 audits/project_audit.py` — needs report writes
- `bash audits/run_local_audit.sh` — `audits/local_personal_data.txt` is
  operator-local and absent from the worktree

Implementer's local runs at `d1d8c51`: **51 files / 1826 tests passed**,
assurance **93 tests OK**, product audit **PASS** (13 pass / 0 blocking; one
advisory `product.git_status` for untracked local dirs), local PII audit clean.

**Corrected on the auditor's evidence:** the PR body originally claimed **869**
files for the PII scan. That count came from a working checkout carrying 37
untracked local files plus the audit brief. The clean-tree count is **832–833**
depending on the commit, as the auditor measured. The PR body was corrected
rather than left standing.

## L48 disposition

**Audit cleared at `d1d8c51`.** Per L48 this artifact records the cleared
signal; it does not itself authorize the merge. The merge is the controller's
word.

Full run records:
`~/ai-relay/runs/20260801-203511-pr190-audit/` (round 1),
`~/ai-relay/runs/20260801-204847-pr190-audit/` (round 2),
`~/ai-relay/runs/20260801-210545-pr190-audit/` (round 3, cleared).
