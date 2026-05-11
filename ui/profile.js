// v0.3.0 profile + form-rendering controller (DOCTRINE §5 v0.22 / §6).
//
// Owns:
//   - localStorage key for the stored profile (eight_ball_profile_v1)
//   - pure persistence helpers: loadSavedProfile / saveProfile / clearProfile
//   - payload-shape helpers: optsFromPayload / profileFromPayload
//   - DOM-touching form helpers: populateRisingFields / resetFormDisplay
//
// Does NOT own:
//   - the renderCard branch or any catalog/symbol render code (shares
//     cardFace state with the symbol pipeline, lives in index.html)
//   - currentProfile / selectedCity / currentRenderUnlocked module-state
//     in index.html — those are mutated via host-injected hooks
//     (setSelectedCity, setCurrentProfile) so the host stays the single
//     owner of its own let-bindings
//   - the v0.3.0 paid-surface controllers (see ui/payments.js)
//
// Extracted from index.html at step 7/12 of v0.3.0 to absorb the line-
// budget concern raised by the codex pre-merge audit of step 6 (hook
// 8 P1). Mirrors the DI shape established by ui/payments.js.

import { buildProfile } from '../core/profile.js';
import { getCountryName } from '../core/cities.js';

// ── localStorage key ─────────────────────────────────────────────
// Internal-only — only the three persistence helpers in this module
// read or write to it, so it does not need to be exported. The literal
// string is resolved in-file by tests/privacy_scan.test.js's same-file
// identifier lookup against LOCALSTORAGE_KEY_ALLOW.
const STORAGE_KEY = 'eight_ball_profile_v1';

// ── pure persistence ─────────────────────────────────────────────
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning null / silently no-op'ing. The v0.2.7.2
// city+tz payload shape is preserved verbatim — saveProfile copies
// every known key only if present and well-typed.

export function loadSavedProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.name && obj.dob) return obj;
  } catch (_) {}
  return null;
}

export function saveProfile(name, dob, opts) {
  const payload = { name, dob };
  if (opts) {
    if (opts.time) payload.time = opts.time;
    if (opts.city) payload.city = opts.city;
    if (opts.cc) payload.cc = opts.cc;
    if (typeof opts.tz === 'string') payload.tz = opts.tz;
    if (opts.country) payload.country = opts.country;
    if (typeof opts.lat === 'number' && !isNaN(opts.lat)) payload.lat = opts.lat;
    if (typeof opts.lng === 'number' && !isNaN(opts.lng)) payload.lng = opts.lng;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
  catch (_) {}
}

export function clearProfile() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

export function optsFromPayload(obj) {
  const opts = {};
  if (obj.time) opts.time = obj.time;
  if (typeof obj.tz === 'string') opts.tz = obj.tz;
  if (obj.country) opts.country = obj.country;
  if (typeof obj.lat === 'number') opts.lat = obj.lat;
  if (typeof obj.lng === 'number') opts.lng = obj.lng;
  return opts;
}

export function profileFromPayload(obj) {
  return buildProfile(obj.name, obj.dob, optsFromPayload(obj));
}

// ── DOM-touching form helpers (DI injected at boot) ───────────────
// DOM refs and the two cross-module state setters (selectedCity,
// currentProfile both live in index.html as `let` bindings) are
// passed in via initProfileUI so this module remains import-safe
// before the DOM parses. Same shape as ui/payments.js initPaywallUI.

let _refs = null;
let _hooks = null;

export function initProfileUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
}

export function populateRisingFields(obj) {
  const r = _refs;
  r.timeInput.value = obj.time || '';
  r.legacyHint.hidden = true;
  r.polarMessage.hidden = true;
  if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
  r.cityInput.value = '';
  // Two profile shapes coexist this cycle:
  //   v0.2.7.2+ → { tz, lat, lng, city?, cc? }     → rehydrate cityInput
  //   v0.2.1+   → { country, lat, lng }            → surface legacy hint
  const hasNew = typeof obj.tz === 'string' && typeof obj.lat === 'number';
  const hasLegacy = !hasNew && obj.country && typeof obj.lat === 'number';
  if (hasNew) {
    const countryName = obj.cc ? (getCountryName(obj.cc) || obj.cc) : '';
    const city = {
      name: obj.city || '—',
      country: countryName,
      countryCode: obj.cc || '',
      lat: obj.lat,
      lng: obj.lng,
      tz: obj.tz,
      pop: 0
    };
    if (_hooks.setSelectedCity) _hooks.setSelectedCity(city);
    r.cityInput.value = countryName
      ? city.name + ', ' + countryName
      : city.name;
    r.polarMessage.hidden = Math.abs(obj.lat) <= 66.5;
  } else if (hasLegacy) {
    r.legacyHint.hidden = false;
  }
  if (obj.time || hasNew || hasLegacy) {
    r.risingFields.setAttribute('open', '');
  }
}

export function resetFormDisplay() {
  // v0.3.0 (DOCTRINE §6.8): clears the form DOM only, not localStorage.
  // Caller is responsible for clearing the stored profile separately
  // when the intent is a real reset (e.g. "forget this device").
  const r = _refs;
  r.result.classList.add('hidden');
  r.onboarding.classList.remove('hidden');
  r.onboarding.classList.add('reveal');
  r.nameInput.value = '';
  r.dobInput.value = '';
  r.timeInput.value = '';
  r.cityInput.value = '';
  r.citySuggestions.innerHTML = '';
  if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
  r.polarMessage.hidden = true;
  r.legacyHint.hidden = true;
  r.risingFields.removeAttribute('open');
  if (_hooks.setCurrentProfile) _hooks.setCurrentProfile(null);
  // Move focus to the name field so keyboard and screen-reader users
  // land on the next interactive element. Without this, focus can
  // remain on the now-hidden 'try another' button after re-entry.
  r.nameInput.focus();
}
