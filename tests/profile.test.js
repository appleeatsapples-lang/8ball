// 8ball / tests / profile.test.js
// Run with: npm test
//
// Two suites:
//  1. Calculation contract — fixtures.json must match core/profile.js exactly.
//     If a fixture fails, either the algorithm changed (intentional → update fixture
//     + bump the calc-version note in DOCTRINE.md) or it broke (unintentional → fix code).
//  2. Engine — generates answers, no token leakage, recent-buffer dedup works.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildProfile, getNameNumber, getSunSign, getAnimal, getLifePath } from '../core/profile.js';
import { generateAnswer, classifyQuestion } from '../core/engine.js';
import { TRAITS_SUN, TRAITS_ANIMAL, TRAITS_LP } from '../content/traits.v1.js';
import {
  TEMPLATES_NO_QUESTION, TEMPLATES_YES, TEMPLATES_NO, TEMPLATES_MAYBE
} from '../content/templates.v1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures.json'), 'utf-8'));

// Banned voice-register substrings — DOCTRINE.md §2.
// Bans the voice register, not the symbol-system nouns: "Aries", "rat",
// "life path 7", "Pythagorean" all stay legal; "the universe says",
// "your stars guide you", "destined for greatness" do not.
// Case-insensitive substring match per the brief's locked spec.
const BANNED_VOICE_REGISTER = [
  'the universe', 'your stars', 'destiny', 'destined', 'fated', 'fate',
  'cosmic', 'the cosmos', 'spiritual', 'mystic', 'mystical', 'psychic',
  'channel', 'channeling', 'aura', 'karma', 'manifest', 'manifestation',
  'third eye', 'soul mate', 'your guides', 'divine', 'sacred'
];

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

describe('engine — token leakage', () => {
  const profile = buildProfile('Tester', '2000-01-01');
  const recent = [];

  it('never emits raw template tokens', () => {
    for (let i = 0; i < 200; i++) {
      const ans = generateAnswer(profile, '', recent);
      expect(ans).not.toMatch(/\{[a-z_]+\}/);
      recent.push(ans);
      if (recent.length > 24) recent.shift();
    }
  });

  it('honours the recent-buffer dedup over a small window', () => {
    const local = [];
    const seen = new Map();
    for (let i = 0; i < 500; i++) {
      const ans = generateAnswer(profile, '', local);
      seen.set(ans, (seen.get(ans) || 0) + 1);
      local.push(ans);
      if (local.length > 24) local.shift();
    }
    // Coverage check: across 500 calls we should see > 80 unique strings.
    // If this drops, the trait/template combinatorics regressed.
    expect(seen.size).toBeGreaterThan(80);
  });

  it('classifies binary questions to yes/no/maybe', () => {
    const out = new Set();
    for (let i = 0; i < 30; i++) out.add(classifyQuestion('is this real'));
    expect([...out].every(x => ['yes', 'no', 'maybe'].includes(x))).toBe(true);
  });

  it('classifies empty question as none', () => {
    expect(classifyQuestion('')).toBe('none');
    expect(classifyQuestion('  ')).toBe('none');
  });

  it('respects the 120-char hex-window soft cap on >95% of answers', () => {
    const recent = [];
    let overCap = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const ans = generateAnswer(profile, '', recent);
      if (ans.length > 120) overCap++;
      recent.push(ans);
      if (recent.length > 24) recent.shift();
    }
    // Engine re-rolls up to 12 times; some pathological combinations may
    // still exceed if every candidate exceeds. Empirically this should be
    // well under 5%.
    expect(overCap / N).toBeLessThan(0.05);
  });
});

describe('content rules — automated subset', () => {
  // We can't fully encode "no slurs" in regex but we can catch obvious classes
  // and any pattern reviewers have flagged in past releases.
  const banned = [
    /\bretard(ed|ation)?\b/i,
    /\bidiot\b/i,
    /\b(insane|crazy|mental)\b/i,
    /\b(faggot|tranny)\b/i,
    /\bn[i1]gg[ae]r/i
  ];
  const profile = buildProfile('Tester', '2000-01-01');
  it('200 sample answers contain none of the banned patterns', () => {
    const recent = [];
    for (let i = 0; i < 200; i++) {
      const ans = generateAnswer(profile, '', recent);
      for (const re of banned) {
        expect(ans, `banned pattern ${re} matched: ${ans}`).not.toMatch(re);
      }
      recent.push(ans);
      if (recent.length > 24) recent.shift();
    }
  });
});

describe('content rules — banned voice register (DOCTRINE.md §2)', () => {
  function* allEntries() {
    for (const [bucket, arr] of Object.entries(TRAITS_SUN)) {
      for (const s of arr) yield { source: `TRAITS_SUN.${bucket}`, s };
    }
    for (const [bucket, arr] of Object.entries(TRAITS_ANIMAL)) {
      for (const s of arr) yield { source: `TRAITS_ANIMAL.${bucket}`, s };
    }
    for (const [bucket, arr] of Object.entries(TRAITS_LP)) {
      for (const s of arr) yield { source: `TRAITS_LP.${bucket}`, s };
    }
    const tpls = { TEMPLATES_NO_QUESTION, TEMPLATES_YES, TEMPLATES_NO, TEMPLATES_MAYBE };
    for (const [name, arr] of Object.entries(tpls)) {
      for (const s of arr) yield { source: name, s };
    }
  }

  for (const term of BANNED_VOICE_REGISTER) {
    it(`no pool entry contains "${term}"`, () => {
      const needle = term.toLowerCase();
      const hits = [];
      for (const { source, s } of allEntries()) {
        if (s.toLowerCase().includes(needle)) hits.push(`${source}: ${s}`);
      }
      expect(hits, `Banned voice-register term "${term}" found:\n${hits.join('\n')}`).toEqual([]);
    });
  }
});
