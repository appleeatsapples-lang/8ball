// 8ball / tests / pii_scan.test.js
// Public-repo PII audit. Runs as part of `npm test`.
// Scans the repository for patterns that indicate accidental personal-info
// leakage. Two layers: this public scan + the controller's local scan
// (audits/LOCAL_PII_AUDIT.md, gitignored data file) before push.
//
// SCOPE (v0.80). "The repository" means what git says it is:
//   git ls-files --cached --others --exclude-standard
// tracked content PLUS untracked-but-not-ignored files, so a half-built leak
// is still caught before it is committed. This is the SAME selection
// audits/run_local_audit.sh has always used — the two layers of one audit now
// agree about what they are auditing.
//
// It used to be a filesystem walk with a hand-maintained SKIP_DIRS list, and
// the gap between "what we publish" and "what happens to be on this disk" bit
// three times: `.claude/` had to be added to SKIP_DIRS after a local settings
// file leaked the controller's handle into this scan; the PR #190 cycle found
// the scan's file count inflated by generated report output; and the pr236
// audit found the sharper one — `audits/project_audit.py` stored every check's
// full subprocess output, the local-PII check shells out to a script that
// PRINTS the controller's own patterns and matching lines on a hit, and this
// walk then read those reports out of `audits/automated/`, a directory the
// repository does not carry. Both lanes said not to leave it a third time.
// A skip list has to be extended for each new source of untracked bulk; a git
// selection needs no maintenance, because .gitignore is already the file that
// answers this question. In this checkout the walk read 1108 files where git
// lists 903 — 205 of them generated reports.

import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Skip the audit doc itself + this test file (their job is to list the patterns).
const SKIP_FILES = new Set(['LOCAL_PII_AUDIT.md', 'pii_scan.test.js']);

// "Doctrine files" — files whose job is explicitly to document the boundary.
// These can reference operator-name and SIRR-domain vocabulary because
// they're describing the rule, not violating it.
//
// As of DOCTRINE v0.24 (agents/ codification), the agents/*.md role docs are
// part of the doctrine surface — they're operational extensions of §10. They
// can reference MUHAB.md (operator-preferences source) and SIRR.md (sibling
// project boundary reference) for the same reason DOCTRINE.md can.
const DOCTRINE_ALLOW = new Set([
  'DOCTRINE.md',
  '8BALL.md',
  'journal.md',
  'README.md',
  'audits/RELEASE_CHECKLIST.md',
  'audits/LOCAL_PII_AUDIT.md',
  'agents/AGENTS.md',
  'agents/PLATFORMS.md',
  'agents/orchestrator.md',
  'agents/implementer.md',
  'agents/auditor.md',
  'agents/verifier.md',
  'agents/inspector.md',
  'agents/controller.md'
]);

// Config files that legitimately carry repo metadata (operator GitHub username).
const CONFIG_ALLOW = new Set([
  'package.json',
  'package-lock.json',
  'LICENSE'
]);

// Narrower allow-list for the labeled-DOB rule specifically.
// Doctrine docs need to NAME this leak class; they do not need to REPRODUCE
// example shapes inline. journal.md, 8BALL.md, and README.md are excluded
// here even though they're in DOCTRINE_ALLOW for other rules.
const LABELED_DOB_ALLOW = new Set([
  'DOCTRINE.md',
  'audits/LOCAL_PII_AUDIT.md',
  'audits/RELEASE_CHECKLIST.md'
]);

// The repository, as git defines it. FAIL-CLOSED per §7: if git cannot answer,
// this throws and the scan fails — it never silently falls back to walking the
// filesystem, which is the behaviour this function replaced.
function repoFiles() {
  let out;
  try {
    out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: REPO_ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    throw new Error(
      `pii scan could not enumerate the repository (git ls-files failed: ${err.message}).\n` +
      `This scan is fail-closed: it does not fall back to a filesystem walk, because the ` +
      `walk is what let generated, untracked report output into the scan's read set.`
    );
  }
  return out.split('\0').filter(Boolean);
}

// Banned tokens for normal (non-doctrine, non-config) tracked content.
const BANNED = [
  // Operator identity. LICENSE has the full name; doctrine files reference
  // the MUHAB.md companion path. Anywhere else = leak.
  { pattern: /\bmuhab\b/i, label: 'operator first name', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /\bmuhabakif\b/i, label: 'operator handle', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /\bakif\b/i, label: 'operator surname', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /appleeatsapples/i, label: 'GitHub username', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },

  // SIRR cross-references — DOCTRINE.md §9 SIRR boundary rule.
  { pattern: /\bSIRR\b/, label: 'SIRR cross-reference', allow: [...DOCTRINE_ALLOW, '.gitignore'] },
  { pattern: /\bsirr\.studio\b/i, label: 'SIRR domain', allow: [...DOCTRINE_ALLOW] },
  { pattern: /\babjad\b/i, label: 'SIRR vocabulary', allow: [...DOCTRINE_ALLOW] },
  { pattern: /hebrew_gematria/i, label: 'SIRR vocabulary', allow: [...DOCTRINE_ALLOW] },

  // Labeled-DOB leak shape: a tag like "Muhab"/"operator"/"owner" within 40
  // characters of a YYYY-MM-DD. This catches the exact failure mode that
  // shipped in v0.1.0 — a fixture labeled "(canonical Muhab test)" with a
  // real-shape DOB. Doctrine files don't need this exception because they
  // shouldn't be embedding labeled DOBs either.
  {
    // Tightened from [^a-z] to . — the original missed JSON-shaped occurrences
    // where alphabetic text sits between the label and the date (e.g.
    // `Muhab test)" with \`dob: "YYYY-MM-DD`). Same 40-char window keeps it
    // line-local and prevents false positives across distant tokens.
    // L53 #4 fix: leading \b added + bare `me` dropped. `me\b` had no left
    // boundary, so it matched the trailing "me" of ordinary words (e.g.
    // "same day ... 2026-06-25" in journal.md) — a self-label "me" is not a
    // real operator-DOB tag, and the named tokens already cover the leak
    // shape. Word-bounding the group also stops e.g. "owner" matching inside
    // "downer". No true-positive coverage lost (the v0.1.0 leak was tagged
    // "Muhab", still caught by \bmuhab\b).
    pattern: /\b(muhab|akif|operator|owner|founder)\b.{0,40}\d{4}-\d{2}-\d{2}/i,
    label: 'labeled-DOB leak',
    allow: [...LABELED_DOB_ALLOW]
  }
];

const TEXT_EXTS = ['.js', '.json', '.html', '.md', '.toml', '.yml', '.yaml', '.css', '.txt', '.xml', '.gitignore', '.sh'];
function isText(file) {
  if (TEXT_EXTS.some(ext => file.endsWith(ext))) return true;
  if (file.endsWith('LICENSE')) return true;
  if (file.endsWith('.gitignore')) return true;
  return false;
}

// Read the scannable set ONCE and test every pattern against it. It used to be
// one full walk per BANNED entry — nine walks, nine reads of every text file,
// no caching (pr236 audit, Lane B). The set is built at module load, so the
// scope probes below add and remove their files without disturbing it.
// A file git listed can vanish between the listing and the read — the product
// auditor writes `audits/automated/` while the suite runs, and until v0.80
// that directory was IN this read set, so an ENOENT here failed the suite as
// an fs ERROR rather than an assertion (pr238 audit, Lane A). A file that is
// not there is not published, so it is skipped; anything other than "gone" is
// still a real error and still throws.
function readIfPresent(rel) {
  try {
    return readFileSync(join(REPO_ROOT, rel), 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') return null;
    throw err;
  }
}

const SCANNED = (() => {
  const out = [];
  for (const rel of repoFiles()) {
    if (SKIP_FILES.has(basename(rel))) continue;
    if (!isText(rel)) continue;
    const content = readIfPresent(rel);
    if (content !== null) out.push([rel, content]);
  }
  return out;
})();

describe('public-repo PII scan', () => {
  // Non-vacuity. Every assertion below is all-negative, so an empty or
  // degenerate file set greens the entire scan while auditing nothing — the
  // failure mode a fail-closed selection exists to prevent, and one that a
  // silent fallback would have produced quietly.
  it('has a real repository to scan', () => {
    expect(SCANNED.length).toBeGreaterThan(100);
    expect(SCANNED.map(([rel]) => rel)).toContain('DOCTRINE.md');
  });

  for (const { pattern, label, allow } of BANNED) {
    it(`no match for ${label}: ${pattern}`, () => {
      const hits = [];
      for (const [rel, content] of SCANNED) {
        if (allow.some(a => rel === a || rel.endsWith('/' + a))) continue;
        if (pattern.test(content)) {
          for (const [i, line] of content.split('\n').entries()) {
            if (pattern.test(line)) {
              hits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 120)}`);
            }
          }
        }
      }
      expect(hits, `Banned pattern ${pattern} (${label}) found:\n${hits.join('\n')}`).toEqual([]);
    });
  }
});

// The scope itself is a claim, so it is tested rather than described. Both
// halves matter and they pull in opposite directions: ignored output must be
// OUT (that is the whole change), and an untracked file that is not ignored
// must be IN (or the scan stops catching a leak in the minutes before it is
// committed — the window run_local_audit.sh was widened to cover in 2026-07-01).
describe('public-repo PII scan — scope', () => {
  function withProbe(rel, body) {
    const full = join(REPO_ROOT, rel);
    const dir = dirname(full);
    const dirExisted = existsSync(dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(full, 'pii scan scope probe\n');
    try {
      expect(existsSync(full), 'the probe must be on disk for this to mean anything').toBe(true);
      body();
    } finally {
      rmSync(full, { force: true });
      if (!dirExisted) rmSync(dir, { recursive: true, force: true });
    }
  }

  it('excludes generated report output under the gitignored audits/automated/', () => {
    const rel = 'audits/automated/.pii_scan_scope_probe';
    withProbe(rel, () => {
      // on disk, under the repo root, and a filesystem walk would have read it
      expect(repoFiles()).not.toContain(rel);
    });
  });

  it('still includes an untracked file that is not ignored', () => {
    const rel = '.pii_scan_scope_probe.md';
    withProbe(rel, () => {
      expect(repoFiles()).toContain(rel);
    });
  });

  // The fail-closed claim is a claim, so it is exercised. Without this, a
  // future "helpful" fallback to the filesystem walk would restore the exact
  // behaviour v0.80 removed and every assertion above would stay green.
  it('fails closed when git cannot answer — no filesystem fallback', () => {
    const realPath = process.env.PATH;
    process.env.PATH = join(REPO_ROOT, 'no', 'such', 'bin');
    try {
      expect(() => repoFiles()).toThrow(/could not enumerate the repository/);
    } finally {
      process.env.PATH = realPath;
    }
    // and the real selection still works once git is back
    expect(repoFiles().length).toBeGreaterThan(100);
  });

  it('skips a listed file that has vanished or is a directory', () => {
    expect(readIfPresent('audits/automated/definitely-not-here')).toBeNull();
    expect(readIfPresent('audits')).toBeNull();
    // …and still returns real content, so the null above is the branch and
    // not a function that always yields nothing
    expect(readIfPresent('DOCTRINE.md')).toContain('§7');
  });
});

// Guard the guard: the scan above is all-negative (asserts zero hits), so a
// broken regex would read green while silently no longer catching the leak it
// exists for. These positive-fire sentinels pin that each banned pattern STILL
// matches the shape it guards. (This file is in SKIP_FILES, so the scan does
// not scan these example strings.)
describe('public-repo PII scan — positive-fires sentinels', () => {
  const labeledDob = BANNED.find(b => b.label === 'labeled-DOB leak').pattern;

  it('labeled-DOB regex fires on the v0.1.0 leak shape it was written for', () => {
    expect(labeledDob.test('fixture (canonical Muhab test)" with dob: "1990-01-15')).toBe(true);
    expect(labeledDob.test('owner DOB 1988-03-22')).toBe(true);
    expect(labeledDob.test('founder — 2001-12-31')).toBe(true);
  });

  it('labeled-DOB regex does NOT fire on the retired false positives', () => {
    // bare `me` self-label (dropped in L53 #4) and `owner` inside `downer`
    // must stay unmatched.
    expect(labeledDob.test('same day ... 2026-06-25')).toBe(false);
    expect(labeledDob.test('downer 2026-06-25')).toBe(false);
  });

  it('every banned pattern except labeled-DOB fires on a sample of its own leak token', () => {
    // Driven off BANNED so a newly-added pattern with no sample here fails
    // loudly instead of being silently skipped — covers the two SIRR-vocabulary
    // patterns that share one label (abjad + hebrew_gematria) too.
    const samples = [
      ['operator first name', 'muhab'],
      ['operator handle', 'muhabakif'],
      ['operator surname', 'akif'],
      ['GitHub username', 'appleeatsapples'],
      ['SIRR cross-reference', 'SIRR'],
      ['SIRR domain', 'sirr.studio'],
      ['SIRR vocabulary', 'abjad'],
      ['SIRR vocabulary', 'hebrew_gematria'],
    ];
    for (const { pattern, label } of BANNED) {
      if (label === 'labeled-DOB leak') continue; // its own positive-fire tests are above
      const covered = samples.some(([l, tok]) => l === label && pattern.test(tok));
      expect(covered, `no positive-fire sample matches ${label} ${pattern}`).toBe(true);
    }
  });
});
