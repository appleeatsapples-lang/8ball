// 8ball / tests / cities.test.js
//
// Data-quality contract for assets/cities.json (added v0.2.7.2).
//
// Reads the JSON directly via readFileSync rather than through the
// loadCities() module — keeps the test deterministic across Node
// versions and avoids the import-attributes (`with: { type: 'json' }`)
// syntax-support edge case. The runtime path is exercised separately
// in the smoke checks at index.html load time.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'assets', 'cities.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

describe('cities.json — structure', () => {
  it('top-level shape: { tz: array, cities: array }', () => {
    expect(typeof data).toBe('object');
    expect(Array.isArray(data.tz)).toBe(true);
    expect(Array.isArray(data.cities)).toBe(true);
  });
});

describe('cities.json — size', () => {
  it('contains at least 50,000 city entries', () => {
    expect(data.cities.length).toBeGreaterThanOrEqual(50_000);
  });
  it('has at least one IANA timezone entry', () => {
    expect(data.tz.length).toBeGreaterThan(0);
  });
});

describe('cities.json — tz array', () => {
  it('every entry is a non-empty string', () => {
    for (const tz of data.tz) {
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    }
  });

  it('every entry resolves as a valid IANA timezone via Intl.DateTimeFormat', () => {
    for (const tz of data.tz) {
      // Constructor throws RangeError for invalid timezone strings.
      // Wrapping in expect-not-throws gives a precise failure message
      // identifying which tz string is bad if any fails.
      expect(() => new Intl.DateTimeFormat('en', { timeZone: tz }), tz)
        .not.toThrow();
    }
  });
});

describe('cities.json — city shape', () => {
  // ~53k entries × ~17 checks. An earlier shape of this test made every
  // check its own expect() (~900k vitest assertions), whose per-expect
  // overhead put the run at ~12s against a widened 15s budget — which
  // then timed out under CPU contention or a cold cache on four
  // recorded occasions (journal: pr136, pr222, pr225, pr226 cycles). The
  // same contract now runs as plain JS collecting violation messages
  // with a single terminal expect: identical checks, millisecond
  // runtime, and the test rejoins the suite's default budget.
  it('every entry is a 6-element array with correctly typed fields', () => {
    const maxTzIdx = data.tz.length - 1;
    const violations = [];
    // Strings render quoted so `tzIdx "240"` can't read as the number
    // 240; Infinity (reachable via JSON's 1e999) stays "Infinity"
    // rather than JSON.stringify's misleading "null".
    const show = (v) => typeof v === 'string' ? JSON.stringify(v) : String(v);
    const flag = (i, msg) => violations.push(`index ${i}: ${msg}`);
    for (let i = 0; i < data.cities.length && violations.length <= 5; i++) {
      const c = data.cities[i];
      if (!Array.isArray(c)) { flag(i, 'entry is not an array'); continue; }
      if (c.length !== 6) { flag(i, `length ${c.length}, expected 6`); continue; }
      const [name, cc, lat, lng, tzIdx, pop] = c;
      if (typeof name !== 'string' || name.length === 0)
        flag(i, `name ${show(name)} is not a non-empty string`);
      if (typeof cc !== 'string' || !/^[A-Z]{2}$/.test(cc))
        flag(i, `cc ${show(cc)} is not two uppercase letters`);
      if (typeof lat !== 'number' || !(lat >= -90 && lat <= 90))
        flag(i, `lat ${show(lat)} is not a number in [-90, 90]`);
      if (typeof lng !== 'number' || !(lng >= -180 && lng <= 180))
        flag(i, `lng ${show(lng)} is not a number in [-180, 180]`);
      if (!Number.isInteger(tzIdx) || tzIdx < 0 || tzIdx > maxTzIdx)
        flag(i, `tzIdx ${show(tzIdx)} is not an integer in [0, ${maxTzIdx}]`);
      if (!Number.isInteger(pop) || pop < 0)
        flag(i, `pop ${show(pop)} is not a non-negative integer`);
    }
    expect(violations, 'city-shape violations (first few shown)').toEqual([]);
  });
});

describe('cities.json — no near-duplicates', () => {
  it('no two cities share (name, cc, lat-2dp, lng-2dp)', () => {
    const seen = new Set();
    const dupes = [];
    for (const c of data.cities) {
      const key = `${c[0]}|${c[1]}|${c[2].toFixed(2)}|${c[3].toFixed(2)}`;
      if (seen.has(key)) {
        dupes.push(key);
        // Keep counting all dupes — surface up to 5 to help debug if
        // the data ever regresses, but don't blow up the test output.
        if (dupes.length > 5) break;
      }
      seen.add(key);
    }
    expect(dupes, 'duplicate (name, cc, lat-2dp, lng-2dp) keys').toEqual([]);
  });
});

describe('cities.json — population sort order', () => {
  it('cities are sorted by population descending', () => {
    for (let i = 0; i < data.cities.length - 1; i++) {
      // Pop is at index 5. Strict descending — equal pop allowed.
      if (data.cities[i][5] < data.cities[i + 1][5]) {
        // Surface the first violation with context.
        throw new Error(
          `sort violation at index ${i}: ` +
          `${data.cities[i][0]} (pop ${data.cities[i][5]}) < ` +
          `${data.cities[i + 1][0]} (pop ${data.cities[i + 1][5]})`
        );
      }
    }
  });
});

describe('cities.json — sanity lookups', () => {
  // First-occurrence map from raw stored name to its full row. Because
  // pop is descending, the first hit for a given name is the largest
  // city of that name (e.g. "Cambridge" → the UK one ahead of the
  // Massachusetts one). These six anchor lookups guard against silent
  // data shifts in future re-derivations.
  const byName = new Map();
  for (const c of data.cities) {
    if (!byName.has(c[0])) byName.set(c[0], c);
  }

  const anchors = [
    { name: 'Shanghai',     cc: 'CN' },
    { name: 'Riyadh',       cc: 'SA' },
    { name: 'Berlin',       cc: 'DE' },
    { name: 'Indianapolis', cc: 'US' },
    { name: 'Moscow',       cc: 'RU' },
    { name: 'Reykjavík',    cc: 'IS' }  // GeoNames stores the í
  ];

  for (const a of anchors) {
    it(`includes ${a.name}, ${a.cc}`, () => {
      const row = byName.get(a.name);
      expect(row, `${a.name} missing from dataset`).toBeDefined();
      expect(row[1]).toBe(a.cc);
    });
  }
});
