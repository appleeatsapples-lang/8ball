// 8ball / tests / mobile_submit_a11y.test.js
//
// The onboarding submit (#enter-btn, "begin") must stay IN FLOW and IN THE
// TAB ORDER at every viewport.
//
// What the stylesheet did, and what a live headless-Chrome pass measured at
// the commit this file was written against (320x568 and 390x844, mobile
// emulation, real Tab key events over CDP):
//
//   1. `@media (max-width: 480px)` gave #enter-btn `position: fixed` — a
//      72px disc pinned bottom-right with an opaque 12px box-shadow ring.
//      Out of flow, it painted over live content: at 320px the disc's box
//      was 232..304 x 480..552 and #city-input's was 133..304 x 529..573,
//      and `document.elementFromPoint(268, 548)` — a point inside the
//      birthplace field — returned the BUTTON. 42% of that input's width
//      could not be tapped. At 390px the same disc covered the .disclaimer
//      line (72x11px of overlap).
//
//   2. The `:has()` reveal hid it — `visibility: hidden; pointer-events:
//      none` — while ANY descendant of #rising-fields held focus. #enter-btn
//      is the next tab stop AFTER those optional fields, so the browser
//      evaluated "what is focusable next" at the moment the button was
//      hidden and skipped it. The measured focus walk at both mobile widths:
//      name -> dob -> gender -> summary -> time -> city -> <body>. At
//      1280x800 the identical walk ended on button#enter-btn. Begin was
//      unreachable by keyboard on mobile, and there is no other order that
//      arrives at it: every tab stop preceding it lives inside #rising-fields.
//
// Both halves are one class of defect — a stylesheet rule that takes the
// submit out of flow or out of the tab order — so this guard is written
// against the class, not the two instances.
//
// SCOPE, stated plainly: geometry and focus order need a real browser, and
// this suite has none (§12 forbids a DOM harness, §7 caps devDependencies at
// vitest). The overlap boxes and the Tab walk above are NOT re-run here.
// What IS covered is the stylesheet fact that makes them possible: no rule
// whose subject is the submit may position it out of flow, hide it, or make
// it untargetable. Re-introduce either rule and this file fails.
//
// Deliberately not a CSS parser dependency (§5/§7) — the block-aware scan is
// the same idiom css_structure.test.js already uses on these two files.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');

const SOURCES = [
  ['ui/experience.css', readFileSync(join(root, 'ui', 'experience.css'), 'utf-8')],
  ['index.html <style>', (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1]],
];

function stripNoise(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

const RULE_CONTAINER =
  /^\s*@(media|supports|layer|container|scope|document|(-[a-z]+-)?keyframes)\b/i;

// Every (selector, declaration block) pair, at-rule nesting included. The
// `stack` tracks whether the open block holds rules or declarations, so a
// selector inside @media/@supports is read as a selector and an at-rule
// prelude is never mistaken for one.
function rules(css) {
  const out = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      const prelude = css.slice(start, i);
      stack.push({ holdsRules: RULE_CONTAINER.test(prelude), prelude });
      start = i + 1;
    } else if (css[i] === '}') {
      const frame = stack.pop();
      if (frame && !frame.holdsRules) {
        out.push({ selector: frame.prelude.trim().replace(/\s+/g, ' '), body: css.slice(start, i) });
      }
      start = i + 1;
    }
  }
  return out;
}

// A rule "targets the submit" when the SUBJECT of one of its selectors — the
// last compound, the element the declarations actually land on — carries
// #enter-btn. `#profile-form:has(...) #enter-btn` targets it; a rule that
// merely mentions the id in an ancestor position does not.
function targetsSubmit(selector) {
  return selector.split(',').some((sel) => {
    const subject = sel.trim().split(/\s+|(?<=\))\s*>/).pop() || '';
    return /#enter-btn\b/.test(subject.replace(/:[a-z-]+(\([^)]*\))?/g, ''));
  });
}

const declarations = (body) =>
  body.split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean);

// Out of flow → free to paint over its neighbours. Hidden / untargetable →
// out of the tab order (visibility and display remove a control from
// sequential focus navigation; pointer-events: none removes the tap).
const BANNED = [
  [/^position\s*:\s*(fixed|absolute)$/i, 'takes the submit out of flow — it can then overlap live content'],
  [/^visibility\s*:\s*hidden$/i, 'removes the submit from the tab order'],
  [/^display\s*:\s*none$/i, 'removes the submit from the tab order'],
  [/^opacity\s*:\s*0(\.0+)?$/i, 'renders the submit invisible while it still holds a tab stop'],
  [/^pointer-events\s*:\s*none$/i, 'makes the submit untappable'],
];

describe('onboarding submit — in flow and in the tab order at every width', () => {
  // Non-vacuity: the scan must actually reach rules for this id, and the id
  // must still be what the markup uses. A renamed button or a matcher that
  // silently selects nothing would otherwise pass every assertion below.
  it('the scan finds the submit rules it is guarding', () => {
    expect(html).toMatch(/<button[^>]*\bid="enter-btn"/);
    const matched = SOURCES.flatMap(([name, css]) =>
      rules(stripNoise(css)).filter((r) => targetsSubmit(r.selector)).map((r) => `${name}: ${r.selector}`));
    expect(matched.length, 'no stylesheet rule targets #enter-btn — the guard would be vacuous').toBeGreaterThan(0);
  });

  for (const [name, css] of SOURCES) {
    it(`${name}: no rule positions, hides or disables the submit`, () => {
      const offences = [];
      for (const rule of rules(stripNoise(css))) {
        if (!targetsSubmit(rule.selector)) continue;
        for (const decl of declarations(rule.body)) {
          for (const [pattern, why] of BANNED) {
            if (pattern.test(decl)) offences.push(`${rule.selector} { ${decl} } — ${why}`);
          }
        }
      }
      expect(offences, `${name}: rule(s) that break the submit`).toEqual([]);
    });
  }

  // The markup half of "reachable by Tab": a real submit button, no tabindex
  // rewriting the order, and sitting after the optional group — which is what
  // made a focus-conditional hide fatal rather than merely ugly.
  it('the submit is a plain tab stop after the optional birth-data group', () => {
    const form = (html.match(/<form id="profile-form"[\s\S]*?<\/form>/) || [''])[0];
    const button = (form.match(/<button[^>]*\bid="enter-btn"[^>]*>/) || [''])[0];
    expect(button, 'the submit is not inside #profile-form').not.toBe('');
    expect(button).toMatch(/type="submit"/);
    expect(button).not.toMatch(/tabindex/);
    expect(button).not.toMatch(/\bhidden\b/);
    expect(form.indexOf('id="rising-fields"')).toBeLessThan(form.indexOf('id="enter-btn"'));
  });
});
