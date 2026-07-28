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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initModalsUI } from '../ui/modals.js';
import { initPaywallUI, openPaywall, closePaywall } from '../ui/payments.js';
import { makeEl, makeModalRefs } from './helpers/dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('modal a11y — markup pins', () => {
  it('all three dialogs carry aria-modal="true" alongside role="dialog"', () => {
    // Was four before the 18+ age-gate modal's removal (journal 2026-07-06).
    const dialogs = html.match(/role="dialog"/g) || [];
    const modal = html.match(/role="dialog" aria-modal="true"/g) || [];
    expect(dialogs).toHaveLength(3);
    expect(modal).toHaveLength(3);
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

  // makeEl / makeModalRefs come from ./helpers/dom.js (the shared modal mock).

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
    const refs = makeModalRefs();
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
    const refs = makeModalRefs();
    initModalsUI(refs, {});
    refs.forgetBtn._fire('click');
    expect(refs.forgetCancel.focusCount).toBe(1);
    expect(refs.forgetConfirm.focusCount).toBe(0);
  });

  it('Tab on the last focusable wraps to the first (and shift+Tab the reverse) while open', () => {
    const refs = makeModalRefs();
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
    const refs = makeModalRefs();
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
    const refs = makeModalRefs();
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

  // ── paywall backdrop ───────────────────────────────────────────────
  // ui/payments.js:178-180, the last uncovered function in that module.
  // Same shape as the two content-modal backdrops, and the same reason
  // it matters: the false arm of `e.target === paywallModal` is what
  // stops a tap on the dialog's own padding — right next to a Buy link —
  // from dismissing the offer out from under the visitor.
  it('paywall: a click on the backdrop itself dismisses and restores focus', () => {
    const modal = makeEl('paywallModal');
    const closeBtn = makeEl('paywallClose');
    const shakeBtn = makeEl('shakeBtn');
    initPaywallUI({ modal, closeBtn, banner: makeEl('banner') });
    shakeBtn.focus();
    openPaywall();
    expect(modal.classList.contains('open')).toBe(true);

    modal._fire('click', { target: modal });

    expect(modal.classList.contains('open')).toBe(false);
    expect(modal.attrs['aria-hidden']).toBe('true');
    expect(shakeBtn.focusCount).toBe(2); // initial + restore
  });

  it('paywall: a click INSIDE the dialog leaves the offer up', () => {
    const modal = makeEl('paywallModal');
    const closeBtn = makeEl('paywallClose');
    const buyLink = makeEl('buyLink');
    initPaywallUI({ modal, closeBtn, banner: makeEl('banner') });
    openPaywall();

    modal._fire('click', { target: buyLink });
    expect(modal.classList.contains('open')).toBe(true);
    modal._fire('click', { target: closeBtn });
    expect(modal.classList.contains('open')).toBe(true);
    expect(modal.attrs['aria-hidden']).toBe('false');

    // leave the shared opener stack as we found it
    closePaywall();
  });

  it('paywall: the close button dismisses it', () => {
    // paywallClose is wired straight to closePaywall at
    // ui/payments.js:177 — no test had ever fired that listener, only
    // called closePaywall() directly.
    const modal = makeEl('paywallModal');
    const closeBtn = makeEl('paywallClose');
    initPaywallUI({ modal, closeBtn, banner: makeEl('banner') });
    openPaywall();

    closeBtn._fire('click');
    expect(modal.classList.contains('open')).toBe(false);
  });
});

// ── the opener stack under imbalance ─────────────────────────────────
// `_openers` (ui/modals.js:34) is module-level state shared by both
// content modals AND the paywall in ui/payments.js. The stacked-restore
// case above covers the balanced path. What follows covers the pop from
// an EMPTY stack (ui/modals.js:46-47), which no test reached — and which
// is reachable in production, because initPaywallUI wires closeBtn
// straight to closePaywall, so a click on the paywall's close control
// before anything opened it pops an opener that was never pushed.
//
// Each test takes a fresh module so the stack is provably empty at the
// start rather than merely balanced by the tests that ran before it.
describe('modal focus — opener-stack underflow', () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = { activeElement: null, addEventListener() {} };
  });
  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  it('closing a modal that was never opened is a no-op, not a throw', async () => {
    vi.resetModules();
    const fresh = await import('../ui/modals.js');
    const stray = makeEl('strayModal');

    expect(() => fresh.closeModal(stray)).not.toThrow();
    // the coupled triplet still applies — class off, aria-hidden on
    expect(stray.classList.contains('open')).toBe(false);
    expect(stray.attrs['aria-hidden']).toBe('true');
    // and nothing was focused, because there was no opener to restore
    expect(globalThis.document.activeElement).toBe(null);
  });

  it('a double close pops an opener that belongs to another dialog', async () => {
    // Pinning the hazard rather than blessing it: one unbalanced close
    // shifts every saved opener by one, so the dialog still open loses
    // its restore target. If closeModal ever grows an emptiness guard or
    // a paired-open assertion, this expectation is what should change.
    vi.resetModules();
    const fresh = await import('../ui/modals.js');
    const pageBtn = makeEl('pageBtn');
    const modalA = makeEl('modalA');
    const closeA = makeEl('closeA');
    const modalB = makeEl('modalB');
    const closeB = makeEl('closeB');

    pageBtn.focus();
    fresh.openModal(modalA, closeA);   // pushes pageBtn
    fresh.openModal(modalB, closeB);   // pushes closeA
    fresh.closeModal(modalB);          // pops closeA — correct
    expect(closeA.focusCount).toBe(2); // open-focus + restore

    fresh.closeModal(modalB);          // stray second close: pops pageBtn
    expect(pageBtn.focusCount).toBe(2);

    // modalA is still open, but its opener has already been consumed
    fresh.closeModal(modalA);
    expect(pageBtn.focusCount).toBe(2); // no further restore — it was taken
  });

  it('openModal survives a focus target that cannot take focus', async () => {
    // ui/modals.js:40 — the `typeof focusTarget.focus === 'function'`
    // arm. Both production call sites always pass a real control, so the
    // falsy arm never ran.
    vi.resetModules();
    const fresh = await import('../ui/modals.js');
    const modal = makeEl('modal');

    expect(() => fresh.openModal(modal, undefined)).not.toThrow();
    expect(() => fresh.openModal(modal, { nodeName: 'DIV' })).not.toThrow();
    expect(modal.classList.contains('open')).toBe(true);
    expect(modal.attrs['aria-hidden']).toBe('false');
  });
});
