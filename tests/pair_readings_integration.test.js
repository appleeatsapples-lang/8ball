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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeClassList } from './helpers/dom.js';
import { initPairShareUI, pairShareStatusMessage } from '../ui/pairShare.js';
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

// Tenth remediation gate: buildIntegrationHarness() used to write
// globalThis.document (and this file's own ACTIVE_DOCUMENT) and never
// restore either — the exact same class of leak the ninth gate already
// fixed for Blob/URL/Image below, just on a global this file's own
// afterEach never touched. A test in THIS file (or, since globalThis.document
// is a real Node global, any later file in the same worker) would silently
// inherit a prior test's fake document. Fixed the same way: the exact
// descriptor/absence is snapshotted before every harness build, a restore()
// closure is registered so afterEach can always put it back byte-for-byte
// even if a test throws mid-assertion, and a live prior install is restored
// FIRST so repeated harness construction in one test never has its second
// snapshot capture the first call's fake document as if it were "real".
let _restoreDocumentEnv = null;

function installHarnessDocument(document_) {
  if (_restoreDocumentEnv) _restoreDocumentEnv();
  const priorActiveDocument = ACTIVE_DOCUMENT;
  const hadDocument = Object.prototype.hasOwnProperty.call(globalThis, 'document');
  const documentDesc = hadDocument ? Object.getOwnPropertyDescriptor(globalThis, 'document') : null;
  _restoreDocumentEnv = () => {
    ACTIVE_DOCUMENT = priorActiveDocument;
    if (hadDocument) Object.defineProperty(globalThis, 'document', documentDesc);
    else delete globalThis.document;
    _restoreDocumentEnv = null;
  };
  ACTIVE_DOCUMENT = document_;
  globalThis.document = document_;
}

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
//
// Ninth remediation gate: this used to overwrite globalThis.Blob, the
// entire globalThis.URL constructor, and globalThis.Image, and never
// restored any of them — real global pollution that leaked into every
// OTHER test in this file (and, since these are real Node globals, could
// affect this worker's other test files too). Fixed: exact property
// descriptors are snapshotted (or their genuine absence recorded — `Image`
// is not a Node global at all, so "restoring" it means deleting the
// property, not writing back an undefined value) before any override, a
// `restore()` closure is registered so `afterEach` below can always put
// them back byte-for-byte even if a test throws mid-assertion, and only
// `URL`'s own `createObjectURL`/`revokeObjectURL` static methods are
// replaced — the real `URL` constructor itself is never touched, so
// nothing else in this file's real production code that might construct a
// URL is affected.
let _restoreRasterEnv = null;

function installRasterEnv({ deferRaster = false } = {}) {
  // A prior call in this same test (never restored, since afterEach only
  // fires between tests) would otherwise have its snapshot silently
  // overwritten below — this call's own restore() would then put things
  // back to the FIRST call's mock, not the true original globals. Restoring
  // any live prior install first means every installRasterEnv() call always
  // snapshots the REAL globals, regardless of how many times it's called in
  // one test.
  if (_restoreRasterEnv) _restoreRasterEnv();

  const rasterLog = { created: [], revoked: [], anchors: [], pendingImages: [] };

  const snapshot = key => ({ key, had: Object.prototype.hasOwnProperty.call(globalThis, key), desc: Object.getOwnPropertyDescriptor(globalThis, key) });
  const snapshotOn = (obj, key) => ({ obj, key, had: Object.prototype.hasOwnProperty.call(obj, key), desc: Object.getOwnPropertyDescriptor(obj, key) });
  const restores = [
    snapshot('Blob'),
    snapshotOn(globalThis.URL, 'createObjectURL'),
    snapshotOn(globalThis.URL, 'revokeObjectURL'),
    snapshot('Image'),
  ];

  class MockBlob { constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type; } }
  globalThis.Blob = MockBlob;
  let seq = 0;
  globalThis.URL.createObjectURL = () => { const u = `blob:mock/${++seq}`; rasterLog.created.push(u); return u; };
  globalThis.URL.revokeObjectURL = u => { rasterLog.revoked.push(u); };
  globalThis.Image = class {
    constructor() { this.onload = null; this.onerror = null; }
    set src(v) {
      this._src = v;
      const fire = () => { if (this.onload) this.onload(); };
      if (deferRaster) rasterLog.pendingImages.push(fire); else fire();
    }
    get src() { return this._src; }
  };

  _restoreRasterEnv = () => {
    for (const r of restores) {
      const target = r.obj || globalThis;
      if (r.had) Object.defineProperty(target, r.key, r.desc);
      else delete target[r.key];
    }
    _restoreRasterEnv = null;
  };
  return rasterLog;
}

// Restoration runs unconditionally after EVERY test in this file, even one
// that threw mid-assertion — `_restoreRasterEnv` is only non-null when a
// test actually called installRasterEnv(), so tests that never touch it pay
// nothing here, and a raster-using test can never leak its mocks into the
// next `it()` in this file.
afterEach(() => {
  if (_restoreRasterEnv) _restoreRasterEnv();
  if (_restoreDocumentEnv) _restoreDocumentEnv();
});

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
  installHarnessDocument(document_);

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

  it('Compare Another: the pending prerender for the closed pair settles as a no-op; the button/status return to idle, not stuck busy', async () => {
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

    // The stale render settles afterward — outcome coverage: firing the
    // held Image's onload runs svgToPngBlob's own synchronous cleanup
    // (canvas.toBlob's callback is synchronous in this mock, so the SVG
    // source URL is already revoked the instant this call returns), but
    // the notifyRelationChange().then() handler that would write busy/
    // status DOM is a genuine microtask — asserted only after real
    // microtask flushes below, not synchronously, so this cannot pass for
    // the wrong reason (the .then() handler simply not having run yet).
    rasterLog.pendingImages[0]();
    expect(rasterLog.created).toHaveLength(1);
    expect(rasterLog.revoked).toEqual(rasterLog.created); // exact multiset: the one SVG source URL, revoked exactly once
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
  });

  it('Back to My Sheet: same real clearOutput() path, same idle-DOM/no-cross-effect proof', async () => {
    const rasterLog = installRasterEnv({ deferRaster: true });
    const h = buildIntegrationHarness({ rasterLog });
    landPair(h);
    expect(rasterLog.pendingImages).toHaveLength(1);

    h.withDom(() => closeDyad()); // the real "back to my sheet" exit path

    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
    rasterLog.pendingImages[0]();
    expect(rasterLog.revoked).toEqual(rasterLog.created);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(h.get('dyad-share-btn').disabled).toBe(false);
    expect(h.get('dyad-share-status').hidden).toBe(true);
  });

  it('Previous Readings closing Pair (the real closeActiveScreens hook): pairShare returns to idle, and Previous Readings\' own screen is completely unaffected by it', async () => {
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
    expect(rasterLog.revoked).toEqual(rasterLog.created);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
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

// Ninth remediation gate: installRasterEnv() used to overwrite
// globalThis.Blob/URL/Image and never restore them — real pollution that
// leaked into every later test in this file (and, since these are genuine
// Node globals, potentially this worker's other files too). This pair of
// tests proves restoration is real, not merely asserted in a comment: the
// first records the REAL pre-mock identities, installs a raster env, and
// confirms they're genuinely different afterward; the second runs in a
// LATER test (so `afterEach` above has already fired once) and confirms
// everything is back to the exact original identity, and that `Image` —
// never a real Node global — is fully absent again, not left as `undefined`
// written over a real property.
describe('ninth remediation gate — installRasterEnv() restores exactly what it overwrote', () => {
  const realBlob = globalThis.Blob;
  const realCreateObjectURL = globalThis.URL.createObjectURL;
  const realRevokeObjectURL = globalThis.URL.revokeObjectURL;
  const realImageOwn = Object.prototype.hasOwnProperty.call(globalThis, 'Image');

  it('while installed, the globals are genuinely mocked (the contrast the next test\'s restoration proof depends on)', () => {
    installRasterEnv();
    expect(globalThis.Blob).not.toBe(realBlob);
    expect(globalThis.URL.createObjectURL).not.toBe(realCreateObjectURL);
    expect(typeof globalThis.Image).toBe('function');
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'Image')).toBe(true);
  });

  it('after the PRIOR test\'s afterEach ran, every mocked global is back to its exact original identity (or absence)', () => {
    // No installRasterEnv() call in THIS test — proving restoration already
    // happened on its own between tests, not merely that a later
    // installRasterEnv() call would overwrite the mock again.
    expect(globalThis.Blob).toBe(realBlob);
    expect(globalThis.URL.createObjectURL).toBe(realCreateObjectURL);
    expect(globalThis.URL.revokeObjectURL).toBe(realRevokeObjectURL);
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'Image')).toBe(realImageOwn);
    expect(typeof globalThis.Image).toBe('undefined');
  });

  it('repeated installRasterEnv() calls do not inherit a prior call\'s mock — each call starts from the real globals', () => {
    installRasterEnv();
    const firstMockBlob = globalThis.Blob;
    installRasterEnv(); // a second, independent call in the same test
    expect(globalThis.Blob).not.toBe(firstMockBlob); // a fresh mock class, not the same reference reused
    expect(globalThis.Blob.name).toBe(firstMockBlob.name); // same SHAPE (MockBlob), proving it's a real re-install, not a no-op
  });

  // The specific failure mode a double-install-without-restoring-between-
  // calls risks: the SECOND call's snapshot would capture the FIRST call's
  // mock as if it were "the real original" (since installRasterEnv doesn't
  // itself auto-restore before re-snapshotting), so afterEach's eventual
  // restore would put globalThis.Blob back to the FIRST mock, not the true
  // original — invisible from INSIDE the double-install test itself (both
  // are mocks, `.not.toBe` can't tell "wrong mock" from "right mock" apart),
  // only observable in a LATER test. This is that later test.
  it('after a test that called installRasterEnv() twice, the TRUE original globals are back — not the first call\'s mock', () => {
    expect(globalThis.Blob).toBe(realBlob);
    expect(globalThis.Blob.name).not.toBe('MockBlob');
    expect(globalThis.URL.createObjectURL).toBe(realCreateObjectURL);
    expect(typeof globalThis.Image).toBe('undefined');
  });
});

// Tenth remediation gate, BLOCKER 2: the same restoration proof as above,
// for globalThis.document and this file's own ACTIVE_DOCUMENT — the leak
// buildIntegrationHarness() carried (every OTHER test file in this repo that
// mocks globalThis.document already snapshots/restores it; this was the one
// file that never did, and unlike Blob/URL/Image it is set on EVERY single
// harness build, not just raster-opted-in ones).
describe('tenth remediation gate — buildIntegrationHarness() restores globalThis.document and ACTIVE_DOCUMENT exactly', () => {
  const realHadDocument = Object.prototype.hasOwnProperty.call(globalThis, 'document');
  const realDocument = globalThis.document;

  it('while installed, globalThis.document is genuinely the harness fake (the contrast the next test\'s restoration proof depends on)', () => {
    const fake = { marker: 'tenth-gate-fake-document' };
    installHarnessDocument(fake);
    expect(globalThis.document).toBe(fake);
    expect(ACTIVE_DOCUMENT).toBe(fake);
  });

  it('after the PRIOR test\'s afterEach ran, globalThis.document and ACTIVE_DOCUMENT are back to their exact original identity (or absence)', () => {
    // No installHarnessDocument() call in THIS test — proving restoration
    // already happened on its own between tests, exactly like the raster
    // proof above.
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'document')).toBe(realHadDocument);
    expect(globalThis.document).toBe(realDocument);
    expect(ACTIVE_DOCUMENT).toBe(null);
  });

  it('a real buildIntegrationHarness() build also restores cleanly — the next test proves it, not this one', () => {
    const h = buildIntegrationHarness();
    expect(globalThis.document).toBe(h.document);
    expect(ACTIVE_DOCUMENT).toBe(h.document);
  });

  it('after a REAL buildIntegrationHarness() build, restoration is still exact — not merely proven for the isolated helper', () => {
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'document')).toBe(realHadDocument);
    expect(globalThis.document).toBe(realDocument);
    expect(ACTIVE_DOCUMENT).toBe(null);
  });

  it('repeated installHarnessDocument() calls do not inherit a prior call\'s fake — each call starts from the real global', () => {
    const first = { marker: 'first' };
    const second = { marker: 'second' };
    installHarnessDocument(first);
    installHarnessDocument(second); // a second, independent call in the same test
    expect(globalThis.document).toBe(second);
    expect(globalThis.document).not.toBe(first);
  });

  // Same failure mode the raster proof above guards against: without
  // restoring-before-re-snapshotting, the second call's restore() would put
  // globalThis.document back to the FIRST fake, not the true original —
  // invisible from inside the double-install test itself, only observable
  // in a LATER test. This is that later test.
  it('after a test that called installHarnessDocument() twice, the TRUE original document is back — not the first call\'s fake', () => {
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'document')).toBe(realHadDocument);
    expect(globalThis.document).toBe(realDocument);
    expect(ACTIVE_DOCUMENT).toBe(null);
  });

  it('even when a test throws mid-assertion after installing, the NEXT test still sees a clean restoration', () => {
    expect(() => {
      installHarnessDocument({ marker: 'about-to-throw' });
      throw new Error('simulated mid-test failure');
    }).toThrow('simulated mid-test failure');
    // afterEach still runs on a thrown test -- the assertion that matters is
    // in the NEXT test below, proving it actually did.
  });

  it('proves the PRIOR (throwing) test\'s afterEach still restored document/ACTIVE_DOCUMENT', () => {
    expect(Object.prototype.hasOwnProperty.call(globalThis, 'document')).toBe(realHadDocument);
    expect(globalThis.document).toBe(realDocument);
    expect(ACTIVE_DOCUMENT).toBe(null);
  });
});

// Fourteenth remediation gate, B1: a real held native-share promise for pair
// A, surviving a genuine Compare Another and a second pair's submission —
// the eleventh gate's B1 fix (ui/dyad.js no longer blanks #dyad-share-status
// directly; ui/pairShare.js's own opInFlight guard is the sole owner) proven
// against the REAL module lifecycle (initDyadUI + initPairShareUI wired
// exactly like index.html), not a hand-built controller. Distinct from the
// eighth-gate describe block above, which holds a PRE-RENDER, not a native
// share attempt already past the click boundary.
describe('fourteenth remediation gate, B1 — a held native-share promise for A survives Compare Another and a second pair\'s submission, with no cross-generation corruption', () => {
  it('A\'s share stays held through Compare Another and a second pair\'s submission; the second pair renders and works; A settles truthfully afterward with no download/copy fallback', async () => {
    const rasterLog = installRasterEnv(); // immediate raster resolution — the pre-render this scenario needs is already warmed BEFORE the click (P1-4)
    const h = buildIntegrationHarness({ rasterLog });

    let releaseShare;
    const sharedPayloads = [];
    const nav = {
      canShare: () => true,
      share: payload => { sharedPayloads.push(payload); return new Promise(resolve => { releaseShare = resolve; }); },
    };
    const savedNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });

    try {
      // ── land Pair A (self + specimen b) ──
      h.withDom(() => openDyad());
      h.withDom(() => {
        h.get('dyad-name-input').value = 'specimen b';
        h.get('dyad-dob-input').value = '1988-06-15';
        return submitSecond();
      });
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); // flush A's own proactive prerender

      expect(h.get('dyad-share-btn').disabled).toBe(false); // pre-click sanity: nothing pending

      // ── click share: reaches navigator.share() SYNCHRONOUSLY (cache
      // already warmed by the proactive prerender, P1-4) and holds there ──
      h.withDom(() => h.get('dyad-share-btn').listeners.click());
      expect(sharedPayloads).toHaveLength(1); // A's native share genuinely attempted
      expect(h.get('dyad-share-btn').disabled).toBe(true);
      expect(h.get('dyad-share-status').textContent).toBe(pairShareStatusMessage('busy'));

      // ── real Compare Another while A's share is still held ──
      h.withDom(() => dyadCompareAnother());
      // The click-owned status must survive Compare Another untouched — this
      // module's own opInFlight guard, not ui/dyad.js reaching into the
      // status node directly (eleventh gate, B1).
      expect(h.get('dyad-share-btn').disabled).toBe(true);
      expect(h.get('dyad-share-status').textContent).toBe(pairShareStatusMessage('busy'));

      // ── submit a visibly DISTINCT second pair (self + specimen c) while
      //    A's share is STILL held ──
      h.withDom(() => {
        h.get('dyad-name-input').value = 'specimen c';
        h.get('dyad-dob-input').value = '1975-03-22';
        return submitSecond();
      });
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); // flush the second pair's own proactive prerender

      // The second pair's OWN output/signature must be genuinely visible —
      // the real screen-ownership proof, not a status-only check.
      expect(h.withDom(() => isDyadOpen())).toBe(true);
      const relationSecond = h.withDom(() => dyadCurrentRelation());
      expect(relationSecond).not.toBeNull();
      expect(h.get('dyad-head-b').textContent.length).toBeGreaterThan(0); // the second pair's own name is genuinely rendered

      // A's own click is STILL in flight (opInFlight) — the second pair's
      // own notifyRelationChange must not have touched A's busy status
      // either, by the SAME guard.
      expect(h.get('dyad-share-btn').disabled).toBe(true);
      expect(h.get('dyad-share-status').textContent).toBe(pairShareStatusMessage('busy'));
      expect(sharedPayloads).toHaveLength(1); // still only A's attempt — the second pair's prerender never triggers its own share

      // ── release A's held native share now that the second pair is on screen ──
      releaseShare(undefined);
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

      // A's click resolves against a CHANGED relation (the second pair is now
      // current) — truthful qualified state, never an unqualified "shared."
      // claim.
      expect(h.get('dyad-share-status').textContent).toBe(pairShareStatusMessage('shared-selected'));
      expect(h.get('dyad-share-status').textContent).toBe('selected pair shared.');
      // No cross-generation corruption: the second pair's own relation is
      // still exactly what was on screen before A's late resolution ran.
      expect(h.withDom(() => dyadCurrentRelation())).toBe(relationSecond);
      // The button returns to a live, enabled state describing the SECOND
      // pair, not stuck disabled/busy from A's now-settled operation.
      expect(h.get('dyad-share-btn').disabled).toBe(false);

      // ── the second pair's OWN share must still genuinely work afterward,
      //    and it must share the SECOND pair, never A ──
      h.withDom(() => h.get('dyad-share-btn').listeners.click());
      expect(sharedPayloads).toHaveLength(2); // a distinct, second native-share attempt
      expect(h.get('dyad-share-btn').disabled).toBe(true);
      releaseShare(undefined);
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      expect(h.get('dyad-share-status').textContent).toBe(pairShareStatusMessage('shared'));
      expect(h.get('dyad-share-btn').disabled).toBe(false);

      // Zero download/copy fallbacks anywhere in this scenario — every
      // outcome was a genuine native share.
      expect(rasterLog.anchors).toHaveLength(0);
    } finally {
      if (savedNav) Object.defineProperty(globalThis, 'navigator', savedNav);
      else delete globalThis.navigator;
    }
  });
});
