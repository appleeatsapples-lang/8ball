// 8ball / tests / desk_layout.test.js
//
// The registry desk (controller order, 2026-09-02: "we are now on desktop
// go wild"). At ≥1100px the result screen becomes three columns — the
// sheet, a READING PANE where the meaning panel docks, and the rail —
// and the rail's controls are filed under three small titles at every
// width (read · keep · device). What this file pins:
//   1. the host markup: the pane sits in .result-main between the stage
//      and the rail, OUTSIDE #card-face (the share PNG serializes the
//      card; the pane is never part of a reading's snapshot)
//   2. the rail groups: order, membership, register
//   3. the experience layer: the pane is display:none until the desk
//      breakpoint, then a sticky self-scrolling column; the ≥720 rail
//      contract (tests/density.test.js) is untouched by the desk block
//   4. the docking logic in ui/meanings.js, run for real against DOM
//      mocks: the panel is one node, homed in #card-face below the
//      breakpoint, moved (never duplicated) into the pane above it, moved
//      back on a crossing, and unaffected by a host with no matchMedia
//      or no pane at all (the injected-DOM and test surfaces)

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initMeaningsUI } from '../ui/meanings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const shellCss = readFileSync(join(root, 'ui', 'shell.css'), 'utf-8');
const expCss = readFileSync(join(root, 'ui', 'experience.css'), 'utf-8');
const meaningsJs = readFileSync(join(root, 'ui', 'meanings.js'), 'utf-8');

const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

// The body of a top-level @media block by brace matching (the rules
// inside are themselves brace-delimited, so a regex slice is not enough).
function mediaBlock(css, query) {
  const at = css.indexOf(`@media ${query}`);
  if (at < 0) return null;
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return null;
}
// [{sel, body}] for every rule in a css fragment (no nested @media inside).
const rulesOf = css => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const decl = (body, prop) => {
  const m = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
  return m ? m[1].trim() : null;
};
// The css OUTSIDE every @media block.
function topLevel(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) { out += css.slice(i); break; }
    out += css.slice(i, at);
    const open = css.indexOf('{', at);
    let depth = 0, j = open;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

describe('desk — host markup', () => {
  const main = html.slice(html.indexOf('class="result-main"'), html.indexOf('/.result-main'));
  const iStage = main.indexOf('class="flip-stage"');
  const iCardEnd = main.indexOf('</article>');
  const iPane = main.indexOf('id="reading-pane"');
  const iRail = main.indexOf('class="result-rail"');

  it('the reading pane is an aside in .result-main, after the card and before the rail', () => {
    expect(iStage).toBeGreaterThanOrEqual(0);
    expect(iCardEnd).toBeGreaterThan(iStage);
    expect(iPane).toBeGreaterThan(iCardEnd);
    expect(iRail).toBeGreaterThan(iPane);
    expect(main).toMatch(/<aside class="reading-pane" id="reading-pane" aria-label="reading">/);
    expect((html.match(/id="reading-pane"/g) || []).length).toBe(1);
  });

  it('the pane is OUTSIDE #card-face — never part of the share snapshot', () => {
    const cardFace = html.slice(html.indexOf('id="card-face"'), html.indexOf('</article>'));
    expect(cardFace).not.toMatch(/reading-pane/);
    const shareJs = readFileSync(join(root, 'ui', 'share.js'), 'utf-8');
    expect(shareJs).not.toMatch(/reading-pane|readingPane|meaning-panel/);
  });

  it('the pane carries only its empty-state line, in register, until a panel docks', () => {
    const pane = main.slice(iPane, main.indexOf('</aside>', iPane));
    expect(pane).toMatch(/<p class="reading-pane-empty" id="reading-pane-empty">select a compartment — its entry files here\.<\/p>/);
    expect((pane.match(/<[a-z]/g) || []).length).toBe(1);
    expect(pane).not.toMatch(/\byou\b|\byour\b/i);
  });

  it('index.html closes the host panel when the dyad opens, before hiding the sheet (v0.78)', () => {
    // the handle is captured...
    expect(html).toMatch(/const meaningsUI = initMeaningsUI\(/);
    // ...and onOpen closes it FIRST, so the panel's focus return lands on a
    // still-visible cell; the dyad focuses its own root immediately after.
    expect(html).toMatch(/onOpen: \(\) => \{ meaningsUI\.close\(\); result\.classList\.add\('hidden'\); \}/);
    // onExit does NOT reopen it — returning lands on a sheet, not a stale panel
    expect(html).toMatch(/onExit: \(\) => result\.classList\.remove\('hidden'\)/);
    expect(html).not.toMatch(/onExit:[^,\n]*meaningsUI/);
  });

  it('index.html closes the host panel when the readings list opens too (v0.79)', () => {
    // the same handle, the other screen that hides #result — resolved at click
    // time because initReadingsUI runs above initMeaningsUI in the boot order
    expect(html).toMatch(/onOpen: \(\) => meaningsUI\.close\(\),/);
    expect(html).toMatch(/initReadingsUI\([\s\S]{0,400}?onOpen: \(\) => meaningsUI\.close\(\),/);
    // and the readings module asks for it rather than reaching into the panel
    const readingsJs = readFileSync(join(__dirname, '..', 'ui', 'readings.js'), 'utf-8');
    expect(readingsJs).toMatch(/if \(typeof hooks\.onOpen === 'function'\) hooks\.onOpen\(\);\s*\n\s*origin =/);
    expect(readingsJs).not.toMatch(/meaning-panel|initMeaningsUI/);
  });

  it('index.html hands the pane to initMeaningsUI, and the rail-read group to initDyadUI', () => {
    expect(html).toMatch(/initMeaningsUI\(\{\s*cardFace,\s*readingPane:\s*\$\('reading-pane'\)\s*\}\)/);
    expect(html).toMatch(/initDyadUI\(\{\s*stage:\s*document\.querySelector\('\.stage'\),\s*controls:\s*\$\('rail-read'\)\s*\}/);
  });
});

describe('desk — the rail groups (read · keep · device)', () => {
  const rail = html.slice(html.indexOf('class="result-rail"'), html.indexOf('/.result-rail'));
  // each title is a labelled element and each group a role=group pointing
  // at it, so the filing is programmatic, not three loose words (pr231
  // audit LOW-3)
  const groups = [...rail.matchAll(/<div class="rail-group-title" id="([a-z-]+)-title">([^<]*)<\/div>\s*<div class="result-controls rail-group" id="([a-z-]+)" role="group" aria-labelledby="([a-z-]+)-title">([\s\S]*?)<\/div>\s*(?=<div class="rail-group-title"|<\/div><!--)/g)]
    .map(m => ({ title: m[2], id: m[3], labelKey: m[1], byKey: m[4], ids: [...m[5].matchAll(/id="([a-z-]+)"/g)].map(x => x[1]) }));

  it('three titled groups, in this order, each its own .result-controls grid', () => {
    expect(groups.map(g => [g.title, g.id])).toEqual([
      ['read', 'rail-read'], ['keep', 'rail-keep'], ['device', 'rail-device'],
    ]);
    expect((rail.match(/class="result-controls rail-group"/g) || []).length).toBe(3);
    expect((rail.match(/class="result-controls"/g) || []).length).toBe(0);
    for (const g of groups) {
      expect(g.labelKey, g.id).toBe(g.id);
      expect(g.byKey, g.id).toBe(g.id);
    }
  });

  it('membership: flip again → read; save + share (+ their statuses) → keep; try another + forget → device', () => {
    expect(groups[0].ids).toEqual(['shake-again-btn']);
    expect(groups[1].ids).toEqual(['save-reading-btn', 'share-btn', 'save-reading-status', 'share-status']);
    expect(groups[2].ids).toEqual(['try-another-btn', 'forget-btn']);
  });

  it('the labels toggle and the density strip stay ABOVE the groups, ungrouped', () => {
    const iLabels = rail.indexOf('id="labels-toggle"');
    const iStrip = rail.indexOf('id="density-strip"');
    const iFirst = rail.indexOf('class="rail-group-title"');
    expect(iLabels).toBeGreaterThanOrEqual(0);
    expect(iStrip).toBeGreaterThan(iLabels);
    expect(iFirst).toBeGreaterThan(iStrip);
  });

  it('group titles are bare lowercase words in the §2 register — no second person, no verbs of promise', () => {
    for (const g of groups) {
      expect(g.title).toMatch(/^[a-z]+$/);
      expect(g.title).not.toMatch(/you|your|will|should/);
    }
    // styled once, in the experience layer, muted and uppercase-by-CSS
    const rule = stripComments(expCss).match(/\.rail-group-title \{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule[1]).toMatch(/text-transform: uppercase/);
    expect(rule[1]).toMatch(/var\(--text-muted\)/);
  });
});

describe('desk — the experience layer', () => {
  const exp = stripComments(expCss);
  const shell = stripComments(shellCss);
  const base = topLevel(exp);
  const desk = mediaBlock(exp, '(min-width: 1100px)');
  const wide = mediaBlock(exp, '(min-width: 1440px)');

  it('the pane is display:none at the top level and nowhere else hides or shows it below 1100', () => {
    const paneBase = rulesOf(base).filter(r => r.sel === '.reading-pane');
    expect(paneBase.map(r => decl(r.body, 'display'))).toEqual(['none']);
    expect(mediaBlock(exp, '(min-width: 720px)') || '').not.toMatch(/reading-pane/);
    expect(shell).not.toMatch(/reading-pane|rail-group/);
  });

  it('≥1100: the pane is a sticky, self-scrolling column with the rail\'s own 24px top', () => {
    expect(desk, 'desk block missing').not.toBeNull();
    const pane = rulesOf(desk).find(r => r.sel === '.reading-pane');
    expect(pane, '.reading-pane desk rule').toBeDefined();
    expect(decl(pane.body, 'display')).toBe('block');
    expect(decl(pane.body, 'position')).toBe('sticky');
    expect(decl(pane.body, 'top')).toBe('24px');
    expect(decl(pane.body, 'align-self')).toBe('flex-start');
    expect(decl(pane.body, 'overflow-y')).toBe('auto');
    // the exact constant: the stuck top is 88px (topbar 64 + the 24px
    // inset) and the bottom inset 24 — a loose /100vh/ pin let a
    // +400px cap through (pr231 audit M11 / MED-1)
    expect(decl(pane.body, 'max-height')).toBe('calc(100vh - 112px)');
    expect(decl(pane.body, 'min-width')).toBe('0');
  });

  it('≥1100: three columns — the shell\'s 360px sheet untouched, a bounded pane, a 300px rail', () => {
    const r = rulesOf(desk);
    // the card is a 360px 5:8 object at every ≥720 width (shell.css caps
    // .flip-stage at 360); a desk-block re-size would be a dead or lying
    // declaration, so the desk may not name the stage at all
    expect(r.some(x => /flip-stage|\.stage\b/.test(x.sel))).toBe(false);
    expect(decl(r.find(x => x.sel === '#result .result-rail').body, 'flex')).toBe('0 0 300px');
    const pane = r.find(x => x.sel === '.reading-pane');
    expect(decl(pane.body, 'flex')).toBe('1 1 380px');
    expect(decl(pane.body, 'max-width')).toBe('480px');
    expect(decl(r.find(x => x.sel === '#result').body, 'max-width')).toBe('1240px');
    // the wide tier only widens; it never re-declares the column contracts
    expect(wide, 'wide block missing').not.toBeNull();
    expect(wide).not.toMatch(/position|flex:|display/);
  });

  it('the desk block never touches the ≥720 rail contract or the labels toggle', () => {
    // the rail keeps sticky/top/align-self from the 720 block; the desk
    // block may only size it (tests/density.test.js pins the values)
    for (const r of rulesOf(desk).filter(x => /result-rail/.test(x.sel))) {
      expect(decl(r.body, 'position')).toBeNull();
      expect(decl(r.body, 'top')).toBeNull();
      expect(decl(r.body, 'display')).toBeNull();
    }
    expect(desk).not.toMatch(/labels-toggle|density-strip|card-face|\.card\b/);
  });

  it('inside the pane the panel is a column: no max-height clamp, no inner scroller', () => {
    const open = rulesOf(desk).find(r => r.sel === '.reading-pane .meaning-panel.open');
    expect(open, 'docked open-panel rule').toBeDefined();
    expect(decl(open.body, 'max-height')).toBe('none');
    expect(decl(open.body, 'overflow')).toBe('visible');
    // and the empty line yields only to an OPEN docked panel — by a class
    // the module sets, never by :has() (the file's only unguarded use)
    expect(desk).toMatch(/\.reading-pane\.docked\.has-entry \.reading-pane-empty \{ display: none; \}/);
    expect(desk).not.toMatch(/:has\(/);
  });

  it('the desk overrides the module\'s clamp on specificity: the module keeps class-level selectors, no !important', () => {
    const code = meaningsJs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).toMatch(/^\.meaning-panel\.open \{ max-height: 720px; overflow-y: auto;/m);
    expect(code).not.toMatch(/#meaning-panel[.:[]/);
    expect(code).not.toMatch(/!important/);
  });

  it('the breakpoint is one number, declared once in the module and matched by the stylesheet', () => {
    expect(meaningsJs).toMatch(/const DESK_QUERY = '\(min-width: 1100px\)';/);
    expect((expCss.match(/@media \(min-width: 1100px\)/g) || []).length).toBe(1);
  });
});

describe('desk — the panel docks by media query (ui/meanings.js run for real)', () => {
  const originalDocument = globalThis.document;
  const OriginalMO = globalThis.MutationObserver;
  const originalMM = globalThis.matchMedia;

  function makeNode(tag = 'div') {
    const handlers = {};
    const classes = new Set();
    const node = {
      tag, id: '', attrs: {}, dataset: {}, children: [], textContent: '', className: '',
      parentNode: null,
      classList: {
        add: c => classes.add(c),
        remove: c => classes.delete(c),
        contains: c => classes.has(c),
        toggle: (c, force) => { (force === undefined ? !classes.has(c) : force) ? classes.add(c) : classes.delete(c); },
      },
      setAttribute(k, v) { this.attrs[k] = v; },
      focus() {},
      // real appendChild MOVES a node: detach from the old parent first
      appendChild(c) {
        if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(x => x !== c);
        c.parentNode = this;
        this.children.push(c);
      },
      addEventListener(ev, fn) { handlers[ev] = fn; },
      _fire(ev, e) { return handlers[ev] && handlers[ev](e); },
      contains(n) { return n === this || this.children.some(c => c === n || (c.contains && c.contains(n))); },
      querySelector(sel) {
        if (sel.startsWith('#')) {
          const id = sel.slice(1);
          if (this._byId && this._byId[id]) return this._byId[id];
          return this.children.find(c => c.id === id) || null;
        }
        return null;
      },
    };
    Object.defineProperty(node, 'innerHTML', {
      set(v) {
        node._byId = {};
        for (const m of v.matchAll(/id="([a-z-]+)"/g)) node._byId[m[1]] = makeNode();
      },
      get() { return ''; },
    });
    return node;
  }

  let byId, cardFace, pane, mql, queries;

  function host({ matches, withMatchMedia = true, withPane = true } = {}) {
    byId = new Map();
    cardFace = makeNode('div');
    pane = makeNode('aside');
    pane.id = 'reading-pane';
    queries = [];
    mql = { matches: !!matches, listeners: [], addEventListener(ev, fn) { if (ev === 'change') this.listeners.push(fn); } };
    if (withMatchMedia) {
      globalThis.matchMedia = q => {
        queries.push(q);
        return q === '(min-width: 1100px)' ? mql : { matches: false, addEventListener() {} };
      };
    } else {
      delete globalThis.matchMedia;
    }
    globalThis.MutationObserver = class { constructor(cb) { this.cb = cb; } observe() {} disconnect() {} };
    globalThis.document = {
      getElementById: id => byId.get(id) || null,
      createElement: makeNode,
      head: { appendChild: node => { if (node.id) byId.set(node.id, node); } },
      querySelector: () => null,
      addEventListener() {},
    };
    initMeaningsUI(withPane ? { cardFace, readingPane: pane } : { cardFace });
  }
  const panelIn = node => node.children.filter(c => c.id === 'meaning-panel');
  const panelCount = () => panelIn(cardFace).length + panelIn(pane).length;

  beforeEach(() => {});
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    if (OriginalMO === undefined) delete globalThis.MutationObserver; else globalThis.MutationObserver = OriginalMO;
    if (originalMM === undefined) delete globalThis.matchMedia; else globalThis.matchMedia = originalMM;
  });

  it('below the breakpoint the panel is homed in #card-face and the pane is not .docked', () => {
    host({ matches: false });
    expect(panelIn(cardFace)).toHaveLength(1);
    expect(panelIn(pane)).toHaveLength(0);
    expect(pane.classList.contains('docked')).toBe(false);
    expect(queries).toContain('(min-width: 1100px)');
  });

  it('at the breakpoint the ONE panel node is moved into the pane, which becomes .docked', () => {
    host({ matches: true });
    expect(panelIn(pane)).toHaveLength(1);
    expect(panelIn(cardFace)).toHaveLength(0);
    expect(panelCount()).toBe(1);
    expect(pane.classList.contains('docked')).toBe(true);
    // the same node: id and role survive the move, so aria-controls holds
    const p = panelIn(pane)[0];
    expect(p.id).toBe('meaning-panel');
    expect(p.attrs.role).toBe('region');
    // docked, the panel is OUTSIDE the card's own aria-live region, so its
    // own politeness is the only announcement left (pr231 audit M28)
    expect(p.attrs['aria-live']).toBe('polite');
  });

  it('a second init is a no-op while the panel is docked outside the card (pr231 audit LOW-1)', () => {
    host({ matches: true });
    byId.set('meaning-panel', panelIn(pane)[0]);
    initMeaningsUI({ cardFace, readingPane: pane });
    expect(panelCount()).toBe(1);
    expect(cardFace.children.filter(c => c.id === 'meaning-hint')).toHaveLength(1);
  });

  it('a viewport crossing moves the panel back and forth — never a second copy', () => {
    host({ matches: false });
    expect(mql.listeners).toHaveLength(1);
    mql.matches = true; mql.listeners[0]({ matches: true });
    expect(panelIn(pane)).toHaveLength(1);
    expect(panelIn(cardFace)).toHaveLength(0);
    expect(pane.classList.contains('docked')).toBe(true);
    mql.matches = false; mql.listeners[0]({ matches: false });
    expect(panelIn(cardFace)).toHaveLength(1);
    expect(panelIn(pane)).toHaveLength(0);
    expect(pane.classList.contains('docked')).toBe(false);
    expect(panelCount()).toBe(1);
  });

  it('a host without matchMedia keeps the panel in #card-face and does not throw', () => {
    expect(() => host({ withMatchMedia: false })).not.toThrow();
    expect(panelIn(cardFace)).toHaveLength(1);
    expect(panelIn(pane)).toHaveLength(0);
    expect(pane.classList.contains('docked')).toBe(false);
  });

  it('a host with no pane ref never asks the media query and keeps the panel in #card-face', () => {
    host({ matches: true, withPane: false });
    expect(panelIn(cardFace)).toHaveLength(1);
    expect(queries).not.toContain('(min-width: 1100px)');
  });

  it('the panel still opens while docked — the value cell, the pane and the card agree', () => {
    // one real cell so openFor has a target; the dock must not break the
    // delegated open path or the hidden/open state on the moved node
    host({ matches: true });
    const cell = makeNode('span'); const val = makeNode('span');
    val.id = 'coord-sun-symbol'; val.textContent = 'leo';
    const closest = sel => (sel.startsWith('.coord-cell') ? cell : null);
    val.closest = closest; cell.closest = closest;
    byId.set('coord-sun-symbol', val);
    // re-init against a fresh cardFace that knows the cell
    cardFace = makeNode('div'); pane = makeNode('aside'); pane.id = 'reading-pane';
    initMeaningsUI({ cardFace, readingPane: pane });
    cardFace._fire('click', { target: val, preventDefault() {} });
    const p = panelIn(pane)[0];
    expect(p.classList.contains('open')).toBe(true);
    expect(p.querySelector('#meaning-head').textContent).toBe('SUN');
    // the pane's empty line yields to the open entry by the module's class…
    expect(pane.classList.contains('has-entry')).toBe(true);
    // …and returns when the entry closes
    p.querySelector('#meaning-close')._fire('click', { preventDefault() {} });
    expect(p.classList.contains('open')).toBe(false);
    expect(pane.classList.contains('has-entry')).toBe(false);
  });
});
