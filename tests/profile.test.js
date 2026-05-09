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
//  3. Banned-pattern + banned-voice-register policy — preserved here as the
//     canonical rule reference. As of v0.2.0 the card content moved to
//     `~/dev/8ball-private/cards.v1.full.js`, so the scan over the shipped
//     CARDS pool runs on the private content-authoring pipeline; the policy
//     constants live in this file so doctrine and code stay co-located.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  buildProfile,
  getNameNumber, getNameNumberSum,
  getSunSign,
  getAnimal,
  getInnerAnimal,
  getChineseElement,
  getLifePath, getLifePathSum,
  getSoulUrge, getSoulUrgeSum
} from '../core/profile.js';
import { getCard, resolveBracket } from '../core/engine.js';

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

// Note: the banned-pattern and banned-voice-register scans previously
// walked the CARDS pool (content/cards.v1.js). As of v0.2.0 the card
// content is private (paid layer) and not present in the public
// runtime; those scans now run on the private side as part of the
// content-authoring pipeline, not in this public test suite. The
// regex tables below are kept here so the rules remain visible in
// the public repo as enforced policy, even though the public test
// suite no longer has content to scan.

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
  it('chinese element pre-CNY adjustment: 1996-01-15 → wood (resolves to 1995)', () => {
    expect(getChineseElement(1996, 1, 15)).toBe('wood');
  });
  it('chinese element pre-CNY adjustment: 1996-02-04 → fire (resolves to 1996)', () => {
    expect(getChineseElement(1996, 2, 4)).toBe('fire');
  });

  // Inner animal (month-pillar). Twelve solar-term-anchored windows;
  // each window has a fixed-date cutoff approximation per v1 calc.
  // Verify the cutoff boundary for each animal — at-cutoff = new
  // animal, day-before-cutoff = previous animal.
  it('inner animal: tiger month (feb 4 cutoff)', () => {
    expect(getInnerAnimal(2, 4)).toBe('tiger');
    expect(getInnerAnimal(2, 3)).toBe('ox');
    expect(getInnerAnimal(3, 5)).toBe('tiger');
  });
  it('inner animal: rabbit month (mar 6 cutoff)', () => {
    expect(getInnerAnimal(3, 6)).toBe('rabbit');
    expect(getInnerAnimal(4, 4)).toBe('rabbit');
  });
  it('inner animal: dragon month (apr 5 cutoff)', () => {
    expect(getInnerAnimal(4, 5)).toBe('dragon');
    expect(getInnerAnimal(5, 5)).toBe('dragon');
  });
  it('inner animal: snake month (may 6 cutoff)', () => {
    expect(getInnerAnimal(5, 6)).toBe('snake');
  });
  it('inner animal: horse month (jun 6 cutoff)', () => {
    expect(getInnerAnimal(6, 6)).toBe('horse');
  });
  it('inner animal: goat month (jul 7 cutoff)', () => {
    expect(getInnerAnimal(7, 7)).toBe('goat');
  });
  it('inner animal: monkey month (aug 8 cutoff)', () => {
    expect(getInnerAnimal(8, 8)).toBe('monkey');
    expect(getInnerAnimal(9, 7)).toBe('monkey');
  });
  it('inner animal: rooster month (sep 8 cutoff)', () => {
    expect(getInnerAnimal(9, 8)).toBe('rooster');
    expect(getInnerAnimal(9, 23)).toBe('rooster');
  });
  it('inner animal: dog month (oct 8 cutoff)', () => {
    expect(getInnerAnimal(10, 8)).toBe('dog');
  });
  it('inner animal: pig month (nov 7 cutoff)', () => {
    expect(getInnerAnimal(11, 7)).toBe('pig');
    expect(getInnerAnimal(12, 6)).toBe('pig');
  });
  it('inner animal: rat month (dec 7 cutoff, wraps year)', () => {
    expect(getInnerAnimal(12, 7)).toBe('rat');
    expect(getInnerAnimal(12, 31)).toBe('rat');
    expect(getInnerAnimal(1, 5)).toBe('rat');
  });
  it('inner animal: ox month (jan 6 cutoff)', () => {
    expect(getInnerAnimal(1, 6)).toBe('ox');
    expect(getInnerAnimal(2, 3)).toBe('ox');
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
      // Card content fields (name, type, habit, note) are empty strings
      // in v0.2.0 — the public engine computes catalog only. Full card
      // content is the future paid layer; its banned-pattern and voice-
      // register scans run on the private side, not in this suite.
      expect(card.name).toBe('');
      expect(card.type).toBe('');
      expect(card.habit).toBe('');
      expect(card.note).toBe('');
      expect(resolveBracket(profile.lifePath)).toBe(c.expected.bracket);
    });
  }
});

// Note: BANNED_PATTERNS and BANNED_VOICE_REGISTER tables above remain
// in this public file as the canonical policy. The scans that walked
// CARDS content (banned-pattern check, voice-register check) ran here
// in v0.1.x; as of v0.2.0 the card content is private and those scans
// run on the private content-authoring side. The public test suite no
// longer has card strings to walk.
