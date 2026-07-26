// 8ball / tests / readings_ui.test.js
// ui/readings.js CONTROLLER run for real (2026-07-24 coverage pass).
//
// tests/readings.test.js covers the storage layer behaviorally and pins the
// host wiring by grepping index.html as text — so everything from
// initReadingsUI down (36 of the module's 54 functions, ~22% statement
// coverage) never executed in CI. This file closes that gap: the §5.E
// save/open/rename/delete/clear flows and the §5.F exactly-two selection
// rule all run against hand-injected DOM mocks (node env, no jsdom — same
// convention as tests/meanings_behavior.test.js and tests/modals.test.js).
//
// The mini-DOM below is deliberately local to this file, per the note in
// tests/helpers/dom.js: createElement-style nodes carry module-specific
// innerHTML semantics and are kept unshared on purpose. It implements only
// the selector subset ui/readings.js actually uses — #id, .class, tag,
// [attr], [attr="value"], and one descendant combinator — so a selector the
// controller does not use is not silently "supported" here either.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { addSavedReading, initReadingsUI, READINGS_KEY } from '../ui/readings.js';

const originalDocument = globalThis.document;
const originalLocalStorage = globalThis.localStorage;

// ── selector engine (subset) ──────────────────────────────────────
function splitTop(str, sep) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
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

// data-* resolves through dataset (the controller writes dataset.readingId
// and reads [data-reading-id="…"]); everything else falls back to a real
// property then to setAttribute storage.
function attrValue(node, key) {
  if (key.startsWith('data-')) {
    return node.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
  }
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

// ── node ──────────────────────────────────────────────────────────
function makeNode(tag = 'div') {
  const handlers = {};
  const classes = new Set();
  const node = {
    tag,
    id: '',
    attrs: {},
    dataset: {},
    children: [],
    parentNode: null,
    textContent: '',
    hidden: false,
    disabled: false,
    checked: false,
    value: '',
    focusCount: 0,
    selectCount: 0,
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
      toggle: (c, force) => {
        const on = force === undefined ? !classes.has(c) : !!force;
        if (on) classes.add(c); else classes.delete(c);
        return on;
      },
    },
    setAttribute(key, value) { this.attrs[key] = String(value); },
    getAttribute(key) { return key in this.attrs ? this.attrs[key] : null; },
    focus() { this.focusCount++; if (globalThis.document) globalThis.document.activeElement = this; },
    select() { this.selectCount++; },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    append(...kids) { for (const kid of kids) this.appendChild(kid); },
    replaceChildren(...kids) { this.children = []; for (const kid of kids) this.appendChild(kid); },
    addEventListener(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    _fire(ev, event = {}) {
      const payload = { preventDefault() {}, ...event };
      for (const fn of handlers[ev] || []) fn(payload);
      return payload;
    },
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
  Object.defineProperty(node, 'className', {
    get() { return [...classes].join(' '); },
    set(v) { classes.clear(); for (const c of String(v).split(/\s+/)) if (c) classes.add(c); },
  });
  // buildPage/buildComparisonPage/buildConfirmModal assign innerHTML then
  // resolve inner nodes with querySelector('#id') — materialize exactly the
  // id-carrying elements (flat; the controller only looks them up by id).
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

function makeDocument() {
  const doc = {
    body: makeNode('body'),
    head: makeNode('head'),
    activeElement: null,
    createElement: tag => makeNode(tag),
    createTextNode: text => { const n = makeNode('#text'); n.textContent = String(text); return n; },
    getElementById(id) {
      return selectAll(this.body, `#${id}`)[0] || selectAll(this.head, `#${id}`)[0] || null;
    },
  };
  return doc;
}

function makeStorage(initial = {}, { blocked = false } = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => {
      if (blocked) throw new Error('quota');
      values.set(key, String(value));
    },
    removeItem: key => { values.delete(key); },
    snapshot: () => Object.fromEntries(values),
  };
}

const mkProfile = (name, dob) => ({ name, dob });

// A valid stored entry, written the way the archive writes them.
const entry = (id, title, savedAt, dob) => ({
  id, title, savedAt, profile: { name: title, dob },
});

function boot({ hooks = {}, storage = makeStorage(), resultVisible = false } = {}) {
  globalThis.localStorage = storage;
  globalThis.document = makeDocument();
  const refs = {
    openBtn: makeNode('button'),
    saveBtn: makeNode('button'),
    saveStatus: makeNode('p'),
    onboarding: makeNode('section'),
    result: makeNode('section'),
    stage: makeNode('main'),
  };
  refs.onboarding.className = resultVisible ? 'screen hidden' : 'screen';
  refs.result.className = resultVisible ? 'screen' : 'screen hidden';
  const api = initReadingsUI(refs, hooks);
  const page = refs.stage.children[0];
  const comparison = refs.stage.children[1];
  const confirm = globalThis.document.body.children[0];
  return {
    api, refs, storage, page, comparison, confirm,
    list: page.querySelector('#readings-list'),
    status: page.querySelector('#readings-page-status'),
    empty: page.querySelector('#readings-empty'),
    clearBtn: page.querySelector('#readings-clear'),
    compareBtn: page.querySelector('#readings-compare'),
    selectionStatus: page.querySelector('#readings-selection-status'),
    heading: page.querySelector('#readings-title'),
    confirmTitle: confirm.querySelector('#readings-confirm-title'),
    confirmCopy: confirm.querySelector('#readings-confirm-copy'),
    confirmCancel: confirm.querySelector('#readings-confirm-cancel'),
    confirmDo: confirm.querySelector('#readings-confirm-do'),
  };
}

const rowsOf = h => h.list.querySelectorAll('article.reading-row');
const actionBtn = (h, action, id) =>
  h.list.querySelectorAll(`button[data-action="${action}"]`)
    .find(b => !id || b.dataset.readingId === id);
const checkboxes = h => h.list.querySelectorAll('input[name="reading-comparison"]');
const stored = h => JSON.parse(h.storage.snapshot()[READINGS_KEY] || '[]');

function seed(storage, entries) {
  storage.setItem(READINGS_KEY, JSON.stringify(entries));
}

afterEach(() => {
  globalThis.document = originalDocument;
  globalThis.localStorage = originalLocalStorage;
});

describe('initReadingsUI boot (DOCTRINE §5.E / §6 DI shape)', () => {
  it('returns null when any required ref is missing — no partial wiring', () => {
    globalThis.document = makeDocument();
    globalThis.localStorage = makeStorage();
    const full = {
      openBtn: makeNode('button'), saveBtn: makeNode('button'), saveStatus: makeNode('p'),
      onboarding: makeNode('section'), result: makeNode('section'), stage: makeNode('main'),
    };
    expect(initReadingsUI(null)).toBeNull();
    for (const key of Object.keys(full)) {
      expect(initReadingsUI({ ...full, [key]: undefined }), `missing ${key} should abort`).toBeNull();
    }
    // Nothing was appended to the stage by the aborted boots.
    expect(full.stage.children).toHaveLength(0);
  });

  it('builds the readings page, comparison screen, and confirm modal exactly once', () => {
    const h = boot();
    expect(h.api).not.toBeNull();
    expect(h.page.id).toBe('previous-readings');
    expect(h.comparison.id).toBe('reading-concordance');
    expect(h.confirm.id).toBe('readings-confirm-modal');
    // Both screens start hidden; the confirm modal starts aria-hidden.
    expect(h.page.classList.contains('hidden')).toBe(true);
    expect(h.comparison.classList.contains('hidden')).toBe(true);
    expect(h.confirm.getAttribute('aria-hidden')).toBe('true');
    expect(globalThis.document.getElementById('readings-style')).not.toBeNull();
  });

  it('save button starts enabled and unsaved', () => {
    const h = boot();
    expect(h.refs.saveBtn.disabled).toBe(false);
    expect(h.refs.saveBtn.textContent).toBe('save reading');
  });
});

describe('save flow (§5.E)', () => {
  it('saves the current profile through the injected hook and confirms on-device', () => {
    const h = boot({ hooks: { getCurrentProfile: () => mkProfile('ada', '1988-03-04') } });
    h.refs.saveBtn._fire('click');
    const archive = stored(h);
    expect(archive).toHaveLength(1);
    expect(archive[0].profile).toEqual({ name: 'ada', dob: '1988-03-04' });
    expect(h.refs.saveBtn.disabled).toBe(true);
    expect(h.refs.saveBtn.textContent).toBe('reading saved');
    expect(h.refs.saveStatus.textContent).toBe('reading saved on this device.');
    expect(h.refs.saveStatus.hidden).toBe(false);
  });

  it('re-saving the same profile is idempotent and says so', () => {
    const h = boot({ hooks: { getCurrentProfile: () => mkProfile('ada', '1988-03-04') } });
    h.refs.saveBtn._fire('click');
    h.api.setActiveReading(null); // re-enable, as a fresh render would
    h.refs.saveBtn._fire('click');
    expect(stored(h)).toHaveLength(1);
    expect(h.refs.saveStatus.textContent).toBe('this reading is already saved on this device.');
  });

  it('blocked storage surfaces the storage copy and leaves the button usable', () => {
    const h = boot({
      storage: makeStorage({}, { blocked: true }),
      hooks: { getCurrentProfile: () => mkProfile('ada', '1988-03-04') },
    });
    h.refs.saveBtn._fire('click');
    expect(h.refs.saveStatus.textContent).toBe('could not save — browser storage may be blocked or full.');
    expect(h.refs.saveBtn.disabled).toBe(false);
  });

  it('an unreadable archive routes to the clear-first copy, not the generic one', () => {
    const storage = makeStorage({ [READINGS_KEY]: '{not json' });
    const h = boot({ storage, hooks: { getCurrentProfile: () => mkProfile('ada', '1988-03-04') } });
    h.refs.saveBtn._fire('click');
    expect(h.refs.saveStatus.textContent)
      .toBe('could not save — clear unreadable saved data from previous readings first.');
  });

  it('an invalid current profile never reaches storage', () => {
    const h = boot({ hooks: { getCurrentProfile: () => ({ name: '', dob: 'nope' }) } });
    h.refs.saveBtn._fire('click');
    expect(h.storage.snapshot()[READINGS_KEY]).toBeUndefined();
    expect(h.refs.saveBtn.disabled).toBe(false);
  });
});

describe('list rendering (§5.E)', () => {
  let h;
  beforeEach(() => {
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
    ]);
    h = boot({ storage });
    h.api.openPage();
  });

  it('renders one row per saved reading, newest first', () => {
    const rows = rowsOf(h);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.dataset.readingId)).toEqual(['reading-b', 'reading-a']);
    expect(h.empty.hidden).toBe(true);
    expect(h.status.textContent).toBe('2 saved readings.');
  });

  it('each row carries an open control, a timestamp, and rename/delete actions', () => {
    const row = rowsOf(h)[0];
    expect(row.querySelector('button.reading-open').textContent).toBe('bea');
    expect(row.querySelector('time.reading-date').dateTime).toBe('2026-07-02T10:00:00.000Z');
    expect(row.querySelectorAll('button[data-action]').map(b => b.dataset.action))
      .toEqual(['open', 'rename', 'delete']);
  });

  it('shows the empty state and hides clear-all when the archive is empty', () => {
    const fresh = boot();
    fresh.api.openPage();
    expect(rowsOf(fresh)).toHaveLength(0);
    expect(fresh.empty.hidden).toBe(false);
    expect(fresh.clearBtn.hidden).toBe(true);
    expect(fresh.status.textContent).toBe('');
  });

  it('a partly unreadable archive still lists the valid entries, and says so', () => {
    const storage = makeStorage();
    storage.setItem(READINGS_KEY, JSON.stringify([
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      { id: 'broken' },
    ]));
    const partial = boot({ storage });
    partial.api.openPage();
    expect(rowsOf(partial)).toHaveLength(1);
    expect(partial.status.textContent).toBe('some saved entries could not be read; valid readings are shown.');
  });

  it('a corrupt archive reports without throwing and offers clear-all', () => {
    const corrupt = boot({ storage: makeStorage({ [READINGS_KEY]: '{not json' }) });
    expect(() => corrupt.api.openPage()).not.toThrow();
    expect(rowsOf(corrupt)).toHaveLength(0);
    expect(corrupt.status.textContent).toBe('saved reading data could not be read. clear it to reset this browser.');
    expect(corrupt.clearBtn.hidden).toBe(false);
  });
});

describe('comparison selection — exactly two (DOCTRINE §5.F)', () => {
  let h;
  const check = (box, on) => { box.checked = on; h.list._fire('change', { target: box }); };

  beforeEach(() => {
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
      entry('reading-c', 'cyd', '2026-07-03T10:00:00.000Z', '1975-06-21'),
    ]);
    h = boot({ storage });
    h.api.openPage();
  });

  it('compare is disabled at zero and one selection', () => {
    expect(h.compareBtn.disabled).toBe(true);
    expect(h.selectionStatus.textContent).toBe('select exactly two saved readings.');
    check(checkboxes(h)[0], true);
    expect(h.compareBtn.disabled).toBe(true);
    expect(h.selectionStatus.textContent).toBe('1 selected. select one more.');
  });

  it('compare enables at exactly two', () => {
    const boxes = checkboxes(h);
    check(boxes[0], true);
    check(boxes[1], true);
    expect(h.compareBtn.disabled).toBe(false);
    expect(h.selectionStatus.textContent).toBe('2 selected. comparison is ready.');
  });

  it('a third selection is blocked — unselected checkboxes disable at two', () => {
    const boxes = checkboxes(h);
    check(boxes[0], true);
    check(boxes[1], true);
    expect(boxes.map(b => b.disabled)).toEqual([false, false, true]);
  });

  it('deselecting re-opens the third and re-disables compare', () => {
    const boxes = checkboxes(h);
    check(boxes[0], true);
    check(boxes[1], true);
    check(boxes[1], false);
    expect(boxes.map(b => b.disabled)).toEqual([false, false, false]);
    expect(h.compareBtn.disabled).toBe(true);
  });

  it('a third selection that bypasses the disabled affordance still cannot compare', () => {
    // The disabled attribute is the affordance; the count check is the §5.F
    // guard. Drive selection to three anyway (what an AT path or a stale DOM
    // state could do) — compare must stay shut and the hook must never run.
    let compared = 0;
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
      entry('reading-c', 'cyd', '2026-07-03T10:00:00.000Z', '1975-06-21'),
    ]);
    const three = boot({ storage, hooks: { compareReadings: () => { compared++; return null; } } });
    three.api.openPage();
    for (const box of checkboxes(three)) {
      box.checked = true;
      three.list._fire('change', { target: box });
    }
    expect(three.compareBtn.disabled).toBe(true);
    three.compareBtn._fire('click');
    expect(compared).toBe(0);
    expect(three.comparison.classList.contains('hidden')).toBe(true);
  });

  it('fewer than two saved readings states the floor instead of the selection prompt', () => {
    const storage = makeStorage();
    seed(storage, [entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04')]);
    const single = boot({ storage });
    single.api.openPage();
    expect(single.selectionStatus.textContent).toBe('save at least two readings to compare.');
    expect(single.compareBtn.disabled).toBe(true);
  });

  it('a selection whose entry is deleted is pruned, not left counting toward the two', () => {
    const boxes = checkboxes(h);
    check(boxes[0], true); // cyd, newest
    check(boxes[1], true); // bea
    expect(h.compareBtn.disabled).toBe(false);

    h.list._fire('click', { target: actionBtn(h, 'delete', 'reading-c') });
    h.confirmDo._fire('click');

    const after = checkboxes(h);
    expect(after).toHaveLength(2);
    expect(after[0].checked).toBe(true); // bea survives, still selected
    expect(h.compareBtn.disabled).toBe(true);
    expect(h.selectionStatus.textContent).toBe('1 selected. select one more.');

    // The pruned id must not still occupy a slot: one more selection reaches
    // exactly two rather than silently overshooting.
    check(after[1], true);
    expect(h.compareBtn.disabled).toBe(false);
    expect(h.selectionStatus.textContent).toBe('2 selected. comparison is ready.');
  });
});

describe('comparison screen (§5.F — recompute, never store)', () => {
  const axes = [{
    label: 'sun', status: 'registered', left: 'aries', right: 'leo',
    relation: 'same triplicity', registry: 'ptolemaic', citation: 'tetrabiblos', qualifier: 'classical',
  }];

  function bootPair(compareReadings) {
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
    ]);
    const h = boot({ storage, hooks: { compareReadings } });
    h.api.openPage();
    for (const box of checkboxes(h)) { box.checked = true; h.list._fire('change', { target: box }); }
    return h;
  }

  it('compares the two selected entries and swaps to the concordance screen', () => {
    const seen = [];
    const h = bootPair((left, right) => { seen.push([left.id, right.id]); return { axes, omitted: [] }; });
    h.compareBtn._fire('click');
    expect(seen).toEqual([['reading-b', 'reading-a']]);
    expect(h.page.classList.contains('hidden')).toBe(true);
    expect(h.comparison.classList.contains('hidden')).toBe(false);
    const rendered = h.comparison.querySelector('#concordance-list');
    expect(rendered.children).toHaveLength(1);
    expect(rendered.children[0].querySelector('h2').textContent).toBe('sun');
    expect(rendered.children[0].querySelector('span.concordance-status').textContent).toBe('registered');
  });

  it('names both parties in the pair head', () => {
    const h = bootPair(() => ({ axes, omitted: [] }));
    h.compareBtn._fire('click');
    expect(h.comparison.querySelector('#concordance-pair-head').children.map(p => p.textContent))
      .toEqual(['bea', 'ada']);
  });

  it('a sealed element coordinate surfaces the omission note', () => {
    const h = bootPair(() => ({ axes, omitted: ['element'] }));
    h.compareBtn._fire('click');
    const omitted = h.comparison.querySelector('#concordance-omitted');
    expect(omitted.hidden).toBe(false);
    expect(omitted.textContent).toContain('sealed at this device tier');
  });

  it('a failing comparison reports and leaves the archive and screen untouched', () => {
    const h = bootPair(() => { throw new Error('boom'); });
    h.compareBtn._fire('click');
    expect(h.status.textContent).toBe('these readings could not be compared. saved entries were not changed.');
    expect(h.comparison.classList.contains('hidden')).toBe(true);
    expect(stored(h)).toHaveLength(2);
  });

  it('back returns to the readings page and restores focus to its heading', () => {
    const h = bootPair(() => ({ axes, omitted: [] }));
    h.compareBtn._fire('click');
    const before = h.heading.focusCount;
    h.comparison.querySelector('#concordance-back')._fire('click');
    expect(h.comparison.classList.contains('hidden')).toBe(true);
    expect(h.page.classList.contains('hidden')).toBe(false);
    expect(h.heading.focusCount).toBe(before + 1);
  });
});

describe('delete — confirmation is load-bearing (§5.E)', () => {
  let h;
  beforeEach(() => {
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
    ]);
    h = boot({ storage });
    h.api.openPage();
    h.list._fire('click', { target: actionBtn(h, 'delete', 'reading-a') });
  });

  it('asks first, naming the entry, and deletes nothing yet', () => {
    expect(h.confirmTitle.textContent).toBe('delete reading?');
    expect(h.confirmCopy.textContent).toContain('ada');
    expect(h.confirmCopy.textContent).toContain('cannot be undone');
    expect(h.confirm.classList.contains('open')).toBe(true);
    expect(stored(h)).toHaveLength(2);
  });

  it('cancelling keeps the entry', () => {
    h.confirmCancel._fire('click');
    expect(h.confirm.classList.contains('open')).toBe(false);
    expect(stored(h)).toHaveLength(2);
    // A later confirm click cannot resurrect the cancelled intent.
    h.confirmDo._fire('click');
    expect(stored(h)).toHaveLength(2);
  });

  it('confirming removes exactly that entry and re-renders', () => {
    h.confirmDo._fire('click');
    expect(stored(h).map(r => r.id)).toEqual(['reading-b']);
    expect(rowsOf(h)).toHaveLength(1);
    expect(h.status.textContent).toBe('reading deleted.');
    expect(h.confirm.classList.contains('open')).toBe(false);
  });

  it('deleting the active reading releases the save button', () => {
    h.api.setActiveReading('reading-a');
    expect(h.refs.saveBtn.disabled).toBe(true);
    h.confirmDo._fire('click');
    expect(h.refs.saveBtn.disabled).toBe(false);
    expect(h.refs.saveBtn.textContent).toBe('save reading');
    expect(h.refs.saveStatus.textContent).toBe('');
  });

  it('Escape and backdrop both dismiss without deleting', () => {
    h.confirm._fire('keydown', { key: 'Escape' });
    expect(stored(h)).toHaveLength(2);
    h.list._fire('click', { target: actionBtn(h, 'delete', 'reading-a') });
    h.confirm._fire('click', { target: h.confirm });
    expect(h.confirm.classList.contains('open')).toBe(false);
    expect(stored(h)).toHaveLength(2);
  });
});

describe('clear all (§5.E)', () => {
  it('asks with clear-all copy, then empties the archive on confirm', () => {
    const storage = makeStorage();
    seed(storage, [
      entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04'),
      entry('reading-b', 'bea', '2026-07-02T10:00:00.000Z', '1991-11-30'),
    ]);
    const h = boot({ storage });
    h.api.openPage();
    h.clearBtn._fire('click');
    expect(h.confirmTitle.textContent).toBe('clear all readings?');
    expect(h.confirmCopy.textContent).toContain('every saved reading');
    expect(stored(h)).toHaveLength(2);
    h.confirmDo._fire('click');
    expect(h.storage.snapshot()[READINGS_KEY]).toBeUndefined();
    expect(rowsOf(h)).toHaveLength(0);
    expect(h.status.textContent).toBe('all saved readings cleared from this browser.');
  });

  it('cancelling clear-all keeps every entry', () => {
    const storage = makeStorage();
    seed(storage, [entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04')]);
    const h = boot({ storage });
    h.api.openPage();
    h.clearBtn._fire('click');
    h.confirmCancel._fire('click');
    expect(stored(h)).toHaveLength(1);
  });
});

describe('rename (§5.E)', () => {
  let h;
  const renameForm = () => h.list.querySelector('.reading-rename-form');
  beforeEach(() => {
    const storage = makeStorage();
    seed(storage, [entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04')]);
    h = boot({ storage });
    h.api.openPage();
    h.list._fire('click', { target: actionBtn(h, 'rename', 'reading-a') });
  });

  it('opens an inline form prefilled with the current title and focuses it', () => {
    const input = renameForm().querySelector('input[name="reading-title"]');
    expect(input.value).toBe('ada');
    expect(input.focusCount).toBe(1);
    expect(input.selectCount).toBe(1);
  });

  it('submitting a new title renames the entry without touching its inputs or date', () => {
    const form = renameForm();
    form.querySelector('input[name="reading-title"]').value = 'ada lovelace';
    h.list._fire('submit', { target: form });
    const archive = stored(h);
    expect(archive[0].title).toBe('ada lovelace');
    expect(archive[0].savedAt).toBe('2026-07-01T10:00:00.000Z');
    expect(archive[0].profile).toEqual({ name: 'ada', dob: '1988-03-04' });
    expect(h.status.textContent).toBe('reading renamed.');
  });

  it('a blank title is rejected and the stored title is unchanged', () => {
    const form = renameForm();
    form.querySelector('input[name="reading-title"]').value = '   ';
    h.list._fire('submit', { target: form });
    expect(stored(h)[0].title).toBe('ada');
    expect(h.status.textContent).toBe('the reading name could not be saved.');
  });

  it('submitting prevents the native form navigation', () => {
    let prevented = false;
    const form = renameForm();
    form.querySelector('input[name="reading-title"]').value = 'ada l';
    h.list._fire('submit', { target: form, preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true);
  });

  it('cancelling restores the row and keeps the title', () => {
    h.list._fire('click', { target: h.list.querySelector('button[data-action="cancel-rename"]') });
    expect(renameForm()).toBeNull();
    expect(h.list.querySelector('button.reading-open').textContent).toBe('ada');
    expect(stored(h)[0].title).toBe('ada');
  });
});

describe('open a saved reading (§5.E rehydrate)', () => {
  function bootOne(openReading) {
    const storage = makeStorage();
    seed(storage, [entry('reading-a', 'ada', '2026-07-01T10:00:00.000Z', '1988-03-04')]);
    const h = boot({ storage, hooks: { openReading } });
    h.api.openPage();
    return h;
  }

  it('hands the entry to the host hook, marks it active, and leaves the page', () => {
    const seen = [];
    const h = bootOne(reading => { seen.push(reading.id); return true; });
    h.list._fire('click', { target: h.list.querySelector('button[data-action="open"]') });
    expect(seen).toEqual(['reading-a']);
    expect(h.page.classList.contains('hidden')).toBe(true);
    expect(h.refs.saveBtn.disabled).toBe(true);
    expect(h.refs.saveStatus.textContent).toBe('reading loaded from this device.');
  });

  it('a hook returning false reports and keeps the page open', () => {
    const h = bootOne(() => false);
    h.list._fire('click', { target: h.list.querySelector('button[data-action="open"]') });
    expect(h.status.textContent).toBe('this reading could not be opened.');
    expect(h.page.classList.contains('hidden')).toBe(false);
    expect(h.refs.saveBtn.disabled).toBe(false);
  });

  it('a throwing hook is contained — the screen survives', () => {
    const h = bootOne(() => { throw new Error('bad payload'); });
    expect(() => h.list._fire('click', { target: h.list.querySelector('button[data-action="open"]') }))
      .not.toThrow();
    expect(h.status.textContent).toBe('this reading could not be opened.');
    expect(h.page.classList.contains('hidden')).toBe(false);
  });
});

describe('page navigation and focus (§5.E)', () => {
  it('opening focuses the heading and hides both product screens', () => {
    const h = boot();
    h.refs.openBtn._fire('click');
    expect(h.page.classList.contains('hidden')).toBe(false);
    expect(h.refs.onboarding.classList.contains('hidden')).toBe(true);
    expect(h.refs.result.classList.contains('hidden')).toBe(true);
    expect(h.heading.focusCount).toBe(1);
  });

  it('closing returns to the result screen when that is where it came from', () => {
    const h = boot({ resultVisible: true });
    h.refs.openBtn._fire('click');
    h.page.querySelector('#readings-back')._fire('click');
    expect(h.refs.result.classList.contains('hidden')).toBe(false);
    expect(h.refs.onboarding.classList.contains('hidden')).toBe(true);
    expect(h.refs.openBtn.focusCount).toBe(1);
  });

  it('closing returns to onboarding when no result was on screen', () => {
    const h = boot();
    h.refs.openBtn._fire('click');
    h.page.querySelector('#readings-back')._fire('click');
    expect(h.refs.onboarding.classList.contains('hidden')).toBe(false);
    expect(h.page.classList.contains('hidden')).toBe(true);
  });

  it('setActiveReading drives the save button both ways', () => {
    const h = boot();
    h.api.setActiveReading('reading-a');
    expect(h.refs.saveBtn.disabled).toBe(true);
    expect(h.refs.saveBtn.textContent).toBe('reading saved');
    h.api.setActiveReading(null);
    expect(h.refs.saveBtn.disabled).toBe(false);
    expect(h.refs.saveStatus.textContent).toBe('');
  });

  it('the controller reads no storage key other than the archive', () => {
    const touched = new Set();
    const storage = makeStorage();
    const spy = {
      getItem: k => { touched.add(k); return storage.getItem(k); },
      setItem: (k, v) => { touched.add(k); storage.setItem(k, v); },
      removeItem: k => { touched.add(k); storage.removeItem(k); },
      snapshot: storage.snapshot,
    };
    const h = boot({ storage: spy, hooks: { getCurrentProfile: () => mkProfile('ada', '1988-03-04') } });
    h.refs.saveBtn._fire('click');
    h.api.openPage();
    h.clearBtn._fire('click');
    h.confirmDo._fire('click');
    expect([...touched]).toEqual([READINGS_KEY]);
  });
});
