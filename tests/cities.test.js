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
  // ~53k entries x ~17 assertions: legitimately >5s under vitest 4's
  // per-expect overhead. Scoped here so the rest of the suite keeps
  // the tight default budget.
  it('every entry is a 6-element array with correctly typed fields', { timeout: 15_000 }, () => {
    const maxTzIdx = data.tz.length - 1;
    for (let i = 0; i < data.cities.length; i++) {
      const c = data.cities[i];
      expect(Array.isArray(c), `index ${i}`).toBe(true);
      expect(c.length, `index ${i}`).toBe(6);
      const [name, cc, lat, lng, tzIdx, pop] = c;
      expect(typeof name, `index ${i} name`).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(typeof cc, `index ${i} cc`).toBe('string');
      expect(cc).toMatch(/^[A-Z]{2}$/);
      expect(typeof lat, `index ${i} lat`).toBe('number');
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(typeof lng, `index ${i} lng`).toBe('number');
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(Number.isInteger(tzIdx), `index ${i} tzIdx`).toBe(true);
      expect(tzIdx).toBeGreaterThanOrEqual(0);
      expect(tzIdx).toBeLessThanOrEqual(maxTzIdx);
      expect(Number.isInteger(pop), `index ${i} pop`).toBe(true);
      expect(pop).toBeGreaterThanOrEqual(0);
    }
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
