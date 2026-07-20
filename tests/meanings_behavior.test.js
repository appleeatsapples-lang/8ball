// 8ball / tests / meanings_behavior.test.js
// ui/meanings.js + ui/labels.js run for real (2026-07-05 standards pass).
//
// tests/meanings_ui.test.js and tests/labels_reveal.test.js are source
// pins — they grep the modules as text and never execute them. This file
// closes the behavioral gap: the meanings panel open/toggle/close cycle,
// the arcana "roman · name" key split, the sealed-cell (—) guard, the
// Enter/Space keyboard path, and the labels toggle's class/copy/
// aria-pressed round-trip all run against hand-injected DOM mocks
// (node env, no jsdom — same convention as tests/modals.test.js).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initMeaningsUI } from '../ui/meanings.js';
import { initLabelsUI, isLabelsRevealed } from '../ui/labels.js';
import { SUN_MEANINGS, ARCANA_MEANINGS } from '../content/meanings.v1.js';

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

  beforeEach(() => {
    byId = new Map();
    cardFace = makeNode('div');
    cells = {}; vals = {};
    for (const [key, id] of [
      ['arcana', 'coord-arcana-symbol'], ['sun', 'coord-sun-symbol'],
      ['animal', 'coord-animal-symbol'], ['lifePath', 'coord-lifepath-symbol'],
    ]) {
      const { cell, val } = makeCell(key, id);
      cells[key] = cell; vals[key] = val;
      byId.set(id, val);
    }
    globalThis.document = {
      getElementById: id => byId.get(id) || null,
      createElement: makeNode,
      head: { appendChild: node => { if (node.id) byId.set(node.id, node); } },
    };
    initMeaningsUI({ cardFace });
  });
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  });

  function panel() { return cardFace.children.find(c => c.id === 'meaning-panel'); }

  it('init marks the four free cells interactive and keyboard-reachable', () => {
    for (const key of ['arcana', 'sun', 'animal', 'lifePath']) {
      expect(cells[key].classList.contains('has-meaning')).toBe(true);
      expect(cells[key].attrs.tabindex).toBe('0');
      expect(cells[key].attrs.role).toBe('button');
      expect(cells[key].dataset.meaningKey).toBe(key);
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

  it('sealed (—) and unknown values never open the panel', () => {
    vals.animal.textContent = '—';
    cardFace._fire('click', { target: vals.animal });
    expect(panel().classList.contains('open')).toBe(false);
    vals.animal.textContent = 'not-a-real-animal';
    cardFace._fire('click', { target: vals.animal });
    expect(panel().classList.contains('open')).toBe(false);
  });

  it('Enter and Space open via the delegated keydown path; other keys pass through', () => {
    vals.sun.textContent = 'aries';
    let prevented = 0;
    cardFace._fire('keydown', { key: 'x', target: vals.sun, preventDefault: () => prevented++ });
    expect(panel().classList.contains('open')).toBe(false);
    cardFace._fire('keydown', { key: 'Enter', target: vals.sun, preventDefault: () => prevented++ });
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
    const ui = initLabelsUI({ cardFace, labelsToggle }, {});

    labelsToggle._fire('click');
    expect(cardFace.classList.contains('labels-revealed')).toBe(true);
    expect(labelsToggle.textContent).toBe('→ hide labels');
    expect(labelsToggle.attrs['aria-pressed']).toBe('true');
    expect(isLabelsRevealed()).toBe(true);

    labelsToggle._fire('click');
    expect(cardFace.classList.contains('labels-revealed')).toBe(false);
    expect(labelsToggle.textContent).toBe('→ reveal labels');
    expect(labelsToggle.attrs['aria-pressed']).toBe('false');
    expect(isLabelsRevealed()).toBe(false);

    // applyLabelsState is the boot path — apply without persisting
    ui.applyLabelsState(true);
    expect(cardFace.classList.contains('labels-revealed')).toBe(true);
    expect(isLabelsRevealed()).toBe(false); // storage untouched by apply
  });

  it('an unreadable store reads as not-revealed instead of throwing', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('denied'); } };
    expect(isLabelsRevealed()).toBe(false);
  });
});
