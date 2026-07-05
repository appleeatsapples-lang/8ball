// modal controllers — about / forget-me / 18+ age gate + escape-to-close
// (DOCTRINE §4.A age gate · §6 split).
//
// Owns:
//   - the 18+ acknowledgment localStorage key (eight_ball_age_ack_v1)
//   - pure read: isAgeAcknowledged
//   - DOM-touching init: wires the about / forget / age-gate modals and the
//     shared Escape-closes-any-open-modal handler; returns showAgeGate so
//     the host can open the gate at boot when ack is absent
//
// Does NOT own:
//   - the paywall modal (lives in ui/payments.js); the Escape handler closes
//     it via the injected isPaywallOpen / closePaywall hooks
//   - the boot sequence (initAfterAck stays in index.html, injected as the
//     onAgeAck hook), profile persistence (clearProfile / resetFormDisplay
//     are injected hooks from ui/profile.js)
//
// Extracted from index.html during the Coordinate Legibility Pack cycle to
// free the line budget for the provenance surface (index.html was 1496/1500).
// Mirrors the DI shape of ui/payments.js / ui/profile.js / ui/labels.js
// (v0.23 §6 amendment): a pure export testable without jsdom alongside a
// single init*UI({refs}, {hooks}) injection point.

// ── localStorage key ─────────────────────────────────────────────
// Bare-string const so tests/privacy_scan.test.js's same-file identifier
// lookup resolves it against LOCALSTORAGE_KEY_ALLOW. Relocated from
// index.html, NOT a new key.
const AGE_ACK_KEY = 'eight_ball_age_ack_v1';

// Pure read — defends against a localStorage exception (private mode,
// quota): an unreadable store reads as not-acknowledged, so the gate shows.
export function isAgeAcknowledged() {
  try { return localStorage.getItem(AGE_ACK_KEY) === 'true'; }
  catch (_) { return false; }
}

// ── shared modal focus management ────────────────────────────────
// One modal is open at a time in this app, so a single saved opener
// suffices. Guards degrade to no-ops under the suite's hand-rolled DOM
// mocks (node env, no jsdom): a missing document/activeElement/focus
// just skips the focus move. ui/payments.js imports these for the
// paywall — the dependency stays one-way (modals.js never imports
// payments.js; the Escape handler reaches the paywall via hooks).

let _openerEl = null;

export function modalOpened(focusTarget) {
  _openerEl = (typeof document !== 'undefined' && document.activeElement) || null;
  if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
}

export function modalClosed() {
  if (_openerEl && typeof _openerEl.focus === 'function') _openerEl.focus();
  _openerEl = null;
}

// Keep Tab inside an open dialog: aria-modal="true" tells assistive tech
// the page behind is inert, and this enforces it for the keyboard.
export function trapTab(modalEl) {
  modalEl.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || typeof modalEl.querySelectorAll !== 'function') return;
    const focusables = modalEl.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ── DOM-touching init ────────────────────────────────────────────
// Wires the three content modals + the shared Escape handler. Returns
// showAgeGate (+ the open/close helpers) so the host drives the boot gate.
export function initModalsUI(refs, hooks) {
  const {
    aboutModal, aboutBtn, aboutClose,
    forgetModal, forgetBtn, forgetCancel, forgetConfirm,
    ageGateModal, ageGateConfirm,
  } = refs;
  const h = hooks || {};

  // about
  function openAbout() {
    aboutModal.classList.add('open');
    aboutModal.setAttribute('aria-hidden', 'false');
    modalOpened(aboutClose);
  }
  function closeAbout() {
    aboutModal.classList.remove('open');
    aboutModal.setAttribute('aria-hidden', 'true');
    modalClosed();
  }
  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  aboutModal.addEventListener('click', e => { if (e.target === aboutModal) closeAbout(); });

  // forget-me — "forget this device" is the full erase: clear stored profile
  // and return the form to its empty state. Distinct from "try another",
  // which clears only the form DOM and keeps the stored profile.
  function openForget() {
    forgetModal.classList.add('open');
    forgetModal.setAttribute('aria-hidden', 'false');
    // Focus lands on "leave it" so Enter can't erase by accident.
    modalOpened(forgetCancel);
  }
  function closeForget() {
    forgetModal.classList.remove('open');
    forgetModal.setAttribute('aria-hidden', 'true');
    modalClosed();
  }
  forgetBtn.addEventListener('click', openForget);
  forgetCancel.addEventListener('click', closeForget);
  forgetConfirm.addEventListener('click', () => {
    if (h.clearProfile) h.clearProfile();
    closeForget();
    if (h.resetFormDisplay) h.resetFormDisplay();
  });
  forgetModal.addEventListener('click', e => { if (e.target === forgetModal) closeForget(); });

  // 18+ acknowledgment gate (DOCTRINE.md §4.A)
  function showAgeGate() {
    ageGateModal.classList.add('open');
    ageGateModal.setAttribute('aria-hidden', 'false');
    modalOpened(ageGateConfirm);
  }
  function acknowledgeAge() {
    try { localStorage.setItem(AGE_ACK_KEY, 'true'); }
    catch (_) { /* localStorage unavailable; ack survives only this session */ }
    ageGateModal.classList.remove('open');
    ageGateModal.setAttribute('aria-hidden', 'true');
    modalClosed();
    if (h.onAgeAck) h.onAgeAck();
  }
  ageGateConfirm.addEventListener('click', acknowledgeAge);

  trapTab(aboutModal);
  trapTab(forgetModal);
  trapTab(ageGateModal);

  // escape closes any open modal (paywall via injected hooks — it lives in
  // ui/payments.js)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (aboutModal.classList.contains('open')) closeAbout();
    if (forgetModal.classList.contains('open')) closeForget();
    if (h.isPaywallOpen && h.isPaywallOpen()) { if (h.closePaywall) h.closePaywall(); }
  });

  return { showAgeGate, openAbout, closeAbout, openForget, closeForget };
}
