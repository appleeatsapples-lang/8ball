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
// the mechanical version of that read: it pins the CLASS rather than the
// instance, so any text that lands in a rule position without a block, and
// any unbalanced brace, fails here regardless of which rule it happens to.
//
// The FIRST version of this file did not manage that, and a second lane
// caught it: a prelude-only scan resets at every `}` without ever examining
// what it had accumulated, so a malformed rule that is the LAST rule of a
// block has no following `{` to absorb it and slips through every check.
// `@media(max-width:480px){.victim, height:0;}` passed brace-balance, the
// declaration-leak check and the dangling-comma check while Blink dropped
// `.victim` entirely. The scan below is block-aware — it tracks whether each
// open block holds RULES or DECLARATIONS — and the ORPHAN case (text in a
// rule position that no `{` ever opened) is the assertion the heuristics
// could not express. The negative fixtures at the bottom pin all of it:
// they assert this checker CATCHES known-bad stylesheets, so the suite
// proves its own teeth rather than only reporting green on good input.
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

// At-rules whose block holds RULES rather than declarations. Anything else
// that opens a block is a selector, and its block holds declarations.
const RULE_CONTAINER =
  /^\s*@(media|supports|layer|container|scope|document|(-[a-z]+-)?keyframes)\b/i;

/**
 * Every stretch of text that CSS will try to read AS A RULE:
 *
 *   - `preludes` — the text before a `{`. A selector list or an at-rule
 *     prelude: it can never legally contain a `;` and never legally end in
 *     a comma.
 *   - `orphans`  — the text left over when a block that holds RULES closes,
 *     or at end of file. There is nothing legal to be here: a rule position
 *     with no `{` after it. This is the case a prelude-only scan cannot see,
 *     because the malformed rule is the LAST one in its block and no
 *     following `{` ever absorbs it.
 *   - `blocks`   — the text inside a block that holds DECLARATIONS, so each
 *     `;`-separated statement can be checked for `property: value` shape.
 */
function scanRuleText(css) {
  const preludes = [];
  const orphans = [];
  const blocks = [];
  const stack = []; // true = this block holds rules, false = declarations
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const text = css.slice(start, i);
      preludes.push({ text, index: i });
      stack.push(RULE_CONTAINER.test(text));
      start = i + 1;
    } else if (ch === '}') {
      const holdsRules = stack.length === 0 || stack[stack.length - 1];
      const text = css.slice(start, i);
      if (text.trim() !== '') (holdsRules ? orphans : blocks).push({ text, index: i });
      stack.pop();
      start = i + 1;
    }
  }
  const tail = css.slice(start);
  if (stack.length === 0 && tail.trim() !== '') orphans.push({ text: tail, index: css.length });
  return { preludes, orphans, blocks };
}

// Every text that lands in a rule position, whether or not a `{` followed it.
function preludes(css) {
  const { preludes: p, orphans } = scanRuleText(css);
  return p.concat(orphans);
}

// A declaration must be `property: value` — its first `:` cannot be preceded
// by a comma. Legitimate declarations put their commas AFTER the colon
// (`font-family: a, b`, `rgba(0,0,0,.5)`), so this fires only when a selector
// list has leaked into a declaration position.
const DECL_OK = /^[^{},]*:[^{}]*$/;

function badDeclarations(css) {
  const out = [];
  for (const block of scanRuleText(css).blocks) {
    for (const stmt of block.text.split(';')) {
      const s = stmt.trim();
      if (s && !DECL_OK.test(s)) out.push(s.replace(/\s+/g, ' ').slice(0, 120));
    }
  }
  return out;
}

/** Every check in this file, as one list of complaints. '' means clean. */
function complaints(css) {
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  return [
    ...(open === close ? [] : [`unbalanced braces: ${open} '{' vs ${close} '}'`]),
    ...preludes(css).filter(p => p.text.includes(';')).map(p => `declaration in a rule position: ${p.text.trim()}`),
    ...preludes(css).filter(p => p.text.trim().endsWith(',')).map(p => `dangling comma: ${p.text.trim()}`),
    ...scanRuleText(css).orphans.map(o => `rule with no block: ${o.text.trim()}`),
    ...badDeclarations(css).map(d => `malformed declaration: ${d}`),
  ];
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

    // The assertion the two heuristics above cannot express, and the one the
    // first version of this file was missing: text sitting in a rule position
    // that no `{` ever opened. A malformed LAST rule in a block leaves exactly
    // this and nothing else behind.
    it(`${name}: no rule is left dangling without a block`, () => {
      const stranded = scanRuleText(css).orphans
        .map(o => o.text.trim().replace(/\s+/g, ' ').slice(0, 120));
      expect(stranded, `${name}: text in a rule position that no '{' opens`).toEqual([]);
    });

    it(`${name}: every declaration is property: value`, () => {
      expect(badDeclarations(css), `${name}: malformed declaration(s)`).toEqual([]);
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

// ── the checker's own teeth ────────────────────────────────────────
//
// A green result on good input proves nothing about a checker. These assert
// it CATCHES known-bad stylesheets and PASSES the awkward-but-legal ones —
// including every construct the real sheets actually use, so the checker is
// held to no false positives as firmly as to no false negatives.
//
// The second entry is the shape a pre-merge lane found this file missing:
// it passed brace-balance, the declaration-leak check and the dangling-comma
// check while a real CSS engine dropped `.victim` entirely.

describe('stylesheet checker — negative and positive fixtures', () => {
  const MALFORMED = [
    ['the shape that shipped: malformed rule, next rule absorbed',
      '.a,\n  height: 0;\n  overflow: hidden;\n}\n\n.b { color: red; }'],
    ['malformed LAST rule inside @media (the prelude-only scan missed this)',
      '@media(max-width:480px){.victim, height:0;}'],
    ['malformed LAST rule inside @supports',
      '@supports (display:grid){.real{color:red}.victim, height:0;}'],
    ['a bare selector with no block, last in a container',
      '@media (max-width: 480px) { .real { color: red; } .victim }'],
    ['a bare selector with no block, at end of file',
      '.ok { color: red; }\n.victim'],
    ['a selector list leaking into a declaration block',
      '.a { .b, height: 0; }'],
    ['unbalanced: a block never closed',
      '.a { color: red;'],
  ];

  for (const [name, css] of MALFORMED) {
    it(`catches: ${name}`, () => {
      expect(complaints(stripNoise(css)), `not caught: ${css}`).not.toEqual([]);
    });
  }

  const LEGAL = [
    ['comma-bearing font stack', '.a { font-family: ui-monospace, Menlo, monospace; }'],
    ['comma-bearing transition', '.a { transition: color 1s, background 2s; }'],
    ['comma-bearing rgba in a shadow', '.a { box-shadow: 0 0 0 18px rgba(255,255,255,.08) inset; }'],
    ['comma-bearing grid areas', '.a { grid-template-areas: "x y", "z w"; }'],
    ['var() with a fallback', '.a { color: var(--x, #fff); }'],
    ['multi-line selector list', '.a,\n.b {\n  color: red;\n}'],
    ['pseudo-class selector list', '.a:hover,\n.b:focus-visible { color: red; }'],
    [':has() chains (the real #enter-btn rule)',
      '#f:has(#n:valid):has(.g :focus) #e { opacity: 0; visibility: hidden; }'],
    ['nested @media', '@media (max-width: 480px) {\n  .a, .b { color: red; }\n}'],
    ['@supports', '@supports (display: grid) { .a { display: grid; } }'],
    ['@keyframes with percentage steps',
      '@keyframes k { 0% { opacity: 0; } 100% { opacity: 1; } }'],
    ['a brace inside a string', '.a::before { content: "{"; }'],
    ['an empty block', '.a { }'],
    ['a comment between rules', '.a { color: red; }\n/* note, with a comma */\n.b { color: blue; }'],
  ];

  for (const [name, css] of LEGAL) {
    it(`passes: ${name}`, () => {
      expect(complaints(stripNoise(css)), `false positive on: ${css}`).toEqual([]);
    });
  }
});
