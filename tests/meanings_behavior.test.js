// 8ball / tests / meanings_behavior.test.js
// ui/meanings.js + ui/labels.js run for real (2026-07-05 standards pass).
//
// tests/meanings_ui.test.js and tests/labels_reveal.test.js are source
// pins — they grep the modules as text and never execute them. This file
// closes the behavioral gap: the meanings panel open/toggle/close cycle,
// the arcana "roman · name" key split, resolved/unresolved/sealed detail,
// the Enter/Space/Escape keyboard path, and the labels toggle's class/copy/
// aria-pressed round-trip all run against hand-injected DOM mocks
// (node env, no jsdom — same convention as tests/modals.test.js).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initMeaningsUI } from '../ui/meanings.js';
import { initLabelsUI, isLabelsRevealed } from '../ui/labels.js';
import { SUN_MEANINGS, ARCANA_MEANINGS } from '../content/meanings.v1.js';
import { SECOND_PERSON_RE, voiceRegisterHits } from './helpers/voice-register.js';

const originalDocument = globalThis.document;
const originalLocalStorage = globalThis.localStorage;

function makeNode(tag = 'div') {
  const handlers = {};
  const classes = new Set();
  const node = {
    tag,
    id: '',
    attrs: {},
    dataset: {},
    children: [],
    textContent: '',
    className: '',
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, force) => { force ? classes.add(c) : classes.delete(c); },
    },
    setAttribute(k, v) { this.attrs[k] = v; },
    focused: false,
    focusCount: 0,
    focus() {
      this.focused = true;
      this.focusCount++;
      if (globalThis.document) globalThis.document.activeElement = this;
    },
    appendChild(c) { this.children.push(c); },
    addEventListener(ev, fn) { handlers[ev] = fn; },
    _fire(ev, e) { return handlers[ev] && handlers[ev](e); },
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (this._byId && this._byId[id]) return this._byId[id];
        return this.children.find(c => c.id === id) || null;
      }
      return null;
    },
  };
  // ui/meanings.js buildPanel assigns innerHTML then resolves the inner
  // nodes with querySelector('#id') — mirror that with an id-keyed map.
  Object.defineProperty(node, 'innerHTML', {
    set(v) {
      node._byId = {};
      for (const m of v.matchAll(/id="([a-z-]+)"/g)) node._byId[m[1]] = makeNode();
    },
    get() { return ''; },
  });
  return node;
}

describe('ui/meanings.js behavior', () => {
  let byId, cardFace, cells, vals;

  const coordinates = [
    ['arcana', 'coord-arcana-symbol'],
    ['element', 'coord-element-symbol'],
    ['sun', 'coord-sun-symbol'],
    ['rising', 'coord-rising-symbol'],
    ['animal', 'coord-animal-symbol'],
    ['innerAnimal', 'coord-inner-symbol'],
    ['lifePath', 'coord-lifepath-symbol'],
    ['nameNumber', 'coord-namenumber-symbol'],
    ['soulUrge', 'coord-soulurge-symbol'],
    ['personality', 'coord-personality-symbol'],
    ['birthday', 'coord-birthday-symbol'],
    ['maturity', 'coord-maturity-symbol'],
    ['dayPillar', 'coord-daypillar-symbol'],
    ['hourPillar', 'coord-hourpillar-symbol'],
  ];

  function makeCell(key, valueId) {
    const cell = makeNode('span');
    const val = makeNode('span');
    val.id = valueId;
    // .closest resolves the wrapping cell from the value span (the click
    // target) or from the cell itself.
    const closest = sel => (sel.startsWith('.coord-cell') ? cell : null);
    val.closest = closest;
    cell.closest = closest;
    return { cell, val };
  }

  let observers;
  const OriginalMO = globalThis.MutationObserver;
  beforeEach(() => {
    // Capture the card observer the module wires at init (the stale-panel
    // close path); a mock class stands in for the node-env-absent real one.
    observers = [];
    globalThis.MutationObserver = class {
      constructor(cb) { this.cb = cb; observers.push(this); }
      observe() {}
      disconnect() {}
    };
    byId = new Map();
    cardFace = makeNode('div');
    cells = {}; vals = {};
    for (const [key, id] of coordinates) {
      const { cell, val } = makeCell(key, id);
      cells[key] = cell; vals[key] = val;
      byId.set(id, val);
    }
    const docHandlers = {};
    globalThis.document = {
      getElementById: id => byId.get(id) || null,
      createElement: makeNode,
      head: { appendChild: node => { if (node.id) byId.set(node.id, node); } },
      querySelector: () => null,
      addEventListener(ev, fn) {
        docHandlers[ev] = docHandlers[ev] || [];
        docHandlers[ev].push(fn);
      },
      _fire(ev, e) {
        for (const fn of docHandlers[ev] || []) fn(e);
      },
    };
    initMeaningsUI({ cardFace });
  });
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    if (OriginalMO === undefined) delete globalThis.MutationObserver; else globalThis.MutationObserver = OriginalMO;
  });

  function panel() { return cardFace.children.find(c => c.id === 'meaning-panel'); }
  function hint() { return cardFace.children.find(c => c.id === 'meaning-hint'); }

  it('the comprehension hint ships visible, retires on first open, and holds no stored state', () => {
    // Fourteen tappable compartments whose only affordance was a desktop
    // hover (journal 2026-08-31): the hint line is the touch-and-labels-off
    // affordance. It must be present and visible before any interaction,
    // hide on the FIRST open (the affordance has done its job), stay
    // hidden through close and later opens, and never touch storage — it
    // deliberately returns on the next load instead of adding a §5 key.
    const h = hint();
    expect(h).toBeDefined();
    expect(h.hidden).toBeFalsy();
    expect(h.textContent).toBe('each compartment opens its filed meaning — tap any value');
    // Register laws on UI chrome copy, through the CANONICAL apparatus
    // (the pr216 precedent — no ad hoc second-person regex).
    expect(voiceRegisterHits(h.textContent)).toEqual([]);
    expect(SECOND_PERSON_RE.test(h.textContent)).toBe(false);
    cardFace._fire('click', { target: vals.sun });
    expect(h.hidden).toBe(true);
    cardFace._fire('click', { target: vals.sun }); // toggle closed
    expect(h.hidden).toBe(true);
    cardFace._fire('click', { target: vals.animal }); // a later open
    expect(h.hidden).toBe(true);
  });

  it('opening scrolls the panel into view after the expand transition (top-row dead-tap fix)', () => {
    // The panel sits below the card; on the tall t3 sheet a tap on a
    // top-row cell opened it ~200px under the fold and the tap read as a
    // no-op (live-fire 2026-08-30). The scroll fires AFTER the 280ms
    // max-height transition so 'nearest' sees the expanded box — and NOT
    // when the panel was closed again before the delay elapsed.
    vi.useFakeTimers();
    try {
      const scrolls = [];
      const queries = [];
      panel().scrollIntoView = opts => scrolls.push(opts);
      globalThis.matchMedia = q => { queries.push(q); return { matches: false }; };
      cardFace._fire('click', { target: vals.sun });
      // The delay must OUTLAST the 280ms max-height transition — a shorter
      // timer scrolls a collapsed box (pr212 audit: 50ms passed the old
      // pin). Not fired at 280, fired by 320.
      vi.advanceTimersByTime(280);
      expect(scrolls).toHaveLength(0);
      vi.advanceTimersByTime(40);
      expect(scrolls).toHaveLength(1);
      expect(scrolls[0]).toEqual({ block: 'nearest', behavior: 'smooth' });
      expect(queries[0]).toBe('(prefers-reduced-motion: reduce)');

      // close before the delay -> no stray scroll
      cardFace._fire('click', { target: vals.sun }); // toggles closed... reopen first
      cardFace._fire('click', { target: vals.sun }); // open again
      cardFace._fire('click', { target: vals.sun }); // and close before 300ms
      vi.advanceTimersByTime(400);
      expect(scrolls).toHaveLength(1);

      // rapid retarget within the window fires ONCE, for the final cell
      // (pr212 audit: the old handler double-fired)
      cardFace._fire('click', { target: vals.sun });
      vi.advanceTimersByTime(100);
      cardFace._fire('click', { target: vals.animal }); // retarget mid-window
      vi.advanceTimersByTime(400);
      expect(scrolls).toHaveLength(2);

      // reduced motion asks for an instant scroll
      globalThis.matchMedia = q => { queries.push(q); return { matches: true }; };
      cardFace._fire('click', { target: vals.sun });
      vi.advanceTimersByTime(320);
      expect(scrolls).toHaveLength(3);
      expect(scrolls[2].behavior).toBe('auto');
    } finally {
      delete globalThis.matchMedia;
      vi.useRealTimers();
    }
  });

  it('init marks all 14 coordinate cells interactive and keyboard-reachable', () => {
    for (const [key] of coordinates) {
      expect(cells[key].classList.contains('has-detail')).toBe(true);
      expect(cells[key].attrs.tabindex).toBe('0');
      expect(cells[key].attrs.role).toBe('button');
      expect(cells[key].attrs['aria-label']).toMatch(/ details$/);
      expect(cells[key].dataset.coordinateKey).toBe(key);
    }
    expect(panel()).toBeTruthy();
    expect(byId.get('meanings-style')).toBeTruthy(); // scoped CSS injected once
  });

  it('tapping a filled cell opens the panel with the cited entry; re-tap closes', () => {
    vals.sun.textContent = 'aries';
    const entry = SUN_MEANINGS['aries'];
    expect(entry).toBeTruthy();
    cardFace._fire('click', { target: vals.sun });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    expect(p._byId['meaning-head'].textContent).toBe('SUN');
    expect(p._byId['meaning-title'].textContent).toBe(entry.register);
    expect(p._byId['meaning-body'].textContent).toBe(entry.body);
    expect(cells.sun.classList.contains('active')).toBe(true);
    // toggle-close on the same cell
    cardFace._fire('click', { target: vals.sun });
    expect(p.classList.contains('open')).toBe(false);
    expect(cells.sun.classList.contains('active')).toBe(false);
  });

  it('arcana looks up by name after splitting the "roman · name" card label', () => {
    const name = Object.keys(ARCANA_MEANINGS)[0];
    vals.arcana.textContent = `IX · ${name}`;
    cardFace._fire('click', { target: vals.arcana });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    expect(p._byId['meaning-body'].textContent).toBe(ARCANA_MEANINGS[name].body);
  });

  it('a resolved coordinate opens its value meaning in context with partner coordinates', () => {
    vals.nameNumber.textContent = '6';
    vals.lifePath.textContent = '3';
    vals.soulUrge.textContent = '4';
    cardFace._fire('click', { target: vals.nameNumber });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    expect(p._byId['meaning-head'].textContent).toBe('NAME NUMBER');
    expect(p._byId['meaning-title'].textContent).toBe('the caretaker');
    expect(p._byId['meaning-body'].textContent).toContain('responsibility toward others');
    expect(p._byId['meaning-context-head'].textContent).toBe('with the other numbers');
    // Frame-agnostic since the v4 harmony frames (optimization item 4):
    // the deterministic frame varies the connectives, so pin the semantic
    // content — each theme beside its role — not one frame's phrasing.
    const context = p._byId['meaning-context'].textContent;
    for (const token of ['care', 'the full-name pattern', 'expression', 'the long route', 'structure', 'the inward motive']) {
      expect(context).toContain(token);
    }
    expect(p._byId['meaning-body'].textContent).not.toContain('derived by');
  });

  it('the filed-relation section fills for a registered pair and hides otherwise (incl. sealed)', () => {
    vals.sun.textContent = 'taurus';
    vals.rising.textContent = 'virgo';
    cardFace._fire('click', { target: vals.sun });
    const p = panel();
    expect(p._byId['meaning-relation-head'].hidden).toBe(false);
    expect(p._byId['meaning-relation'].textContent).toContain('four signs apart');
    expect(p._byId['meaning-relation-head'].textContent).toBe('filed relation');
    // close, then a coordinate with no filed pair -> section hidden, emptied
    cardFace._fire('click', { target: vals.sun });
    vals.element.textContent = 'earth';
    cardFace._fire('click', { target: vals.element });
    expect(p._byId['meaning-relation-head'].hidden).toBe(true);
    expect(p._byId['meaning-relation'].textContent).toBe('');
    // sealed compartment path carries no relation either
    cardFace._fire('click', { target: vals.element });
    cells.nameNumber.classList.add('sealed');
    cardFace._fire('click', { target: vals.nameNumber });
    expect(p._byId['meaning-relation-head'].hidden).toBe(true);
    expect(p._byId['meaning-relation'].textContent).toBe('');
    cells.nameNumber.classList.remove('sealed');
  });

  it('a card re-render under an open panel closes it — stale relation citations cannot linger', () => {
    // pr213 audit (opus MED): after a resubmission re-rendered the card
    // under an open panel, the stale FILED RELATION could cite a registry
    // record the new values do not support (a registered sign-distance
    // line for a same-value pair §1.I says must be unfiled). The module
    // observes the card and closes the panel on any value change.
    expect(observers.length).toBeGreaterThan(0);
    vals.sun.textContent = 'taurus';
    cardFace._fire('click', { target: vals.sun });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    observers[0].cb(); // the card re-rendered
    expect(p.classList.contains('open')).toBe(false);
  });

  it("the panel's own writes never close it — only real card mutations do (the #213 self-close regression)", () => {
    // Shipped in #213: openFor's textContent writes land inside the
    // observed cardFace subtree, so the delivery microtask closed every
    // panel the instant it opened — prose written into a max-height:0
    // inert box. The observer must ignore a delivery in which EVERY
    // record targets the module's own chrome, close on any record outside
    // it, and stay fail-safe on an unqualified fire (covered above).
    cardFace._fire('click', { target: vals.sun });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    p.contains = () => true; // every record inside the panel's own subtree
    observers[0].cb([{ target: {} }]);
    expect(p.classList.contains('open')).toBe(true);
    p.contains = () => false; // a record outside it — a real re-render
    observers[0].cb([{ target: vals.sun }]);
    expect(p.classList.contains('open')).toBe(false);
  });

  it('opens the filed master entry for every master value, on every numerology cell', () => {
    // Calc v4 (§1.G v0.62): the twelve terminal values all resolve a meaning
    // and a context without falling through to "meaning not filed". Every
    // numerology cell is exercised, not just the life path, because each
    // reads the same registry through its own coordinate role.
    const cases = [
      ['lifePath', '11', 'the illuminator (master number)'],
      ['nameNumber', '22', 'the master builder (master number)'],
      ['soulUrge', '33', 'the master teacher (master number)'],
      ['personality', '11', 'the illuminator (master number)'],
      ['birthday', '22', 'the master builder (master number)'],
      ['maturity', '33', 'the master teacher (master number)'],
    ];
    for (const [key, value, register] of cases) {
      vals[key].textContent = value;
      cardFace._fire('click', { target: vals[key] });
      const p = panel();
      expect(p._byId['meaning-title'].textContent, `${key}=${value}`).toBe(register);
      expect(p._byId['meaning-body'].textContent, `${key}=${value} body`).not.toBe('');
      expect(p._byId['meaning-context'].textContent, `${key}=${value} context`).not.toBe('');
      expect(p._byId['meaning-context-head'].textContent).toBe('with the other numbers');
      // Close so the next iteration opens rather than toggling shut.
      cardFace._fire('click', { target: vals[key] });
    }
  });

  it('still refuses a value the calculator cannot produce', () => {
    // The negative half of the pin above. Widening the registry to twelve
    // values must not turn it into a registry of every integer.
    vals.lifePath.textContent = '10';
    cardFace._fire('click', { target: vals.lifePath });
    expect(panel()._byId['meaning-title'].textContent).toBe('meaning not filed');
  });

  it('an unresolved coordinate opens with the input needed to resolve it', () => {
    vals.rising.textContent = '—';
    cardFace._fire('click', { target: vals.rising });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    expect(p._byId['meaning-title'].textContent).toBe('not resolved');
    expect(p._byId['meaning-body'].textContent).toContain('birth time and birthplace');
  });

  it('a zero-letter-subset numerology coordinate explains its unresolved dash', () => {
    vals.soulUrge.textContent = '—';
    cardFace._fire('click', { target: vals.soulUrge });
    const p = panel();
    expect(p._byId['meaning-title'].textContent).toBe('not resolved');
    expect(p._byId['meaning-body'].textContent).toContain('no standard vowels');
    expect(p._byId['meaning-body'].textContent).toContain('rather than creating a zero');
  });

  it('a sealed coordinate opens without leaking its hidden value', () => {
    cells.element.classList.add('sealed');
    vals.element.textContent = '';
    cardFace._fire('click', { target: vals.element });
    const p = panel();
    expect(p.classList.contains('open')).toBe(true);
    expect(p._byId['meaning-title'].textContent).toBe('meaning sealed at this tier');
    expect(p._byId['meaning-body'].textContent).toContain('meaning cannot yet be read');
    expect(p._byId['meaning-body'].textContent).not.toContain('derived');
    expect(p._byId['meaning-body'].textContent).not.toMatch(/undefined|null/);
  });

  it('an unknown value opens an explicit missing-meaning fallback', () => {
    vals.animal.textContent = 'not-a-real-animal';
    cardFace._fire('click', { target: vals.animal });
    expect(panel().classList.contains('open')).toBe(true);
    expect(panel()._byId['meaning-title'].textContent).toBe('meaning not filed');
    expect(panel()._byId['meaning-body'].textContent).toContain('no meaning entry');
    expect(panel()._byId['meaning-context'].hidden).toBe(true);
  });

  it('combines an animal and element into a pillar meaning', () => {
    vals.dayPillar.textContent = 'tiger · fire';
    vals.animal.textContent = 'snake';
    vals.element.textContent = 'earth';
    cardFace._fire('click', { target: vals.dayPillar });
    const p = panel();
    expect(p._byId['meaning-title'].textContent).toBe('boldness · activation');
    expect(p._byId['meaning-body'].textContent).toContain('tiger register brings boldness');
    expect(p._byId['meaning-body'].textContent).toContain('fire register adds activation');
    expect(p._byId['meaning-context'].textContent).toContain('boldness with activation serves as the day register');
  });

  it('Enter and Space open via the delegated keydown path; other keys pass through', () => {
    vals.sun.textContent = 'aries';
    let prevented = 0;
    cardFace._fire('keydown', { key: 'x', target: vals.sun, preventDefault: () => prevented++ });
    expect(panel().classList.contains('open')).toBe(false);
    cardFace._fire('keydown', { key: 'Enter', target: vals.sun, preventDefault: () => prevented++ });
    expect(prevented).toBe(1);
    expect(panel().classList.contains('open')).toBe(true);
    // Escape is owned by the document-level listener with modal-bg deferral
    // (#105) — covered below; the delegated cardFace path must not intercept it.
    cardFace._fire('keydown', { key: 'Escape', target: vals.sun, preventDefault: () => prevented++ });
    expect(prevented).toBe(1);
    expect(panel().classList.contains('open')).toBe(true);
  });

  it('the close button returns focus to the toggler cell (P2 audit fix)', () => {
    vals.sun.textContent = 'aries';
    cardFace._fire('click', { target: vals.sun });
    expect(cells.sun.focusCount).toBe(0);
    panel()._byId['meaning-close']._fire('click');
    // Focus must land back on the toggler, never die inside the inert panel.
    expect(cells.sun.focused).toBe(true);
    expect(cells.sun.focusCount).toBe(1);
  });

  it('returns focus before making the meanings panel inert and aria-hidden', () => {
    vals.sun.textContent = 'aries';
    cardFace._fire('click', { target: vals.sun });
    const p = panel();
    // The open panel must be interactive before the ordering is probed —
    // the transition labels alone cannot prove a valid open state.
    expect(p.inert).toBe(false);
    expect(p.attrs['aria-hidden']).toBe('false');
    const close = p._byId['meaning-close'];
    close.focus();

    const transitions = [];
    const focusLabel = () => {
      if (globalThis.document.activeElement === cells.sun) return 'toggler';
      if (globalThis.document.activeElement === close) return 'close';
      return 'other';
    };
    let inert = p.inert;
    Object.defineProperty(p, 'inert', {
      configurable: true,
      get: () => inert,
      set: value => {
        inert = value;
        if (value) transitions.push(`inert:${focusLabel()}`);
      },
    });
    const setAttribute = p.setAttribute.bind(p);
    p.setAttribute = (name, value) => {
      if (name === 'aria-hidden' && value === 'true') {
        transitions.push(`aria-hidden:${focusLabel()}`);
      }
      setAttribute(name, value);
    };

    close._fire('click');

    expect(transitions).toEqual(['inert:toggler', 'aria-hidden:toggler']);
    expect(globalThis.document.activeElement).toBe(cells.sun);
    // Terminal closed state pinned independently of the transition log —
    // a close() that re-activates the panel after the recorded
    // transitions must fail here, not pass on sequence alone.
    expect(p.inert).toBe(true);
    expect(p.attrs['aria-hidden']).toBe('true');
  });

  it('the close button closes and deactivates; re-init is a no-op', () => {
    vals.sun.textContent = 'aries';
    cardFace._fire('click', { target: vals.sun });
    panel()._byId['meaning-close']._fire('click');
    expect(panel().classList.contains('open')).toBe(false);
    expect(cells.sun.classList.contains('active')).toBe(false);
    initMeaningsUI({ cardFace }); // second init must not duplicate the panel
    expect(cardFace.children.filter(c => c.id === 'meaning-panel')).toHaveLength(1);
  });

  it('Escape closes an open meanings panel and restores focus to the toggler', () => {
    vals.sun.textContent = 'aries';
    cardFace._fire('click', { target: vals.sun });
    expect(panel().classList.contains('open')).toBe(true);
    globalThis.document._fire('keydown', { key: 'Escape' });
    expect(panel().classList.contains('open')).toBe(false);
    expect(cells.sun.classList.contains('active')).toBe(false);
    expect(cells.sun.focused).toBe(true);
  });

  it('Escape is a no-op when a modal-bg overlay is open (modal wins)', () => {
    vals.sun.textContent = 'aries';
    cardFace._fire('click', { target: vals.sun });
    globalThis.document.querySelector = sel =>
      (sel === '.modal-bg.open' ? { className: 'modal-bg open' } : null);
    globalThis.document._fire('keydown', { key: 'Escape' });
    expect(panel().classList.contains('open')).toBe(true);
  });
});

describe('ui/labels.js behavior', () => {
  afterEach(() => {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  });

  it('toggle click flips class, copy, aria-pressed, and persists the preference', () => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    const cardFace = makeNode();
    const labelsToggle = makeNode('button');
    const flipStage = makeNode();
    const ui = initLabelsUI({ cardFace, labelsToggle, flipStage }, {});

    labelsToggle._fire('click');
    expect(cardFace.classList.contains('labels-revealed')).toBe(true);
    expect(labelsToggle.textContent).toBe('→ hide labels');
    expect(labelsToggle.attrs['aria-pressed']).toBe('true');
    expect(isLabelsRevealed()).toBe(true);
    // flip-stage (mobile intrinsic-height layout, iOS/WebKit fix) tracks
    // cardFace's own labels-revealed class in lockstep, every path through.
    expect(flipStage.classList.contains('labels-revealed')).toBe(true);

    labelsToggle._fire('click');
    expect(cardFace.classList.contains('labels-revealed')).toBe(false);
    expect(labelsToggle.textContent).toBe('→ reveal labels');
    expect(labelsToggle.attrs['aria-pressed']).toBe('false');
    expect(isLabelsRevealed()).toBe(false);
    expect(flipStage.classList.contains('labels-revealed')).toBe(false);

    // applyLabelsState is the boot path — apply without persisting; this is
    // also how a stored preference (isLabelsRevealed() reading true from a
    // prior session) reaches the layout state on load, so this call doubles
    // as that initialization-path coverage.
    ui.applyLabelsState(true);
    expect(cardFace.classList.contains('labels-revealed')).toBe(true);
    expect(flipStage.classList.contains('labels-revealed')).toBe(true);
    expect(isLabelsRevealed()).toBe(false); // storage untouched by apply
  });

  it('an unreadable store reads as not-revealed instead of throwing', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('denied'); } };
    expect(isLabelsRevealed()).toBe(false);
  });

  // PR-196 premerge audit (2026-08-02): in this Node environment `document`
  // is undefined, so injectStyle()'s own guard made it a silent no-op in
  // every earlier run — the CSS payload, the fix's actual delivery
  // mechanism, could be deleted without any test noticing. This stubs a
  // document the way tests/dyad_surface.test.js does for ui/dyad.js's
  // injectStyle, so init runs the real injection code.
  it('init injects the #labels-style payload into head exactly once (real injectStyle path)', () => {
    const byId = new Map();
    const appended = [];
    const prior = globalThis.document;
    globalThis.document = {
      getElementById: id => byId.get(id) || null,
      createElement: tag => makeNode(tag),
      head: { appendChild: n => { appended.push(n); if (n.id) byId.set(n.id, n); } },
    };
    try {
      const refs = () => ({ cardFace: makeNode(), labelsToggle: makeNode('button'), flipStage: makeNode() });
      initLabelsUI(refs(), {});
      const style = byId.get('labels-style');
      expect(style).toBeTruthy();
      // the payload is the mobile override itself, not an empty shell
      expect(style.textContent).toMatch(/aspect-ratio:\s*auto/);
      expect(style.textContent).toMatch(/@media \(max-width: 719\.98px\)/);
      // idempotent: a second init finds the node by id and does not re-append
      initLabelsUI(refs(), {});
      expect(appended.length).toBe(1);
    } finally {
      if (prior === undefined) delete globalThis.document;
      else globalThis.document = prior;
    }
  });
});
