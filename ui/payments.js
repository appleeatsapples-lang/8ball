// 8ball / ui/payments.js
// v0.3.0 paid-surface controller (DOCTRINE §4.B / §5 v0.22 / §6).
//
// Owns:
//   - localStorage keys for tries_used / credits / pending_profile
//   - getter/setter shims for the three counters
//   - paywall modal open/close + outside-click + Escape handlers
//   - paid-return banner fade animation
//   - the `?paid=t1` redirect handler (handlePaidReturn) which calls
//     applyPaidReturn from core/payments.js, persists the new counters,
//     and signals to the caller whether a pending profile was consumed
//
// Does NOT own:
//   - the state-machine logic itself (lives in core/payments.js — pure,
//     no DOM, vitest-testable without jsdom)
//   - the stored-profile shape or saveProfile/loadSavedProfile (those
//     are in index.html alongside the v0.2.7.2 city+tz payload schema;
//     this module passes the consumed pending profile back via callback)
//   - the unlocked-render branch in renderCard (lives in index.html
//     because it shares cardFace + the symbol-render state)
//   - the lock-icon Path B click handler or the form-submit Path A
//     branch (both call openPaywall directly from index.html)
//
// Extracted from index.html at step 6/12 of v0.3.0 because index.html
// crossed the 1500-line single-file ceiling (DOCTRINE §6). The split
// target — `ui/*.js` modules — is exactly what §6 specifies.

import { applyPaidReturn } from '../core/payments.js';

// ── localStorage keys ─────────────────────────────────────────────
// All three keys are in the §5 v0.22 allow-list. tests/privacy_scan
// resolves identifier-as-key via same-file `const IDENT = '...'` lookup,
// so the bare string definitions here are mandatory for the scan.
export const TRIES_KEY = 'eight_ball_tries_used_v1';
export const CREDITS_KEY = 'eight_ball_credits_v1';
export const PENDING_KEY = 'eight_ball_pending_profile_v1';

// ── counter shims ─────────────────────────────────────────────────
// Three counters live in localStorage:
//   tries_used  monotonic int — increments per new-pair render (locked
//               or unlocked). Cap is FREE_TRIES_CAP=3 in core/payments.js.
//   credits     decrementing int — +3 on every ?paid=t1 return,
//               -1 per new-pair render while > 0.
//   pending     JSON payload — written when the paywall opens (Path A
//               or B), consumed on the ?paid=t1 return to render the
//               user's pending profile unlocked. Lifetime is one
//               round-trip.
//
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning a safe zero/null default. Writes silently
// no-op on exception — the worst case is that counters reset on the
// next visit, which is the same shape as a fresh user.

export function getTriesUsed() {
  try { return parseInt(localStorage.getItem(TRIES_KEY) || '0', 10) || 0; }
  catch (_) { return 0; }
}
export function setTriesUsed(n) {
  try { localStorage.setItem(TRIES_KEY, String(n)); } catch (_) {}
}
export function getCredits() {
  try { return parseInt(localStorage.getItem(CREDITS_KEY) || '0', 10) || 0; }
  catch (_) { return 0; }
}
export function setCredits(n) {
  try { localStorage.setItem(CREDITS_KEY, String(n)); } catch (_) {}
}
export function getPendingProfile() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.name && obj.dob) return obj;
    return null;
  } catch (_) { return null; }
}
export function setPendingProfile(payload) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); }
  catch (_) {}
}
export function clearPendingProfile() {
  try { localStorage.removeItem(PENDING_KEY); } catch (_) {}
}

// ── paywall modal + banner ────────────────────────────────────────
// DOM refs are injected at boot via initPaywallUI so this module
// remains import-safe before the DOM parses. The "unlock · $3" CTA is
// a plain <a href> in the HTML — no JS hook, browser navigates same-
// origin to the LS Buy Link on tap (DOCTRINE §5.B Call 2).

let paywallModal = null;
let paywallClose = null;
let paidBanner = null;

export function initPaywallUI({ modal, closeBtn, banner }) {
  paywallModal = modal;
  paywallClose = closeBtn;
  paidBanner = banner;
  paywallClose.addEventListener('click', closePaywall);
  paywallModal.addEventListener('click', e => {
    if (e.target === paywallModal) closePaywall();
  });
}

export function openPaywall() {
  paywallModal.classList.add('open');
  paywallModal.setAttribute('aria-hidden', 'false');
}

export function closePaywall() {
  paywallModal.classList.remove('open');
  paywallModal.setAttribute('aria-hidden', 'true');
}

export function isPaywallOpen() {
  return paywallModal != null && paywallModal.classList.contains('open');
}

export function showPaidBanner() {
  paidBanner.hidden = false;
  // Force reflow so the opacity transition fires from 0 → 1.
  void paidBanner.offsetWidth;
  paidBanner.classList.add('visible');
  setTimeout(() => {
    paidBanner.classList.remove('visible');
    setTimeout(() => { paidBanner.hidden = true; }, 600);
  }, 4000);
}

// ── paid-return handler (§5.B Call 2 / §6.6 / §7.2) ───────────────
// Reads `?paid=t1` and runs applyPaidReturn. Credits += 3; if a pending
// profile is present (Path A or B paywall trigger wrote it before the
// redirect) one credit is consumed and the caller's onConsumePending
// callback is fired with the profile so it can persist it through the
// host's saveProfile (which owns the v0.2.7.2 city+tz payload shape).
// Always strips the query string and shows the banner; returns true iff
// a pending profile was consumed.
//
// Caller is expected to fire this from inside the 18+-gate-cleared
// boot path so the credits + banner sequence after age-ack, not before.

export function handlePaidReturn(onConsumePending) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paid') !== 't1') return false;
  const paidState = applyPaidReturn({
    credits: getCredits(),
    triesUsed: getTriesUsed(),
    pendingProfile: getPendingProfile()
  });
  setCredits(paidState.credits);
  setTriesUsed(paidState.triesUsed);
  clearPendingProfile();
  let consumedPending = false;
  if (paidState.action === 'render-unlocked' && paidState.profile) {
    if (typeof onConsumePending === 'function') {
      onConsumePending(paidState.profile);
    }
    consumedPending = true;
  }
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, '', window.location.pathname);
  }
  showPaidBanner();
  return consumedPending;
}
