// 8ball / tests / privacy_scan.test.js
// Privacy primitive enforcement (DOCTRINE.md §5).
// Scans `core/`, `content/`, and `index.html` for forbidden API surfaces
// (alternate storage, network, analytics) and verifies that every
// `localStorage.setItem(...)` call uses a key from the allow-list.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Roots to scan — product-runtime surfaces only. Tests, audits, build
// metadata, and external folders are out of scope: they are not the
// runtime, so storing/transmitting tokens there would not violate §5.
const SCAN_ROOTS = ['core', 'content', 'ui'];
const SCAN_FILES = ['index.html'];
const TEXT_EXTS = ['.js', '.html'];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile() && TEXT_EXTS.some(ext => full.endsWith(ext))) yield full;
  }
}

function scanFiles() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(REPO_ROOT, root);
    try {
      const st = statSync(abs);
      if (st.isDirectory()) for (const f of walk(abs)) files.push(f);
    } catch (_) { /* root may not exist; skip */ }
  }
  for (const f of SCAN_FILES) {
    const abs = join(REPO_ROOT, f);
    try {
      if (statSync(abs).isFile()) files.push(abs);
    } catch (_) { /* file may not exist; skip */ }
  }
  return files;
}

// Forbidden API surfaces. Most are case-sensitive — the API names are
// canonical and any deviation would not match the actual browser API
// anyway. `indexedDB` is also matched case-insensitively because the
// browser exposes both `window.indexedDB` (lowercase) and the
// `IndexedDB` interface name shows up in code referencing the spec.
const FORBIDDEN = [
  { token: 'sessionStorage',       caseSensitive: true  },
  { token: 'indexedDB',            caseSensitive: false },
  { token: 'IndexedDB',            caseSensitive: true  },
  { token: 'fetch(',               caseSensitive: true  },
  { token: 'XMLHttpRequest',       caseSensitive: true  },
  { token: 'navigator.sendBeacon', caseSensitive: true  },
  { token: 'gtag(',                caseSensitive: true  },
  { token: 'dataLayer',            caseSensitive: true  },
  { token: 'analytics.',           caseSensitive: true  }
];

// Allow-list is the inventory of keys actually used as of this commit.
// New keys require doctrine amendment to §5.
const LOCALSTORAGE_KEY_ALLOW = new Set([
  'eight_ball_profile_v1',
  'eight_ball_labels_revealed_v1',
  // v0.3.0 paid-tier counters (DOCTRINE §5 v0.22 allow-list extension)
  'eight_ball_tries_used_v1',
  'eight_ball_credits_v1',
  'eight_ball_pending_profile_v1',
  // v0.6.0 tier ladder (DOCTRINE §5 v0.36 allow-list extension / §1.D):
  // highest rung purchased, monotonic, written only by handlePaidReturn.
  'eight_ball_tier_v1',
  // v0.49 t3 written-entry rotation (§1.H): currently visible v1 slot.
  'eight_ball_facet_index_v1',
  // Saved Readings MVP (§5.E v0.50): array of reconstruction inputs + local metadata.
  'eight_ball_saved_readings_v1'
]);

// Match: localStorage.setItem('key', ...) or localStorage.setItem("key", ...)
// or localStorage.setItem(IDENTIFIER, ...). When the key is an identifier,
// resolve it via a same-file `const IDENT = '...'` definition; otherwise
// flag as unverifiable.
const SET_ITEM_RE = /localStorage\.setItem\s*\(\s*([^,\s)]+)/g;

function resolveIdentifier(content, ident) {
  const re = new RegExp(`(?:const|let|var)\\s+${ident}\\s*=\\s*(['"\`])([^'"\`]+)\\1`);
  const m = content.match(re);
  return m ? m[2] : null;
}

describe('privacy primitive scan (DOCTRINE.md §5)', () => {
  const files = scanFiles();

  for (const { token, caseSensitive } of FORBIDDEN) {
    it(`forbidden API surface: ${token}`, () => {
      const hits = [];
      const needle = caseSensitive ? token : token.toLowerCase();
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const haystack = caseSensitive ? content : content.toLowerCase();
        if (!haystack.includes(needle)) continue;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = caseSensitive ? lines[i] : lines[i].toLowerCase();
          if (line.includes(needle)) {
            hits.push(`${relative(REPO_ROOT, file)}:${i + 1}  ${lines[i].trim().slice(0, 120)}`);
          }
        }
      }
      expect(
        hits,
        `Forbidden token "${token}" found:\n${hits.join('\n')}\nDOCTRINE.md §5 forbids storage/network/analytics surfaces beyond the allow-listed localStorage profile payload.`
      ).toEqual([]);
    });
  }

  it('localStorage.setItem keys are allow-listed', () => {
    const offenders = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      let m;
      SET_ITEM_RE.lastIndex = 0;
      while ((m = SET_ITEM_RE.exec(content)) !== null) {
        const raw = m[1].trim();
        let key = null;
        let kind = '';
        if ((raw.startsWith("'") && raw.endsWith("'")) ||
            (raw.startsWith('"') && raw.endsWith('"')) ||
            (raw.startsWith('`') && raw.endsWith('`'))) {
          key = raw.slice(1, -1);
          kind = 'literal';
        } else if (/^[A-Za-z_$][\w$]*$/.test(raw)) {
          const resolved = resolveIdentifier(content, raw);
          if (resolved !== null) {
            key = resolved;
            kind = `identifier ${raw}`;
          } else {
            key = null;
            kind = `unresolvable identifier ${raw}`;
          }
        } else {
          key = null;
          kind = `expression ${raw}`;
        }
        if (key === null || !LOCALSTORAGE_KEY_ALLOW.has(key)) {
          // line number from char offset
          const before = content.slice(0, m.index);
          const lineNo = before.split('\n').length;
          offenders.push(
            `${relative(REPO_ROOT, file)}:${lineNo}  ` +
            `${kind} → ${key === null ? '(could not resolve)' : `"${key}"`} ` +
            `not in LOCALSTORAGE_KEY_ALLOW`
          );
        }
      }
    }
    expect(
      offenders,
      `Disallowed or unverifiable localStorage keys:\n${offenders.join('\n')}\n` +
      `Allow-list is the inventory of keys actually used as of this commit. ` +
      `New keys require doctrine amendment to §5.`
    ).toEqual([]);
  });
});
