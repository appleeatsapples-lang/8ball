// 8ball / tests / cities_search.test.js
// Behavioral coverage for core/cities.js — searchCities / loadCities /
// getCountryName. Until this file, the module's logic (NFD diacritic
// folding, case-insensitivity, the <2-char guard, the limit cut, the
// pop-ranked ordering, tz-index resolution) had zero direct coverage:
// tests/cities.test.js deliberately reads assets/cities.json via
// readFileSync for data-quality checks and never runs the module.
//
// The dataset import is mocked with a 4-city fixture, which keeps the
// same node-version-agnostic property that made cities.test.js avoid
// loadCities() (no import-attributes syntax reaches the runtime), while
// still executing the real search path.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

// Population-descending, like the real GeoNames export — searchCities
// relies on the pre-sorted order for its ranking.
vi.mock('../assets/cities.json', () => ({
  default: {
    tz: ['Asia/Riyadh', 'Atlantic/Reykjavik', 'Arctic/Longyearbyen'],
    cities: [
      ['Riyadh', 'SA', 24.63, 46.71, 0, 4205961],
      ['Reykjavík', 'IS', 64.14, -21.9, 1, 135000],
      ['Reykjanesbær', 'IS', 63.97, -22.53, 1, 18000],
      ['Longyearbyen', 'SJ', 78.22, 15.64, 2, 2100],
    ],
  },
}));

import { searchCities, loadCities, getCountryName } from '../core/cities.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const citiesJs = readFileSync(join(__dirname, '..', 'core', 'cities.js'), 'utf-8');

describe('core/cities.js — searchCities behavior', () => {
  it('matches diacritic-insensitively in both directions', async () => {
    const plain = await searchCities('reykjavik');
    expect(plain.map(c => c.name)).toEqual(['Reykjavík']);
    const accented = await searchCities('Reykjavík');
    expect(accented.map(c => c.name)).toEqual(['Reykjavík']);
  });

  it('matches case-insensitively on substrings', async () => {
    const r = await searchCities('RIYA');
    expect(r.map(c => c.name)).toEqual(['Riyadh']);
  });

  it('returns [] for queries under 2 normalized chars, including whitespace padding', async () => {
    expect(await searchCities('r')).toEqual([]);
    expect(await searchCities('  r  ')).toEqual([]);
    expect(await searchCities('')).toEqual([]);
    expect(await searchCities(null)).toEqual([]);
  });

  it('ranks by the dataset population order and honors the limit cut', async () => {
    const both = await searchCities('reykja');
    expect(both.map(c => c.name)).toEqual(['Reykjavík', 'Reykjanesbær']);
    const capped = await searchCities('reykja', 1);
    expect(capped.map(c => c.name)).toEqual(['Reykjavík']);
  });

  it('hydrates the full city shape: country name, tz via index, lat/lng/pop', async () => {
    const [r] = await searchCities('longyear');
    expect(r).toEqual({
      name: 'Longyearbyen',
      country: 'SJ', // code absent from COUNTRY_NAMES → falls back to the raw code
      countryCode: 'SJ',
      lat: 78.22,
      lng: 15.64,
      tz: 'Arctic/Longyearbyen',
      pop: 2100,
    });
    const [riyadh] = await searchCities('riyadh');
    expect(riyadh.country).toBe('Saudi Arabia');
    expect(riyadh.tz).toBe('Asia/Riyadh');
  });
});

describe('core/cities.js — loadCities caching', () => {
  it('returns the identical cached object on repeat calls', async () => {
    const a = await loadCities();
    const b = await loadCities();
    expect(b).toBe(a);
    expect(a.cities).toHaveLength(4);
  });

  it('source pin: a failed load resets _loading so the session can retry', () => {
    // Regression pin for the rejected-promise caching bug (2026-07-05
    // standards pass): before the fix, a transient import failure left
    // the rejected promise in _loading and every later caller received
    // the same rejection with no retry path. The runtime path is hard
    // to exercise under the module cache, so the try/finally reset is
    // pinned structurally alongside the caching behavior test above.
    expect(citiesJs).toMatch(/try\s*\{[\s\S]*?await import\([\s\S]*?\}\s*finally\s*\{\s*_loading = null;?\s*\}/);
  });
});

describe('core/cities.js — getCountryName', () => {
  it('resolves known codes and returns undefined for unknown ones', () => {
    expect(getCountryName('DE')).toBe('Germany');
    expect(getCountryName('IS')).toBe('Iceland');
    expect(getCountryName('ZZ')).toBeUndefined();
  });
});
