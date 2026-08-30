// 8ball / tests / kua.test.js
// Run with: npm test
//
// Suites:
//  1. Formula anchors + the 5→2/5→8 remap disclosure — the Kua arithmetic
//     against hand-checked Ba Zhai values, remap returned never silent.
//  2. Classical equivalence — full 1900–1999 sweep pinning the digit-sum
//     rule to the classical (100−yy)%9 / (yy−4)%9 statements.
//  3. Li Chun solar-year boundary — derived from core/calendar.js's
//     authority-pinned term table, stricter than a fixed Feb-4 cutoff.
//  4. buildProfile carries NO gender — the ask was removed 2026-08-30;
//     core/kua.js keeps the method's gendered arithmetic (consumed only
//     through getKuaBoth), but a profile never files one.

import { describe, it, expect } from 'vitest';

import { KUA_GENDERS, getKua, getKuaBoth, solarYearOf } from '../core/kua.js';
import { monthAnimalSolarTerm } from '../core/calendar.js';
import { buildProfile } from '../core/profile.js';

describe('kua formula anchors', () => {
  it('1985: male 6 (Qian), female 9 (Li) — no remap', () => {
    expect(getKua(1985, 6, 1, 'male')).toEqual({ number: 6, remapped: false });
    expect(getKua(1985, 6, 1, 'female')).toEqual({ number: 9, remapped: false });
  });

  it('1990: male 1 (Kan); female raw 5 files to 8 (Gen) with the remap disclosed', () => {
    expect(getKua(1990, 6, 1, 'male')).toEqual({ number: 1, remapped: false });
    expect(getKua(1990, 6, 1, 'female')).toEqual({ number: 8, remapped: true });
  });

  it('1977: male raw 5 files to 2 (Kun) with the remap disclosed', () => {
    expect(getKua(1977, 6, 1, 'male')).toEqual({ number: 2, remapped: true });
    expect(getKua(1977, 6, 1, 'female')).toEqual({ number: 1, remapped: false });
  });

  it('2005: single continuous rule → male 4, female 2', () => {
    // NOT a divergence example — see the equivalence sweep below and
    // core/kua.js's NAMED LIMITATION comment. The competing post-2000
    // school (male 9−S, female 6+S, S = last-two-digits sum) gives the
    // same numbers here too.
    expect(getKua(2005, 6, 1, 'male')).toEqual({ number: 4, remapped: false });
    expect(getKua(2005, 6, 1, 'female')).toEqual({ number: 2, remapped: false });
  });

  it('never returns 5, and getKuaBoth agrees with getKua for every year in range', () => {
    for (let y = 1900; y <= 2100; y += 7) {
      const both = getKuaBoth(y, 7, 1);
      expect(both.male).toEqual(getKua(y, 7, 1, 'male'));
      expect(both.female).toEqual(getKua(y, 7, 1, 'female'));
      expect(both.male.number).not.toBe(5);
      expect(both.female.number).not.toBe(5);
      expect(both.male.number).toBeGreaterThanOrEqual(1);
      expect(both.male.number).toBeLessThanOrEqual(9);
      expect(both.female.number).toBeGreaterThanOrEqual(1);
      expect(both.female.number).toBeLessThanOrEqual(9);
    }
  });

  it('invalid gender throws — the single-gender ask is a caller contract', () => {
    expect(() => getKua(1990, 6, 1, undefined)).toThrow(/gender/);
    expect(() => getKua(1990, 6, 1, 'x')).toThrow(/gender/);
    expect(KUA_GENDERS).toEqual(['male', 'female']);
    expect(Object.isFrozen(KUA_GENDERS)).toBe(true);
  });
});

describe('classical equivalence (19xx)', () => {
  it('digit-sum rule ≡ (100−yy)%9 male / (yy−4)%9 female across 1900–1999', () => {
    for (let y = 1900; y <= 1999; y++) {
      const yy = y % 100;
      let m = (100 - yy) % 9;
      if (m === 0) m = 9;
      const male = m === 5 ? { number: 2, remapped: true } : { number: m, remapped: false };
      let f = (((yy - 4) % 9) + 9) % 9;
      if (f === 0) f = 9;
      const female = f === 5 ? { number: 8, remapped: true } : { number: f, remapped: false };
      // July 1 is safely after Li Chun, so the solar year is y itself.
      expect(getKua(y, 7, 1, 'male')).toEqual(male);
      expect(getKua(y, 7, 1, 'female')).toEqual(female);
    }
  });
});

describe('named-limitation citation check (20xx)', () => {
  it('the commonly-cited post-2000 formula (male 9−S, female 6+S, S = last-two-digits digit-sum) never diverges from this module\'s continuous rule, 2000–2099', () => {
    const reduce = n => { while (n > 9) n = String(n).split('').reduce((a, c) => a + Number(c), 0); return n; };
    for (let y = 2000; y <= 2099; y++) {
      const s2 = reduce(y % 100);
      let m = 9 - s2;
      if (m === 0) m = 9;
      const male = m === 5 ? { number: 2, remapped: true } : { number: m, remapped: false };
      let f = reduce(6 + s2);
      if (f === 0) f = 9;
      const female = f === 5 ? { number: 8, remapped: true } : { number: f, remapped: false };
      // July 1 is safely after Li Chun, so the solar year is y itself.
      expect(getKua(y, 7, 1, 'male')).toEqual(male);
      expect(getKua(y, 7, 1, 'female')).toEqual(female);
    }
  });
});

describe('Li Chun solar-year boundary', () => {
  it('turns at-or-after Li Chun, derived from the authority-pinned term table', () => {
    for (const y of [1950, 2000, 2024, 2088]) {
      const [m, d] = monthAnimalSolarTerm(y, 0);
      expect(solarYearOf(y, m, d)).toBe(y);           // on the term: new solar year
      expect(solarYearOf(y, m, d - 1)).toBe(y - 1);   // the day before: previous
    }
  });

  it('2021 discriminates against a fixed Feb-4 rule: Li Chun 2021 is Feb 3', () => {
    expect(monthAnimalSolarTerm(2021, 0)).toEqual([2, 3]);
    expect(solarYearOf(2021, 2, 3)).toBe(2021); // a Feb-4 rule would file 2020
    expect(solarYearOf(2021, 2, 2)).toBe(2020);
  });

  it('a pre-Li-Chun birth files under the previous solar year end-to-end', () => {
    // 1990-01-15 → solar 1989 → S=9 → male 11−9=2 (Kun).
    expect(getKua(1990, 1, 15, 'male')).toEqual({ number: 2, remapped: false });
    // The floor year still computes: 1900-01-15 → solar 1899 (arithmetic
    // needs no table lookup below the calendar range).
    expect(solarYearOf(1900, 1, 15)).toBe(1899);
    expect(getKua(1900, 1, 15, 'male').number).toBeGreaterThanOrEqual(1);
  });

  it('out-of-range years propagate the calendar throw', () => {
    expect(() => getKua(1899, 6, 1, 'male')).toThrow(/out of range/);
    expect(() => getKua(2101, 6, 1, 'male')).toThrow(/out of range/);
  });
});

describe('buildProfile carries no gender (removed 2026-08-30)', () => {
  it('never files one, even when a caller still passes the old option', () => {
    expect(buildProfile('Test Name', '1990-06-15', { gender: 'female' })).not.toHaveProperty('gender');
    expect(buildProfile('Test Name', '1990-06-15', { gender: 'male' })).not.toHaveProperty('gender');
    expect(buildProfile('Test Name', '1990-06-15')).not.toHaveProperty('gender');
  });

  it('a stale gender option changes nothing else on the profile object', () => {
    const without = buildProfile('Test Name', '1990-06-15', { time: '08:30' });
    const with_ = buildProfile('Test Name', '1990-06-15', { time: '08:30', gender: 'female' });
    expect(with_).toEqual(without);
  });
});
