// 8ball / tests / moon.test.js
// Moon-sign tests (DOCTRINE.md §1.K, ASTRO-MOON-ADD-01).
//
// The reference-case block below anchors core/moon.js's longitude formula
// directly to Meeus's own published worked example (ch.47, Example 47.a) —
// the same authority core/calendar.js already cites for solar longitude
// and new-moon timing. fixtures.moon_cases layers product-shaped
// (dob/time/tz) cases on top; see tests/fixtures.json's
// _moon_cases_comment for exactly which rows are externally anchored vs.
// self-consistency regression pins.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildProfile } from '../core/profile.js';
import { computeMoonSign, geocentricLongitudeDeg } from '../core/moon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

const VALID_SIGNS = new Set([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]);

function parseDob(dob) { return dob.split('-').map(Number); }
function parseTime(time) { return time.split(':').map(Number); }

describe('moon sign — geocentric longitude vs Meeus Example 47.a', () => {
  it('matches the book\'s published longitude to five decimal places', () => {
    // 1992-04-12.0 TT (JDE 2448724.5), Meeus ch.47 worked example.
    // Book value: 133.162655°. This file treats JD as JDE (see
    // core/moon.js header) — for a 1992 date the TT-UT delta is on the
    // order of a minute, negligible at sign-bucket precision, exactly
    // the same disclosed approximation core/calendar.js already makes.
    const lng = geocentricLongitudeDeg(2448724.5);
    expect(lng).toBeCloseTo(133.162655, 5);
  });

  it('stays in [0, 360) across a wide date spread (normalizeDeg contract)', () => {
    for (const jd of [2415020.5, 2451545.0, 2469807.5]) {
      const lng = geocentricLongitudeDeg(jd);
      expect(lng).toBeGreaterThanOrEqual(0);
      expect(lng).toBeLessThan(360);
    }
  });
});

describe('moon sign — computeMoonSign (fixtures)', () => {
  for (const c of fixtures.moon_cases) {
    it(c.label, () => {
      const [year, month, day] = parseDob(c.dob);
      const [hour, minute] = parseTime(c.time);
      expect(computeMoonSign({ year, month, day, hour, minute, tz: c.tz }))
        .toBe(c.expected.moonSign);
    });
  }

  it('rows 1-2 are the same UTC instant expressed via two IANA zones and must agree', () => {
    const [utc, nyc] = fixtures.moon_cases;
    expect(utc.expected.moonSign).toBe(nyc.expected.moonSign);
  });
});

describe('moon sign — computeMoonSign input guards', () => {
  it('returns null for missing or null opts', () => {
    expect(computeMoonSign()).toBe(null);
    expect(computeMoonSign(null)).toBe(null);
  });

  it('returns null for an empty-string tz', () => {
    expect(computeMoonSign({
      year: 2000, month: 1, day: 1, hour: 12, minute: 0, tz: ''
    })).toBe(null);
  });

  it('returns null for a well-formed but non-existent IANA identifier', () => {
    expect(computeMoonSign({
      year: 2000, month: 1, day: 1, hour: 12, minute: 0, tz: 'Mars/Phobos_Base'
    })).toBe(null);
  });

  it('ignores lat/lng entirely, unlike computeRising — no observer-location dependency', () => {
    // computeMoonSign only destructures {year,month,day,hour,minute,tz} —
    // moon-sign is the Moon's position in the sky, not a function of the
    // observer's local horizon, so wildly different (even polar/invalid)
    // lat/lng values passed alongside must not change the result.
    const opts = { year: 2000, month: 6, day: 21, hour: 12, minute: 0, tz: 'UTC' };
    const base = computeMoonSign(opts);
    expect(computeMoonSign({ ...opts, lat: 89, lng: 179 })).toBe(base);
    expect(computeMoonSign({ ...opts, lat: -89, lng: -179 })).toBe(base);
    expect(computeMoonSign({ ...opts, lat: 999, lng: -999 })).toBe(base);
  });
});

describe('moon sign — sign bucket sanity (valid domain)', () => {
  const cases = [
    ['equator instant', 2000, 1, 1, 12, 0],
    ['near north pole coords are irrelevant here', 2000, 6, 21, 0, 0],
    ['pre-1970 date', 1924, 2, 4, 0, 0],
    ['post-2050 future date', 2099, 12, 31, 23, 59]
  ];

  for (const [label, year, month, day, hour, minute] of cases) {
    it(`${label}: returns a valid sign`, () => {
      const sign = computeMoonSign({ year, month, day, hour, minute, tz: 'UTC' });
      expect(VALID_SIGNS.has(sign)).toBe(true);
    });
  }
});

describe('moon sign — buildProfile integration', () => {
  it('omits moonSign when no opts are supplied', () => {
    const p = buildProfile('alice', '1992-04-12');
    expect(p.moonSign).toBeUndefined();
  });

  it('omits moonSign when opts are empty', () => {
    const p = buildProfile('alice', '1992-04-12', {});
    expect(p.moonSign).toBeUndefined();
  });

  it('omits moonSign when birth time is absent even with a known location', () => {
    const p = buildProfile('no clock specimen', '1992-04-12', {
      tz: 'Etc/UTC', lat: 0, lng: 0
    });
    expect(p.moonSign).toBeUndefined();
  });

  it('computes moonSign via the fresh-city IANA tz path, matching the direct API', () => {
    const p = buildProfile('alice', '1992-04-12', {
      time: '00:00', tz: 'Etc/UTC', lat: 0, lng: 0
    });
    expect(p.moonSign).toBe('leo');
    expect(p.moonSign).toBe(computeMoonSign({
      year: 1992, month: 4, day: 12, hour: 0, minute: 0, tz: 'Etc/UTC'
    }));
  });

  it('computes moonSign for legacy country payloads via the same IANA-derived tz risingSign uses', () => {
    const p = buildProfile('alice', '1992-04-12', {
      time: '00:00', country: 'GB', lat: 51.5074, lng: -0.1278
    });
    // GB resolves to a real IANA zone; the point under test is that moonSign
    // resolves at all on the legacy country path (undefined would mean the
    // shared tz-resolution block silently skipped it), not a specific sign.
    expect(VALID_SIGNS.has(p.moonSign)).toBe(true);
  });

  it('resolves moonSign even at a polar latitude where risingSign is null', () => {
    // The one behavioral divergence between the two coordinates: rising
    // sign is undefined by the local horizon at polar latitudes and
    // returns null (DOCTRINE §1.A); moon sign has no such dependency and
    // still resolves normally.
    const p = buildProfile('polar specimen', '1992-04-12', {
      time: '00:00', tz: 'Etc/UTC', lat: 89, lng: 10
    });
    expect(p.risingSign).toBeNull();
    expect(p.moonSign).toBe('leo');
  });

  it('invalid city timezone resolves moonSign to null, same as risingSign, without throwing', () => {
    const p = buildProfile('bad tz specimen', '1992-04-12', {
      time: '00:00', tz: 'Not/AZone', lat: 0, lng: 0
    });
    expect(p.risingSign).toBeNull();
    expect(p.moonSign).toBeNull();
  });

  it('tz path takes precedence over country when both present, same as risingSign', () => {
    const p = buildProfile('alice', '1992-04-12', {
      time: '00:00', tz: 'Etc/UTC', country: 'DE', lat: 0, lng: 0
    });
    expect(p.moonSign).toBe('leo');
  });
});
