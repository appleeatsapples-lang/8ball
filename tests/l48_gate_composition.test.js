// 8ball / tests / l48_gate_composition.test.js
// The doctrine-only L48 false-green (deep-audit 2026-07-29, P1-C).
//
// tests/l48_gate.test.js pins the verdict/override filename regex in
// isolation. It never executes — or even reaches — that regex for a PR
// shaped like #176: `DOCTRINE.md`, an `audits/*.md` BRIEF (not a verdict),
// and `journal.md`. Before this fix, the l48 job's docs-only exemption
// (every changed file ends in `.md`) fired FIRST and returned exit 0 before
// the artifact-shape check ever ran; the separate `test`-job doctrine step
// only asked "did *some* path under audits/ change", so a brief satisfied
// it too. Both checks were green on that exact diff — the audit's own
// reproduction:
//   L48 gate: docs-only exempt
//   Doctrine audit-artifact gate: pass
//
// This file does not re-describe the predicate as prose or re-derive it as
// a parallel JS reimplementation (either of which could silently drift from
// the shipped bash). It extracts the two `run: |` blocks verbatim from
// ci.yml, fills in the two `${{ github.event.pull_request.* }}` expressions
// GitHub Actions would supply, and executes the real script text with real
// `bash` against a real two-remote git repository shaped like the target PR.
// If a future edit to ci.yml reopens the false-green, this test runs the
// ACTUAL new script and fails.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const workflow = readFileSync(join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf-8');

// ── verbatim extraction of the two `run: |` block scalars ──────────────────
// Matches YAML's own block-scalar rule: the indentation of the FIRST
// non-blank line sets the block's indent; the block ends at the first line
// indented less than that (or EOF). No YAML parser dependency — this repo
// adds none — but this was cross-checked against a PyYAML parse of the same
// file during development and produced byte-identical script text.
function extractRunBlock(text, afterMarker) {
  const idx = text.indexOf(afterMarker);
  if (idx === -1) throw new Error(`marker not found in ci.yml: ${afterMarker}`);
  const runIdx = text.indexOf('run: |', idx);
  if (runIdx === -1) throw new Error(`no "run: |" after marker: ${afterMarker}`);
  const rest = text.slice(runIdx + 'run: |'.length);
  const lines = rest.split('\n').slice(1);
  const body = [];
  let indent = null;
  for (const line of lines) {
    if (line.trim() === '') { body.push(''); continue; }
    const m = /^(\s+)/.exec(line);
    if (!m) break; // dedented to column 0 (or less than the block's indent) — block ended
    const lineIndent = m[1].length;
    if (indent === null) indent = lineIndent;
    if (lineIndent < indent) break;
    body.push(line.slice(indent));
  }
  while (body.length && body[body.length - 1] === '') body.pop();
  return body.join('\n');
}

function fillTemplate(script, { baseRef, prNumber }) {
  return script
    .replace(/\$\{\{\s*github\.event\.pull_request\.base\.ref\s*\}\}/g, baseRef)
    .replace(/\$\{\{\s*github\.event\.pull_request\.number\s*\}\}/g, String(prNumber));
}

const testStepScript = extractRunBlock(workflow, 'Doctrine/content changes require journal entry');
const l48StepScript = extractRunBlock(workflow, 'L48 gate — PRs require an in-PR audit artifact');

// ── a real two-remote git repository shaped like a PR ───────────────────────
// The scripts diff "$BASE"...HEAD where $BASE is origin/<base-ref>. A single
// local repo can't model "what the base branch looks like" separately from
// "what HEAD looks like" without an actual origin to fetch from — so this
// builds a bare "origin", a working clone, commits the pre-PR state to
// origin/main, then commits the PR's changes on top locally without ever
// pushing them back. That mirrors exactly what `git fetch origin main` sees
// in real CI: origin/main is the unchanged base, local HEAD is the PR tip.
function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${r.stderr}`);
  }
  return r.stdout;
}

function writeFiles(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

function buildRepo({ baseFiles, headFiles }) {
  const root = mkdtempSync(join(tmpdir(), 'l48-gate-composition-'));
  const originDir = join(root, 'origin.git');
  const workDir = join(root, 'work');
  mkdirSync(originDir, { recursive: true });
  git(originDir, ['init', '-q', '--bare']);
  mkdirSync(workDir, { recursive: true });
  git(workDir, ['init', '-q', '-b', 'main']);
  git(workDir, ['config', 'user.email', 'test@example.invalid']);
  git(workDir, ['config', 'user.name', 'L48 composition test']);
  git(workDir, ['remote', 'add', 'origin', originDir]);

  writeFiles(workDir, baseFiles);
  git(workDir, ['add', '-A']);
  git(workDir, ['commit', '-q', '-m', 'base']);
  git(workDir, ['push', '-q', 'origin', 'main']);

  writeFiles(workDir, headFiles);
  git(workDir, ['add', '-A']);
  git(workDir, ['commit', '-q', '-m', 'pr head']);

  return { root, workDir };
}

// Run a script the way GitHub Actions runs a bash `run:` step: `bash -e
// {script}` — errexit on, so an unhandled command failure aborts the step
// exactly as it would in real CI, rather than silently continuing past it.
function runStep(workDir, script) {
  const wrapped = `set -eo pipefail\n${script}`;
  const r = spawnSync('bash', ['-c', wrapped], { cwd: workDir, encoding: 'utf-8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

const PR = 176;
const BASE_FILES = {
  'DOCTRINE.md': '# doctrine base\n',
  'journal.md': '# journal base\n',
  'audits/.gitkeep': '',
};

describe('L48 gate composition — the exact PR #176 changed-file set', () => {
  let repo;
  afterEach(() => { if (repo) rmSync(repo.root, { recursive: true, force: true }); });

  it('reproduces the pre-fix false-green shape when run against the OLD predicate text (control)', () => {
    // Sanity control: confirms this harness actually exercises the real
    // exemption logic rather than passing for an unrelated reason. Runs a
    // literal copy of the PRE-FIX docs-only condition (as it read before
    // this change) against the exact PR #176 diff, and expects it to take
    // the old, wrong exit-0 branch — proving the harness would have caught
    // the original defect had it existed then.
    const preFixDocsOnlyCheck = `
BASE="origin/main"
git fetch --no-tags --prune origin main >/dev/null 2>&1
CHANGED=$(git diff --no-renames --name-only "$BASE"...HEAD)
if ! echo "$CHANGED" | grep -qvE '\\.md$' \\
   && ! echo "$CHANGED" | grep -qE '^(audits/RELEASE_CHECKLIST\\.md|agents/.*\\.md)$'; then
  echo "L48 gate: docs-only PR (no behavior, no governance-gate docs) — exempt"
  exit 0
fi
echo "SHOULD NOT REACH HERE — pre-fix predicate should have exited already"
exit 1
`;
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        'audits/doctrine_v060_label_carveout_2026-07-29_brief.md': 'a brief, not a verdict\n',
      },
    });
    const result = runStep(repo.workDir, preFixDocsOnlyCheck);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('docs-only PR');
    expect(result.stdout).not.toContain('SHOULD NOT REACH HERE');
  });

  it('the FIXED l48-gate job fails this exact diff (no valid artifact added)', () => {
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        'audits/doctrine_v060_label_carveout_2026-07-29_brief.md': 'a brief, not a verdict\n',
      },
    });
    const script = fillTemplate(l48StepScript, { baseRef: 'main', prNumber: PR });
    const result = runStep(repo.workDir, script);
    expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(1);
    expect(result.stdout).not.toContain('docs-only PR');
    expect(result.stdout).toContain('PR without an in-PR L48 artifact of the required shape');
  });

  it('the FIXED test-job doctrine step also fails this exact diff', () => {
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        'audits/doctrine_v060_label_carveout_2026-07-29_brief.md': 'a brief, not a verdict\n',
      },
    });
    const script = fillTemplate(testStepScript, { baseRef: 'main', prNumber: PR });
    const result = runStep(repo.workDir, script);
    expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(1);
    expect(result.stdout).not.toContain('audit-artifact gate: pass');
    expect(result.stdout).toContain('without an in-PR verdict/override artifact');
  });

  it('the composition of both jobs is red — neither reports a pass on this diff', () => {
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        'audits/doctrine_v060_label_carveout_2026-07-29_brief.md': 'a brief, not a verdict\n',
      },
    });
    const l48Result = runStep(repo.workDir, fillTemplate(l48StepScript, { baseRef: 'main', prNumber: PR }));
    const testResult = runStep(repo.workDir, fillTemplate(testStepScript, { baseRef: 'main', prNumber: PR }));
    const anyGreen = l48Result.status === 0 || testResult.status === 0;
    expect(anyGreen, 'a doctrine-touching PR with only a brief must not green ANY gate').toBe(false);
  });
});

describe('L48 gate composition — surrounding behavior is preserved', () => {
  let repo;
  afterEach(() => { if (repo) rmSync(repo.root, { recursive: true, force: true }); });

  it('an ordinary docs-only PR (no DOCTRINE.md) is still exempt in the l48 job', () => {
    repo = buildRepo({
      baseFiles: { 'README.md': '# base\n', 'journal.md': '# journal base\n' },
      headFiles: { 'README.md': '# base\n\nan ordinary typo fix.\n' },
    });
    const script = fillTemplate(l48StepScript, { baseRef: 'main', prNumber: 999 });
    const result = runStep(repo.workDir, script);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('docs-only PR');
  });

  it('a DOCTRINE.md change WITH a validly-added response artifact passes the l48 job', () => {
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        [`audits/claude_pr${PR}_premerge_audit_2026-07-29_response.md`]: 'verdict: pass\n',
      },
    });
    const script = fillTemplate(l48StepScript, { baseRef: 'main', prNumber: PR });
    const result = runStep(repo.workDir, script);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('verdict/override artifact present — pass');
  });

  it('a DOCTRINE.md change WITH a valid override artifact passes the test-job doctrine step', () => {
    repo = buildRepo({
      baseFiles: BASE_FILES,
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
        [`audits/L48_override_pr${PR}_2026-07-29.md`]: 'sighting #21\n',
      },
    });
    const script = fillTemplate(testStepScript, { baseRef: 'main', prNumber: PR });
    const result = runStep(repo.workDir, script);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('audit-artifact gate: pass');
  });

  it('recycling an OLD PR\'s verdict under the current PR\'s filename still fails (the #133 dodge)', () => {
    // A large filler body so git's similarity heuristic classifies the
    // rename as a rename (R), not a delete+add — genuinely exercising the
    // --find-renames path rather than accidentally falling through to it.
    const oldVerdictBody = 'verdict: pass\n' + 'padding line to raise similarity\n'.repeat(20);
    repo = buildRepo({
      baseFiles: {
        ...BASE_FILES,
        'audits/claude_pr100_premerge_audit_2026-07-20_response.md': oldVerdictBody,
      },
      headFiles: {
        'DOCTRINE.md': '# doctrine v0.61 — label carve-out\n',
        'journal.md': '# journal base\n\n## new entry\n',
      },
    });
    // Rename the OLD, unrelated PR's verdict onto the CURRENT PR's expected
    // filename, rather than adding a fresh one — the exact #133-shape dodge
    // the ADDED= rename/copy detection exists to catch: it carries no new
    // review, but the filename alone would satisfy a naive "does a matching
    // path exist" check.
    git(repo.workDir, ['mv',
      'audits/claude_pr100_premerge_audit_2026-07-20_response.md',
      `audits/claude_pr${PR}_premerge_audit_2026-07-29_response.md`]);
    git(repo.workDir, ['commit', '-q', '-m', 'recycle the old verdict under a new name']);

    const l48Result = runStep(repo.workDir, fillTemplate(l48StepScript, { baseRef: 'main', prNumber: PR }));
    expect(l48Result.status, l48Result.stdout + l48Result.stderr).toBe(1);
    expect(l48Result.stdout).toContain('was NOT added by this PR');
  });
});
