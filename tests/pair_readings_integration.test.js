// 8ball / tests / pair_readings_integration.test.js
//
// Audit D2 (audit_pair_dossier_imprint_2026-09-04.md): tests/readings_ui.
// test.js's screen-ownership coverage mocks `closeActiveScreens` — it proves
// ui/readings.js CALLS whatever hook it is given, in the right order, but
// never exercises the REAL cleanup index.html wires: `meaningsUI.close();
// if (isDyadOpen()) { closeDyad(); result.classList.remove('hidden'); }`.
//
// This file boots THREE real modules — ui/dyad.js, ui/readings.js, and
// ui/meanings.js — against ONE shared document mock and wires the ACTUAL
// closeActiveScreens callback index.html uses (not a stub), so the assertion
// is "the real functions did the real work," not "the hook was called."
//
// Two coexisting DOM strategies under one shared `document`, deliberately:
// ui/dyad.js's own screen is pre-registered by id (the same proven approach
// tests/dyad_surface.test.js uses — injectScreen() short-circuits on an
// already-registered '#dyad-screen', so it never needs real nested-HTML
// parsing); ui/readings.js's injected page is REAL flat-innerHTML-parsed
// (the same proven approach tests/readings_ui.test.js uses — that module
// only ever looks up its OWN generated ids via querySelector on nodes it
// just created). Neither module's DOM needs to nest inside the other's, so
// the two strategies never conflict — they only need to share one
// `document.getElementById`, one `result`/`onboarding` pair, and one stage.

import { describe, it, expect, vi } from 'vitest';
import { makeClassList } from './helpers/dom.js';
import { initPairShareUI } from '../ui/pairShare.js';
import {
  DYAD_RELATION_NODES, DYAD_AXIS_IDS,
  initDyadUI, open as openDyad, close as closeDyad, submitSecond,
  isOpen as isDyadOpen, currentRelation as dyadCurrentRelation,
  compareAnother as dyadCompareAnother,
} from '../ui/dyad.js';
import { initReadingsUI } from '../ui/readings.js';
import { initMeaningsUI } from '../ui/meanings.js';
import { CELL_KEYS } from '../ui/tiers.js';
import { ROW_TITLES } from '../ui/sheet.js';
import { validateBirthInput } from '../ui/profile.js';
import { buildProfile } from '../core/profile.js';

const A = buildProfile('specimen a', '2000-01-01');
const B = buildProfile('specimen b', '1988-06-15');

// ── a richer node: real (flat) innerHTML + querySelector, for readings' own
//    generated markup, PLUS the id/attr/listener surface dyad.js needs ──
function splitTop(str, sep) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of str) {
    if (ch === '[') depth++; else if (ch === ']') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}
function parseSimple(sel) {
  const parsed = { tag: '', id: '', classes: [], attrs: [] };
  const rest = sel
    .replace(/:not\([^)]*\)/g, '')
    .replace(/\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?\]/g, (_, key, dq, sq) => {
      parsed.attrs.push([key, dq !== undefined ? dq : (sq !== undefined ? sq : null)]);
      return '';
    });
  for (const m of rest.matchAll(/([#.]?)([\w-]+)/g)) {
    if (m[1] === '#') parsed.id = m[2];
    else if (m[1] === '.') parsed.classes.push(m[2]);
    else parsed.tag = m[2];
  }
  return parsed;
}
function attrValue(node, key) {
  if (key in node.attrs) return node.attrs[key];
  return node[key];
}
function matches(node, parsed) {
  if (!node || !node.classList) return false;
  if (parsed.tag && node.tag !== parsed.tag) return false;
  if (parsed.id && node.id !== parsed.id) return false;
  for (const cls of parsed.classes) if (!node.classList.contains(cls)) return false;
  for (const [key, value] of parsed.attrs) {
    const actual = attrValue(node, key);
    if (actual === undefined || actual === null || actual === false) return false;
    if (value !== null && String(actual) !== value) return false;
  }
  return true;
}
function descendants(node, out = []) {
  for (const child of node.children) { out.push(child); descendants(child, out); }
  return out;
}
function selectAll(root, selector) {
  const found = [];
  for (const group of splitTop(selector, ',')) {
    let scope = [root];
    for (const parsed of splitTop(group, ' ').map(parseSimple)) {
      const next = [];
      for (const node of scope) {
        for (const cand of descendants(node)) {
          if (matches(cand, parsed) && !next.includes(cand)) next.push(cand);
        }
      }
      scope = next;
    }
    for (const node of scope) if (!found.includes(node)) found.push(node);
  }
  return found;
}

let ACTIVE_DOCUMENT = null; // for .focus() to record document.activeElement

function makeNode(tag = 'div') {
  const handlers = {};
  const node = {
    tag, id: '', attrs: {}, children: [], parentNode: null,
    textContent: '', value: '', hidden: false, disabled: false,
    focusCalls: [], scrollCalls: [],
    classList: makeClassList(),
    style: { setProperty() {}, removeProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    addEventListener(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
    // dyad.js's own harness convention: `.listeners.click()` fires the most
    // recently bound handler for that type — kept for drop-in parity with
    // the dyad-only test suite's own idiom.
    get listeners() {
      const proxy = {};
      for (const t of Object.keys(handlers)) proxy[t] = (...args) => handlers[t].forEach(fn => fn(...args));
      return proxy;
    },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    append(...kids) { for (const k of kids) this.appendChild(k); },
    replaceChildren(...kids) { this.children = []; for (const k of kids) this.appendChild(k); },
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); },
    focus(opts) { this.focusCalls.push(opts); if (ACTIVE_DOCUMENT) ACTIVE_DOCUMENT.activeElement = this; },
    scrollIntoView(opts) { this.scrollCalls.push(opts); },
    querySelector(sel) { return selectAll(this, sel)[0] || null; },
    querySelectorAll(sel) { return selectAll(this, sel); },
    closest(sel) {
      const parsedList = splitTop(sel, ',').map(parseSimple);
      let cursor = this;
      while (cursor) {
        if (parsedList.some(p => matches(cursor, p))) return cursor;
        cursor = cursor.parentNode;
      }
      return null;
    },
  };
  Object.defineProperty(node, 'innerHTML', {
    get() { return ''; },
    set(markup) {
      node.children = [];
      for (const m of String(markup).matchAll(/<(\w+)[^>]*\sid="([\w-]+)"/g)) {
        const child = makeNode(m[1]);
        child.id = m[2];
        node.appendChild(child);
      }
    },
  });
  return node;
}

// Minimal on-device raster environment for ui/pairShare.js's real
// svgToPngBlob() pipeline, scoped to this file. `deferRaster:true` holds
// every Image load open (one release function per construction, in
// `rasterLog.pendingImages`) so a test can prove what happens to a STILL-
// PENDING render when the relation is cleared/changed underneath it —
// tests/pair_share.test.js's own hand-built controller unit tests already
// cover this in isolation; what's new here is driving it through the REAL
// ui/dyad.js clearOutput()/render() call sites (Compare Another, Back, and
// Previous Readings' closeActiveScreens), not a simulated hook call.
function installRasterEnv({ deferRaster = false } = {}) {
  const rasterLog = { created: [], revoked: [], anchors: [], pendingImages: [] };
  class MockBlob { constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type; } }
  globalThis.Blob = MockBlob;
  let seq = 0;
  const realURL = globalThis.URL;
  globalThis.URL = {
    ...realURL,
    createObjectURL: () => { const u = `blob:mock/${++seq}`; rasterLog.created.push(u); return u; },
    revokeObjectURL: u => { rasterLog.revoked.push(u); },
  };
  globalThis.Image = class {
    constructor() { this.onload = null; this.onerror = null; }
    set src(v) {
      this._src = v;
      const fire = () => { if (this.onload) this.onload(); };
      if (deferRaster) rasterLog.pendingImages.push(fire); else fire();
    }
    get src() { return this._src; }
  };
  return rasterLog;
}

function buildIntegrationHarness({ rasterLog } = {}) {
  const byId = new Map();
  const byAttr = new Map();

  // ── dyad's own screen: pre-registered by id, the proven flat approach ──
  const dyadRoot = makeNode('section');
  dyadRoot.id = 'dyad-screen';
  dyadRoot.classList.add('hidden');
  dyadRoot.querySelector = sel => byAttr.get(sel) || dyadRoot.children.find(c => matches(c, parseSimple(sel))) || null;
  byId.set('dyad-screen', dyadRoot);

  const dyadIds = [
    'dyad-output', 'dyad-error', 'dyad-head-a', 'dyad-head-b', 'dyad-relation',
    'dyad-name-input', 'dyad-dob-input', 'dyad-time-input',
    'dyad-city-input', 'dyad-city-suggestions', 'dyad-polar-message',
    'dyad-name-error', 'dyad-dob-error', 'dyad-form', 'dyad-back',
    'dyad-spine', 'dyad-spine-wrap', 'dyad-sheets',
    'dyad-labels-toggle', 'dyad-meaning-hint', 'dyad-meaning-panel',
    'dyad-meaning-head', 'dyad-meaning-derivation', 'dyad-meaning-title', 'dyad-meaning-body',
    'dyad-meaning-context-head', 'dyad-meaning-context', 'dyad-meaning-relation-head',
    'dyad-meaning-relation', 'dyad-meaning-close',
    'dyad-heading', 'dyad-scope', 'dyad-signature',
    'dyad-side-select', 'dyad-side-a', 'dyad-side-b',
    'dyad-relation-failure', 'dyad-relation-retry',
    'dyad-share-disclosure', 'dyad-share-btn', 'dyad-share-status', 'dyad-compare-btn',
    ...DYAD_AXIS_IDS,
    ...Object.keys(DYAD_RELATION_NODES),
  ];
  for (const id of dyadIds) if (!byId.has(id)) byId.set(id, makeNode());

  for (const prefix of ['a', 'b']) {
    for (const key of CELL_KEYS) {
      const cellRoot = makeNode('span');
      const cell = makeNode('span');
      cell.closest = sel => (sel === '.coord-cell' ? cellRoot : null);
      cellRoot.closest = sel => (/coord-cell/.test(sel) && (!/has-detail/.test(sel) || cellRoot.classList.contains('has-detail')) ? cellRoot : null);
      byAttr.set(`[data-sheet-cell="${prefix}:${key}"]`, cell);
    }
    for (const attr of ['title', 'catalog', 'name', 'type', 'habit', 'note',
      'families', 'antifit', 'roleline', 'public-bridge', 'face', 'entry', 'public']) {
      if (attr === 'title') {
        for (const lead of Object.keys(ROW_TITLES)) byAttr.set(`[data-sheet-title="${prefix}:${lead}"]`, makeNode());
      } else {
        byAttr.set(`[data-sheet-${attr}="${prefix}"]`, makeNode());
      }
    }
  }

  // ── shared top-level screens (the real production wiring: index.html
  //    passes the SAME `result` node to both dyad's onOpen/onExit hooks and
  //    readings' refs.result) ──
  const onboarding = makeNode('section');
  const result = makeNode('section');
  result.classList.add('hidden');
  const stage = makeNode('main');
  stage.classList.add('stage');

  const docListeners = {};
  const document_ = {
    activeElement: null,
    body: makeNode('body'),
    head: makeNode('head'),
    getElementById: id => byId.get(id) || null,
    addEventListener: (ev, fn, opts) => { docListeners[ev] = { fn, capture: opts === true || !!(opts && opts.capture) }; },
    createElement: tag => {
      if (tag === 'canvas' && rasterLog) {
        const canvas = {
          tag, width: 0, height: 0,
          getContext: () => ({ drawImage: () => {} }),
          toBlob: cb => cb(new globalThis.Blob(['png-bytes'], { type: 'image/png' })),
        };
        return canvas;
      }
      const n = makeNode(tag);
      const original = n.setAttribute.bind(n);
      n.setAttribute = (k, v) => { if (k === 'id') byId.set(v, n); original(k, v); };
      if (tag === 'a' && rasterLog) {
        n.click = () => { rasterLog.anchors.push(n); };
      }
      return n;
    },
    createTextNode: text => { const n = makeNode('#text'); n.textContent = String(text); return n; },
  };
  ACTIVE_DOCUMENT = document_;
  globalThis.document = document_;

  // Deferred-closure wiring (index.html's own pattern, reproduced verbatim):
  // initPairShareUI needs to exist before initDyadUI's onRelationChange hook
  // can call it, but it also needs the DOM refs initDyadUI's own SCREEN_HTML
  // injects — so the hook reads `pairShareController` at CALL time, not
  // construction time, and pairShareController is assigned only after both
  // modules are up.
  let pairShareController = null;

  initDyadUI({ stage, controls: makeNode() }, {
    getProfile: () => A,
    getTier: () => 't5',
    validateEntry: validateBirthInput,
    buildSecond: payload => buildProfile(payload.name, payload.dob, payload),
    getNoteSlot: () => 'mid',
    getPublicRead: () => null,
    onOpen: () => { meaningsUI.close(); result.classList.add('hidden'); },
    onExit: () => result.classList.remove('hidden'),
    onLabelsChange: () => {},
    onRelationChange: relation => { if (pairShareController) pairShareController.notifyRelationChange(relation); },
  });

  // ── the host meaning panel (ui/meanings.js) — REAL, not stubbed ──
  const cardFace = makeNode('article');
  const meaningsUI = initMeaningsUI({ cardFace, readingPane: null });

  // ── the Pair Imprint (ui/pairShare.js) — REAL, wired exactly like
  //    index.html: getRelation reads ui/dyad.js's own currentRelation
  //    export directly (a hook, never an import into pairShare.js itself —
  //    the isolation boundary that module's own header documents); only
  //    built when this harness was asked for the raster environment (most
  //    existing tests here never touch it) ──
  if (rasterLog) {
    pairShareController = initPairShareUI(
      { btn: byId.get('dyad-share-btn'), status: byId.get('dyad-share-status'), disclosure: byId.get('dyad-share-disclosure') },
      { getRelation: () => dyadCurrentRelation() },
    );
  }

  // ── previous readings (ui/readings.js) — REAL, sharing onboarding/result ──
  const openBtn = makeNode('button');
  const saveBtn = makeNode('button');
  const saveStatus = makeNode('p');
  const readingsUI = initReadingsUI(
    { openBtn, saveBtn, saveStatus, onboarding, result, stage },
    {
      getCurrentProfile: () => null,
      closeActiveScreens: () => {
        // The EXACT wiring index.html uses (index.html's own comment,
        // reproduced verbatim as the contract under test).
        meaningsUI.close();
        if (isDyadOpen()) { closeDyad(); result.classList.remove('hidden'); }
      },
    },
  );

  function get(id) { return byId.get(id); }
  function cell(prefix, key) { return byAttr.get(`[data-sheet-cell="${prefix}:${key}"]`); }
  function withDom(fn) {
    const prior = globalThis.document;
    globalThis.document = document_;
    try { return fn(); } finally { globalThis.document = prior; }
  }

  return {
    get, cell, withDom, document: document_, result, onboarding, stage, openBtn, cardFace, meaningsUI, readingsUI,
    pairShareController,
  };
}

describe('D2 — Pair -> Previous Readings -> return, over REAL modules (audit D2)', () => {
  it('opening Previous Readings while Pair is active closes Pair for real: B is gone, both meaning panels are gone, and it cannot stack', () => {
    const h = buildIntegrationHarness();

    // Land a real pair.
    h.withDom(() => openDyad());
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });
    expect(h.withDom(() => isDyadOpen())).toBe(true);
    expect(h.get('dyad-head-b').textContent).toBe(B.firstName);
    expect(h.cell('b', 'arcana').textContent).toBe(B.birthCard.label);

    // Open the HOST meaning panel too (a real reading the device owner
    // opened on their own sheet), so its clearing is genuinely exercised —
    // ui/meanings.js's own buildPanelMarkup ids, not the dyad-prefixed ones.
    h.cardFace.querySelector('#meaning-body').textContent = 'a host reading that must not survive';
    h.cardFace.querySelector('#meaning-panel').classList.add('open');

    // Open Previous Readings — the real openPage(), calling the REAL
    // closeActiveScreens hook (meaningsUI.close() + isDyadOpen()/closeDyad()
    // + result.classList.remove('hidden')), not a stub. ui/meanings.js's
    // close() defers its blank 300ms past the panel's own collapse
    // transition (the same convention ui/dyad.js's own paired panel
    // follows) — fake timers make that deterministic rather than racing a
    // real 300ms wait.
    vi.useFakeTimers();
    h.withDom(() => { h.openBtn.listeners.click(); vi.advanceTimersByTime(310); });
    vi.useRealTimers();

    // Pair is closed — not open, and cannot be reopened as "still there."
    expect(h.withDom(() => isDyadOpen())).toBe(false);
    // B's name and B's coordinate cells are gone from DOM — visible AND
    // hidden alike (F1's "hidden is not deletion" standard).
    expect(h.get('dyad-head-b').textContent).toBe('');
    expect(h.cell('b', 'arcana').textContent).toBe('');
    expect(h.cell('b', 'sun').textContent).toBe('');
    // The paired panel (ui/dyad.js's own) is blanked — same F1 standard.
    expect(h.get('dyad-meaning-body').textContent).toBe('');
    expect(h.get('dyad-meaning-head').textContent).toBe('');
    // The HOST panel (ui/meanings.js) is ALSO closed and blanked — the
    // "both meaning panels" half of the audit's requirement, proven
    // against the real module, not a mock.
    expect(h.cardFace.querySelector('#meaning-body').textContent).toBe('');
    expect(h.cardFace.querySelector('#meaning-panel').classList.contains('open')).toBe(false);
    // Previous Readings is now the one visible screen (both product
    // screens correctly hidden beneath it — test 2 below proves closing it
    // again lands back on the sheet, not a stale onboarding fallback).
    expect(h.result.classList.contains('hidden')).toBe(true);
    expect(h.onboarding.classList.contains('hidden')).toBe(true);
    // Focus landed on a REAL, visible control — readings.js's own heading —
    // not stranded on anything inside the now-closed Pair screen.
    expect(h.document.activeElement).not.toBeNull();
    expect(h.document.activeElement.tag).toBe('h1');
    expect(h.document.activeElement.id).toBe('readings-title');
  });

  it('closing Previous Readings afterward returns to the sheet, not a stale onboarding fallback', () => {
    const h = buildIntegrationHarness();
    h.withDom(() => openDyad());
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });
    h.withDom(() => h.openBtn.listeners.click());
    // Drive the real "back" control readings.js injected into its own page.
    const page = h.stage.children.find(c => c.querySelector && c.querySelector('#readings-back'));
    const back = page && page.querySelector('#readings-back');
    expect(back).toBeTruthy();
    h.withDom(() => back.listeners.click());
    expect(h.result.classList.contains('hidden')).toBe(false);
    expect(h.onboarding.classList.contains('hidden')).toBe(true);
  });

  it('a host with Pair NOT active opens Previous Readings exactly as before — no crash, no unexpected close', () => {
    const h = buildIntegrationHarness();
    expect(h.withDom(() => isDyadOpen())).toBe(false);
    expect(() => h.withDom(() => h.openBtn.listeners.click())).not.toThrow();
  });
});

// Eighth remediation gate: the real production null-relation notification
// paths (Compare Another, Back to My Sheet, and Previous Readings closing
// Pair — all three resolve through ui/dyad.js's ONE clearOutput(), which
// calls hooks.onRelationChange(null)) driven against a REAL ui/pairShare.js
// controller, with a raster genuinely held in flight when each fires — not
// a simulated hook call into a hand-built controller (tests/pair_share.
// test.js already covers that in isolation) and not a mock standing in for
// re-init retirement (a different lifecycle event this module also has,
// covered separately). Proves: (a) the pending prerender's eventual
// settlement is a no-op against the cleared/replaced cache — no cross-
// screen effect, since ui/pairShare.js only ever touches its own two
// injected refs; (b) the button/status DOM genuinely returns to idle, not
// stuck disabled/busy from an operation that no longer has anything to
// report.
describe('eighth remediation gate — real onRelationChange(null) notification paths against a live pairShare controller', () => {
  function landPair(h) {
    h.withDom(() => openDyad());
    h.withDom(() => {
      h.get('dyad-name-input').value = 'specimen b';
      h.get('dyad-dob-input').value = '1988-06-15';
      return submitSecond();
    });
  }

  it('Compare Another: the pending prerender for the closed pair settles as a no-op; the button/status return to idle, not stuck busy', () => {
    const rasterLog = installRasterEnv({ deferRaster: true });
    const h = buildIntegrationHarness({ rasterLog });
    landPair(h);
    // render() -> onRelationChange(relation) -> notifyRelationChange starts
    // a real proactive prerender, held.
    expect(rasterLog.pendingImages).toHaveLength(1);
    expect(h.get('dyad-share-btn').disabled).toBe(true); // syncBusyFromPrerender reflects the pending render
    expect(h.get('dyad-share-status').textContent).toBe('preparing pair image…');

    h.withDom(() => dyadCompareAnother()); // real function — clearOutput() -> onRelationChange(null)

    // Idle DOM: nothing left pending to disable the button or explain a
    // busy state for.
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);

    // The stale render settles afterward — it must remain a no-op: no
    // status text reappears, the button stays idle. (ui/pairShare.js's own
    // notifyRelationChange() checks `controller.cache !== entry` before
    // writing a settled promise's result — proven here through the REAL
    // clearOutput() call site, not a simulated one.)
    rasterLog.pendingImages[0]();
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
  });

  it('Back to My Sheet: same real clearOutput() path, same idle-DOM/no-cross-effect proof', () => {
    const rasterLog = installRasterEnv({ deferRaster: true });
    const h = buildIntegrationHarness({ rasterLog });
    landPair(h);
    expect(rasterLog.pendingImages).toHaveLength(1);

    h.withDom(() => closeDyad()); // the real "back to my sheet" exit path

    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
    rasterLog.pendingImages[0]();
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
  });

  it('Previous Readings closing Pair (the real closeActiveScreens hook): pairShare returns to idle, and Previous Readings\' own screen is completely unaffected by it', () => {
    const rasterLog = installRasterEnv({ deferRaster: true });
    const h = buildIntegrationHarness({ rasterLog });
    landPair(h);
    expect(rasterLog.pendingImages).toHaveLength(1);

    // The real UI activation, same as the D2 tests above — opens Previous
    // Readings, which closes Pair through the real closeActiveScreens hook.
    vi.useFakeTimers();
    h.withDom(() => { h.openBtn.listeners.click(); vi.advanceTimersByTime(310); });
    vi.useRealTimers();

    expect(h.withDom(() => isDyadOpen())).toBe(false);
    // pairShare's own refs, idle — the cross-screen proof: closing Pair via
    // a DIFFERENT screen's own control still reaches the real
    // clearOutput()/onRelationChange(null) path, and touches nothing of
    // Previous Readings' own DOM in the process (it only ever writes to the
    // two refs it was handed at init).
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
    // Previous Readings is the one visible screen, its own heading focused —
    // unperturbed by the pairShare settlement below.
    expect(h.result.classList.contains('hidden')).toBe(true);
    expect(h.document.activeElement.id).toBe('readings-title');

    rasterLog.pendingImages[0](); // the stale prerender settles afterward
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
    // Still no cross-screen effect: Previous Readings' own ownership is
    // exactly as it was before the stale render settled.
    expect(h.result.classList.contains('hidden')).toBe(true);
    expect(h.document.activeElement.id).toBe('readings-title');
  });

  it('a resolved (not held) prerender still lands correctly through the real render() -> onRelationChange(relation) path — the baseline this file\'s raster env is proven against', async () => {
    const rasterLog = installRasterEnv({ deferRaster: false });
    const h = buildIntegrationHarness({ rasterLog });
    landPair(h);
    // No pendingImages recorded — deferRaster:false fires the Image's
    // onload synchronously, proving the mock's default path (used
    // implicitly by every OTHER test in this file, which never inspects
    // pairShare state) is itself sane. The Blob it produces still only
    // resolves the underlying Promise on the next microtask (Promise
    // semantics, not this mock's choice), so a flush is genuinely needed
    // before the cache is warm.
    expect(rasterLog.pendingImages).toHaveLength(0);
    await Promise.resolve(); await Promise.resolve();
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
  });
});
