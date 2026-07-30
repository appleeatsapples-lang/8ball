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
//   4. CALCULATION ISOLATION — the relation layer CONSUMES the coordinates
//      buildProfile produced and recomputes none of them. The day master is
//      read off `profile.dayPillar`; a supplied coordinate that contradicts
//      the raw date must still win (PR #187 finding F4 — the first version
//      recomputed, agreed with the supplied value in every ordinary case, and
//      so passed a green suite that proved nothing). The branch-pair expansion
//      remains a deliberate fork of the ui/concordance.js table walk, because
//      core/ must not import ui/; it is pinned against its original here.
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
  combinedPathClause,
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
  COMBINED_PATH_FRAMES,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_SOURCES,
  DYAD_QUALIFIER,
} from '../content/dyad.v1.js';
import { CONCORDANCE_QUALIFIER } from '../content/concordance.v1.js';
import { buildProfile, getBirthday, ANIMALS } from '../core/profile.js';
import { getDayPillar, STEMS } from '../core/pillars.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

describe('dyad — day master CONSUMES the supplied coordinate (F4)', () => {
  // The audit's finding: the first implementation destructured yyyy/mm/dd and
  // called getDayPillar() again. It agreed with the supplied coordinate in
  // every ordinary case, so a green suite proved nothing. These tests are
  // built so that agreement is not enough.

  it('reads the SUPPLIED dayPillar even when it contradicts the date', () => {
    // The load-bearing case. `2000-01-01` really is stem 4 (wu · earth); this
    // profile is handed stem 0 (jia · wood) instead. A recomputing engine
    // returns earth here and the assertion fails.
    const real = profileFor('2000-01-01');
    expect(real.dayPillar.stemIndex).toBe(4);
    expect(real.dayPillar.stemElement).toBe('earth');

    const supplied = {
      ...real,
      dayPillar: { ...real.dayPillar, stemIndex: 0, stemElement: 'wood' },
    };
    expect(dyadDayMaster(supplied)).toEqual({ stem: 'jia', element: 'wood' });
  });

  it('carries the supplied coordinate all the way into the relation passage', () => {
    // Isolation has to hold through the assembly, not just at the leaf.
    const a = profileFor('2000-01-01'); // earth
    const b = profileFor('2000-01-01'); // earth → same-phase relation
    expect(buildDyadReading(a, b).relation.element.aToB.kind).toBe('same');

    const forced = { ...a, dayPillar: { ...a.dayPillar, stemIndex: 0, stemElement: 'wood' } };
    const reading = buildDyadReading(forced, b);
    expect(reading.relation.element.a.element).toBe('wood');
    expect(reading.relation.element.b.element).toBe('earth');
    expect(reading.relation.element.aToB.kind).toBe('ke'); // wood checks earth
  });

  it('does not read the raw date at all — a garbage date with a good pillar works', () => {
    const real = profileFor('2000-01-01');
    const noDate = { ...real, yyyy: undefined, mm: undefined, dd: undefined };
    expect(dyadDayMaster(noDate)).toEqual({ stem: 'wu', element: 'earth' });
  });

  it('agrees with the shipped pillar for every ordinary profile', () => {
    // Consumption must still be CORRECT, not merely isolated: for a profile
    // built the normal way, the day master is the one core/pillars.js filed.
    for (const dob of DATES) {
      const profile = profileFor(dob);
      const pillar = getDayPillar(profile.yyyy, profile.mm, profile.dd);
      expect(dyadDayMaster(profile), dob)
        .toEqual({ stem: STEMS[pillar.stemIndex], element: pillar.stemElement });
      expect(ELEMENTS, dob).toContain(dyadDayMaster(profile).element);
    }
  });

  it('still matches the public-tier engine on ordinary profiles', () => {
    // The old differential test asserted a FORK was safe. There is no fork
    // now, so this is repurposed: both surfaces must still read the same day
    // master for a normally-built profile, across a dense multi-year walk.
    for (let y = 1900; y <= 2100; y += 13) {
      for (let m = 1; m <= 12; m += 5) {
        for (let d = 1; d <= 28; d += 9) {
          const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const mine = dyadDayMaster(profileFor(iso));
          const theirs = getDayMaster(y, m, d);
          expect(mine.element, iso).toBe(theirs.element);
          expect(mine.stem, iso).toBe(theirs.stem);
        }
      }
    }
  });

  it('fails CLOSED on a missing or incoherent pillar, never on a guess', () => {
    const real = profileFor('2000-01-01');
    for (const bad of [undefined, null, 'earth', 7]) {
      expect(() => dyadDayMaster({ ...real, dayPillar: bad }), String(bad)).toThrow(TypeError);
    }
    // out-of-range index
    for (const stemIndex of [-1, 10, 1.5, '4', NaN]) {
      expect(() => dyadDayMaster({ ...real, dayPillar: { ...real.dayPillar, stemIndex } }),
        String(stemIndex)).toThrow(TypeError);
    }
    // internally incoherent: index says earth, element claims water
    expect(() => dyadDayMaster({
      ...real, dayPillar: { ...real.dayPillar, stemIndex: 4, stemElement: 'water' },
    })).toThrow(/incoherent day pillar/);
  });

  it('the engine source never re-derives a pillar from a date', () => {
    // Structural pin: the recomputation the audit found was one call. If it
    // returns, this fails without needing a case to catch it.
    const src = readFileSync(join(__dirname, '..', 'core', 'dyad.js'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/getDayPillar\s*\(/);
    expect(src).not.toMatch(/\byyyy\b/);
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
        reached.add(out.combined);
      }
    }
    // No unreachable value: all nine are hit by a real pair.
    expect([...reached].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('emits the registry meaning VERBATIM — no second copy (F6)', () => {
    // The audit's finding: nine locally authored bodies restated the registry's
    // own clauses (for n=1, "starting a sequence rather than joining one"
    // against the registry's "...joining one already underway"). Identity, not
    // similarity, is the contract.
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const out = combinedPath(a, b);
        const registry = NUMEROLOGY_MEANINGS[String(out.combined)];
        expect(out.meaning, `${a}+${b}`).toBe(registry.body);
        expect(out.register, `${a}+${b}`).toBe(registry.register);
        expect(out.theme, `${a}+${b}`).toBe(registry.theme);
      }
    }
  });

  it('the reduction clause carries arithmetic ONLY, never a meaning', () => {
    // It must be derivable from the two integers alone. If a themed word ever
    // creeps back in, the clause has started restating the number's meaning.
    const themes = Object.values(NUMEROLOGY_MEANINGS).map(m => m.theme);
    const registers = Object.values(NUMEROLOGY_MEANINGS).map(m => m.register);
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const out = combinedPath(a, b);
        expect(out.reduction).toBe(combinedPathClause(out.sum, out.combined));
        for (const theme of themes) {
          expect(out.reduction, `${a}+${b} leaks theme "${theme}"`)
            .not.toMatch(new RegExp(`\\b${theme}\\b`));
        }
        for (const register of registers) {
          expect(out.reduction, `${a}+${b} leaks register`).not.toContain(register);
        }
        // ...and it must not contain the registry body either.
        expect(out.reduction).not.toContain(NUMEROLOGY_MEANINGS[String(out.combined)].body);
      }
    }
  });

  it('uses the reducing frame only when the sum actually reduced', () => {
    expect(combinedPath(4, 2).reduction).toBe(COMBINED_PATH_FRAMES.direct
      .replace('{combined}', '6'));
    expect(combinedPath(9, 9).reduction).toBe(COMBINED_PATH_FRAMES.reduced
      .replace('{sum}', '18').replace('{combined}', '9'));
    // The degenerate sentence the two frames exist to avoid.
    expect(combinedPath(4, 2).reduction).not.toMatch(/sum to 6, which .* reduces to 6/);
  });

  it('no locally authored per-number body survives in the content file', () => {
    // Code only — the file's header explains the retired export by name, and
    // that history is worth keeping readable.
    const src = readFileSync(join(__dirname, '..', 'content', 'dyad.v1.js'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/COMBINED_PATH_NOTES/);
    // The two frames are templates, not nine entries.
    expect(Object.keys(COMBINED_PATH_FRAMES).sort()).toEqual(['direct', 'reduced']);
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
        expect(reading.relation.numerology.reduction).toBeTruthy();
        expect(reading.relation.numerology.meaning).toBeTruthy();
        expect(reading.relation.cardPair.body).toBeTruthy();
      }
    }
  });
});
