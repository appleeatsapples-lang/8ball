// tests/content_shape.test.js
// Grammar pins recovered from the 2026-07-20 night content study
// (~/8ball/content_study/). Asserts current cards.v1.full.js truth so any
// future cards.v2 authoring cannot silently break the deck's recovered arc
// without a same-PR test update. Does NOT edit content (DOCTRINE §4).

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
    expect(nameHits).toHaveLength(11);
    const headInversions = nameHits.filter(({ name }) => words(name)[2] === 'velvet');
    expect(headInversions.map(h => h.name)).toEqual(['the sad velvet']);
  });
});
