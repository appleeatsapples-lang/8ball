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
// SEARCH_DEBOUNCE_MS, POLAR_LAT_LIMIT, formatCityLabel, isPolarLat.

import { searchCities } from '../core/cities.js';

// ── pure exports ─────────────────────────────────────────────────
// Queries shorter than this never hit the search index.
export const MIN_QUERY_LEN = 2;
// Debounce window between keystroke and search dispatch.
export const SEARCH_DEBOUNCE_MS = 150;
// |lat| beyond this is polar: computeRising returns null there, and the
// polar message surfaces proactively at selection time (the UI mirror).
// ui/profile.js populateRisingFields applies the same threshold on
// rehydrate; core/rising.js is the calculation-side authority.
export const POLAR_LAT_LIMIT = 66.5;

export function formatCityLabel(c) {
  return c.country ? c.name + ', ' + c.country : c.name;
}

export function isPolarLat(lat) {
  return Math.abs(lat) > POLAR_LAT_LIMIT;
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
  _hooks.setSelectedCity(c);
  _refs.cityInput.value = formatCityLabel(c);
  clearSuggestions();
  _refs.legacyHint.hidden = true;
  // Polar latitudes are unsupported — surface the message proactively
  // at selection time so the user knows before submit. computeRising
  // will also return null at |lat| > POLAR_LAT_LIMIT; this is the UI mirror.
  _refs.polarMessage.hidden = !isPolarLat(c.lat);
}

function onInput() {
  // Typing without selecting clears the selection so stale city state
  // never silently propagates to buildProfile.
  _hooks.setSelectedCity(null);
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
