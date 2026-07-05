// 8ball / tests / math.test.js
// core/math.js — shared arithmetic primitives (2026-07-05 standards pass).
// These previously lived as per-module copies (rising.js normalizeDeg /
// calendar.js normalizeAngle / pillars.js mod / profile.js + birthcard.js
// sumDigits); the calc suites exercise them indirectly through every
// coordinate, so this file only pins the primitive contracts directly —
// especially the negative-operand behavior that motivated the euclidean
// idiom in the first place.

import { describe, it, expect } from 'vitest';
import { mod, sumDigits, normalizeDeg } from '../core/math.js';

describe('core/math.js primitives', () => {
  it('mod is euclidean: negative operands land in [0, k)', () => {
    expect(mod(-1, 12)).toBe(11);
    expect(mod(-13, 12)).toBe(11);
    expect(mod(25, 12)).toBe(1);
    expect(mod(0, 12)).toBe(0);
    // contrast with the JS remainder operator, which this exists to avoid
    expect(-1 % 12).toBe(-1);
  });

  it('sumDigits sums decimal digits of the absolute value', () => {
    expect(sumDigits(1987)).toBe(25);
    expect(sumDigits(-1987)).toBe(25);
    expect(sumDigits(0)).toBe(0);
    expect(sumDigits(9)).toBe(9);
  });

  it('normalizeDeg maps any angle into [0, 360)', () => {
    expect(normalizeDeg(360)).toBe(0);
    expect(normalizeDeg(-30)).toBe(330);
    expect(normalizeDeg(725)).toBe(5);
    expect(normalizeDeg(0)).toBe(0);
  });
});
