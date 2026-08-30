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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../core/cities.js', () => ({ searchCities: vi.fn() }));

import { makeClassList } from './helpers/dom.js';
import {
  T5_PRODUCT_URL,
  DYAD_RELATION_NODES,
  DYAD_AXIS_IDS,
  dyadEntitled,
  dyadEntryVisible,
  formatDyadRelation,
  dyadRelationFor,
  initDyadUI,
  syncDyadEntry,
  open as openDyad,
  close as closeDyad,
  submitSecond,
  render as renderDyad,
} from '../ui/dyad.js';
import { buildSheetMarkup, createSheet, ROW_TITLES } from '../ui/sheet.js';
import { validateBirthInput, todayIsoLocal } from '../ui/profile.js';
import {
  TIER_ORDER, RETIRED_TIERS, RETIREMENT_COLLISIONS,
  isTier, tierRank, maxTier, normalizeTier, resolveRenderTier, applyPaidReturn,
  anchorFacetIndex,
} from '../core/payments.js';
import { getFacetSlot, getFreshFacetSlot, FACET_KEY } from '../ui/payments.js';
import {
  TIER_COORDS, CELL_KEYS, CELL_COORD, coordsForTier, tierDensitySummary,
  newlyEntitledCells, cellRenderState,
  initTiersUI, renderTierSections,
} from '../ui/tiers.js';
import { buildDyadReading } from '../core/dyad.js';
import { buildProfile } from '../core/profile.js';
import { getCard } from '../core/engine.js';
import { CARDS } from '../content/cards.v1.full.js';
import { publicReadFor } from '../ui/public.js';
import { searchCities } from '../core/cities.js';

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
    // ...and the rungs beneath are unchanged by the append. PR #187 F7.1: this
    // line used to compare newlyEntitledCells('free','t1') WITH ITSELF, which
    // can never fail. It carries the literal expected set now.
    expect(newlyEntitledCells('free', 't1'))
      .toEqual(['element', 'rising', 'innerAnimal', 'nameNumber', 'soulUrge']);
    expect(newlyEntitledCells('t1', 't2'))
      .toEqual(['personality', 'birthday', 'maturity', 'dayPillar']);
    expect(newlyEntitledCells('t2', 't3')).toEqual(['hourPillar', 'cardEntry', 'publicRead', 'kuaRead']);
  });
});


// ── DOM harness ─────────────────────────────────────────────────────────────
//
// A stub document ui/dyad.js's own init path accepts as real. No backdoor into
// the module: injectScreen short-circuits when `dyad-screen` already resolves
// and injectStyle when there is no `head`, so init runs its real code and binds
// its real handlers. The screen markup is parsed into a node map so the sheets'
// `data-sheet-*` cells are individually addressable.

function makeNode(tag = 'div') {
  return {
    tag, textContent: '', value: '', hidden: false, innerHTML: '',
    focusCalls: [], scrollCalls: [],
    classList: makeClassList(), attrs: {}, listeners: {}, children: [],
    style: { setProperty() {}, removeProperty() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(t, fn) { this.listeners[t] = fn; },
    appendChild(c) { this.children.push(c); return c; },
    focus(opts) { this.focusCalls.push(opts); },
    scrollIntoView(opts) { this.scrollCalls.push(opts); },
  };
}

// Parse the ids and data-sheet-* hooks out of the injected markup so the
// harness addresses exactly the nodes the real DOM would expose.
function harness(tier, { profileA = A, second = B, noteSlot = () => 'mid',
  publicRead = () => null, validate = validateBirthInput,
  buildSecond = () => second } = {}) {
  const byId = new Map();
  const byAttr = new Map();

  const root = makeNode('section');
  root.classList.add('hidden'); // injectScreen sets `screen hidden`
  root.querySelector = sel => byAttr.get(sel) || null;
  byId.set('dyad-screen', root);

  // Every id and data-attribute the screen markup can contain.
  const ids = [
    'dyad-output', 'dyad-error', 'dyad-head-a', 'dyad-head-b', 'dyad-relation',
    'dyad-cta', 'dyad-name-input', 'dyad-dob-input', 'dyad-time-input',
    'dyad-city-input', 'dyad-city-suggestions', 'dyad-polar-message',
    'dyad-name-error', 'dyad-dob-error', 'dyad-form', 'dyad-back',
    'dyad-open-btn', 'dyad-style', 'dyad-spine', 'dyad-sheets',
    ...DYAD_AXIS_IDS,
    ...Object.keys(DYAD_RELATION_NODES),
  ];
  for (const id of ids) if (!byId.has(id)) byId.set(id, makeNode());
  byId.delete('dyad-open-btn');
  byId.delete('dyad-style');

  // #dyad-sheets models TWO real-browser behaviors a plain numeric fake
  // would miss:
  //
  //   1. CSSOM View: a scrollLeft WRITE on an element with no associated
  //      layout box (here, because #dyad-output — its ancestor — is
  //      display:none via `hidden`) is a documented no-op. This is WHY
  //      clearOutput()'s own pre-hide reset is typically moot via close(),
  //      which hides the screen root before ever calling clearOutput() —
  //      it still matters on the path close() doesn't take: an invalid
  //      re-submission clearing a STILL-VISIBLE pair mid-session.
  //   2. A live-fire pass against the real app (not this suite) found that
  //      #dyad-output regaining its layout box — hidden:true → false —
  //      can resurface a stale PRE-hide pan offset on its own. This
  //      reproduced specifically when the hidden→visible transition
  //      coincided with the sheets' content being refilled (a snap/scroll-
  //      anchor style restoration), not on a bare hide/show toggle — but
  //      the externally observable shape is simple: SET to visible, GET an
  //      old value back, until something writes again. Modeled generally
  //      here as "restore the last real pan on every hidden→visible
  //      transition", so a mock-driven test only passes when render()'s
  //      post-reveal reset — the decisive fix for close() → reopen() →
  //      next-pair — is present.
  {
    const outputNode = byId.get('dyad-output');
    const sheetsNode = byId.get('dyad-sheets');
    let appliedScrollLeft = 0;
    let lastRealPan = 0; // the value the hidden→visible transition "restores"
    let wasHidden = !!outputNode.hidden;
    Object.defineProperty(sheetsNode, 'scrollLeft', {
      get: () => appliedScrollLeft,
      set: v => {
        if (outputNode.hidden) return; // CSSOM no-op while boxless
        appliedScrollLeft = v;
        if (v !== 0) lastRealPan = v;
      },
    });
    Object.defineProperty(outputNode, 'hidden', {
      get: () => wasHidden,
      set: v => {
        const nextHidden = !!v;
        if (wasHidden && !nextHidden) appliedScrollLeft = lastRealPan;
        wasHidden = nextHidden;
      },
    });
  }

  for (const prefix of ['a', 'b']) {
    for (const key of CELL_KEYS) {
      const cellRoot = makeNode('span');
      const cell = makeNode('span');
      cell.closest = sel => (sel === '.coord-cell' ? cellRoot : null);
      byAttr.set(`[data-sheet-cell="${prefix}:${key}"]`, cell);
    }
    for (const attr of ['title', 'catalog', 'name', 'type', 'habit', 'note',
      'families', 'antifit', 'roleline', 'public-bridge', 'face', 'entry', 'public',
      'kua', 'kua-primary', 'kua-secondary', 'kua-note']) {
      if (attr === 'title') {
        for (const lead of Object.keys(ROW_TITLES)) {
          byAttr.set(`[data-sheet-title="${prefix}:${lead}"]`, makeNode());
        }
      } else {
        byAttr.set(`[data-sheet-${attr}="${prefix}"]`, makeNode());
      }
    }
  }

  const controls = makeNode();
  const prior = globalThis.document;
  globalThis.document = {
    getElementById: id => byId.get(id) || null,
    createElement: tag => {
      const n = makeNode(tag);
      // The entry button and the injected <style> are created, not parsed.
      const original = n.setAttribute.bind(n);
      n.setAttribute = (k, v) => { if (k === 'id') byId.set(v, n); original(k, v); };
      return n;
    },
  };
  Object.defineProperty(globalThis.document, 'head', { value: null, configurable: true });

  try {
    initDyadUI({ stage: makeNode(), controls }, {
      getProfile: () => profileA,
      getTier: () => tier,
      validateEntry: validate,
      buildSecond,
      getNoteSlot: noteSlot,
      getPublicRead: publicRead,
      onOpen() {}, onExit() {},
    });
    // The entry button is created via createElement and assigned .id directly.
    for (const child of controls.children) if (child.id) byId.set(child.id, child);
    // Valid typed entry by default; the invalid cases overwrite these.
    byId.get('dyad-name-input').value = 'specimen b';
    byId.get('dyad-dob-input').value = '1988-06-15';
    return {
      byId, byAttr, root, controls,
      get: id => byId.get(id) || null,
      cell: (prefix, key) => byAttr.get(`[data-sheet-cell="${prefix}:${key}"]`),
      withDom(fn) {
        const outer = globalThis.document;
        globalThis.document = { getElementById: id => byId.get(id) || null, createElement: () => makeNode() };
        try { return fn(); } finally { globalThis.document = outer; }
      },
    };
  } finally {
    globalThis.document = prior;
  }
}

// Every string a rendered dyad screen can be holding.
const allText = h => [
  ...[...h.byId.values()], ...[...h.byAttr.values()],
].map(n => String(n.textContent || '')).join('\n');

describe('dyad surface — F2: the whole dyad is the t5 product', () => {
  it('dyadEntitled is true at t5 and false at every rung beneath', () => {
    expect(dyadEntitled('t5')).toBe(true);
    for (const tier of ['free', 't1', 't2', 't3', undefined, null, 'garbage']) {
      expect(dyadEntitled(tier), String(tier)).toBe(false);
    }
  });

  it('the entry control is ABSENT below t5 and present at t5', () => {
    for (const tier of ['free', 't1', 't2', 't3']) {
      const h = harness(tier);
      h.withDom(() => syncDyadEntry(tier));
      expect(h.get('dyad-open-btn').hidden, tier).toBe(true);
    }
    const h5 = harness('t5');
    h5.withDom(() => syncDyadEntry('t5'));
    expect(h5.get('dyad-open-btn').hidden).toBe(false);
  });

  it('dyadEntryVisible is entitlement-only — a non-empty product URL never surfaces a dead entry control (PR #187 R6)', () => {
    // A prior draft made a below-t5 device's entry control visible the
    // moment T5_PRODUCT_URL went non-empty, with no click path behind it —
    // a visible dead button the instant the controller filled the constant
    // in. The predicate takes no second argument now: entitlement is the
    // only input, and a caller passing one is silently ignored.
    for (const tier of ['free', 't1', 't2', 't3']) {
      expect(dyadEntryVisible(tier), tier).toBe(false);
      expect(dyadEntryVisible(tier, 'https://example.test/x'), tier).toBe(false);
    }
    expect(dyadEntryVisible('t5')).toBe(true);
    expect(dyadEntryVisible('t5', 'https://example.test/x')).toBe(true);
  });

  it('the real entry control stays hidden below t5 even once the product URL is non-empty', () => {
    // Same claim, driven through the actual DOM path (syncDyadEntry), not
    // just the pure predicate — a passing predicate with a stale caller
    // elsewhere would not be caught by the test above alone.
    for (const tier of ['free', 't1', 't2', 't3']) {
      const h = harness(tier);
      h.withDom(() => syncDyadEntry(tier));
      expect(h.get('dyad-open-btn').hidden, tier).toBe(true);
    }
  });

  it('open() refuses below t5', () => {
    for (const tier of ['free', 't1', 't2', 't3']) {
      const h = harness(tier);
      expect(h.withDom(() => openDyad()), tier).toBe(false);
      expect(h.root.classList.contains('hidden'), tier).toBe(true);
    }
    const h5 = harness('t5');
    expect(h5.withDom(() => openDyad())).toBe(true);
  });

  it('submitSecond refuses below t5 and renders NOTHING (the F2 defect)', () => {
    // Before the fix a free device could submit person B and receive their
    // sheet at free density; a t3 device received B's COMPLETE sheet free.
    for (const tier of ['free', 't1', 't2', 't3']) {
      const h = harness(tier);
      expect(h.withDom(() => submitSecond()), tier).toBe(false);
      expect(h.get('dyad-output').hidden, tier).toBe(true);
      expect(h.get('dyad-head-b').textContent, tier).toBe('');
      for (const key of CELL_KEYS) {
        expect(h.cell('b', key).textContent, `${tier}/${key}`).toBe('');
      }
      // Not one string from B anywhere on the screen.
      expect(allText(h)).not.toContain(B.sunSign);
      expect(allText(h)).not.toContain(B.birthCard.label);
    }
  });

  it('t3 — which buys the complete SINGLE sheet — gets no second sheet at all', () => {
    // The exact contradiction the previous suite blessed: it asserted t3
    // received both complete sheets and described only the relation as the t5
    // product. DOCTRINE §1.D v0.61 says t5 buys the second sheet AND the
    // relation, and this is that sentence as a test.
    const h = harness('t3');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-output').hidden).toBe(true);
    expect(h.cell('b', 'arcana').textContent).toBe('');
    expect(h.cell('a', 'arcana').textContent).toBe('');
  });

  it('t5 renders both sheets and the relation', () => {
    const h = harness('t5', { publicRead: () => null });
    expect(h.withDom(() => submitSecond())).toBe(true);
    expect(h.get('dyad-output').hidden).toBe(false);
    expect(h.cell('a', 'arcana').textContent).toBe(A.birthCard.label);
    expect(h.cell('b', 'arcana').textContent).toBe(B.birthCard.label);
    expect(h.get('dyad-head-a').textContent).toBe('specimen');
    expect(h.get('dyad-element-ab').textContent).toBeTruthy();
  });
});

describe('dyad surface — presentation: spine heads + reveal beat', () => {
  it('moves a valid paired result into a named focusable region', () => {
    expect(dyadJs).toMatch(
      /id="dyad-output" role="region" aria-label="paired reading" tabindex="-1" hidden/,
    );
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-output').scrollCalls).toEqual([{ block: 'start' }]);
    expect(h.get('dyad-output').focusCalls).toEqual([{ preventScroll: true }]);
  });

  it('the spine carries the terse symbolic heads, distinct from the fuller collapsed-detail heads', () => {
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    // Terse: no label suffix, no register suffix.
    expect(relation.elementSpine)
      .toBe(`${reading.relation.element.a.element} ⇄ ${reading.relation.element.b.element}`);
    expect(relation.elementSpine).not.toContain('·');
    expect(relation.numerologySpine).toMatch(/^\d+ \+ \d+ → \d+$/);
    // The fuller heads still carry what the spine strips out.
    expect(relation.elementHead).toContain('·');
    expect(relation.elementHead.startsWith(relation.elementSpine.split(' ⇄ ')[0])).toBe(true);
    expect(relation.numerologyHead.startsWith(relation.numerologySpine)).toBe(true);
    // cardPairHead is reused verbatim as the card-pair spine text — no
    // separate field, since the existing head was already the terse form.
    expect(relation.cardPairHead).toMatch(/^no\. .+ × no\. .+$/);
  });

  it('render() fires the draw-in beat on the spine; a fresh clear/close always resets it first', () => {
    const h = harness('t5');
    expect(h.get('dyad-spine').classList.contains('dyad-spine-revealing')).toBe(false);

    h.withDom(() => submitSecond());
    expect(h.get('dyad-spine').classList.contains('dyad-spine-revealing')).toBe(true);

    // close() drops the beat along with everything else (F1 shape) — the
    // next open must not inherit a stale "already revealed" class.
    h.withDom(() => closeDyad());
    expect(h.get('dyad-spine').classList.contains('dyad-spine-revealing')).toBe(false);

    // And it re-fires on a second pair, not just the first — close() blanks
    // the typed inputs too (F1 shape), so they're re-entered here exactly as
    // a real second visit would.
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });
    expect(h.get('dyad-spine').classList.contains('dyad-spine-revealing')).toBe(true);
  });

  it('a failed second-profile build bails before render(), so the beat never fires', () => {
    const h = harness('t5', { buildSecond: () => null });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-output').hidden).toBe(true);
    expect(h.get('dyad-spine').classList.contains('dyad-spine-revealing')).toBe(false);
  });
});

describe('dyad surface — presentation: axis collapse + pan-position reset (lifecycle)', () => {
  // A reader can expand any of the three collapsible axes and pan the mobile
  // sheet strip. Neither state is part of the render fill, so it is not
  // covered by DYAD_RELATION_NODES' clear enumeration — it needs its own
  // reset, exercised here the same way F1 exercises the rest of clearOutput().
  it('clearOutput() closes every DYAD_AXIS_IDS <details> and re-lists all three', () => {
    expect(DYAD_AXIS_IDS).toEqual(['dyad-axis-element', 'dyad-axis-numerology', 'dyad-axis-cardpair']);

    const h = harness('t5');
    h.withDom(() => submitSecond());
    // Simulate a reader who expanded every axis on this pair.
    for (const id of DYAD_AXIS_IDS) h.get(id).open = true;

    h.withDom(() => closeDyad());
    for (const id of DYAD_AXIS_IDS) expect(h.get(id).open, id).toBe(false);
  });

  it('clearOutput() resets the pannable .dyad-sheets strip to its leading edge', () => {
    // This is the test that actually pins clearOutput()'s OWN pre-hide
    // reset (disabling it fails this one; the "complete pan → close →
    // reopen → next-pair" case below stays green either way, since
    // render()'s post-reveal reset alone decides that one — see its
    // comment). Here #dyad-output is still visible at the moment
    // clearOutput() runs (submitSecond() rendered it, closeDyad() hasn't
    // hidden it yet), so the write has a real layout box and lands.
    const h = harness('t5');
    h.withDom(() => submitSecond());
    // Simulate a reader who panned to sheet B.
    h.get('dyad-sheets').scrollLeft = 240;

    h.withDom(() => closeDyad());
    expect(h.get('dyad-sheets').scrollLeft).toBe(0);
  });

  it('an invalid re-submission resets both — not just the render fill — before the new attempt', () => {
    // Mirrors the existing "invalidate first" F1 case: this drives the same
    // clearOutput() call an invalid re-submission takes, and checks the two
    // pieces of state that call adds beyond the render fill.
    const h = harness('t5');
    h.withDom(() => submitSecond());
    for (const id of DYAD_AXIS_IDS) h.get(id).open = true;
    h.get('dyad-sheets').scrollLeft = 180;

    h.withDom(() => {
      h.get('dyad-name-input').value = '   ';       // whitespace-only
      h.get('dyad-dob-input').value = '2099-01-01'; // future
      return submitSecond();
    });

    for (const id of DYAD_AXIS_IDS) expect(h.get(id).open, id).toBe(false);
    expect(h.get('dyad-sheets').scrollLeft).toBe(0);
  });

  it('opening again starts every axis collapsed and the strip at its leading edge', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    for (const id of DYAD_AXIS_IDS) h.get(id).open = true;
    h.get('dyad-sheets').scrollLeft = 300;

    h.withDom(() => closeDyad());
    h.withDom(() => openDyad());

    for (const id of DYAD_AXIS_IDS) expect(h.get(id).open, id).toBe(false);
    expect(h.get('dyad-sheets').scrollLeft).toBe(0);
  });

  it('the complete pan → close → reopen → next-pair sequence lands on sheet A (P1)', () => {
    // The FINAL assertion below is decided by render()'s post-reveal reset
    // alone: close() hides the screen root before ever calling
    // clearOutput(), so clearOutput()'s own pre-hide reset is moot by the
    // time it runs anywhere in THIS sequence (verified — disabling it
    // leaves this test green; only disabling render()'s reset fails it).
    // clearOutput()'s reset is real and necessary elsewhere — the simpler
    // "clearOutput() resets the pannable .dyad-sheets strip to its leading
    // edge" case above pins IT specifically, for the path render() never
    // reaches (an invalid re-submission clearing a still-visible pair).
    // What this test proves that the simpler ones don't: a live-fire pass
    // against the real app found the hidden→visible transition itself can
    // resurrect a stale pre-hide offset (a snap/scroll-anchor style
    // restoration) — asserting right after close()/open() can't catch that,
    // since #dyad-output is hidden throughout that window either way; this
    // carries the sequence through a second full submitSecond() → render()
    // to the exact point the real bug resurfaced.
    const h = harness('t5');

    // Pair 1: submit, expand every axis, pan to sheet B.
    h.withDom(() => submitSecond());
    for (const id of DYAD_AXIS_IDS) h.get(id).open = true;
    h.get('dyad-sheets').scrollLeft = 320;
    expect(h.get('dyad-sheets').scrollLeft).toBe(320); // panned while visible — takes effect

    // Close (hides #dyad-output) and reopen (still hidden — nothing has
    // rendered yet).
    h.withDom(() => closeDyad());
    h.withDom(() => openDyad());
    expect(h.get('dyad-output').hidden).toBe(true);

    // Pair 2: a fresh valid submission, re-entering the typed fields close()
    // blanked (F1 shape) — this is the render() call that reveals
    // #dyad-output again and would resurface a stale offset.
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });

    expect(h.get('dyad-output').hidden).toBe(false);
    // scrollLeft 0 is sheet A's leading position — the strip must not carry
    // pair 1's pan into pair 2's render.
    expect(h.get('dyad-sheets').scrollLeft).toBe(0);
    for (const id of DYAD_AXIS_IDS) expect(h.get(id).open, id).toBe(false);
  });
});

describe('dyad surface — presentation: axis interaction CSS (44px target + focus-visible)', () => {
  // Presentation-only: pinned against the injected stylesheet source, the
  // same way the doctrine-wording pins below check other CSS-adjacent
  // strings. This is a rule-text pin, not a real layout measurement (§12 —
  // no jsdom, no computed styles in this suite); the browser live-fire pass
  // is what confirms the rendered box.
  it('.dyad-axis > summary declares a 44px minimum tap target', () => {
    expect(dyadJs).toMatch(/#dyad-screen \.dyad-axis > summary \{[\s\S]*?min-height:\s*44px/);
  });

  it('.dyad-axis > summary has an explicit :focus-visible outline', () => {
    expect(dyadJs).toMatch(
      /#dyad-screen \.dyad-axis > summary:focus-visible \{[\s\S]*?outline:\s*2px solid var\(--text\)/);
  });
});

describe('dyad surface — F5: both sides are real standalone sheets', () => {
  const h = () => {
    const inst = harness('t5', { noteSlot: () => 'mid' });
    inst.withDom(() => submitSecond());
    return inst;
  };

  it('each side carries its OWN written 144-card entry', async () => {
    const { CARDS } = await import('../content/cards.v1.full.js');
    const inst = h();
    for (const [prefix, profile] of [['a', A], ['b', B]]) {
      const cell = CARDS[profile.sunSign][profile.animal];
      expect(inst.byAttr.get(`[data-sheet-name="${prefix}"]`).textContent, prefix).toBe(cell.name);
      expect(inst.byAttr.get(`[data-sheet-habit="${prefix}"]`).textContent, prefix).toBe(cell.habit);
      expect(inst.byAttr.get(`[data-sheet-note="${prefix}"]`).textContent, prefix).toBe(cell.note.mid);
    }
    // ...and they are different people, so different entries.
    expect(inst.byAttr.get('[data-sheet-name="a"]').textContent)
      .not.toBe(inst.byAttr.get('[data-sheet-name="b"]').textContent);
  });

  it('each side carries its own catalog numeral', async () => {
    const { getCard } = await import('../core/engine.js');
    const inst = h();
    expect(inst.byAttr.get('[data-sheet-catalog="a"]').textContent).toBe(`no. ${getCard(A).catalog}`);
    expect(inst.byAttr.get('[data-sheet-catalog="b"]').textContent).toBe(`no. ${getCard(B).catalog}`);
  });

  it('the sheet structure mirrors index.html — same rows, same titles', () => {
    // A second markup definition is only safe if it cannot drift from the one
    // it mirrors. index.html's coord-section titles are the reference.
    const hostTitles = [...html.matchAll(/<div class="coord-title"[^>]*>([^<]+)<\/div>/g)]
      .map(m => m[1].trim());
    const builtTitles = [...buildSheetMarkup('x')
      .matchAll(/<div class="coord-title"[^>]*>([^<]+)<\/div>/g)].map(m => m[1].trim());
    expect(builtTitles).toEqual(hostTitles);
    expect(builtTitles).toHaveLength(8);
  });

  it('the built sheet emits NO id, so it cannot collide with the host sheet (G2)', () => {
    // ui/meanings.js binds the host compartments by getElementById. A second
    // sheet carrying the same ids would make that lookup ambiguous and the
    // host's own meaning panel would read whichever node came first.
    const markup = buildSheetMarkup('a') + buildSheetMarkup('b');
    expect(markup).not.toMatch(/\sid=/);
    // Classes are shared on purpose (the sheet must LOOK like the host sheet);
    // it is the id attribute that must never be duplicated.
    for (const hostId of ['coord-arcana-symbol', 'card-entry', 'public-read', 'card-face']) {
      expect(markup, hostId).not.toContain(`id="${hostId}"`);
    }
  });

  it('the second sheet never touches the facet key — the note slot is handed in', () => {
    const sheetCode = stripComments(readFileSync(join(REPO_ROOT, 'ui', 'sheet.js'), 'utf-8'));
    expect(sheetCode).not.toMatch(/localStorage|eight_ball_|getFacetSlot|consumeFacetShake/);
    expect(dyadCode).not.toMatch(/getFacetSlot|consumeFacetShake|ensureFacetIndex/);
  });
});

describe('dyad surface — F1: nothing of person B survives closing', () => {
  it('close() blanks every node the render filled, not a subset', () => {
    const inst = harness('t5');
    inst.withDom(() => submitSecond());
    expect(inst.cell('b', 'arcana').textContent).toBeTruthy(); // not vacuous
    expect(inst.get('dyad-head-b').textContent).toBeTruthy();

    inst.withDom(() => closeDyad());

    expect(inst.get('dyad-head-a').textContent).toBe('');
    expect(inst.get('dyad-head-b').textContent).toBe('');
    for (const prefix of ['a', 'b']) {
      for (const key of CELL_KEYS) {
        expect(inst.cell(prefix, key).textContent, `${prefix}/${key}`).toBe('');
      }
      for (const attr of ['name', 'type', 'habit', 'note', 'families', 'antifit', 'roleline']) {
        expect(inst.byAttr.get(`[data-sheet-${attr}="${prefix}"]`).textContent,
          `${prefix}/${attr}`).toBe('');
      }
    }
    for (const id of Object.keys(DYAD_RELATION_NODES)) {
      expect(inst.get(id).textContent, id).toBe('');
    }
    // The aggregate sentinel the original suite lacked: not one of B's strings
    // is anywhere in the screen's DOM, hidden or not.
    const text = allText(inst);
    for (const needle of [B.sunSign, B.animal, B.birthCard.label, String(B.lifePath), 'specimen']) {
      expect(text, `leaked: ${needle}`).not.toContain(needle);
    }
  });

  it('the seal / aria state describing a tier is dropped too', () => {
    const inst = harness('t5');
    inst.withDom(() => submitSecond());
    inst.withDom(() => closeDyad());
    expect(inst.get('dyad-relation').classList.contains('sealed')).toBe(false);
    expect(inst.get('dyad-relation').getAttribute('aria-label')).toBeUndefined();
    expect(inst.get('dyad-cta').hidden).toBe(true);
    expect(inst.get('dyad-cta').getAttribute('href')).toBeUndefined();
  });

  it('an INVALID re-submission invalidates the previous pair first (fail closed)', () => {
    // Before the fix the screen kept showing person B-1's name and coordinates
    // under a form describing B-2, and held B-1's whole profile object alive
    // past an explicit attempt to replace them.
    const inst = harness('t5');
    inst.withDom(() => submitSecond());
    expect(inst.cell('b', 'arcana').textContent).toBeTruthy();

    inst.withDom(() => {
      inst.get('dyad-name-input').value = '   ';       // whitespace-only
      inst.get('dyad-dob-input').value = '2099-01-01'; // future
      return submitSecond();
    });

    expect(inst.get('dyad-output').hidden).toBe(true);
    expect(inst.get('dyad-head-b').textContent).toBe('');
    for (const key of CELL_KEYS) expect(inst.cell('b', key).textContent, key).toBe('');
    expect(allText(inst)).not.toContain(B.birthCard.label);
  });

  it('opening again starts from a blank screen, never a resumed pair', () => {
    const inst = harness('t5');
    inst.withDom(() => submitSecond());
    inst.withDom(() => closeDyad());
    inst.withDom(() => openDyad());
    expect(inst.get('dyad-output').hidden).toBe(true);
    expect(inst.cell('b', 'arcana').textContent).toBe('');
    expect(inst.get('dyad-name-input').value).toBe('');
    expect(inst.get('dyad-dob-input').value).toBe('');
  });

  it('the entry form asks no gender — the field left with the ask (2026-08-30)', () => {
    // The F1 leak this replaced (a prior person's gender surviving
    // close()/open()) is now impossible by construction: there is no
    // control to leak. This pin keeps the field from returning.
    const markup = readFileSync(join(REPO_ROOT, 'ui', 'dyad.js'), 'utf-8');
    expect(markup).not.toMatch(/dyad-gender-input/);
    expect(markup).not.toMatch(/second gender/);
  });

  it('render() with no second person shows nothing', () => {
    const inst = harness('t5');
    expect(inst.withDom(() => renderDyad())).toBeNull();
    expect(inst.get('dyad-output').hidden).toBe(true);
  });
});

describe('dyad surface — F3: one validation contract, both forms', () => {
  it('initDyadUI sets the real #dyad-dob-input.max to todayIsoLocal() (PR #187 R1)', () => {
    // The native affordance a live-fire browser pass checks, mirroring
    // index.html's primary dobInput. A test that only calls todayIsoLocal()
    // or greps dyad.js's source could pass even if init never wired the
    // real DOM node up — this drives initDyadUI itself and reads the actual
    // node it wrote to.
    const inst = harness('t5');
    expect(inst.get('dyad-dob-input').max).toBe(todayIsoLocal());
  });

  it('the second form rejects exactly what the primary form rejects', () => {
    const today = '2026-07-30';
    const cases = [
      { name: '', dob: '1990-01-01', field: 'name' },
      { name: '   ', dob: '1990-01-01', field: 'name' },
      { name: 'a', dob: '', field: 'dob' },
      { name: 'a', dob: '2099-01-01', field: 'dob' },
      { name: 'a', dob: '1899-01-01', field: 'dob' },
    ];
    for (const c of cases) {
      const verdict = validateBirthInput({ name: c.name, dob: c.dob }, today);
      expect(verdict.ok, JSON.stringify(c)).toBe(false);
      expect(verdict.field, JSON.stringify(c)).toBe(c.field);
    }
    expect(validateBirthInput({ name: ' x ', dob: '1990-01-01' }, today))
      .toEqual({ ok: true, name: 'x', dob: '1990-01-01' });
  });

  it('a rejected second entry surfaces the matching error node', () => {
    const inst = harness('t5');
    inst.withDom(() => {
      inst.get('dyad-name-input').value = '  ';
      inst.get('dyad-dob-input').value = '1990-01-01';
      return submitSecond();
    });
    expect(inst.get('dyad-name-error').hidden).toBe(false);
    expect(inst.get('dyad-dob-error').hidden).toBe(true);

    inst.withDom(() => {
      inst.get('dyad-name-input').value = 'ok';
      inst.get('dyad-dob-input').value = '2099-01-01';
      return submitSecond();
    });
    expect(inst.get('dyad-dob-error').hidden).toBe(false);
    expect(inst.get('dyad-name-error').hidden).toBe(true);
  });

  it('the second form offers a birthplace field, so B can resolve a rising sign', () => {
    const markup = readFileSync(join(REPO_ROOT, 'ui', 'dyad.js'), 'utf-8');
    expect(markup).toContain('dyad-city-input');
    expect(markup).toContain('dyad-city-suggestions');
    expect(markup).toContain('dyad-polar-message');
  });

  it('ui/citysearch.js is per-instance, so a second field cannot hijack the first (G3)', async () => {
    // The latent P0: module-scope handlers closing over module-scope refs meant
    // a second init repointed the PRIMARY form's listeners, and index.html's
    // selectedCity would stay null forever — silently dropping the rising sign
    // from every shipped single reading.
    const src = stripComments(readFileSync(join(REPO_ROOT, 'ui', 'citysearch.js'), 'utf-8'));
    expect(src).not.toMatch(/^let _refs\b/m);
    expect(src).not.toMatch(/^let _hooks\b/m);
    expect(src).not.toMatch(/^let _results\b/m);

    const cs = await import('../ui/citysearch.js');
    const mkInput = () => ({
      value: '', attrs: {}, listeners: {},
      setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
      addEventListener(t, fn) { this.listeners[t] = fn; },
    });
    const mkList = id => ({ id, innerHTML: '', children: [], appendChild(c) { this.children.push(c); } });
    const picks = { first: undefined, second: undefined };
    const prior = globalThis.document;
    globalThis.document = { head: null, getElementById: () => null, createElement: () => ({ setAttribute() {}, appendChild() {} }) };
    try {
      const a = { cityInput: mkInput(), citySuggestions: mkList('city-suggestions') };
      const b = { cityInput: mkInput(), citySuggestions: mkList('dyad-city-suggestions') };
      cs.initCitySearchUI(a, { setSelectedCity: c => { picks.first = c; } });
      cs.initCitySearchUI(b, { setSelectedCity: c => { picks.second = c; } });
      // Typing in the FIRST field must still reach the FIRST hook.
      a.cityInput.value = 'x';
      a.cityInput.listeners.input();
      expect(picks.first).toBeNull();
      expect(picks.second).toBeUndefined();
    } finally {
      globalThis.document = prior;
    }
  });
});

// ── standalone sheet host (real DOM surface, no ui/dyad.js involved) ──────
//
// Every node ui/sheet.js's createSheet() can address, addressed the same way
// share_surface.test.js's makeSheetHost() does: querySelector keyed off the
// exact data-sheet-* selectors createSheet builds, each cell wired with a
// real .closest('.coord-cell') root carrying its own classList. Unlike
// makeSheetHost, this stays independent of ui/tiers.js's CELL_KEYS-derived
// row layout only incidentally — it exists so the bounded differential below
// can drive createSheet() with nothing borrowed from the host renderer it is
// being compared against.
function makeStandaloneSheetHost(prefix) {
  const byAttr = new Map();
  const mk = () => ({ textContent: '', classList: makeClassList() });
  for (const key of CELL_KEYS) {
    const cellRoot = { classList: makeClassList() };
    const cell = mk();
    cell.closest = sel => (sel === '.coord-cell' ? cellRoot : null);
    byAttr.set(`[data-sheet-cell="${prefix}:${key}"]`, cell);
  }
  for (const attr of ['catalog', 'name', 'type', 'habit', 'note',
    'families', 'antifit', 'roleline', 'public-bridge']) {
    byAttr.set(`[data-sheet-${attr}="${prefix}"]`, mk());
  }
  for (const attr of ['face', 'entry', 'public']) {
    byAttr.set(`[data-sheet-${attr}="${prefix}"]`, mk());
  }
  for (const lead of Object.keys(ROW_TITLES)) {
    byAttr.set(`[data-sheet-title="${prefix}:${lead}"]`, mk());
  }
  const host = { querySelector: sel => byAttr.get(sel) || null };
  return { host, byAttr };
}

describe('dyad surface — bounded honest differential: sheet.js vs a REAL renderTierSections host render (PR #187 P2-R3)', () => {
  // NOT "every profile" — the first version of this claim (and DOCTRINE's,
  // corrected alongside it) named a profile space that name-derived
  // numerology makes unenumerable, and its own suite never actually drove
  // renderTierSections, so it compared cellRenderState to itself and could
  // not have caught a written-entry regression in the shared caller (R2).
  // The honest bound, stated in code rather than only in a comment: one
  // profile per life-path facet-anchor group (1-3 / 4-6 / 7-9), across
  // every tier, driven through a real `initTiersUI` + `renderTierSections`
  // host and a real `createSheet(...).render(...)`, cell by cell.
  const LONDON = { time: '14:15', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' };
  const ANCHOR_PROFILES = [
    ['low (1-3)', buildProfile('diff low', '1900-01-01', { ...LONDON, time: '08:30' })],
    ['mid (4-6)', buildProfile('diff mid', '2000-01-01', LONDON)],
    ['high (7-9)', buildProfile('diff high', '1990-07-10', { ...LONDON, time: '22:05' })],
    // Calc v4 (§1.B v0.62): a master life path is a fourth REPRESENTATIVE of
    // the same three anchor groups, not a fourth group — it shares `high`
    // with 7-9. It is exercised here because its numerology cells carry
    // two-character values, which is the one shape the differential had
    // never seen on either side of the comparison.
    ['high (master 22)', buildProfile('diff master', '1970-01-04', { ...LONDON, time: '11:40' })],
  ];
  const TIERS = ['free', 't1', 't2', 't3', 't5'];
  const CASES = ANCHOR_PROFILES.flatMap(([label, profile]) =>
    TIERS.map(tier => [label, tier, profile]));

  it.each(CASES)('%s @ %s: every cell, plus written-entry and public-read, agree', (label, tier, profile) => {
    const expectedBucket = label.startsWith('low') ? 0 : label.startsWith('mid') ? 1 : 2;
    expect(anchorFacetIndex(profile.lifePath), label).toBe(expectedBucket);

    // ── a REAL host render ──
    const style = () => ({ setProperty() {}, removeProperty() {} });
    const hostRoots = {};
    const hostCells = {};
    for (const key of CELL_KEYS) {
      const root = { classList: makeClassList(), style: style() };
      hostRoots[key] = root;
      hostCells[key] = { textContent: '', closest: sel => (sel === '.coord-cell' ? root : null) };
    }
    const hostEntry = { classList: makeClassList(), style: style() };
    initTiersUI({
      sunTitle: { textContent: '' }, animalTitle: { textContent: '' },
      entry: hostEntry, cells: hostCells,
    }, {});
    const { cardEntry: hostCardEntry } = renderTierSections(profile, tier);

    // ── a REAL sheet render, independently constructed ──
    const { host: sheetHost } = makeStandaloneSheetHost('x');
    const sheet = createSheet(sheetHost, { prefix: 'x' });
    const publicRead = publicReadFor(profile);
    const { cardEntry: sheetCardEntry, publicRead: sheetPublicOpen } =
      sheet.render(profile, tier, { noteSlot: 'mid', publicRead });

    const stateOf = root => (root.classList.contains('sealed') ? 'sealed'
      : root.classList.contains('unres') ? 'unres' : 'value');

    for (const key of CELL_KEYS) {
      const sheetNode = sheetHost.querySelector(`[data-sheet-cell="x:${key}"]`);
      const sheetRoot = sheetNode.closest('.coord-cell');
      expect(sheetNode.textContent, `${label}/${tier}/${key} text`).toBe(hostCells[key].textContent);
      expect(stateOf(sheetRoot), `${label}/${tier}/${key} state`).toBe(stateOf(hostRoots[key]));
    }

    expect(sheetCardEntry, `${label}/${tier} cardEntry`).toBe(hostCardEntry);
    expect(sheetCardEntry, `${label}/${tier} cardEntry vs coordsForTier`)
      .toBe(coordsForTier(tier).has('cardEntry'));

    // Written-entry: ui/tiers.js's renderTierSections does NOT fill this
    // (index.html's renderCard owns that content fill) — so there is no
    // "host" render to compare against here. Independently recompute the
    // correct value straight from the deck instead of comparing sheet.js to
    // itself.
    const cardCell = hostCardEntry ? CARDS[profile.sunSign][profile.animal] : null;
    expect(sheetHost.querySelector('[data-sheet-name="x"]').textContent, `${label}/${tier} name`)
      .toBe(cardCell ? cardCell.name : '');
    expect(sheetHost.querySelector('[data-sheet-habit="x"]').textContent, `${label}/${tier} habit`)
      .toBe(cardCell ? cardCell.habit : '');
    expect(sheetHost.querySelector('[data-sheet-note="x"]').textContent, `${label}/${tier} note`)
      .toBe(cardCell ? cardCell.note.mid : '');

    // Public read: same rule — independently recomputed via ui/public.js,
    // never compared to a second call inside sheet.js.
    const publicOpen = coordsForTier(tier).has('publicRead');
    expect(sheetPublicOpen, `${label}/${tier} publicOpen`).toBe(publicOpen && !!publicRead);
    expect(sheetHost.querySelector('[data-sheet-families="x"]').textContent, `${label}/${tier} families`)
      .toBe(publicOpen && publicRead ? publicRead.families : '');
    expect(sheetHost.querySelector('[data-sheet-antifit="x"]').textContent, `${label}/${tier} antifit`)
      .toBe(publicOpen && publicRead ? publicRead.antiFit : '');
    expect(sheetHost.querySelector('[data-sheet-roleline="x"]').textContent, `${label}/${tier} roleline`)
      .toBe(publicOpen && publicRead ? publicRead.roleLine : '');
    // The master-birthday disclosure travels with the block (§1.B v0.62). The
    // `high (master 22)` profile below is born on the 4th, so its BIRTHDAY is
    // not a master and this stays empty for it — which is why the dedicated
    // master-birthday case follows rather than relying on this sweep.
    expect(sheetHost.querySelector('[data-sheet-public-bridge="x"]').textContent, `${label}/${tier} bridge`)
      .toBe(publicOpen && publicRead ? publicRead.bridge : '');
  });

  // The sweep above varies the LIFE PATH across facet-anchor groups; the
  // bridge is driven by the BIRTHDAY, so it needs its own case or the
  // disclosure ships to person B untested (PR audit, 2026-07-31, P1).
  it.each([
    ['birthday 11 → mode 2', buildProfile('diff m11', '1980-06-11'), '11'],
    ['birthday 22 → mode 4', buildProfile('diff m22', '1995-09-22'), '22'],
  ])('a second person with a master birthday sees the disclosure (%s)', (_label, profile, master) => {
    const { host: sheetHost } = makeStandaloneSheetHost('x');
    const sheet = createSheet(sheetHost, { prefix: 'x' });
    const publicRead = publicReadFor(profile);
    expect(publicRead.bridge).toContain(master);

    sheet.render(profile, 't5', { noteSlot: 'mid', publicRead });
    expect(sheetHost.querySelector('[data-sheet-public-bridge="x"]').textContent)
      .toBe(publicRead.bridge);

    // Below t3 the whole block seals, disclosure included — an unentitled
    // render carries no entitled string (§1.D v0.37).
    sheet.render(profile, 't2', { noteSlot: 'mid', publicRead });
    expect(sheetHost.querySelector('[data-sheet-public-bridge="x"]').textContent).toBe('');

    // And `clear()` scrubs it: the node is in valueNodes(), so a list that
    // fell behind the fill path — the F1 defect this module already carries a
    // fix for — would leave person B's disclosure in live hidden DOM.
    sheet.render(profile, 't5', { noteSlot: 'mid', publicRead });
    expect(sheetHost.querySelector('[data-sheet-public-bridge="x"]').textContent.length)
      .toBeGreaterThan(0);
    sheet.clear();
    expect(sheetHost.querySelector('[data-sheet-public-bridge="x"]').textContent).toBe('');
  });

  it('index boot supplies publicReadFor and the real dyad render carries both bridge notes', () => {
    // The direct createSheet cases above pin the leaf renderer. This drives
    // initDyadUI → submitSecond → render with the same hook index.html ships,
    // so deleting either the host hook or ui/dyad.js's hook consumption fails.
    expect(html).toMatch(/initDyadUI\([\s\S]*?getPublicRead:\s*publicReadFor/);

    const profileA = buildProfile('wire a', '1980-06-11');
    const profileB = buildProfile('wire b', '1995-09-22');
    const inst = harness('t5', {
      profileA,
      second: profileB,
      publicRead: publicReadFor,
    });

    inst.withDom(() => submitSecond());
    const bridgeA = inst.byAttr.get('[data-sheet-public-bridge="a"]');
    const bridgeB = inst.byAttr.get('[data-sheet-public-bridge="b"]');
    expect(bridgeA.textContent).toContain('11');
    expect(bridgeB.textContent).toContain('22');

    inst.withDom(() => closeDyad());
    expect(bridgeA.textContent).toBe('');
    expect(bridgeB.textContent).toBe('');
  });
});

describe('dyad surface — role-aware note resolution (PR #187 R2)', () => {
  const originalStorage = globalThis.localStorage;
  afterEach(() => {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  });

  it('B always renders its OWN fresh anchor, even while A/current sits rotated elsewhere', () => {
    // A = the module fixture (lifePath 4, the mid bucket). Simulate a device
    // that has already flipped its OWN written entry off its anchor, to
    // 'low' (stored index 0), before ever opening the dyad screen.
    const store = new Map([[FACET_KEY, '0']]);
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    expect(anchorFacetIndex(A.lifePath)).toBe(1); // A anchors mid...
    expect(getFacetSlot(A.lifePath)).toBe('low'); // ...but the device is rotated to low.
    // B (module fixture) carries a master life path under calc v4, which
    // anchors the THIRD position — so the two slots genuinely differ and the
    // assertions below are not vacuous.
    expect(B.lifePath).toBe(11);
    expect(anchorFacetIndex(B.lifePath)).toBe(2);

    const calls = [];
    const noteSlot = (p, role) => {
      calls.push({ role, lifePath: p.lifePath });
      return role === 'b' ? getFreshFacetSlot(p.lifePath) : getFacetSlot(p.lifePath);
    };

    const inst = harness('t5', { noteSlot });
    inst.withDom(() => submitSecond());

    expect(calls).toEqual([
      { role: 'a', lifePath: A.lifePath },
      { role: 'b', lifePath: B.lifePath },
    ]);

    const aCard = CARDS[A.sunSign][A.animal];
    const bCard = CARDS[B.sunSign][B.animal];
    // A rendered at the device's ROTATED (stored) position...
    expect(inst.byAttr.get('[data-sheet-note="a"]').textContent).toBe(aCard.note.low);
    // ...while B rendered its FRESH anchor, ignoring the exact same stored
    // index — the R2 defect was B silently inheriting A's rotated slot.
    expect(inst.byAttr.get('[data-sheet-note="b"]').textContent).toBe(bCard.note.high);
    if (bCard.note.high !== bCard.note.low) {
      expect(inst.byAttr.get('[data-sheet-note="b"]').textContent).not.toBe(bCard.note.low);
    }
  });
});

describe('dyad surface — city payload regression: cc must be countryCode, not city.cc (PR #187 R5)', () => {
  it('a real city selection through ui/citysearch.js produces a buildSecond payload with cc === city.countryCode', async () => {
    const city = { name: 'Accra', country: 'Ghana', countryCode: 'GH', lat: 5.6, lng: -0.19, tz: 'Africa/Accra' };
    // City records never carry a `.cc` field (core/cities.js's shape is
    // `{..., countryCode, ...}`) — asserting this on the fixture keeps the
    // regression honest: if it ever grew one, the negative assertion below
    // would stop meaning anything.
    expect(city.cc).toBeUndefined();
    searchCities.mockReset();
    searchCities.mockResolvedValue([city]);

    let captured = null;
    const inst = harness('t5', { buildSecond: payload => { captured = payload; return B; } });

    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      const cityInput = inst.get('dyad-city-input');
      cityInput.value = 'ac';
      cityInput.listeners.input();
      await vi.advanceTimersByTimeAsync(200); // > ui/citysearch.js's 150ms SEARCH_DEBOUNCE_MS

      const suggestions = inst.get('dyad-city-suggestions');
      expect(suggestions.children.length).toBe(1);
      suggestions.children[0].listeners.mousedown({ preventDefault() {} });

      inst.get('dyad-name-input').value = 'specimen b';
      inst.get('dyad-dob-input').value = '1988-06-15';
      expect(submitSecond()).toBe(true);
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }

    expect(captured).not.toBeNull();
    expect(captured.cc).toBe(city.countryCode);
    expect(captured.city).toBe(city.name);
  });

  it('the buildSecond payload carries no gender (§1.J one entry contract, ask removed 2026-08-30)', () => {
    let captured = null;
    const inst = harness('t5', { buildSecond: payload => { captured = payload; return B; } });
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    try {
      inst.get('dyad-name-input').value = 'specimen b';
      inst.get('dyad-dob-input').value = '1988-06-15';
      expect(submitSecond()).toBe(true);
      expect(captured).not.toHaveProperty('gender');
    } finally {
      globalThis.document = outer;
    }
  });
});

describe('dyad surface — doctrine wording pins (PR #187 corrections, source-contract)', () => {
  const doctrine = readFileSync(join(REPO_ROOT, 'DOCTRINE.md'), 'utf-8');
  const sheetSrc = readFileSync(join(REPO_ROOT, 'ui', 'sheet.js'), 'utf-8');

  it('DOCTRINE.md states the day master is read off profile.dayPillar, not recomputed (F4)', () => {
    expect(doctrine).toMatch(/The day master is NOT a fork/);
    expect(doctrine).toMatch(/reads it off `profile\.dayPillar` rather than recomputing it/);
  });

  it('DOCTRINE.md and ui/sheet.js both name the differential as BOUNDED, not "every profile" (P2-R3)', () => {
    expect(doctrine).toMatch(/one profile per life-path facet-anchor group/);
    expect(doctrine).toMatch(/a REAL `renderTierSections` host render/);
    expect(sheetSrc).toMatch(/one profile per life-path facet-anchor group/);
    expect(sheetSrc).toMatch(/a REAL `renderTierSections` host render/);
    // The overclaim the correction retired: neither surface may go back to
    // asserting coverage over the whole (unenumerable) profile space.
    expect(doctrine).not.toMatch(/for every profile × tier × cell/);
    expect(sheetSrc).not.toMatch(/for\s+every profile × tier × cell/);
  });

  it('dyad.js documents that dyadEntryVisible no longer reacts to T5_PRODUCT_URL (R6)', () => {
    expect(dyadJs).toMatch(/does NOT[\s\S]{0,40}react to `T5_PRODUCT_URL`/);
  });
});
