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
  obliquityDeg,
  offsetMinutesForWallTime
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

// 2026-07-25 Stryker follow-up (core/rising.js scored 79.0% mutation with
// 39 undetected mutants; see journal for the full record). fixtures.rising_cases
// cannot express these cases -- it has no tz field and is consumed only via
// the legacy fixed-offset getRisingSign API, which never reaches the
// two-pass DST-resolution code (offsetMinutesForWallTime / getOffsetAtInstant,
// core/rising.js L112-144) at all. rising_tz_cases (new, same fixtures.json
// file) carries a tz string instead and is consumed here via computeRising +
// offsetMinutesForWallTime so it actually exercises that path. See each
// fixture's label + tests/fixtures.json's _rising_tz_cases_comment for the
// verification source of every expected value.
describe('rising sign — computeRising mutation-coverage fixtures (2026-07-25)', () => {
  for (const c of fixtures.rising_tz_cases) {
    it(c.label, () => {
      const [y, m, d] = parseDob(c.dob);
      const [hour, minute] = parseTime(c.time);
      if (typeof c.expected.offsetMinutes === 'number') {
        expect(offsetMinutesForWallTime(y, m, d, hour, minute, c.tz)).toBe(c.expected.offsetMinutes);
      }
      expect(computeRising({
        year: y, month: m, day: d, hour, minute,
        tz: c.tz, lat: c.lat, lng: c.lng
      })).toBe(c.expected.risingSign);
    });
  }
});

describe('rising sign — offsetMinutesForWallTime tz-guard edge cases (2026-07-25)', () => {
  const base = { year: 1990, month: 6, day: 15, hour: 12, minute: 0, lat: 51.5074, lng: -0.1278 };

  it('empty-string tz resolves to null, not a wrong sign', () => {
    expect(offsetMinutesForWallTime(1990, 6, 15, 12, 0, '')).toBe(null);
    expect(computeRising({ ...base, tz: '' })).toBe(null);
  });

  it('non-string tz is rejected even when it would otherwise coerce to a valid zone', () => {
    // A bare type check (typeof tz !== 'string') only earns its keep if a
    // non-string value that Intl.DateTimeFormat's own ToString coercion
    // would otherwise accept is still rejected here. An empty string or a
    // plain number both already throw inside Intl (RangeError, caught by
    // getOffsetAtInstant's try/catch) and so resolve to null on ANY code
    // path -- that makes them unable to distinguish this guard from one
    // that never rejects non-strings at all. An object with a custom
    // toString naming a real zone is accepted by Intl's coercion (verified
    // directly against this platform's Intl.DateTimeFormat, independent of
    // core/rising.js), so it is the only input that actually tells the two
    // apart: the guard must reject it on TYPE alone, before it ever reaches
    // Intl.
    const coercesToRealZone = { toString: () => 'America/New_York' };
    expect(offsetMinutesForWallTime(1990, 6, 15, 12, 0, coercesToRealZone)).toBe(null);
    expect(computeRising({ ...base, tz: coercesToRealZone })).toBe(null);
  });

  it('a well-formed but non-existent IANA identifier resolves to null, not a wrong sign', () => {
    // Direct computeRising entry point (buildProfile-level coverage of an
    // equivalent case already exists in the "buildProfile integration"
    // block below via tz: 'Not/AZone').
    expect(computeRising({ ...base, tz: 'Mars/Phobos_Base' })).toBe(null);
  });
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

  it('invalid city timezone resolves to null without throwing', () => {
    const p = buildProfile('bad tz specimen', '1990-06-15', {
      time: '12:00',
      tz: 'Not/AZone',
      lat: 51.5074,
      lng: -0.1278
    });
    expect(p.risingSign).toBeNull();
  });
});

describe('rising sign — edge cases (legacy getRisingSign)', () => {
  // Boundary latitudes (|lat| == 66.5°) stay valid per v0.2.7.2 §1.A
  // amendment: the polar-circle rule is strict greater-than 66.5°.
  // Pre-1970 dates and far-future dates remain in the supported window.
  //
  // These carried only `VALID_SIGNS.has(sign)` until now, which passes for
  // all twelve signs — so the block could not fail. The two day-rollover
  // cases in particular (Beijing pre-1970 and west-of-IDL) were the repo's
  // ONLY coverage of utcDateParts' dayDelta arithmetic, and a rollover that
  // landed on the wrong day still yields a valid sign.
  //
  // PROVENANCE, explicitly: the `sign`/`ascendant` columns below are frozen
  // from the current implementation. They are characterization pins — they
  // catch drift, they are not an independent check of correctness, and
  // unlike the operator live-fire referenceCases at the top of this file
  // they carry no astro.com verification. The rollover invariants in the
  // block underneath are the part that does not depend on a frozen value.
  const cases = [
    ['equator',                    2000, 1,  1, 12, 0,    0,    0,      0,      'aries',    11.3779],
    ['northern boundary (66.5)',   2000, 1,  1, 12, 0,    0,   66.5,   10,      'cancer',   98.9774],
    ['southern boundary (-66.5)',  2000, 1,  1, 12, 0,    0,  -66.5,   10,      'aries',    11.1446],
    ['east of IDL',                2000, 1,  1, 12, 0,  720,    0,    179.99,   'aries',    10.8330],
    ['west of IDL',                2000, 1,  1, 12, 0, -720,    0,   -179.99,   'aries',    11.9224],
    ['pre-1970 Beijing anchor',    1924, 2,  4,  0, 0,  480,   39.9,  116.4,    'scorpio', 211.0139],
    ['post-2050 future date',      2099,12, 31, 23, 59,   0,   51.5,   -0.1,    'libra',   187.3266]
  ];

  for (const [label, y, m, d, h, min, offset, lat, lng, sign, ascendant] of cases) {
    it(`${label}: ${sign}`, () => {
      const asc = ascendantDeg(y, m, d, h, min, offset, lat, lng);
      expect(asc).toBeCloseTo(ascendant, 4);
      expect(asc).toBeGreaterThanOrEqual(0);
      expect(asc).toBeLessThan(360);
      expect(getRisingSign(y, m, d, h, min, offset, lat, lng)).toBe(sign);
    });
  }
});

// The independent half of the rollover cases above. A frozen sign proves
// the answer did not change; these prove the answer is right, with no
// ephemeris and no frozen value: a wall time plus an offset names one UTC
// instant, and expressing that same instant directly must give the same
// ascendant. That catches a regression in how utHours is derived from the
// offset — a dropped or sign-flipped `- utcOffsetMinutes / 60`.
//
// What it does NOT do, stated plainly rather than implied: guard
// utcDateParts. That function's day/hour split has no observable effect at
// all. julianDay is linear in `day + utHours / 24` and the Meeus formula
// stays continuous for out-of-range day values, so splitting Feb 4 at −8h
// into Feb 3 at +16h and then recombining is exact arithmetic identity.
// Bypassing utcDateParts entirely leaves the ascendant unchanged at all
// 270,144 points of a 1900–2100 × all-months × ±720min grid — max delta 0.
// Setting its dayDelta to 0, or swapping floor for trunc, is likewise
// undetectable. It is normalization for readability, not for the result;
// the tests below would pass without it.
describe('rising sign — wall time and UTC instant agree across midnight', () => {
  const rollovers = [
    {
      label: 'backward across midnight (utHours < 0) — Beijing +8, 1924-02-04 00:00',
      wall: [1924, 2, 4, 0, 0, 480], utc: [1924, 2, 3, 16, 0, 0],
      lat: 39.9, lng: 116.4
    },
    {
      label: 'forward across midnight (utHours == 24) — west of IDL, 2000-01-01 12:00',
      wall: [2000, 1, 1, 12, 0, -720], utc: [2000, 1, 2, 0, 0, 0],
      lat: 0, lng: -179.99
    },
    {
      label: 'exactly on the boundary (utHours == 0) — east of IDL, 2000-01-01 12:00',
      wall: [2000, 1, 1, 12, 0, 720], utc: [2000, 1, 1, 0, 0, 0],
      lat: 0, lng: 179.99
    },
    {
      label: 'backward across a year boundary — 2000-01-01 00:30 at +13',
      wall: [2000, 1, 1, 0, 30, 780], utc: [1999, 12, 31, 11, 30, 0],
      lat: -36.85, lng: 174.76
    },
    {
      label: 'forward across a year boundary — 1999-12-31 23:30 at −11',
      wall: [1999, 12, 31, 23, 30, -660], utc: [2000, 1, 1, 10, 30, 0],
      lat: -14.28, lng: -170.7
    }
  ];

  for (const r of rollovers) {
    it(r.label, () => {
      const viaWall = ascendantDeg(...r.wall, r.lat, r.lng);
      const viaUtc = ascendantDeg(...r.utc, r.lat, r.lng);
      expect(viaWall).toBeCloseTo(viaUtc, 10);
      expect(getRisingSign(...r.wall, r.lat, r.lng))
        .toBe(getRisingSign(...r.utc, r.lat, r.lng));
      // and the sign is a real one, not an undefined from an out-of-range index
      expect(VALID_SIGNS.has(getRisingSign(...r.wall, r.lat, r.lng))).toBe(true);
    });
  }
});

// The two-pass DST correction at core/rising.js:139-143. Pass 1 treats the
// wall time as UTC and asks Intl what offset applied at that instant; pass 2
// subtracts that guess and re-asks. Every DST case elsewhere in this file is
// a mid-July date where both passes agree, so deleting pass 2 left the suite
// green. These are the wall times where the two passes disagree.
describe('rising sign — two-pass DST offset resolution', () => {
  it('one hour after spring-forward resolves to EDT, not EST', () => {
    // 2020-03-08 03:00 in New York is EDT (−240). A single-pass
    // implementation returns −300: at 03:00 *UTC* on that date New York
    // was still EST, because the transition is at 07:00 UTC.
    expect(offsetMinutesForWallTime(2020, 3, 8, 3, 0, 'America/New_York')).toBe(-240);
  });

  it('one hour before spring-forward is still EST', () => {
    expect(offsetMinutesForWallTime(2020, 3, 8, 1, 0, 'America/New_York')).toBe(-300);
  });

  it('the physically ambiguous and nonexistent wall-times resolve deterministically', () => {
    // core/rising.js:110-111 names these as accepted-ambiguous. Which side
    // is chosen was never pinned, so it could drift silently; these lock
    // the current answer rather than argue for it.
    // 02:30 on spring-forward day does not exist (the clock jumps 02:00→03:00).
    expect(offsetMinutesForWallTime(2020, 3, 8, 2, 30, 'America/New_York')).toBe(-240);
    // 01:30 on fall-back day happens twice; the resolver takes the first (EDT).
    expect(offsetMinutesForWallTime(2020, 11, 1, 1, 30, 'America/New_York')).toBe(-240);
  });
});

// The guard block at core/profile.js:275-296, which has its own documented
// result legend: `undefined` = required inputs missing or invalid (line 2
// falls back to bare sun), `null` = polar latitude (the UI says "rising
// unavailable"). Nothing tested the difference, and nothing reached the
// guards at all: tests/pillars.test.js passes malformed times but no
// lat/lng, so it bails at the coordinate check before the time regex runs.
describe('rising sign — buildProfile input guards (undefined vs null)', () => {
  const LONDON = { lat: 51.5074, lng: -0.1278, tz: 'Europe/London' };
  const rising = opts => buildProfile('Test', '1990-06-15', opts).risingSign;

  it('resolves with well-formed inputs (the control)', () => {
    expect(rising({ ...LONDON, time: '12:00' })).toBe('virgo');
  });

  // Every row here returns undefined — "we could not resolve this" — and
  // the fallback is a bare sun sign. A regression that let any of them
  // through would put a wrong rising sign on a real reading.
  const unresolvable = [
    ['no opts at all',              undefined],
    ['time missing',               { ...LONDON }],
    ['time empty string',          { ...LONDON, time: '' }],
    ['time without a colon',       { ...LONDON, time: '1200' }],
    ['time with a 1-digit minute', { ...LONDON, time: '2:5' }],
    ['time with seconds',          { ...LONDON, time: '12:00:00' }],
    ['time with a leading space',  { ...LONDON, time: ' 12:00' }],
    ['hour above 23',              { ...LONDON, time: '25:30' }],
    ['minute above 59',            { ...LONDON, time: '12:75' }],
    ['lat above +90',              { ...LONDON, time: '12:00', lat: 95 }],
    ['lat below −90',              { ...LONDON, time: '12:00', lat: -95 }],
    ['lng above +180',             { ...LONDON, time: '12:00', lng: 200 }],
    ['lng below −180',             { ...LONDON, time: '12:00', lng: -200 }],
    ['lat as a string',            { ...LONDON, time: '12:00', lat: '51.5' }],
    ['empty tz and no country',    { ...LONDON, time: '12:00', tz: '' }],
    ['neither tz nor country',     { lat: 51.5074, lng: -0.1278, time: '12:00' }],
    ['an unknown country code',    { lat: 51.5074, lng: -0.1278, time: '12:00', country: 'ZZ' }]
  ];

  for (const [label, opts] of unresolvable) {
    it(`${label} → undefined`, () => {
      expect(rising(opts)).toBeUndefined();
    });
  }

  // The `time with seconds` row is not hypothetical: <input type="time">
  // emits HH:MM:SS whenever its `step` is not a multiple of 60. index.html
  // sets no step today, so this pins the day someone adds one.
  it('the HH:MM regex is what rejects an HH:MM:SS value', () => {
    expect(rising({ ...LONDON, time: '12:00:00' })).toBeUndefined();
    expect(rising({ ...LONDON, time: '12:00' })).toBe('virgo');
  });

  it('a polar latitude is null, not undefined — a resolved "unavailable"', () => {
    expect(rising({ ...LONDON, time: '12:00', lat: 90 })).toBeNull();
    expect(rising({ ...LONDON, time: '12:00', lat: 66.6 })).toBeNull();
    // and the boundary itself stays resolvable (strict greater-than)
    expect(rising({ ...LONDON, time: '12:00', lat: 66.5 })).toBe('virgo');
  });
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

describe('rising sign — computeRising input guards (null / non-number coords)', () => {
  it('returns null for missing or null opts', () => {
    expect(computeRising()).toBe(null);
    expect(computeRising(null)).toBe(null);
  });

  it('returns null when lat or lng is not a number', () => {
    const base = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, tz: 'UTC' };
    expect(computeRising({ ...base, lat: '51', lng: 0 })).toBe(null);
    expect(computeRising({ ...base, lat: 51, lng: '0' })).toBe(null);
    expect(computeRising({ ...base, lat: 51 })).toBe(null);
    expect(computeRising({ ...base, lng: 0 })).toBe(null);
  });

  it('returns null for NaN / ±Infinity coords (finite guard honours string|null)', () => {
    const base = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, tz: 'UTC' };
    expect(computeRising({ ...base, lat: NaN, lng: 0 })).toBe(null);
    expect(computeRising({ ...base, lat: 51, lng: Infinity })).toBe(null);
    expect(computeRising({ ...base, lat: -Infinity, lng: 0 })).toBe(null);
    // legacy getRisingSign shares the guard — no undefined leaks through
    expect(getRisingSign(2000, 1, 1, 12, 0, 0, NaN, 0)).toBe(null);
    expect(getRisingSign(2000, 1, 1, 12, 0, 0, 51, Infinity)).toBe(null);
  });
});

// ── Fractional-offset timezones ──────────────────────────────────────
// The `:MM` group in the GMT±HH:MM parse at core/rising.js:129 (`m[3]`)
// was load-bearing but unpinned: every tz literal reaching computeRising
// elsewhere in this file is whole-hour (London, NYC, Riyadh, Chicago,
// Indianapolis, Moscow). The two fractional zones that do appear in the
// suite — Australia/Adelaide and America/St_Johns in countries.test.js —
// are asserted only as strings and never fed to the rising math, so
// dropping `m[3]` entirely would have left the whole suite green.
//
// These cases carry no externally-sourced expected signs. The parity
// cases above were operator live-fire vs astro.com (brief §5); nothing
// here claims that provenance. Correctness is established instead by an
// invariant that needs no ephemeris:
//
//   a wall time in a fractional-offset zone names one UTC instant, and
//   the ascendant at that instant does not depend on which offset label
//   was used to reach it.
//
// So computeRising(wall time, tz) must equal getRisingSign at the same
// instant expressed against UTC. The offsets below are written as
// literals — never read back from offsetMinutesForWallTime — so the
// invariant cannot pass by agreeing with a regressed parser. Each block
// also pins one hour where truncating to the whole hour changes the
// sign, which is what stops the invariant from holding vacuously.
describe('rising sign — fractional-offset timezones (GMT±HH:MM minutes)', () => {
  const zones = [
    {
      label: 'Asia/Kolkata (+5:30) — Delhi 1990-06-15',
      tz: 'Asia/Kolkata', offsetMinutes: 330, truncatedMinutes: 300,
      year: 1990, month: 6, day: 15, lat: 28.6139, lng: 77.2090,
      // hour where the :30 is the difference between two signs
      pin: { hour: 2, correct: 'aries', ifMinutesDropped: 'taurus' }
    },
    {
      label: 'Asia/Kathmandu (+5:45) — Kathmandu 1995-08-20',
      tz: 'Asia/Kathmandu', offsetMinutes: 345, truncatedMinutes: 300,
      year: 1995, month: 8, day: 20, lat: 27.7172, lng: 85.3240,
      pin: { hour: 1, correct: 'gemini', ifMinutesDropped: 'cancer' }
    },
    {
      label: 'America/St_Johns (−3:30 NST) — St John’s 1990-01-15',
      tz: 'America/St_Johns', offsetMinutes: -210, truncatedMinutes: -180,
      year: 1990, month: 1, day: 15, lat: 47.5615, lng: -52.7126,
      pin: { hour: 4, correct: 'sagittarius', ifMinutesDropped: 'scorpio' }
    },
    {
      // DST *and* a fractional base offset — NDT is −2:30, so this also
      // proves the two-pass DST correction preserves the minutes.
      label: 'America/St_Johns (−2:30 NDT, summer) — St John’s 1990-07-15',
      tz: 'America/St_Johns', offsetMinutes: -150, truncatedMinutes: -120,
      year: 1990, month: 7, day: 15, lat: 47.5615, lng: -52.7126,
      pin: { hour: 0, correct: 'aries', ifMinutesDropped: 'pisces' }
    }
  ];

  for (const z of zones) {
    describe(z.label, () => {
      it('resolves the offset to the exact minute', () => {
        expect(
          offsetMinutesForWallTime(z.year, z.month, z.day, 12, 0, z.tz)
        ).toBe(z.offsetMinutes);
      });

      it('agrees with the same UTC instant at every quarter hour of the day', () => {
        for (let hour = 0; hour < 24; hour++) {
          for (const minute of [0, 15, 30, 45]) {
            // getRisingSign folds minute/60 into UT hours, so passing
            // `minute - offset` expresses the identical instant against
            // UTC; utcDateParts absorbs the day rollover either way.
            const viaUtc = getRisingSign(
              z.year, z.month, z.day,
              hour, minute - z.offsetMinutes, 0,
              z.lat, z.lng
            );
            const viaTz = computeRising({
              year: z.year, month: z.month, day: z.day,
              hour, minute, tz: z.tz, lat: z.lat, lng: z.lng
            });
            expect(viaTz, `${hour}:${String(minute).padStart(2, '0')}`).toBe(viaUtc);
          }
        }
      });

      it('the offset minutes change the sign — the invariant is not vacuous', () => {
        const { hour, correct, ifMinutesDropped } = z.pin;
        expect(computeRising({
          year: z.year, month: z.month, day: z.day,
          hour, minute: 0, tz: z.tz, lat: z.lat, lng: z.lng
        })).toBe(correct);
        // the same wall time with the minutes truncated away
        expect(getRisingSign(
          z.year, z.month, z.day, hour, -z.truncatedMinutes, 0, z.lat, z.lng
        )).toBe(ifMinutesDropped);
        expect(correct).not.toBe(ifMinutesDropped);
      });
    });
  }

  // Scale of the exposure, so a future reader can weigh the guard: over a
  // full day of quarter-hour births in Delhi, a quarter of them land on a
  // different sign if the minutes are lost.
  it('losing the minutes would move a quarter of Delhi births to another sign', () => {
    let moved = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        const correct = getRisingSign(1990, 6, 15, hour, minute - 330, 0, 28.6139, 77.2090);
        const dropped = getRisingSign(1990, 6, 15, hour, minute - 300, 0, 28.6139, 77.2090);
        if (correct !== dropped) moved++;
      }
    }
    expect(moved).toBe(24); // of 96
  });
});
