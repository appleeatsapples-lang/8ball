// 8ball / tests / calendar.test.js
// core/calendar.js — the Meeus lunar-new-year + solar-term tables (calc v2).
//
// Mutation testing (2026-07-24, audits/mutation_survivors_core_2026-07-24.md)
// scored this module at 42.7% with 171 surviving ArithmeticOperator mutants:
// the astronomical series could be perturbed almost anywhere — including the
// bisection midpoint `(lo + hi) / 2` — without a single test noticing. It was
// also the only core/ module with no test file of its own; its whole coverage
// was ten lunar-new-year sanity locks and seven solar-term locks living in
// tests/profile.test.js (those stay where they are, as the DOCTRINE §3
// Hong Kong Observatory calibration checkpoints).
//
// This file adds breadth over the module's full 1900–2100 declared range,
// using oracles that are INDEPENDENT of the implementation rather than
// snapshots of it:
//
//   1. ICU's Chinese calendar (`en-u-ca-chinese`), a separate astronomical
//      implementation shipped with Node, is asked for lunar new year in all
//      201 years and compared against ours.
//   2. Canonical jieqi windows — each of the twelve animal-month solar terms
//      falls in a fixed Gregorian month, within a couple of days of a fixed
//      nominal date. That is textbook astronomy, not a golden snapshot.
//
// Neither oracle is derived from core/calendar.js, so a mutant that shifts
// the series has to survive a second implementation to go unnoticed.

import { describe, it, expect } from 'vitest';
import { lunarNewYearDate, monthAnimalSolarTerm } from '../core/calendar.js';

const RANGE_MIN = 1900;
const RANGE_MAX = 2100;
const years = Array.from({ length: RANGE_MAX - RANGE_MIN + 1 }, (_, i) => RANGE_MIN + i);

// ── oracle 1: ICU's Chinese calendar ──────────────────────────────
// Lunar new year is the Gregorian date carrying Chinese month 1, day 1.
// Evaluated in UTC at noon so no boundary lands on a midnight rollover.
const chinese = new Intl.DateTimeFormat('en-u-ca-chinese', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});

function icuLunarNewYear(year) {
  for (let t = Date.UTC(year, 0, 18, 12); t <= Date.UTC(year, 1, 22, 12); t += 86_400_000) {
    const parts = Object.fromEntries(
      chinese.formatToParts(new Date(t)).map(p => [p.type, p.value])
    );
    if (parts.month === '1' && parts.day === '1') {
      const d = new Date(t);
      return [d.getUTCMonth() + 1, d.getUTCDate()];
    }
  }
  return null;
}

// The years where ICU and this module disagree by exactly one day. Each is a
// new-moon-near-midnight boundary case, where a small difference in the
// astronomical model or in the civil offset used flips which Gregorian day
// carries the new moon.
//
// RESOLVED 2026-07-29. The four original entries (1916, 1954, 2027, 2030) were
// checked against three independent implementations — sxtwl (寿星万年历,
// astronomical), and the table-based lunardate and borax — which agree with
// each other on every year 1900–2050. Three of the four were ICU's error and
// are kept below. The fourth, 1916, was OURS: evaluating a pre-1929 date at
// UTC+8 instead of Beijing local mean time filed the new moon a day late. That
// is fixed in core/calendar.js, so 1916 now agrees with ICU and has left this
// list. The Hong Kong Observatory tables named in DOCTRINE §3 could not be
// reached from the authoring environment (egress policy); the three-library
// consensus is the substitute, and it is unanimous.
const ICU_DIVERGENCES = {
  1954: { ours: [2, 3], icu: [2, 4] },
  2027: { ours: [2, 6], icu: [2, 7] },
  2030: { ours: [2, 3], icu: [2, 2] },
};

describe('lunarNewYearDate — cross-checked against ICU (1900–2100)', () => {
  it('agrees with ICU’s Chinese calendar in every year but the four recorded ones', () => {
    const mismatches = [];
    for (const year of years) {
      const ours = lunarNewYearDate(year);
      const icu = icuLunarNewYear(year);
      expect(icu, `ICU produced no lunar new year for ${year}`).not.toBeNull();
      if (ours[0] !== icu[0] || ours[1] !== icu[1]) {
        mismatches.push(`${year}: ours ${ours.join('-')} vs ICU ${icu.join('-')}`);
      }
    }
    const expected = Object.entries(ICU_DIVERGENCES).map(
      ([year, { ours, icu }]) => `${year}: ours ${ours.join('-')} vs ICU ${icu.join('-')}`
    );
    expect(mismatches.sort()).toEqual(expected.sort());
  });

  it('the four recorded divergences still hold their recorded values', () => {
    // If the implementation moves on one of these, this fails loudly rather
    // than quietly re-labelling the disagreement as agreement.
    for (const [year, { ours }] of Object.entries(ICU_DIVERGENCES)) {
      expect(lunarNewYearDate(Number(year)), `divergent year ${year}`).toEqual(ours);
    }
  });

  it('1916 lands on Feb 3 — the pre-1929 Beijing-LMT correction', () => {
    // Regression pin for the defect this file's ICU cross-check surfaced: at a
    // flat UTC+8 the 1916 new moon fell a day late, filing a 1916-02-03 birth
    // under the previous year's animal. Three independent implementations and
    // ICU all give Feb 3.
    expect(lunarNewYearDate(1916)).toEqual([2, 3]);
  });

  it('never falls outside the canonical 21 january – 21 february window', () => {
    const outside = years
      .map(year => [year, lunarNewYearDate(year)])
      .filter(([, [m, d]]) => !((m === 1 && d >= 21) || (m === 2 && d <= 21)))
      .map(([year, md]) => `${year}: ${md.join('-')}`);
    expect(outside).toEqual([]);
  });

  it('advances or retreats by a lunation, never repeating a date pattern erratically', () => {
    // Consecutive lunar new years sit 353–385 days apart (12 or 13 lunations).
    const gaps = [];
    for (let i = 1; i < years.length; i++) {
      const [pm, pd] = lunarNewYearDate(years[i - 1]);
      const [m, d] = lunarNewYearDate(years[i]);
      const gap = (Date.UTC(years[i], m - 1, d) - Date.UTC(years[i - 1], pm - 1, pd)) / 86_400_000;
      if (gap < 353 || gap > 385) gaps.push(`${years[i - 1]}→${years[i]}: ${gap}d`);
    }
    expect(gaps).toEqual([]);
  });

  it('rejects years outside the declared table range', () => {
    expect(() => lunarNewYearDate(RANGE_MIN - 1)).toThrow(/out of range/);
    expect(() => lunarNewYearDate(RANGE_MAX + 1)).toThrow(/out of range/);
    expect(() => lunarNewYearDate(RANGE_MIN)).not.toThrow();
    expect(() => lunarNewYearDate(RANGE_MAX)).not.toThrow();
  });
});

// ── oracle 2: canonical jieqi positions ───────────────────────────
// The twelve solar terms that start animal months are fixed points on the
// ecliptic, so each one lands in the same Gregorian month every year, within
// about two days of its nominal date. Windows below are the nominal date ±2.
const JIEQI = [
  { index: 0,  name: 'lichun',     month: 2,  nominal: 4 },
  { index: 1,  name: 'jingzhe',    month: 3,  nominal: 6 },
  { index: 2,  name: 'qingming',   month: 4,  nominal: 5 },
  { index: 3,  name: 'lixia',      month: 5,  nominal: 6 },
  { index: 4,  name: 'mangzhong',  month: 6,  nominal: 6 },
  { index: 5,  name: 'xiaoshu',    month: 7,  nominal: 7 },
  { index: 6,  name: 'liqiu',      month: 8,  nominal: 8 },
  { index: 7,  name: 'bailu',      month: 9,  nominal: 8 },
  { index: 8,  name: 'hanlu',      month: 10, nominal: 8 },
  { index: 9,  name: 'lidong',     month: 11, nominal: 7 },
  { index: 10, name: 'daxue',      month: 12, nominal: 7 },
  { index: 11, name: 'xiaohan',    month: 1,  nominal: 6 },
];

describe('monthAnimalSolarTerm — canonical jieqi positions (1900–2100)', () => {
  for (const { index, name, month, nominal } of JIEQI) {
    it(`${name} (index ${index}) always lands ${month}/${nominal - 2}–${month}/${nominal + 2}`, () => {
      const strays = [];
      for (const year of years) {
        const [m, d] = monthAnimalSolarTerm(year, index);
        if (m !== month || d < nominal - 2 || d > nominal + 2) strays.push(`${year}: ${m}-${d}`);
      }
      expect(strays).toEqual([]);
    });
  }

  it('the eleven in-year terms run in strict date order', () => {
    const disordered = [];
    for (const year of years) {
      let prev = -Infinity;
      for (let i = 0; i <= 10; i++) {
        const [m, d] = monthAnimalSolarTerm(year, i);
        const stamp = Date.UTC(year, m - 1, d);
        if (stamp <= prev) disordered.push(`${year} at index ${i}`);
        prev = stamp;
      }
    }
    expect(disordered).toEqual([]);
  });

  it('consecutive terms sit one solar month apart (29–32 days)', () => {
    const offBeat = [];
    for (const year of years) {
      for (let i = 1; i <= 10; i++) {
        const [pm, pd] = monthAnimalSolarTerm(year, i - 1);
        const [m, d] = monthAnimalSolarTerm(year, i);
        const gap = (Date.UTC(year, m - 1, d) - Date.UTC(year, pm - 1, pd)) / 86_400_000;
        if (gap < 29 || gap > 32) offBeat.push(`${year} ${i - 1}→${i}: ${gap}d`);
      }
    }
    expect(offBeat).toEqual([]);
  });

  it('xiaohan (index 11) returns a January date in the SAME year, not the next', () => {
    // The one term that wraps: it starts the ox month but is reported inside
    // the calling year, which the year-pillar cusp logic in core/profile.js
    // depends on.
    for (const year of [1900, 1985, 2024, 2100]) {
      expect(monthAnimalSolarTerm(year, 11)[0]).toBe(1);
    }
  });

  it('rejects out-of-range years and animal indices', () => {
    expect(() => monthAnimalSolarTerm(RANGE_MIN - 1, 0)).toThrow(/out of range/);
    expect(() => monthAnimalSolarTerm(RANGE_MAX + 1, 0)).toThrow(/out of range/);
    expect(() => monthAnimalSolarTerm(2024, -1)).toThrow(/out of range/);
    expect(() => monthAnimalSolarTerm(2024, 12)).toThrow(/out of range/);
  });
});
