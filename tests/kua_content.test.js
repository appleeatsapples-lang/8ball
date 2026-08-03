// 8ball / tests / kua_content.test.js
// Run with: npm test
//
// Suites:
//  1. Registry shape — eight reachable kua keys (no 5), classical trigram
//     table pinned literally, east/west partition, frozen.
//  2. Register law — §1.G citation voice on every string: banned voice
//     register, zero second-person, no diagnostic framing, no slur
//     patterns, and the §12 no-oracle pin (no directional guidance).
//  3. Provenance — KUA_SOURCES names the source, the boundary, and the
//     post-2000 named limitation.
//  4. Core agreement — every value core/kua.js can produce has an entry.

import { describe, it, expect } from 'vitest';

import { KUA_TRIGRAMS, KUA_SOURCES } from '../content/kua.v1.js';
import { getKuaBoth } from '../core/kua.js';
import {
  BANNED_PATTERNS,
  DIAGNOSTIC_FRAMING_RE,
  SECOND_PERSON_RE,
  voiceRegisterHits,
} from './helpers/voice-register.js';

// The classical Eight Mansions table, pinned literally so a typo in the
// registry is a red test, not a shipped drift.
const CLASSICAL = {
  1: ['kan', 'water', 'north', 'east'],
  2: ['kun', 'earth', 'southwest', 'west'],
  3: ['zhen', 'wood', 'east', 'east'],
  4: ['xun', 'wood', 'southeast', 'east'],
  6: ['qian', 'metal', 'northwest', 'west'],
  7: ['dui', 'metal', 'west', 'west'],
  8: ['gen', 'earth', 'northeast', 'west'],
  9: ['li', 'fire', 'south', 'east'],
};

const allStrings = entry =>
  [entry.trigram, entry.glyph, entry.element, entry.direction, entry.group, entry.register, entry.body];

describe('kua registry shape', () => {
  it('carries exactly the eight reachable kua numbers — a raw 5 has no trigram', () => {
    expect(Object.keys(KUA_TRIGRAMS).map(Number).sort((a, b) => a - b))
      .toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
  });

  it('pins the classical trigram / element / seat / group table literally', () => {
    for (const [num, [trigram, element, direction, group]] of Object.entries(CLASSICAL)) {
      const entry = KUA_TRIGRAMS[num];
      expect(entry.trigram).toBe(trigram);
      expect(entry.element).toBe(element);
      expect(entry.direction).toBe(direction);
      expect(entry.group).toBe(group);
    }
  });

  it('partitions east {1,3,4,9} / west {2,6,7,8}', () => {
    const east = Object.entries(KUA_TRIGRAMS).filter(([, e]) => e.group === 'east').map(([k]) => Number(k));
    const west = Object.entries(KUA_TRIGRAMS).filter(([, e]) => e.group === 'west').map(([k]) => Number(k));
    expect(east.sort((a, b) => a - b)).toEqual([1, 3, 4, 9]);
    expect(west.sort((a, b) => a - b)).toEqual([2, 6, 7, 8]);
  });

  it('is frozen at the table and at every entry, with every field a non-empty string', () => {
    expect(Object.isFrozen(KUA_TRIGRAMS)).toBe(true);
    for (const entry of Object.values(KUA_TRIGRAMS)) {
      expect(Object.isFrozen(entry)).toBe(true);
      for (const s of allStrings(entry)) {
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
      }
      expect(entry.register).toMatch(/ · /); // two-part tag, §1.G shape
    }
  });
});

describe('register law (§1.G citation voice, §12 no-oracle)', () => {
  const corpus = [
    ...Object.values(KUA_TRIGRAMS).flatMap(allStrings),
    ...Object.values(KUA_SOURCES),
  ];

  it('every body cites the named tradition, never the reader', () => {
    for (const entry of Object.values(KUA_TRIGRAMS)) {
      expect(entry.body).toMatch(/^the eight mansions tradition /);
    }
  });

  it('carries no banned voice register, second person, diagnostic framing, or slur patterns', () => {
    for (const s of corpus) {
      expect(voiceRegisterHits(s)).toEqual([]);
      expect(s).not.toMatch(SECOND_PERSON_RE);
      expect(s).not.toMatch(DIAGNOSTIC_FRAMING_RE);
      for (const re of BANNED_PATTERNS) expect(s).not.toMatch(re);
    }
  });

  it('ships registry facts only — no directional guidance register', () => {
    // Eight Mansions' traditional auspicious/inauspicious directions are
    // oracle register and permanently out (§12). This is the mechanical pin.
    const GUIDANCE = /\b(auspicious|inauspicious|lucky|unlucky|favou?rable|unfavou?rable|should|avoid|face towards?|best direction)\b/i;
    for (const s of corpus) expect(s).not.toMatch(GUIDANCE);
  });
});

describe('provenance', () => {
  it('names the source, the Li Chun boundary, and the post-2000 named limitation', () => {
    expect(Object.isFrozen(KUA_SOURCES)).toBe(true);
    expect(KUA_SOURCES.kua).toMatch(/ba zhai ming jing/);
    expect(KUA_SOURCES.boundary).toMatch(/li chun/);
    expect(KUA_SOURCES.limitation).toMatch(/post-2000/);
  });
});

describe('core agreement', () => {
  it('every value core/kua.js produces across the calendar range has an entry', () => {
    for (let y = 1900; y <= 2100; y += 3) {
      const both = getKuaBoth(y, 7, 1);
      expect(KUA_TRIGRAMS[both.male.number]).toBeDefined();
      expect(KUA_TRIGRAMS[both.female.number]).toBeDefined();
    }
  });
});
