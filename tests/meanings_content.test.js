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
  PLACEMENT_LINES,
} from '../content/meanings.v6.js';
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
  for (const [placement, lines] of Object.entries(PLACEMENT_LINES)) {
    for (const [value, line] of Object.entries(lines)) {
      yield { path: `placementLine.${placement}.${value}`, text: line };
    }
  }
  // Every harmony frame, rendered with real registry parts — not only the
  // frames a fixture happens to hit (the pr212 frame-coverage lesson).
  const frameParts = {
    theme: 'persistence',
    role: 'the outward agenda',
    partners: [
      { theme: 'independence', role: 'the public instinct' },
      { theme: 'expression', role: 'the long route' },
    ],
  };
  for (let i = 0; i < uiMeanings.HARMONY_FRAME_COUNT; i++) {
    yield {
      path: `harmonyFrame.${i}`,
      text: uiMeanings.composeHarmony(i, frameParts.theme, frameParts.role, frameParts.partners,
        'the combination is persistence working through independence and expression.'),
    };
    yield {
      path: `harmonyFrame.${i}.tension`,
      text: uiMeanings.composeHarmony(i, frameParts.theme, frameParts.role, frameParts.partners,
        THEME_TENSIONS['change|persistence']),
    };
  }
  // The filed-relation lines the panel can render, one per pair kind.
  const relationSheets = [
    ['sun', { sun: 'taurus', rising: 'virgo' }],
    ['animal', { animal: 'horse', innerAnimal: 'dog' }],
    ['element', { element: 'metal', dayPillar: 'rat \u00b7 water' }],
    ['lifePath', { lifePath: '11', birthday: '2' }],
  ];
  for (const [key, sheet] of relationSheets) {
    const line = uiMeanings.relationLineFor(key, sheet);
    if (line) yield { path: `relation.${key}`, text: line };
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
    // currentMeaningStrings walker below scans the active v5 additions.
    // Runtime imports must therefore resolve exclusively to meanings.v5.js —
    // in BOTH runtime importers: ui/meanings.js and core/dyad.js (the pr214
    // audit F3 proved a dyad reverted to v3 rode green when only the UI
    // module was scanned). The dyad's meaningSource provenance literal must
    // also name the file it actually imports — emitting one and importing
    // another is the F6 defect class its own comment warns about.
    const family = /from\s+['"]\.{1,2}\/content\/(meanings\.[\w.]+\.js)['"]/g;
    const own = [...readFileSync(fileURLToPath(import.meta.url), 'utf-8').matchAll(family)]
      .map(match => match[1]);
    const dyadJs = readFileSync(join(__dirname, '..', 'core', 'dyad.js'), 'utf-8');
    const runtime = [
      ...meaningsUiJs.matchAll(family),
      ...dyadJs.matchAll(family),
    ].map(match => match[1]);
    expect(own).toContain('meanings.v6.js');
    expect(runtime.length).toBeGreaterThanOrEqual(2);
    expect(new Set(runtime)).toEqual(new Set(['meanings.v6.js']));
    const provenance = dyadJs.match(/meaningSource:\s*'content\/(meanings\.[\w.]+\.js) NUMEROLOGY_MEANINGS'/);
    expect(provenance).not.toBeNull();
    expect(provenance[1]).toBe('meanings.v6.js');
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

  it('defines a harmony role and two partners for all 15 sheet coordinates', () => {
    expect(Object.keys(COORDINATE_CONTEXT)).toHaveLength(15);
    expect(COORDINATE_CONTEXT.moon).toEqual({ role: 'the night register', partners: ['sun', 'rising'] });
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
      // Same whole-line uniqueness guard the placement families carry
      // (pr214 audit F6) — a duplicated value line within a family rode
      // green here too.
      expect(new Set(Object.values(lines)).size, `${slot} lines must be unique`)
        .toBe(Object.keys(lines).length);
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

  it('v5+v6 placement lines: three exact families, every sign and branch, appended never edited', () => {
    expect(Object.keys(PLACEMENT_LINES).sort()).toEqual(['innerAnimal', 'moon', 'rising']);
    expect(Object.keys(PLACEMENT_LINES.rising).sort())
      .toEqual(SUN_SIGNS.map(s => s.name).sort());
    expect(Object.keys(PLACEMENT_LINES.moon).sort())
      .toEqual(SUN_SIGNS.map(s => s.name).sort());
    expect(Object.keys(PLACEMENT_LINES.innerAnimal).sort())
      .toEqual([...ANIMALS].sort());
    for (const [placement, lines] of Object.entries(PLACEMENT_LINES)) {
      for (const line of Object.values(lines)) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(30);
      }
      // Within a family every line shares an authored prefix, so a
      // copy-pasted value line is easy to make and invisible to the
      // vocabulary oracle (pr214 audit F6 mutation-proved it riding
      // green). Whole-line uniqueness per family closes it.
      expect(new Set(Object.values(lines)).size, `${placement} lines must be unique`)
        .toBe(Object.keys(lines).length);
    }
    // Assembly contract, byte-exact over EVERY value (the pr212 lesson —
    // startsWith/endsWith lets a dropped join space or a family swap ride
    // green): shared base body + one space + that placement's own line.
    // The primary compartments stay byte-identical to the registry.
    for (const sign of SUN_SIGNS.map(s => s.name)) {
      expect(entryFor('rising', sign).body, `rising=${sign}`)
        .toBe(`${SUN_MEANINGS[sign].body} ${PLACEMENT_LINES.rising[sign]}`);
      expect(entryFor('sun', sign).body, `sun=${sign}`).toBe(SUN_MEANINGS[sign].body);
      expect(entryFor('moon', sign).body, `moon=${sign}`)
        .toBe(`${SUN_MEANINGS[sign].body} ${PLACEMENT_LINES.moon[sign]}`);
    }
    for (const animal of ANIMALS) {
      expect(entryFor('innerAnimal', animal).body, `innerAnimal=${animal}`)
        .toBe(`${ANIMAL_MEANINGS[animal].body} ${PLACEMENT_LINES.innerAnimal[animal]}`);
      expect(entryFor('animal', animal).body, `animal=${animal}`).toBe(ANIMAL_MEANINGS[animal].body);
    }
  });

  it('v5 placement lines: each family names its OWN placement — an oracle a family swap cannot satisfy', () => {
    // The pr212 audit swapped two whole slot-line families and every
    // table-as-its-own-oracle pin stayed green; same defense here. The
    // rising lines must read the value as the ascendant, the private-animal
    // lines as the off-stage register — vocabulary a swap cannot fake.
    const PLACEMENT_VOCAB = {
      rising: /rising sign/,
      moon: /moon sign/,
      innerAnimal: /private animal/,
    };
    for (const [placement, re] of Object.entries(PLACEMENT_VOCAB)) {
      for (const [value, line] of Object.entries(PLACEMENT_LINES[placement])) {
        expect(re.test(line), `${placement}[${value}] must name its placement (${re})`).toBe(true);
      }
      for (const [other, lines] of Object.entries(PLACEMENT_LINES)) {
        if (other === placement) continue;
        for (const [value, line] of Object.entries(lines)) {
          expect(re.test(line), `${other}[${value}] wrongly names ${placement}'s office`).toBe(false);
        }
      }
    }
  });

  it('v5 placement lines: a shared sign or branch no longer renders the same body twice', () => {
    // The last measured duplication (3 of 33 sampled sheets): sun/rising
    // share SUN_MEANINGS and the public/private animal share
    // ANIMAL_MEANINGS, so a repeated value rendered verbatim twice.
    for (const sign of SUN_SIGNS.map(s => s.name)) {
      expect(entryFor('sun', sign).body, `sun/rising=${sign}`)
        .not.toBe(entryFor('rising', sign).body);
    }
    for (const animal of ANIMALS) {
      expect(entryFor('animal', animal).body, `animal/innerAnimal=${animal}`)
        .not.toBe(entryFor('innerAnimal', animal).body);
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

  it('harmony frames: deterministic, all four reachable, closing clause identical across frames', () => {
    const entry = entryFor('sun', 'taurus');
    // Determinism: byte-identical on repeat.
    expect(harmonyFor('sun', entry, resolvedSheet)).toBe(harmonyFor('sun', entry, resolvedSheet));
    // All four frames occur over each key's REAL value domain — not an
    // artificial cross-product (pr213 audit, opus MED: the old pin missed
    // that `sun` never reaches frame 3 over its actual twelve signs).
    // Global: all four frames live. Per key: at least two, so no
    // coordinate is stuck on one skeleton.
    const numDomain = [...TERMINAL_NUMBERS].map(String);
    const signDomain = SUN_SIGNS.map(sign => sign.name);
    const pillarDomain = ANIMALS.flatMap(a => Object.keys(ELEMENT_MEANINGS).map(e => `${a} \u00b7 ${e}`));
    const domains = {
      sun: signDomain, rising: signDomain,
      animal: [...ANIMALS], innerAnimal: [...ANIMALS],
      element: Object.keys(ELEMENT_MEANINGS),
      lifePath: numDomain, nameNumber: numDomain, soulUrge: numDomain,
      personality: numDomain, birthday: numDomain, maturity: numDomain,
      dayPillar: pillarDomain, hourPillar: pillarDomain,
      arcana: MAJOR_ARCANA.map(name => `x \u00b7 ${name}`),
    };
    const global = new Set();
    for (const [key, domain] of Object.entries(domains)) {
      const seen = new Set(domain.map(value => uiMeanings.frameIndexFor(key, value)));
      expect(seen.size, `${key} reaches only ${[...seen]}`).toBeGreaterThanOrEqual(2);
      for (const f of seen) global.add(f);
    }
    expect([...global].sort()).toEqual([0, 1, 2, 3]);
    // The closing clause survives every frame byte-for-byte — harmony
    // algebra and tension sentence alike — so the tension pins hold
    // regardless of which frame renders.
    const parts = [
      { theme: 'independence', role: 'the public instinct' },
      { theme: 'expression', role: 'the long route' },
    ];
    for (let i = 0; i < uiMeanings.HARMONY_FRAME_COUNT; i++) {
      const closing = 'the combination is persistence working through independence and expression.';
      expect(uiMeanings.composeHarmony(i, 'persistence', 'the outward agenda', parts, closing).endsWith(closing)).toBe(true);
      expect(uiMeanings.composeHarmony(i, 'persistence', 'the outward agenda', parts, THEME_TENSIONS['change|persistence'])
        .endsWith(THEME_TENSIONS['change|persistence'])).toBe(true);
    }
  });

  it('frames pair each theme with ITS role — sentinel tokens a misattribution cannot satisfy', () => {
    // pr213 audit (sonnet, demonstrated): a theme/role misattribution in
    // the engine passed the whole suite after the frame-agnostic loosening.
    // Sentinels make pairing checkable per frame: a theme and its role
    // must share a clause; cross-pairings must not.
    const partners = [{ theme: 'CCC', role: 'DDD' }, { theme: 'EEE', role: 'FFF' }];
    // The full sentinel ORDER per frame is the oracle: any theme/role
    // misattribution — swapped partner roles, swapped primary pair,
    // reordered partners — perturbs the sequence. Frame 2 leads with the
    // role by design; the other three lead with the theme.
    const EXPECTED_ORDER = {
      0: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'ZZZ'],
      1: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'ZZZ'],
      2: ['BBB', 'AAA', 'DDD', 'CCC', 'FFF', 'EEE', 'ZZZ'],
      3: ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'ZZZ'],
    };
    for (let i = 0; i < uiMeanings.HARMONY_FRAME_COUNT; i++) {
      const out = uiMeanings.composeHarmony(i, 'AAA', 'BBB', partners, 'ZZZ.');
      const sequence = out.match(/AAA|BBB|CCC|DDD|EEE|FFF|ZZZ/g);
      expect(sequence, `frame ${i}`).toEqual(EXPECTED_ORDER[i]);
      expect(out.endsWith('ZZZ.')).toBe(true);
    }
  });

  const themeOfEntry = e => e.theme || e.register.split('\u00b7')[0].trim();

  it('harmonyFor equals the hand-assembled expectation — an engine-internal oracle', () => {
    // Built from the registry parts and composeHarmony directly, so a
    // misattribution INSIDE harmonyFor (wrong partner order, wrong role,
    // wrong theme) cannot reproduce it.
    // A deliberately tension-free triple (virgo/dog/6 files no theme
    // tension), so the algebra closing is the expected one; sun's partner
    // order is its COORDINATE_CONTEXT.partners: [animal, lifePath].
    const sheet = { ...resolvedSheet, sun: 'virgo', animal: 'dog', lifePath: '6' };
    const entry = entryFor('sun', 'virgo');
    const partners = [
      { theme: themeOfEntry(entryFor('animal', 'dog')), role: COORDINATE_CONTEXT.animal.role },
      { theme: themeOfEntry(entryFor('lifePath', '6')), role: COORDINATE_CONTEXT.lifePath.role },
    ];
    const theme = themeOfEntry(entry);
    const closing = `the combination is ${theme} working through ${partners[0].theme} and ${partners[1].theme}.`;
    const expected = uiMeanings.composeHarmony(
      uiMeanings.frameIndexFor('sun', 'virgo'), theme, COORDINATE_CONTEXT.sun.role, partners, closing,
    );
    expect(harmonyFor('sun', entry, sheet)).toBe(expected);
  });

  it('an ADVERSE filed relation suppresses the harmony algebra; a filed theme tension survives it', () => {
    // pr213 audit (opus MED): "working through" rendered one line above a
    // filed chong/square/ke record in 96 of 96 adverse animal pairs — the
    // pr212 contradiction shape across registries.
    const entry = entryFor('animal', 'horse');
    const plain = harmonyFor('animal', entry, resolvedSheet);
    const suppressed = harmonyFor('animal', entry, resolvedSheet, { adverse: true });
    expect(plain).toMatch(/the combination is .+ working through /);
    expect(suppressed).not.toMatch(/working through/);
    expect(suppressed.endsWith('.')).toBe(true);
    // A filed THEME tension still renders under adverse — friction above
    // friction is consistent.
    const tensionSheet = { ...resolvedSheet, sun: 'taurus', animal: 'horse', lifePath: '5' };
    const tense = harmonyFor('sun', entryFor('sun', 'taurus'), tensionSheet, { adverse: true });
    expect(tense).toContain(THEME_TENSIONS['change|persistence']);
  });

  it('filed relations: registered pairs render, unfiled and sealed pairs render nothing', () => {
    // One registered case per pair kind — the registry line verbatim.
    expect(uiMeanings.relationLineFor('sun', { sun: 'taurus', rising: 'virgo' }))
      .toContain('four signs apart \u00b7 trine');
    expect(uiMeanings.relationLineFor('rising', { sun: 'taurus', rising: 'virgo' }))
      .toContain('sun and rising');
    expect(uiMeanings.relationLineFor('animal', { animal: 'horse', innerAnimal: 'dog' }))
      .toContain('sanhe');
    expect(uiMeanings.relationLineFor('element', { element: 'metal', dayPillar: 'rat \u00b7 water' }))
      .toContain('metal generates water');
    expect(uiMeanings.relationLineFor('birthday', { lifePath: '11', birthday: '2' }))
      .toContain('11 reduces to 2');
    // Unfiled pairs and same values: nothing, never a manufactured claim.
    expect(uiMeanings.relationLineFor('sun', { sun: 'taurus', rising: 'taurus' })).toBe('');
    expect(uiMeanings.relationLineFor('lifePath', { lifePath: '3', birthday: '7' })).toBe('');
    // A sealed member renders '' on the card, so the pair never resolves —
    // the tier boundary holds through this path by construction.
    expect(uiMeanings.relationLineFor('sun', { sun: 'taurus', rising: '' })).toBe('');
    expect(uiMeanings.relationLineFor('element', { element: 'metal', dayPillar: '' })).toBe('');
    // Unresolved markers likewise.
    expect(uiMeanings.relationLineFor('sun', { sun: 'taurus', rising: '\u2014' })).toBe('');
    // Sealed-partner cases for EVERY pair kind (pr213 audit, opus MAJOR:
    // only the sun kind was pinned — a mutant defaulting the partner
    // value rendered a sealed compartment's number on a free panel with
    // the whole suite green).
    expect(uiMeanings.relationLineFor('lifePath', { lifePath: '11', nameNumber: '', soulUrge: '', personality: '', birthday: '', maturity: '' })).toBe('');
    expect(uiMeanings.relationLineFor('birthday', { birthday: '2', lifePath: '', nameNumber: '', soulUrge: '', personality: '', maturity: '' })).toBe('');
    expect(uiMeanings.relationLineFor('animal', { animal: 'horse', innerAnimal: '' })).toBe('');
    expect(uiMeanings.relationLineFor('innerAnimal', { animal: '', innerAnimal: 'rat' })).toBe('');
    expect(uiMeanings.relationLineFor('dayPillar', { element: '', dayPillar: 'rat \u00b7 water' })).toBe('');
  });

  it('filed relations carry the FULL §1.I emission set — registry and qualifier included', () => {
    // pr213 audit, opus MAJOR: the panel line dropped three of the
    // Register law's six emissions, the "recorded, not certified."
    // qualifier among them — the one both other registry surfaces carry
    // and tests/dyad.test.js pins by name.
    const cases = [
      ['sun', { sun: 'taurus', rising: 'virgo' }, 'western zodiac \u00b7 sign-distance relations'],
      ['animal', { animal: 'horse', innerAnimal: 'dog' }, 'earthly branches \u00b7 classical branch relations'],
      ['element', { element: 'metal', dayPillar: 'rat \u00b7 water' }, 'wuxing \u00b7 the five phases'],
      ['lifePath', { lifePath: '11', birthday: '2' }, 'pythagorean numerology \u00b7 master reduction'],
    ];
    for (const [key, sheet, registry] of cases) {
      const line = uiMeanings.relationLineFor(key, sheet);
      expect(line, key).toContain('. registered — ');
      expect(line, key).toContain(`registry: ${registry}`);
      expect(line.endsWith('recorded, not certified.'), key).toBe(true);
    }
  });

  it('numerology coordinates assemble numerology-only partners even on a full sheet', () => {
    for (const key of ['lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity']) {
      const sentence = harmonyFor(key, entryFor(key, '5'), { ...resolvedSheet, [key]: '5' });
      expect(sentence, key).not.toMatch(/outward agenda|public instinct|material tempo|frame of the full reading/);
    }
  });
});
