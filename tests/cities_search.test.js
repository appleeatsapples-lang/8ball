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

// ── COUNTRY_NAMES value pins (2026-07-24 mutation pass) ───────────
// Mutation testing scored core/cities.js at 14.8% — the lowest in core/ —
// with 222 surviving StringLiteral mutants: every country display name in
// the module could be blanked and the suite stayed green. The getCountryName
// coverage above spot-checks three codes; the other 221 entries were never
// asserted at all.
//
// Oracle: ICU's own region-name data via Intl.DisplayNames — independent of
// this repo. 208 of 224 entries match it exactly; the 16 that do not are
// deliberate house renderings, pinned by exact value below.

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

const ICU_NAME_DIVERGENCES = {
  AG: 'Antigua and Barbuda',          // ICU: "Antigua & Barbuda"
  BA: 'Bosnia and Herzegovina',       // ICU: "Bosnia & Herzegovina"
  CD: 'DR Congo',                     // ICU: "Congo - Kinshasa"
  CG: 'Republic of the Congo',        // ICU: "Congo - Brazzaville"
  CI: "Côte d'Ivoire",                // ICU uses a curly apostrophe
  HK: 'Hong Kong',                    // ICU: "Hong Kong SAR China"
  KN: 'Saint Kitts and Nevis',        // ICU: "St. Kitts & Nevis"
  LC: 'Saint Lucia',                  // ICU: "St. Lucia"
  MM: 'Myanmar',                      // ICU: "Myanmar (Burma)"
  MO: 'Macau',                        // ICU: "Macao SAR China"
  PS: 'Palestine',                    // ICU: "Palestinian Territories"
  ST: 'Sao Tome and Principe',        // ICU: "São Tomé & Príncipe"
  TC: 'Turks and Caicos Islands',     // ICU: "Turks & Caicos Islands"
  TR: 'Turkey',                       // ICU: "Türkiye"
  TT: 'Trinidad and Tobago',          // ICU: "Trinidad & Tobago"
  VC: 'Saint Vincent and the Grenadines', // ICU: "St. Vincent & Grenadines"
};

// Codes read from the module source (already loaded above as citiesJs), so
// the pin covers every shipped entry rather than a hand-list that could
// drift out of step with the table.
const TABLE_CODES = [...new Set(
  [...citiesJs.matchAll(/\b([A-Z]{2}): ['"]/g)].map(m => m[1])
)];

describe('core/cities.js — country name table values', () => {
  it('covers every country code present in the shipped dataset', () => {
    const datasetCodes = new Set(
      JSON.parse(readFileSync(join(__dirname, '..', 'assets', 'cities.json'), 'utf-8'))
        .cities.map(c => c[1])
    );
    const missing = [...datasetCodes].filter(cc => getCountryName(cc) === undefined).sort();
    expect(missing).toEqual([]);
  });

  it('every name matches ICU, or is a recorded house rendering', () => {
    expect(TABLE_CODES.length).toBeGreaterThanOrEqual(220);
    const wrong = [];
    for (const code of TABLE_CODES) {
      const recorded = ICU_NAME_DIVERGENCES[code];
      const expected = recorded !== undefined ? recorded : REGION_NAMES.of(code);
      if (getCountryName(code) !== expected) {
        wrong.push(`${code}: "${getCountryName(code)}" ≠ "${expected}"`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the divergence list has no stale entries — each one still diverges', () => {
    const stale = Object.keys(ICU_NAME_DIVERGENCES)
      .filter(code => ICU_NAME_DIVERGENCES[code] === REGION_NAMES.of(code));
    expect(stale).toEqual([]);
  });

  it('no entry is blank, and every entry is unique', () => {
    const names = TABLE_CODES.map(getCountryName);
    expect(names.filter(n => !n || !n.trim())).toEqual([]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('an unmapped code falls back to the raw code, never to undefined', async () => {
    // The `|| c[1]` arm in searchCities. SJ is absent from the name table
    // (it carries no city in the shipped dataset — the coverage test above
    // pins that every REAL code is mapped), so this fixture city exercises
    // the fallback: the label degrades to the code, never to undefined.
    expect(getCountryName('SJ')).toBeUndefined();
    const [longyearbyen] = await searchCities('longyear');
    expect(longyearbyen.countryCode).toBe('SJ');
    expect(longyearbyen.country).toBe('SJ');
  });
});
