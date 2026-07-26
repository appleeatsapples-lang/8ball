# Codex pre-merge audit — PR #131 response — filed 2026-07-26

Relay run: `~/ai-relay/runs/20260726-054518-8ball` (codex reviewer,
read-only sandbox, xhigh reasoning; claude reconciler seat active —
two-leg run). Brief: `audits/codex_pr131_premerge_audit_2026-07-26_brief.md`.
Dispositions appended below the verbatim verdicts per the L48 record
discipline. This artifact is itself the procedural fix both legs name:
committing it under the tightened predicate's required shape is what
flips this PR's l48-gate GREEN — the acceptance sequence's second leg.

---

## Verbatim verdict (codex reviewer)

Verdict: MERGE

Equivalent: SAFE TO MERGE after this response is committed under the
required filename and the resulting `l48-gate` success is observed.

| # | Severity | Finding | Evidence |
|---|---|---|---|
| — | — | No defects found. | Predicate at ci.yml:89; journal truth at journal.md:8 |

The predicate correctly accepts response/override shapes and rejects
briefs, renamed records, nested paths, uppercase variants, suffix
smuggling, and wrong/extended PR numbers. Invalid calendar dates such
as `9999-99-99` pass syntactically; acceptable because the gate
validates artifact shape, not calendar semantics.

Residual holes: a self-authored file merely named `_response.md`, or an
unauthorized override, still greens the gate because content and
provenance are unchecked. That is acceptable only under the documented
human lane/controller law; CI does not independently enforce
authorship.

The RED self-test leg is proven: workflow run `30202684653` at
`8be5665` had `test=success`, `l48-gate=failure`. The GREEN leg cannot
exist until this audit response lands and remains a required pre-merge
observation.

Commands and results (as reported):

```text
git diff --name-status origin/main...HEAD → exactly three files:
  ci.yml, PR131 brief, journal.md
git diff --check origin/main...HEAD → clean
Exact line-89 regex harness → 14/14 expected results; actual branch
  RED/non-exempt; hypothetical response GREEN
Historical loop over audits/*_premerge_audit_*_response.md → 25/25
  matched; #103 retroactive, #94/#95 crosscheck, #93 legacy rejected;
  3/3 overrides matched
cmp on all unchanged workflow regions → identical; needs: absent
ruby YAML.load_file(".github/workflows/ci.yml") → PASS jobs=l48,test
npm test → 40 files, 1433 tests passed
/bin/bash audits/run_local_audit.sh → clean, 247 files scanned
gh pr checks 131 → sandbox network error; connected GitHub
  workflow/job reads supplied the check evidence above
Final git status --short --branch → clean checkout, branch unchanged
```

What others may miss (verbatim): the gate materially narrows filenames
but remains a shape check, not cryptographic or provenance enforcement.

## Reconciliation (claude reconciler — verdict section, verbatim)

FINAL MERGED VERDICT: **MERGE WITH FIXES (procedural only)** — the code
change (`ci.yml` l48 predicate tightening) is correct, narrowly scoped,
fully tested (`npm test`: 40/40 files, 1433/1433 passing; local PII
audit clean), and verified against both adversarial and historical
cases with no regressions. The only remaining step is non-code: commit
an in-PR audit response artifact matching the new tightened predicate
so `l48-gate` goes GREEN, then merge. No security, correctness, or
scope concerns block this from being safe to merge once that artifact
lands. (The reconciler also classed the residual provenance gap as
accepted-risk — the L48 gate is explicitly a human-lane/controller-
authority control, not a cryptographic one — and the invalid-calendar-
date pass-through as a non-issue.)

---

## Dispositions (orchestrator, same session, pre-merge)

**No defects — nothing to absorb.** The procedural fix both legs name
is THIS file, committed pre-merge; the l48-gate run on the commit
carrying it is the GREEN leg of the acceptance sequence, observed and
recorded in the merge report before any merge word executes.

**Accepted-risk notes, on record (both legs concur):**
1. *Shape, not provenance.* A self-authored `_response.md` or an
   unauthorized override file still greens the gate — content and
   authorship stay a human-lane law (L48's sighting ledger + the
   controller's word), which is the documented design. Future
   hardening (authorship/provenance signal) is possible but not owed.
2. *Syntactic dates.* `9999-99-99` passes the shape check — cosmetic,
   no exploit path, accepted.

Merge is gated on the controller's word — the standing word given
pre-verdict applies per the surfaced protocol: a verdict with no code
findings, whose sole fix is this artifact, executes on landing +
observed GREEN leg. This artifact plus the in-PR brief constitute the
cross-model audit record for PR #131.
