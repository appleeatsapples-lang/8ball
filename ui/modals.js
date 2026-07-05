// modal controllers — about / forget-me + escape-to-close (§6 split).
//
// Owns:
//   - DOM-touching init: wires the about / forget modals and the shared
//     Escape-closes-any-open-modal handler
//
// Does NOT own:
//   - the paywall modal (lives in ui/payments.js); the Escape handler closes
//     it via the injected isPaywallOpen / closePaywall hooks
//   - profile persistence (clearProfile / resetFormDisplay are injected
//     hooks from ui/profile.js)
//
// Extracted from index.html during the Coordinate Legibility Pack cycle to
// free the line budget for the provenance surface (index.html was 1496/1500).
// Mirrors the DI shape of ui/payments.js / ui/profile.js / ui/labels.js
// (v0.23 §6 amendment): a pure export testable without jsdom alongside a
// single init*UI({refs}, {hooks}) injection point.
//
// v0.48: the 18+ acknowledgment gate (§4.A) this module used to own —
// AGE_ACK_KEY, isAgeAcknowledged, showAgeGate — was retired; see journal
// 2026-07-06.

// ── shared modal open/close + focus management ───────────────────
// openModal/closeModal own the full coupled triplet — .open class,
// aria-hidden, and focus save/restore — so a call site can't apply one
// step and forget the others. Saved openers are a small stack, not a
// single slot, so a second modal opening over a first (or one Escape
// closing several) still restores each opener correctly. Guards degrade
// to no-ops under the suite's hand-rolled DOM mocks (node env, no
// jsdom). ui/payments.js imports these for the paywall — the dependency
// stays one-way (modals.js never imports payments.js; the Escape
// handler reaches the paywall via hooks).

const _openers = [];

export function openModal(modalEl, focusTarget) {
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  _openers.push((typeof document !== 'undefined' && document.activeElement) || null);
  if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
}

export function closeModal(modalEl) {
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  const opener = _openers.pop();
  if (opener && typeof opener.focus === 'function') opener.focus();
}

// Keep Tab inside an OPEN dialog: aria-modal="true" tells assistive tech
// the page behind is inert, and this enforces it for the keyboard. The
// .open check is load-bearing: closed modals are hidden via opacity/
// visibility, not removed from the DOM, so without it the trap would
// pin keyboard focus inside an invisible dialog.
export function trapTab(modalEl) {
  modalEl.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (!modalEl.classList.contains('open')) return;
    if (typeof modalEl.querySelectorAll !== 'function') return;
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
// Wires the two content modals + the shared Escape handler.
export function initModalsUI(refs, hooks) {
  const {
    aboutModal, aboutBtn, aboutClose,
    forgetModal, forgetBtn, forgetCancel, forgetConfirm,
  } = refs;
  const h = hooks || {};

  // about
  function openAbout() { openModal(aboutModal, aboutClose); }
  function closeAbout() { closeModal(aboutModal); }
  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  aboutModal.addEventListener('click', e => { if (e.target === aboutModal) closeAbout(); });

  // forget-me — "forget this device" is the full erase: clear stored profile
  // and return the form to its empty state. Distinct from "try another",
  // which clears only the form DOM and keeps the stored profile.
  // Focus lands on "leave it" so Enter can't erase by accident.
  function openForget() { openModal(forgetModal, forgetCancel); }
  function closeForget() { closeModal(forgetModal); }
  forgetBtn.addEventListener('click', openForget);
  forgetCancel.addEventListener('click', closeForget);
  forgetConfirm.addEventListener('click', () => {
    if (h.clearProfile) h.clearProfile();
    closeForget();
    if (h.resetFormDisplay) h.resetFormDisplay();
  });
  forgetModal.addEventListener('click', e => { if (e.target === forgetModal) closeForget(); });

  trapTab(aboutModal);
  trapTab(forgetModal);

  // escape closes any open modal (paywall via injected hooks — it lives in
  // ui/payments.js)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (aboutModal.classList.contains('open')) closeAbout();
    if (forgetModal.classList.contains('open')) closeForget();
    if (h.isPaywallOpen && h.isPaywallOpen()) { if (h.closePaywall) h.closePaywall(); }
  });

  return { openAbout, closeAbout, openForget, closeForget };
}
