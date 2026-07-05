// 8ball / ui/citysearch.js
// City-autocomplete controller for the birthplace field (v0.2.7.2 logic,
// extracted from index.html per DOCTRINE §6 v0.23 at the 1499/1500
// line-budget trigger).
//
// Owns:
//   - suggestion render/clear + selection wiring for #city-input
//   - the search debounce + stale-result race guard around
//     core/cities.js searchCities
//
// Does NOT own:
//   - the selectedCity `let` binding — that stays in index.html and is
//     mutated only via the host-injected setSelectedCity hook, so the
//     host remains the single owner of its own state (same shape as
//     ui/profile.js)
//
// Pure exports (no DOM, vitest-testable without jsdom): MIN_QUERY_LEN,
// SEARCH_DEBOUNCE_MS, formatCityLabel. The polar check is NOT duplicated
// here — core/rising.js isPolarLatitude is the single authority for the
// polar-circle boundary; this module and ui/profile.js both import it.

import { searchCities } from '../core/cities.js';
import { isPolarLatitude } from '../core/rising.js';

// ── pure exports ─────────────────────────────────────────────────
// Queries shorter than this never hit the search index.
export const MIN_QUERY_LEN = 2;
// Debounce window between keystroke and search dispatch.
export const SEARCH_DEBOUNCE_MS = 150;

// One formatter for the birthplace label — selectCity (fresh pick) and
// ui/profile.js populateRisingFields (rehydrate from storage, where the
// country name can legitimately be absent) must render identically.
export function formatCityLabel(c) {
  return c.country ? c.name + ', ' + c.country : c.name;
}

// ── DOM-touching controller (DI injected at boot) ─────────────────

let _refs = null;
let _hooks = null;
let _debounce = null;

function clearSuggestions() {
  _refs.citySuggestions.innerHTML = '';
}

function renderSuggestions(results) {
  clearSuggestions();
  if (!results.length) return;
  for (const c of results) {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = c.name;
    const countrySpan = document.createElement('span');
    countrySpan.className = 'city-country';
    countrySpan.textContent = ' · ' + c.country;
    li.appendChild(nameSpan);
    li.appendChild(countrySpan);
    li.addEventListener('mousedown', e => {
      // mousedown fires before the input's blur, so selection survives
      // the focus shift; preventDefault stops the focus loss outright.
      e.preventDefault();
      selectCity(c);
    });
    _refs.citySuggestions.appendChild(li);
  }
}

function selectCity(c) {
  if (_hooks.setSelectedCity) _hooks.setSelectedCity(c);
  _refs.cityInput.value = formatCityLabel(c);
  clearSuggestions();
  _refs.legacyHint.hidden = true;
  // Polar latitudes are unsupported — surface the message proactively
  // at selection time so the user knows before submit. computeRising
  // returns null at polar latitudes; this is the UI mirror of the same
  // core/rising.js check.
  _refs.polarMessage.hidden = !isPolarLatitude(c.lat);
}

function onInput() {
  // Typing without selecting clears the selection so stale city state
  // never silently propagates to buildProfile. Guarded like every other
  // hook call in ui/ — a partial DI object must degrade, not throw from
  // inside the input handler.
  if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
  _refs.polarMessage.hidden = true;
  if (_debounce) clearTimeout(_debounce);
  const q = _refs.cityInput.value.trim();
  if (q.length < MIN_QUERY_LEN) {
    clearSuggestions();
    return;
  }
  _debounce = setTimeout(async () => {
    try {
      const results = await searchCities(q, 12);
      // Race guard: drop results if the input has changed since dispatch.
      if (_refs.cityInput.value.trim() !== q) return;
      renderSuggestions(results);
    } catch (_) {
      clearSuggestions();
    }
  }, SEARCH_DEBOUNCE_MS);
}

export function initCitySearchUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  refs.cityInput.addEventListener('input', onInput);
  refs.cityInput.addEventListener('blur', () => {
    // Brief delay so the mousedown handler can fire and capture the pick.
    setTimeout(clearSuggestions, 120);
  });
}
