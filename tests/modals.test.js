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
import { makeEl, makeModalRefs } from './helpers/dom.js';

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

  // ── backdrop click ─────────────────────────────────────────────────
  // ui/modals.js:90 and :106 were the module's two uncovered *functions*:
  // the click listeners are registered at init but no test ever fired
  // them. The `e.target === modal` guard is what separates "clicked the
  // dimmed backdrop" from "clicked something inside the dialog", and its
  // false arm is the one that matters — a handler that closes on any
  // descendant click makes the About copy impossible to select or scroll.
  // Idiom borrowed from tests/readings_ui.test.js:619, which already pins
  // this shape for the readings confirm modal.
  const backdrops = [
    { label: 'about', modal: 'aboutModal', open: 'openAbout', inside: 'aboutClose' },
    { label: 'forget', modal: 'forgetModal', open: 'openForget', inside: 'forgetCancel' },
  ];

  for (const b of backdrops) {
    it(`${b.label}: a click on the backdrop itself closes the dialog`, () => {
      globalThis.localStorage = makeStorage();
      const refs = makeModalRefs();
      const api = initModalsUI(refs, {});
      api[b.open]();
      expect(refs[b.modal].classList.contains('open')).toBe(true);

      refs[b.modal]._fire('click', { target: refs[b.modal] });
      expect(refs[b.modal].classList.contains('open')).toBe(false);
      expect(refs[b.modal].attrs['aria-hidden']).toBe('true');
    });

    it(`${b.label}: a click INSIDE the dialog leaves it open`, () => {
      globalThis.localStorage = makeStorage();
      const refs = makeModalRefs();
      const api = initModalsUI(refs, {});
      api[b.open]();

      refs[b.modal]._fire('click', { target: refs[b.inside] });
      expect(refs[b.modal].classList.contains('open')).toBe(true);
      expect(refs[b.modal].attrs['aria-hidden']).toBe('false');
    });
  }

  it('the forget backdrop dismisses without erasing anything', () => {
    // The destructive hooks belong to forgetConfirm alone. Dismissing the
    // dialog by clicking past it must never be a silent erase.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const fired = [];
    const api = initModalsUI(refs, {
      clearProfile: () => fired.push('clear-profile'),
      clearSavedReadings: () => fired.push('clear-readings'),
      resetFormDisplay: () => fired.push('reset'),
    });
    api.openForget();
    refs.forgetModal._fire('click', { target: refs.forgetModal });
    expect(refs.forgetModal.classList.contains('open')).toBe(false);
    expect(fired).toEqual([]);
  });

  // ── Escape, over the full state space ──────────────────────────────
  // Only one of the four branches at ui/modals.js:113-118 ran before:
  // the existing Escape test opens about and stubs isPaywallOpen to true.
  // Escape-closes-forget (the destructive dialog), the paywall-shut arm,
  // and the do-nothing cases were all unexercised. Table over
  // {about, forget, paywall} in {0,1}^3.
  for (const about of [false, true]) {
    for (const forget of [false, true]) {
      for (const paywall of [false, true]) {
        const open = [about && 'about', forget && 'forget', paywall && 'paywall']
          .filter(Boolean);
        const label = open.length ? open.join('+') : 'nothing';
        it(`Escape with ${label} open closes exactly that`, () => {
          globalThis.localStorage = makeStorage();
          const refs = makeModalRefs();
          let closedPaywall = 0;
          const api = initModalsUI(refs, {
            isPaywallOpen: () => paywall,
            closePaywall: () => closedPaywall++,
          });
          if (about) api.openAbout();
          if (forget) api.openForget();

          keydown({ key: 'Escape' });

          expect(refs.aboutModal.classList.contains('open')).toBe(false);
          expect(refs.forgetModal.classList.contains('open')).toBe(false);
          expect(closedPaywall).toBe(paywall ? 1 : 0);
        });
      }
    }
  }

  it('a non-Escape keydown closes nothing', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    let closedPaywall = 0;
    const api = initModalsUI(refs, {
      isPaywallOpen: () => true,
      closePaywall: () => closedPaywall++,
    });
    api.openAbout();
    api.openForget();

    for (const key of ['Enter', 'Tab', 'esc', 'Esc', ' ']) keydown({ key });

    expect(refs.aboutModal.classList.contains('open')).toBe(true);
    expect(refs.forgetModal.classList.contains('open')).toBe(true);
    expect(closedPaywall).toBe(0);
  });

  // ── partial dependency injection ───────────────────────────────────
  // `const h = hooks || {}` and the four `if (h.x)` guards at :83, :101-104
  // and :117 exist so a caller can wire a subset. Every existing test
  // supplies either all the hooks or an empty object, so the guarded-hook
  // idiom itself — the reason those guards are written that way — never
  // ran against a genuinely absent hook.
  it('initModalsUI with NO hooks argument still opens and closes', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const api = initModalsUI(refs);

    api.openAbout();
    expect(refs.aboutModal.classList.contains('open')).toBe(true);
    refs.aboutClose._fire('click');
    expect(refs.aboutModal.classList.contains('open')).toBe(false);
  });

  it('forget-confirm with NO hooks still closes instead of throwing', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const api = initModalsUI(refs);
    api.openForget();

    expect(() => refs.forgetConfirm._fire('click')).not.toThrow();
    expect(refs.forgetModal.classList.contains('open')).toBe(false);
  });

  it('Escape with no paywall hooks at all is a no-op on the paywall arm', () => {
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const api = initModalsUI(refs, { clearProfile: () => {} });
    api.openAbout();

    expect(() => keydown({ key: 'Escape' })).not.toThrow();
    expect(refs.aboutModal.classList.contains('open')).toBe(false);
  });

  it('Escape when isPaywallOpen is true but closePaywall is missing does not throw', () => {
    // The inner `if (h.closePaywall)` at :117 — a half-wired paywall.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    initModalsUI(refs, { isPaywallOpen: () => true });

    expect(() => keydown({ key: 'Escape' })).not.toThrow();
  });

  it('a modal with no focusable children never traps Tab', () => {
    // Pins the observable contract for an empty dialog: Tab passes
    // straight through, nothing is prevented, nothing is focused.
    //
    // Deliberately NOT claimed: this does not guard the
    // `!focusables.length` bail at ui/modals.js:63. Deleting that line
    // leaves this test green, because after open() document.activeElement
    // is a real control, so neither `=== first` nor `=== last` matches
    // undefined and the wrap arms never run. The bail is a defensive
    // short-circuit with no independently observable effect under any
    // realistic activeElement — worth keeping, not worth pretending is
    // covered.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    refs.aboutModal.querySelectorAll = () => [];
    const api = initModalsUI(refs, {});
    api.openAbout();

    let prevented = 0;
    expect(() => refs.aboutModal._fire('keydown', {
      key: 'Tab', shiftKey: false, preventDefault: () => prevented++,
    })).not.toThrow();
    expect(prevented).toBe(0);
  });

  it('a dialog with a single focusable traps Tab onto itself, both directions', () => {
    // first === last on a one-control dialog, so both wrap arms resolve
    // to the same element. The existing trap test uses two focusables,
    // which lets `focusables[focusables.length - 1]` be wrong-but-passing
    // for the degenerate case.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const only = makeEl('only');
    refs.aboutModal.querySelectorAll = () => [only];
    const api = initModalsUI(refs, {});
    api.openAbout();
    globalThis.document.activeElement = only;

    let prevented = 0;
    refs.aboutModal._fire('keydown', {
      key: 'Tab', shiftKey: false, preventDefault: () => prevented++,
    });
    expect(prevented).toBe(1);
    expect(only.focusCount).toBe(1);

    refs.aboutModal._fire('keydown', {
      key: 'Tab', shiftKey: true, preventDefault: () => prevented++,
    });
    expect(prevented).toBe(2);
    expect(only.focusCount).toBe(2);
  });

  it('Tab from a control in the middle of the dialog is not intercepted', () => {
    // The trap only acts at the two ends; in between, the browser's own
    // tab order must be left alone. Covers the `!e.shiftKey` arm at
    // ui/modals.js:69 reached with shiftKey true and focus off `first`,
    // which the two end-wrap tests never produce.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const first = makeEl('first');
    const middle = makeEl('middle');
    const last = makeEl('last');
    refs.aboutModal.querySelectorAll = () => [first, middle, last];
    const api = initModalsUI(refs, {});
    api.openAbout();
    globalThis.document.activeElement = middle;

    let prevented = 0;
    const tab = shiftKey => refs.aboutModal._fire('keydown', {
      key: 'Tab', shiftKey, preventDefault: () => prevented++,
    });
    tab(false);
    tab(true);

    expect(prevented).toBe(0);
    expect(first.focusCount).toBe(0);
    expect(last.focusCount).toBe(0);
  });

  it('trapTab is inert when the element cannot query its children', () => {
    // ui/modals.js:59 — the typeof querySelectorAll guard. makeEl has no
    // querySelectorAll, which is exactly the shape that guard defends.
    globalThis.localStorage = makeStorage();
    const refs = makeModalRefs();
    const api = initModalsUI(refs, {});
    api.openAbout();

    let prevented = 0;
    expect(() => refs.aboutModal._fire('keydown', {
      key: 'Tab', shiftKey: false, preventDefault: () => prevented++,
    })).not.toThrow();
    expect(prevented).toBe(0);
  });
});
