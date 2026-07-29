// 8ball / tests / countries.test.js
// Static data-quality gate for country/zone centroid defaults.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfile } from '../core/profile.js';
import { getRisingSign } from '../core/rising.js';
import {
  COUNTRIES,
  LEGACY_COUNTRY_TIMEZONES,
  getCountryByCode,
  getCountryTimeZoneByCode
} from '../core/countries.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cityData = JSON.parse(
  readFileSync(join(__dirname, '..', 'assets', 'cities.json'), 'utf-8')
);

// Legacy country centroids — extracted verbatim from core/countries.js rows
// before the 2026-07-25 deep-clean strip (see the centroid note in that
// file). Coverage carried forward per the #78 annotation's condition.
const CENTROIDS = JSON.parse(
  readFileSync(join(__dirname, 'country_centroids.fixture.json'), 'utf-8')
);
const centroid = (code) => CENTROIDS[code];

function largestCityByCountryCode() {
  const firstByCountry = new Map();
  for (const c of cityData.cities) {
    if (!firstByCountry.has(c[1])) {
      firstByCountry.set(c[1], {
        name: c[0],
        countryCode: c[1],
        tz: cityData.tz[c[4]],
        pop: c[5]
      });
    }
  }
  return firstByCountry;
}

function fixedOffsetSign(code, dob, time) {
  const c = getCountryByCode(code);
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return getRisingSign(
    year, month, day, hour, minute,
    c.utcOffsetMinutes, ...centroid(code)
  );
}

describe('countries data quality', () => {
  it('centroid fixture keyset matches COUNTRIES exactly', () => {
    const codes = COUNTRIES.map((c) => c.code).sort();
    expect(Object.keys(CENTROIDS).sort()).toEqual(codes);
  });
  // One test over all 276 countries rather than 276 near-identical ones.
  // This checks two properties; as a per-country loop it generated 38% of
  // the entire suite's test count, which made the headline number a poor
  // proxy for how much of the app is actually covered. Same assertions,
  // same signal — every offender is still named individually in the
  // failure message — via the collected-failures idiom already used in
  // tests/privacy_scan.test.js:105-125.
  //
  // Two things a collected loop must do that a per-item loop got for free:
  // catch throws so one bad row cannot hide the rows after it, and assert
  // the loop actually ran, since an empty COUNTRIES would otherwise report
  // zero failures and pass.
  it('every country has a valid legacy centroid', () => {
    const bad = [];
    let checked = 0;
    for (const c of COUNTRIES) {
      try {
        const why = [];
        const pair = centroid(c.code);
        if (!Array.isArray(pair)) {
          why.push(`no centroid fixture entry`);
        } else {
          const [lat, lng] = pair;
          for (const [axis, v, limit] of [['lat', lat, 90], ['lng', lng, 180]]) {
            if (typeof v !== 'number') why.push(`${axis} is ${typeof v}`);
            else if (v < -limit || v > limit) why.push(`${axis} ${v} outside ±${limit}`);
            else if (Number(v.toFixed(1)) !== v) why.push(`${axis} ${v} exceeds 1 decimal place`);
          }
        }
        if (why.length) bad.push(`${c.code} (${c.name}): ${why.join('; ')}`);
        checked++;
      } catch (err) {
        bad.push(`${c.code} (${c.name}): threw — ${err.message}`);
      }
    }
    expect(checked, 'centroid loop did not run over every country').toBe(COUNTRIES.length);
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(bad, `invalid legacy centroids:\n${bad.join('\n')}`).toEqual([]);
  });
});

describe('countries legacy timezone mapping', () => {
  it('has exact keyset coverage for every legacy country/zone code', () => {
    expect(Object.keys(LEGACY_COUNTRY_TIMEZONES).sort())
      .toEqual(COUNTRIES.map(c => c.code).sort());
  });

  // Collapsed for the same reason as the centroid loop above, with the
  // same guarantees: every offender named, throws captured rather than
  // aborting the sweep, and the iteration count asserted so an empty
  // COUNTRIES cannot pass as "no failures".
  it('every country maps to a valid representative IANA timezone', () => {
    const bad = [];
    let checked = 0;
    for (const c of COUNTRIES) {
      const tz = getCountryTimeZoneByCode(c.code);
      if (typeof tz !== 'string') {
        bad.push(`${c.code} (${c.name}): tz is ${typeof tz}`);
      } else if (tz.length === 0) {
        bad.push(`${c.code} (${c.name}): tz is empty`);
      } else {
        try {
          new Intl.DateTimeFormat('en', { timeZone: tz });
        } catch (err) {
          bad.push(`${c.code} (${c.name}): Intl rejects "${tz}" — ${err.message}`);
        }
      }
      checked++;
    }
    expect(checked, 'timezone loop did not run over every country').toBe(COUNTRIES.length);
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(bad, `invalid representative timezones:\n${bad.join('\n')}`).toEqual([]);
  });

  it('alpha-2 mappings follow the largest-city timezone when city data exists', () => {
    const firstByCountry = largestCityByCountryCode();
    for (const c of COUNTRIES) {
      if (!/^[A-Z]{2}$/.test(c.code)) continue;
      const largest = firstByCountry.get(c.code);
      if (!largest) continue;
      expect(
        getCountryTimeZoneByCode(c.code),
        `${c.code} should map to ${largest.name}'s timezone`
      ).toBe(largest.tz);
    }
  });

  it('split legacy country/zone codes stay pinned to their named regions', () => {
    const expected = {
      'AU-CT': 'Australia/Adelaide',
      'AU-E': 'Australia/Sydney',
      'AU-WA': 'Australia/Perth',
      'BR-AC': 'America/Rio_Branco',
      'BR-BR': 'America/Sao_Paulo',
      'BR-FN': 'America/Noronha',
      'CA-NL': 'America/St_Johns',
      'CL-EI': 'Pacific/Easter',
      'ID-WIB': 'Asia/Jakarta',
      'ID-WIT': 'Asia/Jayapura',
      'ID-WITA': 'Asia/Makassar',
      'KZ-W': 'Asia/Aqtau',
      'RU-KAM': 'Asia/Kamchatka',
      'US-P': 'America/Los_Angeles'
    };
    for (const [code, tz] of Object.entries(expected)) {
      expect(getCountryTimeZoneByCode(code)).toBe(tz);
    }
  });

  it('legacy country payloads use DST/historical offsets where fixed offsets diverged', () => {
    const cases = [
      { code: 'DE', dob: '1990-07-15', time: '00:00', fixed: 'taurus', unified: 'aries' },
      { code: 'US-E', dob: '2025-07-15', time: '00:00', fixed: 'taurus', unified: 'aries' },
      { code: 'AU-E', dob: '2025-01-15', time: '00:00', fixed: 'scorpio', unified: 'libra' },
      { code: 'CL-C', dob: '2025-01-15', time: '00:00', fixed: 'libra', unified: 'virgo' },
      { code: 'BR-BR', dob: '1990-01-15', time: '00:00', fixed: 'libra', unified: 'virgo' }
    ];
    for (const tc of cases) {
      const c = getCountryByCode(tc.code);
      const profile = buildProfile('Timezone Specimen', tc.dob, {
        time: tc.time,
        country: tc.code,
        lat: centroid(tc.code)[0],
        lng: centroid(tc.code)[1]
      });
      expect(fixedOffsetSign(tc.code, tc.dob, tc.time)).toBe(tc.fixed);
      expect(profile.risingSign).toBe(tc.unified);
      expect(profile.risingSign).not.toBe(tc.fixed);
    }
  });

  it('unknown codes resolve to undefined from both accessors', () => {
    // The .find()-miss and object-lookup-miss branches: an unrecognized
    // code must return undefined so buildProfile's rising path falls
    // through to no-rising rather than crashing on a missing centroid/tz.
    expect(getCountryByCode('ZZ')).toBeUndefined();
    expect(getCountryByCode('')).toBeUndefined();
    expect(getCountryTimeZoneByCode('ZZ')).toBeUndefined();
    expect(getCountryTimeZoneByCode('')).toBeUndefined();
  });
});
