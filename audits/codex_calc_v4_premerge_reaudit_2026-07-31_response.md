# Codex pre-merge RE-AUDIT response — calc v4 (master-number preservation)

**Audit target:** `7fae4ea71f5c3c7a18a81ffa5a02f7024c1f61f9`
**Branch:** `claude/master-number-preservation`
**Audit date:** 2026-07-31
**Verdict:** **MERGE WITH FOLLOW-UP** — not a clean SAFE TO MERGE
**Findings:** 0 P0 · 0 P1 · **1 P2** · 0 P3

> **Filing note.** HEAD-bound, not PR-bound. This is the *fresh independent read* L48 requires
> after the remediation recorded in `audits/codex_calc_v4_premerge_audit_2026-07-31_response.md`
> (which read `d03a768` and returned DO NOT MERGE). When the orchestrator opens the PR, this
> file is renamed to carry the real `pr<N>`. The auditor performed no push, PR, merge, deploy
> or repository edit.

---

## Original findings — all three verified closed

* **PASS — bridge disclosure.** Host and both dyad sheets render the engine's master-mode note;
  the sealed, non-master and dyad-close paths all clear it.
* **PASS — facet-key references.** Active surfaces use `_v3`; `_v1` / `_v2` remain only as
  retired lineage and migration keys.
* **PASS — meanings inheritance.** v3 structurally spreads v2's nine entries and authors only
  `11 / 22 / 33`.

## New finding

### P2 — the active v0.62 footer still claims 1,814 tests

`DOCTRINE.md:648` — the **active** `**doctrine version:**` line — read `Suite 51 files / 1814
tests green`. The remediation added ten, and the independently executed suite is 1,824. The
latest journal entry correctly says 1,824.

**Recommendation:** update that one active count before merge, or explicitly disposition it
under the repository's P2 follow-up policy.

## Verification performed by the auditor

* Vitest: 51 files / 1,824 tests passed
* Audit assurance: 93/93 passed
* Product audit: PASS — 13/0/1/0; the warning is the three known untracked paths
* Local PII: clean, 859 files
* Real Chrome smoke: host master/non-master and both dyad bridge paths passed; zero console
  errors
* `index.html`: 1,497 lines, byte-identical
* Protected content and `package.json`: unchanged
* Repository state unchanged

---

## Disposition (implementer, same day)

**Accepted and FIXED, not deferred.** The count is now `1824`, with the delta stated in place
(`1814 at the first-audited HEAD d03a768; the remediation above added ten`) so the line records
its own history rather than silently replacing a number.

**Role boundary.** The independent audit above ended before any repository edit. After Claude
Code reached its user limit, the controller explicitly assigned Codex as the temporary REPO
implementer under `8BALL.md`'s cross-seat bridge and approved preservation of Claude's draft,
the documentation repair below, full gates, and a private-diff Grok/Codex relay review. That
operator assignment overrides the root audit-only default for this pass. Git staging, commit,
push, PR, merge and deploy remain outside the approval.

**This is the third instance of one defect class on this branch** — an *active* statement left
behind by a change — after the `_v2` facet references (P2, first audit) and DOCTRINE §1.C's
life-path parenthetical (self-audit). It is worth naming as a class rather than fixing three
times: **a versioning or count change must sweep for every ACTIVE restatement of the value it
moves**, because the lineage-preserving convention this document runs on (L17: supersede, never
edit) makes stale text the default state and correctness the thing that needs doing.

The initial follow-up sweep was not exhaustive. The approved implementer recount classified the
active shape claims in `DOCTRINE.md`, `8BALL.md`, `CLAUDE.md` and `README.md` and repaired the
additional drift it exposed:

| Location | Claim | Status |
|---|---|---|
| `DOCTRINE.md:648` | `1814 tests` | **ACTIVE and stale → FIXED to 1824** |
| `DOCTRINE.md:650+` | 1758 / 1585 / 1578 / 1560 / 1500 / 1438 tests | `**superseded:**` footer entries — historical by construction, correct at their own ship |
| `DOCTRINE.md:422, 681–684` | `1499/1500`, `1494/1500` | inside dated v0.37–v0.40 amendments — lineage per L17 |
| `journal.md` entries for the first audit/remediation | `1,814` | historically accurate: they describe the state at `d03a768` |
| `CLAUDE.md` single-file gate | `1494`, about 6 lines free | **ACTIVE and stale → FIXED to 1497 and 3 lines free** |
| `CLAUDE.md:139` | `51 vitest files` | correct — this branch adds no test file; pinned by `tests/repo_shape.test.js` |
| `CLAUDE.md:135–136` | `12` core / `13` ui modules | correct — this branch adds no `core/` or `ui/` module; pinned |
| `CLAUDE.md:177` | `38 files / 1369 tests` | explicitly dated "Verified 2026-07-25" — a dated verification note, not an active claim; pre-existing on `main` |
| `8BALL.md` architecture table | incomplete core inventory; `ui/ 10 modules` | **ACTIVE and stale → FIXED to all 12 core and 13 UI modules** |
| `README.md` structure tree | `core/ 10`, `ui/ 10`; incomplete active module list | **ACTIVE and stale → FIXED to 12/13 and all 12 content registries** |

`index.html` at 1497 lines, `51 files`, `93` assurance tests and the `13/0/1/0` product-audit
counts in the same footer were each re-verified and are correct.

### Post-fix gate state

* Vitest: **51 files / 1,824 tests passed**
* Auditor assurance: **93/93 passed**
* Product audit: **PASS — 13/0/1/0**
* Local PII audit: clean, **862 files**
* `index.html`: 1,497 lines, byte-identical
* Shipped content files and `package.json`: byte-unchanged
* Scoped closure is **Markdown-only** — no product code, content registry, dependency or
  host-file edit

**Status: lifecycle-STAGED; Git changes remain unstaged.** The fix is docs-only and does not
alter what this audit read in code, but whether that clears the P2 for merge is the controller's
call, not the implementer's. No push, PR, merge or deploy performed.
