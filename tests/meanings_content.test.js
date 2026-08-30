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
  COORDINATE_CONTEXT,
  NUMEROLOGY_SLOT_LINES,
  THEME_TENSIONS,
} from '../content/meanings.v4.js';
import { NUMEROLOGY_MEANINGS as V2_NUMEROLOGY_MEANINGS } from '../content/meanings.v2.js';
import { TERMINAL_NUMBERS } from '../core/profile.js';
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
// Calc v4 (§1.B v0.62) restores the master stops, so the ACTIVE registry is
// once again the whole v1 table. Derived from the calculation core rather
// than restated, so a domain change in one place fails here rather than
// leaving a value with no meaning to open.
const NUMEROLOGY_KEYS = TERMINAL_NUMBERS.map(String);

function* currentMeaningStrings() {
  for (const [key, entry] of Object.entries(ELEMENT_MEANINGS)) {
    yield { path: `element.${key}.register`, text: entry.register };
    yield { path: `element.${key}.theme`, text: entry.theme };
    yield { path: `element.${key}.body`, text: entry.body };
  }
  for (const [key, entry] of Object.entries(NUMEROLOGY_MEANINGS)) {
    yield { path: `numerology.${key}.register`, text: entry.register };
    yield { path: `numerology.${key}.theme`, text: entry.theme };
    yield { path: `numerology.${key}.body`, text: entry.body };
  }
  for (const [key, context] of Object.entries(COORDINATE_CONTEXT)) {
    yield { path: `context.${key}.role`, text: context.role };
  }
  for (const [slot, lines] of Object.entries(NUMEROLOGY_SLOT_LINES)) {
    for (const [value, line] of Object.entries(lines)) {
      yield { path: `slotLine.${slot}.${value}`, text: line };
    }
  }
  for (const [pair, sentence] of Object.entries(THEME_TENSIONS)) {
    yield { path: `tension.${pair}`, text: sentence };
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
    // PR #101 MED-2 + PR #104 codex absorb: a future meanings.v3.js (§4 —
    // new release = new file) must not ship unscanned while this file greens
    // on v1. This file intentionally retains a historical v1 scan while the
    // currentMeaningStrings walker below scans the active v4 additions.
    // Runtime imports must therefore resolve exclusively to meanings.v4.js.
    const family = /from\s+['"]\.{1,2}\/content\/(meanings\.[\w.]+\.js)['"]/g;
    const own = [...readFileSync(fileURLToPath(import.meta.url), 'utf-8').matchAll(family)]
      .map(match => match[1]);
    const runtime = [...meaningsUiJs.matchAll(family)].map(match => match[1]);
    expect(own).toContain('meanings.v4.js');
    expect(runtime.length).toBeGreaterThan(0);
    expect(new Set(runtime)).toEqual(new Set(['meanings.v4.js']));
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

describe('content/meanings.v3.js — all-coordinate context layer', () => {
  it('exposes exactly the twelve active numerology meanings', () => {
    expect(Object.keys(NUMEROLOGY_MEANINGS).sort()).toEqual([...NUMEROLOGY_KEYS].sort());
    for (const key of ['11', '22', '33']) {
      expect(NUMEROLOGY_MEANINGS, key).toHaveProperty(key);
    }
    // Not a registry of every integer: 10 is a plausible key no reduction
    // can terminate on, and widening to the masters must not admit it.
    expect(NUMEROLOGY_MEANINGS).not.toHaveProperty('10');
  });

  it("carries v2's nine active entries across UNCHANGED, structurally", () => {
    // v3 widens the domain and does nothing else to the nine v2 already had.
    // A first draft restated all twelve themes in v3, which made "carried
    // across unchanged" a claim about two hand-maintained lists rather than a
    // property of the code (PR audit, 2026-07-31, P2). v3 now spreads v2's
    // entries; this is the pin that keeps the claim true whichever way a
    // later author writes it.
    for (const [key, entry] of Object.entries(V2_NUMEROLOGY_MEANINGS)) {
      expect(NUMEROLOGY_MEANINGS, `v3 dropped v2's ${key}`).toHaveProperty(key);
      expect(NUMEROLOGY_MEANINGS[key].theme, `${key} theme`).toBe(entry.theme);
      expect(NUMEROLOGY_MEANINGS[key].register, `${key} register`).toBe(entry.register);
      expect(NUMEROLOGY_MEANINGS[key].body, `${key} body`).toBe(entry.body);
    }
    // v3 is exactly v2 plus the three masters — no fourth addition slipped in.
    const added = Object.keys(NUMEROLOGY_MEANINGS)
      .filter(key => !(key in V2_NUMEROLOGY_MEANINGS));
    expect(added.sort()).toEqual(['11', '22', '33']);
    expect(Object.keys(V2_NUMEROLOGY_MEANINGS)).toHaveLength(9);
  });

  it('reuses the immutable v1 master entries byte-for-byte — no re-authoring', () => {
    // The §4 identity pin. `toBe` on the strings, not `toEqual` on shapes:
    // anything short of it would re-admit a paraphrase, which is the drift
    // the versioning rule exists to stop.
    for (const key of HISTORICAL_LIFE_PATH_KEYS) {
      expect(NUMEROLOGY_MEANINGS[key].register, `${key} register`)
        .toBe(LIFE_PATH_MEANINGS[key].register);
      expect(NUMEROLOGY_MEANINGS[key].body, `${key} body`)
        .toBe(LIFE_PATH_MEANINGS[key].body);
    }
    // `theme` is the ONLY field v3 adds, and v1 does not carry it.
    for (const entry of Object.values(LIFE_PATH_MEANINGS)) {
      expect(entry).not.toHaveProperty('theme');
    }
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

  it('has a grammatical harmony theme for every number register', () => {
    for (const entry of Object.values(NUMEROLOGY_MEANINGS)) {
      expect(entry.theme.trim()).toBeTruthy();
    }
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

  it('v4 slot lines: six exact families, every terminal value, appended never edited', () => {
    expect(Object.keys(NUMEROLOGY_SLOT_LINES).sort()).toEqual(
      ['birthday', 'lifePath', 'maturity', 'nameNumber', 'personality', 'soulUrge'],
    );
    for (const [slot, lines] of Object.entries(NUMEROLOGY_SLOT_LINES)) {
      expect(Object.keys(lines).map(Number).sort((a, b) => a - b), slot)
        .toEqual([...TERMINAL_NUMBERS].sort((a, b) => a - b));
      for (const line of Object.values(lines)) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(30);
      }
    }
    // Assembly contract, byte-exact over EVERY family and value: base body
    // + one space + that slot's own line. The pr212 audit proved the
    // looser startsWith/endsWith form let both a dropped join space and a
    // wholesale swap of two slot-line families ride green.
    for (const value of Object.keys(NUMEROLOGY_MEANINGS)) {
      for (const slot of Object.keys(NUMEROLOGY_SLOT_LINES)) {
        expect(entryFor(slot, value).body, `${slot}=${value}`)
          .toBe(`${NUMEROLOGY_MEANINGS[value].body} ${NUMEROLOGY_SLOT_LINES[slot][value]}`);
      }
    }
  });

  it('v4 slot lines: each family speaks its OWN derivation — an independent oracle a family swap cannot satisfy', () => {
    // The pr212 audit swapped two whole families inside the content file
    // and every table-as-its-own-oracle pin stayed green. Each slot's
    // lines must name that slot's actual derivation, which a swapped
    // family cannot fake.
    const FAMILY_VOCAB = {
      lifePath: /life path/,
      nameNumber: /full-name/,
      soulUrge: /vowel line/,
      personality: /consonant line/,
      birthday: /day-of-birth/,
      maturity: /maturity sum/,
    };
    for (const [slot, re] of Object.entries(FAMILY_VOCAB)) {
      for (const [value, line] of Object.entries(NUMEROLOGY_SLOT_LINES[slot])) {
        expect(re.test(line), `${slot}[${value}] must name its derivation (${re})`).toBe(true);
      }
      // and no OTHER family may use this family's derivation vocabulary
      for (const [other, lines] of Object.entries(NUMEROLOGY_SLOT_LINES)) {
        if (other === slot) continue;
        for (const [value, line] of Object.entries(lines)) {
          expect(re.test(line), `${other}[${value}] wrongly names ${slot}'s derivation`).toBe(false);
        }
      }
    }
  });

  it('v4 slot lines: a value repeated across slots no longer renders the same sentence', () => {
    // The measured defect this table exists to close: 76% of sampled
    // sheets carried an identical body on two numerology compartments.
    const pairs = [['soulUrge', 'maturity'], ['personality', 'birthday'], ['lifePath', 'nameNumber']];
    for (const value of ['1', '4', '6', '11', '22', '33']) {
      for (const [a, b] of pairs) {
        expect(entryFor(a, value).body, `${a}/${b}=${value}`).not.toBe(entryFor(b, value).body);
      }
    }
  });

  it('v4 tensions: keys are sorted theme pairs drawn from the live theme vocabulary', () => {
    const themes = new Set();
    for (const table of [ELEMENT_MEANINGS, NUMEROLOGY_MEANINGS]) {
      for (const entry of Object.values(table)) themes.add(entry.theme || entry.register.split('\u00b7')[0].trim());
    }
    // sun/animal/arcana themes reach harmonyFor through themeFor the same
    // way — collect them off the canonical value lists rather than
    // hand-picking, so a renamed theme reds this pin instead of hiding.
    for (const sign of SUN_SIGNS) {
      const e = entryFor('sun', sign.name); if (e) themes.add(e.theme || e.register.split('\u00b7')[0].trim());
    }
    for (const key of ANIMALS) {
      const e = entryFor('animal', key); if (e) themes.add(e.theme || e.register.split('\u00b7')[0].trim());
    }
    for (const name of MAJOR_ARCANA) {
      const e = entryFor('arcana', name); if (e) themes.add(e.theme || e.register.split('\u00b7')[0].trim());
    }
    for (const [pair, sentence] of Object.entries(THEME_TENSIONS)) {
      const parts = pair.split('|');
      expect(parts, pair).toHaveLength(2);
      expect(parts[0] < parts[1], `${pair} sorted`).toBe(true);
      for (const theme of parts) expect(themes.has(theme), `${pair}: unknown theme '${theme}'`).toBe(true);
      expect(sentence).toContain(parts[0]);
      expect(sentence).toContain(parts[1]);
    }
  });

  it('v4 tensions: a filed pair fires from every candidate position; unfiled triples keep the clause byte-for-byte', () => {
    // Position primary-vs-partner: taurus sun (persistence) with the
    // seeker (change) among partners — 'change|persistence' filed.
    const tensionSheet = { ...resolvedSheet, sun: 'taurus', animal: 'horse', lifePath: '5' };
    const tense = harmonyFor('sun', entryFor('sun', 'taurus'), tensionSheet);
    expect(tense).toContain(THEME_TENSIONS['change|persistence']);
    expect(tense).not.toMatch(/the combination is /);

    // Position partner-vs-partner — the pr212 audit's self-contradiction:
    // cancer sun (protection) with rabbit (caution) and life path 1
    // (initiative) as partners; 'caution|initiative' is filed between the
    // PARTNERS, and the old primary-only lookup asserted they "work
    // through" each other one panel after the registry said they pull
    // against each other.
    const partnerSheet = { ...resolvedSheet, sun: 'cancer', animal: 'rabbit', lifePath: '1' };
    const partnerTense = harmonyFor('sun', entryFor('sun', 'cancer'), partnerSheet);
    expect(partnerTense).toContain(THEME_TENSIONS['caution|initiative']);
    expect(partnerTense).not.toMatch(/the combination is /);

    // Lookup-order determinism: when primary-vs-first-partner is filed it
    // wins over a filed partner pair (first candidate in order).
    // taurus (persistence) + seeker lifePath (change) as first partner —
    // 'change|persistence' outranks anything later.
    const ordered = harmonyFor('sun', entryFor('sun', 'taurus'),
      { ...resolvedSheet, sun: 'taurus', animal: 'horse', lifePath: '5', arcana: 'XI · justice' });
    expect(ordered).toContain(THEME_TENSIONS['change|persistence']);

    // An unfiled triple keeps the original clause exactly.
    const plain = harmonyFor('element', entryFor('element', 'earth'), resolvedSheet);
    expect(plain).toMatch(/\. the combination is .+ working through .+ and .+\.$/);
  });

  it('v4 tensions: every filed pair is REACHABLE on some real sheet (no dead registry entries)', () => {
    // The pr212 opus lane proved three pairs could never fire under the
    // primary-only lookup; the triple-position lookup must keep all of
    // them live. Reachability = the two themes can meet as primary+partner
    // or as the two partners, per coordinate wiring — enumerated over the
    // real tables, not asserted from memory.
    const themeOf = e => e.theme || e.register.split('\u00b7')[0].trim();
    const themesByKey = {};
    const add = (k, v) => { const e = entryFor(k, String(v)); if (e) (themesByKey[k] ||= new Set()).add(themeOf(e)); };
    for (const sign of SUN_SIGNS) { add('sun', sign.name); add('rising', sign.name); }
    for (const a of ANIMALS) { add('animal', a); add('innerAnimal', a); }
    for (const el of Object.keys(ELEMENT_MEANINGS)) add('element', el);
    for (const n of TERMINAL_NUMBERS) for (const k of ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity']) add(k, n);
    for (const name of MAJOR_ARCANA) add('arcana', name);
    for (const a of ANIMALS) for (const el of Object.keys(ELEMENT_MEANINGS)) {
      const e = entryFor('dayPillar', `${a} \u00b7 ${el}`);
      if (e) { (themesByKey.dayPillar ||= new Set()).add(themeOf(e)); (themesByKey.hourPillar ||= new Set()).add(themeOf(e)); }
    }
    const NUM = new Set(['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity']);
    const pk = (a, b) => [a, b].sort().join('|');
    const reachable = new Set();
    for (const key of Object.keys(COORDINATE_CONTEXT)) {
      const fall = NUM.has(key) ? [...NUM] : ['sun', 'animal', 'lifePath', 'arcana', 'element', 'innerAnimal'];
      const cands = [...(COORDINATE_CONTEXT[key].partners || []), ...fall]
        .filter((k, i, arr) => k !== key && arr.indexOf(k) === i && themesByKey[k]);
      const prim = themesByKey[key] || new Set();
      for (const c of cands) for (const a of prim) for (const b of themesByKey[c]) reachable.add(pk(a, b));
      for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++)
        for (const a of themesByKey[cands[i]]) for (const b of themesByKey[cands[j]]) reachable.add(pk(a, b));
    }
    for (const pair of Object.keys(THEME_TENSIONS)) {
      expect(reachable.has(pair), `filed but unreachable: ${pair}`).toBe(true);
    }
  });

  it('numerology coordinates assemble numerology-only partners even on a full sheet', () => {
    for (const key of ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity']) {
      const sentence = harmonyFor(key, entryFor(key, '5'), { ...resolvedSheet, [key]: '5' });
      expect(sentence, key).not.toMatch(/outward agenda|public instinct|material tempo|frame of the full reading/);
    }
  });
});
