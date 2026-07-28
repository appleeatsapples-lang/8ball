// 8ball / tests / markup_contract.test.js
//
// The seam between index.html's markup and the modules that drive it.
//
// Every DOM reference in this app is resolved once at boot through
// `const $ = id => document.getElementById(id)` and handed to a ui/ module
// as a refs object. Nothing checked that those two halves agreed: rename an
// id in the markup and `$()` returns null, the module stores it, and the
// first interaction throws — with the whole suite still green, because the
// DOM tests supply their own hand-built refs rather than the real markup
// (node env, no jsdom, per §12 minimal tooling). 63 id couplings and 41 ref
// keys, none of them enforced.
//
// This file is the enforcement. It is deliberately all static analysis —
// that is the only way to compare the markup against module source without
// a DOM — so every block carries a self-check on the extractor itself. A
// regex that silently stops matching would otherwise turn the whole file
// into a green no-op, which is the specific failure mode a scan-based test
// has to defend against.
//
// The same species of check for ui/boot.js's 14 hooks lives in
// tests/boot.test.js ("the host supplies exactly the hooks runBoot
// destructures"), next to that module's behavioral tests.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');

const inlineModule = html.match(
  /<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/
)?.[1];

const declaredIds = [...html.matchAll(/\bid="([\w-]+)"/g)].map(m => m[1]);
const fetchedIds = [...(inlineModule ?? '').matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]);

// ── id contract ──────────────────────────────────────────────────────

describe('markup contract — $() ids resolve against the markup', () => {
  it('the extractors found the inline module and its lookups', () => {
    // Self-check. If index.html is reformatted such that either regex stops
    // matching, fail loudly here rather than pass every assertion below
    // against two empty sets.
    expect(inlineModule, 'inline <script type="module"> not found').toBeTruthy();
    expect(fetchedIds.length).toBeGreaterThan(50);
    expect(declaredIds.length).toBeGreaterThan(50);
  });

  it('every id fetched by $() is declared in the markup', () => {
    const declared = new Set(declaredIds);
    const missing = [...new Set(fetchedIds)].filter(id => !declared.has(id));
    // Named rather than counted: the failure message should say which id
    // was renamed, since that is the whole diagnostic.
    expect(missing).toEqual([]);
  });

  it('no id is declared twice — $() would resolve ambiguously', () => {
    const seen = new Set();
    const dupes = new Set();
    for (const id of declaredIds) {
      if (seen.has(id)) dupes.add(id);
      seen.add(id);
    }
    expect([...dupes]).toEqual([]);
  });

  it('every aria/for reference points at an element that exists', () => {
    // aria-labelledby / -describedby / -controls / -activedescendant and
    // <label for> are the other id consumers. A dangling one is an a11y
    // break with no visual symptom, so nothing else in the suite sees it.
    const refs = [...html.matchAll(
      /(?:aria-(?:labelledby|describedby|controls|activedescendant)|for)="([\w\- ]+)"/g
    )].flatMap(m => m[1].split(/\s+/)).filter(Boolean);
    expect(refs.length).toBeGreaterThan(0); // self-check
    const declared = new Set(declaredIds);
    expect(refs.filter(id => !declared.has(id))).toEqual([]);
  });
});

// ── init*UI ref parity ───────────────────────────────────────────────

// Every ui/ module this app boots, and the file it lives in. If a module is
// added to the boot sequence without being added here it simply is not
// covered, so the roster is asserted against index.html below.
const INIT_MODULES = {
  initPaywallUI: 'ui/payments.js',
  initModalsUI: 'ui/modals.js',
  initProfileUI: 'ui/profile.js',
  initReadingsUI: 'ui/readings.js',
  initLabelsUI: 'ui/labels.js',
  initTiersUI: 'ui/tiers.js',
  initMeaningsUI: 'ui/meanings.js',
  initShareUI: 'ui/share.js',
  initCitySearchUI: 'ui/citysearch.js',
};

// Brace-match the first object-literal argument of a call. Regex cannot do
// this: initModalsUI's refs span lines and initTiersUI's carry a nested
// `cells: {...}`.
function firstArgLiteral(src, fnName) {
  const at = src.indexOf(`${fnName}(`);
  if (at === -1) return null;
  let depth = 0;
  let start = -1;
  for (let i = src.indexOf('(', at); i < src.length; i++) {
    const c = src[i];
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
    else if (c === ')' && depth === 0) return null;
  }
  return null;
}

// Top-level keys only — a nested `cells: { sun: ..., }` contributes `cells`.
function topLevelKeys(literal) {
  const body = literal.slice(1, -1);
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if ('{[('.includes(c)) depth++;
    else if ('}])'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { parts.push(body.slice(start, i)); start = i + 1; }
  }
  parts.push(body.slice(start));
  return parts
    .map(p => p.replace(/\/\/[^\n]*/g, '').trim())
    .filter(Boolean)
    .map(p => p.match(/^([A-Za-z_$][\w$]*)\s*(?::|$)/)?.[1])
    .filter(Boolean);
}

// The three ways a ui/ module reaches its refs, all of which are in use:
//   (a) destructured in the signature   — initPaywallUI({ modal, ... })
//   (b) destructured from `refs`        — initModalsUI, initReadingsUI, initLabelsUI
//   (c) stored then accessed ad hoc     — initProfileUI/_refs, aliased to `r`
function requiredRefKeys(src, fnName) {
  const keys = new Set();

  const sig = src.match(new RegExp(`export function ${fnName}\\(\\s*\\{([^}]*)\\}`));
  if (sig) {
    for (const k of sig[1].split(',')) {
      const name = k.trim().split(':')[0].trim();
      if (name) keys.add(name);
    }
  }

  for (const m of src.matchAll(/const\s*\{([^}]*)\}\s*=\s*(?:refs|_refs)\b/g)) {
    for (const k of m[1].split(',')) {
      const name = k.trim().split(':')[0].trim();
      if (name) keys.add(name);
    }
  }

  // `const r = _refs;` then `r.timeInput` — ui/profile.js's shape, and the
  // one the naive `refs.X` pattern misses entirely.
  const holders = new Set(['refs', '_refs']);
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*_?refs\s*;/g)) {
    holders.add(m[1]);
  }
  for (const holder of holders) {
    for (const m of src.matchAll(new RegExp(`\\b${holder}\\.([A-Za-z_$][\\w$]*)`, 'g'))) {
      keys.add(m[1]);
    }
  }

  return keys;
}

describe('markup contract — init*UI ref parity', () => {
  it('the roster covers every init*UI index.html actually calls', () => {
    // Self-check on the table itself: a new controller wired into the boot
    // sequence must be added here, or its refs go unchecked silently.
    const called = new Set(
      [...(inlineModule ?? '').matchAll(/\b(init[A-Za-z]*UI)\(/g)].map(m => m[1])
    );
    expect([...called].sort()).toEqual(Object.keys(INIT_MODULES).sort());
  });

  for (const [fnName, path] of Object.entries(INIT_MODULES)) {
    describe(fnName, () => {
      const src = readFileSync(join(root, path), 'utf-8');
      const required = requiredRefKeys(src, fnName);
      const literal = firstArgLiteral(inlineModule ?? '', fnName);
      const supplied = new Set(literal ? topLevelKeys(literal) : []);

      it('the extractor resolved both sides', () => {
        // Without this, a parse failure reads as "no requirements, all met".
        expect(literal, `refs literal for ${fnName} not found in index.html`).toBeTruthy();
        expect(required.size, `no ref keys extracted from ${path}`).toBeGreaterThan(0);
        expect(supplied.size).toBeGreaterThan(0);
      });

      it('index.html supplies every ref the module reads', () => {
        // The break this catches: the module gains a ref, the call site is
        // not updated, and it reads undefined at the first interaction.
        expect([...required].filter(k => !supplied.has(k))).toEqual([]);
      });

      it('index.html supplies no ref the module never reads', () => {
        // The other direction, and the likelier one: a ref is renamed in
        // the module and the old key is left behind at the call site, so
        // the module quietly reads undefined while the wiring still looks
        // complete.
        expect([...supplied].filter(k => !required.has(k))).toEqual([]);
      });
    });
  }
});
