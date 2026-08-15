// 8ball / tests / birthcard.test.js
//
// v0.5.0 — Tarot birth-card free coordinate. Reduction tradition locked to
// DIGIT-SUM; fool-mapping (22 → 0) locked YES; lead-row placement (operator,
// see journal). A free coordinate (numeral + name), never interpretation (§1).
// All DOBs synthetic — chosen for the calc path they exercise (§11).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getBirthCard,
  getBirthCardNumber,
  MAJOR_ARCANA,
} from '../core/birthcard.js';
import { buildProfile } from '../core/profile.js';
import { cellRenderState } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');

describe('birth-card reduction (digit-sum tradition)', () => {
  const cases = [
    { dob: '1990-01-01', n: 21, label: 'XXI · the world' },
    { dob: '1985-12-31', n: 3,  label: 'III · the empress' },
    { dob: '2000-07-04', n: 13, label: 'XIII · death' },
    { dob: '1963-06-22', n: 11, label: 'XI · justice' },
    { dob: '1988-08-08', n: 6,  label: 'VI · the lovers' },
  ];
  for (const c of cases) {
    it(`${c.dob} → ${c.label}`, () => {
      const [y, m, d] = c.dob.split('-').map(Number);
      expect(getBirthCardNumber(y, m, d)).toBe(c.n);
      expect(getBirthCard(y, m, d).label).toBe(c.label);
    });
  }
});

describe('birth-card range + fool invariant', () => {
  it('always resolves to a real Major Arcana index 0..21', () => {
    for (let y = 1900; y <= 2030; y += 7) {
      for (let m = 1; m <= 12; m += 3) {
        for (let d = 1; d <= 28; d += 5) {
          const n = getBirthCardNumber(y, m, d);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(21);
          expect(MAJOR_ARCANA[n]).toBeTypeOf('string');
        }
      }
    }
  });

  it('maps a raw reduced-22 to 0 · the fool', () => {
    expect(MAJOR_ARCANA[0]).toBe('the fool');
    let sawTwentyTwo = false;
    const sumDigits = x => String(x).split('').reduce((a, c) => a + (+c), 0);
    for (let y = 1900; y <= 2099; y++) {
      for (let m = 1; m <= 12; m++) {
        for (let d = 1; d <= 28; d++) {
          let raw = sumDigits(y) + sumDigits(m) + sumDigits(d);
          while (raw > 22) raw = sumDigits(raw);
          if (raw === 22) {
            sawTwentyTwo = true;
            expect(getBirthCardNumber(y, m, d)).toBe(0);
          }
        }
      }
    }
    expect(sawTwentyTwo, 'grid should contain at least one raw-22 date').toBe(true);
  });
});

describe('birth-card coordinate format', () => {
  it('label is "ROMAN · name" — numeral + lowercase name, no interpretation', () => {
    const card = getBirthCard(1990, 1, 1);
    expect(card).toMatchObject({ number: 21, roman: 'XXI', name: 'the world' });
    expect(card.label).toBe('XXI · the world');
    expect(card.label).toMatch(/^[IVX0]+ · [a-z ]+$/);
  });

  it('exposes all 22 arcana names', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(MAJOR_ARCANA[0]).toBe('the fool');
    expect(MAJOR_ARCANA[21]).toBe('the world');
  });
});

describe('profile integration (additive field)', () => {
  it('buildProfile carries birthCard without disturbing existing coordinates', () => {
    const p = buildProfile('Test Specimen', '1990-01-01');
    expect(p.birthCard.label).toBe('XXI · the world');
    expect(p.sunSign).toBe('capricorn');
    expect(p.lifePath).toBe(3);
  });
});

describe('render + share wiring (index.html)', () => {
  it('arcana coord-section leads the card (before FIVE-ELEMENT)', () => {
    const arcanaIdx = html.indexOf('id="coord-arcana-symbol"');
    const elementIdx = html.indexOf('id="coord-element-symbol"');
    expect(arcanaIdx).toBeGreaterThan(-1);
    expect(arcanaIdx).toBeLessThan(elementIdx);
  });

  it('arcana row has no locked-extras (free coordinate, no paid layer)', () => {
    const start = html.indexOf('ARCANA');
    const nextSection = html.indexOf('FIVE-ELEMENT');
    const slice = html.slice(start, nextSection);
    expect(slice).not.toContain('locked-extras');
  });

  it('share refs lead with the arcana row (PNG matches free card; per-cell share refs)', () => {
    // share refs are per-row snapshot refs from ui/tiers.js carrying per-cell
    // {state, value} (§5.D v0.39); the arcana row is index 0, its id survives.
    expect(html).toContain('id="coord-arcana-symbol"');
    expect(html).toMatch(/symbols:\s*\[\s*shareTarot/);
  });

  it('render populates the arcana cell from profile.birthCard.label (ui/tiers.js)', () => {
    // The cell fill lives in renderTierSections, which resolves every cell
    // through the shared cellRenderState mapping (§1.J de-fork). Pinned
    // behaviourally rather than by a regex over that module's source: the
    // arcana cell must carry the birth card's own label, and must move when
    // the label does. arcana is in TIER_COORDS.free, so this holds at every
    // tier including free (seal behaviour pinned in tests/tiers.test.js).
    const profile = buildProfile('specimen', '1990-01-01');
    expect(profile.birthCard.label).toBe('XXI · the world');
    expect(cellRenderState(profile, 'arcana', true))
      .toEqual({ state: 'value', text: profile.birthCard.label });
    const moved = buildProfile('specimen', '1969-12-31');
    expect(moved.birthCard.label).not.toBe(profile.birthCard.label);
    expect(cellRenderState(moved, 'arcana', true).text).toBe(moved.birthCard.label);
  });
});
