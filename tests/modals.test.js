// 8ball / tests / modals.test.js
// ui/modals.js DI shape + boot wiring (DOCTRINE §6 v0.23 split).
// The about / forget-me controllers were extracted from index.html during
// the Coordinate Legibility Pack cycle to free the line budget. These pins
// lock the locked init*UI({refs},{hooks}) shape and the index.html boot
// wiring. (The 18+ age-gate controller this suite used to also cover was
// retired — journal 2026-07-06.)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initModalsUI } from '../ui/modals.js';
import { makeModalRefs } from './helpers/dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const modalsJs = readFileSync(join(__dirname, '..', 'ui', 'modals.js'), 'utf-8');

describe('ui/modals.js DI shape (DOCTRINE §6 v0.23)', () => {
  it('exports initModalsUI with (refs, hooks) arity', () => {
    expect(modalsJs).toMatch(/export function initModalsUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('introduces no localStorage key at all', () => {
    const keys = modalsJs.match(/'eight_ball_[a-z0-9_]+'/g) || [];
    expect(keys).toEqual([]);
  });

  it('index.html boots the modal surface via initModalsUI', () => {
    expect(html).toMatch(/import\s*\{[^}]*initModalsUI[^}]*\}\s*from\s*['"]\.\/ui\/modals\.js['"]/);
    expect(html).toMatch(/initModalsUI\(/);
  });

  it('index.html no longer defines the inline modal handlers', () => {
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
// these run the actual init*UI logic so a regression in the forget-me erase
// order or Escape-to-close is caught (not just a rename). vitest runs on the
// node env (no jsdom) so DOM/localStorage globals are injected by hand,
// mirroring tests/tiers.test.js / payments_markup.test.js.
describe('ui/modals.js behavior (hook wiring)', () => {
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  function makeStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: k => { store.delete(k); },
      snapshot: () => Object.fromEntries(store),
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

  it('forget-confirm clears current and saved readings before resetting the form', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const order = [];
    const api = initModalsUI(refs, {
      clearProfile: () => order.push('clear-profile'),
      clearSavedReadings: () => order.push('clear-readings'),
      resetFormDisplay: () => order.push('reset'),
    });
    api.openForget();
    refs.forgetConfirm._fire('click');
    expect(order).toEqual(['clear-profile', 'clear-readings', 'reset']);
    expect(refs.forgetModal.classList.contains('open')).toBe(false);
  });

  it('Escape closes an open about modal and routes to the injected paywall close', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
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
});
