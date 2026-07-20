// tests/meanings_content.test.js
// content/meanings.v1.js + additive meanings.v2.js completeness and
// voice-register scan (DOCTRINE §2/§4).
// Imports the canonical BANNED_VOICE_REGISTER / BANNED_PATTERNS from the
// shared tests/helpers/voice-register.js rather than duplicating them — no
// drift possible by construction (contrast tests/lab_sun_order_drift.test.js's
// approach, which guarded a duplication that no longer exists post-lab-purge).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUN_SIGNS, ANIMALS } from '../core/profile.js';
import { MAJOR_ARCANA } from '../core/birthcard.js';
import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
} from '../content/meanings.v1.js';
import {
  ELEMENT_MEANINGS,
  NUMEROLOGY_MEANINGS,
  HARMONY_THEME_ALIASES,
  COORDINATE_CONTEXT,
} from '../content/meanings.v2.js';
import {
  BANNED_PATTERNS,
  BANNED_VOICE_REGISTER,
  DIAGNOSTIC_FRAMING_RE,
  INTERPRETATION_VERBS,
  SECOND_PERSON_RE,
  SUBSTRING_SAFELIST,
  voiceRegisterHits,
} from './helpers/voice-register.js';
// Pure exports only (no DOM at import time per §6): the assembled-output
// scan below runs the real builders, not a reimplementation.
import * as uiMeanings from '../ui/meanings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const meaningsUiJs = readFileSync(join(__dirname, '..', 'ui', 'meanings.js'), 'utf-8');

const HISTORICAL_LIFE_PATH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'];
const NUMEROLOGY_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function* currentMeaningStrings() {
  for (const [key, entry] of Object.entries(ELEMENT_MEANINGS)) {
    yield { path: `element.${key}.register`, text: entry.register };
    yield { path: `element.${key}.theme`, text: entry.theme };
    yield { path: `element.${key}.body`, text: entry.body };
  }
  for (const [key, entry] of Object.entries(NUMEROLOGY_MEANINGS)) {
    yield { path: `numerology.${key}.register`, text: entry.register };
    yield { path: `numerology.${key}.body`, text: entry.body };
  }
  for (const [key, value] of Object.entries(HARMONY_THEME_ALIASES)) {
    yield { path: `alias.${key}`, text: value };
  }
  for (const [key, context] of Object.entries(COORDINATE_CONTEXT)) {
    yield { path: `context.${key}.role`, text: context.role };
  }
}

describe('content/meanings.v1.js — completeness against canonical value lists', () => {
  it('has an entry for every MAJOR_ARCANA name', () => {
    const missing = MAJOR_ARCANA.filter(name => !(name in ARCANA_MEANINGS));
    expect(missing, `missing arcana entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(ARCANA_MEANINGS)).toHaveLength(MAJOR_ARCANA.length);
  });

  it('has an entry for every SUN_SIGNS name', () => {
    const names = SUN_SIGNS.map(s => s.name);
    const missing = names.filter(name => !(name in SUN_MEANINGS));
    expect(missing, `missing sun entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(SUN_MEANINGS)).toHaveLength(names.length);
  });

  it('has an entry for every ANIMALS value', () => {
    const missing = ANIMALS.filter(a => !(a in ANIMAL_MEANINGS));
    expect(missing, `missing animal entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(ANIMAL_MEANINGS)).toHaveLength(ANIMALS.length);
  });

  it('retains every historical v1 life-path entry', () => {
    const missing = HISTORICAL_LIFE_PATH_KEYS.filter(k => !(k in LIFE_PATH_MEANINGS));
    expect(missing, `missing life path entries: ${missing.join(', ')}`).toEqual([]);
    expect(Object.keys(LIFE_PATH_MEANINGS)).toHaveLength(HISTORICAL_LIFE_PATH_KEYS.length);
  });

  it('every entry has non-empty register + body strings', () => {
    const tables = { ARCANA_MEANINGS, SUN_MEANINGS, ANIMAL_MEANINGS, LIFE_PATH_MEANINGS };
    const malformed = [];
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [key, entry] of Object.entries(table)) {
        if (typeof entry?.register !== 'string' || !entry.register.trim()) {
          malformed.push(`${tableName}.${key}: missing/empty register`);
        }
        if (typeof entry?.body !== 'string' || !entry.body.trim()) {
          malformed.push(`${tableName}.${key}: missing/empty body`);
        }
      }
    }
    expect(malformed, malformed.join('\n')).toEqual([]);
  });
});

describe('content/meanings.v1.js — voice register + content policy (DOCTRINE §2/§4)', () => {
  function* meaningStrings() {
    const tables = { arcana: ARCANA_MEANINGS, sun: SUN_MEANINGS, animal: ANIMAL_MEANINGS, lifePath: LIFE_PATH_MEANINGS };
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [key, entry] of Object.entries(table)) {
        yield { path: `${tableName}.${key}.register`, text: entry.register ?? '' };
        yield { path: `${tableName}.${key}.body`, text: entry.body ?? '' };
      }
    }
  }

  it('no BANNED_VOICE_REGISTER hits', () => {
    // Canonical substring semantics via the shared matcher — see
    // tests/helpers/voice-register.js (PR #101 MED-1 reconciliation).
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      for (const { term, containing } of voiceRegisterHits(text)) {
        hits.push(`${path}: matched "${term}" in "${containing}" ("${text.slice(0, 80)}…")`);
      }
    }
    expect(hits, `Voice-register violations in meanings.v1.js:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no BANNED_PATTERNS slur hits', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) hits.push(`${path}: matched ${re}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('never addresses the reader directly ("you"/"your")', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      if (SECOND_PERSON_RE.test(text)) hits.push(path);
    }
    expect(hits, `Second-person address found in:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no anti-diagnostic-framing terms (DOCTRINE §4)', () => {
    const hits = [];
    for (const { path, text } of meaningStrings()) {
      if (DIAGNOSTIC_FRAMING_RE.test(text)) hits.push(path);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('scans the exact meanings module the runtime imports (scan-target parity)', () => {
    // PR #101 MED-2 + PR #104 codex absorb: a future meanings.v2.js (§4 —
    // new release = new file) must not ship unscanned while this file greens
    // on v1. This file intentionally retains a historical v1 scan while the
    // currentMeaningStrings walker below scans the active v2 additions.
    // Runtime imports must therefore resolve exclusively to meanings.v2.js.
    const family = /from\s+['"]\.{1,2}\/content\/(meanings\.[\w.]+\.js)['"]/g;
    const own = [...readFileSync(fileURLToPath(import.meta.url), 'utf-8').matchAll(family)]
      .map(match => match[1]);
    const runtime = [...meaningsUiJs.matchAll(family)].map(match => match[1]);
    expect(own).toContain('meanings.v2.js');
    expect(runtime.length).toBeGreaterThan(0);
    expect(new Set(runtime)).toEqual(new Set(['meanings.v2.js']));
  });
});

// Guard the guard: every policy scan above (and its siblings over the deck
// and the concordance registry) is all-negative — it asserts zero hits — so a
// weakened matcher would read green while silently passing the inflections it
// exists to catch: the exact false-green class the PR #101 audit (MED-1)
// proved by mutation against the old word-bounded shape. These positive-fire
// sentinels pin the shared matcher, the safelist, and both framing patterns.
// Mirrors the pii_scan.test.js sentinel pattern; sentinel strings live only
// in this test code — no content file carries them.
describe('voice-register scan — positive-fire sentinels (shared matcher + framing patterns)', () => {
  it('substring matcher fires on the suffix inflections the old \\b shape missed', () => {
    expect(voiceRegisterHits('steeped in mysticism'))
      .toEqual([{ term: 'mystic', containing: 'mysticism' }]);
    expect(voiceRegisterHits('collects auras').some(hit => hit.term === 'aura')).toBe(true);
    expect(voiceRegisterHits('manifesting outcomes').some(hit => hit.term === 'manifest')).toBe(true);
    expect(voiceRegisterHits('channeled records').some(hit => hit.term === 'channel')).toBe(true);
    expect(voiceRegisterHits('a fateful pairing').some(hit => hit.term === 'fate')).toBe(true);
  });

  it('substring matcher still fires on exact terms and multiword terms', () => {
    expect(voiceRegisterHits('pure karma').some(hit => hit.term === 'karma')).toBe(true);
    expect(voiceRegisterHits('The Universe provides').some(hit => hit.term === 'the universe')).toBe(true);
    expect(voiceRegisterHits('a third eye opens').some(hit => hit.term === 'third eye')).toBe(true);
  });

  it('safelist suppresses only listed benign containments, never a real hit', () => {
    expect(voiceRegisterHits('dinner at the restaurant')).toEqual([]);
    expect(voiceRegisterHits('sulfates in the water')).toEqual([]);
    // A safelisted occurrence must not shadow a later real one.
    expect(voiceRegisterHits('the restaurant aura').some(hit => hit.term === 'aura')).toBe(true);
    // Every safelist entry actually contains a banned term — a stale entry
    // that contains none is dead weight and fails here.
    for (const word of SUBSTRING_SAFELIST) {
      expect(
        BANNED_VOICE_REGISTER.some(term => word.includes(term)),
        `safelist entry "${word}" contains no banned term`,
      ).toBe(true);
    }
  });

  it('second-person pattern fires on every form including yours/yourself', () => {
    for (const sample of ['you decide', "you're seen", 'your hand', 'yours alone', 'know yourself', 'do it yourselves']) {
      expect(SECOND_PERSON_RE.test(sample), sample).toBe(true);
    }
    expect(SECOND_PERSON_RE.test('young youths in soulful order')).toBe(false);
  });

  it('diagnostic pattern fires on the whole diagnos* family plus plurals', () => {
    for (const sample of ['a diagnostic frame', 'competing diagnoses', 'a diagnosis', 'diagnosed early', 'diagnosing habits', 'mood disorders', 'a syndrome', 'disordered pattern']) {
      expect(DIAGNOSTIC_FRAMING_RE.test(sample), sample).toBe(true);
    }
    expect(DIAGNOSTIC_FRAMING_RE.test('orderly syndicates')).toBe(false);
  });

  it('BANNED_PATTERNS stay word-bounded — ordinary vocabulary must not trip them', () => {
    const mental = BANNED_PATTERNS.find(re => re.source.includes('mental'));
    expect(mental.test('a mental state')).toBe(true);
    expect(mental.test('elemental')).toBe(false);
    expect(mental.test('fundamental habit')).toBe(false);
  });

  it('parameterized terms (provenance/atlas verb extension) ride the same matcher + safelist', () => {
    const extended = [...BANNED_VOICE_REGISTER, ...INTERPRETATION_VERBS];
    expect(voiceRegisterHits('this reveals much', extended).some(hit => hit.term === 'reveal')).toBe(true);
    expect(voiceRegisterHits('a predictive future', extended).some(hit => hit.term === 'future')).toBe(true);
    expect(voiceRegisterHits('dinner at the restaurant', extended)).toEqual([]);
    // Verbs are opt-in: the default table stays the register alone.
    expect(voiceRegisterHits('this reveals much')).toEqual([]);
  });
});

describe('content/meanings.v2.js — all-coordinate context layer', () => {
  it('exposes exactly the active nine numerology meanings', () => {
    expect(Object.keys(NUMEROLOGY_MEANINGS)).toEqual(NUMEROLOGY_KEYS);
    expect(NUMEROLOGY_MEANINGS).not.toHaveProperty('11');
    expect(NUMEROLOGY_MEANINGS).not.toHaveProperty('22');
    expect(NUMEROLOGY_MEANINGS).not.toHaveProperty('33');
  });

  it('covers all five element values', () => {
    expect(Object.keys(ELEMENT_MEANINGS).sort()).toEqual(
      ['earth', 'fire', 'metal', 'water', 'wood']
    );
    for (const entry of Object.values(ELEMENT_MEANINGS)) {
      expect(entry.register.trim()).toBeTruthy();
      expect(entry.theme.trim()).toBeTruthy();
      expect(entry.body.trim()).toBeTruthy();
    }
  });

  it('defines a harmony role and two partners for all 14 sheet coordinates', () => {
    expect(Object.keys(COORDINATE_CONTEXT)).toHaveLength(14);
    for (const [key, context] of Object.entries(COORDINATE_CONTEXT)) {
      expect(context.role, `${key} role`).toMatch(/^the /);
      expect(context.partners, `${key} partners`).toHaveLength(2);
      expect(context.partners, `${key} cannot partner with itself`).not.toContain(key);
    }
  });

  it('has grammatical harmony aliases for every number register', () => {
    const registers = Object.values(NUMEROLOGY_MEANINGS).map(entry => entry.register);
    expect(Object.keys(HARMONY_THEME_ALIASES).sort()).toEqual(registers.sort());
  });

  it('places every numerology coordinate beside two other numerology coordinates', () => {
    const axes = ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity'];
    for (const key of axes) {
      expect(COORDINATE_CONTEXT[key].partners.every(partner => axes.includes(partner))).toBe(true);
    }
  });

  it('keeps all new authored strings inside the clinical content policy', () => {
    const hits = [];
    for (const { path, text } of currentMeaningStrings()) {
      for (const { term, containing } of voiceRegisterHits(text)) {
        hits.push(`${path}: voice "${term}" in "${containing}"`);
      }
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) hits.push(`${path}: ${re}`);
      }
      if (SECOND_PERSON_RE.test(text)) hits.push(`${path}: second person`);
      if (DIAGNOSTIC_FRAMING_RE.test(text)) hits.push(`${path}: diagnostic framing`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

describe('assembled meaning synthesis — voice register over runtime output (PR #113 audit absorb)', () => {
  // The concordance scan covers buildConcordance's ASSEMBLED strings; the
  // meanings layer assembles content at runtime too (harmonyFor's connective
  // template, pillarEntry bodies). Static-table scans alone would let a
  // future template edit drift into oracle register with no gate — so scan
  // the real builders' output across every value each coordinate can hold.
  const { entryFor, harmonyFor } = uiMeanings;

  const resolvedSheet = {
    arcana: 'XI · justice',
    element: 'earth',
    sun: 'virgo',
    rising: 'leo',
    animal: 'horse',
    innerAnimal: 'snake',
    lifePath: '2',
    nameNumber: '6',
    soulUrge: '4',
    personality: '8',
    birthday: '2',
    maturity: '8',
    dayPillar: 'tiger · fire',
    hourPillar: 'rat · water',
  };

  const pillarValues = Object.keys(ANIMAL_MEANINGS).flatMap(animal =>
    Object.keys(ELEMENT_MEANINGS).map(element => `${animal} · ${element}`));
  const VALUE_POOLS = {
    arcana: Object.keys(ARCANA_MEANINGS),
    element: Object.keys(ELEMENT_MEANINGS),
    sun: Object.keys(SUN_MEANINGS),
    rising: Object.keys(SUN_MEANINGS),
    animal: Object.keys(ANIMAL_MEANINGS),
    innerAnimal: Object.keys(ANIMAL_MEANINGS),
    lifePath: Object.keys(NUMEROLOGY_MEANINGS),
    nameNumber: Object.keys(NUMEROLOGY_MEANINGS),
    soulUrge: Object.keys(NUMEROLOGY_MEANINGS),
    personality: Object.keys(NUMEROLOGY_MEANINGS),
    birthday: Object.keys(NUMEROLOGY_MEANINGS),
    maturity: Object.keys(NUMEROLOGY_MEANINGS),
    dayPillar: pillarValues,
    hourPillar: pillarValues,
  };

  function assembledStrings() {
    const strings = [];
    for (const [key, pool] of Object.entries(VALUE_POOLS)) {
      for (const value of pool) {
        const entry = entryFor(key, value);
        expect(entry, `${key}:${value} resolves an entry`).toBeTruthy();
        strings.push({ path: `${key}:${value}:body`, text: entry.body });
        strings.push({
          path: `${key}:${value}:harmony`,
          text: harmonyFor(key, entry, { ...resolvedSheet, [key]: value }),
        });
        // Sparse-sheet branch: fewer than two resolvable partners.
        strings.push({
          path: `${key}:${value}:harmony-sparse`,
          text: harmonyFor(key, entry, { [key]: value }),
        });
      }
    }
    return strings;
  }

  it('every assembled body and harmony sentence passes the shared scans', () => {
    const hits = [];
    for (const { path, text } of assembledStrings()) {
      expect(typeof text, path).toBe('string');
      for (const { term, containing } of voiceRegisterHits(text)) {
        hits.push(`${path}: voice "${term}" in "${containing}"`);
      }
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) hits.push(`${path}: ${re}`);
      }
      if (SECOND_PERSON_RE.test(text)) hits.push(`${path}: second person`);
      if (DIAGNOSTIC_FRAMING_RE.test(text)) hits.push(`${path}: diagnostic framing`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('numerology coordinates assemble numerology-only partners even on a full sheet', () => {
    for (const key of ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity']) {
      const sentence = harmonyFor(key, entryFor(key, '5'), { ...resolvedSheet, [key]: '5' });
      expect(sentence, key).not.toMatch(/outward agenda|public instinct|material tempo|frame of the full reading/);
    }
  });
});
