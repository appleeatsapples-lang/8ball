// 8ball / tests / dyad_surface.test.js
//
// The dyad surface (ui/dyad.js) — the wiring, not the engine. Engine
// behaviour is pinned in tests/dyad.test.js and voice policy in
// tests/dyad_content.test.js. This file covers the seams the wiring adds:
//
//   1. SEALED-DOM PURITY. Below t5 the relation layer renders its seal with
//      the value nodes EMPTY — absent, not hidden (§1.D v0.37). An
//      unentitled render must carry no entitled passage anywhere in the DOM.
//   2. THE OFFER (§4.B v0.81, restated at v0.90). One plain anchor carrying
//      the configured Buy Link and the fixed copy, shown to the unentitled
//      device; the entry control is entitlement-only (R6) and the two swap
//      on the same sync. `getRenderTier()` answers `t3` for every device
//      and `t5` only from a verified signed access token.
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

vi.mock('../core/cities.js', () => ({
  searchCities: vi.fn(),
  warmCities: vi.fn(),
  // Real semantics reproduced (not stubbed to a constant): the module under
  // test branches its retry copy on this predicate, so a mock that always
  // answered the same way could never distinguish the two rejection tests
  // below from each other.
  isCityLoadExhausted: err => Boolean(err && err.code === 'CITY_LOAD_EXHAUSTED'),
}));

import { makeClassList } from './helpers/dom.js';
import { SECOND_PERSON_RE, voiceRegisterHits } from './helpers/voice-register.js';
import { initPublicUI } from '../ui/public.js';
import {
  DYAD_RELATION_NODES,
  DYAD_AXIS_IDS,
  dyadEntitled,
  dyadEntryVisible,
  dyadOfferVisible,
  syncDyadAboutCopy,
  DYAD_OFFER_COPY,
  formatDyadRelation,
  dyadRelationFor,
  initDyadUI,
  syncDyadEntry,
  open as openDyad,
  close as closeDyad,
  submitSecond,
  render as renderDyad,
  clearOutput,
  closePairedPanel,
  compareAnother,
  isOpen as isDyadOpen,
  currentRelation,
  elementCycleFacts,
} from '../ui/dyad.js';
import { panelDetailFor, coordinateLabel } from '../ui/meanings.js';
import { derivationText } from '../ui/tiers.js';
import { buildSheetMarkup, createSheet, ROW_TITLES } from '../ui/sheet.js';
import { validateBirthInput, todayIsoLocal } from '../ui/profile.js';
import {
  TIER_ORDER, RETIRED_TIERS, RETIREMENT_COLLISIONS,
  isTier, tierRank, maxTier, normalizeTier, resolveRenderTier, applyPaidReturn,
  anchorFacetIndex,
} from '../core/payments.js';
import { getFacetSlot, getFreshFacetSlot, FACET_KEY } from '../ui/payments.js';
import { DYAD_PRODUCT_URL } from '../core/entitlement.js';
import {
  TIER_COORDS, CELL_KEYS, CELL_COORD, coordsForTier, tierDensitySummary,
  newlyEntitledCells, cellRenderState,
  initTiersUI, renderTierSections,
} from '../ui/tiers.js';
import { buildDyadReading, elementDirection } from '../core/dyad.js';
import { DYAD_QUALIFIER } from '../content/dyad.v2.js';
import { buildProfile } from '../core/profile.js';
import { getCard } from '../core/engine.js';
import { CARDS } from '../content/cards.v1.full.js';
import { publicReadFor } from '../ui/public.js';
import { searchCities, isCityLoadExhausted } from '../core/cities.js';
import { buildPairImprintSnapshot, buildPairImprintSVG, buildPairImprintCaption, PAIR_IMPRINT_ALLOW } from '../ui/pairShare.js';

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

// Fifth remediation gate, item 4: this block tests `core/payments.js`'s
// tier-ladder registry directly — TIER_ORDER, resolveRenderTier,
// applyPaidReturn, maxTier, normalizeTier. That module is the kua-retirement
// precedent's "engine stands" half: it is a tested, pure state-machine
// registry, but since the 2026-09-02 free amendment (§1.D v0.71) the LIVE
// render path never calls it — ui/payments.js's own getRenderTier() (the
// single render-density resolver every real render path uses) answers 't3'
// for every device and 't5' only from a verified signed access token (v0.81),
// with no reference to stored tier/credits at all. The "buying"/"paid for"/monotonic-ladder language below describes
// what these retained functions still correctly compute given historical
// input SHAPES (so a pre-amendment device's stored state migrates/resolves
// sanely if ever read again), not anything a current device experiences.
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
    expect(tierDensitySummary('t5')).toEqual({ open: 16, sealed: 0, total: 16 });
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
      .toEqual(['rising', 'moon', 'element', 'innerAnimal', 'nameNumber', 'soulUrge']);
    expect(newlyEntitledCells('t1', 't2'))
      .toEqual(['dayPillar', 'personality', 'birthday', 'maturity']);
    expect(newlyEntitledCells('t2', 't3')).toEqual(['hourPillar', 'cardEntry', 'publicRead']);
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
  const node = {
    tag, textContent: '', value: '', hidden: false,
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
  // A real innerHTML=''/appendChild pair (ui/citysearch.js's own
  // clearSuggestions()) must actually clear `.children` — real DOM
  // semantics, and load-bearing for any test that drives the search field
  // through more than one result set in a single case.
  let _innerHTML = '';
  Object.defineProperty(node, 'innerHTML', {
    get() { return _innerHTML; },
    set(v) { _innerHTML = v; node.children = []; },
  });
  return node;
}

// Parse the ids and data-sheet-* hooks out of the injected markup so the
// harness addresses exactly the nodes the real DOM would expose.
function harness(tier, { profileA = A, second = B, noteSlot = () => 'mid',
  publicRead = () => null, validate = validateBirthInput,
  buildSecond = () => second, onOpen = () => {}, onExit = () => {} } = {}) {
  const byId = new Map();
  const byAttr = new Map();

  const root = makeNode('section');
  root.classList.add('hidden'); // injectScreen sets `screen hidden`
  root.querySelector = sel => byAttr.get(sel) || null;
  byId.set('dyad-screen', root);

  // Every id and data-attribute the screen markup can contain.
  const ids = [
    'dyad-output', 'dyad-error', 'dyad-head-a', 'dyad-head-b', 'dyad-relation',
    'dyad-name-input', 'dyad-dob-input', 'dyad-time-input',
    'dyad-city-input', 'dyad-city-suggestions', 'dyad-city-status', 'dyad-polar-message',
    'dyad-name-error', 'dyad-dob-error', 'dyad-form', 'dyad-back',
    'dyad-open-btn', 'dyad-style', 'dyad-spine', 'dyad-sheets',
    // The compartment hint and panel remain after the v0.89 toggle retirement.
    'dyad-meaning-hint', 'dyad-meaning-panel',
    'dyad-meaning-head', 'dyad-meaning-derivation', 'dyad-meaning-title', 'dyad-meaning-body',
    'dyad-meaning-context-head', 'dyad-meaning-context', 'dyad-meaning-relation-head',
    'dyad-meaning-relation', 'dyad-meaning-close',
    // v0.83: Pair Dossier hierarchy — heading/scope, compact signature, the
    // narrow-screen A/B jump control, the failure state, and the completion
    // flow's own controls (dyad-back's relabel needs no new id).
    'dyad-heading', 'dyad-scope', 'dyad-signature',
    'dyad-side-select', 'dyad-side-a', 'dyad-side-b', 'dyad-spine-wrap',
    'dyad-relation-failure', 'dyad-relation-retry',
    'dyad-share-disclosure', 'dyad-share-btn', 'dyad-share-status', 'dyad-compare-btn',
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
      // v0.76: the delegated panel handler asks the event target for its
      // interactive cell root; the root answers for itself.
      cellRoot.closest = sel => (/coord-cell/.test(sel) && (!/has-detail/.test(sel) || cellRoot.classList.contains('has-detail')) ? cellRoot : null);
      cellRoot.cellKey = `${prefix}:${key}`;
      byAttr.set(`[data-sheet-cell="${prefix}:${key}"]`, cell);
    }
    for (const attr of ['title', 'catalog', 'name', 'type', 'habit', 'note',
      'families', 'antifit', 'roleline', 'public-bridge', 'face', 'entry', 'public']) {
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
  // v0.76: the paired panel binds one document-level Escape listener; the
  // harness records it (with its capture flag) so tests can fire it.
  const docListeners = {};
  globalThis.document = {
    getElementById: id => byId.get(id) || null,
    addEventListener: (ev, fn, opts) => { docListeners[ev] = { fn, capture: opts === true || !!(opts && opts.capture) }; },
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
      onOpen, onExit,
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
      cellRoot: (prefix, key) => byAttr.get(`[data-sheet-cell="${prefix}:${key}"]`).closest('.coord-cell'),
      face: prefix => byAttr.get(`[data-sheet-face="${prefix}"]`),
      docListeners,
      // fire a document keydown under a document that may carry an open modal
      escape(modalOpen = false) {
        const outer = globalThis.document;
        globalThis.document = {
          getElementById: id => byId.get(id) || null, createElement: () => makeNode(),
          querySelector: sel => (modalOpen && sel === '.modal-bg.open' ? makeNode() : null),
        };
        try { return docListeners.keydown && docListeners.keydown.fn({ key: 'Escape' }); } finally { globalThis.document = outer; }
      },
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
// open() blanks the typed entry; re-seed it the way harness() does.
const entryFor = h => {
  h.get('dyad-name-input').value = 'specimen b';
  h.get('dyad-dob-input').value = '1988-06-15';
};

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

  // ── the offer (doctrine v0.81: the dyad is the one paid surface) ──

  it('dyadOfferVisible is the complement of the entry: unentitled AND a configured url', () => {
    const url = 'https://example.test/l/dyad';
    for (const tier of ['free', 't1', 't2', 't3']) {
      expect(dyadOfferVisible(tier, url), tier).toBe(true);
      expect(dyadOfferVisible(tier, ''), `${tier} empty url`).toBe(false);
      expect(dyadOfferVisible(tier, null), `${tier} null url`).toBe(false);
    }
    expect(dyadOfferVisible('t5', url)).toBe(false);
    // The default argument is the shipped constant — empty until the
    // controller creates the product (no offer, no entry for an unverified
    // device), a live Buy Link after (the offer). The pin follows the
    // build's state so the launch does not turn it red (pr242 audit, Lane
    // A HIGH-2).
    expect(dyadOfferVisible('t3')).toBe(DYAD_PRODUCT_URL !== '');
    expect(dyadOfferVisible('t5')).toBe(false);
  });

  it('the offer copy is exactly the two registry-voice lines and the disclosure — no score, no verdict, no urgency', () => {
    expect(DYAD_OFFER_COPY.head).toBe('dyad · $3 once');
    expect(DYAD_OFFER_COPY.body).toBe('two complete sheets, read beside each other. permanent access.');
    for (const line of Object.values(DYAD_OFFER_COPY)) {
      expect(line).not.toMatch(/compatib|soulmate|match|score|%|percent|predict|advice|verdict|unlock|only|now|limited|hurry|credit|counter|subscri/i);
      expect(line).not.toMatch(/\$6|\$9|\$1\b|\$2\b/);
      expect(voiceRegisterHits(line)).toEqual([]);
    }
    expect(DYAD_OFFER_COPY.note).toMatch(/gumroad/);
    expect(DYAD_OFFER_COPY.note).toMatch(/never saved/);
    // pr242 audit (Lane B M2): the per-sale link is sent by the operator, not by the page
    expect(DYAD_OFFER_COPY.note).toMatch(/license key/); // v0.91: activation by key, the emailed link is the fallback
    expect(DYAD_OFFER_COPY.note).toMatch(/emailed access link is the fallback/);
  });

  it('an unentitled device sees the offer anchor — a plain link carrying the url and the copy — and no entry control', () => {
    const url = 'https://example.test/l/dyad';
    const h = harness('t3');
    h.withDom(() => syncDyadEntry('t3', url));
    const link = h.get('dyad-offer-link');
    expect(link, 'offer anchor not injected').not.toBeNull();
    expect(link.tag).toBe('a');
    expect(link.hidden).toBe(false);
    expect(link.attrs.href).toBe(url);
    expect(link.attrs.target).toBe('_self');
    expect(link.attrs.rel).toBeUndefined(); // noopener is a no-op on _self (pr242 audit, Lane B L2)
    expect(link.listeners.click).toBeUndefined(); // §5.B: a navigation, never a handler
    expect(link.children.map(c => c.textContent)).toEqual([DYAD_OFFER_COPY.head, DYAD_OFFER_COPY.body]);
    expect(h.get('dyad-offer-note').hidden).toBe(false);
    expect(h.get('dyad-offer-note').textContent).toBe(DYAD_OFFER_COPY.note);
    expect(h.get('dyad-open-btn').hidden).toBe(true);
  });

  it('an entitled device sees the entry control and the offer is hidden WITH its href stripped', () => {
    const url = 'https://example.test/l/dyad';
    const h = harness('t5');
    h.withDom(() => syncDyadEntry('t3', url)); // an earlier unentitled render set the href
    expect(h.get('dyad-offer-link').attrs.href).toBe(url);
    h.withDom(() => syncDyadEntry('t5', url));
    const link = h.get('dyad-offer-link');
    expect(link.hidden).toBe(true);
    expect(link.attrs.href).toBeUndefined();
    expect(h.get('dyad-offer-note').hidden).toBe(true);
    expect(h.get('dyad-open-btn').hidden).toBe(false);
  });

  it('the shipped constant decides: an unentitled device sees NEITHER control while the url is empty, the offer once it is filled', () => {
    const h = harness('t3');
    // injected hidden AND without an href — never a reachable checkout
    // before the first sync (pr242 audit, Lane A M28)
    expect(h.get('dyad-offer-link').hidden).toBe(true);
    expect(h.get('dyad-offer-link').attrs.href).toBeUndefined();
    h.withDom(() => syncDyadEntry('t3'));
    const configured = DYAD_PRODUCT_URL !== '';
    expect(h.get('dyad-offer-link').hidden).toBe(!configured);
    expect(h.get('dyad-offer-link').attrs.href).toBe(configured ? DYAD_PRODUCT_URL : undefined);
    expect(h.get('dyad-open-btn').hidden).toBe(true);
  });

  it('the about modal\'s commerce paragraph follows the offer predicate — closed line visible and open line hidden while unconfigured, swapped when configured (pr242 audit, Lane A HIGH-1)', () => {
    const open = makeNode('p'); open.hidden = true;
    const closed = makeNode('p');
    const prior = globalThis.document;
    globalThis.document = { getElementById: id => ({ 'about-dyad-open': open, 'about-dyad-closed': closed })[id] || null };
    try {
      expect(syncDyadAboutCopy('')).toBe(false);
      expect(open.hidden).toBe(true); expect(closed.hidden).toBe(false);
      expect(syncDyadAboutCopy('https://example.test/l/dyad')).toBe(true);
      expect(open.hidden).toBe(false); expect(closed.hidden).toBe(true);
      expect(syncDyadAboutCopy(null)).toBe(false);
      expect(open.hidden).toBe(true); expect(closed.hidden).toBe(false);
      // the default argument is the shipped constant
      expect(syncDyadAboutCopy()).toBe(DYAD_PRODUCT_URL !== '');
    } finally { globalThis.document = prior; }
    // and the static markup ships the unconfigured state: closed visible, open hidden,
    // the price and the processor ONLY inside the open paragraph
    const closedP = html.match(/<p id="about-dyad-closed"([^>]*)>([\s\S]*?)<\/p>/);
    const openP = html.match(/<p id="about-dyad-open"([^>]*)>([\s\S]*?)<\/p>/);
    expect(closedP).not.toBeNull(); expect(openP).not.toBeNull();
    expect(closedP[1]).not.toMatch(/hidden/);
    expect(openP[1]).toMatch(/\bhidden\b/);
    expect(closedP[2]).not.toMatch(/\$\d|gumroad|checkout/);
    expect(closedP[2]).toMatch(/not on sale on this build/);
    expect(openP[2]).toMatch(/\$3 once, permanent, unlimited/);
    expect(openP[2]).toMatch(/gumroad/);
    expect(dyadJs).toMatch(/syncDyadAboutCopy\(\);/); // called at init
  });

  it('below t5 submitSecond refuses BEFORE validation or build — the gate is its own, not the render gate\'s shadow (pr242 audit, Lane A LOW-6)', () => {
    const built = [];
    const h = harness('t3', { buildSecond: p => { built.push(p); return B; }, validate: () => { built.push('validated'); return { ok: true }; } });
    expect(h.withDom(() => submitSecond())).toBe(false);
    expect(built).toEqual([]);
  });

  it('the module carries the one price string and no retired product slug', () => {
    // The v0.71 absence pin, narrowed rather than dropped: `$3` appears in
    // DYAD_OFFER_COPY.head and nowhere else in the module's code, and the
    // retired Gumroad slugs never return.
    expect(dyadCode.match(/\$\d/g) || []).toEqual(['$3']);
    expect(dyadJs).not.toMatch(/xjpvp|neysyv|rzqezp|T5_PRODUCT_URL/);
  });

  it('an entitled render and close write nothing to storage — person B and the render leave no key', () => {
    const prior = globalThis.localStorage;
    const store = new Map([['eight_ball_labels_revealed_v1', 'false']]);
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: k => { store.delete(k); },
    };
    try {
      const h = harness('t5');
      for (let i = 0; i < 3; i++) {
        // open() blanks the typed entry, so re-seed it — otherwise this loop
        // only ever exercises a FAILED submit (pr242 audit, Lane A MED-1)
        h.withDom(() => openDyad());
        entryFor(h);
        expect(h.withDom(() => submitSecond()), `render ${i}`).toBe(true);
        expect(h.get('dyad-head-b').textContent).toBe(B.firstName || 'b');
        h.withDom(() => closeDyad());
        expect(h.get('dyad-head-b').textContent).toBe('');
      }
      expect([...store.entries()]).toEqual([['eight_ball_labels_revealed_v1', 'false']]);
      expect(JSON.stringify([...store.values()])).not.toMatch(/specimen b|1988-06-15/);
    } finally {
      if (prior === undefined) delete globalThis.localStorage; else globalThis.localStorage = prior;
    }
  });

  it('repeated use consumes nothing: the tenth pair renders exactly like the first', () => {
    const h = harness('t5');
    const results = [];
    for (let i = 0; i < 10; i++) {
      h.withDom(() => { openDyad(); });
      entryFor(h);
      results.push(h.withDom(() => submitSecond()));
      h.withDom(() => closeDyad());
    }
    expect(results).toEqual(Array(10).fill(true));
    expect(dyadEntitled('t5')).toBe(true);
  });

  it('the injected rail control wears the [hidden]-guarded class (pr216 audit LOW 10)', () => {
    // The public-surface hidden-guard walker reads index.html only, so
    // injected controls sit outside it. The entry button is safe because
    // btn-block carries the author [hidden] guard in the shell stylesheet
    // — pin the dependency at both ends so it is coverage, not luck.
    // v0.81: the entry button AND the offer anchor both wear it.
    expect(dyadJs.match(/className = 'btn btn-block btn-secondary'/g) || []).toHaveLength(2);
    const shell = readFileSync(join(__dirname, '..', 'ui', 'shell.css'), 'utf-8');
    expect(shell).toMatch(/\.btn-block\[hidden\] \{ display: none; \}/);
  });

  it('the entry control calls onOpen BEFORE the screen is revealed (v0.78: the host panel closes first)', () => {
    const seen = [];
    const h = harness('t5', { onOpen: () => seen.push(document.getElementById('dyad-screen').classList.contains('hidden')) });
    h.withDom(() => h.get('dyad-open-btn').listeners.click());
    // called exactly once, and the screen was still hidden at that moment —
    // so index.html's hook closes the host panel while the sheet is on screen
    expect(seen).toEqual([true]);
    expect(h.root.classList.contains('hidden')).toBe(false);
  });

  it('the entry control focuses the paired screen — the hand-off v0.78 depends on, now landing on the NAMED heading (audit B4)', () => {
    // close() parks focus on a cell index.html hides on the very next
    // statement, so this focus call is the only thing repairing it. The
    // v0.78 hand-off only required SOME focus call into the now-visible
    // screen; audit B4 moved the target from the unnamed section root to
    // its own top-level heading (matching every sibling screen), which is
    // a strict improvement — an AT user now hears "pair reading, heading
    // level 1" instead of silence — not a regression of the hand-off.
    const h = harness('t5');
    h.withDom(() => h.get('dyad-open-btn').listeners.click());
    expect(h.get('dyad-heading').focusCalls).toEqual([{ preventScroll: true }]);
    expect(h.root.focusCalls).toEqual([]);
  });

  it('onOpen fires only when the dyad will actually open — never below t5 (pr237 audit LOW-3)', () => {
    // hook-before-guard would close the host panel and hide #result while
    // open() refuses: every screen hidden.
    for (const tier of ['free', 't1', 't2', 't3']) {
      const seen = [];
      const h = harness(tier, { onOpen: () => seen.push(tier) });
      h.withDom(() => h.get('dyad-open-btn').listeners.click());
      expect(seen, tier).toEqual([]);
      expect(h.root.classList.contains('hidden'), tier).toBe(true);
    }
  });

  it('the back control calls onExit exactly once, with the screen already hidden (pr237 audit MED-3)', () => {
    // without the call, back leaves every screen hidden — a blank app
    const seen = [];
    const h = harness('t5', { onExit: () => seen.push(h.root.classList.contains('hidden')) });
    h.withDom(() => { openDyad(); h.get('dyad-back').listeners.click(); });
    expect(seen).toEqual([true]);
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

  it('the spine reuses the corrected direction fact — no separate ⇄ glyph to disagree with it (audit A1)', () => {
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    const h = harness('t5');
    h.withDom(() => submitSecond());
    // The accordion summary's compact head is bound to elementDirectionAB
    // directly — DYAD_RELATION_NODES maps 'dyad-spine-element' to that
    // field, not to a separate terse/undirected glyph field, so it is
    // mechanically impossible for the summary and the evidence beneath it
    // to name different directions.
    expect(h.get('dyad-spine-element').textContent).toBe(relation.elementDirectionAB);
    expect(relation.numerologySpine).toMatch(/^\d+ \+ \d+ → \d+$/);
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

  it('the standalone sheets release the .card 5/8 ratio box (2026-08-31 layout audit)', () => {
    // The two dyad sheets inherit .card's aspect-ratio while their content
    // runs ~300-400px past it; the embedded-WebView family the flip-stage
    // field defect came from is not trusted to grow ratio boxes, so the
    // box is released explicitly — same posture as ui/labels.js's stage
    // rules, scoped by the data attribute so the host card face (the
    // flip-stage rules' job) is untouched. Delta-audit hardening: scan the
    // COMMENT-STRIPPED source (a commented-out rule rode the raw scan
    // green), and demand the rule at the top level of the stylesheet —
    // stripping every at-rule block first, so wrapping it in a
    // never-matching @media/@layer/@supports cannot satisfy the pin.
    let topLevel = dyadCode;
    for (let at = topLevel.indexOf('@media'); at !== -1; at = topLevel.indexOf('@media')) {
      const open = topLevel.indexOf('{', at);
      let depth = 0, end = -1;
      for (let i = open; i < topLevel.length; i++) {
        if (topLevel[i] === '{') depth++;
        else if (topLevel[i] === '}' && --depth === 0) { end = i; break; }
      }
      if (open === -1 || end === -1) break;
      topLevel = topLevel.slice(0, at) + topLevel.slice(end + 1);
    }
    // any scoping at-rule shape (@layer, @supports, @container) is banned
    // outright in the dyad stylesheet rather than stripped around
    // (@keyframes defines an animation, it scopes nothing):
    expect((topLevel.match(/@[a-z-]+/g) || []).filter(t => !['@media', '@keyframes'].includes(t)))
      .toEqual([]);
    expect(topLevel).toMatch(/#dyad-screen \[data-sheet-face\] \{\s*aspect-ratio:\s*auto;\s*\}/);
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
    expect(builtTitles).toHaveLength(9);
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
  });

  it('the in-screen placeholder CTA is deleted, not merely hidden (pr216 audit NIT 13)', () => {
    // A permanently inert CTA waiting in shipped markup is the R6 shape.
    expect(dyadJs).not.toMatch(/dyad-cta/);
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
    expect(markup).toContain('dyad-city-status');
    expect(markup).toContain('dyad-polar-message');
  });

  it('the city input is described by dyad-city-status ONLY — not unconditionally by the static hidden polar notice', () => {
    // W3C accessible-description semantics: a hidden node named by
    // aria-describedby is still INCLUDED in the computed description, so
    // wiring dyad-polar-message into aria-describedby would tell every
    // nonpolar reader "rising unavailable at this latitude" on every visit,
    // even while the <p> itself stays visually hidden. dyad-city-status
    // alone carries the description; the polar notice stays a live region
    // (role=status/aria-live=polite/aria-atomic=true) that announces on its
    // own when citysearch.js's selectCity() reveals it — announced OR
    // programmatically associated, never both, and never while empty/hidden.
    expect(dyadJs).toMatch(
      /id="dyad-city-input"[^>]*aria-describedby="dyad-city-status">/,
    );
    // The negative pin: this exact malformed shape (both ids on one
    // aria-describedby) must never reappear — this is the regression this
    // correction fixes, and the mutation target a no-match-only assertion
    // above cannot catch on its own.
    expect(dyadJs).not.toMatch(/aria-describedby="dyad-city-status dyad-polar-message"/);
    expect(dyadJs).not.toMatch(/aria-describedby="[^"]*dyad-polar-message/);
    expect(dyadJs).toMatch(
      /<p class="city-status" id="dyad-city-status" role="status" aria-live="polite" aria-atomic="true" hidden><\/p>/,
    );
    expect(dyadJs).toMatch(
      /<p class="polar-message" id="dyad-polar-message" role="status" aria-live="polite" aria-atomic="true" hidden>/,
    );
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

// ── class-parity differential: host markup vs buildSheetMarkup ────────────
//
// The pr208 F9 defect class (fixed in PR #218): the same logical prose line
// rendered with a DIFFERENT register class on the host card face than on the
// dyad sheets (card-note vs card-habit), so the two surfaces typeset the
// same value differently. The fix was pinned with parallel SOURCE REGEXES
// over the two renderers — dodgeable independently, and blind to any future
// line the pin never named. The pr218 artifact recorded that gap ("the
// parity claim rests on two source regexes"); this differential closes it
// the same way the bounded value differential above works: derive BOTH
// sides from the real artifacts at runtime — the host's shipped index.html
// markup and the nodes the real initPublicUI builder appends,
// against the real buildSheetMarkup() output — and compare, never restating
// either side's expected classes in the test.
describe('dyad surface — class-parity differential: host markup vs buildSheetMarkup (pr218 F4 fast-follow)', () => {
  // Every class on these nodes that any stylesheet keys presentation off.
  // Host-only LOOKUP hooks (ids) are excluded — the sheet addresses the
  // same nodes by data attributes instead.
  const REGISTER = ['catalog', 'card-name', 'card-type', 'card-habit', 'card-note',
    'public-bridge', 'card-entry', 'public-read',
    'card', 'seal-hatch', 'public-title'];
  const reg = list => list.filter(c => REGISTER.includes(c)).sort();

  const sheetMarkup = buildSheetMarkup('x');
  const sheetClassOf = attr => {
    const m = sheetMarkup.match(new RegExp(`class="([^"]*)"[^>]*data-sheet-${attr}="x"`));
    return m ? m[1].split(/\s+/) : null;
  };
  const hostClassOfId = id => {
    const m = html.match(new RegExp(`class="([^"]*)"\\s+id="${id}"`));
    return m ? m[1].split(/\s+/) : null;
  };

  // Drive the REAL host node builders under a capture document. Both are
  // re-inited to an empty surface afterwards so no later render in this file
  // can reach the capture mocks.
  function captureBridgeHost() {
    const prior = globalThis.document;
    globalThis.document = {
      getElementById: () => null,
      head: { appendChild() {} },
      createElement: tag => makeNode(tag),
    };
    try {
      const appended = [];
      initPublicUI({ root: { appendChild: n => appended.push(n), querySelector: () => null } });
      // Source attribution adds other native nodes; bridge identity, not
      // append position, is the class-parity contract this capture tests.
      return appended.find(node => node.className.split(/\s+/).includes('public-bridge'));
    } finally {
      initPublicUI(null);
      globalThis.document = prior;
    }
  }

  const bridgeHost = captureBridgeHost();

  // First tokens of every prose-register class attribute in a markup slice,
  // in document order — the shape that catches two lines SWAPPING registers
  // even when the per-field sets still balance out.
  const proseSeq = slice =>
    [...slice.matchAll(/class="((?:card-habit|card-note)[^"]*)"/g)].map(m => m[1].split(/\s+/)[0]);
  const slice = (source, from, to) => {
    const a = source.indexOf(from);
    const b = to ? source.indexOf(to) : source.length;
    expect(a, from).toBeGreaterThan(-1);
    if (to) expect(b, to).toBeGreaterThan(a);
    return source.slice(a, to ? b : undefined);
  };

  it('every shared value node carries the same register classes on both surfaces', () => {
    // A dropped runtime append (or a builder that stopped returning nodes)
    // must read as a clean assertion, not a raw TypeError (pr222 audit NIT).
    expect(bridgeHost, 'initPublicUI appended no bridge node').toBeTruthy();
    const PAIRS = [
      // [sheet data attr, host classes]
      ['catalog', hostClassOfId('card-catalog')],
      ['name', hostClassOfId('card-name')],
      ['type', hostClassOfId('card-type')],
      ['habit', hostClassOfId('card-habit')],
      ['note', hostClassOfId('card-note')],
      ['families', hostClassOfId('public-families')],
      ['antifit', hostClassOfId('public-antifit')],
      ['roleline', hostClassOfId('public-roleline')],
      ['face', hostClassOfId('card-face')],
      ['entry', hostClassOfId('card-entry')],
      ['public', hostClassOfId('public-read')],
      ['public-bridge', bridgeHost.className.split(/\s+/)],
    ];
    for (const [attr, hostClasses] of PAIRS) {
      const sheetClasses = sheetClassOf(attr);
      // "missing" here also covers a purely cosmetic attribute reorder —
      // the parsers assume class precedes the hook attribute and fail
      // CLOSED on any other shape (pr222 audit, probed in both directions).
      expect(sheetClasses, `sheet node data-sheet-${attr} missing or attribute-reordered`).not.toBeNull();
      expect(hostClasses, `host counterpart of ${attr} missing or attribute-reordered`).not.toBeNull();
      const hostReg = reg(hostClasses);
      // Non-vacuous: a field whose register set filtered to nothing would
      // "agree" no matter what the sheet renders.
      expect(hostReg.length, `${attr}: host register set is empty`).toBeGreaterThan(0);
      expect(reg(sheetClasses), attr).toEqual(hostReg);
    }
  });

  it('the prose lines of each block keep the same register ORDER on both surfaces', () => {
    // Entry block: host static markup vs the sheet's entry slice.
    expect(proseSeq(slice(sheetMarkup, 'data-sheet-entry="x"', 'data-sheet-public="x"')))
      .toEqual(proseSeq(slice(html, 'id="card-entry"', 'id="public-read"')));
    // Public block: the host's static three lines plus the bridge node the
    // real builder appends at runtime.
    expect(proseSeq(slice(sheetMarkup, 'data-sheet-public="x"')))
      .toEqual([
        ...proseSeq(slice(html, 'id="public-read"', '</article>')),
        bridgeHost.className.split(/\s+/)[0],
      ]);
  });

  it('the structural classes the stylesheets key on appear equally on both surfaces', () => {
    // pr222 audit (both lanes, independently): five presentation-bearing
    // shared classes rode the full suite green when drifted on the sheet
    // side only — public-title (the labels-reveal visibility
    // toggle in shell.css keys on the literal class, so a sheet-side rename
    // leaves the dyad's "DOMAIN FIT"/"KUA" titles permanently hidden),
    // card-prose-rule, coord-val and coord-seal. None carries an id or a
    // data attribute, so the per-field table above cannot reach them; count
    // parity over the combined runtime host surface can. The host side is
    // the shipped card face plus the two runtime-appended blocks — the same
    // sources the field table uses.
    const hostCombined = slice(html, 'id="card-face"', '</article>')
      + ` class="${bridgeHost.className}"`;
    const count = (source, cls) =>
      [...source.matchAll(/class="([^"]*)"/g)]
        .filter(m => m[1].split(/\s+/).includes(cls)).length;
    for (const cls of ['public-title', 'entry-title', 'coord-group', 'coord-group-title', 'card-prose-rule', 'coord-val', 'coord-seal']) {
      const hostCount = count(hostCombined, cls);
      expect(hostCount, `${cls}: absent from the host surface — scan vacuous`).toBeGreaterThan(0);
      expect(count(sheetMarkup, cls), cls).toBe(hostCount);
    }
    // And the two section titles say the same thing on both surfaces —
    // label text is part of the shared structure, not a per-person value.
    for (const [cls, hostSource] of [
      ['public-title', html],
      ['entry-title', html],
      ['coord-group-title', html],
    ]) {
      const label = source => {
        const m = source.match(new RegExp(`class="${cls}"[^>]*>([^<]*)<`));
        return m ? m[1] : null;
      };
      expect(label(sheetMarkup), `${cls} label`).not.toBeNull();
      expect(label(sheetMarkup), `${cls} label`).toBe(label(hostSource));
    }
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

// ── the birthplace field's real citysearch wiring: recovery copy, retry,
//    keyboard selection, and the unselected/replaced-city privacy guard ──
//
// Pair Imprint remediation, Part C: dyad-city-status is a new, initially
// hidden status node — the SOLE aria-describedby target of dyad-city-input
// (the polar notice is deliberately left OFF that list per the correction
// above: a hidden node is still part of the computed accessible description,
// so unconditionally referencing it would announce "rising unavailable" to
// every nonpolar reader) — that ui/citysearch.js already knows how to drive.
// This exercises the REAL wiring (initCitySearchUI, searchCities mocked at
// the module boundary only), never a stub of the value under test.
describe('dyad surface — birthplace field: recovery, retry, and keyboard selection (real citysearch wiring)', () => {
  const CITY = { name: 'Accra', country: 'Ghana', countryCode: 'GH', lat: 5.6, lng: -0.19, tz: 'Africa/Accra' };
  const OTHER_CITY = { name: 'Odense', country: 'Denmark', countryCode: 'DK', lat: 55.4, lng: 10.4, tz: 'Europe/Copenhagen' };

  // The document swap stays installed for the WHOLE async sequence (the
  // proven shape the "city payload regression" describe block above already
  // uses) — a per-call swap-then-restore helper would restore the real
  // document before the debounced searchCities() continuation (which calls
  // document.createElement('li') from inside a timer callback) ever runs.
  async function typeAndSettle(inst, query) {
    const cityInput = inst.get('dyad-city-input');
    cityInput.value = query;
    cityInput.listeners.input();
    await vi.advanceTimersByTimeAsync(200); // > SEARCH_DEBOUNCE_MS
  }

  it('an empty result set shows no-match guidance on dyad-city-status, not the polar notice', async () => {
    searchCities.mockReset();
    searchCities.mockResolvedValue([]);
    const inst = harness('t5');
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      await typeAndSettle(inst, 'zz');
      const status = inst.get('dyad-city-status');
      expect(status.hidden).toBe(false);
      expect(status.textContent).toBe('no matching birthplace found · try another spelling or nearby city.');
      expect(inst.get('dyad-city-input').attrs['aria-expanded']).toBe('false');
      expect(inst.get('dyad-polar-message').hidden).toBe(true);
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
  });

  it('a rejected lookup surfaces retry guidance — transient vs exhausted copy, matching isCityLoadExhausted', async () => {
    const inst = harness('t5');
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      searchCities.mockReset();
      searchCities.mockRejectedValue(new Error('transient network blip'));
      await typeAndSettle(inst, 'ac');
      expect(inst.get('dyad-city-status').hidden).toBe(false);
      expect(inst.get('dyad-city-status').textContent)
        .toBe('birthplace lookup unavailable · type again to retry.');

      const exhausted = new Error('city dataset load attempts exhausted');
      exhausted.code = 'CITY_LOAD_EXHAUSTED';
      expect(isCityLoadExhausted(exhausted)).toBe(true);
      searchCities.mockReset();
      searchCities.mockRejectedValue(exhausted);
      await typeAndSettle(inst, 'ac2');
      expect(inst.get('dyad-city-status').textContent)
        .toBe('birthplace lookup unavailable · reload this page to try again.');
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
  });

  it('retyping after a rejection retries and can succeed — the status clears and suggestions render', async () => {
    const inst = harness('t5');
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      searchCities.mockReset();
      searchCities.mockRejectedValue(new Error('boom'));
      await typeAndSettle(inst, 'ac');
      expect(inst.get('dyad-city-status').hidden).toBe(false);

      searchCities.mockReset();
      searchCities.mockResolvedValue([CITY]);
      await typeAndSettle(inst, 'acc');
      expect(inst.get('dyad-city-status').hidden).toBe(true);
      expect(inst.get('dyad-city-status').textContent).toBe('');
      expect(inst.get('dyad-city-suggestions').children.length).toBe(1);
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
  });

  it('ArrowDown then Enter selects the active suggestion — aria-expanded/activedescendant track the real selection', async () => {
    searchCities.mockReset();
    searchCities.mockResolvedValue([CITY, OTHER_CITY]);
    let captured = null;
    const inst = harness('t5', { buildSecond: payload => { captured = payload; return B; } });
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      await typeAndSettle(inst, 'a place');
      const cityInput = inst.get('dyad-city-input');
      const suggestions = inst.get('dyad-city-suggestions');
      expect(suggestions.children.length).toBe(2);
      expect(cityInput.attrs['aria-expanded']).toBe('true');
      expect(cityInput.attrs['aria-activedescendant']).toBeUndefined();

      cityInput.listeners.keydown({ key: 'ArrowDown', preventDefault() {} });
      expect(cityInput.attrs['aria-activedescendant']).toBe(suggestions.children[0].id);
      expect(suggestions.children[0].attrs['aria-selected']).toBe('true');
      expect(suggestions.children[1].attrs['aria-selected']).toBe('false');

      cityInput.listeners.keydown({ key: 'Enter', preventDefault() {} });
      // A real selection: the listbox collapses, the field carries the
      // formatted label, and the SAME city reaches buildSecond's payload —
      // never a second, independently-typed source of truth.
      expect(cityInput.attrs['aria-expanded']).toBe('false');
      expect(cityInput.value).toBe('Accra, Ghana');
      expect(suggestions.children.length).toBe(0);

      inst.get('dyad-name-input').value = 'specimen b';
      inst.get('dyad-dob-input').value = '1988-06-15';
      submitSecond();
      expect(captured.city).toBe(CITY.name);
      expect(captured.cc).toBe(CITY.countryCode);
      expect(captured.tz).toBe(CITY.tz);
      expect(captured.lat).toBe(CITY.lat);
      expect(captured.lng).toBe(CITY.lng);
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
  });

  it('a typed-but-unselected location never silently reaches buildSecond — no city/cc/tz/lat/lng in the payload', async () => {
    searchCities.mockReset();
    searchCities.mockResolvedValue([CITY]);
    let captured = null;
    const inst = harness('t5', { buildSecond: payload => { captured = payload; return B; } });
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      // Typed, results rendered, but NEVER selected (no mousedown/Enter).
      await typeAndSettle(inst, 'ac');
      expect(inst.get('dyad-city-suggestions').children.length).toBe(1);

      inst.get('dyad-name-input').value = 'specimen b';
      inst.get('dyad-dob-input').value = '1988-06-15';
      submitSecond();
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
    expect(captured).not.toBeNull();
    expect(captured).not.toHaveProperty('city');
    expect(captured).not.toHaveProperty('cc');
    expect(captured).not.toHaveProperty('tz');
    expect(captured).not.toHaveProperty('lat');
    expect(captured).not.toHaveProperty('lng');
  });

  it('replacing a previously selected place by retyping also drops it — the stale selection cannot survive an edit', async () => {
    searchCities.mockReset();
    searchCities.mockResolvedValueOnce([CITY]).mockResolvedValueOnce([OTHER_CITY]);
    let captured = null;
    const inst = harness('t5', { buildSecond: payload => { captured = payload; return B; } });
    const outer = globalThis.document;
    globalThis.document = { getElementById: id => inst.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      const cityInput = inst.get('dyad-city-input');
      const suggestions = inst.get('dyad-city-suggestions');
      await typeAndSettle(inst, 'ac');
      suggestions.children[0].listeners.mousedown({ preventDefault() {} });
      expect(cityInput.value).toBe('Accra, Ghana');

      // Now retype over the selected label WITHOUT picking a new option —
      // onInput() must drop the stale selection immediately, not just once
      // a new one is chosen.
      await typeAndSettle(inst, 'od');
      expect(suggestions.children.length).toBe(1);

      inst.get('dyad-name-input').value = 'specimen b';
      inst.get('dyad-dob-input').value = '1988-06-15';
      submitSecond();
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }
    // Never Accra's fields, and never silently blended with the new query
    // either — a typed-but-unselected retype carries nothing.
    expect(captured).not.toHaveProperty('city');
    expect(captured).not.toHaveProperty('cc');
    expect(captured).not.toHaveProperty('tz');
    expect(captured).not.toHaveProperty('lat');
    expect(captured).not.toHaveProperty('lng');
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

  it('dyad.js documents that the entry predicate stays the single entitlement seam (R6)', () => {
    expect(dyadJs).toMatch(/entitlement-only \(PR #187 R6\)/);
  });
});

// ── paired sheet identification and derivation surface ───────────────────
// v0.89 retires the label preference bridge and makes row titles permanent.
// The existing thirty interactive compartments still use the shared meaning
// registry, each with the context and accessible name of its own sheet.
// open() blanks the typed entry (clearEntryFields), so a pair landed after an
// open() needs the entry typed again — the same values harness() seeds.
const entry = h => {
  h.get('dyad-name-input').value = 'specimen b';
  h.get('dyad-dob-input').value = '1988-06-15';
};
// B2 shares B's date and a DIFFERENT first name, so a head that named the
// wrong sheet's owner cannot pass by coincidence (A and B are both "specimen";
// the name is chosen not to be a substring of any screen copy).
const B2 = buildProfile('zelda b', '1988-06-15');
const nameA = A.firstName || 'a';
const nameB = B2.firstName || 'b';

describe('dyad surface — permanent labels without a live preference (v0.89)', () => {
  it('both generated sheets contain all nine named rows and no reveal control', () => {
    for (const prefix of ['a', 'b']) {
      const markup = buildSheetMarkup(prefix);
      const titles = [...markup.matchAll(/<div class="coord-title" data-sheet-title="([^"]+)">([^<]+)<\/div>/g)];
      expect(titles).toHaveLength(9);
      const actual = Object.fromEntries(titles.map(match => [match[1].split(':')[1], match[2]]));
      expect(actual).toEqual(ROW_TITLES);
      expect(markup).not.toMatch(/labels-toggle|labels-revealed|reveal labels|hide labels/);
      for (const match of titles) expect(match[1].startsWith(prefix + ':')).toBe(true);
    }
    expect(dyadCode).not.toMatch(/dyad-labels-toggle|onLabelsChange|applyDyadLabels/);
  });

  it.each([
    ['absent', null, false],
    ['stored false', 'false', false],
    ['stored true', 'true', false],
    ['denied', null, true],
  ])('open, render, compare and close ignore %s storage while both panels remain interactive', (_label, stored, denied) => {
    const prior = globalThis.localStorage;
    const getItem = vi.fn(() => {
      if (denied) throw new Error('denied');
      return stored;
    });
    const setItem = vi.fn(() => { if (denied) throw new Error('denied'); });
    globalThis.localStorage = { getItem, setItem };
    try {
      const h = harness('t5', { second: B2 });
      expect(h.withDom(() => openDyad())).toBe(true);
      entry(h);
      expect(h.withDom(() => submitSecond())).toBe(true);
      expect(h.get('dyad-labels-toggle')).toBeNull();
      for (const prefix of ['a', 'b']) {
        expect(h.face(prefix).classList.contains('labels-revealed')).toBe(false);
        for (const key of CELL_KEYS) {
          expect(h.cellRoot(prefix, key).attrs.role, prefix + ':' + key).toBe('button');
          expect(h.cellRoot(prefix, key).attrs['aria-label']).toContain(coordinateLabel(key));
        }
        const preventDefault = vi.fn();
        h.withDom(() => h.get('dyad-sheets').listeners.keydown({
          key: 'Enter', target: h.cellRoot(prefix, 'moon'), preventDefault,
        }));
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(true);
        expect(h.get('dyad-meaning-head').textContent).toBe('moon · ' + (prefix === 'a' ? nameA : nameB));
        expect(h.get('dyad-meaning-title').textContent).toBe('not resolved');
        expect(h.cellRoot(prefix, 'moon').attrs['aria-expanded']).toBe('true');
      }
      expect(h.withDom(() => compareAnother())).toBe(true);
      expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(false);
      entry(h);
      expect(h.withDom(() => submitSecond())).toBe(true);
      h.withDom(() => closeDyad());
      expect(h.root.classList.contains('hidden')).toBe(true);
      expect(getItem).not.toHaveBeenCalled();
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      if (prior === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = prior;
    }
  });

  it('the paired controller no longer imports preference helpers or touches storage', () => {
    expect(dyadCode).not.toMatch(/from ['"]\.\/labels\.js['"]|isLabelsRevealed|setLabelsRevealed|localStorage|eight_ball_/);
  });
});

describe('dyad surface — v0.76: every paired compartment opens the paired panel', () => {
  const rendered = () => {
    const h = harness('t5', { second: B2 });
    h.withDom(() => { openDyad(); });
    entry(h);
    expect(h.withDom(() => submitSecond())).toBe(true);
    return h;
  };
  const tap = (h, prefix, key) => {
    h.withDom(() => h.get('dyad-sheets').listeners.click({ target: h.cellRoot(prefix, key) }));
    return h.get('dyad-meaning-panel').classList.contains('open');
  };

  it('marks all thirty cells interactive by attribute — role, controls, key, side — and never by id', () => {
    const h = harness('t5');
    for (const prefix of ['a', 'b']) {
      for (const key of CELL_KEYS) {
        const root = h.cellRoot(prefix, key);
        expect(root.classList.contains('has-detail'), `${prefix}:${key}`).toBe(true);
        expect(root.attrs.role).toBe('button');
        expect(root.attrs.tabindex).toBe('0');
        expect(root.attrs['aria-expanded']).toBe('false');
        expect(root.attrs['aria-controls']).toBe('dyad-meaning-panel');
        // item 3: a real, side/owner/coordinate/value-bearing name, never
        // the old generic "<coordinate> details" repeated across all 30
        // cells — see the dedicated describe block below for the full
        // dynamic-update proof (fill, value, sealed/unresolved, teardown).
        expect(root.attrs['aria-label']).toContain(coordinateLabel(key));
        expect(root.attrs['aria-label']).not.toBe(`${coordinateLabel(key)} details`);
        expect(root.attrs['data-coordinate-key']).toBe(key);
        expect(root.attrs['data-sheet-side']).toBe(prefix);
        expect(root.attrs.id).toBeUndefined();
      }
    }
    expect(h.get('dyad-meaning-panel').attrs['aria-hidden']).toBe('true');
    expect(h.get('dyad-meaning-panel').inert).toBe(true);
  });

  it('a tap on sheet B reads B\'s value in B\'s context, with the head naming B and the v0.74 derivation line', () => {
    expect(nameA).not.toBe(nameB);
    const h = rendered();
    expect(tap(h, 'b', 'sun')).toBe(true);
    const values = {};
    for (const key of CELL_KEYS) values[key] = h.cell('b', key).textContent;
    const expected = panelDetailFor('sun', values.sun, () => values);
    expect(h.get('dyad-meaning-head').textContent).toBe(`sun · ${nameB}`);
    expect(h.get('dyad-meaning-derivation').textContent).toBe(derivationText('sun'));
    expect(h.get('dyad-meaning-title').textContent).toBe(expected.title);
    expect(h.get('dyad-meaning-body').textContent).toBe(expected.body);
    expect(h.get('dyad-meaning-context').textContent).toBe(expected.context);
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(true);
    expect(h.get('dyad-meaning-panel').attrs['aria-hidden']).toBe('false');
    expect(h.cellRoot('b', 'sun').classList.contains('active')).toBe(true);
    expect(h.cellRoot('b', 'sun').attrs['aria-expanded']).toBe('true');
    expect(h.get('dyad-meaning-hint').hidden).toBe(true);
    // B's sun is not A's sun: the panel reads the tapped sheet, not the host
    expect(A.sunSign).not.toBe(B2.sunSign);
    expect(h.get('dyad-meaning-title').textContent).not.toBe(panelDetailFor('sun', A.sunSign, () => values).title);
  });

  it('the same coordinate on the two sheets reads differently — each in its own context', () => {
    const h = rendered();
    tap(h, 'a', 'lifePath');
    const a = { head: h.get('dyad-meaning-head').textContent, ctx: h.get('dyad-meaning-context').textContent };
    tap(h, 'b', 'lifePath');
    const b = { head: h.get('dyad-meaning-head').textContent, ctx: h.get('dyad-meaning-context').textContent };
    expect(a.head).toBe(`life path · ${nameA}`);
    expect(b.head).toBe(`life path · ${nameB}`);
    expect(h.cellRoot('a', 'lifePath').classList.contains('active')).toBe(false);
    expect(h.cellRoot('b', 'lifePath').classList.contains('active')).toBe(true);
    const valuesA = {}; const valuesB = {};
    for (const key of CELL_KEYS) { valuesA[key] = h.cell('a', key).textContent; valuesB[key] = h.cell('b', key).textContent; }
    expect(a.ctx).toBe(panelDetailFor('lifePath', valuesA.lifePath, () => valuesA).context);
    expect(b.ctx).toBe(panelDetailFor('lifePath', valuesB.lifePath, () => valuesB).context);
  });

  it('every one of the thirty compartments opens with a title, a body and the derivation line', () => {
    const h = rendered();
    for (const prefix of ['a', 'b']) {
      for (const key of CELL_KEYS) {
        h.withDom(() => closePairedPanel());
        expect(tap(h, prefix, key), `${prefix}:${key}`).toBe(true);
        expect(h.get('dyad-meaning-title').textContent.length, `${prefix}:${key}`).toBeGreaterThan(0);
        expect(h.get('dyad-meaning-body').textContent.length, `${prefix}:${key}`).toBeGreaterThan(0);
        expect(h.get('dyad-meaning-derivation').textContent, `${prefix}:${key}`).toBe(derivationText(key));
      }
    }
  });

  it('an unresolved cell opens the unresolved copy, never a filed meaning', () => {
    // A and B carry no birth time: rising, moon and the hour pillar are dashes
    const h = rendered();
    expect(h.cell('a', 'rising').textContent).toBe('—');
    tap(h, 'a', 'rising');
    expect(h.get('dyad-meaning-title').textContent).toBe('not resolved');
    expect(h.get('dyad-meaning-context-head').hidden).toBe(true);
  });

  it('a second tap on the active cell closes; Enter and Space open; close button and Escape close', () => {
    const h = rendered();
    tap(h, 'a', 'arcana');
    expect(tap(h, 'a', 'arcana')).toBe(false);
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(false);
    expect(h.get('dyad-meaning-panel').inert).toBe(true);
    expect(h.cellRoot('a', 'arcana').attrs['aria-expanded']).toBe('false');
    let prevented = 0;
    h.withDom(() => h.get('dyad-sheets').listeners.keydown({ key: 'Enter', target: h.cellRoot('b', 'element'), preventDefault: () => { prevented++; } }));
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(true);
    expect(prevented).toBe(1);
    h.withDom(() => h.get('dyad-meaning-close').listeners.click());
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(false);
    h.withDom(() => h.get('dyad-sheets').listeners.keydown({ key: ' ', target: h.cellRoot('a', 'animal'), preventDefault: () => {} }));
    expect(h.get('dyad-meaning-head').textContent).toBe(`public animal · ${nameA}`);
    // a keydown that is not Enter/Space, or not on a cell, is ignored
    h.withDom(() => h.get('dyad-sheets').listeners.keydown({ key: 'a', target: h.cellRoot('a', 'moon'), preventDefault: () => {} }));
    expect(h.get('dyad-meaning-head').textContent).toBe(`public animal · ${nameA}`);
    h.withDom(() => h.get('dyad-sheets').listeners.click({ target: { closest: () => null } }));
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(true);
  });

  it('clearOutput — a close, a resubmission, an invalid entry — closes the panel and restores the hint', () => {
    const h = rendered();
    tap(h, 'b', 'maturity');
    h.withDom(() => closeDyad());
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(false);
    expect(h.get('dyad-meaning-hint').hidden).toBe(false);
    expect(h.cellRoot('b', 'maturity').classList.contains('active')).toBe(false);
    // the head is not blanked by clear (it is inert and hidden), but a fresh
    // open cannot show a stale owner: names are dropped with the pair
    h.withDom(() => { openDyad(); });
    h.get('dyad-name-input').value = 'zelda b'; h.get('dyad-dob-input').value = '1988-06-15';
    h.withDom(() => submitSecond());
    tap(h, 'a', 'sun');
    expect(h.get('dyad-meaning-head').textContent).toBe(`sun · ${nameA}`);
  });

  it('a close BLANKS the panel — person B\'s name and reading do not outlive a close, a re-open or a fresh pair (pr235 audit HIGH, both lanes)', () => {
    const h = rendered();
    tap(h, 'b', 'dayPillar');
    expect(h.get('dyad-meaning-head').textContent).toBe(`day pillar · ${nameB}`);
    expect(h.get('dyad-meaning-body').textContent.length).toBeGreaterThan(0);
    h.withDom(() => closeDyad());
    for (const id of ['dyad-meaning-head', 'dyad-meaning-derivation', 'dyad-meaning-title', 'dyad-meaning-body', 'dyad-meaning-context', 'dyad-meaning-relation']) {
      expect(h.get(id).textContent, id).toBe('');
    }
    for (const id of ['dyad-meaning-context-head', 'dyad-meaning-relation-head']) {
      expect(h.get(id).textContent, id).toBe('');
      expect(h.get(id).hidden, id).toBe(true);
    }
    // the panel's own nodes; the sheet label (dyad-head-b) legitimately names
    // whoever the CURRENT second person is (the harness's buildSecond is fixed)
    const carriers = () => [...h.byId.entries()]
      .filter(([k, n]) => k.startsWith('dyad-meaning') && String(n.textContent || '').includes(nameB)).map(([k]) => k);
    expect(carriers()).toEqual([]);
    // a fresh pair with a third person: still nothing until a tap
    h.withDom(() => { openDyad(); });
    h.get('dyad-name-input').value = 'third c'; h.get('dyad-dob-input').value = '1995-03-03';
    h.withDom(() => submitSecond());
    expect(h.get('dyad-meaning-head').textContent).toBe('');
    expect(carriers()).toEqual([]);
    // the close control blanks too — on a timer now, so the collapse can run
    // (pr236 audit HIGH-1); the teardown path above blanks immediately
    tap(h, 'a', 'sun');
    vi.useFakeTimers();
    try {
      // the timer must be advanced INSIDE withDom: the deferred callback
      // resolves its nodes through document.getElementById, so firing it
      // outside the mocked document blanks nothing
      h.withDom(() => {
        h.get('dyad-meaning-close').listeners.click();
        expect(h.get('dyad-meaning-title').textContent, 'blanked mid-collapse').not.toBe('');
        vi.advanceTimersByTime(320);
      });
      expect(h.get('dyad-meaning-title').textContent).toBe('');
    } finally { vi.useRealTimers(); }
  });

  it('the paired blank waits out the collapse, and a reopen inside the window cancels the pending timer (pr236 audit HIGH-1)', () => {
    const h = rendered();
    vi.useFakeTimers();
    try {
      h.withDom(() => {
        const title = () => h.get('dyad-meaning-title').textContent;
        h.get('dyad-sheets').listeners.click({ target: h.cellRoot('b', 'element') });
        const first = title();
        expect(first.length).toBeGreaterThan(0);
        h.get('dyad-meaning-close').listeners.click();
        vi.advanceTimersByTime(280);
        expect(title(), 'blanked mid-collapse').toBe(first);
        // reopen a DIFFERENT cell inside the window; the stale timer must not
        // fire over the new reading
        vi.advanceTimersByTime(10);
        h.get('dyad-sheets').listeners.click({ target: h.cellRoot('a', 'arcana') });
        const second = title();
        expect(second.length).toBeGreaterThan(0);
        vi.advanceTimersByTime(400);
        expect(title(), 'a pending blank wiped a reopened paired panel').toBe(second);
      });
    } finally { vi.useRealTimers(); }
  });

  it('Escape closes the paired panel through a capture-phase document listener, returns focus to the cell, and yields to an open modal (pr235 audit)', () => {
    const h = rendered();
    expect(h.docListeners.keydown).toBeTruthy();
    expect(h.docListeners.keydown.capture).toBe(true);
    tap(h, 'b', 'element');
    const cell = h.cellRoot('b', 'element');
    // a modal is open: the panel stays, the modal keeps priority
    h.escape(true);
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(true);
    // no modal: closes, focus returns to the toggler cell without scrolling
    h.escape(false);
    expect(h.get('dyad-meaning-panel').classList.contains('open')).toBe(false);
    expect(h.get('dyad-meaning-panel').inert).toBe(true);
    expect(cell.focusCalls).toEqual([{ preventScroll: true }]);
    expect(cell.attrs['aria-expanded']).toBe('false');
    // nothing active: Escape is a no-op (no focus call, no error)
    h.escape(false);
    expect(cell.focusCalls).toHaveLength(1);
  });

  it('the document listener is bound once per document — a re-entered init on the same document does not stack it', () => {
    const h = harness('t5');
    expect(h.docListeners.keydown).toBeTruthy();
    let count = 0;
    h.withDom(() => {
      const doc = globalThis.document;
      doc.addEventListener = () => { count++; };
      // first init on THIS document binds; a second on the same document does not
      initDyadUI({ stage: makeNode(), controls: makeNode() }, { getProfile: () => A, getTier: () => 't5' });
      initDyadUI({ stage: makeNode(), controls: makeNode() }, { getProfile: () => A, getTier: () => 't5' });
    });
    expect(count).toBe(1);
  });

  it('the strip is the ONLY listener host — a re-render detaches nothing', () => {
    expect(dyadJs).toMatch(/strip\.addEventListener\('click'/);
    expect(dyadJs).toMatch(/strip\.addEventListener\('keydown'/);
    expect(dyadJs).not.toMatch(/cell\.addEventListener/);
  });

  it('the paired panel reuses the host panel\'s parts, classes and pure content path — no second registry, no second markup', () => {
    // the named imports, not the literal line — the list grew when the panel
    // part contract moved to ui/meanings.js (pr235 follow-up)
    const named = (dyadJs.match(/import \{([^}]*)\} from '\.\/meanings\.js'/) || [, ''])[1]
      .split(',').map(s => s.trim()).filter(Boolean);
    for (const name of ['panelDetailFor', 'buildPanelMarkup', 'coordinateLabel']) {
      expect(named, name).toContain(name);
    }
    expect(dyadJs).toMatch(/buildPanelMarkup\('dyad-meaning'\)/);
    expect(dyadJs).not.toMatch(/meanings\.v\d|ARCANA_MEANINGS|entryFor|harmonyFor/);
    expect(dyadJs).toMatch(/derivationText\(key\)/);
    // Permanent row labels need no host-to-Pair preference bridge.
    const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');
    expect(html).not.toMatch(/onLabelsChange|applyLabelsState/);
  });
});

// ── v0.90: the Pair is the t5 product — the unentitled boot is Pair-dark ──
//
// Both pr247 audit lanes: every Pair test boots `getTier: () => 't5'`, so a
// resolver that answered t5 for everyone would pass them all. These pin the
// other side: on a t3 device the dyad screen stays hidden, every entry
// refuses, the relation record is null, and the host does not even
// initialise the Pair share controller until the entitlement has settled
// at t5.
describe('dyad surface — v0.90: the unentitled (t3) boot is Pair-dark', () => {
  it('open(), render() and compareAnother() all refuse at t3; the screen root stays hidden; currentRelation() is null', () => {
    const h = harness('t3');
    h.withDom(() => {
      expect(openDyad()).toBe(false);
      expect(h.root.classList.contains('hidden')).toBe(true);
      expect(isDyadOpen()).toBe(false);
      expect(compareAnother()).toBe(false);
      expect(currentRelation()).toBeNull();
      // the harness's fake nodes do not model the injected `hidden` attribute;
      // the root's `hidden` class above is the gate's observable, and the
      // relation node carrying no text is the render's.
      expect(h.byId.get('dyad-relation').textContent).toBe('');
    });
  });

  it('at t3 the entry control is hidden and the configured offer is the only dyad control on the rail', () => {
    const h = harness('t3');
    h.withDom(() => syncDyadEntry('t3', 'https://example.test/l/dyad'));
    expect(h.byId.get('dyad-open-btn').hidden).toBe(true);
    const offer = h.byId.get('dyad-offer-link');
    expect(offer.hidden).toBe(false);
    expect(offer.getAttribute('href')).toBe('https://example.test/l/dyad');
  });

  it('index.html initialises the Pair share controller only inside boot(), after the entitlement has settled, and only at t5', () => {
    const html = readFileSync(join(REPO_ROOT, 'index.html'), 'utf-8');
    // exactly one call, and it sits after resolveDyadEntitlement inside boot()
    expect(html.match(/initPairShareUI\(/g)).toHaveLength(1);
    const boot = html.slice(html.indexOf('async function boot()'));
    expect(boot).toMatch(/resolveDyadEntitlement\([\s\S]*?if \(getRenderTier\(\) === 't5'\) \{[\s\S]{0,400}initPairShareUI\(/);
    expect(html.slice(0, html.indexOf('async function boot()'))).not.toMatch(/initPairShareUI\(/);
  });
});

// ── Pair Dossier hierarchy (DOCTRINE §1.J v0.83) ─────────────────────────

describe('Pair Dossier — heading, scope, and the compact pair signature', () => {
  it('the pair reading heading and scope line are on screen', () => {
    expect(dyadJs).toMatch(/pair reading/);
    expect(dyadJs).toMatch(/three structural relations\. no compatibility score or prediction\./);
  });

  it('the signature reads the same three fields the evidence below expands, before the two sheets', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    expect(h.get('dyad-signature-element').textContent).toBe(relation.elementDirectionAB);
    expect(h.get('dyad-signature-numerology').textContent).toBe(relation.numerologySpine);
    expect(h.get('dyad-signature-cardpair').textContent).toBe(relation.cardPairHead);
    expect(h.get('dyad-signature').hidden).toBe(false);
  });

  it('the signature starts hidden in the static markup (pre-JS default)', () => {
    expect(dyadJs).toMatch(/id="dyad-signature"[^>]*\bhidden\b/);
  });

  it('the signature is explicitly hidden by the same clear path everything else in the F1 enumeration uses', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-signature').hidden).toBe(false);
    h.withDom(() => closeDyad());
    expect(h.get('dyad-signature').hidden).toBe(true);
  });
});

describe('Pair Dossier — direction-explicit element cycle (audit A1: correct for every kind)', () => {
  // A(specimen a)=earth, B(specimen b)=metal for the shipped fixture pair —
  // SHENG[earth]==='metal', so aToB.kind is already 'sheng' (active) and the
  // arrow direction happens to be unchanged by the fix; the label suffix is
  // the new, previously-missing part.
  it('the fixture pair (an active/sheng case): forward carries the register label, backward mirrors it', () => {
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    const { a, b } = reading.relation.element;
    expect(relation.elementDirectionAB).toBe(`A · ${a.element} → B · ${b.element} · generating`);
    expect(relation.elementDirectionBA).toBe(`B · ${b.element} ← A · ${a.element} · generating`);
  });

  it('both direction heads land in the DOM, each immediately before its own authored body', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    expect(h.get('dyad-element-direction-ab').textContent).toBe(relation.elementDirectionAB);
    expect(h.get('dyad-element-ab').textContent).toBe(relation.elementAB);
    expect(h.get('dyad-element-direction-ba').textContent).toBe(relation.elementDirectionBA);
    expect(h.get('dyad-element-ba').textContent).toBe(relation.elementBA);
  });

  // elementCycleFacts() is a pure function of the SAME `element` shape
  // core/dyad.js's buildDyadReading() produces (`{a,b,aToB,bToA}`), built
  // here from core/dyad.js's own real elementDirection() over hand-chosen
  // elements — never a fabricated shape — so every one of the five kinds
  // elementRelationKind() can return is exercised directly, plus the
  // "swapped ordered pair" case the audit names (the same two elements,
  // A/B reversed, must describe the SAME physical generator/controller).
  const relationOf = (aEl, bEl) => ({
    a: { element: aEl }, b: { element: bEl },
    aToB: elementDirection(aEl, bEl), bToA: elementDirection(bEl, aEl),
  });

  it('same (identical elements): nondirectional, no arrow, no register label', () => {
    const facts = elementCycleFacts(relationOf('wood', 'wood'));
    expect(facts.directional).toBe(false);
    expect(facts.forward).toBe('A · wood = B · wood');
    expect(facts.backward).toBe('B · wood = A · wood');
    expect(facts.forward).not.toMatch(/[→←⇄]/);
  });

  it('sheng (A active — A generates B): arrow A→B, "generating"', () => {
    // wood generates fire (the sheng cycle).
    const facts = elementCycleFacts(relationOf('wood', 'fire'));
    expect(facts.directional).toBe(true);
    expect(facts.forward).toBe('A · wood → B · fire · generating');
    expect(facts.backward).toBe('B · fire ← A · wood · generating');
  });

  it('sheng_by (A passive — A generated by B): arrow reverses to B→A, still "generating" (never the passive label) — the exact audited defect', () => {
    // Same physical fact as above with A/B swapped: wood (now B) generates
    // fire (now A). The audited bug rendered this as `wood → water ·
    // generated by` for an analogous pair — an arrow pointing the WRONG
    // way paired with a passive label. The fix must draw B→A here, not
    // A→B, and must never surface the "generated by" passive label.
    const facts = elementCycleFacts(relationOf('fire', 'wood'));
    expect(facts.directional).toBe(true);
    expect(facts.forward).toBe('B · wood → A · fire · generating');
    expect(facts.forward).not.toContain('generated by');
    expect(facts.forward).not.toMatch(/^A · fire →/); // the audited-wrong direction
  });

  it('ke (A active — A controls B): arrow A→B, "controlling"', () => {
    // wood controls earth (the ke cycle).
    const facts = elementCycleFacts(relationOf('wood', 'earth'));
    expect(facts.directional).toBe(true);
    expect(facts.forward).toBe('A · wood → B · earth · controlling');
    expect(facts.backward).toBe('B · earth ← A · wood · controlling');
  });

  it('ke_by (A passive — A controlled by B): arrow reverses to B→A, still "controlling" (never the passive label)', () => {
    // Same physical fact as above with A/B swapped: wood (now B) controls
    // earth (now A).
    const facts = elementCycleFacts(relationOf('earth', 'wood'));
    expect(facts.directional).toBe(true);
    expect(facts.forward).toBe('B · wood → A · earth · controlling');
    expect(facts.forward).not.toContain('controlled by');
    expect(facts.forward).not.toMatch(/^A · earth →/); // the audited-wrong direction
  });

  it('swapped ordered pairs describe the SAME physical relation, not two different ones', () => {
    // wood/fire (A=wood) and fire/wood (A=fire) are the same two elements,
    // A/B reversed. Both must agree that WOOD is the generator.
    const woodFirst = elementCycleFacts(relationOf('wood', 'fire'));
    const fireFirst = elementCycleFacts(relationOf('fire', 'wood'));
    expect(woodFirst.label).toBe('generating');
    expect(fireFirst.label).toBe('generating');
    expect(woodFirst.forward).toContain('A · wood →');
    expect(fireFirst.forward).toContain('B · wood →');
  });

  it('mutual consistency: the compact signature, the summary head, and the exported Pair Imprint all read the identical corrected string', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    const snapshot = buildPairImprintSnapshot(relation);
    expect(h.get('dyad-signature-element').textContent).toBe(relation.elementDirectionAB);
    expect(h.get('dyad-spine-element').textContent).toBe(relation.elementDirectionAB);
    expect(h.get('dyad-element-direction-ab').textContent).toBe(relation.elementDirectionAB);
    expect(snapshot.elementCycle).toBe(relation.elementDirectionAB);
  });
});

describe('Pair Dossier — card pair split into its structural registers', () => {
  it('the branch and bracket registers render as separate labeled sub-sections, not one flattened paragraph', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    expect(h.get('dyad-cardpair-branch-head').textContent).toBe(relation.cardBranchHead);
    expect(h.get('dyad-cardpair-branch-body').textContent).toBe(relation.cardBranchBody);
    expect(h.get('dyad-cardpair-bracket-head').textContent).toBe(relation.cardBracketHead);
    expect(h.get('dyad-cardpair-bracket-body').textContent).toBe(relation.cardBracketBody);
    // The full flattened citation survives too — nothing is lost, just no
    // longer the PRIMARY presentation.
    expect(h.get('dyad-cardpair-body').textContent).toBe(relation.cardPair);
  });

  it('the branch head names the filed relation key, or says unfiled — never invents a fourth verdict', () => {
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    const branch = reading.relation.cardPair.branch;
    expect(relation.cardBranchHead).toBe(
      branch.status === 'registered' ? `year branch · ${branch.key}` : 'year branch · unfiled',
    );
  });

  it('the bracket head uses a NEUTRAL separator, never an arrow (audit A5: bracket.body makes no directional claim)', () => {
    const reading = buildDyadReading(A, B);
    const relation = formatDyadRelation(reading);
    const { bracket } = reading.relation.cardPair;
    expect(relation.cardBracketHead).toBe(`A · ${bracket.arcA} · B · ${bracket.arcB}`);
    expect(relation.cardBracketHead).not.toMatch(/[→←⇄]/);
  });
});

describe('Pair Dossier — the relation scope/provenance line carries the qualifier', () => {
  it('"recorded, not certified." is not the final line under the evidence — it sits with the scope framing', () => {
    // Structural: the qualifier node is the FIRST child inside #dyad-relation
    // (immediately after the opening tag), not the last — i.e. it precedes
    // every <details> axis rather than trailing them.
    const relationOpen = dyadJs.indexOf('id="dyad-relation">');
    const scopeIdx = dyadJs.indexOf('dyad-relation-scope', relationOpen);
    const firstAxisIdx = dyadJs.indexOf('dyad-axis-element', relationOpen);
    expect(scopeIdx).toBeGreaterThan(relationOpen);
    expect(scopeIdx).toBeLessThan(firstAxisIdx);
  });

  it('the qualifier value is still exactly DYAD_QUALIFIER and still clears on close', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-qualifier').textContent).toBe(DYAD_QUALIFIER);
    h.withDom(() => closeDyad());
    expect(h.get('dyad-qualifier').textContent).toBe('');
  });
});

describe('Pair Dossier — failure state (Step 4: visible copy, never a silent empty block)', () => {
  // SYNTHETIC FAULT INJECTION, not a naturally-reachable submitted-pair
  // state: no ordinary UI input can produce an incoherent day-pillar
  // stemElement (core/dyad.js's dyadDayMaster() guard is a defensive check
  // against a malformed coordinate, not a validation a real profile can
  // fail). This deliberately corrupts a valid profile object to drive the
  // REAL production error path — core/dyad.js's dyadDayMaster() throw,
  // caught by dyadRelationFor(), which returns null exactly as it would for
  // any other malformed-coordinate bug — so the failure PRESENTATION below
  // (ui/dyad.js's fail-closed rendering) is exercised through its actual
  // code path rather than a hand-built failure-shaped mock. Sixth
  // remediation gate: this is synthetic/mock-DOM coverage of a real error
  // path, never evidence that a relation can fail closed from ordinary use.
  function incoherentB() {
    return { ...B, dayPillar: { ...B.dayPillar, stemElement: 'not-a-real-element' } };
  }

  it('an unresolved relation shows explicit visible copy and a recoverable action, never a bare aria-label', () => {
    const h = harness('t5', { buildSecond: () => incoherentB() });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-output').hidden).toBe(false); // the two sheets still render
    expect(h.get('dyad-relation').classList.contains('sealed')).toBe(true);
    expect(h.get('dyad-signature').hidden).toBe(true);
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
    expect(h.get('dyad-relation-retry')).toBeTruthy();
  });

  it('both individual sheets remain visible/available (not certified valid) when the relation fails', () => {
    const h = harness('t5', { buildSecond: () => incoherentB() });
    h.withDom(() => submitSecond());
    expect(h.cell('a', 'arcana').textContent).toBe(A.birthCard.label);
    // B's own sheet still renders from the (otherwise valid) incoherent
    // profile — only the CROSS-profile relation lookup failed.
    expect(h.cell('b', 'sun').textContent).toBe(B.sunSign);
  });

  it('the retry action re-enters the second-entry form (same as "compare another")', () => {
    const h = harness('t5', { buildSecond: () => incoherentB() });
    h.withDom(() => submitSecond());
    h.withDom(() => {
      h.get('dyad-name-input').value = 'stale';
      h.get('dyad-relation-retry').listeners.click();
    });
    expect(h.get('dyad-name-input').value).toBe('');
    expect(h.get('dyad-output').hidden).toBe(true);
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
    expect(h.get('dyad-name-input').focusCalls.length).toBeGreaterThan(0);
  });

  it('a resolved pair after a failed one clears the failure copy and shows the signature', () => {
    let calls = 0;
    const h = harness('t5', { buildSecond: () => (calls++ === 0 ? incoherentB() : B) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
    expect(h.get('dyad-signature').hidden).toBe(false);
  });
});

describe('Pair Dossier — completion flow (Step 3: share / compare another / back to my sheet)', () => {
  it('three actions exist: share the pair (primary), compare another (secondary), back to my sheet (tertiary)', () => {
    expect(dyadJs).toMatch(/share the pair/);
    expect(dyadJs).toMatch(/compare another/);
    expect(dyadJs).toMatch(/back to my sheet/);
  });

  it('"back to my sheet" is the SAME control as before (id dyad-back), just relabeled — behavior unchanged', () => {
    let exitCalls = 0;
    const h = harness('t5', { onExit: () => { exitCalls += 1; } });
    h.withDom(() => submitSecond());
    h.withDom(() => h.get('dyad-back').listeners.click());
    expect(h.get('dyad-screen').classList.contains('hidden')).toBe(true);
    expect(exitCalls).toBe(1);
  });

  it('"compare another" clears every B-derived node, keeps A, and returns focus to the name field', () => {
    const h = harness('t5');
    h.withDom(() => {
      // open() clears the entry fields the harness pre-seeds — re-enter
      // them, exactly as a real second visit to the form would.
      openDyad();
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      submitSecond();
    });
    expect(h.cell('b', 'arcana').textContent).toBe(B.birthCard.label);
    h.withDom(() => h.get('dyad-compare-btn').listeners.click());
    // B is gone, everywhere.
    expect(h.get('dyad-output').hidden).toBe(true);
    expect(h.get('dyad-head-b').textContent).toBe('');
    for (const key of CELL_KEYS) expect(h.cell('b', key).textContent).toBe('');
    expect(allText(h)).not.toContain(B.sunSign);
    // A is retained (compareAnother() never touches getProfile()'s
    // host-owned A binding) and the SCREEN stays open — unlike "back to my
    // sheet", it never hides #dyad-screen.
    expect(h.get('dyad-screen').classList.contains('hidden')).toBe(false);
    expect(h.get('dyad-name-input').focusCalls.length).toBeGreaterThan(0);
  });

  it('"compare another" is exported directly and refuses below t5', () => {
    const h = harness('free');
    expect(h.withDom(() => compareAnother())).toBe(false);
  });

  it('the pair signature, side-select and share status all reset on "compare another"', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    h.withDom(() => h.get('dyad-compare-btn').listeners.click());
    expect(h.get('dyad-signature').hidden).toBe(true);
    expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('true');
    expect(h.get('dyad-side-b').attrs['aria-pressed']).toBe('false');
  });
});

describe('Pair Dossier — screen ownership (isOpen/close, the Previous-Readings seam)', () => {
  it('isOpen() tracks the screen\'s own hidden class', () => {
    const h = harness('t5');
    expect(h.withDom(() => isDyadOpen())).toBe(false);
    h.withDom(() => openDyad());
    expect(isDyadOpen()).toBe(true);
    h.withDom(() => closeDyad());
    expect(isDyadOpen()).toBe(false);
  });

  it('currentRelation() exposes the last rendered relation and clears with everything else', () => {
    const h = harness('t5');
    expect(currentRelation()).toBe(null);
    h.withDom(() => submitSecond());
    expect(currentRelation()).not.toBe(null);
    expect(currentRelation().cardPairHead).toMatch(/^no\. .+ × no\. .+$/);
    h.withDom(() => closeDyad());
    expect(currentRelation()).toBe(null);
  });

  it('currentRelation() is null (not the previous pair\'s) after a failure', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(currentRelation()).not.toBe(null);
    const h2 = harness('t5', { buildSecond: () => ({ ...B, dayPillar: { ...B.dayPillar, stemElement: 'bogus' } }) });
    h2.withDom(() => submitSecond());
    expect(currentRelation()).toBe(null);
  });
});

describe('Pair Dossier — second-form accessibility parity (Step 4)', () => {
  it('both inputs carry aria-describedby + aria-invalid, both errors carry role=alert + aria-live=assertive', () => {
    expect(dyadJs).toMatch(/dyad-name-input[^>]*aria-describedby="dyad-name-error"[^>]*aria-invalid="false"/);
    expect(dyadJs).toMatch(/dyad-dob-input[^>]*aria-describedby="dyad-dob-error"[^>]*aria-invalid="false"/);
    expect(dyadJs).toMatch(/dyad-name-error[^>]*role="alert"[^>]*aria-live="assertive"/);
    expect(dyadJs).toMatch(/dyad-dob-error[^>]*role="alert"[^>]*aria-live="assertive"/);
  });

  it('a rejected submit sets aria-invalid on the offending field and focuses it', () => {
    const h = harness('t5', { validate: () => ({ ok: false, field: 'name' }) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-name-error').hidden).toBe(false);
    expect(h.get('dyad-name-input').attrs['aria-invalid']).toBe('true');
    expect(h.get('dyad-name-input').focusCalls.length).toBeGreaterThan(0);
  });

  it('a rejected dob submit sets aria-invalid on the dob field, not the name field', () => {
    const h = harness('t5', { validate: () => ({ ok: false, field: 'dob' }) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-dob-error').hidden).toBe(false);
    expect(h.get('dyad-dob-input').attrs['aria-invalid']).toBe('true');
    expect(h.get('dyad-name-input').attrs['aria-invalid']).toBe('false');
  });

  it('reset-on-input: editing the invalid field after a rejected submit clears its own error immediately', () => {
    const h = harness('t5', { validate: () => ({ ok: false, field: 'name' }) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-name-error').hidden).toBe(false);
    h.withDom(() => h.get('dyad-name-input').listeners.input());
    expect(h.get('dyad-name-error').hidden).toBe(true);
    expect(h.get('dyad-name-input').attrs['aria-invalid']).toBe('false');
  });

  it('a successful submit clears aria-invalid on both fields', () => {
    const h = harness('t5');
    h.withDom(() => { h.get('dyad-name-input').attrs['aria-invalid'] = 'true'; return submitSecond(); });
    expect(h.get('dyad-name-input').attrs['aria-invalid']).toBe('false');
    expect(h.get('dyad-dob-input').attrs['aria-invalid']).toBe('false');
  });
});

describe('Pair Dossier — narrow-screen A/B jump control', () => {
  it('both jump buttons exist and default to A pressed in the static markup', () => {
    expect(dyadJs).toMatch(/id="dyad-side-a" aria-pressed="true"/);
    expect(dyadJs).toMatch(/id="dyad-side-b" aria-pressed="false"/);
  });

  it('the clear path resets both buttons to A pressed (the same JS-driven baseline the harness can observe)', () => {
    const h = harness('t5');
    h.withDom(() => closeDyad());
    expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('true');
    expect(h.get('dyad-side-b').attrs['aria-pressed']).toBe('false');
  });

  it('clicking B presses B and releases A; labels carry each side\'s first name after a render', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-side-a').textContent).toBe(`A · ${A.firstName}`);
    expect(h.get('dyad-side-b').textContent).toBe(`B · ${B.firstName}`);
    h.withDom(() => h.get('dyad-side-b').listeners.click());
    expect(h.get('dyad-side-b').attrs['aria-pressed']).toBe('true');
    expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('false');
  });

  it('a fresh open() resets both buttons to plain A/B text and A pressed', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    h.withDom(() => closeDyad());
    expect(h.get('dyad-side-a').textContent).toBe('A');
    expect(h.get('dyad-side-b').textContent).toBe('B');
    expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('true');
  });
});

// ── Remediation gate (audit_pair_dossier_imprint_2026-09-04.md) ─────────

describe('B1 — novalidate: native constraints no longer bypass the custom error contract', () => {
  it('the second-entry form carries novalidate, so a real click always reaches validateEntry', () => {
    expect(dyadJs).toMatch(/id="dyad-form" autocomplete="off" novalidate/);
  });

  it('required stays on the inputs (a non-JS fallback signal) but novalidate stops it gating submission', () => {
    expect(dyadJs).toMatch(/id="dyad-name-input" type="text" required/);
    expect(dyadJs).toMatch(/id="dyad-dob-input" type="date" required/);
  });
});

describe('B2 — a null relation exposes only the two sheets plus ONE recovery action', () => {
  function incoherentBLocal() {
    return { ...B, dayPillar: { ...B.dayPillar, stemElement: 'not-a-real-element' } };
  }

  it('hides the evidence block, the spine, and every completion control tied to a resolved relation', () => {
    const h = harness('t5', { buildSecond: () => incoherentBLocal() });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation').hidden).toBe(true);
    expect(h.get('dyad-spine-wrap').hidden).toBe(true);
    expect(h.get('dyad-share-disclosure').hidden).toBe(true);
    expect(h.get('dyad-share-btn').hidden).toBe(true);
    expect(h.get('dyad-compare-btn').hidden).toBe(true);
    // The ONE recovery action — no duplicate.
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
  });

  it('a resolved relation restores every one of those surfaces', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation').hidden).toBe(false);
    expect(h.get('dyad-spine-wrap').hidden).toBe(false);
    expect(h.get('dyad-share-disclosure').hidden).toBe(false);
    expect(h.get('dyad-share-btn').hidden).toBe(false);
    expect(h.get('dyad-compare-btn').hidden).toBe(false);
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
  });

  it('clearOutput() defaults every one of those surfaces to hidden — the same F1 shape as signature/failure', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    h.withDom(() => closeDyad());
    expect(h.get('dyad-relation').hidden).toBe(true);
    expect(h.get('dyad-spine-wrap').hidden).toBe(true);
    expect(h.get('dyad-share-disclosure').hidden).toBe(true);
    expect(h.get('dyad-share-btn').hidden).toBe(true);
    expect(h.get('dyad-compare-btn').hidden).toBe(true);
  });
});

describe('B3 — Back restores focus to a stable, visible control', () => {
  it('"back to my sheet" focuses #dyad-open-btn, never leaving focus stranded on the now-hidden #dyad-back', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    h.withDom(() => h.get('dyad-back').listeners.click());
    expect(h.get('dyad-open-btn').focusCalls.length).toBeGreaterThan(0);
  });
});

describe('B4 — a named top-level landmark for the Pair screen', () => {
  it('the screen root is labelled by its own h1, matching every sibling screen', () => {
    expect(dyadJs).toMatch(/root\.setAttribute\('aria-labelledby', 'dyad-heading'\)/);
    expect(dyadJs).toMatch(/<h1 class="dyad-heading" id="dyad-heading" tabindex="-1">pair reading<\/h1>/);
  });

  it('open() focuses the named heading, not an unnamed section', () => {
    const h = harness('t5');
    h.withDom(() => openDyad());
    expect(h.get('dyad-heading').focusCalls.length).toBeGreaterThan(0);
  });
});

describe('B5 — the A/B cue reflects real scroll position, not only button clicks', () => {
  it('a scroll listener is attached to the pannable strip', () => {
    expect(dyadJs).toMatch(/sheetsScrollWrap\.addEventListener\('scroll'/);
  });

  it('firing the scroll listener with B closer to center presses B and releases A, even though setSide() was never called', () => {
    // The listener is throttled to one check per animation frame (rAF is
    // undefined in this node-env harness, so it falls back to a 16ms
    // setTimeout) — fake timers make that scheduling deterministic rather
    // than asserting a race against a real 16ms wait.
    vi.useFakeTimers();
    try {
      const h = harness('t5');
      h.withDom(() => submitSecond());
      const wrap = h.get('dyad-sheets');
      const childA = { offsetLeft: 0, offsetWidth: 300 };
      const childB = { offsetLeft: 320, offsetWidth: 300 };
      wrap.children = [childA, childB];
      wrap.clientWidth = 300;
      wrap.scrollLeft = 320; // panned so B's center is now under the viewport center
      h.withDom(() => { wrap.listeners.scroll(); vi.advanceTimersByTime(20); });
      expect(h.get('dyad-side-b').attrs['aria-pressed']).toBe('true');
      expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('scrolling back toward A releases B and presses A again', () => {
    vi.useFakeTimers();
    try {
      const h = harness('t5');
      h.withDom(() => submitSecond());
      const wrap = h.get('dyad-sheets');
      const childA = { offsetLeft: 0, offsetWidth: 300 };
      const childB = { offsetLeft: 320, offsetWidth: 300 };
      wrap.children = [childA, childB];
      wrap.clientWidth = 300;
      wrap.scrollLeft = 0;
      h.withDom(() => { wrap.listeners.scroll(); vi.advanceTimersByTime(20); });
      expect(h.get('dyad-side-a').attrs['aria-pressed']).toBe('true');
      expect(h.get('dyad-side-b').attrs['aria-pressed']).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('B6 — long names never overflow the mobile A/B selector', () => {
  it('the button bounds itself (min-width:0, flex:1 1 0) and truncates paint only, never the accessible text', () => {
    expect(dyadJs).toMatch(/\.dyad-side-btn \{[\s\S]{0,40}min-height: 44px; min-width: 0; max-width: 100%; flex: 1 1 0;/);
    expect(dyadJs).toMatch(/overflow: hidden; text-overflow: ellipsis; white-space: nowrap;/);
  });

  it('a 60-character unbroken name is still the button\'s FULL textContent and title — CSS clips paint, not the DOM', () => {
    const longName = 'x'.repeat(60);
    const h = harness('t5', { buildSecond: () => ({ ...B, firstName: longName }) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-side-b').textContent).toBe(`B · ${longName}`);
    expect(h.get('dyad-side-b').attrs.title).toBe(`B · ${longName}`);
  });

  it('the title attribute clears on close, alongside the rest of the F1 enumeration', () => {
    const longName = 'y'.repeat(60);
    const h = harness('t5', { buildSecond: () => ({ ...B, firstName: longName }) });
    h.withDom(() => submitSecond());
    h.withDom(() => closeDyad());
    expect(h.get('dyad-side-b').attrs.title).toBeUndefined();
  });
});

describe('B7 — the narrow-screen jump respects prefers-reduced-motion', () => {
  const originalMM = globalThis.matchMedia;
  afterEach(() => {
    if (originalMM === undefined) delete globalThis.matchMedia; else globalThis.matchMedia = originalMM;
  });

  it('requests smooth scrolling by default', () => {
    globalThis.matchMedia = () => ({ matches: false });
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const wrap = h.get('dyad-sheets');
    wrap.children = [{ offsetLeft: 0 }, { offsetLeft: 320 }];
    let requested = null;
    wrap.scrollTo = opts => { requested = opts; };
    h.withDom(() => h.get('dyad-side-b').listeners.click());
    expect(requested.behavior).toBe('smooth');
  });

  it('requests instant (auto) scrolling under prefers-reduced-motion: reduce', () => {
    globalThis.matchMedia = q => ({ matches: q === '(prefers-reduced-motion: reduce)' });
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const wrap = h.get('dyad-sheets');
    wrap.children = [{ offsetLeft: 0 }, { offsetLeft: 320 }];
    let requested = null;
    wrap.scrollTo = opts => { requested = opts; };
    h.withDom(() => h.get('dyad-side-b').listeners.click());
    expect(requested.behavior).toBe('auto');
  });
});

describe('B8 — citation-label contrast meets AA, non-compounded', () => {
  // The same composited-luminance formula tests/monochrome_surface.test.js
  // uses for the rest of the product: white at `alpha` over a pure black
  // surface, WCAG relative-luminance contrast ratio against black (L=0).
  function contrastOfWhiteAlphaOnBlack(alpha) {
    const c = alpha <= 0.03928 ? alpha / 12.92 : Math.pow((alpha + 0.055) / 1.055, 2.4);
    return (c + 0.05) / 0.05;
  }

  it('.dyad-cite-label sets an explicit, non-compounded color — 0.55 alone clears 4.5:1', () => {
    expect(dyadJs).toMatch(/\.dyad-cite-label \{[\s\S]{0,120}color: var\(--text\); opacity: 0\.55;/);
    expect(contrastOfWhiteAlphaOnBlack(0.55)).toBeGreaterThanOrEqual(4.5);
  });

  it('.dyad-qualifier sets an explicit, non-compounded color — 0.6 alone clears 4.5:1', () => {
    expect(dyadJs).toMatch(/\.dyad-qualifier \{[\s\S]{0,80}color: var\(--text\); opacity: 0\.6;/);
    expect(contrastOfWhiteAlphaOnBlack(0.6)).toBeGreaterThanOrEqual(4.5);
  });

  it('the PRE-FIX compounded values (inherited 0.72 alpha × the rule\'s own opacity) fail 4.5:1 — proving the fix was necessary, not cosmetic', () => {
    expect(contrastOfWhiteAlphaOnBlack(0.72 * 0.55)).toBeLessThan(4.5);
    expect(contrastOfWhiteAlphaOnBlack(0.72 * 0.6)).toBeLessThan(4.5);
  });
});

describe('item 5 — effective contrast is checked through the REAL ancestor chain, not one selector in isolation', () => {
  // Same composited-luminance formula as the B8 block above.
  function contrastOfWhiteAlphaOnBlack(alpha) {
    const c = alpha <= 0.03928 ? alpha / 12.92 : Math.pow((alpha + 0.055) / 1.055, 2.4);
    return (c + 0.05) / 0.05;
  }

  // A FOURTH defect, found only by the corrected live-fire pass (item 10):
  // `#dyad-qualifier` carried ONLY the id in markup, never the
  // `dyad-qualifier` CLASS the CSS rule actually selects on — so B8's
  // contrast fix (explicit color+opacity) had NEVER applied to the real
  // rendered element, in any prior gate. `getComputedStyle` in a real
  // browser reported the UA default opacity:1 where the source READ 0.6 —
  // a class/id selector mismatch no mock-DOM unit test can catch, since
  // those never run a real CSS cascade. Pinned here so it cannot silently
  // regress.
  it('#dyad-qualifier carries BOTH the class the CSS rule selects on AND the id ui/dyad.js\'s $() helper looks up — a selector/lookup mismatch here means the rule silently never applies', () => {
    expect(dyadJs).toMatch(/<span class="dyad-qualifier" id="dyad-qualifier">/);
  });

  // A THIRD compounding source, distinct from both B8 fixes: unlike a
  // `color: rgba(...)` alpha (which only INHERITS, and can be cancelled by
  // an explicit `color` on the descendant, per B8), CSS `opacity` compounds
  // across a real ancestor/descendant DOM relationship regardless of the
  // descendant's own `color` — unaffected by B8's fix, which only ever
  // addressed inherited color, never a PARENT's own opacity. This is what
  // #dyad-qualifier actually hit: `.dyad-relation-scope` (its real DOM
  // parent, per SCREEN_HTML) carried its own opacity:0.7, so the qualifier's
  // TRUE rendered alpha was 0.7 × 0.6 = 0.42 (~3.95:1) even though its own
  // rule read "non-compounded" in isolation. The old B8 test above measured
  // the CHILD selector alone and never walked up to the parent.
  it('.dyad-relation-scope no longer carries its own opacity — nothing left for a real child to compound against', () => {
    const rule = dyadJs.match(/#dyad-screen \.dyad-relation-scope \{([^}]*)\}/);
    expect(rule).toBeTruthy();
    expect(rule[1]).not.toMatch(/opacity/);
  });

  it('#dyad-qualifier\'s effective alpha, walked through its REAL ancestor chain (.dyad-relation-scope > #dyad-relation > #dyad-output > #dyad-screen, none of which carry opacity), clears 4.5:1', () => {
    // Structural precondition: every ancestor up to the screen root is
    // opacity-free (checked directly against source, not assumed) — so the
    // qualifier's OWN 0.6 is the entire product.
    for (const ancestorSelector of ['#dyad-relation', '#dyad-output']) {
      const m = dyadJs.match(new RegExp(`#dyad-screen ${ancestorSelector.replace('#', '\\#')} \\{([^}]*)\\}`));
      if (m) expect(m[1], ancestorSelector).not.toMatch(/opacity/);
    }
    expect(contrastOfWhiteAlphaOnBlack(0.6)).toBeGreaterThanOrEqual(4.5);
  });

  it('the bare "relation layer · structural citations only" scope-line span gets its OWN single alpha (0.7), not the removed ancestor opacity, and clears 4.5:1', () => {
    expect(dyadJs).toMatch(/\.dyad-relation-scope > span:first-child \{ color: var\(--text\); opacity: 0\.7; \}/);
    expect(contrastOfWhiteAlphaOnBlack(0.7)).toBeGreaterThanOrEqual(4.5);
  });

  it('the PRE-FIX compounded value (0.7 ancestor × 0.6 own = 0.42) fails 4.5:1 — proving THIS fix was structurally necessary, distinct from B8\'s inherited-color fix', () => {
    expect(contrastOfWhiteAlphaOnBlack(0.7 * 0.6)).toBeLessThan(4.5);
    expect(contrastOfWhiteAlphaOnBlack(0.7 * 0.6)).toBeCloseTo(3.95, 1);
  });

  it('no OTHER opacity-bearing selector in this stylesheet nests inside another opacity-bearing selector\'s element, except the one accounted-for non-text mark below (a full re-scan, not just the one fixed pair)', () => {
    // Every `opacity:` declaration in the module, with its selector.
    const rules = [...dyadJs.matchAll(/#dyad-screen ([^{]+)\{([^}]*)\}/g)]
      .filter(m => /opacity:\s*[\d.]/.test(m[2]))
      .map(m => m[1].trim());
    // Real DOM parent/child pairs among THOSE selectors' elements, per
    // SCREEN_HTML (read directly above in this file, not restated from
    // memory) — .dyad-axis > summary::after is a pseudo-element of an
    // ALREADY-opacity'd summary, but it renders a decorative +/- glyph
    // (redundant with aria-expanded), not a text node subject to the 4.5:1
    // text floor — WCAG 1.4.11's 3:1 non-text floor applies instead. This
    // nesting is accounted for separately below (eighth remediation gate),
    // not silently ignored: the compounding ALSO includes the inherited
    // body color-muted alpha this exemption originally missed, which is
    // exactly why it needed its own fix rather than a bare carve-out.
    const knownAcceptableNesting = ['#dyad-screen .dyad-axis > summary::after'];
    for (const selector of rules) {
      const full = `#dyad-screen ${selector}`;
      if (knownAcceptableNesting.includes(full)) continue;
      // None of the remaining opacity selectors should be `.dyad-relation-scope`
      // (the one real defect, now fixed) or any selector whose element
      // SCREEN_HTML nests inside another opacity-bearing element's subtree.
      expect(selector, full).not.toBe('.dyad-relation-scope');
    }
  });

  // Eighth remediation gate: the exemption above originally computed the
  // summary::after mark's contrast as its own opacity (0.6) times its
  // ancestor summary's opacity (0.7) = 0.42, ~3.95:1, and called that
  // "clears 3:1" — but neither rule set an explicit `color`, so the mark
  // ALSO inherited the body color-muted rule's own alpha (rgba(255,255,
  // 255,0.72), ui/shell.css), the same class of miss B8 above exists to
  // catch for TEXT. True pre-fix alpha: 0.72 × 0.7 × 0.6 = 0.3024, ~2.48:1
  // — below WCAG 1.4.11's 3:1 non-text-UI-mark floor. Fixed the same way as
  // B8: an explicit `color: var(--text)` on the mark itself cancels the
  // inherited alpha, leaving the two already-declared opacities (0.7 × 0.6
  // = 0.42) as the sole multiplier.
  function contrastOfWhiteAlphaOnBlack(alpha) {
    const c = alpha <= 0.03928 ? alpha / 12.92 : Math.pow((alpha + 0.055) / 1.055, 2.4);
    return (c + 0.05) / 0.05;
  }

  it('.dyad-axis > summary::after sets an explicit, non-compounded color — ancestor(0.7) × own(0.6) = 0.42 alone clears the 3:1 non-text-mark floor', () => {
    const rule = dyadJs.match(/#dyad-screen \.dyad-axis > summary::after \{([^}]*)\}/);
    expect(rule).toBeTruthy();
    expect(rule[1]).toMatch(/color:\s*var\(--text\)/);
    expect(rule[1]).toMatch(/opacity:\s*0\.6/);
    const ancestorSummary = dyadJs.match(/#dyad-screen \.dyad-axis > summary \{([^}]*)\}/);
    expect(ancestorSummary).toBeTruthy();
    expect(ancestorSummary[1]).toMatch(/opacity:\s*0\.7/);
    expect(contrastOfWhiteAlphaOnBlack(0.7 * 0.6)).toBeGreaterThanOrEqual(3.0);
  });

  it('the PRE-FIX compounded value (inherited 0.72 alpha × ancestor 0.7 × own 0.6 = 0.3024) fails the 3:1 non-text floor — proving this fix was structurally necessary, not the same fix as B8', () => {
    expect(contrastOfWhiteAlphaOnBlack(0.72 * 0.7 * 0.6)).toBeLessThan(3.0);
    expect(contrastOfWhiteAlphaOnBlack(0.72 * 0.7 * 0.6)).toBeCloseTo(2.48, 1);
  });
});

describe('D1 — the Pair Imprint privacy boundary, proven over the REAL production path (audit D1, strengthened per second remediation gate P2)', () => {
  // tests/pair_share.test.js's own sentinel tests build a hand-shaped
  // "formattedRelation" object — a fiction, however realistic. This test
  // drives the SAME sentinel strings through the actual pipeline the
  // product runs: real DOM input (including a REAL citysearch selection,
  // not a hand-built `_city`) -> submitSecond() -> buildProfile() ->
  // core/dyad.js buildDyadReading() -> formatDyadRelation() ->
  // currentRelation() -> ui/pairShare.js's real builders. If any layer of
  // that real chain ever starts leaking, THIS is the test that catches it;
  // the hand-built version cannot, by construction.
  //
  // Second gate strengthening: every sentinel is first asserted POSITIVELY
  // PRESENT upstream — on the real `buildSecond` payload citysearch/DOM
  // produced, or as a value that measurably changed what buildProfile
  // computed for A — before the downstream absence check runs. A field the
  // pipeline silently dropped before this test could even plant it would
  // make the old "not.toContain" assertions vacuously true; the positive
  // check closes that gap.
  const SENTINEL_A_NAME = 'sentinelnameaustria1955';
  const SENTINEL_B_NAME = 'sentinelnamebravo1988';
  const SENTINEL_A_DOB = '1955-02-17';
  const SENTINEL_B_DOB = '1988-06-15';
  const SENTINEL_A_TIME = '09:41';
  const SENTINEL_B_TIME = '21:13';
  const SENTINEL_A_TZ = 'America/New_York';
  const SENTINEL_A_LAT = 11.11;
  const SENTINEL_A_LNG = 22.22;
  // A real (if obscure) IANA zone — a fictional tz string like
  // 'Pacific/Sentinel' would make Intl reject it and moonSign/risingSign
  // resolve to undefined regardless of any leak, defeating the positive-
  // presence proof below (a false pass, not a real absence).
  const SENTINEL_CITY = { name: 'sentinelcityzz', country: 'Zeta', countryCode: 'ZZ', lat: 33.33, lng: 44.44, tz: 'Pacific/Kiritimati' };

  it('no name, DOB, birth time, timezone, latitude, longitude, city, individual coordinate, or written-card string reaches the snapshot/SVG/caption — each first proven present upstream', async () => {
    // ── person A: sentinel time/tz/lat/lng fed directly to buildProfile ──
    const sentinelA = buildProfile(SENTINEL_A_NAME, SENTINEL_A_DOB, {
      time: SENTINEL_A_TIME, tz: SENTINEL_A_TZ, lat: SENTINEL_A_LAT, lng: SENTINEL_A_LNG,
    });
    // Positive-presence proof for A: the sentinel time/tz/lat/lng were not
    // silently ignored — they are exactly what let risingSign AND moonSign
    // resolve at all (both require a valid time + tz; rising additionally
    // needs lat/lng — core/profile.js's own gating, read here rather than
    // restated).
    expect(sentinelA.risingSign, 'sentinel tz/lat/lng were consumed for rising').not.toBeUndefined();
    expect(sentinelA.moonSign, 'sentinel time/tz were consumed for moon').not.toBeUndefined();

    // ── person B: the REAL citysearch + form flow, not a hand-built _city ──
    searchCities.mockReset();
    searchCities.mockResolvedValue([SENTINEL_CITY]);
    let captured = null;
    const h = harness('t5', {
      profileA: sentinelA,
      buildSecond: payload => { captured = payload; return buildProfile(payload.name, payload.dob, payload); },
    });

    const outer = globalThis.document;
    globalThis.document = { getElementById: id => h.byId.get(id) || null, createElement: () => makeNode() };
    vi.useFakeTimers();
    try {
      const cityInput = h.get('dyad-city-input');
      cityInput.value = 'se';
      cityInput.listeners.input();
      await vi.advanceTimersByTimeAsync(200); // > ui/citysearch.js's 150ms SEARCH_DEBOUNCE_MS
      const suggestions = h.get('dyad-city-suggestions');
      expect(suggestions.children.length).toBe(1);
      suggestions.children[0].listeners.mousedown({ preventDefault() {} });

      h.get('dyad-name-input').value = SENTINEL_B_NAME;
      h.get('dyad-dob-input').value = SENTINEL_B_DOB;
      h.get('dyad-time-input').value = SENTINEL_B_TIME;
      expect(submitSecond()).toBe(true);
    } finally {
      vi.useRealTimers();
      globalThis.document = outer;
    }

    // Positive-presence proof for B: the REAL payload the real DOM/citysearch
    // flow produced carries every sentinel — proving each one genuinely
    // reached the calculation boundary before the leak check below runs.
    expect(captured, 'buildSecond was called at all').not.toBeNull();
    expect(captured.name).toBe(SENTINEL_B_NAME);
    expect(captured.dob).toBe(SENTINEL_B_DOB);
    expect(captured.time).toBe(SENTINEL_B_TIME);
    expect(captured.city).toBe(SENTINEL_CITY.name);
    expect(captured.cc).toBe(SENTINEL_CITY.countryCode);
    expect(captured.tz).toBe(SENTINEL_CITY.tz);
    expect(captured.lat).toBe(SENTINEL_CITY.lat);
    expect(captured.lng).toBe(SENTINEL_CITY.lng);

    const relation = currentRelation();
    expect(relation).not.toBeNull();
    const sentinelB = buildProfile(SENTINEL_B_NAME, SENTINEL_B_DOB, captured);
    expect(sentinelB.moonSign, 'sentinel B time/tz were consumed for moon').not.toBeUndefined();

    const snapshot = buildPairImprintSnapshot(relation);
    expect(snapshot).not.toBeNull();
    const svg = buildPairImprintSVG(snapshot);
    const caption = buildPairImprintCaption(snapshot);
    const blob = `${JSON.stringify(snapshot)}\n${svg}\n${caption}`;

    // Names, DOBs, birth times, timezone, lat/lng (as rendered numbers and
    // as strings), the city name and country code — every raw sentinel this
    // test just proved was genuinely fed into the real pipeline above.
    for (const token of [
      SENTINEL_A_NAME, SENTINEL_B_NAME, SENTINEL_A_DOB, SENTINEL_B_DOB,
      SENTINEL_A_TIME, SENTINEL_B_TIME, SENTINEL_A_TZ, SENTINEL_CITY.tz,
      String(SENTINEL_A_LAT), String(SENTINEL_A_LNG),
      String(SENTINEL_CITY.lat), String(SENTINEL_CITY.lng),
      SENTINEL_CITY.name, SENTINEL_CITY.countryCode,
    ]) {
      expect(blob, token).not.toContain(token);
    }
    // Individual coordinate values — real computed values from the real
    // profiles, not stand-ins. A false pass here (the value coincidentally
    // matching something legitimately in the imprint, e.g. a life-path
    // digit that's ALSO part of the combined-life-path finding) is exactly
    // why this checks the CATALOG/ARCANA/SUN fields specifically — none of
    // those ever legitimately appear in a Pair Imprint.
    for (const [label, value] of [
      ['A birth card', sentinelA.birthCard.label],
      ['B birth card', sentinelB.birthCard.label],
      ['A sun sign', sentinelA.sunSign],
      ['B sun sign', sentinelB.sunSign],
      ['A public animal', sentinelA.animal],
      ['B public animal', sentinelB.animal],
      ['A rising sign', sentinelA.risingSign],
      ['A moon sign', sentinelA.moonSign],
      ['B moon sign', sentinelB.moonSign],
    ]) {
      if (value == null) continue;
      expect(blob, label).not.toContain(value);
    }
    // The written 144-card entry (name/type/habit/note) for either side —
    // real deck content looked up the same way the sheet renders it.
    const cellA = CARDS[sentinelA.sunSign] && CARDS[sentinelA.sunSign][sentinelA.animal];
    const cellB = CARDS[sentinelB.sunSign] && CARDS[sentinelB.sunSign][sentinelB.animal];
    for (const cell of [cellA, cellB]) {
      if (!cell) continue;
      expect(blob, `${cell.name} (card name)`).not.toContain(cell.name);
      expect(blob, `${cell.type} (card type)`).not.toContain(cell.type);
      for (const slot of ['low', 'mid', 'high']) {
        expect(blob, `${cell.note[slot]} (card note.${slot})`).not.toContain(cell.note[slot]);
      }
    }
    // Unrelated DOM: neither sheet's rendered cell text anywhere in the
    // blob (spot-checked via a handful of live cell reads).
    for (const key of ['dayPillar', 'hourPillar']) {
      const cellText = h.cell('a', key).textContent;
      if (cellText) expect(blob, `sheet A ${key} cell text`).not.toContain(cellText);
    }
  });

  it('the snapshot carries exactly the allow-listed keys even when built from the real pipeline (no incidental extra field)', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    const relation = currentRelation();
    const snapshot = buildPairImprintSnapshot(relation);
    expect(Object.keys(snapshot).sort()).toEqual([...PAIR_IMPRINT_ALLOW].sort());
  });
});

describe('item 8 — the Pair Imprint\'s OWN #dyad-share-status is visible, live-announced, and positioned after the two sheets', () => {
  // Third-gate item 8 named this describe block "a render/share failure"
  // but every assertion in it targets `#dyad-share-status` — the Pair
  // Imprint EXPORT status, a real and correctly-implemented live region,
  // but NOT the relation-RESOLUTION failure surface a submitted pair can
  // fail into. Fourth remediation gate, item 2: the title is corrected to
  // say what this block actually tests; the ACTUAL failure surface
  // (`#dyad-relation-failure`) gets its own dedicated coverage below,
  // against the real node, not this one.
  it('#dyad-share-status is a polite, atomic live region, not a silent DOM write', () => {
    expect(dyadJs).toMatch(/id="dyad-share-status"[^>]*role="status"/);
    expect(dyadJs).toMatch(/id="dyad-share-status"[^>]*aria-live="polite"/);
    expect(dyadJs).toMatch(/id="dyad-share-status"[^>]*aria-atomic="true"/);
  });

  it('#dyad-share-status sits AFTER #dyad-output (the two long sheets), not buried above them', () => {
    const outputIdx = dyadJs.indexOf('id="dyad-output"');
    const statusIdx = dyadJs.indexOf('id="dyad-share-status"');
    expect(outputIdx).toBeGreaterThan(-1);
    expect(statusIdx).toBeGreaterThan(outputIdx);
  });
});

describe('fourth-gate item 2 — the ACTUAL relation-resolution failure surface (#dyad-relation-failure) is accessible and recoverable', () => {
  // A local copy, matching this file's own established convention
  // (`incoherentBLocal()` near B2's describe block is the same pattern) —
  // the fail-closed fixture near "Pair Dossier — failure state" above is
  // scoped to THAT describe callback and is not reachable here. Using it
  // by name from a sibling describe would silently resolve to a
  // ReferenceError inside `_hooks.buildSecond`, which `submitSecond()`'s
  // own try/catch swallows into a validation-error return — a real trap
  // this file's tests must not fall into again.
  // SYNTHETIC FAULT INJECTION (sixth gate — see the fuller note on the
  // sibling copy above): no ordinary UI input reaches this shape; it
  // deliberately corrupts a valid profile to drive the real
  // dyadDayMaster()-throw / dyadRelationFor()-catch production error path,
  // never evidence of a naturally-reachable failure.
  function incoherentB() {
    return { ...B, dayPillar: { ...B.dayPillar, stemElement: 'not-a-real-element' } };
  }

  it('#dyad-relation-failure carries real status semantics: role=status, polite, atomic, a labelled description, and programmatic focusability', () => {
    expect(dyadJs).toMatch(/id="dyad-relation-failure"[^>]*role="status"/);
    expect(dyadJs).toMatch(/id="dyad-relation-failure"[^>]*aria-live="polite"/);
    expect(dyadJs).toMatch(/id="dyad-relation-failure"[^>]*aria-atomic="true"/);
    expect(dyadJs).toMatch(/id="dyad-relation-failure"[^>]*aria-labelledby="dyad-relation-failure-copy"/);
    expect(dyadJs).toMatch(/id="dyad-relation-failure"[^>]*tabindex="-1"/);
    expect(dyadJs).toContain('id="dyad-relation-failure-copy"');
  });

  it('#dyad-relation-failure sits AFTER #dyad-output, alongside the Pair Imprint status, not buried above the sheets', () => {
    const outputIdx = dyadJs.indexOf('id="dyad-output"');
    const failureIdx = dyadJs.indexOf('id="dyad-relation-failure"');
    expect(outputIdx).toBeGreaterThan(-1);
    expect(failureIdx).toBeGreaterThan(outputIdx);
  });

  it('a submitted pair whose relation fails closed reveals AND focuses the real failure node — never #dyad-share-status', () => {
    // A live-fire pass against a real browser (fourth remediation gate)
    // caught a real-browser-only defect: calling .focus() in the SAME
    // synchronous tick as clearing `hidden` silently no-oped in real
    // Chrome, even though this mock-DOM harness (no real layout/focus
    // semantics) could never have shown that. The fix defers the focus call
    // one frame via requestAnimationFrame, falling back to setTimeout(16)
    // where rAF doesn't exist (this Node test environment) — advance fake
    // timers past that here, exactly as this file's other setTimeout-driven
    // assertions already do.
    vi.useFakeTimers();
    try {
      const h = harness('t5', { buildSecond: () => incoherentB() });
      h.withDom(() => submitSecond());
      const failure = h.get('dyad-relation-failure');
      expect(failure.hidden).toBe(false);
      h.withDom(() => vi.advanceTimersByTime(16));
      expect(failure.focusCalls.length).toBeGreaterThan(0);
      // The two sheets remain visible/available regardless (Step 4's own
      // contract, unaffected by this gate) — a failed relation is never a
      // failed reading. "Available" is what this test can prove; it never
      // certifies the sheets' semantic VALIDITY.
      expect(h.get('dyad-output').hidden).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a SUCCESSFUL resolution focuses #dyad-output as before, never the (hidden) failure surface', () => {
    const h = harness('t5');
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
    expect(h.get('dyad-output').focusCalls.length).toBeGreaterThan(0);
  });

  it('the visible "compare another" recovery action is keyboard-operable and clears the failure surface on use', () => {
    const h = harness('t5', { buildSecond: () => incoherentB() });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
    h.withDom(() => { h.get('dyad-relation-retry').listeners.click(); });
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
    // Recovery lands back on the second-entry form, ready to type again —
    // compareAnother()'s own established contract, unchanged by this gate.
    expect(h.get('dyad-name-input')).toBeTruthy();
  });

  it('teardown (Back) hides/resets the failure surface — it never survives a close', () => {
    const h = harness('t5', { buildSecond: () => incoherentB() });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
    h.withDom(() => { h.get('dyad-back').listeners.click(); });
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
  });

  it('a fresh SUCCESSFUL submission after a failure hides the failure surface again — recovery via a real re-submit, not just Compare Another', () => {
    let shouldFail = true;
    const h = harness('t5', { buildSecond: () => (shouldFail ? incoherentB() : B) });
    h.withDom(() => submitSecond());
    expect(h.get('dyad-relation-failure').hidden).toBe(false);
    shouldFail = false;
    h.withDom(() => { entry(h); submitSecond(); });
    expect(h.get('dyad-relation-failure').hidden).toBe(true);
    expect(h.get('dyad-output').focusCalls.length).toBeGreaterThan(0);
  });
});

describe('item 3 — accessible names: the two sheet landmarks and all 30 cells name side/owner/value, updated on fill and cleared on teardown', () => {
  // A's and B's default fixtures ('specimen a' / 'specimen b') share the
  // same FIRST WORD ("specimen") — buildProfile's firstName is the first
  // word only, so both resolve to the identical owner token. That is a
  // pre-existing fixture-naming coincidence (the file's own B2 = buildProfile
  // ('zelda b', ...) at module scope exists for exactly this reason), not a
  // defect in the accessible-name logic under test — the SIDE token (A/B)
  // still disambiguates. Tests that need two visibly-DIFFERENT owner names
  // use B2 explicitly.

  it('each sheet <article> landmark carries a bare side letter before any pair, is real once one resolves, and never duplicates an id', () => {
    const h = harness('t5');
    // open()'s own clearOutput() call is what a real user path always runs
    // before any pair can land — establishing the same clean baseline here
    // (module state persists across this suite's back-to-back harness()
    // calls within one file, same as it would across real screen re-opens).
    h.withDom(() => clearOutput());
    const faceA = h.byAttr.get('[data-sheet-face="a"]');
    const faceB = h.byAttr.get('[data-sheet-face="b"]');
    // No id lives on either landmark (G2: cells/faces are addressed by
    // attribute, never id) — the accessible name is carried entirely by
    // aria-label.
    expect(faceA.attrs.id).toBeUndefined();
    expect(faceB.attrs.id).toBeUndefined();
    expect(faceA.attrs['aria-label']).toBe('A');
    expect(faceB.attrs['aria-label']).toBe('B');

    h.withDom(() => submitSecond());
    expect(faceA.attrs['aria-label']).toBe('A · specimen');
    expect(faceB.attrs['aria-label']).toBe('B · specimen');
  });

  it('with visibly DIFFERENT owners (B2), the two landmarks are never equal', () => {
    const h = harness('t5', { second: B2, buildSecond: () => B2 });
    h.withDom(() => submitSecond());
    const faceA = h.byAttr.get('[data-sheet-face="a"]').attrs['aria-label'];
    const faceB = h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label'];
    expect(faceA).toBe('A · specimen');
    expect(faceB).toBe('B · zelda');
    expect(faceA).not.toBe(faceB);
  });

  it('a RESOLVED coordinate cell (arcana: every profile in this suite has a birth card) names side + owner + coordinate + its real displayed value', () => {
    const h = harness('t5', { second: B2, buildSecond: () => B2 });
    h.withDom(() => submitSecond());
    const cellA = h.cellRoot('a', 'arcana');
    const cellB = h.cellRoot('b', 'arcana');
    const valueA = h.cell('a', 'arcana').textContent;
    const valueB = h.cell('b', 'arcana').textContent;
    expect(valueA.length).toBeGreaterThan(0);
    expect(valueB.length).toBeGreaterThan(0);
    expect(cellA.attrs['aria-label']).toBe(`A · specimen · ${coordinateLabel('arcana')}: ${valueA}`);
    expect(cellB.attrs['aria-label']).toBe(`B · zelda · ${coordinateLabel('arcana')}: ${valueB}`);
  });

  it('an UNRESOLVED coordinate cell (rising: the default fixtures carry no birth time) gets the honest "unresolved" token, never a blank name', () => {
    const h = harness('t5'); // A/B are built with no time/lat/lng — rising cannot resolve
    h.withDom(() => submitSecond());
    const cellA = h.cellRoot('a', 'rising');
    expect(cellA.classList.contains('unres')).toBe(true); // the 'unres' state — the DOM shows an em-dash, "—"
    expect(cellA.attrs['aria-label']).toBe(`A · specimen · ${coordinateLabel('rising')}: unresolved`);
    expect(cellA.attrs['aria-label']).not.toMatch(/: $/); // never a dangling empty value
  });

  it('every one of the 30 cells carries a UNIQUE, non-generic accessible name — no two repeat "coordinate details"', () => {
    const h = harness('t5', { second: B2, buildSecond: () => B2 });
    h.withDom(() => submitSecond());
    const names = [];
    for (const prefix of ['a', 'b']) {
      for (const key of CELL_KEYS) {
        const label = h.cellRoot(prefix, key).attrs['aria-label'];
        expect(label, `${prefix}:${key}`).toContain(prefix === 'b' ? 'B ·' : 'A ·');
        expect(label, `${prefix}:${key}`).not.toBe(`${coordinateLabel(key)} details`);
        names.push(label);
      }
    }
    expect(new Set(names).size).toBe(names.length); // every one of the 30 is distinct
  });

  it('a NEW pair (via Compare Another + a real re-submit) updates every cell\'s name to the new owner and new value — never stuck on the prior pair', () => {
    let current = B2;
    const h = harness('t5', { second: current, buildSecond: () => current });
    h.withDom(() => { openDyad(); entry(h); submitSecond(); });
    const before = h.cellRoot('b', 'arcana').attrs['aria-label'];
    expect(before).toContain('zelda');

    const thirdPerson = buildProfile('third specimen', '1975-11-02');
    current = thirdPerson;
    h.withDom(() => { compareAnother(); h.get('dyad-name-input').value = 'third specimen';
      h.get('dyad-dob-input').value = '1975-11-02'; submitSecond(); });
    const after = h.cellRoot('b', 'arcana').attrs['aria-label'];
    expect(after).toContain('third');
    expect(after).not.toContain('zelda');
    expect(after).not.toBe(before);
  });

  it('teardown (Back) resets both landmarks and all 30 cells to bare side letters and "unresolved" — B\'s name never survives', () => {
    const h = harness('t5', { second: B2, buildSecond: () => B2 });
    h.withDom(() => { openDyad(); entry(h); submitSecond(); });
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toContain('zelda');
    h.withDom(() => { h.get('dyad-back').listeners.click(); });
    expect(h.byAttr.get('[data-sheet-face="a"]').attrs['aria-label']).toBe('A');
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toBe('B');
    for (const prefix of ['a', 'b']) {
      for (const key of CELL_KEYS) {
        const label = h.cellRoot(prefix, key).attrs['aria-label'];
        expect(label, `${prefix}:${key}`).not.toContain('zelda');
        expect(label, `${prefix}:${key}`).not.toContain('specimen');
        expect(label, `${prefix}:${key}`).toContain('unresolved');
      }
    }
  });

  it('compareAnother() clears BOTH landmarks/cells to bare side letters — B\'s prior owner never survives into the fresh entry state', () => {
    const h = harness('t5', { second: B2, buildSecond: () => B2 });
    h.withDom(() => { openDyad(); entry(h); submitSecond(); });
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toContain('zelda');
    h.withDom(() => { compareAnother(); });
    // compareAnother() routes through the same clearOutput() close() uses —
    // both sides blank to bare side letters, since a fresh submission is
    // about to re-render A from the (unchanged) host profile anyway. The
    // load-bearing proof is that B's PRIOR owner ("zelda") is gone.
    expect(h.byAttr.get('[data-sheet-face="a"]').attrs['aria-label']).toBe('A');
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toBe('B');
    expect(h.cellRoot('b', 'arcana').attrs['aria-label']).not.toContain('zelda');

    // A re-submission (the flow compareAnother() exists to enable)
    // immediately repopulates BOTH sides again — A from the SAME host
    // profile (never asking the reader to re-enter person A), B fresh from
    // whatever the next entry produces.
    h.withDom(() => { entry(h); submitSecond(); });
    expect(h.byAttr.get('[data-sheet-face="a"]').attrs['aria-label']).toBe('A · specimen');
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toContain('zelda');
  });
});

describe('item 4 — an unbroken 60-character name never overflows .dyad-sheet-label or #dyad-meaning-head', () => {
  // The exact ceiling `maxlength="60"` on #dyad-name-input permits, chosen
  // as ONE unbroken token (no spaces) — the specific shape that has no
  // natural CSS break opportunity and is what actually overflowed before
  // this fix. A shorter/spaced name was never at risk; this is the
  // adversarial case.
  const UNBROKEN_60 = 'x'.repeat(60);

  it('.dyad-sheet-label declares overflow-wrap:anywhere and is bounded to its column, not left to overflow', () => {
    const rule = dyadJs.match(/#dyad-screen \.dyad-sheet-label \{([^}]*)\}/);
    expect(rule).toBeTruthy();
    expect(rule[1]).toMatch(/overflow-wrap:\s*anywhere/);
    expect(rule[1]).toMatch(/max-width:\s*100%/);
  });

  it('#dyad-meaning-head (the paired panel instance, NOT the shared .meaning-head class) declares the same containment', () => {
    const rule = dyadJs.match(/#dyad-screen #dyad-meaning-head \{([^}]*)\}/);
    expect(rule).toBeTruthy();
    expect(rule[1]).toMatch(/overflow-wrap:\s*anywhere/);
    expect(rule[1]).toMatch(/max-width:\s*100%/);
    // The shared class ui/meanings.js defines (and the host's own
    // single-sheet panel also uses) is untouched — this fix is scoped to
    // the id, never a global edit to a module outside this remediation.
    const sharedClassRule = readFileSync(join(REPO_ROOT, 'ui', 'meanings.js'), 'utf-8')
      .match(/\.meaning-head \{([^}]*)\}/);
    expect(sharedClassRule).toBeTruthy();
    expect(sharedClassRule[1]).not.toMatch(/overflow-wrap/);
  });

  it('an unbroken 60-char name is rendered WHOLE — wrapped, never truncated — in both the sheet label and the panel head text', () => {
    const longProfile = buildProfile(UNBROKEN_60, '1988-06-15');
    const h = harness('t5', { second: longProfile, buildSecond: () => longProfile });
    h.withDom(() => submitSecond());
    // The visible text nodes carry the COMPLETE string — CSS wrapping is a
    // rendering concern, never a content concern; nothing here truncates
    // the DOM text itself (unlike B6's mobile A/B buttons, which legitimately
    // ellipsis-truncate a fixed-height 44px tap target and rely on `title`
    // for the full string — these two nodes are NOT height-constrained, so
    // they wrap instead of hiding anything).
    expect(h.get('dyad-head-b').textContent).toBe(UNBROKEN_60);
    expect(h.byAttr.get('[data-sheet-face="b"]').attrs['aria-label']).toBe(`B · ${UNBROKEN_60}`);

    h.withDom(() => { h.get('dyad-sheets').listeners.click({ target: h.cellRoot('b', 'arcana') }); });
    expect(h.get('dyad-meaning-head').textContent).toBe(`${coordinateLabel('arcana')} · ${UNBROKEN_60}`);
  });

  it('the accessible name (aria-label) never truncates the owner even where the visible text wraps', () => {
    const longProfile = buildProfile(UNBROKEN_60, '1988-06-15');
    const h = harness('t5', { second: longProfile, buildSecond: () => longProfile });
    h.withDom(() => submitSecond());
    for (const key of CELL_KEYS) {
      const label = h.cellRoot('b', key).attrs['aria-label'];
      expect(label, key).toContain(UNBROKEN_60);
    }
  });
});
