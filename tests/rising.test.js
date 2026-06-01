// 8ball / tests / rising.test.js
// Rising-sign tests.
//
// v0.2.7.2: extended with `computeRising` (tz-aware, DST + historical
// timezone handling via Intl.DateTimeFormat). Legacy `getRisingSign`
// retained for v0.2.1+ stored profiles (utcOffsetMinutes signature).
// Polar latitudes (|lat| > 66.5°) return `null` from both APIs.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildProfile } from '../core/profile.js';
import { profileFromPayload } from '../ui/profile.js';
import {
  ascendantDeg,
  computeRising,
  getRisingSign,
  gmstDeg,
  julianDay,
  obliquityDeg
} from '../core/rising.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

const VALID_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]);

const referenceCases = [
  {
    label: 'London noon BST',
    y: 1990, m: 6, d: 15, h: 12, min: 0, utcOffsetMinutes: 60,
    lat: 51.5074, lng: -0.1278,
    jd: 2448057.958333,
    gmst: 68.4671871,
    obliquity: 23.4405326,
    ascendant: 164.7398,
    sign: 'virgo'
  },
  {
    label: 'NYC mid-afternoon EST',
    y: 1985, m: 3, d: 15, h: 14, min: 30, utcOffsetMinutes: -300,
    lat: 40.7128, lng: -74.006,
    jd: 2446140.3125,
    gmst: 105.8446269,
    obliquity: 23.4412153,
    ascendant: 134.2061,
    sign: 'leo'
  },
  {
    label: 'Riyadh sunrise AST',
    y: 2000, m: 1, d: 1, h: 6, min: 0, utcOffsetMinutes: 180,
    lat: 24.7136, lng: 46.6753,
    jd: 2451544.625,
    gmst: 145.0910006,
    obliquity: 23.4392912,
    ascendant: 270.2354,
    sign: 'capricorn'
  }
];

function parseDob(dob) { return dob.split('-').map(Number); }
function parseTime(time) { return time.split(':').map(Number); }
const payload = (n, d, extra) => ({ name: n, dob: d, ...extra });

describe('rising sign — algorithm fixtures (legacy offset API)', () => {
  for (const c of fixtures.rising_cases) {
    it(c.label, () => {
      const [y, m, d] = parseDob(c.dob);
      const [hour, minute] = parseTime(c.time);
      expect(getRisingSign(
        y, m, d, hour, minute,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBe(c.expected.risingSign);
    });
  }
});

describe('rising sign — math primitives', () => {
  for (const c of referenceCases) {
    it(`${c.label}: Julian day`, () => {
      const utHours = c.h + c.min / 60 - c.utcOffsetMinutes / 60;
      expect(julianDay(c.y, c.m, c.d, utHours)).toBeCloseTo(c.jd, 6);
    });

    it(`${c.label}: GMST and obliquity`, () => {
      const utHours = c.h + c.min / 60 - c.utcOffsetMinutes / 60;
      const jd = julianDay(c.y, c.m, c.d, utHours);
      expect(gmstDeg(jd)).toBeCloseTo(c.gmst, 4);
      expect(obliquityDeg(jd)).toBeCloseTo(c.obliquity, 4);
    });

    it(`${c.label}: ascendant and sign`, () => {
      expect(ascendantDeg(
        c.y, c.m, c.d, c.h, c.min,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBeCloseTo(c.ascendant, 4);
      expect(getRisingSign(
        c.y, c.m, c.d, c.h, c.min,
        c.utcOffsetMinutes,
        c.lat, c.lng
      )).toBe(c.sign);
    });
  }
});

describe('rising sign — computeRising (tz-aware, v0.2.7.2)', () => {
  // Parity: same dates/places as legacy referenceCases, expressed via
  // IANA tz strings. Should resolve to identical signs when no DST is
  // in play, validating that the new API matches the offset-based path.
  const parityCases = [
    { label: 'London noon BST (parity)',
      opts: { year: 1990, month: 6, day: 15, hour: 12, minute: 0,
              tz: 'Europe/London', lat: 51.5074, lng: -0.1278 },
      sign: 'virgo' },
    { label: 'NYC mid-afternoon EST (parity)',
      opts: { year: 1985, month: 3, day: 15, hour: 14, minute: 30,
              tz: 'America/New_York', lat: 40.7128, lng: -74.006 },
      sign: 'leo' },
    { label: 'Riyadh sunrise AST (parity)',
      opts: { year: 2000, month: 1, day: 1, hour: 6, minute: 0,
              tz: 'Asia/Riyadh', lat: 24.7136, lng: 46.6753 },
      sign: 'capricorn' }
  ];

  for (const c of parityCases) {
    it(c.label, () => {
      expect(computeRising(c.opts)).toBe(c.sign);
    });
  }

  // DST-aware cases — the core new test surface. Each exercises a
  // distinct DST/historical-tz path through Intl.DateTimeFormat.
  // Operator live-fire vs astro.com per brief §5.
  const dstCases = [
    { label: 'US summer DST — Chicago 1990-07-15 14:00 CDT',
      opts: { year: 1990, month: 7, day: 15, hour: 14, minute: 0,
              tz: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
      sign: 'scorpio' },
    { label: 'Indiana pre-2006 (no DST observed) — Indianapolis 1985-07-15 14:00 EST',
      opts: { year: 1985, month: 7, day: 15, hour: 14, minute: 0,
              tz: 'America/Indiana/Indianapolis',
              lat: 39.7684, lng: -86.1581 },
      sign: 'scorpio' },
    { label: 'Russia post-2014 (permanent MSK) — Moscow 2020-07-15 14:00 MSK',
      opts: { year: 2020, month: 7, day: 15, hour: 14, minute: 0,
              tz: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
      sign: 'scorpio' }
  ];

  for (const c of dstCases) {
    it(c.label, () => {
      expect(computeRising(c.opts)).toBe(c.sign);
    });
  }
});

describe('rising sign — buildProfile integration', () => {
  it('omits risingSign when no opts are supplied', () => {
    const p = buildProfile('alice', '1990-06-15');
    expect(p.risingSign).toBeUndefined();
    expect(p.sunSign).toBe('gemini');
    expect(p.animal).toBe('horse');
    expect(p.lifePath).toBe(4);
  });

  it('omits risingSign when opts are empty', () => {
    const p = buildProfile('alice', '1990-06-15', {});
    expect(p.risingSign).toBeUndefined();
  });

  it('computes risingSign for legacy country payloads via the IANA path', () => {
    // v0.2.1–v0.2.7.1 stored profiles: opts.country + lat + lng, no tz.
    // The country code now resolves to a representative IANA timezone
    // before buildProfile calls computeRising.
    const p = buildProfile('alice', '1990-06-15', {
      time: '12:00',
      country: 'DE',
      lat: 51.5074,
      lng: -0.1278
    });
    expect(p.risingSign).toBe('virgo');
    expect(p.sunSign).toBe('gemini');
  });

  it('stored legacy profile matches equivalent fresh city profile on a DST-sensitive date', () => {
    const legacy = profileFromPayload(payload('Legacy Specimen', '1990-07-15', {
      time: '14:00',
      country: 'DE',
      lat: 52.5244,
      lng: 13.4105
    }));
    const fresh = profileFromPayload(payload('Fresh Specimen', '1990-07-15', {
      time: '14:00',
      city: 'Berlin',
      cc: 'DE',
      tz: 'Europe/Berlin',
      lat: 52.5244,
      lng: 13.4105
    }));
    expect(legacy.risingSign).toBe(fresh.risingSign);
    expect(fresh.risingSign).toBe('libra');
  });

  it('computes risingSign via new IANA tz path (v0.2.7.2)', () => {
    // v0.2.7.2+ profiles: opts.tz + lat + lng (city autocomplete).
    const p = buildProfile('alice', '1990-06-15', {
      time: '12:00',
      tz: 'Europe/London',
      lat: 51.5074,
      lng: -0.1278
    });
    expect(p.risingSign).toBe('virgo');
    expect(p.sunSign).toBe('gemini');
  });

  it('keeps already-valid city data on the city timezone path', () => {
    const p = buildProfile('city specimen', '1990-01-01', {
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      tz: 'Asia/Riyadh',
      lat: 26.2886,
      lng: 50.114
    });
    expect(p.risingSign).toBe('sagittarius');
  });

  it('keeps risingSign undefined when country/location exists but birth time is absent', () => {
    const p = buildProfile('no clock specimen', '1990-01-01', {
      country: 'SA',
      lat: 26.2886,
      lng: 50.114
    });
    expect(p.risingSign).toBeUndefined();
  });

  it('cusp-sensitive Saudi locations resolve consistently between legacy country and city payloads', () => {
    const dhahranLegacy = buildProfile('cusp specimen', '1990-01-01', {
      time: '03:31',
      country: 'SA',
      lat: 26.2886,
      lng: 50.114
    });
    const dhahranFresh = buildProfile('cusp specimen', '1990-01-01', {
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      tz: 'Asia/Riyadh',
      lat: 26.2886,
      lng: 50.114
    });
    const jeddahFresh = buildProfile('cusp specimen', '1990-01-01', {
      time: '03:31',
      city: 'Jeddah',
      cc: 'SA',
      tz: 'Asia/Riyadh',
      lat: 21.4901,
      lng: 39.1862
    });
    expect(dhahranLegacy.risingSign).toBe(dhahranFresh.risingSign);
    expect(dhahranFresh.risingSign).toBe('sagittarius');
    expect(jeddahFresh.risingSign).toBe('scorpio');
  });

  it('tz path takes precedence over country when both present', () => {
    // Mixed profile (legacy migrating to v0.2.7.2): tz wins.
    const p = buildProfile('alice', '1990-06-15', {
      time: '12:00',
      tz: 'Europe/London',
      country: 'DE',
      lat: 51.5074,
      lng: -0.1278
    });
    expect(p.risingSign).toBe('virgo');
  });
});

describe('rising sign — edge cases (legacy getRisingSign, returns valid sign)', () => {
  // Boundary latitudes (|lat| == 66.5°) stay valid per v0.2.7.2 §1.A
  // amendment: the polar-circle rule is strict greater-than 66.5°.
  // Pre-1970 dates and far-future dates remain in the supported window.
  const cases = [
    ['equator',                    2000, 1,  1, 12, 0,    0,    0,      0],
    ['northern boundary (66.5)',   2000, 1,  1, 12, 0,    0,   66.5,   10],
    ['southern boundary (-66.5)',  2000, 1,  1, 12, 0,    0,  -66.5,   10],
    ['east of IDL',                2000, 1,  1, 12, 0,  720,    0,    179.99],
    ['west of IDL',                2000, 1,  1, 12, 0, -720,    0,   -179.99],
    ['pre-1970 Beijing anchor',    1924, 2,  4,  0, 0,  480,   39.9,  116.4],
    ['post-2050 future date',      2099,12, 31, 23, 59,   0,   51.5,   -0.1]
  ];

  for (const [label, y, m, d, h, min, offset, lat, lng] of cases) {
    it(`${label}: returns a valid sign`, () => {
      const asc = ascendantDeg(y, m, d, h, min, offset, lat, lng);
      const sign = getRisingSign(y, m, d, h, min, offset, lat, lng);
      expect(Number.isNaN(asc)).toBe(false);
      expect(asc).toBeGreaterThanOrEqual(0);
      expect(asc).toBeLessThan(360);
      expect(VALID_SIGNS.has(sign)).toBe(true);
    });
  }
});

describe('rising sign — polar latitudes return null (v0.2.7.2 §1.A)', () => {
  // |lat| > 66.5° (strictly inside the polar circles) returns null
  // from both APIs. The horizon-plane geometry degenerates and a
  // rising sign is not astrologically meaningful. The UI surfaces a
  // "rising unavailable at this latitude" message in place of a sign.
  // Boundary cases (|lat| == 66.5°) are tested in the previous block
  // and remain valid.

  const polarCases = [
    ['near north pole (89°)',     89,  10],
    ['near south pole (-89°)',   -89,  10],
    ['Svalbard (78°)',            78.2232,  15.6267],
    ['Antarctic station (-78°)', -78,    100],
    ['just past north circle',    66.5001, 10],
    ['just past south circle',   -66.5001, 10]
  ];

  for (const [label, lat, lng] of polarCases) {
    it(`${label}: getRisingSign returns null`, () => {
      const sign = getRisingSign(2000, 6, 21, 12, 0, 0, lat, lng);
      expect(sign).toBe(null);
    });

    it(`${label}: computeRising returns null`, () => {
      const sign = computeRising({
        year: 2000, month: 6, day: 21, hour: 12, minute: 0,
        tz: 'UTC', lat, lng
      });
      expect(sign).toBe(null);
    });
  }
});
