# PR #219 pre-merge cross-model audit — reconciled response

**PR:** 8ball #219 — the auditor's guard test is environment-independent:
102/102 in a container
**Base → head:** `61f50c0` → `115c8f1` at audit start; the first lane's NIT
landed mid-audit (`fc86bee`) and the remaining findings land in the
reconciliation commit carrying this artifact.
**Process:** DOCTRINE §10 two-lane adversarial review, relayed through the
CC lane. Both lanes independently reproduced the base-tree failure, the
head-tree 102/102, and both claimed mutants in scratch worktrees.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | SAFE TO MERGE | 1 (1 NIT) |
| Lane B | MERGE WITH FIXES | 8 (1 MED, 4 LOW, 2 NIT, 1 INFO) |

**Reconciled outcome: MERGE WITH FIXES — every fix-class finding landed;
verified below. Final call remains with the controller per L48.**

## The code, verified sound by both lanes

The widened predicate (`_abs_path_leak_hits`: home + product-root needles,
both realpath'd) reproduced everything claimed: the base container failure,
head 102/102, mutant kills in both directions (home-only revert fails the
guard here; dropping the auditor's product-root redaction pair fails the
real-run artifact assertion on a REAL leaked path — with the hit list
containing only the root and no home path, the direct proof the assertion
is strictly stronger). One lane swept degenerate and adversarial root
shapes (`/`, empty, root==home, prefix collisions, trailing/double slash)
with zero false-fails, and both validated the CI-runner and operator-machine
shapes non-vacuously by restoring real paths into real-shaped reports.
`audits/project_audit.py` is byte-untouched.

## Findings and dispositions

**MED F1 (Lane B) — the entry's history of the defect was materially
wrong, and it erased a §10 finding.** The first draft dated the silence to
"six PR verifications across two days" and a docstring tied it to today's
shell split — but the failure is sighted in an artifact from 2026-08-04,
and the EXACT root cause was diagnosed by the grok lane on 2026-08-02
(`audits/relay_pr194_premerge_audit_2026-08-02_response.md`:
"`test_guard_can_fail` is environment-fragile if `REPO_ROOT` isn't under
`$HOME`") and filed as "Noise, not actioned" on a CI-is-green argument.
**Landed:** the journal now records the true span (~29 days), cites the
dismissed diagnosis, and states the process lesson — a cross-model finding
contradicting a green CI deserves a reproduction attempt in the environment
it names, not a dismissal from the environment it doesn't. The docstring's
false "since the shell split" clause is dropped.

**LOW F2 (Lane B) — the test method name said the opposite of what it now
catches.** **Landed:** renamed to
`test_real_report_artifacts_carry_no_absolute_machine_path` (no pin
anywhere referenced the old identifier).

**LOW F3 (Lane B) — two assertion messages still said "home path".**
**Landed:** corrected to "absolute path survived (key) redaction".

**LOW F4 (Lane B) — the `latest.md` half of the widened assertion was
near-vacuous on a green run.** An all-pass markdown carries no captured
output, and the length guard cannot tell a redacted artifact from one the
redactor never saw. **Landed:** an `assertIn(PRODUCT_ROOT_PLACEHOLDER)` pin
beside the length guard, verified present in both artifacts on a real run.

**LOW F5 (Lane B) — an unclaimed benefit with a flip side, recorded.** The
tracked PR #194 fast-follow (a non-`str` leaf stringified past the
redaction boundary by `default=str`) was undetectable in containers under
the old oracle; the widened predicate now turns a future `Path` leaf into a
real-run test failure — correct, and the only real flake vector the widened
assertion carries. **Landed as the journal note the lane's minimal option
asked for;** the `redact_paths` fallback itself stays queued rather than
widening this PR.

**NIT F6 (Lane B) — "meaningful everywhere" was one shape too strong.** A
repo at `/` degrades the guard to home-only again; the needle filter
prevents a nonsense needle, it does not rescue the guard. **Landed:**
softened to "every non-degenerate environment" and named in the journal.

**NIT F7 (Lane B) — "the only file changed" was false (journal.md is in the
diff).** **Landed:** "the only CODE file changed".

**NIT (Lane A) — a 102-char docstring line from the merge.** **Landed**
mid-audit (`fc86bee`), rewrapped to the file's width.

**INFO F8 (Lane B) — `l48-gate` red until this artifact lands.** This file
is the artifact.

## Reconciled verification (post-fix head)

- Assurance suite 102/102 OK in this container (re-run after the rename and
  the F4 pin); full vitest suite 57 files / 1995 tests green; product audit
  PASS, 0 blocking.
- Both lanes' clean checks stand: no stale "container-only" carve-out in
  any live process doc; CI runners green under the widened needles
  (superset over already-redacted artifacts); predicate and auditor resolve
  their roots identically (`.resolve()` both sides); the synthetic-root
  helper tests are unaffected by the added needles.

qualifier: recorded, not certified. Merge authority remains the controller's.
