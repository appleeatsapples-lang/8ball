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
import { isPolarLatitude } from '../core/rising.js';
import { formatCityLabel } from './citysearch.js';

// ── localStorage key ─────────────────────────────────────────────
// Internal-only — only the three persistence helpers in this module
// read or write to it, so it does not need to be exported. The literal
// string is resolved in-file by tests/privacy_scan.test.js's same-file
// identifier lookup against LOCALSTORAGE_KEY_ALLOW.
const STORAGE_KEY = 'eight_ball_profile_v1';

// ── pure persistence ─────────────────────────────────────────────
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning null. Persistence mutations return read-verified
// booleans so paid-return recovery and device erasure can remain retryable.
// The v0.2.7.2 city+tz payload shape is preserved verbatim — saveProfile
// copies every known key only if present and well-typed.

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
    // §1.D kua amendment / §5 amendment: strict two-token vocabulary at
    // every write seam — anything else is dropped, not stored.
    if (opts.gender === 'male' || opts.gender === 'female') payload.gender = opts.gender;
  }
  try {
    const raw = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, raw);
    return localStorage.getItem(STORAGE_KEY) === raw;
  } catch (_) { return false; }
}

export function clearProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return localStorage.getItem(STORAGE_KEY) === null;
  } catch (_) { return false; }
}

export function optsFromPayload(obj) {
  const opts = {};
  if (obj.time) opts.time = obj.time;
  if (typeof obj.tz === 'string') opts.tz = obj.tz;
  if (obj.country) opts.country = obj.country;
  if (typeof obj.lat === 'number') opts.lat = obj.lat;
  if (typeof obj.lng === 'number') opts.lng = obj.lng;
  // Calc-driving (the kua block reads profile.gender), so it MUST forward
  // here — unlike display-only city/cc. A field present in saveProfile but
  // absent here would make cold-boot recompute a different reading than
  // the fresh submit (§5 recompute-on-load).
  if (obj.gender === 'male' || obj.gender === 'female') opts.gender = obj.gender;
  return opts;
}

export function profileFromPayload(obj) {
  return buildProfile(obj.name, obj.dob, optsFromPayload(obj));
}

// ── shared birth-input validation contract ────────────────────────
// ONE validator for every form that collects (name, dob): the primary
// onboarding form and the §1.J dyad second-person form (PR #187 finding F3
// — the dyad form had no max date and no year/future/whitespace checks,
// because it never called this logic at all). A future date, a pre-1900
// year, or an empty/whitespace-only name are all rejected the same way on
// both forms because they run the same function, not two copies that can
// drift apart on the next edit.
//
// HTML5 max= is a soft fence (devtools-bypassable); this is the real gate,
// so both sites also set `input.max = todayIsoLocal()`.
// Local, deliberately not `toISOString().slice(0,10)`: that is UTC, and east
// of UTC after local midnight a same-day birth date would read as "future".
export function todayIsoLocal(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * `today` is injectable so the future-date rule can be tested against a fixed
 * calendar instead of whatever day CI happens to run on.
 *
 * `field` names the input a caller should surface the error on; `reason` says
 * why. Both forms route their own error nodes off `field`, so neither has to
 * re-derive which check failed.
 *
 * @returns {{ok: true, name: string, dob: string}
 *          | {ok: false, field: 'name'|'dob', reason: 'name'|'dob'|'future'|'year'}}
 */
export function validateBirthInput({ name, dob }, today = todayIsoLocal()) {
  const trimmed = String(name == null ? '' : name).trim();
  if (!trimmed) return { ok: false, field: 'name', reason: 'name' };
  const iso = String(dob == null ? '' : dob);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { ok: false, field: 'dob', reason: 'dob' };
  const [y, month, day] = iso.split('-').map(Number);
  // core/calendar.js's lunar-new-year and solar-term tables span 1900-2100; a
  // year below that would yield a confidently wrong animal rather than an error.
  if (!Number.isInteger(y) || y < 1900) return { ok: false, field: 'dob', reason: 'year' };
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
    return { ok: false, field: 'dob', reason: 'dob' };
  }
  // ISO date strings compare lexicographically the same as chronologically,
  // so `iso > today` catches today-plus-one through any future year cleanly.
  if (iso > today) return { ok: false, field: 'dob', reason: 'future' };
  return { ok: true, name: trimmed, dob: iso };
}

export const BIRTH_INPUT_ERROR_MESSAGES = Object.freeze({
  dob: 'enter a valid date of birth.',
  future: "date of birth can't be in the future.",
  year: 'date of birth must be 1900 or later.',
});

// Apply the shared validator's result to the primary form without severing
// the input/error relationship. `aria-describedby` remains in markup at all
// times; only visibility and aria-invalid change. The failing control takes
// focus so keyboard and screen-reader users land where recovery starts.
export function applyBirthInputValidationState(entry, refs) {
  const { nameInput, dobInput, dobError } = refs;
  const invalidDob = !entry.ok && entry.field === 'dob';
  dobError.hidden = !invalidDob;
  dobInput.setAttribute('aria-invalid', String(invalidDob));
  if (invalidDob) {
    dobError.textContent = BIRTH_INPUT_ERROR_MESSAGES[entry.reason]
      || BIRTH_INPUT_ERROR_MESSAGES.dob;
  }
  if (!entry.ok) {
    const target = entry.field === 'dob' ? dobInput : nameInput;
    if (target && typeof target.focus === 'function') target.focus();
  }
  return entry.ok;
}

// ── DOM-touching form helpers (DI injected at boot) ───────────────
// DOM refs and the two cross-module state setters (selectedCity,
// currentProfile both live in index.html as `let` bindings) are
// passed in via initProfileUI so this module remains import-safe
// before the DOM parses. Same shape as ui/payments.js initPaywallUI.

let _refs = null;
let _hooks = null;
let _genderSelect = null;

// ── the optional gender control ───────────────────────────────────
// Rehomed here from ui/kua.js when the kua block was deleted (§1.D
// v0.67). The field is RETAINED on operator word; the module that used
// to own it is gone, and the form controller is its natural home.
//
// NOTE ON RECORD: §5 admitted this field to the storage allow-list on the
// stated ground that it "feeds only the kua line". That consumer no
// longer exists, so the field is currently stored with no reader. Its
// retention is an explicit operator decision, not an oversight — see the
// §1.D v0.67 amendment, which records the open question rather than
// leaving the §5 justification silently void.
//
// The strict two-token vocabulary is unchanged: the empty option IS the
// no-gender state and it is the default; anything off-vocabulary resolves
// undefined at the read seam.
function resolveGenderSelect(refs) {
  if (refs && refs.genderSelect) return refs.genderSelect;
  const form = refs && refs.form;
  if (!form || typeof form.appendChild !== 'function') return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const existing = form.querySelector && form.querySelector('#gender-input');
  if (existing) return existing;
  const field = document.createElement('div');
  field.className = 'field gender-field';
  field.innerHTML = '<label for="gender-input">gender (optional)</label>' +
    '<select id="gender-input">' +
    '<option value="">—</option>' +
    '<option value="male">male</option>' +
    '<option value="female">female</option>' +
    '</select>';
  const anchor = refs && refs.anchor;
  if (anchor && typeof form.insertBefore === 'function' && anchor.parentNode === form) {
    form.insertBefore(field, anchor);
  } else {
    form.appendChild(field);
  }
  return field.querySelector ? field.querySelector('#gender-input') : null;
}

/** The form control's current value under the strict vocabulary. */
export function getGenderInput() {
  const v = _genderSelect && _genderSelect.value;
  return v === 'male' || v === 'female' ? v : undefined;
}

/** Rehydrate/clear the control. Invalid or absent resolves ''. */
export function setGenderInput(v) {
  if (!_genderSelect) return;
  _genderSelect.value = v === 'male' || v === 'female' ? v : '';
}

export function initProfileUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  _genderSelect = resolveGenderSelect(refs);
}

export function populateRisingFields(obj) {
  const r = _refs;
  r.timeInput.value = obj.time || '';
  // Rehydrate the gender control (owned by this module since §1.D v0.67).
  setGenderInput(obj.gender);
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
    // Same formatter + polar authority as a fresh pick in ui/citysearch.js,
    // so a rehydrated birthplace renders identically to a clicked one.
    r.cityInput.value = formatCityLabel(city);
    r.polarMessage.hidden = !isPolarLatitude(obj.lat);
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
  // Clear the gender control directly (this module owns it since §1.D
  // v0.67). Routing it through the retired setGender hook silently left a
  // stale demographic on the form across a reset — the F1 residue class.
  setGenderInput(undefined);
  if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
  r.polarMessage.hidden = true;
  r.legacyHint.hidden = true;
  // v0.5.1: the entry form is default-open on rising (the <details open>
  // in index.html) so first-time visitors discover birth time + birthplace
  // instead of skipping to begin. resetFormDisplay returns to that same
  // entry form (try-another / forget), so keep the disclosure open rather
  // than re-collapsing it — otherwise the first reset would silently strip
  // the default-open state for the rest of the session.
  r.risingFields.setAttribute('open', '');
  if (_hooks.setCurrentProfile) _hooks.setCurrentProfile(null);
  // Move focus to the name field so keyboard and screen-reader users
  // land on the next interactive element. Without this, focus can
  // remain on the now-hidden 'try another' button after re-entry.
  r.nameInput.focus();
}
