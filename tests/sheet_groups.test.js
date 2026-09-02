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

  it('both prose blocks carry an always-on title on both surfaces', () => {
    for (const [name, src] of [['index.html', cardFace], ['sheet', buildSheetMarkup('x')]]) {
      expect(src, name).toMatch(/<div class="entry-title">WRITTEN ENTRY<\/div>/);
      expect(src, name).toMatch(/<div class="public-title">DOMAIN FIT<\/div>/);
      // the entry title sits INSIDE the entry block, after its rule
      const entry = src.slice(src.indexOf('card-entry'), src.indexOf('public-read'));
      expect(entry, name).toMatch(/card-prose-rule[\s\S]*entry-title/);
    }
  });
});

describe('sheet groups — always visible, off the PNG, in register', () => {
  const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('no stylesheet gates a group or block title behind the labels toggle, in any selector shape', () => {
    const css = stripComments(shellCss + '\n' + expCss);
    for (const cls of ['coord-group-title', 'coord-group', 'entry-title', 'public-title']) {
      expect(css, cls).not.toMatch(new RegExp(`labels-revealed[^{]*\\.${cls}\\b`));
      expect(css, cls).not.toMatch(new RegExp(`\\.${cls}\\b[^{]*\\{[^}]*(visibility:\\s*hidden|display:\\s*none)`));
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
