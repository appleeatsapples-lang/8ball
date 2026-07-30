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

// City-list CSS lives here (injected at init) so index.html keeps headroom
// under the §6 1500-line cap. Shared polar/legacy/field-error rules stay in
// the shell — they are reused by DOB/profile surfaces and pinned by tests.
const STYLE = `
.city-field { position: relative; }
.city-suggestions {
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--surface, #000);
  border: 1px solid var(--rule);
  max-height: 220px;
  overflow-y: auto;
}
.city-suggestions:empty { display: none; }
.city-suggestions li {
  padding: 8px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text);
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.city-suggestions li:last-child { border-bottom: none; }
.city-suggestions li:hover,
.city-suggestions li[aria-selected="true"] {
  background: rgba(255,255,255,0.12);
}
.city-suggestions li .city-country {
  color: var(--text-muted);
  letter-spacing: 0.10em;
}
`;

function injectStyle() {
  // Vitest unit mocks supply a partial document without head/getElementById;
  // skip injection there. Live browsers always have a full document.
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  if (document.getElementById('citysearch-style')) return;
  if (!document.head || typeof document.createElement !== 'function') return;
  const style = document.createElement('style');
  style.id = 'citysearch-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

// ── DOM-touching controller (DI injected at boot) ─────────────────
//
// PER-INSTANCE, not a module singleton. It was a singleton until PR #187's
// remediation, and that was a latent P0 the moment a second city field
// existed: `onInput`/`onKeydown` were module-scope functions closing over a
// module-scope `_refs`, and they are the exact function objects bound as
// listeners on the FIRST input. A second `initCitySearchUI` call repointed
// `_refs`, so typing in the PRIMARY birthplace field would have rendered into
// the second field's suggestion list and called the second field's
// `setSelectedCity` — leaving index.html's own `selectedCity` null forever and
// silently dropping the rising sign from every shipped single reading.
//
// The option ids are prefixed per instance for the same reason: two lists
// emitting `city-option-0` would make `aria-activedescendant` ambiguous.
//
// The exported signature is unchanged, so index.html's existing call site is
// untouched; it now returns a handle the caller may use to reset the field.

export function initCitySearchUI(refs, hooks) {
  // Option ids are derived from the list's OWN id, not from a call counter:
  // order-independent, and it keeps the primary field's long-standing
  // `city-option-N` contract exactly (`city-suggestions` → `city-option`)
  // while the dyad's list gets `dyad-city-option-N`.
  if (!refs.citySuggestions.id) refs.citySuggestions.id = 'city-suggestions';
  const optionPrefix = refs.citySuggestions.id.replace(/suggestions$/, 'option');
  const _hooks = hooks || {};
  let _debounce = null;
  let _results = [];
  let _activeIndex = -1;

  function clearSuggestions() {
    refs.citySuggestions.innerHTML = '';
    _results = [];
    _activeIndex = -1;
    refs.cityInput.setAttribute('aria-expanded', 'false');
    refs.cityInput.removeAttribute('aria-activedescendant');
  }

  function renderSuggestions(results) {
    clearSuggestions();
    if (!results.length) return;
    _results = results.slice();
    refs.cityInput.setAttribute('aria-expanded', 'true');
    for (const [index, c] of results.entries()) {
      const li = document.createElement('li');
      li.id = `${optionPrefix}-${index}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = c.name;
      const countrySpan = document.createElement('span');
      countrySpan.className = 'city-country';
      countrySpan.textContent = ' \u00b7 ' + c.country;
      li.appendChild(nameSpan);
      li.appendChild(countrySpan);
      li.addEventListener('mousedown', e => {
        // mousedown fires before the input's blur, so selection survives
        // the focus shift; preventDefault stops the focus loss outright.
        e.preventDefault();
        selectCity(c);
      });
      refs.citySuggestions.appendChild(li);
    }
  }

  function setActiveIndex(index) {
    const options = refs.citySuggestions.children;
    if (!options.length) return;
    _activeIndex = (index + options.length) % options.length;
    for (let i = 0; i < options.length; i++) {
      options[i].setAttribute('aria-selected', i === _activeIndex ? 'true' : 'false');
    }
    const active = options[_activeIndex];
    refs.cityInput.setAttribute('aria-activedescendant', active.id);
    if (typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  function selectCity(c) {
    if (_hooks.setSelectedCity) _hooks.setSelectedCity(c);
    refs.cityInput.value = formatCityLabel(c);
    clearSuggestions();
    if (refs.legacyHint) refs.legacyHint.hidden = true;
    // Polar latitudes are unsupported — surface the message proactively
    // at selection time so the user knows before submit. computeRising
    // returns null at polar latitudes; this is the UI mirror of the same
    // core/rising.js check.
    if (refs.polarMessage) refs.polarMessage.hidden = !isPolarLatitude(c.lat);
  }

  function onInput() {
    // Typing without selecting clears the selection so stale city state
    // never silently propagates to buildProfile. Guarded like every other
    // hook call in ui/ — a partial DI object must degrade, not throw from
    // inside the input handler.
    if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
    if (refs.polarMessage) refs.polarMessage.hidden = true;
    if (_debounce) clearTimeout(_debounce);
    clearSuggestions();
    const q = refs.cityInput.value.trim();
    if (q.length < MIN_QUERY_LEN) {
      return;
    }
    _debounce = setTimeout(async () => {
      try {
        const results = await searchCities(q, 12);
        // Race guard: drop results if the input has changed since dispatch.
        if (refs.cityInput.value.trim() !== q) return;
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

  injectStyle();
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

  return {
    /** Blank the field and drop any pending suggestion state. */
    reset() {
      refs.cityInput.value = '';
      if (_debounce) clearTimeout(_debounce);
      _debounce = null;
      clearSuggestions();
      if (refs.polarMessage) refs.polarMessage.hidden = true;
      if (_hooks.setSelectedCity) _hooks.setSelectedCity(null);
    },
  };
}
