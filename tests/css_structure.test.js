// 8ball / tests / css_structure.test.js
//
// The guard the suite did not have.
//
// §1.D v0.67 deleted the kua block. One of its selectors was the second
// member of a two-selector list in ui/experience.css, and the deletion took
// the selector but left its trailing comma:
//
//     .card:not(.labels-revealed) .public-title,
//       height: 0; margin: 0; overflow: hidden;
//     }
//
// That rule has no opening brace. CSS error recovery does not stop at the
// end of the line — it consumes the malformed prelude up to the NEXT `{`,
// so the declarations were absorbed into the selector list AND the rule
// that followed (`.card-back .glyph`) was swallowed with it. Two surfaces
// went dead and 1904 tests stayed green, because no test in this repo read
// a stylesheet at all.
//
// A cross-model pre-merge lane caught it by reading the diff. This file is
// the mechanical version of that read, and it pins the CLASS rather than
// the instance: any declaration that ends up in a selector prelude, and any
// unbalanced brace, fails here regardless of which rule it happens to.
//
// Deliberately NOT a CSS parser dependency (§5: no new runtime or dev
// dependency for a check this small) and deliberately not jsdom (§12).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCES = [
  ['ui/experience.css', readFileSync(join(__dirname, '..', 'ui', 'experience.css'), 'utf-8')],
  // index.html's <style> block is the other tracked stylesheet (§6 keeps it
  // in the host file), so it gets the same treatment rather than a pass.
  ['index.html <style>', extractStyleBlock(readFileSync(join(__dirname, '..', 'index.html'), 'utf-8'))],
];

function extractStyleBlock(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!m) throw new Error('index.html carries no <style> block');
  return m[1];
}

// Strip comments and quoted strings so a `{`, `}` or `;` inside either can
// never be mistaken for structure (e.g. `content: "8"`).
function stripNoise(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

/**
 * Every selector prelude in the sheet: the text between the end of one rule
 * (or the start of the file, or the opening of a nested block) and the `{`
 * that opens the next. A prelude is a selector list or an at-rule — it can
 * never legally contain a `;`, and can never legally end in a comma.
 */
function preludes(css) {
  const out = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      out.push({ text: css.slice(start, i), index: i });
      start = i + 1;
    } else if (ch === '}') {
      start = i + 1;
    }
  }
  return out;
}

describe('stylesheet structure — a malformed rule takes its neighbours with it', () => {
  for (const [name, raw] of SOURCES) {
    const css = stripNoise(raw);

    it(`${name}: braces balance`, () => {
      const open = (css.match(/\{/g) || []).length;
      const close = (css.match(/\}/g) || []).length;
      expect(close, `${name}: ${open} '{' vs ${close} '}'`).toBe(open);
    });

    it(`${name}: no declaration leaks into a selector prelude`, () => {
      const leaked = preludes(css)
        .filter(p => p.text.includes(';'))
        // An at-rule prelude legitimately carries no ';' either, so no
        // carve-out is needed — @media/@supports preludes are ';'-free.
        .map(p => p.text.trim().replace(/\s+/g, ' ').slice(0, 120));
      expect(leaked, `${name}: selector prelude(s) containing a declaration`).toEqual([]);
    });

    it(`${name}: no selector list ends in a dangling comma`, () => {
      const dangling = preludes(css)
        .map(p => p.text.trim())
        .filter(text => text.endsWith(','))
        .map(text => text.replace(/\s+/g, ' ').slice(-120));
      expect(dangling, `${name}: selector list(s) with a trailing comma`).toEqual([]);
    });
  }

  // The two rules the dangling comma actually killed. Pinned by name so a
  // future deletion of either is a deliberate act, not a silent casualty.
  it('the two rules the malformed prelude swallowed are present and well-formed', () => {
    const css = stripNoise(SOURCES[0][1]);
    expect(css).toMatch(/\.card:not\(\.labels-revealed\)\s+\.public-title\s*\{/);
    expect(css).toMatch(/\.card-back\s+\.glyph\s*\{/);
  });
});
