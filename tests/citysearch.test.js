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

vi.mock('../core/cities.js', () => ({
  searchCities: vi.fn(),
  warmCities: vi.fn(),
  isCityLoadExhausted: error => error?.code === 'CITY_LOAD_EXHAUSTED',
}));

import { searchCities, warmCities } from '../core/cities.js';
import {
  initCitySearchUI,
  formatCityLabel,
  MIN_QUERY_LEN, SEARCH_DEBOUNCE_MS,
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

  it('prefetches the city dataset on first field focus via the core warm entry', () => {
    // The warm must come from core/cities.js (sharing loadCities' cache and
    // bounded importer sequence) and be bound { once: true } — idempotent
    // in the module, single-shot at the listener.
    expect(cityJs).toMatch(/import\s*\{[^}]*warmCities[^}]*\}\s*from\s*['"]\.\.\/core\/cities\.js['"]/);
    expect(cityJs).toMatch(/addEventListener\(\s*'focus',\s*\(\)\s*=>\s*warmCities\(\),\s*\{\s*once:\s*true\s*\}\s*\)/);
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

  it('keeps each dynamic suggestion a 44px, flex-aligned pointer target', () => {
    expect(cityJs).toMatch(/\.city-suggestions li\s*\{[^}]*min-height:\s*44px/s);
    expect(cityJs).toMatch(/\.city-suggestions li\s*\{[^}]*display:\s*flex/s);
    expect(cityJs).toMatch(/\.city-suggestions li\s*\{[^}]*align-items:\s*center/s);
  });
});

describe('ui/citysearch.js pure exports', () => {
  it('formatCityLabel joins name and country, and degrades to bare name', () => {
    expect(formatCityLabel({ name: 'Reykjavík', country: 'Iceland' })).toBe('Reykjavík, Iceland');
    expect(formatCityLabel({ name: 'Somewhere', country: '' })).toBe('Somewhere');
  });

  it('the polar check is imported from the core authority, not duplicated', () => {
    // core/rising.js isPolarLatitude owns the 66.5° boundary; this module
    // must mirror it by import, never by a local copy of the number.
    expect(cityJs).toMatch(/import\s*\{[^}]*isPolarLatitude[^}]*\}\s*from\s*['"]\.\.\/core\/rising\.js['"]/);
    expect(cityJs).not.toMatch(/66\.5/);
  });

  it('tuning constants hold their shipped values', () => {
    expect(MIN_QUERY_LEN).toBe(2);
    expect(SEARCH_DEBOUNCE_MS).toBe(150);
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
      removeAttribute(k) { delete this.attrs[k]; },
      appendChild(c) { this.children.push(c); },
      addEventListener(ev, fn, opts) {
        // Honor { once: true } like the DOM does — the focus-time prefetch
        // relies on it, and a mock that ignored it would let a double-fire
        // regression ride green.
        handlers[ev] = opts && opts.once
          ? (...args) => { delete handlers[ev]; return fn(...args); }
          : fn;
      },
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
    const cityStatus = makeNode('p');
    cityStatus.hidden = true;
    return {
      cityInput,
      citySuggestions,
      cityStatus,
      legacyHint: { hidden: false },
      polarMessage: { hidden: true },
    };
  }

  const OSLO = { name: 'Oslo', country: 'Norway', countryCode: 'NO', lat: 59.91, lng: 10.75, tz: 'Europe/Oslo' };
  const LONGYEARBYEN = { name: 'Longyearbyen', country: 'Norway', countryCode: 'NO', lat: 78.22, lng: 15.64, tz: 'Arctic/Longyearbyen' };

  let refs, selected, controller;
  beforeEach(() => {
    vi.useFakeTimers();
    searchCities.mockReset();
    warmCities.mockReset();
    globalThis.document = { createElement: makeNode };
    refs = makeRefs();
    selected = undefined;
    controller = initCitySearchUI(refs, { setSelectedCity: c => { selected = c; } });
  });
  afterEach(() => {
    vi.useRealTimers();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  it('entering the field prefetches the dataset once — never a search, never twice', async () => {
    // The 2.4MB dataset import used to start on the first debounced
    // keystroke; the focus-time warm moves it into typing dead time. It
    // must be the warm path only (no searchCities call, no busy/status
    // side effects) and must not re-fire on a second focus.
    expect(warmCities).not.toHaveBeenCalled();
    refs.cityInput._fire('focus');
    expect(warmCities).toHaveBeenCalledTimes(1);
    refs.cityInput._fire('focus');
    expect(warmCities).toHaveBeenCalledTimes(1);
    expect(searchCities).not.toHaveBeenCalled();
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
    expect(refs.cityStatus.hidden).toBe(true);
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
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
    expect(refs.citySuggestions.attrs['aria-busy']).toBe('false');
  });

  it('exposes the birthplace field as an ARIA combobox tied to the suggestion list', async () => {
    expect(refs.cityInput.attrs.role).toBe('combobox');
    expect(refs.cityInput.attrs['aria-autocomplete']).toBe('list');
    expect(refs.cityInput.attrs['aria-controls']).toBe('city-suggestions');
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
    expect(refs.cityStatus.attrs.role).toBe('status');
    expect(refs.cityStatus.attrs['aria-live']).toBe('polite');

    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('true');
  });

  it('announces an in-flight lookup politely and marks the combobox/listbox busy', async () => {
    let resolveSearch;
    searchCities.mockReturnValue(new Promise(resolve => { resolveSearch = resolve; }));
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(refs.cityStatus.hidden).toBe(false);
    expect(refs.cityStatus.textContent).toBe('searching birthplaces…');
    expect(refs.cityInput.attrs['aria-busy']).toBe('true');
    expect(refs.citySuggestions.attrs['aria-busy']).toBe('true');

    resolveSearch([OSLO]);
    await vi.advanceTimersByTimeAsync(0);
    expect(refs.cityStatus.hidden).toBe(true);
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
    expect(refs.citySuggestions.attrs['aria-busy']).toBe('false');
  });

  it('distinguishes a valid empty result set from a lookup failure', async () => {
    searchCities.mockResolvedValue([]);
    refs.cityInput.value = 'notacity';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
    expect(refs.cityStatus.hidden).toBe(false);
    expect(refs.cityStatus.textContent)
      .toBe('no matching birthplace found · try another spelling or nearby city.');
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
  });

  it('Arrow keys move the active option and Enter selects it', async () => {
    searchCities.mockResolvedValue([OSLO, LONGYEARBYEN]);
    refs.cityInput.value = 'o';
    refs.cityInput._fire('input');
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    let prevented = 0;
    const fireKey = key => refs.cityInput._fire('keydown', {
      key,
      preventDefault: () => { prevented++; },
    });

    fireKey('ArrowDown');
    expect(prevented).toBe(1);
    expect(refs.citySuggestions.children[0].attrs['aria-selected']).toBe('true');
    expect(refs.citySuggestions.children[1].attrs['aria-selected']).toBe('false');
    expect(refs.cityInput.attrs['aria-activedescendant']).toBe('city-option-0');

    fireKey('ArrowDown');
    expect(refs.citySuggestions.children[0].attrs['aria-selected']).toBe('false');
    expect(refs.citySuggestions.children[1].attrs['aria-selected']).toBe('true');
    expect(refs.cityInput.attrs['aria-activedescendant']).toBe('city-option-1');

    fireKey('Enter');
    expect(prevented).toBe(3);
    expect(selected).toEqual(LONGYEARBYEN);
    expect(refs.cityInput.value).toBe('Longyearbyen, Norway');
    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
    expect(refs.cityInput.attrs['aria-activedescendant']).toBeUndefined();
  });

  it('ArrowUp starts from the last option and Escape dismisses suggestions', async () => {
    searchCities.mockResolvedValue([OSLO, LONGYEARBYEN]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    let prevented = 0;
    refs.cityInput._fire('keydown', { key: 'ArrowUp', preventDefault: () => { prevented++; } });
    expect(refs.citySuggestions.children[1].attrs['aria-selected']).toBe('true');
    expect(refs.cityInput.attrs['aria-activedescendant']).toBe('city-option-1');

    refs.cityInput._fire('keydown', { key: 'Escape', preventDefault: () => { prevented++; } });
    expect(prevented).toBe(2);
    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.cityInput.attrs['aria-expanded']).toBe('false');
    expect(refs.cityInput.attrs['aria-activedescendant']).toBeUndefined();
    expect(selected).toBeNull();
  });

  it('race guard: results are dropped if the input changed since dispatch', async () => {
    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    refs.cityInput.value = 'oslo airport'; // user kept typing; no new input event yet
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
    expect(refs.cityStatus.hidden).toBe(true);
  });

  it('generation guard drops a rejection from before reset/retype of identical text', async () => {
    let rejectFirst, resolveSecond;
    searchCities
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));

    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    controller.reset();

    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.cityStatus.textContent).toBe('searching birthplaces…');
    expect(refs.cityInput.attrs['aria-busy']).toBe('true');

    rejectFirst(new Error('stale load failed'));
    await vi.advanceTimersByTimeAsync(0);
    expect(refs.cityStatus.textContent).toBe('searching birthplaces…');
    expect(refs.cityInput.attrs['aria-busy']).toBe('true');

    resolveSecond([OSLO]);
    await vi.advanceTimersByTimeAsync(0);
    expect(refs.citySuggestions.children).toHaveLength(1);
    expect(refs.cityStatus.hidden).toBe(true);
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
  });

  it('generation guard drops a rejection after a newer input value', async () => {
    let rejectFirst;
    searchCities
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
      .mockResolvedValueOnce([OSLO]);

    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    refs.cityInput.value = 'osl';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(1);

    rejectFirst(new Error('stale load failed'));
    await vi.advanceTimersByTimeAsync(0);
    expect(refs.citySuggestions.children).toHaveLength(1);
    expect(refs.cityStatus.hidden).toBe(true);
  });

  it('a rejected search clears suggestions instead of throwing', async () => {
    searchCities.mockRejectedValue(new Error('load failed'));
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(0);
    expect(refs.cityStatus.hidden).toBe(false);
    expect(refs.cityStatus.textContent).toBe('birthplace lookup unavailable · type again to retry.');

    searchCities.mockResolvedValue([OSLO]);
    refs.cityInput.value = 'osl';
    refs.cityInput._fire('input');
    expect(refs.cityStatus.hidden).toBe(true);
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    expect(refs.citySuggestions.children).toHaveLength(1);
  });

  it('instructs reload, not another input, once bounded asset attempts are exhausted', async () => {
    const error = Object.assign(new Error('load failed'), { code: 'CITY_LOAD_EXHAUSTED' });
    searchCities.mockRejectedValue(error);
    refs.cityInput.value = 'os';
    refs.cityInput._fire('input');
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);

    expect(refs.cityStatus.hidden).toBe(false);
    expect(refs.cityStatus.textContent)
      .toBe('birthplace lookup unavailable · reload this page to try again.');
    expect(refs.cityStatus.textContent).not.toContain('type again');
    expect(refs.cityInput.attrs['aria-busy']).toBe('false');
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
