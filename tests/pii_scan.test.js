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
const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', '.vitest-cache', '.netlify']);
// Skip the audit doc itself + this test file (their job is to list the patterns).
const SKIP_FILES = new Set(['LOCAL_PII_AUDIT.md', 'pii_scan.test.js']);

// "Doctrine files" — files whose job is explicitly to document the boundary.
// These can reference operator-name and SIRR-domain vocabulary because
// they're describing the rule, not violating it.
const DOCTRINE_ALLOW = new Set([
  'DOCTRINE.md',
  '8BALL.md',
  'journal.md',
  'README.md',
  'audits/RELEASE_CHECKLIST.md',
  'audits/LOCAL_PII_AUDIT.md'
]);

// Config files that legitimately carry repo metadata (operator GitHub username).
const CONFIG_ALLOW = new Set([
  'package.json',
  'package-lock.json',
  'LICENSE'
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

  // SIRR cross-references — DOCTRINE.md §9 deniability rule.
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
    pattern: /(muhab|akif|operator|owner|founder|me)\b[^a-z]{0,40}\d{4}-\d{2}-\d{2}/i,
    label: 'labeled-DOB leak',
    allow: [...DOCTRINE_ALLOW]
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
