# Claude cross-context audit — `l48-gate` CI predicate — 2026-07-29

**Verdict: DO NOT MERGE — highest surviving severity P0.**

Subject is the shipped gate, not a PR: `.github/workflows/ci.yml` job `l48` (lines 85–133), its sibling gate in `test` (lines 53–73), and the text pins in `tests/l48_gate.test.js`. "DO NOT MERGE" here means: the gate as shipped can be greened by a PR it is supposed to stop, and should not be treated as load-bearing until the P0 is closed. Nothing found requires reverting existing merged work.

---

## What this audit IS and IS NOT

**IS:** five Claude instances in fresh contexts, different models (opus / sonnet / fable) and different lenses (bypass, git-shell, claims), each running the gate's own shell against throwaway git fixtures, followed by an independent adversarial refutation pass on every finding. Every confirmed finding below was mechanically reproduced, not argued.

**IS NOT:** a cross-model audit under DOCTRINE §10. The auditor lane is Codex. This is one vendor's models checking one vendor's models — same training lineage, same blind spots, no independent seat. It does **not** substitute for the Codex leg, and it does not satisfy L48 for any PR that changes this gate. If the fixes below are implemented, that PR still needs a real Codex verdict or an explicit `audits/L48_override_pr<N>_<date>.md`.

Also out of scope by instruction: "the gate is only a filename gate" is documented at ci.yml:114–115 and pinned at l48_gate.test.js:226. It is not reported as a finding. Specific *consequences* of it that are undocumented are.

---

## P0 — reproduced

### 1. `git diff --name-only` has rename detection ON by default, so any file can be deleted from the repo under the docs-only exemption

**What is wrong.** ci.yml:97 (and identically ci.yml:57) computes `CHANGED=$(git diff --name-only "$BASE"...HEAD)` with no `--no-renames`. Since git 2.9 `diff.renames` defaults to true, so a rename is emitted as a **single line naming only the destination** — the source path never appears in `$CHANGED`. Rename any non-`.md` file to a `.md` path and the whole changeset looks like documentation: `! grep -qvE '\.md$'` passes and the job takes the `exit 0` docs-only branch. The same defect at ci.yml:57 blinds the journal-touch and audit-artifact gates simultaneously.

**Reproduced.** git 2.43.0, `diff.renames` unset, simulated `refs/pull/N/merge` checkout, ci.yml:94–133 transcribed verbatim. Branch does two `git mv`s and nothing else:

```
git diff --name-only origin/main...HEAD
  audits/ci_workflow_archive.md
  content_v1_archive.md
git -c diff.renames=false diff --name-status origin/main...HEAD
  D  .github/workflows/ci.yml
  A  audits/ci_workflow_archive.md
  D  content/cards.v1.full.js
  A  content_v1_archive.md
→ "L48 gate: docs-only PR (no behavior, no governance-gate docs) — exempt", exit 0
→ test-job gate: "journal-touch gate: pass" / "audit-artifact gate: pass", exit 0
```

**Concrete failure scenario (the refuter's variant, which is worse than the one filed).** Most high-value rename targets do turn `npm test` red, so the naive version is noisy. Two do not. The clean one: `git mv tests/l48_gate.test.js audits/l48_gate_test_archive.md`, plus edit CLAUDE.md's "45 vitest files" to "44" — `tests/repo_shape.test.js` pins that count against CLAUDE.md, which is itself `.md`. Run against real repo history: `CHANGED` = `{CLAUDE.md, audits/l48_gate_test_archive.md}`, l48-gate prints "docs-only PR — exempt" exit 0, test-job gate exit 0, full suite **44 files / 1538 tests, all pass**. The same trick deletes `tests/pii_scan.test.js` (44/1548 green) or `tests/dependency_discipline.test.js` + `tests/privacy_scan.test.js` together (43/1547 green). A PR can delete the gate's own regression pins, the PII scanner, and the dependency-discipline check with both checks green and no audit artifact.

**Bounds, honestly.** Deletion/neutering only — not code injection. Renaming `.md → core/evil.js` puts `core/evil.js` in `CHANGED` (not exempt); any added or modified non-`.md` file in the same PR kills the exemption; a copy leaves the source in place and shows as a harmless `A`. Rewrite budget while renaming is capped by the 50% similarity threshold at roughly <30% of lines (measured: 0% → R100 exempt, 20% → R060 exempt, 40%+ → D+A, not exempt). One correction to the filed claim: a PR that deletes `ci.yml` itself draws **zero** checks rather than a green one, since `pull_request` evaluates the workflow from the merge ref — still bad (the #142 absent-check failure mode) but a different failure than "reports green."

**Fix.** `--no-renames` (or `git -c diff.renames=false`) on **both** `CHANGED=` computations, ci.yml:57 and ci.yml:97. The `ADDED=` line at ci.yml:116 must **keep** `--find-renames --find-copies-harder` — a rename must stay `R` there so `--diff-filter=A` drops it; that is the #133 guard. Add pins asserting `--no-renames` on both `CHANGED=` lines and its absence from `ADDED=`, so the two directions can't be homogenized later.

---

## P1 — reproduced

### 2. `tests/l48_gate.test.js` prefix-matches `--diff-filter=A`, so #133 can be reverted with all 22 pins green

**What is wrong.** The pin at l48_gate.test.js:204 is `/ADDED=\$\(git diff --diff-filter=A[^\n]*--name-only/`. `[^\n]*` after the literal `A` makes it a prefix match on the filter set. `--diff-filter=ACMR`, `AR`, `AC`, `AM`, `ARC`, `ACMRTUXB` all satisfy it. So does a two-dot range or `HEAD~1...HEAD`, since the regex terminates at `--name-only` and never pins the revision range.

**Reproduced.** Repo mirrored to scratch, real vitest run against mutated workflows:

| mutation | `l48_gate.test.js` | full suite | gate behavior on a recycled-verdict fixture |
|---|---|---|---|
| baseline (unmodified) | 22/22 | 45 files / 1560 pass | exit 1, correct |
| `--diff-filter=ACMR` | **22/22** | **1560 pass** | exit 0 "artifact present — pass" |
| `if [ -n "$ART" ] \|\| true;` | **22/22** | — | exit 0 on a PR with **no artifact at all** |
| append `ADDED="$CHANGED"` | **22/22** | — | exit 0 on copy and on rename |

`l48_gate.test.js` is the only test in the suite that reads `ci.yml`; there is no actionlint. The third mutant is verbatim the failure mode `audits/L48_override_pr133_2026-07-29.md` names as the dangerous one — "`ADDED` effectively equalling `CHANGED` … a gate that looks exactly like a working gate."

**Also demonstrated:** a single branch that widens the filter *and* copies a prior verdict into the current PR's filename is green under its own `ci.yml` and red under base — self-authorizing within one PR, because `pull_request` evaluates the workflow from the merge ref.

**The shipped gate is sound today** — copy → `C100` exit 1, rename → `R100` exit 1, no artifact → exit 1, genuine new artifact → exit 0. This is a durability defect, not a live bypass. But the gate was patched three times in two weeks, `audits/L48_override_pr133_2026-07-29.md:65-69` anticipates pressure to relax exactly this flag, and the pin file's stated purpose (l48_gate.test.js:15) is "so any future widening has to happen in the open." It does not do that for the filter set or the diff range.

**Fix.** Pin the `ADDED=` invocation exactly — full flag string and revision range — rather than prefix-matching. Same for the `if [ -n "$ART" ]` branch.

---

## P2 — all reproduced

### 3. A symlink artifact greens the gate with a verbatim recycle of another PR's verdict

`--diff-filter=A --find-renames --find-copies-harder` classifies a symlink as a plain addition: the blob git stores is the ~48-byte target path, which shares no content with the file it points at, so similarity detection finds no source. `ln -s codex_pr126_premerge_audit_2026-07-25_response.md audits/codex_pr150_premerge_audit_2026-07-29_response.md` → `git ls-tree` shows `120000 blob`, the gate's own diff reports `A`, SHAPE matches, gate prints "verdict/override artifact present — pass", exit 0 — while every checkout reads PR #126's verdict. Confirmed green for dangling symlinks, for `/etc/hostname`, and for the `L48_override_pr<N>_<date>.md` shape. Controls confirm the guard is otherwise strong: byte-identical `cp` → `C100` red; `sed 's/#126/#150/g'` near-copy → `C094` red; immune to `diff.renameLimit`.

This falsifies ci.yml:113's specific claim ("This closes the adjacent dodge: recycling a previous PR's verdict") while leaving the broader FILENAME-gate caveat untouched. Not P0/P1 because it grants no new capability — a fabricated three-line file at the same path is also green (documented), and easier — and because `new file mode 120000` is the loudest possible thing to put in a diff. `grep -rn symlink` over the repo finds nothing about the gate, so it is not a recorded residual. **Fix:** `git ls-tree` the matched `$ART` path and reject mode `120000`; add a text pin.

### 4. Renaming + trimming an old verdict below 50% similarity defeats the anti-recycling guard

`git`'s default `-M`/`-C` threshold is 50%. Below it, a renamed or copied artifact is reported as plain `D`+`A` (or bare `A`), `--diff-filter=A` includes it, and SHAPE admits it. Reproduced: exact rename → R100 red; rename + one paragraph → R098 red; exact copy → excluded, red; **copy of a real 5547-byte verdict trimmed to its 1696-byte "Verbatim verdict" block, original left in place** → scored `C030`, classified `A`, gate green — carrying PR #100's `Verdict: MERGE WITH FIXES`, its findings table and summary verbatim, with nothing deleted. The `RECYCLED` diagnostic at ci.yml:126-130, written to tell the controller "renamed or copied into place", is silent for exactly this case. Bounded to P2 because a fresh four-line fabricated file greens the gate with less effort. **Fix:** correct the overclaims at ci.yml:113 and ci.yml:82-84 to state the similarity-threshold limit, or raise `-C`/`-M` sensitivity; the l48_gate.test.js:210-213 assertion currently claims the property "so they cannot pose as additions" while only checking that two flag strings appear in the YAML.

### 5. The docs-only exemption lets a PR delete the entire L48 sighting ledger with both checks green

Verdict and override artifacts are `.md` under `audits/` and are not carved out. `git rm audits/L48_override_pr132_2026-07-29.md audits/L48_override_pr133_2026-07-29.md audits/codex_pr126_premerge_audit_2026-07-25_response.md` and nothing else → l48-gate "docs-only PR (no behavior, no governance-gate docs) — exempt" exit 0; test-job gates pass. Stronger: deleting **64 of 67** audit files (every override, every verdict response), leaving only `RELEASE_CHECKLIST.md`, is still exempt and the real suite runs 45 files / 1560 tests green. A naive `git rm -r audits/` *is* caught, but only incidentally by the `RELEASE_CHECKLIST.md` carve-out added for an unrelated reason.

Title correction: this is not specifically the docs-only branch. The workflow's only diff filter is `--diff-filter=A`; deletions are examined nowhere, on any path. A PR with a genuine `content/*.js` change that deletes four ledger files *and* adds its own valid artifact is also green. Attempted mitigation that failed: `journal.md` independently narrates every sighting (journal.md:226 names the #132 and #133 overrides), but deleting `journal.md` in the same docs-only PR is likewise green at 1560/1560. Also note l48_gate.test.js:61 ("accepts every historical verdict artifact already in `audits/`") degenerates to a zero-iteration vacuous pass precisely when the ledger is emptied. **Fix:** fail closed on deletion of any path matching the two artifact shapes, or add the shapes to the docs-only exclusion alternation.

### 6. `DOCTRINE.md`'s delegated coverage sits on the any-`audits/`-file predicate that #131 removed as unsafe

A `DOCTRINE.md`-only PR is docs-only-exempt from `l48-gate` (reproduced: `DOCTRINE.md` rewritten to "Section 10 cross-model audit requirement: REMOVED", plus `journal.md`, plus a one-line append to an unrelated stale `audits/` note → l48-gate exit 0 *and* test-job "audit-artifact gate: pass" exit 0). No test reads `DOCTRINE.md` content, so `npm test` doesn't catch it either.

The framing must be corrected, and this is why it is P2 not P1: **the omission is deliberate and cross-model-audited.** `audits/codex_pr92_premerge_audit_2026-07-19_response.md:26` — the auditor who authored that alternation — states "`DOCTRINE.md` was never exposed (covered by the separate #83 gate)", and journal.md:1010 records the same. The bare two-file case is caught by ci.yml:67-72. The proposed "add `DOCTRINE\.md` to ci.yml:99" fix is wrong: it would break the documented mechanical-edit carve-out that five `audits/mechanical_footer_correction_*.md` files exercise.

What genuinely survives: the delegation was sound at #92, when both gates used the same predicate. #131 then tightened `l48` to the two-shape predicate *because* any-`audits/`-file went false-green (#129 F2), and left ci.yml:68 at `grep -qE '^audits/'`. `DOCTRINE.md` — the one file CLAUDE.md says may not merge without a cross-model audit — is now the only governed surface still covered by the predicate that was removed as unsafe. No journal or audit entry records that asymmetry; l48_gate.test.js:186 pins only `toContain('docs-only PR')` and asserts nothing about the alternation's membership. **Fix:** tighten ci.yml:68 to the two-shape predicate (preserving the mechanical-edit path), or record the asymmetry explicitly.

---

## Considered and dismissed

- **"Reworded reuse of a prior verdict defeats copy/rename detection."** Git observation reproduces (plain `A` at every `-C` threshold), but it is strictly dominated by the documented route: a **zero-byte file** with the right filename greens the gate, and no step or test ever opens an artifact. Requiring a source document to obtain what `touch` achieves adds zero attack surface. Its repro also doesn't demonstrate its own claim — run as written it hits the docs-only branch, not the artifact branch.
- **"`DOCTRINE.md` missing from the docs-only carve-out is an undiscovered P0 hole."** Refuted as filed: the scoping is deliberate and on record (see finding 6), the touch-vs-add semantics are documented as intentional in `audits/mechanical_footer_correction_2026-07-08.md:34`, the "exploit" adds no reach (a brand-new arbitrary `audits/` file produces the identical result), and the exact scenario is already an open commissioned review item — PRs #146/#147 are it, and `audits/codex_pr146_pr147_retroactive_audit_2026-07-29_brief.md` Hook 6 states it verbatim and routes it to an auditor. One P3 residual survives: CLAUDE.md lines 59–61 say a `DOCTRINE.md` PR "must also **add** a file under `audits/`" while the shipped predicate requires only a **touch**. CLAUDE.md is the inaccurate document; the remedy is a one-word doc fix, not a gate change.

---

## What was checked and found clean

- **The #133 added-only guard works as shipped, in the general case.** Exact copy → `C100` red with the correct `RECYCLED` diagnostic; exact rename → `R100` red; near-copy with PR number rewritten → `C089`/`C094` red; genuine new artifact → green. Exact-copy detection is hash-based and immune to `diff.renameLimit` (tested at 1, 2, 4, 1000). The `ADDED != CHANGED` worry raised in `audits/L48_override_pr133_2026-07-29.md:54-63` resolves in the **good** direction on git 2.43.0.
- **The gate fails closed on its primary duty.** A code-touching PR with no artifact of any shape → exit 1, every time, including when the ledger is simultaneously gutted. No behavior change can ship through this gate unaudited-by-filename.
- **The carve-out clause works as written.** `agents/*.md`-only → exit 1; `audits/RELEASE_CHECKLIST.md`-only → exit 1; `agents/auditor.md → agents/auditor_v2.md` still caught. Only the destination-path blindness of finding 1 escapes it.
- **The SHAPE regex.** Rejects briefs, nested paths, uppercase variants, suffix smuggling, wrong/extended PR numbers (independently re-confirmed, consistent with `audits/codex_pr131_premerge_audit_2026-07-26_response.md`).
- **Baseline suite health.** 45 files / 1560 tests green on unmodified `main`, verified repeatedly as the control for every mutation above.
- **No other test reads `ci.yml`.** `l48_gate.test.js` is the sole consumer; there is no linter or schema check on the workflow.

## Not checked — do not read absence as clearance

Fourteen candidate findings were generated and never reached adversarial verification because the refutation budget was spent on the six above. They are **unverified**, not confirmed and not dismissed. Highest-value unverified claims, verbatim severity as filed by the generating lane: `echo "$CHANGED"` swallowing option-shaped filenames (P2); the #133 guard failing open past git's `renameLimit` on large diffs (P2); `CLAUDE.md` and `8BALL.md` being governance files covered by neither gate (P2); non-ASCII `.md` filenames C-quoted by git and denied the exemption (P3); `pull_request types:` omitting `ready_for_review` / `converted_to_draft` (P3). Several restate confirmed findings from a different angle. Treat this list as the queue for the Codex leg, not as results.

---

## Recommended order of fixes

1. ci.yml:57 and ci.yml:97 — `--no-renames`. Keep ci.yml:116 exactly as-is. (closes P0)
2. l48_gate.test.js:204 — pin the full `ADDED=` invocation including revision range; add pins for `--no-renames` present on both `CHANGED=` lines and absent from `ADDED=`. (closes P1)
3. Reject mode `120000` on the matched `$ART`. (finding 3)
4. Fail closed on deletion of paths matching the two artifact shapes. (finding 5)
5. ci.yml:68 — tighten to the two-shape predicate, or write down the asymmetry. (finding 6)
6. Correct the overclaims at ci.yml:82-84 and ci.yml:113 to state the similarity-threshold and symlink limits. (findings 3, 4)

A PR carrying these is a change to the L48 mechanism itself under solo authority — the same shape as #133. It needs a Codex verdict or an explicit `audits/L48_override_pr<N>_<date>.md`. This document is not that.

---

## Process note — accidental writes to the working clone (contained)

Two refutation lanes had an unguarded `cd` into a scratch path that the harness had dropped between bash calls; the `cd` failed and subsequent commands ran against `/home/user/8ball`, creating commits on `main` (one lane: commit `7ca369c`, a symlink under `audits/` plus an appended line in `core/engine.js`; the other: four commits). Both were detected on the following call and hard-reset to the pre-existing `461914f`. Both lanes verified afterward: `git status --porcelain` empty, zero diff vs `origin/main`, all 67 audit files present, no stray files, no branches created, **no push occurred**. The final synthesis lane confirms the working tree is clean. Recommend the controller independently confirms `HEAD == 461914f` and reviews `git reflog` before the next push, since the two incidents were concurrent and neither lane could see the other's writes.

**Independent confirmation (implementer lane, post-synthesis).** Verified rather than
taken on the refuters' word, since a lane reporting on its own accident is exactly the
self-audit shape this repo distrusts:

- `HEAD` = `461914f`, working tree clean (`git status --porcelain` empty).
- `git merge-base --is-ancestor HEAD origin/main` → true. Local history is a clean prefix
  of the remote; no divergence.
- `7ca369c` exists in the local object store but is **not reachable from `origin/main`**.
  Same for the second lane's four commits (`69b4609`, `133595a`, `df89598`, `26f2fe0`).
  Nothing was pushed; the writes never left the container.
- `git reflog main` shows both incidents and both resets, at 05:46:44 and 06:01:11.
- Zero symlinks anywhere in the tree; `core/engine.js` carries no appended line; 67 audit
  files present; no stray branches; no untracked or ignored strays.
- `origin/main` contains only owner-merged PR commits.

**Root cause, for the record:** the audit harness told each lane to do scratch work in a
temp directory but did not forbid `cd`, and the sandbox drops the working directory
between bash calls. An unguarded `cd` that fails leaves subsequent commands running
against the repo. The mitigation is to require `git -C <dir>` and absolute paths rather
than `cd`. That is a defect in how the audit was commissioned, not in the subject under
audit.
