// 8ball / tests / sheet_groups.test.js
//
// §1.F v0.72 — the sheet organized by counting system (controller order,
// 2026-09-02: "I want it more organized"). Four always-visible group
// titles — TAROT · WESTERN · CHINESE · NUMEROLOGY — with the rows
// regrouped under them, plus always-visible titles on the two prose
// blocks. What this file pins:
//   1. the REGISTRY is the single source of row order (host sheet, dyad
//      sheets and the share snapshot all derive from it)
//   2. the host markup and the sheet builder both follow it, group by
//      group, title by title
//   3. group titles are ALWAYS visible — no labels-reveal gate, in any
//      selector shape, in either host stylesheet
//   4. group titles stay OFF the §5.D share PNG (rows are serialized,
//      groups are not)
//   5. the titles are system names in the §2 register — never a value,
//      never interpretation — and the grouping is honest (the pillars
//      are Chinese rows, not a fifth system)

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHEET_GROUPS, SHEET_ROWS, CELL_KEYS } from '../ui/tiers.js';
import { buildSheetMarkup } from '../ui/sheet.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const shellCss = readFileSync(join(root, 'ui', 'shell.css'), 'utf-8');
const expCss = readFileSync(join(root, 'ui', 'experience.css'), 'utf-8');
const shareJs = readFileSync(join(root, 'ui', 'share.js'), 'utf-8');

const cardFace = html.slice(html.indexOf('id="card-face"'), html.indexOf('</article>'));

// Group markup in document order: [{key, title, leads}] where leads are
// the first cell id of every coord-section inside the group.
function groupsIn(markup, idOf) {
  const out = [];
  const re = /<div class="coord-group" data-system="([a-z]+)">\s*<div class="coord-group-title">([^<]*)<\/div>([\s\S]*?)<\/div>\s*(?=<div class="coord-group"|<div class="card-entry")/g;
  let m;
  while ((m = re.exec(markup)) !== null) {
    const leads = [...m[3].matchAll(idOf)].map(x => x[1]);
    out.push({ key: m[1], title: m[2], leads });
  }
  return out;
}

describe('sheet groups — the registry is the single source of row order', () => {
  it('four groups, in this order, with these titles', () => {
    expect(SHEET_GROUPS.map(g => [g.key, g.title])).toEqual([
      ['tarot', 'TAROT'], ['western', 'WESTERN'], ['chinese', 'CHINESE'], ['numerology', 'NUMEROLOGY'],
    ]);
  });

  it('the grouping is honest: the four Chinese pillars are one system, not two', () => {
    const chinese = SHEET_GROUPS.find(g => g.key === 'chinese').rows;
    // year stem · year/month branches · day · hour — one four-pillar set.
    expect(chinese).toEqual([['element'], ['animal', 'innerAnimal'], ['dayPillar'], ['hourPillar']]);
    expect(SHEET_GROUPS.some(g => /pillar/i.test(g.title))).toBe(false);
  });

  it('SHEET_ROWS and CELL_KEYS are derived from the groups, never restated', () => {
    expect(SHEET_ROWS).toEqual(SHEET_GROUPS.flatMap(g => g.rows));
    expect(CELL_KEYS).toEqual(SHEET_GROUPS.flatMap(g => g.rows.flat()));
    expect(CELL_KEYS).toHaveLength(14);
    expect(new Set(CELL_KEYS).size).toBe(14);
  });

  it('the registry is frozen at every level', () => {
    expect(Object.isFrozen(SHEET_GROUPS)).toBe(true);
    for (const g of SHEET_GROUPS) {
      expect(Object.isFrozen(g)).toBe(true);
      expect(Object.isFrozen(g.rows)).toBe(true);
      for (const r of g.rows) expect(Object.isFrozen(r)).toBe(true);
    }
  });
});

describe('sheet groups — host markup and the sheet builder follow the registry', () => {
  const hostIdOf = /id="coord-([a-z]+)-symbol"/g;
  const sheetIdOf = /data-sheet-cell="x:([A-Za-z]+)"/g;
  // Host cell ids are historical (coord-inner-symbol for innerAnimal, the
  // rest lowercase); sheet attributes keep the registry key verbatim.
  const HOST_ID = { innerAnimal: 'inner' };
  const expected = SHEET_GROUPS.map(g => ({
    key: g.key, title: g.title,
    hostLeads: g.rows.flat().map(k => HOST_ID[k] || k.toLowerCase()),
    sheetLeads: g.rows.flat(),
  }));

  it('index.html: every group present, in order, with every cell of every row inside it', () => {
    const got = groupsIn(cardFace, hostIdOf);
    expect(got.map(g => g.key)).toEqual(expected.map(g => g.key));
    expect(got.map(g => g.title)).toEqual(expected.map(g => g.title));
    expect(got.map(g => g.leads)).toEqual(expected.map(g => g.hostLeads));
    expect((cardFace.match(/class="coord-section"/g) || []).length).toBe(8);
  });

  it('buildSheetMarkup: the same groups, order, titles and cells', () => {
    const got = groupsIn(buildSheetMarkup('x'), sheetIdOf);
    expect(got.map(g => g.key)).toEqual(expected.map(g => g.key));
    expect(got.map(g => g.title)).toEqual(expected.map(g => g.title));
    expect(got.map(g => g.leads)).toEqual(expected.map(g => g.sheetLeads));
  });

  it('both prose blocks carry an always-on title on both surfaces, each INSIDE its own block', () => {
    for (const [name, src] of [['index.html', cardFace], ['sheet', buildSheetMarkup('x')]]) {
      // Exactly one of each title on the card…
      expect((src.match(/<div class="entry-title">WRITTEN ENTRY<\/div>/g) || []).length, name).toBe(1);
      expect((src.match(/<div class="public-title">DOMAIN FIT<\/div>/g) || []).length, name).toBe(1);
      // …and each sits inside its block's own element: the block opens at
      // its class attribute and closes at its seal span, so a title moved
      // to a SIBLING of the block (pr230 audit F3) falls outside the slice.
      const block = cls => {
        const open = src.search(new RegExp(`<div class="${cls}"`));
        expect(open, `${name}: ${cls} block`).toBeGreaterThan(-1);
        const close = src.indexOf('<span class="coord-seal"', open);
        expect(close, `${name}: ${cls} seal`).toBeGreaterThan(open);
        return src.slice(open, close);
      };
      expect(block('card-entry'), name).toMatch(/card-prose-rule[\s\S]*<div class="entry-title">WRITTEN ENTRY<\/div>/);
      expect(block('public-read'), name).toMatch(/card-prose-rule[\s\S]*<div class="public-title">DOMAIN FIT<\/div>/);
      expect(block('card-entry'), name).not.toMatch(/public-title/);
      expect(block('public-read'), name).not.toMatch(/entry-title/);
    }
  });
});

describe('sheet groups — always visible, off the PNG, in register', () => {
  const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('no stylesheet can hide a group or block title — by class, attribute, OR position (pr230 audit)', () => {
    // §12 forbids jsdom, so this is a SOURCE pin, and the pr230 lanes showed
    // the first draft's blind spot: a positional gate such as
    // `[data-system] > div:first-child { display: none }` never names the
    // class and rode the whole suite green. The pin now inverts: every rule
    // carrying a HIDING declaration is inspected, and its selector may not
    // be able to reach a title by class, by the group's data attribute, or
    // by structural position under the card. Live-fire (every audit lane
    // drives the real render) remains the ultimate guard; this narrows the
    // gap between the two.
    const css = stripComments(shellCss + '\n' + expCss);
    const HIDING = /(visibility\s*:\s*hidden|display\s*:\s*none|opacity\s*:\s*0(?![.\d])|font-size\s*:\s*0(?!\.)|height\s*:\s*0(?![.\d])|clip(-path)?\s*:)/;
    const REACHES_TITLE = /(coord-group|data-system|entry-title|public-title|first-child|first-of-type|nth-child|nth-of-type|only-child|>\s*div|\bdiv\b)/;
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim(), m[2]]);
    expect(rules.length).toBeGreaterThan(100);
    const offenders = rules.filter(([sel, decl]) => HIDING.test(decl) && REACHES_TITLE.test(sel));
    expect(offenders.map(([sel]) => sel), 'rules that could hide a group or block title').toEqual([]);
    // And the labels toggle names none of the title classes in any shape.
    for (const cls of ['coord-group-title', 'coord-group', 'entry-title', 'public-title']) {
      expect(css, cls).not.toMatch(new RegExp(`labels-revealed[^{]*\\.${cls}\\b`));
    }
  });

  it('the group title is styled once, always-on, in the shell stylesheet', () => {
    const rule = shellCss.match(/\.card \.coord-group-title \{([^}]*)\}/);
    expect(rule, 'group-title rule missing').not.toBeNull();
    expect(rule[1]).toMatch(/text-transform: uppercase/);
    expect(rule[1]).not.toMatch(/visibility|display:\s*none/);
  });

  it('the share PNG serializes rows, never groups (§5.D unchanged)', () => {
    expect(shareJs).not.toMatch(/coord-group|SHEET_GROUPS/);
  });

  it('titles are bare system names — uppercase, no value, no interpretation, no second person', () => {
    for (const g of SHEET_GROUPS) {
      expect(g.title).toMatch(/^[A-Z]+$/);
      expect(g.title).not.toMatch(/you|your|will|should|lucky|fate|destiny/i);
    }
  });
});
