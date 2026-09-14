// 8ball / ui / activate.js — the activation page's only script (DOCTRINE §5.B call 3, v0.91)
//
// PAYWALL REMOVED 2026-09-14 (PAYWALL-REMOVE-01, controller order): DEAD.
// activate.html no longer imports this module — it now redirects straight to
// `/` (the dyad is free for every device). Kept, unreferenced, for one-commit
// revert; deletion PR tracked as a follow-up, not filed yet.
//
// The page itself is a plain form that POSTs a license key to the one
// same-origin function. This script does exactly one thing: when the
// function sends the reader back with `?e=<reason>`, show the matching fixed
// sentence and strip the query. It reads nothing else, stores nothing, and
// the form submits without it.
export const ACTIVATE_REASONS = Object.freeze({
  invalid:      'that key did not verify. check it against your receipt and try again.',
  refunded:     'that purchase was refunded, so its key no longer opens the dyad.',
  unavailable:  'the license service could not be reached — try again in a minute. nothing was filed.',
  shape:        'that does not look like a license key (four groups of eight characters).',
  unconfigured: 'activation is not switched on for this build yet. the emailed access link still works.',
});

export function reasonFrom(search) {
  try { return new URLSearchParams(String(search || '')).get('e') || null; } catch (_) { return null; }
}

export function initActivatePage({ status, search, replace } = {}) {
  const reason = reasonFrom(search);
  const text = reason && Object.prototype.hasOwnProperty.call(ACTIVATE_REASONS, reason) ? ACTIVATE_REASONS[reason] : null;
  if (status) { status.textContent = text || ''; status.hidden = !text; }
  if (reason !== null && typeof replace === 'function') replace();
  return text;
}
