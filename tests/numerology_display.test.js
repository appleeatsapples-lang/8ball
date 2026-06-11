// 8ball / tests / numerology_display.test.js
//
// v0.3.0 fix A: the numerology triplet on the result card renders as
// space-separated coordinates ("3 8 3"), never concatenated ("383").
// CiC verifier flagged the concatenated form as cognitively reading
// like a single three-digit number rather than the three independent
// numerology coordinates. Lock the always-spaced shape.
//
// v0.6.0: the triplet assembly moved from index.html's formatNumbers
// into ui/tiers.js renderTierSections (DOCTRINE §1.B unchanged; §1.D
// adds a second triplet — personality/birthday/maturity — which
// inherits the same always-spaced rule). Behavior is asserted directly
// against renderTierSections output in tests/tiers.test.js; this file
// pins the source shape so a concat form can't silently return.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initTiersUI, renderTierSections } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('numerology display (v0.3.0 fix A, render moved to ui/tiers.js at v0.6.0)', () => {
  it("triplet rows use .join(' ') — space-separated", () => {
    const joins = tiersJs.match(/\.join\(\s*['"]\s['"]\s*\)/g) || [];
    // Two triplets: life/name/soul (§1.B) + personality/birthday/maturity (§1.D).
    expect(joins.length).toBe(2);
  });

  it("no .join('') — never concatenated", () => {
    expect(tiersJs).not.toMatch(/\.join\(\s*['"]['"]\s*\)/);
    expect(html).not.toMatch(/\.join\(\s*['"]['"]\s*\)/);
  });

  it('the §1.B triplet references all three numerology coordinates', () => {
    expect(tiersJs).toMatch(/profile\.lifePath/);
    expect(tiersJs).toMatch(/profile\.nameNumber/);
    expect(tiersJs).toMatch(/profile\.soulUrge/);
  });

  it('the §1.D second triplet references personality / birthday / maturity', () => {
    expect(tiersJs).toMatch(/profile\.personality/);
    expect(tiersJs).toMatch(/profile\.birthday/);
    expect(tiersJs).toMatch(/profile\.maturity/);
  });

  it('no hasMaster-branched display logic anywhere in the render path', () => {
    // The pre-fix-A body branched on `nums.some(n => n > 9)` to pick
    // between space-join and concat-join. Both branches retired —
    // assert the branch never returns in either render surface.
    expect(tiersJs).not.toMatch(/hasMaster/);
    expect(tiersJs).not.toMatch(/n\s*>\s*9/);
    expect(html).not.toMatch(/hasMaster/);
  });

  it('master numbers render spaced in both triplets (behavioral lock)', () => {
    const rows = {};
    for (const key of ['arcana', 'element', 'sun', 'animal', 'numerology',
      'numbers2', 'dayPillar', 'hourPillar']) {
      const root = { hidden: false };
      rows[key] = { textContent: '—', closest: () => root };
    }
    initTiersUI({
      sunTitle: { textContent: '' },
      animalTitle: { textContent: '' },
      symbols: rows,
    }, {});
    renderTierSections({
      sunSign: 'gemini', risingSign: undefined, chineseElement: 'metal',
      animal: 'horse', innerAnimal: 'rabbit',
      lifePath: 3, nameNumber: 11, soulUrge: 3,
      personality: 22, birthday: 7, maturity: 33,
      birthCard: { label: 'XXI · the world' },
      dayPillar: { animal: 'dragon', stemElement: 'earth' },
      hourPillar: null,
    }, 't2');
    expect(rows.numerology.textContent).toBe('3 11 3');
    expect(rows.numbers2.textContent).toBe('22 7 33');
  });
});
