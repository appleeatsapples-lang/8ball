// 8ball / tests / moon.test.js — the moon sign engine (§1.K).
//
//   1. AUTHORITY — Meeus, Astronomical Algorithms ch. 47, example 47.a:
//      1992 April 12, 0h TD (JDE 2448724.5). Every intermediate of the
//      worked example is pinned to the book's six decimals, not only λ,
//      so a wrong coefficient anywhere in the 60-term table fails here
//      by name rather than by an angle that happens to land in the same
//      sign.
//   2. SIGN SECTORS — the 30° mapping, its wrap, and the non-finite guard.
//   3. FAIL-CLOSED INPUTS — no time, no tz, out-of-range time → undefined
//      (the unresolved dash), never a sign.
//   4. MOTION — the Moon crosses signs every ~2.5 days: two birth times a
//      day apart can differ, and the same instant expressed in two
//      timezones cannot.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moonLongitude, signOfLongitude, computeMoon } from '../core/moon.js';
import { julianDay, offsetMinutesForWallTime } from '../core/rising.js';
import { buildProfile } from '../core/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

describe('moon — Meeus example 47.a, every intermediate', () => {
  const r = moonLongitude(2448724.5);
  const six = x => Number(x.toFixed(6));
  it("L′ (mean longitude)", () => expect(six(r.Lp)).toBe(134.290182));
  it('D (mean elongation)', () => expect(six(r.D)).toBe(113.842304));
  it("M (sun's mean anomaly)", () => expect(six(r.M)).toBe(97.643514));
  it("M′ (moon's mean anomaly)", () => expect(six(r.Mp)).toBe(5.150833));
  it('F (argument of latitude)', () => expect(six(r.F)).toBe(219.889721));
  it('E (eccentricity factor)', () => expect(six(r.E)).toBe(1.000194));
  it('Σl (periodic terms, ×1e-6°)', () => expect(Math.round(r.sigmaL)).toBe(-1127527));
  it('λ (geocentric longitude)', () => expect(six(r.lambda)).toBe(133.162655));
  it('…which is 13.16° of leo', () => expect(signOfLongitude(r.lambda)).toBe('leo'));
});

describe('moon — sign sectors', () => {
  it('maps each 30° sector to the tropical sign, aries first', () => {
    const expected = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    expected.forEach((sign, i) => {
      expect(signOfLongitude(i * 30)).toBe(sign);
      expect(signOfLongitude(i * 30 + 29.999)).toBe(sign);
    });
  });
  it('wraps negative and ≥360 longitudes', () => {
    expect(signOfLongitude(360)).toBe('aries');
    expect(signOfLongitude(-1)).toBe('pisces');
    expect(signOfLongitude(725)).toBe('aries');
  });
  it('non-finite input is unresolved, never a sign', () => {
    for (const v of [NaN, Infinity, -Infinity, undefined, null, '120']) {
      expect(signOfLongitude(v)).toBeUndefined();
    }
  });
});

describe('moon — fail-closed inputs', () => {
  const base = { year: 1992, month: 4, day: 12, hour: 0, minute: 0, tz: 'UTC' };
  it('resolves with a full time + tz', () => {
    expect(computeMoon(base)).toBe('leo');
  });
  it('no opts, no tz, empty tz, unknown tz → undefined', () => {
    expect(computeMoon(undefined)).toBeUndefined();
    expect(computeMoon({ ...base, tz: undefined })).toBeUndefined();
    expect(computeMoon({ ...base, tz: '' })).toBeUndefined();
    expect(computeMoon({ ...base, tz: 'Nowhere/Nothing' })).toBeUndefined();
  });
  it('missing or non-integer time fields → undefined', () => {
    expect(computeMoon({ ...base, hour: undefined })).toBeUndefined();
    expect(computeMoon({ ...base, minute: NaN })).toBeUndefined();
    expect(computeMoon({ ...base, hour: 12.5 })).toBeUndefined();
    expect(computeMoon({ ...base, hour: '12' })).toBeUndefined();
  });
  it('out-of-range time → undefined', () => {
    expect(computeMoon({ ...base, hour: 24 })).toBeUndefined();
    expect(computeMoon({ ...base, hour: -1 })).toBeUndefined();
    expect(computeMoon({ ...base, minute: 60 })).toBeUndefined();
  });
});

describe('moon — motion and timezone discipline', () => {
  it('the Moon changes sign within a few days (1992-04-12 leo → 1992-04-15 virgo/libra territory)', () => {
    const a = computeMoon({ year: 1992, month: 4, day: 12, hour: 0, minute: 0, tz: 'UTC' });
    const b = computeMoon({ year: 1992, month: 4, day: 15, hour: 0, minute: 0, tz: 'UTC' });
    expect(a).toBe('leo');
    expect(a).not.toBe(b);
  });
  it('the same instant in two timezones gives the same sign', () => {
    // 1992-04-12 00:00 UTC == 1992-04-11 20:00 America/New_York (EDT, −4h)
    const utc = computeMoon({ year: 1992, month: 4, day: 12, hour: 0, minute: 0, tz: 'UTC' });
    const ny = computeMoon({ year: 1992, month: 4, day: 11, hour: 20, minute: 0, tz: 'America/New_York' });
    expect(ny).toBe(utc);
  });
  it('the wall-clock offset is applied in the right direction', () => {
    // Longitude must be monotone in UT across a day: later UT → larger λ
    // (the Moon never retrogrades). Tokyo 09:00 is 00:00 UTC; Tokyo 09:00
    // must therefore equal UTC 00:00 and precede UTC 09:00.
    const tokyo = computeMoon({ year: 1992, month: 4, day: 12, hour: 9, minute: 0, tz: 'Asia/Tokyo' });
    const utc0 = computeMoon({ year: 1992, month: 4, day: 12, hour: 0, minute: 0, tz: 'UTC' });
    expect(tokyo).toBe(utc0);
  });
});

// 5. FIXTURES — tests/fixtures.json `moon_cases`, in lockstep with
//    core/profile.js's `moonSign` (§3): the wall-clock offset, the
//    longitude to three decimals (a regression is an angle before it is a
//    sign), the sign, and the same sign through buildProfile.
describe('moon — fixtures.json moon_cases (§3 lockstep with core/profile.js)', () => {
  expect(fixtures.moon_cases.length).toBeGreaterThanOrEqual(6);
  for (const c of fixtures.moon_cases) {
    it(c.label, () => {
      const [y, m, d] = c.dob.split('-').map(Number);
      const [hh, mm] = c.time.split(':').map(Number);
      expect(offsetMinutesForWallTime(y, m, d, hh, mm, c.tz)).toBe(c.utcOffsetMinutes);
      const jd = julianDay(y, m, d, 0) + (hh * 60 + mm - c.utcOffsetMinutes) / 1440;
      expect(Number(moonLongitude(jd).lambda.toFixed(3))).toBe(c.moonLongitudeDeg);
      expect(computeMoon({ year: y, month: m, day: d, hour: hh, minute: mm, tz: c.tz })).toBe(c.expected.moonSign);
      expect(buildProfile('Test Specimen', c.dob, { time: c.time, tz: c.tz }).moonSign).toBe(c.expected.moonSign);
    });
  }

  it('buildProfile: no time, or a time without a timezone, carries no moon sign (the honest dash)', () => {
    expect(buildProfile('Test Specimen', '1990-06-15').moonSign).toBeUndefined();
    expect(buildProfile('Test Specimen', '1990-06-15', { time: '12:00' }).moonSign).toBeUndefined();
    expect(buildProfile('Test Specimen', '1990-06-15', { time: '25:00', tz: 'Europe/London' }).moonSign).toBeUndefined();
  });

  it('buildProfile: a legacy country payload resolves the moon through the representative zone, like rising', () => {
    // GB → Europe/London; the London fixture case's sign must follow.
    const c = fixtures.moon_cases.find(x => x.tz === 'Europe/London');
    expect(buildProfile('Test Specimen', c.dob, { time: c.time, country: 'GB' }).moonSign).toBe(c.expected.moonSign);
  });

  it('buildProfile: the moon needs no place — a time and a timezone resolve it without lat/lng', () => {
    const c = fixtures.moon_cases[0];
    const p = buildProfile('Test Specimen', c.dob, { time: c.time, tz: c.tz });
    expect(p.moonSign).toBe(c.expected.moonSign);
    expect(p.risingSign).toBeUndefined(); // rising still needs the place
  });
});
