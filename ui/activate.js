// 8ball / ui / activate.js — the activation page's only script (DOCTRINE §5.B call 3, v0.91)
//
// The page itself is a plain form that POSTs a license key to the one
// same-origin function. This script does exactly one thing: when the
// function sends the reader back with `?e=<reason>`, show the matching fixed
// sentence and strip the query. It reads nothing else, stores nothing, and
// the form submits without it.
export const ACTIVATE_REASONS = Object.freeze({
  invalid:      'that key did not verify. check it against your gumroad receipt and try again.',
  refunded:     'that purchase was refunded, so its key no longer opens the dyad.',
  unavailable:  'gumroad could not be reached — try again in a minute. nothing was filed.',
  shape:        'that does not look like a gumroad license key (four groups of eight characters).',
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
