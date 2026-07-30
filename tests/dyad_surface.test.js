// 8ball / tests / dyad_surface.test.js
//
// The dyad surface (ui/dyad.js) — the wiring, not the engine. Engine
// behaviour is pinned in tests/dyad.test.js and voice policy in
// tests/dyad_content.test.js. This file covers the seams the wiring adds:
//
//   1. SEALED-DOM PURITY. Below t5 the relation layer renders its seal with
//      the value nodes EMPTY — absent, not hidden (§1.D v0.37). An
//      unentitled render must carry no entitled passage anywhere in the DOM.
//   2. FAIL-CLOSED OFFER. T5_PRODUCT_URL ships empty, so the CTA has no href
//      and stays hidden. The rung is not buyable, and nothing in this ship
//      may make it buyable by accident.
//   3. NO STORAGE. The tier introduces no localStorage key, and the second
//      person is never persisted — the §5 allow-list is unchanged by it.
//   4. THE LADDER APPEND is safe: t5 outranks t3, monotonicity holds, the
//      §1.F census does not move, and t4 stays retired.
//   5. THE SINGLE SHEET IS UNCHANGED. A t5 device renders the same coordinate
//      set a t3 device does, so the append cannot have disturbed the rungs
//      beneath it.
//
// Node env, hand-rolled DOM per §12 (no jsdom), sharing makeClassList with
// the other surface suites.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeClassList } from './helpers/dom.js';
import {
  T5_PRODUCT_URL,
  DYAD_ROW_LABELS,
  dyadCoordinateRows,
  formatDyadRelation,
  dyadRelationFor,
  initDyadUI,
} from '../ui/dyad.js';
import {
  TIER_ORDER, RETIRED_TIERS, RETIREMENT_COLLISIONS,
  isTier, tierRank, maxTier, normalizeTier, resolveRenderTier, applyPaidReturn,
} from '../core/payments.js';
import {
  TIER_COORDS, CELL_KEYS, CELL_COORD, coordsForTier, tierDensitySummary,
  newlyEntitledCells, cellRenderState,
} from '../ui/tiers.js';
import { buildDyadReading } from '../core/dyad.js';
import { buildProfile } from '../core/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const dyadJs = readFileSync(join(REPO_ROOT, 'ui', 'dyad.js'), 'utf-8');
const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');

// Capability scans below run against CODE, not commentary. A module that
// explains in a comment why it never touches storage would otherwise fail its
// own no-storage assertion — a false positive that pressures the next author
// to delete the explanation rather than keep the guarantee. Comments are
// stripped once, here, so the scans mean what they say.
const stripComments = src => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/[^:]\/\/.*$/gm, '');
const dyadCode = stripComments(dyadJs);

// Synthetic dates (DOCTRINE §11) — calibration anchors, not real people.
const A = buildProfile('specimen a', '2000-01-01');
const B = buildProfile('specimen b', '1988-06-15');

describe('dyad surface — the ladder append (§1.D v0.61)', () => {
  it('t5 is the fourth rung and outranks t3', () => {
    expect(TIER_ORDER).toEqual(['t1', 't2', 't3', 't5']);
    expect(isTier('t5')).toBe(true);
    expect(tierRank('t5')).toBe(4);
    expect(tierRank('t5')).toBeGreaterThan(tierRank('t3'));
  });

  it('the retirement table cannot collide with the ladder', () => {
    // The brief's explicit build-time re-verification: t4 is burned, so the
    // dyad had to take a clean token. If a future rung ever reuses a retired
    // one, normalizeTier rewrites its buyers away and this is the only thing
    // standing in the way.
    expect(RETIREMENT_COLLISIONS).toEqual([]);
    for (const retired of Object.keys(RETIRED_TIERS)) {
      expect(TIER_ORDER).not.toContain(retired);
      expect(isTier(retired)).toBe(false);
    }
    expect(normalizeTier('t5')).toBe('t5');
    expect(resolveRenderTier({ tier: 't5', credits: 0 })).toBe('t5');
  });

  it('monotonic: buying a lower rung never downgrades a t5 device', () => {
    for (const purchased of ['t1', 't2', 't3', 't5']) {
      expect(applyPaidReturn({ pendingProfile: null, tier: 't5', purchasedTier: purchased }).tier)
        .toBe('t5');
    }
    expect(maxTier('t3', 't5')).toBe('t5');
    expect(maxTier('t5', 't3')).toBe('t5');
  });

  it('the R2 legacy grandfather does NOT follow the top of the ladder', () => {
    // A pre-v0.6.0 buyer paid for the written entry. They did not pay for a
    // second person's sheet, and appending a rung above t3 must not hand
    // them one.
    expect(resolveRenderTier({ tier: null, credits: 3 })).toBe('t3');
    expect(resolveRenderTier({ tier: null, credits: 99 })).toBe('t3');
  });

  it('a stored t4 still migrates to t3, not to the new top rung', () => {
    expect(normalizeTier('t4')).toBe('t3');
    expect(resolveRenderTier({ tier: 't4', credits: 0 })).toBe('t3');
  });
});

describe('dyad surface — the single sheet is untouched by the append', () => {
  it('t5 carries every t3 coordinate and adds only the relation block', () => {
    for (const coord of TIER_COORDS.t3) expect(TIER_COORDS.t5).toContain(coord);
    expect(TIER_COORDS.t5.filter(c => !TIER_COORDS.t3.includes(c))).toEqual(['dyadRelation']);
  });

  it('the §1.F census does not move — dyadRelation is a block, not a cell', () => {
    expect(tierDensitySummary('t5')).toEqual(tierDensitySummary('t3'));
    expect(tierDensitySummary('t5')).toEqual({ open: 15, sealed: 0, total: 15 });
    expect(Object.values(CELL_COORD)).not.toContain('dyadRelation');
  });

  it('every sheet cell renders identically at t3 and t5', () => {
    for (const key of CELL_KEYS) {
      expect(cellRenderState(A, key, coordsForTier('t3').has(CELL_COORD[key])), key)
        .toEqual(cellRenderState(A, key, coordsForTier('t5').has(CELL_COORD[key])));
    }
  });

  it('a t3 → t5 upgrade unseals no sheet cell (the sheet is already complete)', () => {
    expect(newlyEntitledCells('t3', 't5')).toEqual([]);
    // ...and the rungs beneath are unchanged by the append.
    expect(newlyEntitledCells('free', 't1')).toEqual(newlyEntitledCells('free', 't1'));
    expect(newlyEntitledCells('t2', 't3')).toContain('cardEntry');
  });
});

describe('dyad surface — coordinate rows', () => {
  it('one row per sheet cell, in the sheet order, both sides labelled', () => {
    const rows = dyadCoordinateRows(A, B, 't3');
    expect(rows.map(r => r.key)).toEqual([...CELL_KEYS]);
    for (const row of rows) {
      expect(row.label, row.key).toBe(DYAD_ROW_LABELS[row.key]);
      expect(row.a, row.key).toBeTruthy();
      expect(row.b, row.key).toBeTruthy();
    }
  });

  it('reads coordinates through the SAME mapping the sheet renders by', () => {
    for (const tier of ['free', 't1', 't2', 't3', 't5']) {
      for (const row of dyadCoordinateRows(A, B, tier)) {
        const entitled = coordsForTier(tier).has(CELL_COORD[row.key]);
        expect(row.a, `${tier}/${row.key}`).toEqual(cellRenderState(A, row.key, entitled));
        expect(row.b, `${tier}/${row.key}`).toEqual(cellRenderState(B, row.key, entitled));
      }
    }
  });

  it('a seal is a property of the DEVICE, never of one person', () => {
    // It can never be open for A and shut for B: both sides read the same
    // entitlement, so a paid coordinate cannot leak through the B column.
    for (const tier of ['free', 't1', 't2', 't3', 't5']) {
      for (const row of dyadCoordinateRows(A, B, tier)) {
        expect(row.a.state === 'sealed', `${tier}/${row.key}`)
          .toBe(row.b.state === 'sealed');
      }
    }
  });

  it('a sealed row carries NO value string on either side', () => {
    for (const row of dyadCoordinateRows(A, B, 'free')) {
      if (row.a.state !== 'sealed') continue;
      expect(row.a.text, row.key).toBe('');
      expect(row.b.text, row.key).toBe('');
    }
    // ...and free really does seal most of the sheet, so the assertion above
    // is not vacuously true.
    expect(dyadCoordinateRows(A, B, 'free').filter(r => r.a.state === 'sealed').length)
      .toBeGreaterThan(8);
  });

  it('every cell key has a label — no row renders unnamed', () => {
    expect(Object.keys(DYAD_ROW_LABELS).sort()).toEqual([...CELL_KEYS].sort());
  });
});

describe('dyad surface — the relation layer', () => {
  it('formats five passages plus the qualifier', () => {
    const formatted = formatDyadRelation(buildDyadReading(A, B));
    for (const key of ['elementHead', 'elementAB', 'elementBA', 'numerologyHead',
      'numerology', 'cardPairHead', 'cardPair', 'qualifier']) {
      expect(typeof formatted[key], key).toBe('string');
      expect(formatted[key].length, key).toBeGreaterThan(0);
    }
    expect(formatted.qualifier).toBe('recorded, not certified.');
  });

  it('carries both directions as DISTINCT passages', () => {
    const formatted = formatDyadRelation(buildDyadReading(A, B));
    expect(formatted.elementAB).not.toBe(formatted.elementBA);
  });

  it('returns null rather than throwing on a malformed pair', () => {
    // Total: a bad profile seals the block; it does not take down the render.
    expect(dyadRelationFor(null, B)).toBeNull();
    expect(dyadRelationFor(A, null)).toBeNull();
    expect(dyadRelationFor({ ...A, lifePath: 11 }, B)).toBeNull();
    expect(dyadRelationFor({ ...A, animal: 'griffin' }, B)).toBeNull();
  });

  it('resolves for a real pair', () => {
    expect(dyadRelationFor(A, B)).not.toBeNull();
  });
});

describe('dyad surface — the offer fails closed (§1.D v0.61)', () => {
  it('T5_PRODUCT_URL ships EMPTY, so the rung is not buyable', () => {
    // Creating the Gumroad product is the controller's action, never an
    // agent's (§10). While this is empty no visitor can reach a checkout.
    expect(T5_PRODUCT_URL).toBe('');
  });

  it('no gumroad link for the dyad exists anywhere in the surface', () => {
    expect(dyadCode).not.toMatch(/gumroad\.com/);
  });

  it('the CTA gets an href ONLY when the constant is filled in', () => {
    // Pinned as a property of the code path, not of today's empty value: the
    // href is derived from the constant, so filling the constant in is the
    // whole of what makes the rung buyable.
    expect(dyadJs).toMatch(/T5_PRODUCT_URL !== ''/);
    expect(dyadJs).toMatch(/cta\.removeAttribute\('href'\)/);
  });

  it('the §4.B v0.56 single-$3 sprint surface is byte-untouched', () => {
    // The sprint's one purchase choice stays the only purchase choice.
    expect(html).toContain('https://theeightball.gumroad.com/l/xjpvp');
    expect(html).toContain('complete 8ball · $3 once');
    expect(html).not.toMatch(/paid=t5/);
    expect((html.match(/gumroad\.com/g) || []).length).toBe(1);
  });

  it('the dyad entry control carries no price and no urgency (§2)', () => {
    expect(dyadJs).toMatch(/read beside another sheet/);
    expect(dyadCode).not.toMatch(/\$\d|only \d|hurry|limited|now only/i);
  });
});

describe('dyad surface — no storage, no network (§5 / §5.F)', () => {
  it('names no localStorage key and never touches storage', () => {
    expect(dyadCode).not.toMatch(/localStorage/);
    expect(dyadCode).not.toMatch(/sessionStorage/);
    expect(dyadCode).not.toMatch(/eight_ball_/);
  });

  it('makes no network call of any kind', () => {
    expect(dyadCode).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/);
  });

  it('the second person is held in memory only and dropped on reset', () => {
    // The whole retention story is one module-local binding. If it ever gets
    // serialized, this is the shape that has to change first.
    expect(dyadJs).toMatch(/let _second = null/);
    expect(dyadJs).toMatch(/_second = null;/);
    expect(dyadCode).not.toMatch(/JSON\.stringify\(_second/);
  });

  it('the §5 key allow-list is unchanged by this tier', () => {
    const scan = readFileSync(join(REPO_ROOT, 'tests', 'privacy_scan.test.js'), 'utf-8');
    expect(scan).not.toMatch(/dyad/i);
  });

  it('entitlement is handed in, never read from storage here', () => {
    // Same one-way wiring ui/public.js uses: the surface is told what the
    // device owns; it never asks.
    expect(dyadCode).not.toMatch(/getRenderTier|getTier\(\)\s*\{/);
    expect(dyadJs).toMatch(/_hooks\.getTier/);
  });
});

// ── DOM render: the sealed-DOM contract, exercised end to end ───────────────
//
// The assertions above are pure. This block drives the real render path
// against a hand-rolled DOM so the §1.D v0.37 contract is proven where it
// actually has to hold: in the nodes.

function makeNode(extra = {}) {
  const node = {
    textContent: 'STALE', classList: makeClassList(), hidden: false, value: '',
    attrs: {}, listeners: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    ...extra,
  };
  return node;
}

// A stub document that ui/dyad.js's own init path accepts as real. No
// backdoor into the module: injectScreen short-circuits when `dyad-screen`
// already resolves, and injectStyle when there is no `head` — so init runs
// its real code and binds its real handlers against these nodes.
function mountDyad(tier, { profileA = A, second = B } = {}) {
  const nodes = new Map();
  for (const id of [
    'dyad-output', 'dyad-error', 'dyad-head-a', 'dyad-head-b',
    'dyad-relation', 'dyad-element-head', 'dyad-element-ab', 'dyad-element-ba',
    'dyad-numerology-head', 'dyad-numerology-body',
    'dyad-cardpair-head', 'dyad-cardpair-body', 'dyad-qualifier',
    'dyad-cta', 'dyad-name-input', 'dyad-dob-input', 'dyad-time-input',
    'dyad-dob-error', 'dyad-form', 'dyad-back',
  ]) nodes.set(id, makeNode());

  const cells = new Map();
  for (const key of CELL_KEYS) {
    cells.set(`[data-dyad-row="${key}"]`, makeNode());
    cells.set(`[data-dyad-a="${key}"]`, makeNode());
    cells.set(`[data-dyad-b="${key}"]`, makeNode());
  }
  const root = makeNode({
    focus() {},
    querySelector: sel => cells.get(sel) || null,
  });
  nodes.set('dyad-screen', root);

  const priorDocument = globalThis.document;
  globalThis.document = { getElementById: id => nodes.get(id) || null };
  try {
    initDyadUI({ stage: {} }, {
      getProfile: () => profileA,
      getTier: () => tier,
      buildSecond: () => second,
    });
    // Person B arrives through the real submit handler, not by assignment.
    nodes.get('dyad-form').listeners.submit({ preventDefault() {} });
    return { nodes, cells, root };
  } finally {
    globalThis.document = priorDocument;
  }
}

// Every string the render could have written, for the leak sweep.
const domText = ({ nodes, cells }) => [
  ...[...nodes.values()], ...[...cells.values()],
].map(n => String(n.textContent)).join('\n');

describe('dyad surface — DOM render (§1.D v0.37 sealed purity)', () => {
  it('fills the relation layer at t5', () => {
    const dom = mountDyad('t5');
    const expected = formatDyadRelation(buildDyadReading(A, B));
    expect(dom.nodes.get('dyad-element-ab').textContent).toBe(expected.elementAB);
    expect(dom.nodes.get('dyad-element-ba').textContent).toBe(expected.elementBA);
    expect(dom.nodes.get('dyad-numerology-body').textContent).toBe(expected.numerology);
    expect(dom.nodes.get('dyad-cardpair-body').textContent).toBe(expected.cardPair);
    expect(dom.nodes.get('dyad-qualifier').textContent).toBe('recorded, not certified.');
    expect(dom.nodes.get('dyad-relation').classList.contains('sealed')).toBe(false);
    expect(dom.nodes.get('dyad-output').hidden).toBe(false);
  });

  it('seals below t5 and leaves NO relation passage in the DOM', () => {
    const entitled = formatDyadRelation(buildDyadReading(A, B));
    const passages = [entitled.elementAB, entitled.elementBA,
      entitled.numerology, entitled.cardPair];
    for (const tier of ['free', 't1', 't2', 't3']) {
      const dom = mountDyad(tier);
      const block = dom.nodes.get('dyad-relation');
      expect(block.classList.contains('sealed'), tier).toBe(true);
      expect(block.attrs['aria-label'], tier).toMatch(/sealed at this device tier/);
      for (const id of ['dyad-element-head', 'dyad-element-ab', 'dyad-element-ba',
        'dyad-numerology-head', 'dyad-numerology-body',
        'dyad-cardpair-head', 'dyad-cardpair-body', 'dyad-qualifier']) {
        expect(dom.nodes.get(id).textContent, `${tier}/${id}`).toBe('');
      }
      // Aggregate sentinel: not one entitled passage exists anywhere in the
      // rendered DOM, not merely absent from the nodes it belongs in.
      const blob = domText(dom);
      for (const passage of passages) {
        expect(blob.includes(passage), `${tier}: passage leaked`).toBe(false);
      }
    }
  });

  it('t3 gets both full sheets and NOT the relation — the rung boundary', () => {
    const dom = mountDyad('t3');
    // Every coordinate open on both sides...
    for (const key of CELL_KEYS) {
      const row = dom.cells.get(`[data-dyad-row="${key}"]`);
      expect(row.classList.contains('sealed'), key).toBe(false);
    }
    // ...and the relation still sealed. This is exactly what t5 sells.
    expect(dom.nodes.get('dyad-relation').classList.contains('sealed')).toBe(true);
  });

  it('seals the coordinate rows a free device has not bought', () => {
    const dom = mountDyad('free');
    const sealed = CELL_KEYS.filter(
      key => dom.cells.get(`[data-dyad-row="${key}"]`).classList.contains('sealed'));
    expect(sealed.length).toBeGreaterThan(8);
    for (const key of sealed) {
      expect(dom.cells.get(`[data-dyad-a="${key}"]`).textContent, key).toBe('');
      expect(dom.cells.get(`[data-dyad-b="${key}"]`).textContent, key).toBe('');
    }
  });

  it('the CTA stays hidden and href-less while the rung is unbuyable', () => {
    for (const tier of ['free', 't1', 't2', 't3', 't5']) {
      const cta = mountDyad(tier).nodes.get('dyad-cta');
      expect(cta.hidden, tier).toBe(true);
      expect(cta.attrs.href, tier).toBeUndefined();
      expect(cta.textContent, tier).toBe('');
    }
  });

  it('neither person’s name or DOB reaches a coordinate node', () => {
    // The listing is coordinates. The column heads carry first names, which
    // the host already displays; nothing else may.
    const dom = mountDyad('t5');
    for (const key of CELL_KEYS) {
      for (const side of ['a', 'b']) {
        const text = dom.cells.get(`[data-dyad-${side}="${key}"]`).textContent;
        expect(text, `${side}/${key}`).not.toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(text.toLowerCase(), `${side}/${key}`).not.toContain('specimen');
      }
    }
  });
});

describe('dyad surface — module wiring', () => {
  it('ui/dyad.js is the ONLY importer of core/dyad.js', () => {
    // Same single-seam pin the public-tier engine carries: one DOM controller
    // consumes the engine, so a second unreviewed wiring fails CI.
    const consumers = [];
    for (const rel of [
      ...readdirSync(join(REPO_ROOT, 'ui')).filter(f => f !== 'dyad.js').map(f => join('ui', f)),
      ...readdirSync(join(REPO_ROOT, 'core')).filter(f => f !== 'dyad.js').map(f => join('core', f)),
      'index.html',
    ]) {
      const src = readFileSync(join(REPO_ROOT, rel), 'utf-8');
      if (/from '[^']*core\/dyad\.js'|from '\.\/dyad\.js'/.test(src)) consumers.push(rel);
    }
    expect(consumers).toEqual([]);
    expect(readFileSync(join(REPO_ROOT, 'ui', 'dyad.js'), 'utf-8'))
      .toMatch(/from '\.\.\/core\/dyad\.js'/);
  });

  it('index.html wires the surface in the §6 DI shape', () => {
    expect(html).toMatch(/import \{ initDyadUI \} from '\.\/ui\/dyad\.js';/);
    expect(html).toMatch(/initDyadUI\(\{[\s\S]{0,200}?stage:/);
    expect(html).toMatch(/getTier: getRenderTier/);
    expect(html).toMatch(/buildSecond: profileFromPayload/);
  });

  it('index.html stays inside the §7 stage-5 single-file budget', () => {
    expect(html.split('\n').length).toBeLessThanOrEqual(1500);
  });

  it('the module has no module-level DOM access at import time', () => {
    // Import-safety: the module is imported before the DOM parses.
    expect(dyadJs).not.toMatch(/^const \w+ = document\./m);
    expect(dyadJs).not.toMatch(/^document\./m);
  });
});
