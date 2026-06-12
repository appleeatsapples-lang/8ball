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
// inherits the same always-spaced rule). v0.7.0: each triplet renders
// as three separate compartment cells (§1.D v0.37), so the numbers can
// no longer concatenate in the DOM at all; the share-PNG join keeps the
// space separator (pinned in tests/tiers.test.js). This file pins the
// source shape so a concat form can't silently return.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initTiersUI, renderTierSections } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('numerology display (v0.3.0 fix A; per-cell compartments at v0.7.0)', () => {
  it('each numerology number renders into its own compartment cell (v0.7.0)', () => {
    for (const key of ['lifePath', 'nameNumber', 'soulUrge',
      'personality', 'birthday', 'maturity']) {
      expect(tiersJs).toMatch(new RegExp(`setCell\\('${key}'`));
    }
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

  it('master numbers render whole in their own cells (behavioral lock)', () => {
    const cells = {};
    for (const key of ['arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
      'lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity',
      'dayPillar', 'hourPillar']) {
      const root = {
        classList: {
          set: new Set(),
          add(c) { this.set.add(c); },
          remove(c) { this.set.delete(c); },
          contains(c) { return this.set.has(c); },
          toggle(c, force) {
            const on = force === undefined ? !this.set.has(c) : !!force;
            if (on) this.set.add(c); else this.set.delete(c);
            return on;
          },
        },
      };
      cells[key] = { textContent: '', closest: sel => (sel === '.coord-cell' ? root : null) };
    }
    initTiersUI({
      sunTitle: { textContent: '' },
      animalTitle: { textContent: '' },
      entry: null,
      cells,
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
    expect(cells.lifePath.textContent).toBe('3');
    expect(cells.nameNumber.textContent).toBe('11');
    expect(cells.soulUrge.textContent).toBe('3');
    expect(cells.personality.textContent).toBe('22');
    expect(cells.birthday.textContent).toBe('7');
    expect(cells.maturity.textContent).toBe('33');
  });
});
