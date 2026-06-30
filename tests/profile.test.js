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
import { getCard, resolveBracket } from '../core/engine.js';
import { lunarNewYearDate, monthAnimalSolarTerm } from '../core/calendar.js';
import { CARDS } from '../content/cards.v1.full.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

// Banned voice-register substrings — DOCTRINE.md §2.
// Bans the voice register, not the symbol-system nouns: "Aries", "rat",
// "life path 7", "Pythagorean" all stay legal; "the universe says",
// "your stars guide you", "destined for greatness" do not.
// Case-insensitive start-anchored word-boundary match — preserves
// inflections at end ("auras", "manifesting") while preventing
// leading-substring collisions inside unrelated English words
// (e.g. "aura" inside "restaurant").
const BANNED_VOICE_REGISTER = [
  'the universe', 'your stars', 'destiny', 'destined', 'fated', 'fate',
  'cosmic', 'the cosmos', 'spiritual', 'mystic', 'mystical', 'psychic',
  'channel', 'channeling', 'aura', 'karma', 'manifest', 'manifestation',
  'third eye', 'soul mate', 'your guides', 'divine', 'sacred'
];

// Slur subset. Fast pre-merge tripwire; the local audit and reviewer
// diff close the long tail.
const BANNED_PATTERNS = [
  /\bretard(ed|ation)?\b/i,
  /\bidiot\b/i,
  /\b(insane|crazy|mental)\b/i,
  /\b(faggot|tranny)\b/i,
  /\bn[i1]gg[ae]r/i
];

// The regex tables below are the enforced policy source for the deck
// scans later in this file.

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

  it('rejects malformed DOB', () => {
    expect(() => buildProfile('x', 'bad-date')).toThrow();
    expect(() => buildProfile('x', '2020-13-01')).toThrow();
    expect(() => buildProfile('x', '2020-01-32')).toThrow();
  });

  it('rejects impossible day-of-month (Feb 30, Apr 31, Feb 29 non-leap)', () => {
    expect(() => buildProfile('x', '2000-02-30')).toThrow(); // Feb never has 30
    expect(() => buildProfile('x', '2000-04-31')).toThrow(); // Apr has 30
    expect(() => buildProfile('x', '2000-06-31')).toThrow(); // Jun has 30
    expect(() => buildProfile('x', '2000-09-31')).toThrow(); // Sep has 30
    expect(() => buildProfile('x', '2001-02-29')).toThrow(); // 2001 not leap
    expect(() => buildProfile('x', '1900-02-29')).toThrow(); // 1900 not leap (÷100, ¬÷400)
  });

  it('accepts real boundary dates including leap-day Feb 29', () => {
    expect(() => buildProfile('x', '2000-02-29')).not.toThrow(); // 2000 leap (÷400)
    expect(() => buildProfile('x', '2004-02-29')).not.toThrow(); // 2004 leap
    expect(() => buildProfile('x', '2000-02-28')).not.toThrow(); // Feb 28 always valid
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

  it('getMaturity: simple sum', () => {
    expect(getMaturitySum(1996, 4, 1, 'Alex Thomas')).toBe(67);
    expect(getMaturity(1996, 4, 1, 'Alex Thomas')).toBe(4);
  });

  it('getMaturity: master-number preservation', () => {
    expect(getMaturitySum(2000, 1, 7, 'A')).toBe(11);
    expect(getMaturity(2000, 1, 7, 'A')).toBe(11);
  });

  it('buildProfile: exposes new 2G-2 fields', () => {
    const p = buildProfile('Alex Thomas', '1996-04-01');
    expect(p.personality).toBe(6);
    expect(p.personalitySum).toBe(24);
    expect(p.birthday).toBe(1);
    expect(p.maturity).toBe(4);
    expect(p.maturitySum).toBe(67);
  });
});

describe('engine — resolveBracket', () => {
  for (const c of fixtures.brackets) {
    it(`LP ${c.lp} → ${c.expected}`, () => {
      expect(resolveBracket(c.lp)).toBe(c.expected);
    });
  }

  it('throws on unknown LP value', () => {
    expect(() => resolveBracket(0)).toThrow();
    expect(() => resolveBracket(10)).toThrow();
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

// BANNED_PATTERNS and BANNED_VOICE_REGISTER remain in this file as the
// canonical policy tables for the deck scans below.

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

  // Out-of-range guards.
  it('lunarNewYearDate(1899) throws', () => {
    expect(() => lunarNewYearDate(1899)).toThrow();
  });
  it('lunarNewYearDate(2101) throws', () => {
    expect(() => lunarNewYearDate(2101)).toThrow();
  });
  it('monthAnimalSolarTerm(1899, 0) throws', () => {
    expect(() => monthAnimalSolarTerm(1899, 0)).toThrow();
  });
  it('monthAnimalSolarTerm(2101, 0) throws', () => {
    expect(() => monthAnimalSolarTerm(2101, 0)).toThrow();
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
    const hits = [];
    for (const { path, text } of deckStrings()) {
      const lower = text.toLowerCase();
      for (const term of BANNED_VOICE_REGISTER) {
        // Word-boundary case-insensitive match — same shape as the v0.1.x
        // scan that historically ran against the private deck.
        const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (re.test(text)) {
          hits.push(`${path}: matched "${term}" in "${text.slice(0, 80)}…"`);
          break;
        }
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
});
