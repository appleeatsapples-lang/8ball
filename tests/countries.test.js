// 8ball / tests / countries.test.js
// Static data-quality gate for country/zone centroid defaults.

import { describe, it, expect } from 'vitest';
import { COUNTRIES, getCountryTimeZoneByCode } from '../core/countries.js';

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
  for (const c of COUNTRIES) {
    it(`${c.code} (${c.name}) maps to a valid representative IANA timezone`, () => {
      const tz = getCountryTimeZoneByCode(c.code);
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
      expect(() => new Intl.DateTimeFormat('en', { timeZone: tz }), tz)
        .not.toThrow();
    });
  }
});
