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
let _results = [];
let _activeIndex = -1;

function clearSuggestions() {
  _refs.citySuggestions.innerHTML = '';
  _results = [];
  _activeIndex = -1;
  _refs.cityInput.setAttribute('aria-expanded', 'false');
  _refs.cityInput.removeAttribute('aria-activedescendant');
}

function renderSuggestions(results) {
  clearSuggestions();
  if (!results.length) return;
  _results = results.slice();
  _refs.cityInput.setAttribute('aria-expanded', 'true');
  for (const [index, c] of results.entries()) {
    const li = document.createElement('li');
    li.id = `city-option-${index}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
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

function setActiveIndex(index) {
  const options = _refs.citySuggestions.children;
  if (!options.length) return;
  _activeIndex = (index + options.length) % options.length;
  for (let i = 0; i < options.length; i++) {
    options[i].setAttribute('aria-selected', i === _activeIndex ? 'true' : 'false');
  }
  const active = options[_activeIndex];
  _refs.cityInput.setAttribute('aria-activedescendant', active.id);
  if (typeof active.scrollIntoView === 'function') {
    active.scrollIntoView({ block: 'nearest' });
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
  clearSuggestions();
  const q = _refs.cityInput.value.trim();
  if (q.length < MIN_QUERY_LEN) {
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

function onKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!_results.length) return;
    e.preventDefault();
    const step = e.key === 'ArrowDown' ? 1 : -1;
    const start = _activeIndex === -1
      ? (step === 1 ? 0 : _results.length - 1)
      : _activeIndex + step;
    setActiveIndex(start);
    return;
  }
  if (e.key === 'Enter' && _activeIndex >= 0) {
    e.preventDefault();
    selectCity(_results[_activeIndex]);
    return;
  }
  if (e.key === 'Escape' && _results.length) {
    e.preventDefault();
    clearSuggestions();
  }
}

export function initCitySearchUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  if (_debounce) clearTimeout(_debounce);
  _debounce = null;
  _results = [];
  _activeIndex = -1;
  if (!refs.citySuggestions.id) refs.citySuggestions.id = 'city-suggestions';
  refs.cityInput.setAttribute('role', 'combobox');
  refs.cityInput.setAttribute('aria-autocomplete', 'list');
  refs.cityInput.setAttribute('aria-controls', refs.citySuggestions.id);
  refs.cityInput.setAttribute('aria-expanded', 'false');
  refs.cityInput.addEventListener('input', onInput);
  refs.cityInput.addEventListener('keydown', onKeydown);
  refs.cityInput.addEventListener('blur', () => {
    // Brief delay so the mousedown handler can fire and capture the pick.
    setTimeout(clearSuggestions, 120);
  });
}
