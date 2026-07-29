# PRE-MERGE AUDIT PACKET — PR #160 (`--no-renames` on both `CHANGED=` computations) — 2026-07-29

**Lane-neutral by construction.** This packet names no vendor. It was originally
addressed to Codex; Codex is retired (`audits/L48_override_pr144_2026-07-29.md`,
sighting #14), and hard-coding a vendor is what left the auditor role vacant in
the first place — see the §10 amendment draft at
`audits/doctrine_s10_auditor_lane_amendment_draft_2026-07-29.md`. Run it in any
lane that meets the independence test: **not the lane that authored the change,
and not the lane that authored the audit the change is based on.** That
excludes Claude Code and any Claude context for this particular PR, since both
the defect and the fix came from there.

## Who you are and what this is

You are an independent pre-merge auditor for PR #160 of the 8ball repository
(branch `claude/l48-no-renames-fix`, base `origin/main`). The PR changes three
files: `.github/workflows/ci.yml`, `tests/l48_gate.test.js`, and its own L48
override artifact.

Rules that bind this audit:

- A PR may not merge until an auditor who did not write it returns a verdict.
  You are that auditor; **re-derive every claim yourself**.
- READ-ONLY lane plus test runs. No edits, commits, pushes, or fixes.
- Do not create branches; leave the checkout exactly as found.
- **Do not `cd` into the checkout.** Use `git -C <path>` and absolute paths for
  every command. A prior audit of this same gate had two lanes lose their
  working directory mid-run and accidentally commit to the repo; that incident
  is recorded in `audits/claude_l48_predicate_crossread_2026-07-29.md`. Scratch
  fixtures go in a fresh temp dir, never in the repo.

## Why this audit was commissioned, and why it matters more than usual

This is not a routine second look. The **entire chain behind this PR is one
vendor**: Claude found the defect, Claude judged its severity, Claude wrote the
fix, and Claude wrote the mutation tests that certify the fix works. The
override clearing it (`audits/L48_override_pr160_2026-07-29.md`, sighting #17)
says so explicitly and names that as its central weakness.

You are the first independent party to look at any of it. **A wrong fix that
also passes its own author's mutation tests is precisely the failure this
arrangement cannot detect.** Treat the supporting audit
(`audits/claude_l48_predicate_crossread_2026-07-29.md`) as a claim to check,
never as evidence.

The gate has gone false-green twice already (#126 F1, #129 F2) and been patched
three times (#131 shape narrowing, #133 added-not-renamed, #142 `edited`
trigger). This is the fourth patch.

## What the PR claims

**The defect (claimed P0, reproduced by the author).** Both `CHANGED=`
computations ran `git diff --name-only "$BASE"...HEAD` with no `--no-renames`.
Git enables rename detection by default (`diff.renames`, since 2.9), and a
detected rename prints **only the destination path**. So renaming any non-`.md`
file to a `.md` path makes the whole changeset read as documentation, the
docs-only branch fires, and the gate exits 0 — while the source file is
deleted. Claimed consequence: a PR can delete `tests/l48_gate.test.js`,
`tests/pii_scan.test.js`, or `dependency_discipline` + `privacy_scan` with both
checks green and no artifact.

**The fix.** `--no-renames` added to `CHANGED=` at both sites — the `l48` job
and the journal/audit step in the `test` job.

**The deliberate asymmetry.** `ADDED=` (line ~116) must **keep**
`--find-renames --find-copies-harder`, so a recycled artifact stays `R`/`C` and
is dropped by `--diff-filter=A` (the #133 guard). The two diffs now use
opposite settings on purpose.

**Second fix (claimed P1).** The pin `/ADDED=\$\(git diff --diff-filter=A[^\n]*--name-only/`
was a prefix match: `ACMR`, `AR`, `AC`, `AM` all satisfied it and the revision
range was unpinned. Replaced with an exact-string assertion. Two new pins assert
`--no-renames` on both `CHANGED=` lines and its **absence** from `ADDED=`.

**Claimed verification.** Suite 45 files / 1568 tests. Mutation table: baseline
24/24; revert `--no-renames` → 1 fail; `--diff-filter=A`→`ACMR` → 1 fail (this
mutation passed 22/22 before the change); `--no-renames` onto `ADDED=` → 2 fail.

## Adversarial checklist

**A. The unexamined risk the override names — false REDs.** `--no-renames`
changes what *every* consumer of `CHANGED=` sees, and nobody has checked the
blocking direction. Construct legitimate rename-bearing PRs and determine
whether any is now **wrongly blocked or wrongly routed**:
- A pure documentation rename (`audits/a.md` → `audits/b.md`).
- A content release rename (`content/cards.v1.full.js` → `content/cards.v2.full.js`)
  against the journal-touch gate at ci.yml:60-65.
- A `DOCTRINE.md` rename against the audit-artifact gate at ci.yml:67-72.
- A `ui/` or `core/` module rename, and a test-file rename.
Is any previously-passing legitimate workflow now failing?

**B. The `RECYCLED` diagnostic.** It greps `$CHANGED` (ci.yml:126). Under
`--no-renames` a renamed artifact now yields **both** the source `D` and the
destination `A` paths where before it yielded only the destination. Does that
change which artifacts the diagnostic reports, produce a misleading message, or
fire where it previously did not — e.g. on a PR that merely *deletes* an old
artifact?

**C. Is `--no-renames` the right instrument at all?** Consider alternatives the
author did not evaluate: `--name-status` with explicit status handling,
`--diff-filter` on `CHANGED=`, or `-M0`/`diff.renames=false` via `git -c`. Is
there a case where `--no-renames` is insufficient — copies, mode changes, type
changes (file→symlink), submodules, or `--find-copies-harder` interactions?

**D. Did the author miss a consumer?** Are `CHANGED=` and `ADDED=` the only
diff computations in the workflow? Is there any other place a rename could hide
a change from a gate?

**E. Brittleness of the new exact-string pin.** `expect(job).toContain('ADDED=$(git diff --diff-filter=A --find-renames --find-copies-harder --name-only "$BASE"...HEAD)')`
is exact. Does it break on benign reformatting (YAML re-indent, line wrap)? Is
exactness worth that cost here, or does it merely relocate the fragility?

**F. Re-derive the mutation table.** Do not trust it. Mutate the workflow in a
scratch copy and run `tests/l48_gate.test.js` yourself. Confirm specifically
that `--diff-filter=ACMR` passed the **old** pin and fails the **new** one. Are
there mutations that still pass both — a widening the new pins do not catch?

**G. Does the P0 actually reproduce as described?** Build the fixture, run the
shipped predicate, and confirm both the pre-fix exemption and the post-fix
block. Verify the claimed collateral (that renaming a test file away leaves the
suite green) rather than accepting it.

**H. Scope discipline.** The PR deliberately leaves four P2s open (symlink
artifact, sub-threshold copy, ledger deletion, `DOCTRINE.md` predicate
asymmetry) and 14 unverified findings. Is any of those actually P0/P1 — i.e. is
shipping this fix without it unsafe? Flag if so; do not fix.

**I. The override and the ledger.** `audits/L48_override_pr160_2026-07-29.md`
claims sighting #17 after a collision with #157's #16. Is the ledger internally
consistent? Note that nothing in CI checks sighting numbers — the predicate
matches filenames and never opens the file.

## What is NOT in scope

- The `--no-renames` change's effect on anything outside `.github/workflows/ci.yml`
  and `tests/l48_gate.test.js`. No app code changed.
- Whether branch protection should be enabled. It is unset, and known to be —
  this gate is advisory today regardless of this PR.
- Rewriting the fix. Verdicts and recommendations only; the implementer lane
  writes any change.

## Required output shape (so the verdict files cleanly)

Return a single markdown document. It will be filed verbatim as
`audits/<lane>_pr160_premerge_audit_<date>_response.md` — substitute the lane
that actually ran it (`gemini`, `chatgpt`, `grok`, …). That file is the artifact
which satisfies this repo's L48 gate, so it must stand on its own.

Two constraints on the name, both verified against the shipped predicate:
`<lane>` must match `[a-z0-9_]+`, and the file must end `_response.md` — a
`_brief.md` is deliberately rejected, which is why this packet cannot green
anything by sitting in `audits/`. Name the lane honestly; the prefix is the
only record of who actually read the change.

1. **Overall verdict**, one of: `SAFE TO MERGE` / `MERGE WITH FIXES` /
   `DO NOT MERGE`.
2. **Per-hook findings**, each categorised `PASS` / `P3` / `P2` / `P1` / `P0`,
   keyed to the checklist letters above, each with the evidence you derived
   yourself. State explicitly which you reproduced mechanically versus argued.
3. **What you checked and found clean** — so that absence of a finding is
   distinguishable from absence of a check.
4. **What you could not check**, and why.

If you reach a different conclusion from the Claude audit on any point, say so
directly and show the derivation. Disagreement is the reason you were asked.
