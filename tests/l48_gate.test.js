// 8ball / tests / l48_gate.test.js
// The L48 CI gate's artifact predicate (.github/workflows/ci.yml, job `l48`).
//
// The gate has now gone false-green twice under the old any-audits-file
// predicate: PR #126's F1 (a 100%-similarity rename of the implementer's own
// session record into a pr126 filename) and PR #129's F2. #131 tightened it
// to accept only the two documented shapes — the verdict response or the
// explicit override — and moved it into its own job so it still reports when
// the suite is red.
//
// Nothing had pinned the predicate itself. A CI gate is exactly the kind of
// rule that loosens silently: no test fails when it stops catching things,
// and both false-greens were only caught by a human reviewer noticing. This
// file extracts the shipped regex from the workflow and pins what it must
// accept and reject, so any future widening has to happen in the open.
//
// It reads source by necessity — the predicate lives in YAML that vitest
// cannot execute — but it asserts the actual shipped string, not a prose
// description of it. Residual, stated plainly: this is a FILENAME gate. It
// proves a correctly-named artifact was added, never that an independent
// review actually happened.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const workflow = readFileSync(join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf-8');

// The shipped predicate: the grep -E pattern on the ART= line of the l48 job,
// compiled for a given PR number exactly as the gate compiles it.
function shippedPredicate(pr) {
  // The pattern lives either in a SHAPE= variable (once it is reused by the
  // recycled-artifact diagnostic) or inline on the ART= grep. Accept both so
  // this pin does not depend on which arrangement is in force.
  const shapeLine = /^\s*SHAPE="(.+)"\s*$/m.exec(workflow);
  if (shapeLine) return new RegExp(shapeLine[1].replace(/\$\{PR\}/g, String(pr)));
  const line = workflow.split('\n').find(l => l.includes('ART=') && l.includes('grep -E'));
  expect(line, 'neither SHAPE= nor an ART= grep line found in ci.yml').toBeTruthy();
  const m = /grep -E "([^"]+)"/.exec(line);
  expect(m, 'could not extract the artifact regex').not.toBeNull();
  return new RegExp(m[1].replace(/\$\{PR\}/g, String(pr)));
}

const accepts = (pr, path) => shippedPredicate(pr).test(path);

describe('L48 gate — accepted artifact shapes', () => {
  it('accepts a cross-model verdict response for the PR', () => {
    expect(accepts(126, 'audits/codex_pr126_premerge_audit_2026-07-25_response.md')).toBe(true);
    expect(accepts(113, 'audits/claude_pr113_premerge_audit_2026-07-21_response.md')).toBe(true);
    expect(accepts(107, 'audits/grok_pr107_premerge_audit_2026-07-20_response.md')).toBe(true);
  });

  it('accepts an explicit L48 override for the PR', () => {
    expect(accepts(119, 'audits/L48_override_pr119_2026-07-25.md')).toBe(true);
    expect(accepts(122, 'audits/L48_override_pr122_2026-07-25.md')).toBe(true);
  });

  it('accepts every historical verdict artifact already in audits/', () => {
    // Guards against over-tightening: the shape must still admit the real
    // artifacts this repo has been filing all along.
    const rejected = [];
    for (const file of readdirSync(join(REPO_ROOT, 'audits'))) {
      const m = /^[a-z0-9_]+_pr(\d+)_premerge_audit_\d{4}-\d{2}-\d{2}_response\.md$/.exec(file);
      if (!m) continue;
      if (!accepts(Number(m[1]), `audits/${file}`)) rejected.push(file);
    }
    expect(rejected).toEqual([]);
  });
});

describe('L48 gate — rejected artifact shapes (false-green regression pins)', () => {
  it('rejects the exact shape that went false-green on PR #126 (F1)', () => {
    // A renamed session record: it names the PR and lives under audits/, and
    // the pre-#131 predicate accepted it.
    expect(accepts(126, 'audits/test_quality_audit_pr126_2026-07-24.md')).toBe(false);
  });

  it('rejects a brief — only the response is a verdict', () => {
    // Briefs are the packet SENT to the reviewer; accepting one would green
    // the gate on a review that had not happened yet.
    expect(accepts(130, 'audits/codex_pr130_premerge_audit_2026-07-26_brief.md')).toBe(false);
    expect(accepts(131, 'audits/codex_pr131_premerge_audit_2026-07-26_brief.md')).toBe(false);
  });

  it('rejects any audits/ file that merely mentions the PR number', () => {
    for (const path of [
      'audits/pr126_notes.md',
      'audits/session_pr126.md',
      'audits/codex_pr126_review.md',
      'audits/pr126_premerge_audit_2026-07-25_response.md',   // no model prefix
      'audits/codex_pr126_premerge_audit_response.md',        // no date
      'audits/codex_pr126_premerge_audit_2026-07-25.md',      // not a _response
      'audits/mutation_survivors_core_2026-07-24.md',
    ]) {
      expect(accepts(126, path), `${path} must not satisfy the gate`).toBe(false);
    }
  });

  it('requires a full ISO date, not a loose one', () => {
    expect(accepts(126, 'audits/codex_pr126_premerge_audit_2026-7-5_response.md')).toBe(false);
    expect(accepts(126, 'audits/codex_pr126_premerge_audit_20260725_response.md')).toBe(false);
  });

  it('does not let one PR’s artifact satisfy another by prefix collision', () => {
    expect(accepts(12, 'audits/codex_pr126_premerge_audit_2026-07-25_response.md')).toBe(false);
    expect(accepts(126, 'audits/codex_pr12_premerge_audit_2026-07-25_response.md')).toBe(false);
    expect(accepts(119, 'audits/L48_override_pr1190_2026-07-25.md')).toBe(false);
  });

  it('rejects artifacts outside audits/ or nested below it', () => {
    for (const path of [
      'codex_pr126_premerge_audit_2026-07-25_response.md',
      'agents/codex_pr126_premerge_audit_2026-07-25_response.md',
      'audits/sub/codex_pr126_premerge_audit_2026-07-25_response.md',
    ]) {
      expect(accepts(126, path), `${path} must not satisfy the gate`).toBe(false);
    }
  });
});

describe('workflow trigger — a retargeted PR must still draw checks', () => {
  // `branches: [main]` filters on the BASE branch, so retargeting a PR fires
  // the `edited` action — which is NOT in the default opened/synchronize/
  // reopened set. Without `edited` a retargeted PR draws no checks at all,
  // and an absent check is visually indistinguishable from a pending one:
  // PR #133 sat at zero checks until a close/reopen forced a run.
  const typesLine = workflow.split('\n').find(l => l.trim().startsWith('types:'));
  const types = typesLine
    ? typesLine.slice(typesLine.indexOf('[') + 1, typesLine.lastIndexOf(']'))
        .split(',').map(t => t.trim())
    : null;

  it('declares pull_request types explicitly', () => {
    expect(typesLine, 'no types: line found on the pull_request trigger').toBeTruthy();
  });

  it('includes `edited`, so a retarget is not silently uncovered', () => {
    expect(types).toContain('edited');
  });

  it('still lists every default action — specifying types REPLACES the defaults', () => {
    // The subtle half: once `types:` is declared, GitHub no longer supplies
    // opened/synchronize/reopened. Dropping one here would silently stop CI
    // for that action while the workflow still looks configured.
    for (const action of ['opened', 'synchronize', 'reopened']) {
      expect(types, `${action} must stay in the explicit list`).toContain(action);
    }
  });

  it('carries no job-level `if:` that could report a skip as a pass', () => {
    // Narrowing `edited` to base-changes-only would need a job-level guard,
    // which makes the job report `skipped` on an ordinary body edit — and a
    // skipped job can satisfy a required status check. That is a gate that
    // stops gating while still looking green, the exact false-green shape
    // this workflow was bitten by in #126 F1 and #129 F2. Redundant runs on
    // a body edit are the deliberately chosen cheaper failure.
    expect(workflow).not.toMatch(/^ {4}if:/m);
  });
});

describe('L48 gate — job shape', () => {
  const yaml = workflow;

  it('runs as its own job so it still reports when the suite is red', () => {
    // As a step inside `test` it was unreachable whenever an earlier step
    // exited non-zero, which hid whether the artifact was present at all.
    expect(yaml).toMatch(/^\s{2}l48:/m);
    expect(yaml).toMatch(/name:\s*l48-gate/);
  });

  it('carries no needs: — its independence from the suite is the point', () => {
    const job = yaml.slice(yaml.indexOf('\n  l48:'));
    expect(job).not.toMatch(/^\s{4}needs:/m);
  });

  it('checks out full history so the base..head diff is computable', () => {
    const job = yaml.slice(yaml.indexOf('\n  l48:'));
    expect(job).toMatch(/fetch-depth:\s*0/);
  });

  it('still exempts docs-only PRs and still fails closed otherwise', () => {
    const job = yaml.slice(yaml.indexOf('\n  l48:'));
    expect(job).toContain('docs-only PR');
    // Fail-closed: the no-artifact branch errors, and that error is the last
    // thing the step does before exiting non-zero. Pinned as the property
    // rather than as adjacency, so inserting a diagnostic ahead of it is
    // fine but turning the miss into a warning that still greens is not.
    expect(job).toMatch(/echo "::error::PR without an in-PR L48 artifact/);
    expect(job).toMatch(/exit 1\s*\n\s*fi\s*$/);
  });

  it('names the brief-is-not-a-verdict rule in its failure output', () => {
    expect(yaml).toContain('a brief alone does not satisfy the gate');
  });
});

describe('L48 gate — a recycled artifact cannot supply the verdict', () => {
  const job = workflow.slice(workflow.indexOf('\n  l48:'));

  it('matches the shape against files ADDED by the PR', () => {
    expect(job).toMatch(/ADDED=\$\(git diff --diff-filter=A[^\n]*--name-only/);
    const artLine = job.split('\n').find(l => l.includes('ART=') && l.includes('grep'));
    expect(artLine).toContain('$ADDED');
    expect(artLine).not.toContain('$CHANGED');
  });

  it('detects renames and copies so they cannot pose as additions', () => {
    expect(job).toContain('--find-renames');
    expect(job).toContain('--find-copies-harder');
  });

  it('diagnoses a present-but-not-added artifact specifically', () => {
    // The failure must say WHICH problem occurred — a correctly-named file
    // that exists but was not added means it was renamed or copied in.
    expect(job).toMatch(/RECYCLED=\$\(echo "\$CHANGED"/);
    expect(job).toContain('was NOT added by this PR');
  });

  it('keeps recording that this does not by itself close #126 F1', () => {
    // A future reader must not take the guard for a stronger protection
    // than it is: the shape predicate is what rejects the renamed record.
    expect(job).toMatch(/does NOT close\s*\n?\s*#\s*126's F1 on its own|does NOT close[\s\S]{0,40}F1 on its own/);
    expect(job).toMatch(/FILENAME gate/);
  });
});
