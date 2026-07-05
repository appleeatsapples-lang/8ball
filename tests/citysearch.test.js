// 8ball / tests / citysearch.test.js
// ui/citysearch.js DI shape + behavior (DOCTRINE §6 v0.23 split).
// The city-autocomplete controller was extracted from index.html at the
// 1499/1500 line-budget trigger. Shape pins lock the init*UI({refs},{hooks})
// contract and the boot wiring; the behavior block runs the controller for
// real (debounce, race guard, selection, polar mirror) with hand-injected
// DOM mocks, mirroring tests/modals.test.js — vitest runs on the node env.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../core/cities.js', () => ({ searchCities: vi.fn() }));

import { searchCities } from '../core/cities.js';
import {
  initCitySearchUI,
  formatCityLabel, isPolarLat,
  MIN_QUERY_LEN, SEARCH_DEBOUNCE_MS, POLAR_LAT_LIMIT,
} from '../ui/citysearch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const cityJs = readFileSync(join(__dirname, '..', 'ui', 'citysearch.js'), 'utf-8');

describe('ui/citysearch.js DI shape (DOCTRINE §6 v0.23)', () => {
  it('exports initCitySearchUI with (refs, hooks) arity', () => {
    expect(cityJs).toMatch(/export function initCitySearchUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('introduces no localStorage keys and no network surface', () => {
    expect(cityJs.match(/'eight_ball_[a-z0-9_]+'/g)).toBeNull();
    expect(cityJs).not.toMatch(/\bfetch\s*\(/);
    expect(cityJs).not.toMatch(/XMLHttpRequest/);
  });

  it('index.html boots the surface via initCitySearchUI and keeps selectedCity host-owned', () => {
    expect(html).toMatch(/import\s*\{[^}]*initCitySearchUI[^}]*\}\s*from\s*['"]\.\/ui\/citysearch\.js['"]/);
    expect(html).toMatch(/initCitySearchUI\(/);
    expect(html).toMatch(/let selectedCity = null/);
    expect(html).toMatch(/setSelectedCity:\s*c\s*=>\s*\{\s*selectedCity = c;?\s*\}/);
  });

  it('index.html no longer defines the inline autocomplete handlers', () => {
    expect(html).not.toMatch(/function renderSuggestions\s*\(/);
    expect(html).not.toMatch(/function selectCity\s*\(/);
    expect(html).not.toMatch(/citySearchDebounce/);
  });
});

describe('ui/citysearch.js pure exports', () => {
  it('formatCityLabel joins name and country, and degrades to bare name', () => {
    expect(formatCityLabel({ name: 'Reykjavík', country: 'Iceland' })).toBe('Reykjavík, Iceland');
    expect(formatCityLabel({ name: 'Somewhere', country: '' })).toBe('Somewhere');
  });

  it('isPolarLat mirrors the computeRising support boundary in both hemispheres', () => {
    expect(isPolarLat(66.5)).toBe(false);   // boundary itself is supported
    expect(isPolarLat(66.6)).toBe(true);
    expect(isPolarLat(-66.5)).toBe(false);
    expect(isPolarLat(-70)).toBe(true);
    expect(isPolarLat(0)).toBe(false);
  });

  it('tuning constants hold their shipped values', () => {
    expect(MIN_QUERY_LEN).toBe(2);
    expect(SEARCH_DEBOUNCE_MS).toBe(150);
    expect(POLAR_LAT_LIMIT).toBe(66.5);
  });
});

describe('ui/citysearch.js behavior (debounce / race guard / selection)', () => {
  const originalDocument = globalThis.document;

  function makeNode(tag) {
    const handlers = {};
    return {
      tag,
      children: [],
      attrs: {},
      textContent: '',
      className: '',
      setAttribute(k, v) { this.attrs[k] = v; },
      appendChild(c) { this.children.push(c); },
      addEventListener(ev, fn) { handlers[ev] = fn; },
      _fire(ev, arg) { return handlers[ev] && handlers[ev](arg); },
    };
  }

  function makeRefs() {
    const citySuggestions = makeNode('ul');
    // innerHTML = '' is the module's clear idiom; mirror it on the mock.
    Object.defineProperty(citySuggestions, 'innerHTML', {
      set(v) { if (v === '') this.children.length = 0; },
    });
    const cityInput = makeNode('input');
    cityInput.value = '';
    return {
      cityInput,
      citySuggestions,
      legacyHint: { hidden: false },
      polarMessage: { hidden: true },
    };
  }

  const OSLO = { name: 'Oslo', country: 'Norway', countryCode: 'NO', lat: 59.91, lng: 10.75, tz: 'Europe/Oslo' };
  const LONGYEARBYEN = { name: 'Longyearbyen', country: 'Norway', countryCode: 'NO', lat: 78.22, lng: 15.64, tz: 'Arctic/Longyearbyen' };

  let refs, selected;
  beforeEach(() => {
    vi.useFakeTimers();
    searchCities.mockReset();
    globalThis.document = { createElement: makeNode };
    refs = makeRefs();
    selected = undefined;
    initCitySearchUI(refs, { setSelectedCity: c => { selected = c; } });
  });
  afterEach(() => {
    vi.useRealTimers();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  it('typing below MIN_QUERY_LEN clears the selection and never dispatches a search', async () => {
    refs.cityInput.value = 'o';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS + 10);
    expect(selected).toBeNull();
    expect(searchCities).not.toHaveBeenCalled();
    expect(refs.citySuggestions.children).toHaveLength(0);
  });

  it('typing a query debounces, searches, and renders one option per result', async () => {
    searchCities.mockResolvedValue([OSLO, LONGYEARBYEN]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    expect(searchCities).not.toHaveBeenCalled(); // still inside the debounce window
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(searchCities).toHaveBeenCalledWith('os', 12);
    expect(refs.citySuggestions.children).toHaveLength(2);
    expect(refs.citySuggestions.children[0].attrs.role).toBe('option');
    expect(refs.citySuggestions.children[0].children[0].textContent).toBe('Oslo');
    expect(refs.citySuggestions.children[0].children[1].textContent).toBe(' · Norway');
  });

  it('race guard: results are dropped if the input changed since dispatch', async () => {
    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    refs.cityInput.value = 'oslo airport'; // user kept typing; no new input event yet
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(0);
  });

  it('a rejected search clears suggestions instead of throwing', async () => {
    searchCities.mockRejectedValue(new Error('load failed'));
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(0);
  });

  it('mousedown selection sets the city via the hook, fills the input, and prevents focus loss', async () => {
    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    const li = refs.citySuggestions.children[0];
    let prevented = false;
    li._fire('mousedown', { preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true);
    expect(selected).toEqual(OSLO);
    expect(refs.cityInput.value).toBe('Oslo, Norway');
    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.legacyHint.hidden).toBe(true);
    expect(refs.polarMessage.hidden).toBe(true); // Oslo is below the polar limit
  });

  it('selecting a polar city surfaces the polar message at selection time (UI mirror of computeRising)', async () => {
    searchCities.mockResolvedValue([LONGYEARBYEN]);
    refs.cityInput.value = 'lo';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    refs.citySuggestions.children[0]._fire('mousedown', { preventDefault: () => {} });
    expect(selected).toEqual(LONGYEARBYEN);
    expect(refs.polarMessage.hidden).toBe(false);
  });

  it('blur clears the suggestion list after the mousedown-capture delay', async () => {
    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(1);
    refs.cityInput._fire('blur');
    await vi.advanceTimersByTimeAsync(120);
    expect(refs.citySuggestions.children).toHaveLength(0);
  });
});
