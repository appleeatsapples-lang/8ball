// 8ball / tests / pii_scan.test.js
// Public-repo PII audit. Runs as part of `npm test`.
// Scans tracked content for patterns that indicate accidental personal-info
// leakage. Two layers: this public scan + the operator's local scan
// (audits/LOCAL_PII_AUDIT.md, gitignored data file) before push.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Skip these dirs entirely.
const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', '.vitest-cache', '.netlify', '.claude']);
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

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || SKIP_FILES.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile()) yield full;
  }
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

const TEXT_EXTS = ['.js', '.json', '.html', '.md', '.toml', '.yml', '.yaml', '.css', '.txt', '.gitignore', '.sh'];
function isText(file) {
  if (TEXT_EXTS.some(ext => file.endsWith(ext))) return true;
  if (file.endsWith('LICENSE')) return true;
  if (file.endsWith('.gitignore')) return true;
  return false;
}

describe('public-repo PII scan', () => {
  for (const { pattern, label, allow } of BANNED) {
    it(`no match for ${label}: ${pattern}`, () => {
      const hits = [];
      for (const file of walk(REPO_ROOT)) {
        const rel = relative(REPO_ROOT, file);
        if (allow.some(a => rel === a || rel.endsWith('/' + a))) continue;
        if (!isText(file)) continue;
        const content = readFileSync(file, 'utf-8');
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
