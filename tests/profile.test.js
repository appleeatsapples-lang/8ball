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
import { readdirSync, readFileSync } from 'node:fs';
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
  getSoulUrge, getSoulUrgeSum,
  MASTER_NUMBERS, TERMINAL_NUMBERS
} from '../core/profile.js';
import { LIFE_PATH_VALUES } from '../content/concordance.v3.js';
import { NUMEROLOGY_MEANINGS } from '../content/meanings.v3.js';
import { getCard, resolveBracket, MissingCardError } from '../core/engine.js';
import { CELL_KEYS, cellRenderState, ROW_TITLES, SHEET_ROWS } from '../ui/tiers.js';
// Every OTHER output surface a profile feeds, reached through its pure export
// so the gender differential below runs in plain node (§12 — no jsdom):
//   ui/payments.js   the written entry's note slot (facet anchor)
//   ui/public.js     the DOMAIN FIT block
//   ui/dyad.js       the comparative relation layer
//   ui/concordance.js the archive compare axes
//   ui/share.js      the §5.D PNG/caption artifact
//   ui/meanings.js   the per-coordinate meanings drawer
//   ui/readings.js   the local archive record (the ONE deliberate carrier)
import { getFreshFacetSlot } from '../ui/payments.js';
import { publicReadFor } from '../ui/public.js';
import { dyadRelationFor } from '../ui/dyad.js';
import { buildConcordance } from '../ui/concordance.js';
import {
  buildCaptionFromSnapshot, buildCardSVGFromSnapshot, rowSections,
} from '../ui/share.js';
import { entryFor, harmonyFor } from '../ui/meanings.js';
import { compactReadingProfile } from '../ui/readings.js';
// Lexical classifier for the inline-render guard — see the header of
// tests/helpers/js-lex.js for the two regex failures that made it necessary.
import { COMMENT, classify, functionBody, genderTokens, startsRegex } from './helpers/js-lex.js';
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

// ─────────────────────────────────────────────────────────────────────────────
// calc v4 — the terminal domain (DOCTRINE §1.B v0.62)
// ─────────────────────────────────────────────────────────────────────────────
//
// The single place the active numerology domain is DECLARED, and the pins that
// stop every restatement of it elsewhere in the repo from drifting. Without
// these, `content/` could narrow the registry back to nine and the only
// symptom would be a coordinate that renders and then opens "meaning not
// filed" — which is the shape of the defect this cycle repairs.

describe('calc v4 — the terminal numerology domain', () => {
  it('is exactly 1..9 plus the three master stops, in ascending order', () => {
    expect([...MASTER_NUMBERS]).toEqual([11, 22, 33]);
    expect([...TERMINAL_NUMBERS]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
    expect(Object.isFrozen(TERMINAL_NUMBERS)).toBe(true);
    expect(Object.isFrozen(MASTER_NUMBERS)).toBe(true);
  });

  it('the Concordance registry declares the SAME domain the calculator produces', () => {
    // content/ imports nothing from core/, so the two lists are restated
    // rather than shared. This is the pin that makes that safe.
    expect([...LIFE_PATH_VALUES]).toEqual([...TERMINAL_NUMBERS]);
  });

  it('the active meaning registry has an entry for every terminal value', () => {
    // Every one of the twelve resolves a meaning WITHOUT fallback — the
    // acceptance criterion this cycle is measured against.
    for (const value of TERMINAL_NUMBERS) {
      const entry = NUMEROLOGY_MEANINGS[String(value)];
      expect(entry, `no meaning filed for ${value}`).toBeDefined();
      expect(entry.register.trim(), `${value} register`).toBeTruthy();
      expect(entry.body.trim(), `${value} body`).toBeTruthy();
      expect(entry.theme.trim(), `${value} theme`).toBeTruthy();
    }
    expect(Object.keys(NUMEROLOGY_MEANINGS)).toHaveLength(TERMINAL_NUMBERS.length);
  });

  it('every reduction over a wide sweep lands inside the domain, or is unresolved', () => {
    // getBirthday is the one exported function that reduces an arbitrary
    // positive integer, so it is the reducer's public surface. Swept far past
    // any reachable total: nothing may escape the twelve values.
    for (let n = 1; n <= 5000; n++) {
      expect(TERMINAL_NUMBERS, `n=${n}`).toContain(getBirthday(n));
    }
    for (const bad of [0, -1, -11, 1.5, NaN, Infinity, null, undefined, '11']) {
      expect(getBirthday(bad), String(bad)).toBeNull();
    }
  });

  it('stops AT a master and nowhere else — the named cases', () => {
    expect(getBirthday(11)).toBe(11);
    expect(getBirthday(22)).toBe(22);
    expect(getBirthday(33)).toBe(33);
    expect(getBirthday(29)).toBe(11);   // 2+9 = 11, stop
    expect(getBirthday(38)).toBe(11);   // 3+8 = 11, stop
    expect(getBirthday(44)).toBe(8);    // 44 is not a stop; 4+4 = 8
    expect(getBirthday(66)).toBe(3);    // 6+6 = 12 → 3
    expect(getBirthday(299)).toBe(2);   // 20 → 2; reaches no stop on the way
    expect(getBirthday(984)).toBe(3);   // 21 → 3
    // Multi-step, landing ON a stop at the second pass rather than the first.
    expect(getBirthday(2999)).toBe(11); // 29 → 11, stop
  });

  it('preserves masters on ALL SIX numerology coordinates through buildProfile', () => {
    // The end-to-end shape the locked specimen advertises. Ann + the
    // synthetic 1970-01-04 lands a master on life path, name number and
    // maturity at once; the other three are driven by name choice.
    const ann = buildProfile('Ann', '1970-01-04');
    expect(ann.lifePath).toBe(22);
    expect(ann.nameNumber).toBe(11);
    expect(ann.maturity).toBe(33);
    // The unreduced trails stay trails — they are not coordinate values and
    // must not be mistaken for the place the master "really" lives.
    expect(ann.lifePathSum).toBe(22);
    expect(ann.nameNumberSum).toBe(11);
    expect(ann.maturitySum).toBe(33);

    // Soul urge and personality, on the name side.
    expect(buildProfile('Aida', '2000-01-01').soulUrge).toBe(11);
    expect(buildProfile('Aria Stone', '2000-01-01').soulUrge).toBe(22);
    expect(buildProfile('Hal', '2000-01-01').personality).toBe(11);
    // Birthday, on the date side.
    expect(buildProfile('Test', '2000-01-11').birthday).toBe(11);
    expect(buildProfile('Test', '2000-01-22').birthday).toBe(22);

    // Every coordinate that resolved is inside the domain, on every profile.
    const COORDS = ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity'];
    for (const profile of [ann, buildProfile('Aida', '2000-01-11'),
      buildProfile('Hal', '1970-01-04'), buildProfile('Aria Stone', '2000-01-22')]) {
      for (const key of COORDS) {
        if (profile[key] === null) continue;
        expect(TERMINAL_NUMBERS, `${profile.name}.${key}`).toContain(profile[key]);
      }
    }
  });

  it('still resolves an absent letter class as unresolved, never zero', () => {
    // The one calc-v3 guard this amendment keeps. A widened domain must not
    // reintroduce the displayed zero the nine-number cut removed.
    const rhythm = buildProfile('Rhythm', '2000-01-01');
    expect(rhythm.soulUrge).toBeNull();
    expect(rhythm.maturity).not.toBeNull();
    const digits = buildProfile('123', '2000-01-01');
    expect(digits.nameNumber).toBeNull();
    expect(digits.personality).toBeNull();
    expect(digits.maturity).toBeNull();
  });
});

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

  // Soul urge: vowel sum, Pythagorean values, reduced with master stops preserved (calc v4).
  it('soul urge of empty name is unresolved, never a displayed zero', () => {
    expect(getSoulUrge('')).toBeNull();
    expect(getSoulUrgeSum('')).toBe(0);
  });
  it('soul urge with no standard vowels is unresolved', () => {
    expect(getSoulUrgeSum('Rhythm')).toBe(0);
    expect(getSoulUrge('Rhythm')).toBeNull();
  });
  it('soul urge of "Alex Thomas" → 4 (sum 13, vowels A+E+O+A = 1+5+6+1)', () => {
    expect(getSoulUrgeSum('Alex Thomas')).toBe(13);
    expect(getSoulUrge('Alex Thomas')).toBe(4);
  });
  it('soul urge preserves master 11 (vowels of "Aida" = A+I+A = 1+9+1)', () => {
    expect(getSoulUrgeSum('Aida')).toBe(11);
    expect(getSoulUrge('Aida')).toBe(11);
  });
  it('soul urge preserves master 22 ("Aria Stone" vowels A+I+A+O+E = 1+9+1+6+5)', () => {
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
    expect(getPersonality('')).toBeNull();
    expect(getPersonalitySum('')).toBe(0);
  });

  it('getPersonality: a vowel-only name is unresolved', () => {
    expect(getPersonalitySum('Aei')).toBe(0);
    expect(getPersonality('Aei')).toBeNull();
  });

  it('getPersonality: simple consonants-only sum', () => {
    // "Alex Thomas": consonants l-x-t-h-m-s -> 3+6+2+8+4+1 = 24 -> 6
    expect(getPersonalitySum('Alex Thomas')).toBe(24);
    expect(getPersonality('Alex Thomas')).toBe(6);
  });

  it('getPersonality: preserves master 11', () => {
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

  it('getBirthday: master days stay master', () => {
    expect(getBirthday(11)).toBe(11);
    expect(getBirthday(22)).toBe(22);
  });

  it('getBirthday: 29 reduces to the master stop 11, not past it', () => {
    expect(getBirthday(29)).toBe(11);
  });

  // The reducer stops AT a master, never at a number that merely contains a
  // repeated digit: 44 is not a stop, so it reduces to 8 like any other total.
  it('getBirthday: non-stop repeated digits still reduce (44 → 8)', () => {
    expect(getBirthday(44)).toBe(8);
    expect(getBirthday(38)).toBe(11);
  });

  it('getMaturity: sums the reduced life path + reduced name number', () => {
    // Alex Thomas, 1996-04-01: lifePath reduces to 3, nameNumber to 1.
    expect(getLifePath(1996, 4, 1)).toBe(3);
    expect(getNameNumber('Alex Thomas')).toBe(1);
    expect(getMaturitySum(1996, 4, 1, 'Alex Thomas')).toBe(4);
    expect(getMaturity(1996, 4, 1, 'Alex Thomas')).toBe(4);
  });

  it('getMaturity: combines master components and can itself land on a master', () => {
    // Ann, 1970-01-04: life path 22, name number 11 — both master stops —
    // and their sum 33 is itself a stop. All three coordinates stay master.
    // This is the shape the locked specimen advertises, so it is pinned as a
    // named case rather than left implied by the reducer's unit tests.
    expect(getLifePath(1970, 1, 4)).toBe(22);
    expect(getNameNumber('Ann')).toBe(11);
    expect(getMaturitySum(1970, 1, 4, 'Ann')).toBe(33);
    expect(getMaturity(1970, 1, 4, 'Ann')).toBe(33);
  });

  it('getMaturity: combines canonical components rather than unreduced sums', () => {
    // Bob, 1970-01-01: raw life-path digit sum is 19 and raw name-number
    // sum is 10. The calculation reduces each component first (both land
    // on 1), then combines them to 2.
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

// ── the optional gender field (§1.D v0.63, retained at v0.67) ──────
//
// These two tests lived in tests/kua.test.js. §1.D v0.67 deleted the kua
// block and its three suites — and took these with them, which was wrong:
// they never tested kua. They test the FIELD, and the field was explicitly
// RETAINED. A pre-merge lane caught the loss.
//
// They are load-bearing again as of this change, because the form now tells
// the user at the point of entry that the field "does not affect your
// reading". Two real buildProfile calls make the first half of that claim
// true — if gender ever begins to move a coordinate, the sentence on the
// form goes red here. The SECOND half (no reader further down) is the
// downstream suite below, which runs the same differential over every
// output surface a profile feeds.

// ── the fixture both differentials run on ─────────────────────────
//
// FULL optional input — time AND tz AND lat AND lng. All four are required:
// buildProfile's rising/moon gate is
//   opts.time && typeof opts.lat === 'number' && typeof opts.lng === 'number'
//   && a resolvable tz
// so a `{ time: '08:30' }` fixture leaves risingSign and moonSign UNDEFINED
// and their two compartments compare `—` to `—` in every variant. A gender
// reader placed on the rising or moon path would then be invisible to this
// suite, which is exactly the hole a re-audit found in the first version of
// these tests. `resolves every coordinate` below is the pin that keeps the
// fixture full; do not thin it.
const GENDER_NAME = 'Test Name';
const GENDER_DOB = '1990-06-15';
const GENDER_OPTS = Object.freeze({
  time: '08:30', tz: 'America/New_York', lat: 40.7128, lng: -74.0060,
});
// A second, DIFFERENT person for the two pair surfaces (dyad + concordance):
// same-profile pairs collapse every relation to its identity case and would
// hide a reader that only fires on a mismatch.
const GENDER_PARTNER = buildProfile('Other Person', '1984-11-02', {
  time: '21:15', tz: 'Europe/Berlin', lat: 52.5200, lng: 13.4050,
});

// The written 144-card entry, resolved the way index.html's renderCard
// resolves it: CARDS[sunSign][animal] for name/type/habit, and note[slot]
// for the rotating position. ALL THREE note slots, not only the anchored
// one — the stored facet index is a rotation position, so a reader could
// sit in any of them.
function genderCardEntry(profile) {
  const row = CARDS[profile.sunSign];
  const cell = row ? row[profile.animal] : null;
  if (!cell) return null;
  return {
    name: cell.name,
    type: cell.type,
    habit: cell.habit,
    notes: Object.keys(cell.note).sort().map(slot => [slot, cell.note[slot]]),
    anchoredNote: cell.note[getFreshFacetSlot(profile.lifePath)],
  };
}

// The §5.D share snapshot, rebuilt from the SAME pure cell mapping the DOM
// path reads: ui/tiers.js cellRenderState decides each cell, setCell paints
// it, shareRowRefs reads it back as { state, value } with 'value' → 'open'.
// Reconstructing it here keeps the artifact in the differential without a
// DOM (§12).
function genderShareSnapshot(profile) {
  return {
    catalog: `no. ${getCard(profile).catalog}`,
    sections: SHEET_ROWS.map(keys => ({
      title: ROW_TITLES[keys[0]],
      cells: keys.map(key => {
        const { state, text } = cellRenderState(profile, key, true);
        if (state === 'value') return { state: 'open', value: text };
        if (state === 'unres') return { state: 'unres', value: '—' };
        return { state: 'sealed', value: '' };
      }),
    })),
  };
}

function genderShareArtifact(profile) {
  const snap = genderShareSnapshot(profile);
  const sections = rowSections(snap.sections);
  return {
    sections,
    svg: buildCardSVGFromSnapshot({ catalog: snap.catalog, sections }),
    caption: buildCaptionFromSnapshot({ catalog: snap.catalog, sections }),
  };
}

// The meanings drawer reads the RENDERED cell strings, so it is driven from
// cellRenderState rather than the profile — same input the live panel gets.
function genderMeanings(profile) {
  const values = {};
  for (const key of CELL_KEYS) values[key] = cellRenderState(profile, key, true).text;
  return CELL_KEYS.map(key => {
    const entry = entryFor(key, values[key]);
    return { key, entry, harmony: entry ? harmonyFor(key, entry, values) : null };
  });
}

// Every output surface a profile feeds that is reachable from a pure
// function. `probe` is the per-surface vacuity guard: it asserts the surface
// actually produced its real content, so no row can pass by comparing two
// empty, null, or unresolved things.
const GENDER_SURFACES = [
  {
    name: 'sheet — every compartment at full entitlement',
    of: p => CELL_KEYS.map(k => cellRenderState(p, k, true)),
    probe: (v, p) => v.length === CELL_KEYS.length
      && v.every(c => c.state === 'value')
      && v.some(c => c.text === p.risingSign)   // rising RESOLVED and rendered
      && v.some(c => c.text === p.moonSign),    // moon RESOLVED and rendered
  },
  {
    name: 'catalog cell — core/engine getCard',
    of: p => getCard(p),
    probe: v => /^[ivxlcdm]+$/.test(v.catalog),
  },
  {
    name: 'written card entry — the 144-cell copy and all three note slots',
    of: p => genderCardEntry(p),
    probe: v => !!v && !!v.name && !!v.type && !!v.habit
      && v.notes.length === 3 && v.notes.every(([, note]) => !!note)
      && !!v.anchoredNote,
  },
  {
    name: 'note-slot anchor — bracket and facet position',
    of: p => ({ bracket: resolveBracket(p.lifePath), slot: getFreshFacetSlot(p.lifePath) }),
    probe: v => ['low', 'mid', 'high'].includes(v.slot) && v.slot === v.bracket,
  },
  {
    name: 'public read — the DOMAIN FIT block',
    of: p => publicReadFor(p),
    probe: v => !!v && !!v.roleLine && !!v.families && !!v.antiFit,
  },
  {
    name: 'dyad relation — this profile in the A position',
    of: p => dyadRelationFor(p, GENDER_PARTNER),
    probe: v => !!v && !!v.elementHead && !!v.cardPairHead && !!v.numerologyMeaning,
  },
  {
    name: 'dyad relation — this profile in the B position',
    of: p => dyadRelationFor(GENDER_PARTNER, p),
    probe: v => !!v && !!v.elementHead && !!v.cardPairHead && !!v.numerologyMeaning,
  },
  {
    name: 'concordance axes — the archive compare surface',
    of: p => buildConcordance(p, GENDER_PARTNER, { tier: 't3' }),
    probe: v => v.axes.length >= 5 && v.axes.every(a => !!a.label),
  },
  {
    name: 'share artifact — snapshot rows, SVG and caption',
    of: p => genderShareArtifact(p),
    probe: (v, p) => v.svg.includes(p.risingSign) && v.svg.includes(p.moonSign)
      && v.caption.includes(p.risingSign) && v.caption.includes(p.moonSign),
  },
  {
    name: 'meanings drawer — entry and harmony per coordinate',
    of: p => genderMeanings(p),
    // 14 of the 15 cells have a meanings entry (moon has none by design);
    // the floor is set below that so the row cannot pass on a null sweep.
    probe: v => v.filter(e => e.entry).length >= 12
      && v.filter(e => e.harmony).length >= 12,
  },
];

describe('buildProfile — the optional gender field', () => {
  it('carries a strict two-token gender and drops everything else', () => {
    expect(buildProfile('Test Name', '1990-06-15', { gender: 'female' }).gender).toBe('female');
    expect(buildProfile('Test Name', '1990-06-15', { gender: 'male' }).gender).toBe('male');
    expect(buildProfile('Test Name', '1990-06-15', { gender: 'other' }).gender).toBeUndefined();
    expect(buildProfile('Test Name', '1990-06-15', { gender: '' }).gender).toBeUndefined();
    expect(buildProfile('Test Name', '1990-06-15', {}).gender).toBeUndefined();
    expect(buildProfile('Test Name', '1990-06-15').gender).toBeUndefined();
  });

  it('changes NOTHING else on the profile — the field drives no coordinate', () => {
    const without = buildProfile(GENDER_NAME, GENDER_DOB, GENDER_OPTS);
    const withF = buildProfile(GENDER_NAME, GENDER_DOB, { ...GENDER_OPTS, gender: 'female' });
    const withM = buildProfile(GENDER_NAME, GENDER_DOB, { ...GENDER_OPTS, gender: 'male' });
    const strip = ({ gender, ...rest }) => rest;
    // Two directions, not one: female-vs-absent AND male-vs-female. A single
    // comparison would still pass if some coordinate keyed off "gender is
    // present" without caring which value it held.
    expect(strip(withF)).toEqual(strip(without));
    expect(strip(withM)).toEqual(strip(withF));
    // And the field itself did survive both builds — otherwise the two
    // assertions above would be comparing two identical no-gender profiles
    // and proving nothing.
    expect(withF.gender).toBe('female');
    expect(withM.gender).toBe('male');
    // …and the profile being compared is the FULL one. On a time-only
    // fixture risingSign and moonSign are undefined in every variant and
    // this differential says nothing about the two coordinates that consume
    // the most input.
    expect(typeof withF.risingSign).toBe('string');
    expect(typeof withF.moonSign).toBe('string');
  });
});

// ── the downstream differential (every output surface) ─────────────
//
// The two tests above compare buildProfile's own output, which stays green
// if a READER is added further down. This suite runs the same two-direction
// differential over every surface a profile feeds that a pure function can
// reach: the catalog cell, the written 144-card entry and its three note
// slots, the note-slot anchor, the sheet's compartments, the DOMAIN FIT
// public read, the dyad relation in BOTH positions, the concordance axes,
// the §5.D share artifact (rows + SVG + caption), and the meanings drawer.
//
// It matters because the form tells the user at the point of entry that the
// field "does not affect your reading". This suite is what makes that
// sentence true rather than merely written down.

// `renderCard`'s body, LEXED out of index.html's inline module — braces are
// counted only where they are code, so a `}` inside a comment or a string
// cannot truncate the extraction. Scoped to renderCard alone: the submit
// handler legitimately names the field (`opts.gender = g`) and is not the
// render path.
//
// Two earlier regex versions of this pair were defeated; the reasons are
// written out in tests/helpers/js-lex.js and pinned by the counter-cases at
// the bottom of this file.
const RENDER_CARD_SIG = 'function renderCard(profile, opts) {';
function renderCardBody(html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8')) {
  return functionBody(html, RENDER_CARD_SIG);
}

// Every mention of the IDENTIFIER, in any form the language offers:
// `profile.gender`, `profile['gender']`, `profile["gender"]`,
// ``profile[`gender`]``, `const { gender } = …`, `{ gender: alias }`, a bare
// `gender`, and any of those inside a template interpolation.
//
// STRING TEXT IS SCANNED ON PURPOSE. A computed property key lives in a string
// literal, so stripping literals — which is what the first version did — is
// exactly how `profile["gender"]` escaped. Comment text is the only thing
// dropped, because a comment is the one place the word is harmless.
// `getGenderInput` DOES match, and must: it reads the live control and
// changes the card while naming no property. The word boundary that used to
// exclude it was removed for exactly that reason.
function genderTokensIn(extracted) {
  return genderTokens(extracted);
}

// Every mention of the identifier in a JS source, comments excluded.
//
// The core/+ui/ scan and the inline-module guard share the CLASSIFIER and the
// matcher constant below, not one whole function — they answer different
// questions (a count per file, versus which lines carry it). "They cannot
// drift" would be too strong and an audit said so; what is true is that the
// two things that were separately wrong before — how source is stripped, and
// what pattern is matched — now have exactly one definition each.
// NO word boundary: `getGenderInput()` reads the live control and changes the
// card while naming no property, and `\bgender\b` could not see it.
const GENDER_RE = /gender/gi;

function genderMentionsInSource(src) {
  const kind = classify(src);
  let code = '';
  for (let i = 0; i < src.length; i++) code += kind[i] === COMMENT ? ' ' : src[i];
  return code.match(GENDER_RE) || [];
}


// ── the PRIMARY invariant: a RAW, fail-closed allowlist ───────────
//
// No lexing. Every line of the bounded corpus that contains the identifier,
// in any casing, must appear verbatim on this list.
//
// It is primary because a hand-written lexer CANNOT carry an absolute
// "every spelled read fails" claim, and three rounds of audit proved it: a
// regex may legally begin in more ES positions than any heuristic enumerates.
// The last one found was a spread — `[.../[//]/.exec(x)]` — where the `/`
// after `...` was read as division and the `//` inside then opened a comment,
// blanking a live `profile.gender` read on the same line. Valid JavaScript,
// executes, changes the card, and both lexical guards reported clean.
//
// A raw scan has no such failure mode: it cannot be confused about syntax
// because it does not model any. The cost is that it also matches comments
// and user-visible copy, which is why the list below carries those too —
// and that is a feature here, since stale gender COPY is exactly the defect
// this cycle already had to correct twice.
//
// WHEN THIS FAILS: read the new line. If it is a genuine read, that is the
// bug. If it is legitimate copy or a comment, add it verbatim to this list —
// deliberately, as a reviewed act. Never relax the matcher.
//
// The three input-path files (core/profile.js, ui/profile.js, ui/readings.js)
// are excluded: they OWN the field, and what they must not do is covered by
// the runtime differential above, not by counting mentions.
const RAW_GENDER_ALLOW = {
  "index.html": [
    "<p>nothing leaves your device on its own. inputs — including the optional gender, which can stay blank and does not affect your reading — the paid rung, the show-labels toggle, and readings you choose to save are stored locally. previous readings lets you reopen, rename, delete, or clear that browser-only archive. the feedback form below the card sends only what you type there, only when you press send.</p>",
    "<p>readings are free and unlimited, on the free sheet. the current offer is the complete sheet for three dollars, once — it opens the eleven sealed coordinates, a meanings panel on each but the moon cell, the written card entry (name, type, habit, and one of three rotating note positions, first anchored by your life path), domain fit, and the comparative — a second person's complete sheet beside yours with the named relation between them — permanently, for every reading in this browser. devices that already own a lower rung keep it; a higher rung bought later upgrades the sheet — what you bought stays bought. no subscription and no 8ball account. checkout is hosted by gumroad — your payment details and email go to them; your name, DOB, optional gender, and reading stay in this browser. the deck is visible in source; the lock is a convention, not a vault. the coins fund more of the toy. we trust adults.</p>",
    "<p class=\"modal-disclosure\" id=\"paywall-disclosure\">gumroad handles payment and email. your name, birth data, optional gender, and reading stay in this browser.</p>",
    "import { initProfileUI, loadSavedProfile, saveProfile, clearProfile, profileFromPayload, validateBirthInput, todayIsoLocal, applyBirthInputValidationState, populateRisingFields, resetFormDisplay, getGenderInput } from './ui/profile.js';",
    "// `form` + `anchor` let the module build the optional gender control it",
    "const g = getGenderInput(); if (g) opts.gender = g;"
  ],
  "core/measurement.js": [
    "// exactly two keys cannot carry a name, a DOB, a gender, a city, a coordinate"
  ],
  "core/profile.js": [
    "// ── Gender passthrough (additive). Strict two-token vocabulary;",
    "const gender = (opts && (opts.gender === 'male' || opts.gender === 'female'))",
    "? opts.gender",
    "gender"
  ],
  "ui/profile.js": [
    "if (opts.gender === 'male' || opts.gender === 'female') payload.gender = opts.gender;",
    "// calculation needs it: §1.D v0.67 deleted the kua block, so gender has",
    "if (obj.gender === 'male' || obj.gender === 'female') opts.gender = obj.gender;",
    "let _genderSelect = null;",
    "// ── the optional gender control ───────────────────────────────────",
    "// no-gender state and it is the default; anything off-vocabulary resolves",
    "// POINT-OF-ENTRY TRUTH. The control carries GENDER_NOTE, wired to the",
    "export const GENDER_NOTE = 'optional · stored on this device · does not affect your reading';",
    "function resolveGenderSelect(refs) {",
    "if (refs && refs.genderSelect) return refs.genderSelect;",
    "const existing = form.querySelector && form.querySelector('#gender-input');",
    "field.className = 'field gender-field';",
    "field.innerHTML = '<label for=\"gender-input\">gender (optional)</label>' +",
    "'<select id=\"gender-input\" aria-describedby=\"gender-note\">' +",
    "`<p class=\"field-note\" id=\"gender-note\">${GENDER_NOTE}</p>`;",
    "return field.querySelector ? field.querySelector('#gender-input') : null;",
    "export function getGenderInput() {",
    "const v = _genderSelect && _genderSelect.value;",
    "export function setGenderInput(v) {",
    "if (!_genderSelect) return;",
    "_genderSelect.value = v === 'male' || v === 'female' ? v : '';",
    "_genderSelect = resolveGenderSelect(refs);",
    "// Rehydrate the gender control (owned by this module since §1.D v0.67).",
    "setGenderInput(obj.gender);",
    "// Clear the gender control directly (this module owns it since §1.D",
    "// v0.67). Routing it through the retired setGender hook silently left a",
    "setGenderInput(undefined);"
  ],
  "ui/readings.js": [
    "// §5.E: the archive carries gender because it is a user-entered input",
    "if (input.gender === 'male' || input.gender === 'female') profile.gender = input.gender;"
  ],
  "ui/tiers.js": [
    "// ceiling is the written entry + the public read; the optional gender"
  ]
};

// Every tracked .js under a directory, RECURSING. The scan read only the top
// level, so a module in a future `core/x/` or `ui/x/` would have been outside
// it — an audit flagged that the guarantee was written broader than the scan.
function jsFilesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(join(__dirname, '..', dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...jsFilesUnder(rel));
    else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

// index.html's inline module(s), lexed, with COMMENT characters blanked
// and everything executable or literal preserved. The module-wide guard runs
// on this so a reader hidden in any helper — not just renderCard — is caught.
function inlineModuleBlocks(html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8')) {
  // ALL of them, not the first. The previous version matched a single block,
  // so a second inline module would have carried a reader the guard never saw.
  // Tolerates every spelling the HTML grammar allows: unquoted `type=module`,
  // spaces around `=`, and any casing of the attribute name — an audit found
  // all three evaded the previous pattern. This is a DIAGNOSTIC helper; the
  // absolute invariant is the raw scan, which parses no HTML at all and so
  // cannot be evaded this way.
  const blocks = [...html.matchAll(
    /<script\b[^>]*\btype\s*=\s*(?:"module"|'module'|module\b)[^>]*>([\s\S]*?)<\/script>/gi,
  )].map(m => m[1]);
  if (!blocks.length) throw new Error('index.html carries no inline module');
  return blocks;
}

function inlineModuleCode(html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8')) {
  return inlineModuleBlocks(html).map(src => {
    const kind = classify(src);
    let out = '';
    for (let i = 0; i < src.length; i++) out += kind[i] === COMMENT ? ' ' : src[i];
    return out;
  }).join('\n');
}

describe('the optional gender field — no downstream surface reads it', () => {
  const without = buildProfile(GENDER_NAME, GENDER_DOB, GENDER_OPTS);
  const withF = buildProfile(GENDER_NAME, GENDER_DOB, { ...GENDER_OPTS, gender: 'female' });
  const withM = buildProfile(GENDER_NAME, GENDER_DOB, { ...GENDER_OPTS, gender: 'male' });

  it('resolves every coordinate — no cell compares one empty field to another', () => {
    // The anti-vacuity pin for the whole suite. If the fixture is ever
    // thinned back to `{ time }`, rising and moon go unresolved and their
    // compartments compare `—` to `—`; this fails first and says why.
    for (const p of [without, withF, withM]) {
      expect(typeof p.risingSign, 'rising must RESOLVE — fixture needs tz+lat+lng').toBe('string');
      expect(typeof p.moonSign, 'moon must RESOLVE — fixture needs tz+lat+lng').toBe('string');
      expect(p.hourPillar, 'hour pillar must resolve — fixture needs a birth time').toBeTruthy();
      expect(
        CELL_KEYS.map(k => cellRenderState(p, k, true).state),
        'every compartment must carry a value, so none can compare — to —'
      ).toEqual(CELL_KEYS.map(() => 'value'));
    }
    // And the three profiles really do differ in the one field under test.
    expect([without.gender, withF.gender, withM.gender])
      .toEqual([undefined, 'female', 'male']);
  });

  it('covers every coordinate the sheet can show', () => {
    // A coordinate added to the sheet but not to CELL_KEYS (or the reverse)
    // would slip past the differential. The two lists are the same set.
    expect([...SHEET_ROWS.flat()].sort()).toEqual([...CELL_KEYS].sort());
  });

  for (const surface of GENDER_SURFACES) {
    it(`${surface.name} — identical across absent / female / male`, () => {
      const absent = surface.of(without);
      const female = surface.of(withF);
      const male = surface.of(withM);
      // Vacuity guards, before the comparison: the surface produced real
      // content, not null / '' / [] / an all-unresolved sweep.
      expect(absent, 'surface produced nothing').not.toBeNull();
      expect(JSON.stringify(absent).length, 'surface serialized to a trivial value')
        .toBeGreaterThan(20);
      expect(surface.probe(absent, without), 'surface did not produce its real content').toBe(true);
      expect(surface.probe(female, withF), 'surface did not produce its real content').toBe(true);
      expect(surface.probe(male, withM), 'surface did not produce its real content').toBe(true);
      // Both directions: a single comparison would still pass if a reader
      // keyed off "gender is present" without caring which value it held.
      expect(female, 'female differs from absent').toEqual(absent);
      expect(male, 'male differs from female').toEqual(female);
    });
  }

  it('the local archive is the ONE deliberate carrier — the input, never a derivation', () => {
    // §5.E: ui/readings.js stores gender so a reopened reading reproduces
    // the user's own input. That is a round-trip of the INPUT, and it is the
    // only place the token is allowed to survive. Everything else in the
    // record must be identical across the three variants.
    const record = p => compactReadingProfile({
      name: p.name, dob: GENDER_DOB, ...GENDER_OPTS, gender: p.gender,
    });
    const absent = record(without);
    const female = record(withF);
    const male = record(withM);
    expect(absent.gender).toBeUndefined();
    expect(female.gender).toBe('female');
    expect(male.gender).toBe('male');
    const strip = ({ gender, ...rest }) => rest;
    expect(Object.keys(strip(absent)).length, 'archive record is empty').toBeGreaterThan(4);
    expect(strip(female)).toEqual(strip(absent));
    expect(strip(male)).toEqual(strip(female));
  });

  it('no module outside the input path even names the field', () => {
    // The runtime differential above can only reach PURE exports. The
    // written entry is resolved inline in index.html's renderCard, so a
    // reader added there would be out of its reach. This closes that hole
    // statically: the property read `.gender` (and its computed form) may
    // appear ONLY where the field is collected, passed through, or archived.
    // LEXED, not regexed. This scan used `/\.gender\b|\[['"]gender['"]\]/`,
    // which sees a property access and nothing else — a red-team put
    // `const { gender } = …` into ui/result.js and the suite stayed green.
    // That is the same defect the renderCard guard below was just repaired
    // for, one directory over, so it gets the same repair: comments blanked,
    // everything executable or literal scanned, identifier matched in any
    // form and any casing (so the accessor's own name counts too).
    const ALLOWED = new Set([
      'core/profile.js',   // the passthrough — carried, never consumed
      'ui/profile.js',     // the form control and the write seam
      'ui/readings.js',    // the §5.E archive round-trip
    ]);
    const scanned = [...jsFilesUnder('core'), ...jsFilesUnder('ui')];
    const offenders = [];
    for (const rel of scanned) {
      if (ALLOWED.has(rel)) continue;
      const hits = genderMentionsInSource(readFileSync(join(__dirname, '..', rel), 'utf-8')).length;
      if (hits) offenders.push(`${rel} (${hits})`);
    }
    // The recursion is unexercised by core/ and ui/, which are FLAT — so it is
    // pinned against a directory that genuinely nests. Without this, the walk
    // could stop descending and nothing here would notice.
    const nested = jsFilesUnder('tests');
    expect(nested, 'jsFilesUnder does not descend into subdirectories')
      .toContain('tests/helpers/js-lex.js');

    // The scan must actually have reached the corpus it claims to cover.
    expect(scanned.length, 'the recursive scan found no modules — it is not scanning what it claims')
      .toBeGreaterThanOrEqual(20);
    for (const allowed of ALLOWED) {
      expect(scanned, `the allow-list names ${allowed}, which the scan did not reach`).toContain(allowed);
    }
    expect(
      offenders,
      'a module outside the input path names gender — §1.D v0.67 leaves the field with no calculation or output reader'
    ).toEqual([]);
  });

  // ── the render path, guarded by IDENTIFIER not by property syntax ──
  //
  // The scan above matches `.gender` and `['gender']`. A destructured read
  // matches neither:
  //
  //     const { gender } = profile;
  //     cardName.textContent = gender === 'female' ? 'f-' + cell.name : cell.name;
  //
  // That changes what the card displays, and it passed every test in this
  // file — verified by counterexample, not assumed. `renderCard` lives in
  // index.html's inline module and no harness executes it, so the runtime
  // matrix above cannot reach it either. This closes the hole by rejecting
  // the IDENTIFIER in any form inside renderCard's body.
  // A SECONDARY DIAGNOSTIC — the raw allowlist above is the primary guard and
  // this label was left stale when the claim moved. Its value is module-WIDE
  // scope: a reader could sit in any helper of the inline module, not only in
  // renderCard, and this says which line carries it. `core/` and `ui/` are
  // covered by the scan above. Two lines survive the lexer, both on the
  // collection path — but the ABSOLUTE claim rests on the raw scan, not here.
  // PRIMARY. Raw, fail-closed, lexer-free — see RAW_GENDER_ALLOW above for
  // why this and not the lexical guards carries the absolute claim.
  it('every raw mention of the field in the corpus is on the allowlist', () => {
    const corpus = ['index.html', ...jsFilesUnder('core'), ...jsFilesUnder('ui')];
    expect(corpus.length, 'the corpus walk found nothing').toBeGreaterThanOrEqual(20);
    for (const rel of corpus) {
      const found = readFileSync(join(__dirname, '..', rel), 'utf-8')
        .split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));
      expect(
        found,
        `${rel}: a gender mention is not on the allowlist. If it is a genuine `
        + `read, that is the bug. If it is copy or a comment, add it verbatim `
        + `to RAW_GENDER_ALLOW — never relax the matcher.`
      ).toEqual(RAW_GENDER_ALLOW[rel] || []);
    }
    // The allowlist must not name a file the walk never visits, or an entry
    // could silently stop being checked.
    for (const rel of Object.keys(RAW_GENDER_ALLOW)) {
      expect(corpus, `RAW_GENDER_ALLOW names ${rel}, which the corpus walk missed`).toContain(rel);
    }
  });

  // The allowlist pins line TEXT; this pins the collection line's PLACE.
  // Without it, deleting the legitimate submit-seam line and putting the
  // identical text inside a render-path helper leaves the raw inventory
  // byte-identical while the field starts driving the card — reproduced, and
  // pinned below as a counter-case.
  const SUBMIT_REGION = ["profileForm.addEventListener('submit', e => {",
    "tryAnotherBtn.addEventListener('click', () => {"];
  const COLLECTION_LINE = 'const g = getGenderInput(); if (g) opts.gender = g;';

  function submitRegionOf(html) {
    const a = html.indexOf(SUBMIT_REGION[0]);
    const b = html.indexOf(SUBMIT_REGION[1]);
    expect(a, 'submit handler anchor moved').toBeGreaterThan(-1);
    expect(b, 'try-another anchor moved').toBeGreaterThan(a);
    return html.slice(a, b);
  }

  it('the collection line lives INSIDE the submit handler, not merely in the file', () => {
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const region = submitRegionOf(html);
    // Exactly once, inside the region…
    expect(region.split(COLLECTION_LINE).length - 1,
      'the collection line is not in the submit handler exactly once').toBe(1);
    // …and nowhere else in the file.
    expect(html.split(COLLECTION_LINE).length - 1,
      'the collection line appears outside the submit handler').toBe(1);
  });

  it('a relocation of the collection line into a render helper is caught', () => {
    // The exact repro: same text, different place. The raw inventory does not
    // move, so only the region pin can see this.
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const moved = html
      .replace(`  ${COLLECTION_LINE}\n`, '')
      .replace(RENDER_CARD_SIG,
        `function displayName(cell, opts) {\n  ${COLLECTION_LINE}\n`
        + `  return g ? "f-" + cell.name : cell.name;\n}\n${RENDER_CARD_SIG}`);
    expect(moved, 'the relocation did not apply — anchors moved').not.toBe(html);

    // The raw inventory really is unchanged — this is why the pin is needed.
    const inv = src => src.split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));
    expect(inv(moved), 'premise broken: the raw inventory DID change')
      .toEqual(inv(html));

    // …and the region pin catches it.
    expect(submitRegionOf(moved).split(COLLECTION_LINE).length - 1,
      'the collection line was moved out of the submit handler undetected').toBe(0);
  });

  it('the raw allowlist catches what every lexical guard missed', () => {
    // The exact bypass that defeated the lexer: valid JS, executes, changes
    // the card, and both lexical guards reported clean.
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const mutated = html.replace(
      'cardName.textContent = cell.name;',
      // exec("/") — a GUARANTEED match. The audit's original fixture used
      // exec(cell.name), but no card name in the 144-cell deck contains a
      // slash, so the spread of a null result throws before the gender branch
      // is ever reached. The bypass is real; the evidence for it has to
      // actually run.
      'const spread = [.../[//]/.exec("/")]; '
      + 'cardName.textContent = spread.length && profile.gender ? "f" : cell.name;',
    );
    expect(mutated, 'the mutation did not apply — anchor moved').not.toBe(html);
    const raw = mutated.split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));
    expect(raw, 'the raw scan missed a spelled read').not.toEqual(RAW_GENDER_ALLOW['index.html']);
    // …and the lexical guard genuinely does miss it, which is why raw is primary.
    expect(genderTokensIn(functionBody(mutated, RENDER_CARD_SIG)),
      'the lexer no longer misses this — the limitation note above needs updating').toEqual([]);
  });

  // SECONDARY DIAGNOSTIC, not the guarantee. Narrower claim: it locates a
  // spelled read and says where, which a raw line list cannot.
  it('diagnostic: the inline module touches gender on exactly TWO code lines', () => {
    // NO word boundary, deliberately. `\bgender\b` let `getGenderInput()`
    // through, and a red-team used exactly that: calling the form's own getter
    // from inside renderCard reads the live control and changes the card while
    // naming no property at all. That is ordinary code a maintainer could
    // write by accident, not obfuscation, so the matcher has to be loose
    // enough to see the accessor's own name.
    const lines = inlineModuleCode()
      .split('\n')
      .map(l => l.trim())
      .filter(l => new RegExp(GENDER_RE.source, 'i').test(l));
    expect(
      lines.length,
      `index.html gained a gender touchpoint — the field is collected and forwarded, never read:\n${lines.join('\n')}`
    ).toBe(2);
    expect(lines[0], 'the accessor must be imported exactly once')
      .toMatch(/^import \{[^}]*\bgetGenderInput\b[^}]*\} from '\.\/ui\/profile\.js';$/);
    expect(lines[1], 'the accessor must be CALLED exactly once, at the submit seam')
      .toBe('const g = getGenderInput(); if (g) opts.gender = g;');
  });

  it('renderCard itself names gender in NO form — property, computed, or destructured', () => {
    expect(
      genderTokensIn(renderCardBody()),
      'renderCard names `gender` — the written entry must not read the field (§1.D v0.67)'
    ).toEqual([]);
  });

  // ── the counter-cases: proof the guard has teeth ──────────────────
  //
  // Each mutation is applied to the REAL index.html and re-extracted through
  // the real lexer, so these exercise the shipped guard rather than a copy of
  // it. Every one changes what the card visibly displays.
  //
  // The first three defeated earlier versions of this guard, and the last two
  // defeated its extraction step rather than its matcher — a `}` in a comment
  // or a string truncated the brace match, and anything after it stopped being
  // scanned at all.
  const ANCHOR = 'cardName.textContent = cell.name;';
  const READER_FORMS = [
    ['dot access', `cardName.textContent = profile.gender ? 'f-' + cell.name : cell.name;`],
    ['computed key, double quotes', `cardName.textContent = profile["gender"] ? cell.name : "x";`],
    ['computed key, single quotes', `cardName.textContent = profile['gender'] ? cell.name : 'x';`],
    ['computed key, template', 'cardName.textContent = profile[`gender`] ? cell.name : `x`;'],
    ['template interpolation', 'cardName.textContent = `${profile["gender"]} ${cell.name}`;'],
    ['destructured', `const { gender } = profile; cardName.textContent = gender ? 'f' : cell.name;`],
    ['destructured with alias', `const { gender: g2 } = profile; cardName.textContent = g2 ? 'f' : cell.name;`],
    ['after a brace-bearing string', `const pad = "}}}}"; cardName.textContent = pad && profile["gender"] ? 'f' : cell.name;`],
  ];

  for (const [name, reader] of READER_FORMS) {
    it(`the guard catches a reader written as: ${name}`, () => {
      const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
      const mutated = html.replace(ANCHOR, reader);
      expect(mutated, 'the mutation did not apply — anchor line moved').not.toBe(html);
      expect(
        genderTokensIn(renderCardBody(mutated)),
        `a ${name} reader slipped past the guard`,
      ).not.toEqual([]);
    });
  }

  // The bypass a red-team found against the word-boundary version, and the
  // most important one here because it is not obfuscation: renderCard calls
  // the form's own getter, reads the live control, and changes the card
  // without naming a property. Both new touchpoints (the call, and any import
  // it would need) trip the module-wide count.
  it('the guard catches renderCard calling getGenderInput() directly', () => {
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const mutated = html.replace(
      'cardType.textContent = cell.type;',
      `cardType.textContent = (getGenderInput() === 'female' ? 'she of ' : '') + cell.type;`,
    );
    expect(mutated, 'the mutation did not apply — anchor line moved').not.toBe(html);
    const lines = inlineModuleCode(mutated)
      .split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));
    expect(lines.length, 'a getGenderInput() call inside renderCard went unnoticed').toBeGreaterThan(2);
  });

  it('a comment quoting the signature cannot hijack the extraction', () => {
    // Locating the signature by plain indexOf let a comment that QUOTED it
    // redirect the brace match to an earlier, unrelated block — the extracted
    // "body" collapsed to a 66-character argument list. The signature is now
    // located in CODE only.
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const real = renderCardBody(html).body.length;
    const decoyed = html.replace(
      'const cityInput',
      `// Render entry point: \`${RENDER_CARD_SIG}\` — see below.\n  const cityInput`,
    );
    expect(decoyed, 'the decoy did not apply — anchor moved').not.toBe(html);
    expect(renderCardBody(decoyed).body.length).toBe(real);
  });

  it('a `}` inside a comment cannot truncate the extraction', () => {
    // The regex version brace-matched before stripping comments, so this
    // collapsed renderCard's body from 3348 characters to 4 and every reader
    // below it fell outside the guard entirely.
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    const real = renderCardBody(html).body.length;
    const withBraces = renderCardBody(html.replace(RENDER_CARD_SIG, `${RENDER_CARD_SIG} // }}}}`));
    expect(withBraces.body.length).toBeGreaterThanOrEqual(real);
    // …and a reader hidden after that comment is still caught.
    const mutated = html
      .replace(RENDER_CARD_SIG, `${RENDER_CARD_SIG} // }}}}`)
      .replace(ANCHOR, `cardName.textContent = profile["gender"] ? 'f' : cell.name;`);
    expect(genderTokensIn(renderCardBody(mutated))).not.toEqual([]);
  });

  it('the superseded matcher returned clean on these same forms', () => {
    // Names the regression precisely rather than implying the guard was
    // always this strong. This is the PREVIOUS implementation, verbatim, and
    // its defect is the ORDER: it stripped string literals before matching,
    // so a computed key's `"gender"` was blanked to `""` and a whole template
    // literal disappeared with its interpolation inside it.
    const supersededGuard = source => (source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
      .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""')
      .match(/\bgender\b/gi) || []);

    const defeatedIt = [
      `cardName.textContent = profile["gender"] ? cell.name : "x";`,
      'cardName.textContent = `${profile["gender"]} ${cell.name}`;',
      'cardName.textContent = profile[`gender`] ? cell.name : `x`;',
    ];
    for (const form of defeatedIt) {
      expect(supersededGuard(form), `superseded guard should have missed: ${form}`).toEqual([]);
      expect(genderTokens({ body: form, kind: classify(form) }), `current guard misses: ${form}`)
        .not.toEqual([]);
    }
    // The destructured form is the one it DID catch — included so this test
    // documents the boundary of the old defect rather than overstating it.
    expect(supersededGuard('const { gender } = profile;')).not.toEqual([]);
  });

  // ── what this guard does NOT guarantee ────────────────────────────
  //
  // Written down because this repo has now shipped an overclaimed coverage
  // statement three times, and the honest limit is more useful than a
  // confident one.
  //
  // These are STATIC guards. They stop an ACCIDENT, not an adversary — no
  // static check of any kind closes the class below, because none of these
  // forms writes the identifier at all, so even the raw allowlist cannot see
  // them. A red-team pass got past every guard here with:
  //   - a runtime-built key — `profile['gen' + 'der']`
  //   - a Unicode escape inside the property name
  //   - value scanning that never names the key — `Object.values(profile).includes('female')`
  // Each executes and changes the card, and none writes the identifier. No
  // lexical check can close that class; only executing renderCard could, and
  // it cannot be executed from vitest (it lives in the inline module, and §12
  // forbids jsdom).
  //
  // WHICH GUARD CARRIES WHICH CLAIM — the distinction three audits forced:
  //
  //   RAW allowlist (primary)  every line of the corpus containing the
  //                            identifier is pinned verbatim. Parses nothing,
  //                            so no syntax confusion can hide a read. THIS
  //                            is what carries "every spelled read fails".
  //   LEXICAL guards (secondary)  locate a read and say where — which a line
  //                            list cannot — but a hand lexer cannot enumerate
  //                            every ES position a regex may begin in, and
  //                            three rounds proved it. They make no absolute
  //                            claim and a counter-case above pins one of
  //                            their known blind spots so the split stays
  //                            honest.
  //
  // The runtime differential over the pure surfaces remains the real
  // guarantee; both of these are the fence around what it cannot reach.
  //
  // It FAILS CLOSED, and that is a deliberate trade. A red-team confirmed
  // prospective false positives: innocent user-visible copy, an aria-label, a
  // CSS class or a data attribute containing the word would all trip it. None
  // exists today. When one is genuinely wanted, the fix is to add it to the
  // pinned lines above — a deliberate, reviewed act — not to loosen the
  // matcher. A guard that occasionally asks a human to look is worth far more
  // than one that quietly misses a reader.
  it('index.html carries exactly ONE inline module — and the guard reads them all anyway', () => {
    // Both halves matter. The count is a §6 single-file invariant worth
    // knowing about if it ever moves; the guard no longer DEPENDS on it,
    // because inlineModuleCode concatenates every block instead of matching
    // the first — an audit flagged that a second module would have evaded it.
    expect(inlineModuleBlocks()).toHaveLength(1);
    // A UNIQUE sentinel, not `gender`: the baseline already contains the word,
    // so asserting on it proved nothing about whether the second block was
    // read at all. An audit caught that.
    const SENTINEL = 'ZZ_SECOND_MODULE_SENTINEL_ZZ';
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
    expect(inlineModuleCode(html), 'sentinel must not pre-exist').not.toContain(SENTINEL);
    for (const spelling of [
      `<script type="module">const ${SENTINEL} = 1;</script>`,
      `<script type=module>const ${SENTINEL} = 1;</script>`,
      `<script type = "module">const ${SENTINEL} = 1;</script>`,
      `<script TYPE="module">const ${SENTINEL} = 1;</script>`,
    ]) {
      const two = html.replace('</script>', `</script>\n${spelling}`);
      expect(inlineModuleBlocks(two), `not reading: ${spelling.slice(0, 34)}`).toHaveLength(2);
      expect(inlineModuleCode(two), `not scanning: ${spelling.slice(0, 34)}`).toContain(SENTINEL);
    }
  });

  it('the lexer resolves regex-vs-division without swallowing live code', () => {
    // Every case here defeated an earlier version of the lexer, and every one
    // is ordinary JavaScript rather than an attack.
    const cases = [
      ['regex containing a brace', 'function f(p) {\n  s.replace(/\\}/g, "");\n  const { gender } = p; return gender;\n}'],
      ['regex character class brace', 'function f(p) {\n  s.replace(/[}]/g, "");\n  const { gender } = p; return gender;\n}'],
      ['regex opening brace', 'function f(p) {\n  s.replace(/{/g, "");\n  const { gender } = p; return gender;\n}'],
      ['regex after if() with //', 'function f(p) {\n  if (p.x) /[//]/.test(p.x);\n  const { gender } = p; return gender;\n}'],
      ['regex after if() with /*', 'function f(p) {\n  if (p.x) /[/*]/.test(p.x);\n  const { gender } = p; if (gender) { p.y = 1; }\n  q.replace(/[*\\/]+$/, "");\n}'],
      ['escaped slash after if()', 'function f(p) {\n  if (p.x) /\\//.test(p.x);\n  const g2 = p.gender ? "f" : "";\n  return g2;\n}'],
      ['identifier containing a keyword', 'function f(p) {\n  const plain = 4; const r = plain / 2 /* } */;\n  const { gender } = p; return gender ? r : 0;\n}'],
    ];
    for (const [name, src] of cases) {
      const extracted = functionBody(src, src.slice(0, src.indexOf('{') + 1));
      expect(genderTokensIn(extracted), `${name}: the reader was swallowed`).not.toEqual([]);
    }

    // …and plain division must NOT be read as a regex, or the lexer swallows
    // real code in the other direction.
    const division = 'function f(a) {\n  const inx = 10; const r = inx / 2; const z = a / 3;\n  return r + z;\n}';
    expect(functionBody(division, 'function f(a) {').body, 'division was lexed as a regex')
      .toContain('return r + z;');
    expect(genderTokensIn(functionBody(division, 'function f(a) {'))).toEqual([]);

    // The regex-start decision itself, at the boundary that caused the bug.
    for (const [tok, expected] of [['plain', false], ['in', true], ['of', true],
      ['do', true], ['return', true], ['instanceof', true], ['x', false], [')', false]]) {
      expect(startsRegex(tok), `startsRegex(${JSON.stringify(tok)})`).toBe(expected);
    }
  });

  it('the module scan catches every spelled form, comments excepted', () => {
    // The scan that covers core/ and ui/, exercised directly. Its previous
    // property-only regex missed the first of these in ui/result.js while the
    // whole suite stayed green.
    const caught = [
      'export function f(p) { const { gender } = p; return gender ? 1 : 0; }',
      `export function f(p) { return p['gender']; }`,
      'export function f(p) { return p["gender"]; }',
      'export function f(p) { return p.gender; }',
      'export function f(p) { const { gender: g } = p; return g; }',
      'export function f() { return getGenderInput(); }',
      'export function f(p) { return `${p["gender"]}`; }',
    ];
    for (const src of caught) {
      expect(genderMentionsInSource(src), `missed: ${src}`).not.toEqual([]);
    }
    // A comment is the one place the word is harmless, and near-misses must
    // not trip it — otherwise the scan is noise and gets disabled.
    expect(genderMentionsInSource('// gender is never read here\nexport const x = 1;')).toEqual([]);
    expect(genderMentionsInSource('/* the gender field */ export const x = 1;')).toEqual([]);
  });

  it('states its own limits — the escape hatches are known and recorded', () => {
    // Pinned so the limitation cannot be quietly dropped from the comment
    // above while the claim elsewhere stays absolute.
    const self = readFileSync(fileURLToPath(import.meta.url), 'utf-8');
    // The primary/secondary split must stay written down: an absolute claim
    // parked on the lexical guards is what three audits kept having to undo.
    expect(self, 'the raw allowlist must be named as the primary guard')
      .toMatch(/RAW allowlist \(primary\)/);
    expect(self, 'the lexical guards must be named as secondary')
      .toMatch(/LEXICAL guards \(secondary\)/);
    expect(self, 'the accident-not-adversary limit must stay stated')
      .toMatch(/stop an ACCIDENT, not an adversary/);
    expect(self).toMatch(/runtime-built key/);
    // And the escape hatches really do escape — asserted, not just described,
    // so this stays true only as long as the statement above is accurate.
    const evade = [
      `profile['gen' + 'der']`,
      `Object.values(profile).includes('female')`,
      // Named in the prose above and previously unasserted, which an audit
      // caught: `profile.gend\u0065r` is a valid read of the same property.
      'profile.gend\\u0065r',
    ];
    for (const form of evade) {
      expect(genderTokens({ body: form, kind: classify(form) }), form).toEqual([]);
    }
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
    // Widening to the masters must not widen to every double-digit value.
    expect(() => resolveBracket(12)).toThrow(/Unknown life path value: 12/);
    expect(() => resolveBracket(44)).toThrow(/Unknown life path value: 44/);
  });

  it('covers the whole terminal domain, with no value left unbracketed', () => {
    // The fixture list is enumerated; this is the pin that the enumeration is
    // COMPLETE. A value the calculator can produce but the bracket table has
    // no group for would throw inside a paid render.
    expect(fixtures.brackets.map(c => c.lp)).toEqual([...TERMINAL_NUMBERS]);
    for (const lp of TERMINAL_NUMBERS) {
      expect(['low', 'mid', 'high'], `LP ${lp}`).toContain(resolveBracket(lp));
    }
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

  // ── HKO authority-pin corrections (2026-07-29 deep-audit, P1-D) ─────────
  // An exhaustive sweep of all 200 years 1901-2100 against the Hong Kong
  // Observatory's official published tables (2,400 solar-boundary
  // comparisons + 200 lunar-new-year comparisons) found eight solar
  // boundaries where this module's low-accuracy solar-longitude formula
  // (documented ~0.01°, ch25) computed a crossing one day early — all eight
  // land within about 15 minutes of local midnight, where that documented
  // error budget is enough to flip the assigned calendar day.
  // core/calendar.js corrects these eight via HKO_SOLAR_TERM_CORRECTIONS, a
  // narrow table sourced directly from the HKO 1901-2100 text-calendar
  // index (https://www.hko.gov.hk/en/gts/time/calendar/text/files/
  // T<year>e.txt). Each pin below is a positive control (the exact
  // corrected date) paired with a preceding-day negative control through
  // getInnerAnimal — the actual consumer-facing cusp function — so a
  // regression that reverts the date OR breaks the >= cusp comparison in
  // getInnerAnimal both fail here, not just a raw-date check in isolation.
  describe('HKO authority-pin corrections — all eight, exact date + cusp', () => {
    const HKO_CORRECTIONS = [
      { year: 1911, index: 3, term: 'lixia', boundary: [5, 7], dayBefore: [5, 6],
        boundaryAnimal: 'snake', beforeAnimal: 'dragon' },
      { year: 1912, index: 8, term: 'hanlu', boundary: [10, 9], dayBefore: [10, 8],
        boundaryAnimal: 'dog', beforeAnimal: 'rooster' },
      { year: 1912, index: 11, term: 'xiaohan', boundary: [1, 7], dayBefore: [1, 6],
        boundaryAnimal: 'ox', beforeAnimal: 'rat' },
      { year: 2014, index: 1, term: 'jingzhe', boundary: [3, 6], dayBefore: [3, 5],
        boundaryAnimal: 'rabbit', beforeAnimal: 'tiger' },
      { year: 2016, index: 5, term: 'xiaoshu', boundary: [7, 7], dayBefore: [7, 6],
        boundaryAnimal: 'goat', beforeAnimal: 'horse' },
      { year: 2045, index: 5, term: 'xiaoshu', boundary: [7, 7], dayBefore: [7, 6],
        boundaryAnimal: 'goat', beforeAnimal: 'horse' },
      { year: 2047, index: 1, term: 'jingzhe', boundary: [3, 6], dayBefore: [3, 5],
        boundaryAnimal: 'rabbit', beforeAnimal: 'tiger' },
      { year: 2097, index: 3, term: 'lixia', boundary: [5, 5], dayBefore: [5, 4],
        boundaryAnimal: 'snake', beforeAnimal: 'dragon' },
    ];

    for (const c of HKO_CORRECTIONS) {
      it(`${c.year} ${c.term} (index ${c.index}) → ${c.boundary.join('-')}, per HKO T${c.year}e.txt`, () => {
        expect(monthAnimalSolarTerm(c.year, c.index)).toEqual(c.boundary);
      });
      it(`${c.year} ${c.term}: the boundary day is IN the new month (${c.boundaryAnimal})`, () => {
        expect(getInnerAnimal(c.year, c.boundary[0], c.boundary[1])).toBe(c.boundaryAnimal);
      });
      it(`${c.year} ${c.term}: the day before is STILL the previous month (${c.beforeAnimal})`, () => {
        expect(getInnerAnimal(c.year, c.dayBefore[0], c.dayBefore[1])).toBe(c.beforeAnimal);
      });
    }
  });

  // ── the vacuous 1927 bailu case, replaced (2026-07-29 deep-audit) ───────
  // tests/public.test.js's fixture-coverage check previously asserted only
  // 1927-09-09. PR #140 moved 1927 bailu to Sep 8 (confirmed against HKO
  // T1927e.txt — already correct on main, no code change here); a birth on
  // Sep 9 lands after the boundary whether the cutoff is the old wrong date
  // or the corrected one, so that date cannot distinguish the two. Sep 7
  // (before either candidate) and Sep 8 (exactly the corrected boundary) do.
  describe('1927 bailu — discriminating Sep 7 / Sep 8 coverage (replaces vacuous Sep 9)', () => {
    it('monthAnimalSolarTerm(1927, 7) bailu → [9, 8], per HKO T1927e.txt', () => {
      expect(monthAnimalSolarTerm(1927, 7)).toEqual([9, 8]);
    });
    it('1927-09-08 is IN rooster month (bailu reached)', () => {
      expect(getInnerAnimal(1927, 9, 8)).toBe('rooster');
    });
    it('1927-09-07 is STILL monkey month (bailu not yet reached)', () => {
      expect(getInnerAnimal(1927, 9, 7)).toBe('monkey');
    });
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
    // PR #101 MED-2 + PR #104 codex absorb: a future cards.v2 deck (§4 —
    // new release = new file) must not ship unscanned while this file greens
    // on v1. The expected specifier is derived from THIS file's own static
    // deck import — not a free-floating literal — so updating the runtime
    // (index.html, the sole importer) without moving the scan's import
    // fails, and vice versa.
    const family = /from\s+['"]\.{1,2}\/content\/(cards\.[\w.]+\.js)['"]/g;
    const own = [...readFileSync(fileURLToPath(import.meta.url), 'utf-8').matchAll(family)]
      .map(match => match[1]);
    const runtime = [...readFileSync(join(__dirname, '..', 'index.html'), 'utf-8').matchAll(family)]
      .map(match => match[1]);
    expect(own.length).toBeGreaterThan(0);
    expect(runtime.length).toBeGreaterThan(0);
    for (const specifier of [...own, ...runtime]) expect(specifier).toBe(own[0]);
  });
});
