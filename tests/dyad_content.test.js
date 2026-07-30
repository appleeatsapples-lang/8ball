// 8ball / tests / dyad_content.test.js
//
// Voice policy and grammar discipline for content/dyad.v1.js and for the
// ASSEMBLED runtime output of core/dyad.js — the concordance convention
// (#101/#107): scanning only the tables would miss a violation introduced by
// the join that builds a passage out of two of them.
//
// Two things are enforced here that the single-reading content scans do not
// need, because the dyad is the first surface in this repo that speaks about
// TWO PEOPLE AT ONCE:
//
//   1. The §1.I register law, extended to authored prose. Concordance may
//      emit no compatibility percentage, harmony score, ranking, prediction,
//      advice, diagnosis, soulmate claim, recommendation or invented
//      cross-tradition synthesis. §1.J binds the dyad to the same list, and
//      this file is where that binding is mechanical rather than aspirational.
//   2. A no-person-as-subject rule. Every sentence's subject is a branch, an
//      element, a bracket or a number. The moment one becomes "she", "they"
//      or "the couple", the surface has changed register.
//
// The canonical §2/§4 tables (banned voice register, second person,
// diagnostic framing, slurs) are imported from tests/helpers/voice-register.js
// — never re-declared here, per the #104→#109 de-fork.

import { describe, it, expect } from 'vitest';
import {
  voiceRegisterHits,
  SECOND_PERSON_RE,
  DIAGNOSTIC_FRAMING_RE,
  BANNED_PATTERNS,
} from './helpers/voice-register.js';
import {
  ELEMENT_RELATIONS,
  ELEMENT_RELATION_KINDS,
  COMBINED_PATH_FRAMES,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_SOURCES,
  DYAD_QUALIFIER,
} from '../content/dyad.v1.js';
import { NUMEROLOGY_MEANINGS } from '../content/meanings.v2.js';
import { buildDyadReading } from '../core/dyad.js';
import { buildProfile } from '../core/profile.js';

const words = s => String(s).trim().split(/\s+/).filter(Boolean);

// The combined-path frames carry {sum}/{combined} placeholders; the voice and
// grammar scans run against their resolved form.
const resolveFrame = frame =>
  String(frame).replace('{sum}', '12').replace('{combined}', '3');

// Every authored string in the file, with a path so a failure names the cell.
function* tableStrings() {
  for (const [key, entry] of Object.entries(ELEMENT_RELATIONS)) {
    yield { path: `ELEMENT_RELATIONS.${key}.body`, text: entry.body };
  }
  for (const [key, kind] of Object.entries(ELEMENT_RELATION_KINDS)) {
    yield { path: `ELEMENT_RELATION_KINDS.${key}.label`, text: kind.label };
    yield { path: `ELEMENT_RELATION_KINDS.${key}.verb`, text: kind.verb };
  }
  for (const [key, frame] of Object.entries(COMBINED_PATH_FRAMES)) {
    yield { path: `COMBINED_PATH_FRAMES.${key}`, text: resolveFrame(frame) };
  }
  for (const [key, register] of Object.entries(BRANCH_REGISTERS)) {
    yield { path: `BRANCH_REGISTERS.${key}.body`, text: register.body };
  }
  for (const [key, register] of Object.entries(BRACKET_REGISTERS)) {
    yield { path: `BRACKET_REGISTERS.${key}.body`, text: register.body };
  }
  for (const [key, arc] of Object.entries(BRACKET_ARC)) {
    yield { path: `BRACKET_ARC.${key}`, text: arc };
  }
  for (const [key, source] of Object.entries(DYAD_SOURCES)) {
    yield { path: `DYAD_SOURCES.${key}`, text: source };
  }
  yield { path: 'DYAD_QUALIFIER', text: DYAD_QUALIFIER };
}

// Only the passage bodies carry the sentence/length discipline; labels,
// verbs and provenance strings are fragments by design.
function* bodies() {
  for (const [key, entry] of Object.entries(ELEMENT_RELATIONS)) {
    yield { path: `ELEMENT_RELATIONS.${key}`, text: entry.body };
  }
  for (const [key, frame] of Object.entries(COMBINED_PATH_FRAMES)) {
    yield { path: `COMBINED_PATH_FRAMES.${key}`, text: resolveFrame(frame) };
  }
  for (const [key, register] of Object.entries(BRANCH_REGISTERS)) {
    yield { path: `BRANCH_REGISTERS.${key}`, text: register.body };
  }
  for (const [key, register] of Object.entries(BRACKET_REGISTERS)) {
    yield { path: `BRACKET_REGISTERS.${key}`, text: register.body };
  }
}

// Assembled runtime output across a synthetic sweep (DOCTRINE §11).
const SWEEP = ['1900-01-01', '1966-01-21', '1980-02-29', '1988-06-15',
  '2000-01-01', '2024-02-10', '2047-03-06', '2100-12-31']
  .map(dob => buildProfile('specimen', dob));

function* assembledStrings() {
  for (const a of SWEEP) {
    for (const b of SWEEP) {
      const { relation } = buildDyadReading(a, b);
      yield { path: `${a.yyyy}×${b.yyyy}.element.aToB`, text: relation.element.aToB.body };
      yield { path: `${a.yyyy}×${b.yyyy}.element.bToA`, text: relation.element.bToA.body };
      yield { path: `${a.yyyy}×${b.yyyy}.numerology.reduction`, text: relation.numerology.reduction };
      yield { path: `${a.yyyy}×${b.yyyy}.cardPair`, text: relation.cardPair.body };
      yield { path: `${a.yyyy}×${b.yyyy}.qualifier`, text: relation.qualifier };
    }
  }
}

const ALL = () => [...tableStrings(), ...assembledStrings()];

describe('dyad content — canonical voice policy (§2 / §4)', () => {
  it('no banned voice-register term in any table or assembled string', () => {
    const hits = [];
    for (const { path, text } of ALL()) {
      for (const hit of voiceRegisterHits(text)) {
        hits.push(`${path}: "${hit.term}" in "${hit.containing}"`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('never addresses the reader (you / your / yours / yourself)', () => {
    const hits = ALL().filter(({ text }) => SECOND_PERSON_RE.test(text)).map(h => h.path);
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('no diagnostic framing', () => {
    const hits = ALL().filter(({ text }) => DIAGNOSTIC_FRAMING_RE.test(text)).map(h => h.path);
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('no slur-subset match', () => {
    const hits = [];
    for (const { path, text } of ALL()) {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(text)) hits.push(`${path}: ${pattern}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

// The §1.I register law, made mechanical. Each term is the vocabulary a
// compatibility product would reach for first; the dyad is not one.
const COMPATIBILITY_CLAIMS = Object.freeze([
  /\bcompatib\w*/i,
  /\bincompatib\w*/i,
  /\bsoulmates?\b/i,
  /\bmatch(es|ed|ing)?\b/i,
  /\bsuited?\b/i,
  /\bharmon(y|ious|ise|ize)\w*/i,
  /\bscore[sd]?\b/i,
  /\brank(s|ed|ing)?\b/i,
  /\bpercent\w*|\d\s*%/i,
  /\b(better|worse|best|worst)\b/i,
  /\bshould\b|\bought to\b|\bmust\b/i,
  /\bwill\b(?!\w)/i,
  /\brecommend\w*/i,
  /\badvice\b|\badvis\w*/i,
  /\bpredict\w*|\bforecast\w*/i,
  /\brelationship\b|\bcouple\b|\bpartner\w*/i,
  /\bromance\b|\bromantic\b|\blove life\b/i,
  // ── PR #187 finding F7.3 ────────────────────────────────────────────────
  // The list above is a VOCABULARY scan, and a bare verdict needs none of that
  // vocabulary. Verified against the shipped guard: "both names fit together",
  // "the two sheets belong together", "a strong pairing" and "they work well
  // as a pair" all passed it. These close the shape rather than the words —
  // a verdict is a claim that two things GO together, or that a pairing has a
  // quality. Each was checked against every shipped string in this file and
  // every assembled runtime string before being added (see the guard-the-guard
  // case below, which pins both directions).
  /\bfit(s|ted|ting)?\b/i,
  /\bbelongs? together\b|\bgo(es)? together\b|\bwork(s)? together\b/i,
  /\bwork(s)? well\b|\bgets? along\b|\bclash(es)?\b/i,
  /\bpairing\b|\bcompatibility\b|\bchemistry\b|\baffinity\b/i,
  /\bstrong\b|\bweak\b|\bgood\b|\bbad\b|\bpoor\b|\bideal\b/i,
  /\bsuccess\w*|\bfail(s|ure|ed)?\b|\bthrive\w*|\bstruggle\w*/i,
  /\beasy\b|\bhard\b|\bdifficult\b|\bsmooth\b|\bfriction\b/i,
]);

// Third-person pronouns for PEOPLE. The dyad's sentences take branches,
// elements, brackets and numbers as subjects — never a person, which is what
// keeps a relation between two coordinates from reading as a claim about two
// people. `it`/`its` are permitted: they refer to the coordinate.
const PERSON_SUBJECTS = Object.freeze([
  /\bhe\b/i, /\bshe\b/i, /\bhim\b/i, /\bher\b/i, /\bhis\b/i, /\bhers\b/i,
  /\bthey\b/i, /\bthem\b/i, /\btheir(s)?\b/i,
  /\bpeople\b/i, /\bpersons?\b/i, /\bsomeone\b/i, /\banyone\b/i,
]);

describe('dyad content — the §1.I register law, extended to two people (§1.J)', () => {
  it('claims no compatibility, score, ranking, advice or prediction', () => {
    const hits = [];
    for (const { path, text } of ALL()) {
      for (const pattern of COMPATIBILITY_CLAIMS) {
        if (pattern.test(text)) hits.push(`${path}: ${pattern} — "${text}"`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('takes no person as a grammatical subject', () => {
    const hits = [];
    for (const { path, text } of ALL()) {
      for (const pattern of PERSON_SUBJECTS) {
        if (pattern.test(text)) hits.push(`${path}: ${pattern} — "${text}"`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('the claim-scan and person-scan actually fire (guard the guard)', () => {
    // The pii_scan.test.js sentinel pattern: a scan that can never fail is a
    // false green. Every string below is a verdict this surface must never
    // emit, and the first four are the ones the PRE-FIX guard let through
    // (PR #187 F7.3) — they are here so the hole cannot silently reopen.
    const claims = [
      'both names fit together',
      'the two sheets belong together',
      'a strong pairing',
      'they work well as a pair',
      'the pair scores 82 percent compatible and should marry.',
      'this combination has good chemistry',
      'the two clash and will struggle',
      'an ideal match with smooth affinity',
    ];
    for (const claim of claims) {
      expect(COMPATIBILITY_CLAIMS.some(p => p.test(claim)), `missed: "${claim}"`).toBe(true);
    }
    const persons = [
      'she brings structure and they will balance him.',
      'his register meets hers',
      'people with this pair tend to lead',
    ];
    for (const person of persons) {
      expect(PERSON_SUBJECTS.some(p => p.test(person)), `missed: "${person}"`).toBe(true);
    }
    // ...and neither is so loose that the shipped prose only passes by luck:
    // every authored and assembled string is checked in the two tests above,
    // so a pattern that over-fires reddens them rather than hiding here.
    expect(COMPATIBILITY_CLAIMS.some(p => p.test(ELEMENT_RELATIONS.wood_fire.body))).toBe(false);
    expect(PERSON_SUBJECTS.some(p => p.test(BRANCH_REGISTERS.liuhe.body))).toBe(false);
  });

  it('every reading carries the qualifier, unchanged', () => {
    for (const a of SWEEP.slice(0, 4)) {
      for (const b of SWEEP.slice(0, 4)) {
        expect(buildDyadReading(a, b).relation.qualifier).toBe('recorded, not certified.');
      }
    }
  });
});

describe('dyad content — grammar discipline (§1.J, the deck-pin convention)', () => {
  it('every body is one sentence: a single terminal period, no ; ? !', () => {
    const bad = [];
    for (const { path, text } of bodies()) {
      const periods = (text.match(/\./g) ?? []).length;
      if (periods !== 1 || !text.endsWith('.') || /[;?!]/.test(text)) bad.push(path);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every body is 10–22 words', () => {
    const bad = [];
    for (const { path, text } of bodies()) {
      const n = words(text).length;
      if (n < 10 || n > 22) bad.push(`${path}: ${n} words`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('no apostrophes anywhere — the deck-wide house convention', () => {
    const bad = [...tableStrings()]
      .filter(({ text }) => /['’]/.test(text))
      .map(h => h.path);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('element bodies open with their `from` element and name their `to`', () => {
    const bad = [];
    for (const [key, entry] of Object.entries(ELEMENT_RELATIONS)) {
      if (words(entry.body)[0] !== entry.from) bad.push(`${key}: opener`);
      if (!new RegExp(`\\b${entry.to}\\b`).test(entry.body)) bad.push(`${key}: missing "${entry.to}"`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('element bodies carry their kind-registered verb', () => {
    const bad = [];
    for (const [key, entry] of Object.entries(ELEMENT_RELATIONS)) {
      const { verb } = ELEMENT_RELATION_KINDS[entry.kind];
      if (!entry.body.includes(verb)) bad.push(`${key}: missing "${verb}"`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the combined-path frames state arithmetic and NOTHING else (F6)', () => {
    // The nine authored bodies this replaces restated the registry's own
    // clauses. A frame is safe precisely because it cannot: it is a template
    // over two integers, so it carries no per-number content to drift.
    expect(Object.keys(COMBINED_PATH_FRAMES).sort()).toEqual(['direct', 'reduced']);
    for (const [key, frame] of Object.entries(COMBINED_PATH_FRAMES)) {
      expect(frame, `${key} opener`).toMatch(/^the two life paths sum to \{/);
      expect(frame, `${key} placeholder`).toContain('{combined}');
      // No theme word, no register noun, no registry body — for ANY number.
      for (const entry of Object.values(NUMEROLOGY_MEANINGS)) {
        expect(frame, `${key} leaks theme`).not.toMatch(new RegExp(`\\b${entry.theme}\\b`));
        expect(frame, `${key} leaks register`).not.toContain(entry.register);
        expect(frame, `${key} leaks body`).not.toContain(entry.body);
      }
    }
    // The reduced frame must name the sum it reduced FROM; the direct one must
    // not claim a reduction happened.
    expect(COMBINED_PATH_FRAMES.reduced).toContain('{sum}');
    expect(COMBINED_PATH_FRAMES.direct).not.toContain('{sum}');
  });

  it('the rendered meaning is the registry entry, byte-for-byte', () => {
    // The identity pin. Anything short of `toBe` would re-admit a paraphrase.
    for (const a of SWEEP.slice(0, 5)) {
      for (const b of SWEEP.slice(0, 5)) {
        const { numerology } = buildDyadReading(a, b).relation;
        expect(numerology.meaning)
          .toBe(NUMEROLOGY_MEANINGS[String(numerology.combined)].body);
      }
    }
  });

  it('branch bodies open on the branches, and cover exactly the six states', () => {
    expect(Object.keys(BRANCH_REGISTERS).sort())
      .toEqual(['chong', 'hai', 'liuhe', 'sanhe', 'unfiled', 'xing']);
    for (const [key, register] of Object.entries(BRANCH_REGISTERS)) {
      expect(register.body, key).toMatch(/^the two year branches\b/);
    }
    // The unfiled state must SAY nothing is filed — the §1.I register law
    // forbids inventing a relation, and the honesty has to be in the prose.
    expect(BRANCH_REGISTERS.unfiled.body).toMatch(/\bno named relation\b/);
  });

  it('bracket bodies cover all nine ordered pairs with the matched/mixed openers', () => {
    const brackets = ['low', 'mid', 'high'];
    const expected = [];
    for (const a of brackets) for (const b of brackets) expected.push(`${a}_${b}`);
    expect(Object.keys(BRACKET_REGISTERS).sort()).toEqual(expected.sort());
    for (const [key, register] of Object.entries(BRACKET_REGISTERS)) {
      const matched = register.a === register.b;
      expect(register.body, key)
        .toMatch(matched ? /^both entries sit in the\b/ : /^the first entry sits in the\b/);
      expect(register.body, `${key}: arc A`).toContain(BRACKET_ARC[register.a]);
      expect(register.body, `${key}: arc B`).toContain(BRACKET_ARC[register.b]);
    }
  });

  it('the tables are frozen — content is versioned, not edited (§4)', () => {
    for (const table of [ELEMENT_RELATIONS, ELEMENT_RELATION_KINDS, COMBINED_PATH_FRAMES,
      BRANCH_REGISTERS, BRACKET_REGISTERS, BRACKET_ARC, DYAD_SOURCES]) {
      expect(Object.isFrozen(table)).toBe(true);
    }
    expect(() => { ELEMENT_RELATIONS.wood_fire = null; }).toThrow();
  });
});
