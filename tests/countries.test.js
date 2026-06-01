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
    c.utcOffsetMinutes, c.defaultLat, c.defaultLng
  );
}

describe('countries data quality', () => {
  for (const c of COUNTRIES) {
    it(`${c.code} (${c.name}) has valid defaultLat/defaultLng`, () => {
      expect(typeof c.defaultLat).toBe('number');
      expect(c.defaultLat).toBeGreaterThanOrEqual(-90);
      expect(c.defaultLat).toBeLessThanOrEqual(90);
      expect(Number(c.defaultLat.toFixed(1))).toBe(c.defaultLat);
      expect(typeof c.defaultLng).toBe('number');
      expect(c.defaultLng).toBeGreaterThanOrEqual(-180);
      expect(c.defaultLng).toBeLessThanOrEqual(180);
      expect(Number(c.defaultLng.toFixed(1))).toBe(c.defaultLng);
    });
  }
});

describe('countries legacy timezone mapping', () => {
  it('has exact keyset coverage for every legacy country/zone code', () => {
    expect(Object.keys(LEGACY_COUNTRY_TIMEZONES).sort())
      .toEqual(COUNTRIES.map(c => c.code).sort());
  });

  for (const c of COUNTRIES) {
    it(`${c.code} (${c.name}) maps to a valid representative IANA timezone`, () => {
      const tz = getCountryTimeZoneByCode(c.code);
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
      expect(() => new Intl.DateTimeFormat('en', { timeZone: tz }), tz)
        .not.toThrow();
    });
  }

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
        lat: c.defaultLat,
        lng: c.defaultLng
      });
      expect(fixedOffsetSign(tc.code, tc.dob, tc.time)).toBe(tc.fixed);
      expect(profile.risingSign).toBe(tc.unified);
      expect(profile.risingSign).not.toBe(tc.fixed);
    }
  });
});
