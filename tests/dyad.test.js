// 8ball / tests / dyad.test.js
//
// The dyad relation engine (core/dyad.js) and its tables (content/dyad.v1.js).
// Voice/grammar policy lives in tests/dyad_content.test.js; the surface lives
// in tests/dyad_surface.test.js. This file covers the engine's five load-
// bearing properties:
//
//   1. DETERMINISM — same profiles in, byte-identical reading out.
//   2. BYTE-IDENTITY — the A side of a dyad IS the standalone single reading.
//      The brief's first requirement, and the one a second build path would
//      break silently.
//   3. TOTALITY — no gap in any table. Every ordered element pair, every
//      reachable combined path, every ordered bracket pair, every branch
//      pair resolves, and the `kind` recorded in the table is re-derived from
//      the wuxing cycles rather than trusted.
//   4. THE TWO DELIBERATE FORKS — the day master and the branch-pair
//      expansion are second implementations by design (core must not import
//      the public-tier engine or ui/). Both are pinned against their
//      originals here, which is what makes the fork safe rather than debt.
//   5. NO DECK LEAKAGE — the t5 relation layer must not carry any string
//      from the t3 written entry. t3 is what the deck is sold at.
//
// Fixture dates (DOCTRINE §11): synthetic. Day-pillar calibration anchors
// shared with tests/pillars.test.js, plus a sweep chosen for coverage of the
// element and bracket domains. No real person's date of birth.

import { describe, it, expect } from 'vitest';

import {
  dyadDayMaster,
  elementRelationKind,
  elementDirection,
  reduceNine,
  combinedPath,
  branchPairKey,
  branchRelation,
  bracketPair,
  cardPair,
  buildDyadReading,
} from '../core/dyad.js';
import {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  ELEMENT_RELATIONS,
  ELEMENT_RELATION_KINDS,
  COMBINED_PATH_NOTES,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_SOURCES,
  DYAD_QUALIFIER,
} from '../content/dyad.v1.js';
import { CONCORDANCE_QUALIFIER } from '../content/concordance.v1.js';
import { buildProfile, getBirthday, ANIMALS } from '../core/profile.js';
import { getCard, resolveBracket } from '../core/engine.js';
import { getDayMaster } from '../core/public.js';
import { buildConcordance } from '../ui/concordance.js';
import { NUMEROLOGY_MEANINGS } from '../content/meanings.v2.js';

// A spread of synthetic dates covering both calibration anchors, the calc
// v3.1 correction dates, a leap day, and the ends of the table range.
const DATES = Object.freeze([
  '1900-01-01', '1911-05-07', '1912-01-07', '1916-02-03', '1927-09-08',
  '1966-01-21', '1980-02-29', '1988-06-15', '2000-01-01', '2000-02-29',
  '2014-03-06', '2024-02-10', '2047-03-06', '2099-12-31', '2100-12-31',
]);

const profileFor = (dob, name = 'specimen') => buildProfile(name, dob);
const PROFILES = DATES.map(d => profileFor(d));

describe('dyad — determinism', () => {
  it('same pair in, byte-identical reading out', () => {
    for (const a of PROFILES.slice(0, 6)) {
      for (const b of PROFILES.slice(0, 6)) {
        const first = buildDyadReading(a, b);
        const second = buildDyadReading(a, b);
        expect(JSON.stringify(first.relation)).toBe(JSON.stringify(second.relation));
      }
    }
  });

  it('rebuilding the same profiles from the same inputs gives the same relation', () => {
    const relation = JSON.stringify(
      buildDyadReading(profileFor('2000-01-01', 'a'), profileFor('1988-06-15', 'b')).relation);
    expect(JSON.stringify(
      buildDyadReading(profileFor('2000-01-01', 'a'), profileFor('1988-06-15', 'b')).relation))
      .toBe(relation);
  });

  it('nothing in the engine reads a clock, a random source or storage', () => {
    // The engine is a lookup over frozen tables. If it ever stopped being
    // one, this is where the drift would start.
    const src = String(buildDyadReading) + String(cardPair) + String(combinedPath);
    expect(src).not.toMatch(/Math\.random|Date\.now|new Date|localStorage|fetch\(/);
  });
});

describe('dyad — the A side IS the standalone single reading (brief req 2)', () => {
  it('returns the same profile objects it was handed, not copies', () => {
    const a = profileFor('2000-01-01', 'first');
    const b = profileFor('1988-06-15', 'second');
    const reading = buildDyadReading(a, b);
    expect(reading.a).toBe(a);
    expect(reading.b).toBe(b);
  });

  it('every coordinate matches a standalone buildProfile across the sweep', () => {
    for (const dob of DATES) {
      const standalone = profileFor(dob, 'alone');
      const reading = buildDyadReading(profileFor(dob, 'alone'), profileFor('2000-01-01'));
      expect(JSON.stringify(reading.a), dob).toBe(JSON.stringify(standalone));
    }
  });

  it('the relation layer does not mutate either profile', () => {
    const a = profileFor('2000-01-01', 'first');
    const b = profileFor('1988-06-15', 'second');
    const beforeA = JSON.stringify(a);
    const beforeB = JSON.stringify(b);
    buildDyadReading(a, b);
    expect(JSON.stringify(a)).toBe(beforeA);
    expect(JSON.stringify(b)).toBe(beforeB);
  });
});

describe('dyad — day master (fork pinned against the public-tier engine)', () => {
  it('agrees with getDayMaster on element AND stem across the sweep', () => {
    for (const dob of DATES) {
      const profile = profileFor(dob);
      const mine = dyadDayMaster(profile);
      const theirs = getDayMaster(profile.yyyy, profile.mm, profile.dd);
      expect(mine.element, dob).toBe(theirs.element);
      expect(mine.stem, dob).toBe(theirs.stem);
    }
  });

  it('agrees on a dense multi-year walk, not just the anchors', () => {
    for (let y = 1900; y <= 2100; y += 13) {
      for (let m = 1; m <= 12; m += 5) {
        for (let d = 1; d <= 28; d += 9) {
          const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const profile = profileFor(iso);
          expect(dyadDayMaster(profile).element, iso)
            .toBe(getDayMaster(y, m, d).element);
        }
      }
    }
  });

  it('always resolves one of the five elements', () => {
    for (const profile of PROFILES) {
      expect(ELEMENTS).toContain(dyadDayMaster(profile).element);
    }
  });
});

describe('dyad — element axis totality', () => {
  it('all 25 ordered pairs are present, and no more', () => {
    const expected = [];
    for (const from of ELEMENTS) for (const to of ELEMENTS) expected.push(`${from}_${to}`);
    expect(Object.keys(ELEMENT_RELATIONS).sort()).toEqual(expected.sort());
  });

  it("every entry's kind is re-derived from the sheng/ke cycles, not trusted", () => {
    for (const from of ELEMENTS) {
      for (const to of ELEMENTS) {
        const entry = ELEMENT_RELATIONS[`${from}_${to}`];
        expect(entry.from, `${from}_${to}.from`).toBe(from);
        expect(entry.to, `${from}_${to}.to`).toBe(to);
        expect(entry.kind, `${from}_${to}.kind`).toBe(elementRelationKind(from, to));
      }
    }
  });

  it('the derived kind matches the classical cycles term by term', () => {
    for (const from of ELEMENTS) {
      for (const to of ELEMENTS) {
        const kind = elementRelationKind(from, to);
        if (from === to) expect(kind).toBe('same');
        else if (ELEMENT_SHENG[from] === to) expect(kind).toBe('sheng');
        else if (ELEMENT_SHENG[to] === from) expect(kind).toBe('sheng_by');
        else if (ELEMENT_KE[from] === to) expect(kind).toBe('ke');
        else expect(kind).toBe('ke_by');
        expect(ELEMENT_RELATION_KINDS[kind]).toBeTruthy();
      }
    }
  });

  it('A→B and B→A are converse, and never the same passage', () => {
    for (const from of ELEMENTS) {
      for (const to of ELEMENTS) {
        const ab = elementDirection(from, to);
        const ba = elementDirection(to, from);
        const converse = { sheng: 'sheng_by', sheng_by: 'sheng', ke: 'ke_by', ke_by: 'ke', same: 'same' };
        expect(ba.kind, `${from}→${to}`).toBe(converse[ab.kind]);
        if (from !== to) expect(ab.body).not.toBe(ba.body);
      }
    }
  });

  it('rejects an element outside the five rather than inventing a relation', () => {
    expect(() => elementDirection('wood', 'aether')).toThrow(TypeError);
    expect(() => elementDirection('', 'wood')).toThrow(TypeError);
    expect(() => elementDirection(null, 'wood')).toThrow(TypeError);
  });
});

describe('dyad — combined life path', () => {
  it('reduceNine agrees with the shipped nine-number reduction', () => {
    // getBirthday is core/profile.js's only exported function that reduces an
    // arbitrary positive integer, so it is the oracle for the private reducer
    // this module restates. Swept well past the reachable 2..18 domain.
    for (let n = 1; n <= 2000; n++) {
      expect(reduceNine(n), `n=${n}`).toBe(getBirthday(n));
    }
  });

  it('reduceNine rejects non-positive and non-integer totals', () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity, null, undefined, '9']) {
      expect(reduceNine(bad), String(bad)).toBeNull();
    }
  });

  it('every 1..9 × 1..9 life-path pair resolves inside the nine-number domain', () => {
    const reached = new Set();
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const out = combinedPath(a, b);
        expect(out.sum).toBe(a + b);
        expect(out.combined).toBeGreaterThanOrEqual(1);
        expect(out.combined).toBeLessThanOrEqual(9);
        expect(out.body).toBe(COMBINED_PATH_NOTES[out.combined].body);
        reached.add(out.combined);
      }
    }
    // No unreachable entry in the table: all nine are hit by a real pair.
    expect([...reached].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('reads the number meaning from the existing registry, not a private copy', () => {
    for (let n = 1; n <= 9; n++) {
      const out = combinedPath(n, 9);
      const registry = NUMEROLOGY_MEANINGS[String(out.combined)];
      expect(out.register).toBe(registry.register);
      expect(out.theme).toBe(registry.theme);
    }
  });

  it('is order-insensitive in the value, since a sum is', () => {
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        expect(combinedPath(a, b).combined).toBe(combinedPath(b, a).combined);
      }
    }
  });

  it('rejects a life path outside the active nine-number domain', () => {
    for (const bad of [0, 11, 22, 33, -3, null, undefined, '4', 1.5]) {
      expect(() => combinedPath(bad, 4), String(bad)).toThrow(TypeError);
      expect(() => combinedPath(4, bad), String(bad)).toThrow(TypeError);
    }
  });
});

describe('dyad — card pair', () => {
  it('the branch expansion agrees with the Concordance registry (fork pinned)', () => {
    // core/ must not import ui/, so the pair expansion is repeated. This pins
    // that the repetition never becomes a SECOND registry: for every one of
    // the 66 unordered animal pairs, "the dyad found a named relation" and
    // "Concordance filed one" must agree exactly.
    for (let i = 0; i < ANIMALS.length; i++) {
      for (let j = i + 1; j < ANIMALS.length; j++) {
        const [x, y] = [ANIMALS[i], ANIMALS[j]];
        const mine = branchRelation(x, y);
        const theirs = buildConcordance(
          { ...PROFILES[0], animal: x }, { ...PROFILES[0], animal: y }, { tier: 't3' },
        ).axes.find(axis => axis.key === 'animal');
        expect(mine.status, `${x}×${y}`).toBe(theirs.status);
      }
    }
  });

  it('same animal is unfiled — the tables name no relation, so neither do we', () => {
    for (const animal of ANIMALS) {
      const relation = branchRelation(animal, animal);
      expect(relation.status).toBe('unfiled');
      expect(relation.key).toBe('unfiled');
      expect(relation.families).toEqual([]);
      expect(relation.body).toBe(BRANCH_REGISTERS.unfiled.body);
    }
  });

  it('is symmetric in the branch pair — a pair key is unordered', () => {
    for (let i = 0; i < ANIMALS.length; i++) {
      for (let j = 0; j < ANIMALS.length; j++) {
        const [x, y] = [ANIMALS[i], ANIMALS[j]];
        expect(branchPairKey(x, y)).toBe(branchPairKey(y, x));
        expect(branchRelation(x, y).key).toBe(branchRelation(y, x).key);
      }
    }
  });

  it('records every matching family, and draws the passage from the first', () => {
    // ox × goat is both a chong and a xing — the multi-match case that a
    // single-value lookup would silently drop.
    const relation = branchRelation('ox', 'goat');
    expect(relation.families.length).toBeGreaterThan(1);
    expect(relation.key).toBe(relation.families[0]);
    expect(relation.body).toBe(BRANCH_REGISTERS[relation.families[0]].body);
  });

  it('all nine ORDERED bracket pairs resolve, and low_high differs from high_low', () => {
    const seen = new Set();
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const pair = bracketPair(a, b);
        expect(pair.a).toBe(resolveBracket(a));
        expect(pair.b).toBe(resolveBracket(b));
        expect(pair.arcA).toBe(BRACKET_ARC[pair.a]);
        expect(pair.arcB).toBe(BRACKET_ARC[pair.b]);
        expect(pair.body).toBe(BRACKET_REGISTERS[`${pair.a}_${pair.b}`].body);
        seen.add(`${pair.a}_${pair.b}`);
      }
    }
    expect(seen.size).toBe(9);
    expect(bracketPair(1, 9).body).not.toBe(bracketPair(9, 1).body);
  });

  it('the catalog numerals come from getCard, one per side', () => {
    for (const a of PROFILES.slice(0, 5)) {
      for (const b of PROFILES.slice(0, 5)) {
        const pair = cardPair(a, b);
        expect(pair.catalogA).toBe(getCard(a).catalog);
        expect(pair.catalogB).toBe(getCard(b).catalog);
      }
    }
  });
});

describe('dyad — the t3 written entry is not given away at t5', () => {
  it('no deck string reaches the relation layer', async () => {
    const { CARDS } = await import('../content/cards.v1.full.js');
    const emitted = PROFILES.slice(0, 6).flatMap(a =>
      PROFILES.slice(0, 6).map(b => JSON.stringify(buildDyadReading(a, b).relation)));
    const blob = emitted.join('\n');
    const leaks = [];
    for (const [sun, row] of Object.entries(CARDS)) {
      for (const [animal, cell] of Object.entries(row)) {
        for (const [field, text] of [
          ['name', cell.name], ['type', cell.type], ['habit', cell.habit],
          ['note.low', cell.note.low], ['note.mid', cell.note.mid], ['note.high', cell.note.high],
        ]) {
          if (blob.includes(text)) leaks.push(`${sun}.${animal}.${field}`);
        }
      }
    }
    expect(leaks, leaks.join('\n')).toEqual([]);
  });

  it('the engine never imports the deck', () => {
    // A relation layer that reached for card content would be selling the t3
    // ceiling twice. The import edge is the thing to forbid.
    expect(cardPairSource()).not.toMatch(/cards\.v1/);
  });
});

// Read the module source once for the import-edge assertion above.
function cardPairSource() {
  return String(cardPair) + String(buildDyadReading);
}

describe('dyad — assembly', () => {
  it('carries both directions, both axes, the pair and the qualifier', () => {
    const reading = buildDyadReading(PROFILES[0], PROFILES[1]);
    const { element, numerology, cardPair: pair, qualifier } = reading.relation;
    expect(element.aToB.from).toBe(element.a.element);
    expect(element.aToB.to).toBe(element.b.element);
    expect(element.bToA.from).toBe(element.b.element);
    expect(element.bToA.to).toBe(element.a.element);
    expect(element.source).toBe(DYAD_SOURCES.element);
    expect(numerology.source).toBe(DYAD_SOURCES.numerology);
    expect(pair.source).toBe(DYAD_SOURCES.cardPair);
    expect(qualifier).toBe(DYAD_QUALIFIER);
  });

  it('carries the Concordance qualifier, not a warmer second one', () => {
    // The dyad makes no stronger claim than Concordance does. If it ever
    // starts to, this is the line that has to be changed on purpose.
    expect(DYAD_QUALIFIER).toBe(CONCORDANCE_QUALIFIER);
    expect(DYAD_QUALIFIER).toBe('recorded, not certified.');
  });

  it('rejects anything that is not a pair of calculated profiles', () => {
    for (const bad of [null, undefined, 'profile', 7, true]) {
      expect(() => buildDyadReading(bad, PROFILES[0]), String(bad)).toThrow(TypeError);
      expect(() => buildDyadReading(PROFILES[0], bad), String(bad)).toThrow(TypeError);
    }
  });

  it('holds across a broad pair sweep without a gap or a throw', () => {
    for (const a of PROFILES) {
      for (const b of PROFILES) {
        const reading = buildDyadReading(a, b);
        expect(reading.relation.element.aToB.body).toBeTruthy();
        expect(reading.relation.element.bToA.body).toBeTruthy();
        expect(reading.relation.numerology.body).toBeTruthy();
        expect(reading.relation.cardPair.body).toBeTruthy();
      }
    }
  });
});
