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

  // 2026-07-29: guards the trailing `% k` in mod(). The obvious
  // "simplification" — `const r = n % k; return r < 0 ? r + k : r` — is
  // WRONG for tiny negative inputs: `r + k` rounds up to exactly k in
  // float64, returning 360 instead of 0 and breaking the range contract
  // the whole module advertises. Every case below returns 0 under the
  // real implementation and 360 under the shortened one, so this test
  // fails loudly if anyone reaches for that edit. See core/math.js.
  it('normalizeDeg folds tiny negative angles to 0, never to 360', () => {
    for (const tiny of [-1e-20, -1e-18, -1e-16, -1e-15, -1e-14, -1e-30, -Number.MIN_VALUE]) {
      const out = normalizeDeg(tiny);
      expect(out, `normalizeDeg(${tiny}) must fold to 0, not 360`).toBe(0);
      expect(out).toBeLessThan(360);
    }
  });

  it('normalizeDeg holds the [0, 360) range contract across magnitudes', () => {
    // Sweep the negative-exponent range where the shortened form breaks
    // (verified: 276 of these 320 magnitudes return exactly 360 under it).
    const violations = [];
    for (let e = 1; e <= 320; e++) {
      const out = normalizeDeg(-Math.pow(2, -e));
      if (!(out >= 0 && out < 360)) violations.push(`-2^-${e} -> ${out}`);
    }
    expect(violations, `normalizeDeg left [0,360):\n${violations.join('\n')}`).toEqual([]);
  });

  it('mod keeps the [0, k) contract for tiny negatives at other moduli', () => {
    // Not 360-specific — the same rounding applies at every modulus the
    // repo uses: 5 (five-element cycle, profile.js), 10 and 12 (stem /
    // branch and animal cycles, pillars.js + profile.js), 360 (degrees).
    for (const k of [5, 10, 12, 360]) {
      for (const tiny of [-1e-20, -1e-16, -1e-14]) {
        const out = mod(tiny, k);
        expect(out, `mod(${tiny}, ${k}) must stay below ${k}`).toBeLessThan(k);
        expect(out).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
