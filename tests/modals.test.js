// 8ball / tests / modals.test.js
// ui/modals.js DI shape + boot wiring (DOCTRINE §6 v0.23 split, §4.A gate).
// The about / forget / 18+ age-gate controllers were extracted from
// index.html during the Coordinate Legibility Pack cycle to free the line
// budget. These pins lock the locked init*UI({refs},{hooks}) shape, the
// no-new-key invariant, and the index.html boot wiring.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initModalsUI, isAgeAcknowledged } from '../ui/modals.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const modalsJs = readFileSync(join(__dirname, '..', 'ui', 'modals.js'), 'utf-8');

describe('ui/modals.js DI shape (DOCTRINE §6 v0.23)', () => {
  it('exports initModalsUI with (refs, hooks) arity', () => {
    expect(modalsJs).toMatch(/export function initModalsUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('exports the pure isAgeAcknowledged helper', () => {
    expect(modalsJs).toMatch(/export function isAgeAcknowledged\s*\(/);
  });

  it('owns the canonical age-ack key as a bare const (privacy_scan resolvable)', () => {
    expect(modalsJs).toMatch(/const AGE_ACK_KEY = 'eight_ball_age_ack_v1'/);
  });

  it('introduces no new localStorage key — age-ack is the only key string', () => {
    const keys = modalsJs.match(/'eight_ball_[a-z0-9_]+'/g) || [];
    expect([...new Set(keys)]).toEqual(["'eight_ball_age_ack_v1'"]);
  });

  it('index.html boots the modal surface via initModalsUI', () => {
    expect(html).toMatch(/import\s*\{[^}]*initModalsUI[^}]*\}\s*from\s*['"]\.\/ui\/modals\.js['"]/);
    expect(html).toMatch(/initModalsUI\(/);
    expect(html).toMatch(/modalsUI\.showAgeGate\(\)/);
  });

  it('index.html no longer defines the inline modal handlers', () => {
    expect(html).not.toMatch(/function showAgeGate\s*\(/);
    expect(html).not.toMatch(/function acknowledgeAge\s*\(/);
    expect(html).not.toMatch(/function openAbout\s*\(/);
  });

  it('escape-to-close reaches the paywall via injected hooks, not a cross-module import', () => {
    expect(modalsJs).toMatch(/isPaywallOpen/);
    expect(modalsJs).toMatch(/closePaywall/);
    // modals.js must NOT import payments.js — the paywall arrives via hooks.
    expect(modalsJs).not.toMatch(/from ['"]\.\/payments\.js['"]/);
  });
});

// Behavioral coverage — the pins above only grep ui/modals.js as source text;
// these run the actual init*UI logic so a regression in the §4.A age gate, the
// forget-me erase order, or Escape-to-close is caught (not just a rename).
// vitest runs on the node env (no jsdom) so DOM/localStorage globals are
// injected by hand, mirroring tests/tiers.test.js / payments_markup.test.js.
describe('ui/modals.js behavior (DOCTRINE §4.A gate + hook wiring)', () => {
  const AGE_ACK_KEY = 'eight_ball_age_ack_v1';
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  function makeClassList() {
    const classes = new Set();
    return {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      contains: c => classes.has(c),
    };
  }
  function makeEl() {
    const h = {};
    return {
      classList: makeClassList(),
      attrs: {},
      focused: false,
      addEventListener: (ev, fn) => { h[ev] = fn; },
      setAttribute(k, v) { this.attrs[k] = v; },
      focus() { this.focused = true; },
      _fire: (ev, arg) => h[ev] && h[ev](arg),
    };
  }
  function makeStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: k => { store.delete(k); },
      snapshot: () => Object.fromEntries(store),
    };
  }
  function makeRefs() {
    return {
      aboutModal: makeEl(), aboutBtn: makeEl(), aboutClose: makeEl(),
      forgetModal: makeEl(), forgetBtn: makeEl(), forgetCancel: makeEl(), forgetConfirm: makeEl(),
      ageGateModal: makeEl(), ageGateConfirm: makeEl(),
    };
  }

  let keydown;
  beforeEach(() => {
    keydown = null;
    globalThis.document = { addEventListener: (ev, fn) => { if (ev === 'keydown') keydown = fn; } };
  });
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    if (originalLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = originalLocalStorage;
  });

  it('acknowledgeAge writes the ack key as "true", closes the gate, and fires onAgeAck exactly once', () => {
    const storage = makeStorage();
    globalThis.localStorage = storage;
    const refs = makeRefs();
    let acked = 0;
    initModalsUI(refs, { onAgeAck: () => acked++ });

    refs.ageGateConfirm._fire('click');

    expect(storage.snapshot()[AGE_ACK_KEY]).toBe('true');
    expect(isAgeAcknowledged()).toBe(true);
    expect(refs.ageGateModal.classList.contains('open')).toBe(false);
    expect(refs.ageGateModal.attrs['aria-hidden']).toBe('true');
    expect(acked).toBe(1);
  });

  it('showAgeGate opens the gate and focuses the confirm control', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeRefs();
    const api = initModalsUI(refs, {});
    api.showAgeGate();
    expect(refs.ageGateModal.classList.contains('open')).toBe(true);
    expect(refs.ageGateModal.attrs['aria-hidden']).toBe('false');
    expect(refs.ageGateConfirm.focused).toBe(true);
  });

  it('forget-confirm fires clearProfile then resetFormDisplay and closes the forget modal', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeRefs();
    const order = [];
    const api = initModalsUI(refs, {
      clearProfile: () => order.push('clear'),
      resetFormDisplay: () => order.push('reset'),
    });
    api.openForget();
    refs.forgetConfirm._fire('click');
    expect(order).toEqual(['clear', 'reset']);
    expect(refs.forgetModal.classList.contains('open')).toBe(false);
  });

  it('Escape closes an open about modal and routes to the injected paywall close', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeRefs();
    let closedPaywall = 0;
    const api = initModalsUI(refs, {
      isPaywallOpen: () => true,
      closePaywall: () => closedPaywall++,
    });
    api.openAbout();
    keydown({ key: 'Escape' });
    expect(refs.aboutModal.classList.contains('open')).toBe(false);
    expect(closedPaywall).toBe(1);
  });

  it('isAgeAcknowledged reads true ONLY for the literal "true" — any other stored value gates', () => {
    globalThis.localStorage = makeStorage({ [AGE_ACK_KEY]: 'yes' });
    expect(isAgeAcknowledged()).toBe(false);
    globalThis.localStorage = makeStorage({ [AGE_ACK_KEY]: 'true' });
    expect(isAgeAcknowledged()).toBe(true);
  });
});

describe('isAgeAcknowledged edge reads (DOCTRINE §4.A fail-safe)', () => {
  const originalLocalStorage = globalThis.localStorage;
  afterEach(() => {
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  });

  it('fails safe to not-acknowledged when localStorage throws (private mode / quota)', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('SecurityError'); } };
    expect(isAgeAcknowledged()).toBe(false);
  });

  it('reads from the canonical age-ack key', () => {
    const getItem = vi.fn(() => 'true');
    globalThis.localStorage = { getItem };
    isAgeAcknowledged();
    expect(getItem).toHaveBeenCalledWith('eight_ball_age_ack_v1');
  });
});
