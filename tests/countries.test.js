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

// ── value pins (2026-07-24 mutation pass, rebased onto the centroid strip) ──
// Mutation testing scored this module at 61.8% with 520 surviving mutants:
// every `name` string could be blanked and every unary minus flipped without
// a test noticing. The suites above check shape, ranges, and timezone
// mapping — never the values themselves, and a sign flip stays inside a
// ±90/±180 range check.
//
// Oracles are independent of core/countries.js: ICU's own region-name data,
// and the separately-sourced assets/cities.json. NOTE: the centroid checks
// now guard tests/country_centroids.fixture.json rather than the module —
// the 2026-07-25 deep-clean stripped defaultLat/defaultLng out of COUNTRIES.
// The fixture still feeds product code through the legacy rising replay
// above, so a corrupted centroid there produces a wrong rising sign.

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });
const PLAIN_CODE = /^[A-Z]{2}$/;

// Deliberate divergences from ICU's rendering: this table predates the city
// dataset (v0.2.1 legacy) and uses unaccented ASCII, "and" over "&",
// abbreviations, and several older or shorter country names. Each is pinned
// by exact value, so blanking one fails here even though it is not
// ICU-comparable.
const ICU_NAME_DIVERGENCES = {
  AX: 'aland islands', AG: 'antigua and barbuda', BA: 'bosnia and herzegovina',
  BQ: 'caribbean nl', CF: 'central african rep.', CC: 'cocos islands',
  CI: "cote d'ivoire", CW: 'curacao', CZ: 'czech republic',
  CD: 'democratic republic of the congo', TL: 'east timor',
  SZ: 'eswatini (swaziland)', TF: 'french s. terr.',
  HM: 'heard island and mcdonald islands', HK: 'hong kong', MO: 'macau',
  PS: 'palestine', PN: 'pitcairn', CG: 'republic of the congo', RE: 'reunion',
  AS: 'samoa (american)', WS: 'samoa (western)', ST: 'sao tome and principe',
  GS: 'south georgia and south sandwich islands', BL: 'st barthelemy',
  SH: 'st helena', KN: 'st kitts and nevis', LC: 'st lucia',
  SX: 'st maarten (dutch)', MF: 'st martin (french)', PM: 'st pierre and miquelon',
  VC: 'st vincent', SJ: 'svalbard and jan mayen', TT: 'trinidad and tobago',
  TR: 'turkey', TC: 'turks and caicos is', UM: 'us minor outlying islands',
  VA: 'vatican', WF: 'wallis and futuna',
};

describe('countries name values (ICU cross-check)', () => {
  it('every plain alpha-2 name matches ICU, or is a recorded divergence', () => {
    const wrong = [];
    for (const country of COUNTRIES) {
      if (!PLAIN_CODE.test(country.code)) continue;
      const recorded = ICU_NAME_DIVERGENCES[country.code];
      const expected = recorded !== undefined
        ? recorded
        : (REGION_NAMES.of(country.code) || '').toLowerCase();
      if (country.name !== expected) wrong.push(`${country.code}: "${country.name}" ≠ "${expected}"`);
    }
    expect(wrong).toEqual([]);
  });

  it('the divergence list has no stale entries — each one still diverges', () => {
    const stale = Object.keys(ICU_NAME_DIVERGENCES).filter(
      code => ICU_NAME_DIVERGENCES[code] === (REGION_NAMES.of(code) || '').toLowerCase()
    );
    expect(stale).toEqual([]);
  });

  it('split country/zone rows keep their region-qualified names', () => {
    const split = COUNTRIES.filter(c => !PLAIN_CODE.test(c.code));
    expect(split.length).toBeGreaterThan(0);
    for (const country of split) {
      expect(country.name, `${country.code} should name its region`).toMatch(/\(.+\)$/);
      expect(country.name).toBe(country.name.toLowerCase());
    }
  });

  it('names are unique and non-empty', () => {
    const names = COUNTRIES.map(c => c.name);
    expect(names.filter(n => !n || !n.trim())).toEqual([]);
    expect(new Set(names).size).toBe(names.length);
  });
});

// Great-circle distance, km.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Median city position per country — more robust than the largest city,
// which can sit far off-centre (Kuala Lumpur, Kinshasa).
function medianCityByCountryCode() {
  const points = new Map();
  for (const [, cc, lat, lng] of cityData.cities) {
    if (!points.has(cc)) points.set(cc, []);
    points.get(cc).push([lat, lng]);
  }
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const out = new Map();
  for (const [cc, list] of points) {
    if (list.length < 3) continue; // too thin to be an oracle
    out.set(cc, [median(list.map(p => p[0])), median(list.map(p => p[1]))]);
  }
  return out;
}

describe('legacy centroid fixture — sign integrity (cities.json cross-check)', () => {
  const medians = medianCityByCountryCode();

  it('cross-checks a substantial share of the fixture', () => {
    const covered = COUNTRIES.filter(c => medians.has(c.code));
    expect(covered.length).toBeGreaterThanOrEqual(180);
  });

  it('every centroid sits closer to its own cities than its longitude mirror', () => {
    // A flipped longitude puts the centroid in the wrong hemisphere; even for
    // countries near the prime meridian that is measurably worse.
    const wrong = [];
    for (const country of COUNTRIES) {
      const median = medians.get(country.code);
      if (!median) continue;
      const [lat, lng] = centroid(country.code);
      const [mLat, mLng] = median;
      const actual = haversineKm(lat, lng, mLat, mLng);
      const mirrored = haversineKm(lat, -lng, mLat, mLng);
      if (!(actual < mirrored)) {
        wrong.push(`${country.code}: ${Math.round(actual)}km vs mirrored ${Math.round(mirrored)}km`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('every non-equatorial centroid sits closer to its own cities than its latitude mirror', () => {
    // Countries straddling the equator (|lat| < 5) are exempt: for them a
    // latitude flip is genuinely ambiguous against city data — DR Congo and
    // Kenya both land within a few hundred km either way.
    const wrong = [];
    for (const country of COUNTRIES) {
      const median = medians.get(country.code);
      if (!median) continue;
      const [lat, lng] = centroid(country.code);
      if (Math.abs(lat) < 5) continue;
      const [mLat, mLng] = median;
      const actual = haversineKm(lat, lng, mLat, mLng);
      const mirrored = haversineKm(-lat, lng, mLat, mLng);
      if (!(actual < mirrored)) {
        wrong.push(`${country.code}: ${Math.round(actual)}km vs mirrored ${Math.round(mirrored)}km`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe('countries legacy offset signs (IANA cross-check)', () => {
  it('every legacy fixed offset matches its largest city’s real zone offset', () => {
    // The legacy utcOffsetMinutes field is what pre-v0.5.2 stored profiles
    // replay through; a sign flip there silently moves a birth time by twice
    // the offset. January and July are both accepted because the fixed value
    // may have been recorded on either side of DST.
    const largest = largestCityByCountryCode();
    const jan = new Date(Date.UTC(2024, 0, 15, 12));
    const jul = new Date(Date.UTC(2024, 6, 15, 12));
    const offsetMinutes = (tz, when) => {
      const label = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
        .formatToParts(when).find(p => p.type === 'timeZoneName').value;
      if (label === 'GMT') return 0;
      const m = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label);
      return (m[1] === '+' ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3] || 0));
    };
    const wrong = [];
    let checked = 0;
    for (const country of COUNTRIES) {
      if (!PLAIN_CODE.test(country.code)) continue;
      const city = largest.get(country.code);
      if (!city) continue;
      checked++;
      const winter = offsetMinutes(city.tz, jan);
      const summer = offsetMinutes(city.tz, jul);
      if (country.utcOffsetMinutes !== winter && country.utcOffsetMinutes !== summer) {
        wrong.push(`${country.code}: ${country.utcOffsetMinutes} ∉ {${winter}, ${summer}} (${city.tz})`);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(180);
    expect(wrong).toEqual([]);
  });
});
