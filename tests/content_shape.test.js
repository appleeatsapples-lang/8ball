// tests/content_shape.test.js
// Grammar pins recovered from the 2026-07-20 night content study
// (~/8ball/content_study/). Asserts current cards.v1.full.js truth so any
// future cards.v2 authoring cannot silently break the deck's recovered arc
// without a same-PR test update. Does NOT edit content (DOCTRINE §4).
//
// PR3 (full lint_spec_proposal.md coverage): structure, identity-token
// bans, the type-slot registry, low/high opener ownership tables, lexical
// rules (defect nouns, row injections, dog archive, weather watch-token),
// the cross-column repeats budget, per-column formula floors, and habit
// word-bounds. Every number below was re-derived by script against this
// tree before pinning (the qa_spotcheck discipline: derive at write time,
// name units beside counts). Change protocol per the spec: a cards.v2
// updates these pins in the same PR, visibly.

import { describe, it, expect } from 'vitest';
import { CARDS } from '../content/cards.v1.full.js';

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);
const opener = (s) => words(s)[0].toLowerCase().replace(/,$/, '');

function* cells() {
  for (const [sun, row] of Object.entries(CARDS)) {
    for (const [animal, cell] of Object.entries(row)) {
      yield { sun, animal, cell };
    }
  }
}

const MID_EXCEPTIONS = Object.freeze([
  Object.freeze({ sun: 'aries', animal: 'rat', verb: 'turns' }),
  Object.freeze({ sun: 'aries', animal: 'tiger', verb: 'turns' }),
  Object.freeze({ sun: 'aries', animal: 'rabbit', verb: 'repairs' }),
  Object.freeze({ sun: 'aries', animal: 'dragon', verb: 'turns' }),
  Object.freeze({ sun: 'aries', animal: 'monkey', verb: 'turns' }),
]);

describe('content shape — names', () => {
  it('144 unique names, each exactly three words starting with "the"', () => {
    const names = [...cells()].map(({ cell }) => cell.name);
    expect(names).toHaveLength(144);
    expect(new Set(names).size).toBe(144);
    const malformed = names.filter((n) => !/^the \S+ \S+$/.test(n));
    expect(malformed, `malformed names:\n${malformed.join('\n')}`).toEqual([]);
  });
});

describe('content shape — mid openers (arrival→construction→command arc)', () => {
  it('mid notes open with builds except five licensed aries cells', () => {
    const exceptions = [];
    let builds = 0;
    for (const { sun, animal, cell } of cells()) {
      const verb = opener(cell.note.mid);
      if (verb === 'builds') builds += 1;
      else exceptions.push({ sun, animal, verb });
    }
    expect(builds).toBe(139);
    expect(exceptions).toEqual(
      MID_EXCEPTIONS.map(({ sun, animal, verb }) => ({ sun, animal, verb })),
    );
  });
});

describe('content shape — note length discipline', () => {
  it('every low/mid/high note is 8–13 words', () => {
    const bad = [];
    for (const { sun, animal, cell } of cells()) {
      for (const bracket of ['low', 'mid', 'high']) {
        const n = words(cell.note[bracket]).length;
        if (n < 8 || n > 13) bad.push(`${sun}×${animal}.${bracket}: ${n} words`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('exactly one 13-word note exists: virgo × dragon low', () => {
    const thirteens = [];
    for (const { sun, animal, cell } of cells()) {
      for (const bracket of ['low', 'mid', 'high']) {
        if (words(cell.note[bracket]).length === 13) {
          thirteens.push({ sun, animal, bracket });
        }
      }
    }
    expect(thirteens).toEqual([{ sun: 'virgo', animal: 'dragon', bracket: 'low' }]);
  });
});

describe('content shape — voice (deck strings)', () => {
  function* deckStrings() {
    for (const { sun, animal, cell } of cells()) {
      yield { path: `${sun}.${animal}.name`, text: cell.name };
      yield { path: `${sun}.${animal}.type`, text: cell.type };
      yield { path: `${sun}.${animal}.habit`, text: cell.habit };
      for (const bracket of ['low', 'mid', 'high']) {
        yield { path: `${sun}.${animal}.note.${bracket}`, text: cell.note[bracket] };
      }
    }
  }

  it('never addresses the reader (you/your) in any deck string', () => {
    const hits = [];
    for (const { path, text } of deckStrings()) {
      if (/\byou\b|\byour\b|\byou're\b/i.test(text)) hits.push(path);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

describe('content shape — velvet lexicon', () => {
  it('velvet appears only in names, exactly 11 times, one head inversion', () => {
    const nameHits = [];
    const otherHits = [];
    for (const { sun, animal, cell } of cells()) {
      if (/\bvelvet\b/i.test(cell.name)) nameHits.push({ sun, animal, name: cell.name });
      for (const [field, text] of [
        ['type', cell.type], ['habit', cell.habit],
        ['note.low', cell.note.low], ['note.mid', cell.note.mid], ['note.high', cell.note.high],
      ]) {
        if (/\bvelvet\b/i.test(text)) otherHits.push(`${sun}.${animal}.${field}`);
      }
    }
    expect(otherHits, `velvet leaked outside names:\n${otherHits.join('\n')}`).toEqual([]);
    expect(nameHits.map((h) => h.name).sort()).toEqual([
      'the sad velvet', 'the velvet alarm', 'the velvet appetite',
      'the velvet command', 'the velvet demand', 'the velvet shove',
      'the velvet spark', 'the velvet storm', 'the velvet strike',
      'the velvet sulk', 'the velvet trapdoor',
    ]);
    const headInversions = nameHits.filter(({ name }) => words(name)[2] === 'velvet');
    expect(headInversions.map(h => h.name)).toEqual(['the sad velvet']);
  });
});

// ————————————————————————————————————————————————————————————————————————
// PR3 additions — full lint-spec coverage from here down.
// ————————————————————————————————————————————————————————————————————————

const SUN_ORDER = Object.freeze([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]);
const ANIMAL_ORDER = Object.freeze([
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
]);

// The 28 type-slot archetype tokens (left of the seam), alphabetical.
const ARCHETYPE_REGISTRY = Object.freeze([
  'aesthete', 'architect', 'brave animal', 'critic', 'defender', 'director',
  'escape artist', 'force', 'foreman', 'freight animal', 'freight engine',
  'guard', 'guardian', 'host', 'impulse', 'inspector', 'institution',
  'keeper', 'magnet', 'mythmaker', 'operator', 'performer', 'runner',
  'sovereign', 'strategist', 'trick mechanic', 'trickster', 'worker',
]);

// Per-column opener censuses (exact). The arc's onset and command verbs are
// column-owned; a v2 that moves one updates the row here, visibly.
const LOW_OPENERS = Object.freeze({
  rat: { starts: 12 },
  ox: { starts: 10, begins: 2 },
  tiger: { starts: 11, speaks: 1 },
  rabbit: { starts: 9, arrives: 3 },
  dragon: { appears: 10, arrives: 2 },
  snake: { starts: 12 },
  horse: { starts: 11, begins: 1 },
  goat: { enters: 12 },
  monkey: { starts: 12 },
  rooster: { announces: 11, starts: 1 },
  dog: { starts: 11, rushes: 1 },
  pig: { starts: 12 },
});
const HIGH_OPENERS = Object.freeze({
  rat: { treats: 10, studies: 1, calculates: 1 },
  ox: { reads: 9, plans: 1, measures: 1, treats: 1 },
  tiger: { handles: 6, frames: 3, reads: 2, studies: 1 },
  rabbit: { maps: 7, catalogs: 3, analyzes: 1, indexes: 1 },
  dragon: { frames: 5, handles: 4, treats: 2, studies: 1 },
  snake: { keeps: 4, handles: 4, treats: 3, reads: 1 },
  horse: { treats: 8, reads: 2, studies: 1, frames: 1 },
  goat: { reads: 7, indexes: 4, turns: 1 },
  monkey: { runs: 10, studies: 1, handles: 1 },
  rooster: { reads: 11, studies: 1 },
  dog: { treats: 11, studies: 1 },
  pig: { knows: 11, studies: 1 },
});
// The aries row abandons each column's dominant command verb (the license);
// snake is the lone full suppression (keeps is snake's own custody verb).
const ARIES_HIGH_OPENERS = Object.freeze({
  rat: 'studies', ox: 'plans', tiger: 'studies', rabbit: 'analyzes',
  dragon: 'studies', snake: 'keeps', horse: 'studies', goat: 'turns',
  monkey: 'studies', rooster: 'studies', dog: 'studies', pig: 'studies',
});

const columnOpeners = (animal, bracket) => {
  const counts = {};
  for (const sun of SUN_ORDER) {
    const verb = opener(CARDS[sun][animal].note[bracket]);
    counts[verb] = (counts[verb] ?? 0) + 1;
  }
  return counts;
};

describe('content shape — structure (grid and cell fields)', () => {
  it('grid is 12 suns × 12 animals in canonical catalog order', () => {
    expect(Object.keys(CARDS)).toEqual([...SUN_ORDER]);
    for (const sun of SUN_ORDER) {
      expect(Object.keys(CARDS[sun]), `row ${sun}`).toEqual([...ANIMAL_ORDER]);
    }
  });

  it('every cell carries name/type/habit/catalog and low/mid/high notes', () => {
    for (const { sun, animal, cell } of cells()) {
      for (const field of ['name', 'type', 'habit', 'catalog']) {
        expect(typeof cell[field], `${sun}.${animal}.${field}`).toBe('string');
        expect(cell[field].length, `${sun}.${animal}.${field} empty`).toBeGreaterThan(0);
      }
      expect(Object.keys(cell.note), `${sun}.${animal}.note keys`).toEqual(['low', 'mid', 'high']);
    }
  });
});

describe('content shape — names never name their parents', () => {
  it('no sun-sign or animal name appears as a word in any card name', () => {
    const identity = new Set([...SUN_ORDER, ...ANIMAL_ORDER]);
    const hits = [];
    for (const { sun, animal, cell } of cells()) {
      for (const w of words(cell.name)) {
        if (identity.has(w.toLowerCase().replace(/[^a-z]/g, ''))) {
          hits.push(`${sun}.${animal}: ${cell.name}`);
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('the word "sun" (the star, not the sign) is licensed exactly once', () => {
    const hits = [...cells()]
      .filter(({ cell }) => words(cell.name).some((w) => w.toLowerCase().replace(/[^a-z]/g, '') === 'sun'))
      .map(({ sun, animal, cell }) => ({ sun, animal, name: cell.name }));
    expect(hits).toEqual([{ sun: 'leo', animal: 'pig', name: 'the banquet sun' }]);
  });
});

describe('content shape — type slot (archetype · modifier + anchor noun)', () => {
  it('every type has exactly one seam, a registered archetype, and a two-word right half', () => {
    const bad = [];
    for (const { sun, animal, cell } of cells()) {
      const parts = cell.type.split(' · ');
      if (parts.length !== 2) { bad.push(`${sun}.${animal}: seam count`); continue; }
      if (!ARCHETYPE_REGISTRY.includes(parts[0])) bad.push(`${sun}.${animal}: unregistered archetype "${parts[0]}"`);
      if (words(parts[1]).length !== 2) bad.push(`${sun}.${animal}: right half "${parts[1]}"`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the registry is exactly the 28 recovered tokens (each used at least once)', () => {
    const used = new Set([...cells()].map(({ cell }) => cell.type.split(' · ')[0]));
    expect([...used].sort()).toEqual([...ARCHETYPE_REGISTRY]);
  });
});

describe('content shape — low openers (arrival ownership)', () => {
  it('per-column low-opener censuses match the recovered table', () => {
    for (const animal of ANIMAL_ORDER) {
      expect(columnOpeners(animal, 'low'), `column ${animal}`).toEqual({ ...LOW_OPENERS[animal] });
    }
  });

  it('the singleton onsets sit at their licensed cells', () => {
    const at = (verb) => [...cells()]
      .filter(({ cell }) => opener(cell.note.low) === verb)
      .map(({ sun, animal }) => ({ sun, animal }));
    expect(at('rushes')).toEqual([{ sun: 'aries', animal: 'dog' }]);
    expect(at('speaks')).toEqual([{ sun: 'aries', animal: 'tiger' }]);
    expect(opener(CARDS.sagittarius.rooster.note.low)).toBe('starts'); // the lone announce-break
    expect(opener(CARDS.gemini.dragon.note.low)).toBe('arrives');
    expect(opener(CARDS.cancer.dragon.note.low)).toBe('arrives');
  });
});

describe('content shape — high openers (command ownership + the aries license)', () => {
  it('per-column high-opener censuses match the recovered table', () => {
    for (const animal of ANIMAL_ORDER) {
      expect(columnOpeners(animal, 'high'), `column ${animal}`).toEqual({ ...HIGH_OPENERS[animal] });
    }
  });

  it('the aries row opener per column matches the license map', () => {
    for (const animal of ANIMAL_ORDER) {
      expect(opener(CARDS.aries[animal].note.high), `aries×${animal}`).toBe(ARIES_HIGH_OPENERS[animal]);
    }
  });
});

describe('content shape — lexical rules', () => {
  it('defect anchor nouns are exactly three, on fire-row cells', () => {
    const hits = [...cells()]
      .filter(({ cell }) => /poor brakes|loose screws|no fence/.test(cell.type))
      .map(({ sun, animal, cell }) => ({ sun, animal, type: cell.type }));
    expect(hits).toEqual([
      { sun: 'aries', animal: 'tiger', type: 'brave animal · poor brakes' },
      { sun: 'aries', animal: 'monkey', type: 'trick mechanic · loose screws' },
      { sun: 'sagittarius', animal: 'horse', type: 'runner · no fence' },
    ]);
  });

  it('"circuit" is an aquarius-row injection: two types plus one name, nowhere else', () => {
    const hits = [];
    for (const { sun, animal, cell } of cells()) {
      for (const [field, text] of [
        ['name', cell.name], ['type', cell.type], ['habit', cell.habit],
        ['note.low', cell.note.low], ['note.mid', cell.note.mid], ['note.high', cell.note.high],
      ]) {
        if (/\bcircuit\b/.test(text)) hits.push({ sun, animal, field });
      }
    }
    expect(hits).toEqual([
      { sun: 'aquarius', animal: 'snake', field: 'type' },
      { sun: 'aquarius', animal: 'horse', field: 'name' },
      { sun: 'aquarius', animal: 'monkey', field: 'type' },
    ]);
  });

  it('"scale" as an anchor noun is a libra-row injection (×2)', () => {
    const hits = [...cells()]
      .filter(({ cell }) => words(cell.type.split(' · ')[1]).at(-1) === 'scale')
      .map(({ sun, animal }) => ({ sun, animal }));
    expect(hits).toEqual([
      { sun: 'libra', animal: 'ox' },
      { sun: 'libra', animal: 'rabbit' },
    ]);
  });

  it('the dog archive: "old" in exactly five highs; sagittarius faces forward', () => {
    const oldSuns = SUN_ORDER.filter((sun) => /\bold\b/.test(CARDS[sun].dog.note.high));
    expect(oldSuns).toEqual(['aries', 'cancer', 'scorpio', 'capricorn', 'pisces']);
    expect(CARDS.sagittarius.dog.note.high).toContain('keeps faith moving forward');
  });

  it('weather is the watch-token: exactly 13 word-hits deck-wide', () => {
    // No hard cap by policy — this pin keeps the number a visible diff line
    // instead of silent drift (lint spec §3.6).
    let count = 0;
    for (const { cell } of cells()) {
      for (const text of [cell.name, cell.type, cell.habit, cell.note.low, cell.note.mid, cell.note.high]) {
        count += (text.match(/\bweather\b/g) ?? []).length;
      }
    }
    expect(count).toBe(13);
  });
});

describe('content shape — repeats budget (high-note predicates)', () => {
  it('exactly one cross-column verbatim 4-word high opener; intra-column formulas exempt', () => {
    const groups = new Map();
    for (const { sun, animal, cell } of cells()) {
      const key = words(cell.note.high).slice(0, 4).join(' ').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ sun, animal });
    }
    const crossColumn = [...groups.entries()]
      .filter(([, hits]) => hits.length > 1 && new Set(hits.map((h) => h.animal)).size > 1);
    expect(crossColumn).toEqual([
      ['treats freedom as logistics', [
        { sun: 'virgo', animal: 'horse' },
        { sun: 'sagittarius', animal: 'snake' },
      ]],
    ]);
  });
});

describe('content shape — column formulas (mid payloads and clause signatures)', () => {
  const midOf = (animal) => SUN_ORDER.map((sun) => CARDS[sun][animal].note.mid);
  const highOf = (animal) => SUN_ORDER.map((sun) => CARDS[sun][animal].note.high);

  it('tiger mids argue with the aftermath (10/12; cleanup ×5)', () => {
    expect(midOf('tiger').filter((t) => /\bargues with\b|\bnegotiates\b/.test(t)).length).toBe(10);
    expect(midOf('tiger').filter((t) => /\bcleanup\b/.test(t)).length).toBe(5);
  });

  it('horse mids resent the tether (10/12)', () => {
    expect(midOf('horse').filter((t) => /\bresents\b|\bargues with\b/.test(t)).length).toBe(10);
  });

  it('dog mids patrol (11/12) and gemini alone prosecutes', () => {
    const patrols = SUN_ORDER.filter((sun) => /\bpatrols\b/.test(CARDS[sun].dog.note.mid));
    expect(patrols).toHaveLength(11);
    expect(patrols).not.toContain('gemini');
    expect(CARDS.gemini.dog.note.mid).toMatch(/\bprosecutes\b/);
  });

  it('goat mids build comfort 12/12', () => {
    expect(midOf('goat').every((t) => /^builds comfort\b/.test(t))).toBe(true);
  });

  it('pig mids build the comfort family 12/12 and defend it (9/12)', () => {
    const objects = midOf('pig').map((t) => words(t)[1]);
    for (const obj of objects) expect(['comfort', 'pleasure', 'ease', 'peace']).toContain(obj);
    expect(midOf('pig').filter((t) => /\bdefends\b|\bresists\b|\bstruggles\b/.test(t)).length).toBe(9);
  });

  it('rabbit highs carry the before-clause 11/12; scorpio exits through concealed design', () => {
    const withBefore = SUN_ORDER.filter((sun) => /\bbefore\b/.test(CARDS[sun].rabbit.note.high));
    expect(withBefore).toHaveLength(11);
    expect(withBefore).not.toContain('scorpio');
  });

  it('snake carries nine until slot-hits across habit and notes', () => {
    let hits = 0;
    for (const sun of SUN_ORDER) {
      const c = CARDS[sun].snake;
      for (const text of [c.habit, c.note.low, c.note.mid, c.note.high]) {
        if (/\buntil\b/.test(text)) hits += 1;
      }
    }
    expect(hits).toBe(9);
  });

  it('monkey highs run the until-asymptote in exactly seven cells', () => {
    const suns = SUN_ORDER.filter((sun) => /\buntil\b/.test(CARDS[sun].monkey.note.high));
    expect(suns).toEqual(['gemini', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'pisces']);
  });

  it('rooster highs read and keep groomed (11/12)', () => {
    const both = highOf('rooster')
      .filter((t) => opener(t) === 'reads' && /\bkeeps\b/.test(t));
    expect(both).toHaveLength(11);
  });

  it('pig highs know (11/12)', () => {
    expect(highOf('pig').filter((t) => opener(t) === 'knows').length).toBe(11);
  });
});

describe('content shape — sentence discipline', () => {
  it('every habit and note is one sentence: a single terminal period, no ; ? !', () => {
    const bad = [];
    for (const { sun, animal, cell } of cells()) {
      for (const [field, text] of [
        ['habit', cell.habit], ['note.low', cell.note.low],
        ['note.mid', cell.note.mid], ['note.high', cell.note.high],
      ]) {
        const periods = (text.match(/\./g) ?? []).length;
        if (periods !== 1 || !text.endsWith('.') || /[;?!]/.test(text)) {
          bad.push(`${sun}.${animal}.${field}`);
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the colon-list syntax is licensed exactly once (taurus × dragon high)', () => {
    const colons = [];
    for (const { sun, animal, cell } of cells()) {
      for (const [field, text] of [
        ['habit', cell.habit], ['note.low', cell.note.low],
        ['note.mid', cell.note.mid], ['note.high', cell.note.high],
      ]) {
        if (text.includes(':')) colons.push({ sun, animal, field });
      }
    }
    expect(colons).toEqual([{ sun: 'taurus', animal: 'dragon', field: 'note.high' }]);
  });
});

describe('content shape — habit discipline', () => {
  it('every habit is 7–12 words', () => {
    const bad = [];
    for (const { sun, animal, cell } of cells()) {
      const n = words(cell.habit).length;
      if (n < 7 || n > 12) bad.push(`${sun}×${animal}: ${n} words`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the floor and ceiling cells are exactly the recovered six', () => {
    const floors = [];
    const ceilings = [];
    for (const { sun, animal, cell } of cells()) {
      const n = words(cell.habit).length;
      if (n === 7) floors.push({ sun, animal });
      if (n === 12) ceilings.push({ sun, animal });
    }
    expect(floors).toEqual([
      { sun: 'virgo', animal: 'dragon' },
      { sun: 'sagittarius', animal: 'goat' },
      { sun: 'capricorn', animal: 'monkey' },
      { sun: 'aquarius', animal: 'horse' },
    ]);
    expect(ceilings).toEqual([
      { sun: 'gemini', animal: 'snake' },
      { sun: 'aquarius', animal: 'dragon' },
    ]);
  });
});
