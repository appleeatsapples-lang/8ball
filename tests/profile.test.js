// 8ball / tests / profile.test.js
// Run with: npm test
//
// Suites:
//  1. Calculation contract — fixtures.json must match core/profile.js exactly.
//     If a fixture fails, either the algorithm changed (intentional → update fixture
//     + bump the calc-version note in DOCTRINE.md) or it broke (unintentional → fix code).
//  2. Engine — getCard pipeline against the 144 positional catalog cells
//     (12 sun-rows × 12 animals; engine computes catalog index without any
//     card-content import), plus resolveBracket direct cases.
//  3. Banned-pattern + banned-voice-register policy — constants and scans
//     live here against the shipped CARDS pool in content/cards.v1.full.js
//     so doctrine, deck shape, and policy enforcement stay co-located.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  buildProfile,
  getBirthday,
  getMaturity, getMaturitySum,
  getNameNumber, getNameNumberSum,
  getPersonality, getPersonalitySum,
  getSunSign,
  getAnimal,
  getInnerAnimal,
  getChineseElement,
  getLifePath, getLifePathSum,
  getSoulUrge, getSoulUrgeSum
} from '../core/profile.js';
import { getCard, resolveBracket, MissingCardError } from '../core/engine.js';
import { lunarNewYearDate, monthAnimalSolarTerm } from '../core/calendar.js';
import { CARDS } from '../content/cards.v1.full.js';
// Canonical §2/§4 voice-policy tables + the canonical substring matcher and
// framing patterns. Live in a plain helper (not this file) so the other
// policy scans can import them without re-running this suite — see
// tests/helpers/voice-register.js.
import {
  BANNED_PATTERNS,
  DIAGNOSTIC_FRAMING_RE,
  SECOND_PERSON_RE,
  voiceRegisterHits,
} from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

describe('calculation contract', () => {
  for (const c of fixtures.cases) {
    it(c.label, () => {
      const p = buildProfile('Test', c.dob);
      for (const [key, val] of Object.entries(c.expected)) {
        expect(p[key], `${c.label}: ${key}`).toBe(val);
      }
    });
  }

  for (const c of fixtures.name_number) {
    it(`name number: ${JSON.stringify(c.name)} → ${c.expected}`, () => {
      expect(getNameNumber(c.name)).toBe(c.expected);
    });
  }

  it('rejects malformed DOB (message-pinned)', () => {
    expect(() => buildProfile('x', 'bad-date')).toThrow(/DOB must be YYYY-MM-DD/);
    expect(() => buildProfile('x', '2020-13-01')).toThrow(/DOB out of range/); // bad month
    expect(() => buildProfile('x', '2020-01-32')).toThrow(/DOB out of range/); // day > 31
  });

  it('rejects impossible day-of-month (Feb 30, Apr 31, Feb 29 non-leap) with the range message', () => {
    // Message-pinned (per Grok P3): a wrong throw TYPE must not pass — every
    // impossible-day case throws the same `DOB out of range` as the d>31 guard.
    expect(() => buildProfile('x', '2000-02-30')).toThrow(/DOB out of range/); // Feb never has 30
    expect(() => buildProfile('x', '2000-04-31')).toThrow(/DOB out of range/); // Apr has 30
    expect(() => buildProfile('x', '2000-06-31')).toThrow(/DOB out of range/); // Jun has 30
    expect(() => buildProfile('x', '2000-09-31')).toThrow(/DOB out of range/); // Sep has 30
    expect(() => buildProfile('x', '2000-11-31')).toThrow(/DOB out of range/); // Nov has 30 (4th 30-day month)
    expect(() => buildProfile('x', '2001-02-29')).toThrow(/DOB out of range/); // 2001 not leap
    expect(() => buildProfile('x', '1900-02-29')).toThrow(/DOB out of range/); // 1900 not leap (÷100, ¬÷400)
  });

  it('accepts real boundary dates including leap-day Feb 29', () => {
    expect(() => buildProfile('x', '2000-02-29')).not.toThrow(); // 2000 leap (÷400)
    expect(() => buildProfile('x', '2004-02-29')).not.toThrow(); // 2004 leap
    expect(() => buildProfile('x', '2000-02-28')).not.toThrow(); // Feb 28 always valid
    expect(() => buildProfile('x', '1900-02-28')).not.toThrow(); // century non-leap, Feb 28 valid
    expect(() => buildProfile('x', '2000-04-30')).not.toThrow(); // Apr 30 valid
    expect(() => buildProfile('x', '2000-01-31')).not.toThrow(); // Jan 31 valid
  });
});

describe('calculation contract — 2F-3 additive fields', () => {
  // Chinese element: 5-element 2-year cycle, anchored at 1924 = wood.
  // Each element holds for 2 years; full element cycle = 10 years; combined
  // with 12-animal cycle = 60-year sexagenary cycle.
  it('chinese element 1924 → wood (anchor year)', () => {
    expect(getChineseElement(1924, 6, 15)).toBe('wood');
  });
  it('chinese element 1996 → fire', () => {
    expect(getChineseElement(1996, 9, 23)).toBe('fire');
  });
  it('chinese element 2020 → metal', () => {
    expect(getChineseElement(2020, 5, 1)).toBe('metal');
  });
  it('chinese element 2024 → wood (cycle restart)', () => {
    expect(getChineseElement(2024, 6, 1)).toBe('wood');
  });
  it('chinese element pre-LNY 1996 (Jan 15) → wood (resolves to 1995)', () => {
    expect(getChineseElement(1996, 1, 15)).toBe('wood');
  });
  it('chinese element pre-LNY 1996 (Feb 4) → wood (resolves to 1995, was \'fire\' under v1 Feb-4-cutoff bug; LNY 1996 = Feb 19)', () => {
    expect(getChineseElement(1996, 2, 4)).toBe('wood');
  });

  // Inner animal (month-pillar). Twelve solar-term-anchored windows;
  // calc v2 looks up actual jieqi dates for the given year via
  // monthAnimalSolarTerm. Tests anchor at year 1985 (per the v0.2.7.1
  // brief) where most boundaries land at simple integer days; some
  // assertions differ from v1 by 1 day where v1's fixed-date cutoff
  // was off (e.g. jingzhe 1985 = Mar 5, not Mar 6).
  it('inner animal: tiger month (lichun 1985 = Feb 4)', () => {
    expect(getInnerAnimal(1985, 2, 4)).toBe('tiger');
    expect(getInnerAnimal(1985, 2, 3)).toBe('ox');
    expect(getInnerAnimal(1985, 3, 4)).toBe('tiger');
    // Mar 5 1985 is jingzhe → rabbit (was 'tiger' under v1 Mar-6 cutoff bug).
    expect(getInnerAnimal(1985, 3, 5)).toBe('rabbit');
  });
  it('inner animal: rabbit month (jingzhe 1985 = Mar 5)', () => {
    expect(getInnerAnimal(1985, 3, 5)).toBe('rabbit');
    expect(getInnerAnimal(1985, 4, 4)).toBe('rabbit');
  });
  it('inner animal: dragon month (qingming 1985 = Apr 5)', () => {
    expect(getInnerAnimal(1985, 4, 5)).toBe('dragon');
    expect(getInnerAnimal(1985, 5, 4)).toBe('dragon');
  });
  it('inner animal: snake month (lixia 1985 = May 5)', () => {
    expect(getInnerAnimal(1985, 5, 5)).toBe('snake');
    expect(getInnerAnimal(1985, 5, 6)).toBe('snake');
  });
  it('inner animal: horse month (mangzhong 1985 = Jun 6)', () => {
    expect(getInnerAnimal(1985, 6, 6)).toBe('horse');
    expect(getInnerAnimal(1985, 6, 5)).toBe('snake');
  });
  it('inner animal: goat month (xiaoshu 1985 = Jul 7)', () => {
    expect(getInnerAnimal(1985, 7, 7)).toBe('goat');
    expect(getInnerAnimal(1985, 7, 6)).toBe('horse');
  });
  it('inner animal: monkey month (liqiu 1985 = Aug 7)', () => {
    expect(getInnerAnimal(1985, 8, 7)).toBe('monkey');
    expect(getInnerAnimal(1985, 9, 7)).toBe('monkey');
  });
  it('inner animal: rooster month (bailu 1985 = Sep 8)', () => {
    expect(getInnerAnimal(1985, 9, 8)).toBe('rooster');
    expect(getInnerAnimal(1985, 9, 23)).toBe('rooster');
  });
  it('inner animal: dog month (hanlu 1985 = Oct 8)', () => {
    expect(getInnerAnimal(1985, 10, 8)).toBe('dog');
    expect(getInnerAnimal(1985, 10, 7)).toBe('rooster');
  });
  it('inner animal: pig month (lidong 1985 = Nov 7)', () => {
    expect(getInnerAnimal(1985, 11, 7)).toBe('pig');
    expect(getInnerAnimal(1985, 12, 6)).toBe('pig');
  });
  it('inner animal: rat month (daxue 1985 = Dec 7, wraps year)', () => {
    expect(getInnerAnimal(1985, 12, 7)).toBe('rat');
    expect(getInnerAnimal(1985, 12, 31)).toBe('rat');
    // Year-wrap: Jan 1-4 of the FOLLOWING year is still in 1985's rat window
    // (rat extends until xiaohan of next year). getInnerAnimal(1986, 1, 4)
    // hits the previous-year-rat fallthrough rule.
    expect(getInnerAnimal(1986, 1, 4)).toBe('rat');
  });
  it('inner animal: ox month (xiaohan 1985 = Jan 5)', () => {
    expect(getInnerAnimal(1985, 1, 5)).toBe('ox');
    expect(getInnerAnimal(1985, 2, 3)).toBe('ox');
    // Jan 1-4 of `year` is before xiaohan(`year`) — falls into previous
    // year's rat window per the year-wrap fallthrough.
    expect(getInnerAnimal(1985, 1, 4)).toBe('rat');
  });

  // Soul urge: vowel sum, Pythagorean values, reduced (master 11/22/33 preserved).
  it('soul urge of empty name → 0', () => {
    expect(getSoulUrge('')).toBe(0);
    expect(getSoulUrgeSum('')).toBe(0);
  });
  it('soul urge of "Alex Thomas" → 4 (sum 13, vowels A+E+O+A = 1+5+6+1)', () => {
    expect(getSoulUrgeSum('Alex Thomas')).toBe(13);
    expect(getSoulUrge('Alex Thomas')).toBe(4);
  });
  it('soul urge preserves master number 11 (vowels of "Aida" = A+I+A = 1+9+1)', () => {
    expect(getSoulUrgeSum('Aida')).toBe(11);
    expect(getSoulUrge('Aida')).toBe(11);
  });
  it('soul urge preserves master number 22 ("Aria Stone" vowels A+I+A+O+E = 1+9+1+6+5)', () => {
    expect(getSoulUrgeSum('Aria Stone')).toBe(22);
    expect(getSoulUrge('Aria Stone')).toBe(22);
  });
  it('soul urge ignores non-letters and consonants', () => {
    expect(getSoulUrgeSum('xyz!')).toBe(0);
    expect(getSoulUrgeSum('123 a')).toBe(1);
  });

  // Unreduced sums are exposed for trail display in the UI surface.
  // The reduced versions remain the canonical numerology output.
  it('lifePathSum 1988-08-15 → 40, reduces to 4', () => {
    expect(getLifePathSum(1988, 8, 15)).toBe(40);
    expect(getLifePath(1988, 8, 15)).toBe(4);
  });
  it('nameNumberSum "Alex Thomas" → 37, reduces to 1', () => {
    expect(getNameNumberSum('Alex Thomas')).toBe(37);
    expect(getNameNumber('Alex Thomas')).toBe(1);
  });

  // buildProfile returns all calibrated outputs + their unreduced sums.
  it('buildProfile includes all 2F-3 fields (synthetic profile)', () => {
    const p = buildProfile('Alex Thomas', '1988-08-15');
    expect(p.sunSign).toBe('leo');
    expect(p.chineseElement).toBe('earth');
    expect(p.animal).toBe('dragon');
    expect(p.innerAnimal).toBe('monkey');
    expect(p.lifePath).toBe(4);
    expect(p.lifePathSum).toBe(40);
    expect(p.nameNumber).toBe(1);
    expect(p.nameNumberSum).toBe(37);
    expect(p.soulUrge).toBe(4);
    expect(p.soulUrgeSum).toBe(13);
  });

  it('buildProfile without rising opts preserves existing output shape and omits risingSign', () => {
    const p = buildProfile('Alex Thomas', '1988-08-15');
    expect({
      name: p.name,
      firstName: p.firstName,
      sunSign: p.sunSign,
      chineseElement: p.chineseElement,
      animal: p.animal,
      innerAnimal: p.innerAnimal,
      lifePath: p.lifePath,
      lifePathSum: p.lifePathSum,
      nameNumber: p.nameNumber,
      nameNumberSum: p.nameNumberSum,
      soulUrge: p.soulUrge,
      soulUrgeSum: p.soulUrgeSum,
      yyyy: p.yyyy,
      mm: p.mm,
      dd: p.dd
    }).toEqual({
      name: 'Alex Thomas',
      firstName: 'Alex',
      sunSign: 'leo',
      chineseElement: 'earth',
      animal: 'dragon',
      innerAnimal: 'monkey',
      lifePath: 4,
      lifePathSum: 40,
      nameNumber: 1,
      nameNumberSum: 37,
      soulUrge: 4,
      soulUrgeSum: 13,
      yyyy: 1988,
      mm: 8,
      dd: 15
    });
    expect(p.risingSign).toBeUndefined();
  });
});

describe('calculation contract — 2G-2 additive fields', () => {
  it('getPersonality: empty input', () => {
    expect(getPersonality('')).toBe(0);
    expect(getPersonalitySum('')).toBe(0);
  });

  it('getPersonality: simple consonants-only sum', () => {
    // "Alex Thomas": consonants l-x-t-h-m-s -> 3+6+2+8+4+1 = 24 -> 6
    expect(getPersonalitySum('Alex Thomas')).toBe(24);
    expect(getPersonality('Alex Thomas')).toBe(6);
  });

  it('getPersonality: master-number preservation', () => {
    expect(getPersonalitySum('Hal')).toBe(11);
    expect(getPersonality('Hal')).toBe(11);
  });

  it('getPersonality: ignores non-letters', () => {
    // x=6, y=7, z=8; punctuation skipped.
    expect(getPersonalitySum('xyz!')).toBe(21);
    expect(getPersonality('xyz!')).toBe(3);
  });

  it('getBirthday: single-digit days pass through', () => {
    expect(getBirthday(7)).toBe(7);
    expect(getBirthday(1)).toBe(1);
  });

  it('getBirthday: 31 reduces to 4', () => {
    expect(getBirthday(31)).toBe(4);
  });

  it('getBirthday: master days preserved', () => {
    expect(getBirthday(11)).toBe(11);
    expect(getBirthday(22)).toBe(22);
  });

  it('getBirthday: 29 reduces to 11 (master)', () => {
    expect(getBirthday(29)).toBe(11);
  });

  it('getMaturity: sums the reduced life path + reduced name number', () => {
    // Alex Thomas, 1996-04-01: lifePath reduces to 3, nameNumber to 1.
    expect(getLifePath(1996, 4, 1)).toBe(3);
    expect(getNameNumber('Alex Thomas')).toBe(1);
    expect(getMaturitySum(1996, 4, 1, 'Alex Thomas')).toBe(4);
    expect(getMaturity(1996, 4, 1, 'Alex Thomas')).toBe(4);
  });

  it('getMaturity: master-number preservation (both components master)', () => {
    // Ann, 1970-01-04: lifePath reduces to 22, nameNumber to 11 — both
    // master numbers, and 22 + 11 = 33 is itself a master number that
    // needs no further reduction.
    expect(getLifePath(1970, 1, 4)).toBe(22);
    expect(getNameNumber('Ann')).toBe(11);
    expect(getMaturitySum(1970, 1, 4, 'Ann')).toBe(33);
    expect(getMaturity(1970, 1, 4, 'Ann')).toBe(33);
  });

  it('getMaturity: does not fabricate a master number from unreduced sums', () => {
    // Bob, 1970-01-01: raw life-path digit sum is 19 and raw name-number
    // sum is 10 — 19 + 10 = 29 reduces through 11 if summed unreduced,
    // which is the bug this fix closes. The standard method reduces each
    // component first (both land on plain 1) and never sees a master
    // number here at all.
    expect(getLifePath(1970, 1, 1)).toBe(1);
    expect(getNameNumber('Bob')).toBe(1);
    expect(getMaturitySum(1970, 1, 1, 'Bob')).toBe(2);
    expect(getMaturity(1970, 1, 1, 'Bob')).toBe(2);
  });

  it('buildProfile: exposes new 2G-2 fields', () => {
    const p = buildProfile('Alex Thomas', '1996-04-01');
    expect(p.personality).toBe(6);
    expect(p.personalitySum).toBe(24);
    expect(p.birthday).toBe(1);
    expect(p.maturity).toBe(4);
    expect(p.maturitySum).toBe(4);
  });
});

describe('engine — resolveBracket', () => {
  for (const c of fixtures.brackets) {
    it(`LP ${c.lp} → ${c.expected}`, () => {
      expect(resolveBracket(c.lp)).toBe(c.expected);
    });
  }

  it('throws on unknown LP value', () => {
    expect(() => resolveBracket(0)).toThrow(/Unknown life path value: 0/);
    expect(() => resolveBracket(10)).toThrow(/Unknown life path value: 10/);
  });
});

describe('engine — getCard catalog (positional math)', () => {
  for (const c of fixtures.cards) {
    it(c.label, () => {
      const profile = buildProfile('Test', c.dob);
      if (c.expected.sunSign) {
        expect(profile.sunSign).toBe(c.expected.sunSign);
      }
      if (c.expected.animal) {
        expect(profile.animal).toBe(c.expected.animal);
      }
      const card = getCard(profile);
      expect(card.catalog).toBe(c.expected.catalog);
      // The pure engine computes catalog only. Full card content is
      // resolved outside getCard by the unlocked UI path from
      // content/cards.v1.full.js.
      expect(card.name).toBe('');
      expect(card.type).toBe('');
      expect(card.habit).toBe('');
      expect(card.note).toBe('');
      expect(resolveBracket(profile.lifePath)).toBe(c.expected.bracket);
    });
  }
});

describe('engine — getCard MissingCardError (unknown sun/animal)', () => {
  it('throws MissingCardError naming the bad coordinates, with both allow-lists', () => {
    let err;
    try {
      getCard({ sunSign: 'aries', animal: 'unicorn' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MissingCardError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('MissingCardError');
    expect(err.sunSign).toBe('aries');
    expect(err.animal).toBe('unicorn');
    expect(err.message).toMatch(/No catalog defined for sun="aries" animal="unicorn"/);
    expect(err.message).toMatch(/Sun must be one of \[aries, taurus, gemini/);
    expect(err.message).toMatch(/animal must be one of \[rat, ox, tiger/);
  });

  it('flags an unknown sun sign even when the animal is valid', () => {
    let err;
    try {
      getCard({ sunSign: 'ophiuchus', animal: 'rat' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MissingCardError);
    expect(err.sunSign).toBe('ophiuchus');
    expect(err.animal).toBe('rat');
  });
});

// BANNED_PATTERNS, the voiceRegisterHits substring matcher, and the framing
// patterns are imported from tests/helpers/voice-register.js (the canonical
// policy tables + semantics) and drive the deck scans below.

describe('calendar — lunar new year + solar-term tables (v2)', () => {
  // Sanity locks per v0.2.7.1 brief §4.1 / §4.2. CC's calendar.js
  // (Meeus computation per operator-approved fork from HKO sourcing,
  // see journal entry) MUST match these dates exactly. If any fails,
  // the calc base is wrong — block merge.

  // Lunar new year locks (10 entries spanning 1900–2025).
  const lnyLocks = [
    [1900, 1, 31], [1924, 2, 5], [1950, 2, 17], [1985, 2, 20], [1990, 1, 27],
    [2000, 2, 5], [2010, 2, 14], [2020, 1, 25], [2024, 2, 10], [2025, 1, 29]
  ];
  for (const [year, month, day] of lnyLocks) {
    it(`lunarNewYearDate(${year}) → [${month}, ${day}]`, () => {
      expect(lunarNewYearDate(year)).toEqual([month, day]);
    });
  }

  // Solar-term sanity locks (7 entries; brief §4.2). Animal-index 0..11
  // maps to lichun..xiaohan; index 11 returns a January date in `year`.
  it('monthAnimalSolarTerm(1985, 0) lichun → [2, 4] (tiger start)', () => {
    expect(monthAnimalSolarTerm(1985, 0)).toEqual([2, 4]);
  });
  it('monthAnimalSolarTerm(1990, 0) lichun → [2, 4] (tiger start)', () => {
    expect(monthAnimalSolarTerm(1990, 0)).toEqual([2, 4]);
  });
  it('monthAnimalSolarTerm(2000, 0) lichun → [2, 4] (tiger start)', () => {
    expect(monthAnimalSolarTerm(2000, 0)).toEqual([2, 4]);
  });
  it('monthAnimalSolarTerm(2024, 0) lichun → [2, 4] (tiger start)', () => {
    expect(monthAnimalSolarTerm(2024, 0)).toEqual([2, 4]);
  });
  it('monthAnimalSolarTerm(2024, 1) jingzhe → [3, 5] (rabbit start)', () => {
    expect(monthAnimalSolarTerm(2024, 1)).toEqual([3, 5]);
  });
  it('monthAnimalSolarTerm(2024, 2) qingming → [4, 4] (dragon start)', () => {
    expect(monthAnimalSolarTerm(2024, 2)).toEqual([4, 4]);
  });
  it('monthAnimalSolarTerm(1985, 11) xiaohan → [1, 5] (ox start, Jan in `year`)', () => {
    expect(monthAnimalSolarTerm(1985, 11)).toEqual([1, 5]);
  });

  // Out-of-range guards — assert the exact message, and pin the
  // animalIndex guard (distinct from the year-range guard) separately.
  it('lunarNewYearDate throws the year-range message below 1900', () => {
    expect(() => lunarNewYearDate(1899))
      .toThrow(/year out of range \[1900, 2100\]: 1899/);
  });
  it('lunarNewYearDate throws the year-range message above 2100', () => {
    expect(() => lunarNewYearDate(2101))
      .toThrow(/year out of range \[1900, 2100\]: 2101/);
  });
  it('monthAnimalSolarTerm throws the year-range message out of range', () => {
    expect(() => monthAnimalSolarTerm(1899, 0))
      .toThrow(/year out of range \[1900, 2100\]: 1899/);
    expect(() => monthAnimalSolarTerm(2101, 0))
      .toThrow(/year out of range \[1900, 2100\]: 2101/);
  });
  it('monthAnimalSolarTerm rejects an out-of-range animalIndex with its own message', () => {
    // Distinct guard from the year check; the year is in range here.
    expect(() => monthAnimalSolarTerm(2000, -1))
      .toThrow(/animalIndex out of range \[0, 11\]: -1/);
    expect(() => monthAnimalSolarTerm(2000, 12))
      .toThrow(/animalIndex out of range \[0, 11\]: 12/);
    // Boundaries 0 and 11 stay valid (11 = xiaohan, a January date in `year`).
    expect(monthAnimalSolarTerm(2000, 0)).toEqual([2, 4]);
    expect(monthAnimalSolarTerm(2000, 11)).toEqual([1, 6]);
  });
});


// =============================================================================
// v0.3.0 deck contract — content/cards.v1.full.js (DOCTRINE §1 v0.22, §4 v0.22,
// §7 v0.22 stage 1 extension)
// =============================================================================

// Expected sun-row + animal-column order. Cross-checks engine.js SUN_ORDER /
// ANIMAL_ORDER without importing them, so a silent reorder there + matching
// reorder here would still fire one of these tests.
const EXPECTED_SUN_KEYS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];
const EXPECTED_ANIMAL_KEYS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'
];

describe('content/cards.v1.full.js — v0.3.0 deck contract', () => {
  it('exports CARDS object with exactly 12 sun-sign keys', () => {
    const keys = Object.keys(CARDS);
    expect(keys.length).toBe(12);
    // Set-equality, not order — engine.js owns the canonical ordering; the
    // deck just needs all 12 keys present. Catalog roman-numeral correctness
    // is verified by 'engine — getCard catalog (positional math)' suite.
    expect(new Set(keys)).toEqual(new Set(EXPECTED_SUN_KEYS));
  });

  it('each sun-sign holds exactly 12 animal keys (144 cells total)', () => {
    let total = 0;
    for (const sun of EXPECTED_SUN_KEYS) {
      const row = CARDS[sun];
      expect(row, `CARDS.${sun} missing`).toBeDefined();
      const animals = Object.keys(row);
      expect(animals.length, `CARDS.${sun} has ${animals.length} keys, want 12`).toBe(12);
      expect(new Set(animals)).toEqual(new Set(EXPECTED_ANIMAL_KEYS));
      total += animals.length;
    }
    expect(total).toBe(144);
  });

  it('every cell has { name, type, habit, note: {low, mid, high}, catalog } shape', () => {
    const malformed = [];
    for (const sun of EXPECTED_SUN_KEYS) {
      for (const animal of EXPECTED_ANIMAL_KEYS) {
        const cell = CARDS[sun][animal];
        const path = `${sun}.${animal}`;
        if (typeof cell?.name !== 'string' || cell.name.length === 0) malformed.push(`${path}: missing/empty name`);
        if (typeof cell?.type !== 'string' || cell.type.length === 0) malformed.push(`${path}: missing/empty type`);
        if (typeof cell?.habit !== 'string' || cell.habit.length === 0) malformed.push(`${path}: missing/empty habit`);
        if (!cell?.note || typeof cell.note !== 'object') {
          malformed.push(`${path}: missing note`);
        } else {
          for (const bracket of ['low', 'mid', 'high']) {
            if (typeof cell.note[bracket] !== 'string' || cell.note[bracket].length === 0) {
              malformed.push(`${path}.note.${bracket}: missing/empty`);
            }
          }
        }
        if (typeof cell?.catalog !== 'string' || cell.catalog.length === 0) malformed.push(`${path}: missing/empty catalog`);
      }
    }
    expect(malformed, `Deck cells failing schema:\n${malformed.join('\n')}`).toEqual([]);
  });

  // Collect every content string in the deck once for the policy scans below.
  // Yields { path, text } so a hit reports its coordinate.
  function* deckStrings() {
    for (const sun of EXPECTED_SUN_KEYS) {
      for (const animal of EXPECTED_ANIMAL_KEYS) {
        const c = CARDS[sun][animal];
        if (!c) continue;
        yield { path: `${sun}.${animal}.name`, text: c.name ?? '' };
        yield { path: `${sun}.${animal}.type`, text: c.type ?? '' };
        yield { path: `${sun}.${animal}.habit`, text: c.habit ?? '' };
        if (c.note) {
          for (const bracket of ['low', 'mid', 'high']) {
            yield { path: `${sun}.${animal}.note.${bracket}`, text: c.note[bracket] ?? '' };
          }
        }
      }
    }
  }

  it('no BANNED_VOICE_REGISTER hits in deck content (DOCTRINE §2)', () => {
    // Canonical substring semantics via the shared matcher — see
    // tests/helpers/voice-register.js (PR #101 MED-1 reconciliation; the
    // old word-bounded shape here false-greened on suffix inflections).
    const hits = [];
    for (const { path, text } of deckStrings()) {
      for (const { term, containing } of voiceRegisterHits(text)) {
        hits.push(`${path}: matched "${term}" in "${containing}" ("${text.slice(0, 80)}…")`);
      }
    }
    expect(hits, `Voice-register violations in cards.v1.full.js:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no BANNED_PATTERNS slur hits in deck content (DOCTRINE §4)', () => {
    const hits = [];
    for (const { path, text } of deckStrings()) {
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) {
          hits.push(`${path}: matched ${re} in "${text.slice(0, 80)}…"`);
          break;
        }
      }
    }
    expect(hits, `Slur-pattern violations in cards.v1.full.js:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no card-content string contains a YYYY-MM-DD date (DOCTRINE §11 sub-rule)', () => {
    // Defensive: card content should never contain dates. Codifies the
    // invariant even though no deck cell is expected to need one.
    const re = /\b\d{4}-\d{2}-\d{2}\b/;
    const hits = [];
    for (const { path, text } of deckStrings()) {
      if (re.test(text)) {
        hits.push(`${path}: contains date pattern in "${text.slice(0, 80)}…"`);
      }
    }
    expect(hits, `Date strings in cards.v1.full.js (unexpected):\n${hits.join('\n')}`).toEqual([]);
  });

  it('never addresses the reader directly and never reaches for diagnostic framing', () => {
    // §2's register is declarative-observational — card prose describes, it
    // does not speak TO the reader or borrow clinical authority. Same shared
    // patterns as the meanings and concordance scans (PR #101 follow-up:
    // one convention across all three content scans).
    const hits = [];
    for (const { path, text } of deckStrings()) {
      if (SECOND_PERSON_RE.test(text)) hits.push(`${path}: second-person address`);
      if (DIAGNOSTIC_FRAMING_RE.test(text)) hits.push(`${path}: diagnostic framing`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('scans the exact deck module the runtime imports (scan-target parity)', () => {
    // PR #101 MED-2: a future cards.v2 deck (§4 — new release = new file)
    // must not ship unscanned while this file greens on v1. index.html is the
    // sole runtime importer; when its import moves, this fails until the
    // scan's static imports move to the same file in the same change.
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const specifiers = [...html.matchAll(
      /from\s+['"]\.{1,2}\/content\/(cards\.[\w.]+\.js)['"]/g,
    )].map(match => match[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) expect(specifier).toBe('cards.v1.full.js');
  });
});
