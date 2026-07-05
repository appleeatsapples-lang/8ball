// 8ball / tests / modal_a11y.test.js
// Modal accessibility surface (2026-07-05 standards pass).
//
// Before this pass the four dialogs carried role="dialog" without
// aria-modal, no dialog moved focus in on open (except the age gate) or
// restored it on close, Tab escaped to the page behind the backdrop,
// and --label on the dark page chrome sat at 2.63:1 (WCAG AA: 4.5:1).
// Markup pins lock the attributes/tokens; the behavior block runs the
// focus save/trap/restore logic with hand mocks (node env, no jsdom),
// mirroring tests/modals.test.js.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initModalsUI } from '../ui/modals.js';
import { initPaywallUI, openPaywall, closePaywall } from '../ui/payments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('modal a11y — markup pins', () => {
  it('all four dialogs carry aria-modal="true" alongside role="dialog"', () => {
    const dialogs = html.match(/role="dialog"/g) || [];
    const modal = html.match(/role="dialog" aria-modal="true"/g) || [];
    expect(dialogs).toHaveLength(4);
    expect(modal).toHaveLength(4);
  });

  it('the dark-chrome label token exists and the AA-failing pairs are off it', () => {
    // --label (#5a5444) on --page-bg (#0a0a0a) is 2.63:1; the on-dark
    // variant (#837c69) is 4.76:1 — AA, and still dimmer than --rule
    // (5.30:1) so the label-vs-rule hierarchy survives.
    expect(html).toMatch(/--label-on-dark:\s*#837c69/);
    // Spot-pin the two worst offenders: the error message and the
    // density strip both sit on the dark page background.
    expect(html).toMatch(/\.field-error\s*\{[^}]*var\(--label-on-dark\)/);
    expect(html).toMatch(/\.density-strip\s*\{[^}]*var\(--label-on-dark\)/);
    // The pre-2026-07-05 `.field-error { color: var(--ink) }` override made
    // the error text ~1.1:1 (near-black on black) — it must never return.
    expect(html).not.toMatch(/\.field-error\s*\{\s*color:\s*var\(--ink\)/);
  });

  it('closed modals leave the keyboard tab order (visibility, not just opacity)', () => {
    // opacity:0 elements stay focusable; without visibility:hidden a
    // keyboard user can Tab into an invisible dialog — and the Tab trap
    // would pin them there.
    expect(html).toMatch(/\.modal-bg\s*\{[^}]*visibility:\s*hidden/);
    expect(html).toMatch(/\.modal-bg\.open\s*\{[^}]*visibility:\s*visible/);
  });

  it('modal-disclosure no longer dilutes its AA-passing color with opacity', () => {
    expect(html).not.toMatch(/\.modal-disclosure\s*\{[^}]*opacity\s*:/);
  });
});

describe('modal a11y — focus save / trap / restore behavior', () => {
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
  function makeEl(name) {
    const h = {};
    return {
      name,
      classList: makeClassList(),
      attrs: {},
      focusCount: 0,
      addEventListener(ev, fn) { h[ev] = fn; },
      setAttribute(k, v) { this.attrs[k] = v; },
      focus() { this.focusCount++; globalThis.document.activeElement = this; },
      _fire(ev, arg) { return h[ev] && h[ev](arg); },
    };
  }
  function makeRefs() {
    return {
      aboutModal: makeEl('aboutModal'), aboutBtn: makeEl('aboutBtn'), aboutClose: makeEl('aboutClose'),
      forgetModal: makeEl('forgetModal'), forgetBtn: makeEl('forgetBtn'),
      forgetCancel: makeEl('forgetCancel'), forgetConfirm: makeEl('forgetConfirm'),
      ageGateModal: makeEl('ageGateModal'), ageGateConfirm: makeEl('ageGateConfirm'),
    };
  }

  beforeEach(() => {
    globalThis.document = {
      activeElement: null,
      addEventListener() {},
    };
    globalThis.localStorage = {
      getItem: () => null, setItem: () => {}, removeItem: () => {},
    };
  });
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    if (originalLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = originalLocalStorage;
  });

  it('opening about focuses its close button; closing restores the opener', () => {
    const refs = makeRefs();
    const opener = makeEl('opener');
    initModalsUI(refs, {});
    opener.focus(); // the user was on the ⓘ button
    refs.aboutBtn._fire('click');
    expect(refs.aboutClose.focusCount).toBe(1);
    refs.aboutClose._fire('click');
    expect(opener.focusCount).toBe(2); // initial + restore
    expect(globalThis.document.activeElement).toBe(opener);
  });

  it('opening forget focuses the non-destructive "leave it" control', () => {
    const refs = makeRefs();
    initModalsUI(refs, {});
    refs.forgetBtn._fire('click');
    expect(refs.forgetCancel.focusCount).toBe(1);
    expect(refs.forgetConfirm.focusCount).toBe(0);
  });

  it('Tab on the last focusable wraps to the first (and shift+Tab the reverse) while open', () => {
    const refs = makeRefs();
    const first = makeEl('first');
    const last = makeEl('last');
    refs.aboutModal.querySelectorAll = () => [first, last];
    initModalsUI(refs, {});
    refs.aboutBtn._fire('click'); // the trap only engages on an OPEN modal
    let prevented = 0;
    const evt = key => ({ key, shiftKey: false, preventDefault: () => prevented++ });

    globalThis.document.activeElement = last;
    refs.aboutModal._fire('keydown', evt('Tab'));
    expect(prevented).toBe(1);
    expect(first.focusCount).toBe(1);

    // shift+Tab from the first wraps back to the last
    refs.aboutModal._fire('keydown', { key: 'Tab', shiftKey: true, preventDefault: () => prevented++ });
    expect(prevented).toBe(2);
    expect(last.focusCount).toBe(1);

    // non-Tab keys pass through untouched
    refs.aboutModal._fire('keydown', evt('Enter'));
    expect(prevented).toBe(2);
  });

  it('a CLOSED modal never traps Tab (regression: invisible keyboard trap)', () => {
    // Closed modals stay in the DOM (hidden via opacity/visibility). If the
    // trap engaged on them, a keyboard user tabbing into a residually
    // focusable control could never Tab out of an invisible dialog.
    const refs = makeRefs();
    const first = makeEl('first');
    const last = makeEl('last');
    refs.aboutModal.querySelectorAll = () => [first, last];
    initModalsUI(refs, {});
    let prevented = 0;
    globalThis.document.activeElement = last;
    refs.aboutModal._fire('keydown', { key: 'Tab', shiftKey: false, preventDefault: () => prevented++ });
    expect(prevented).toBe(0);
    expect(first.focusCount).toBe(0);
  });

  it('stacked modals restore openers in order (opener stack, not a single slot)', () => {
    const refs = makeRefs();
    const pageBtn = makeEl('pageBtn');
    initModalsUI(refs, {});
    pageBtn.focus();
    refs.aboutBtn._fire('click');        // about opens; saves pageBtn
    refs.forgetBtn._fire('click');       // forget opens over it; saves aboutClose
    expect(refs.forgetCancel.focusCount).toBe(1);
    refs.forgetCancel._fire('click');    // forget closes → focus back to aboutClose
    expect(refs.aboutClose.focusCount).toBe(2); // open-focus + restore
    refs.aboutClose._fire('click');      // about closes → focus back to pageBtn
    expect(pageBtn.focusCount).toBe(2);
  });

  it('paywall open focuses "maybe later" and close restores the opener (shake button)', () => {
    const modal = makeEl('paywallModal');
    const closeBtn = makeEl('paywallClose');
    const shakeBtn = makeEl('shakeBtn');
    initPaywallUI({ modal, closeBtn, banner: makeEl('banner') });
    shakeBtn.focus();
    openPaywall();
    expect(closeBtn.focusCount).toBe(1);
    expect(modal.classList.contains('open')).toBe(true);
    closePaywall();
    expect(shakeBtn.focusCount).toBe(2);
    expect(modal.classList.contains('open')).toBe(false);
  });
});
