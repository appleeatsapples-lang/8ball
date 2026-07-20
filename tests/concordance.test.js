// Registry + Concordance MVP — finite relation inventory and host boundaries.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANIMAL_RELATION_FAMILIES,
  CONCORDANCE_QUALIFIER,
  ELEMENTS,
  ELEMENT_KE,
  ELEMENT_SHENG,
  MAJOR_ARCANA,
  MASTER_REDUCTION_LINKS,
  REGISTRY_SOURCES,
  SIGN_DISTANCE_RELATIONS,
  SIGNS,
} from '../content/concordance.v1.js';
import { buildConcordance, CONCORDANCE_STATUSES } from '../ui/concordance.js';
import { BANNED_VOICE_REGISTER, BANNED_PATTERNS } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const concordanceJs = readFileSync(join(__dirname, '..', 'ui', 'concordance.js'), 'utf-8');
const readingsJs = readFileSync(join(__dirname, '..', 'ui', 'readings.js'), 'utf-8');

const ANIMALS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
];

function profile(overrides = {}) {
  return {
    sunSign: 'aries', animal: 'rat', chineseElement: 'wood', lifePath: 11,
    birthCard: { number: 1, label: 'I · the magician' },
    ...overrides,
  };
}

function axis(left, right, key, tier = 't1') {
  return buildConcordance(left, right, { tier }).axes.find(item => item.key === key);
}

function unorderedPairs(values) {
  const pairs = [];
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) pairs.push([values[i], values[j]]);
  }
  return pairs;
}

describe('concordance finite registries', () => {
  it('registers all 66 distinct western sign-distance pairs', () => {
    const records = unorderedPairs(SIGNS).map(([left, right]) =>
      axis(profile({ sunSign: left }), profile({ sunSign: right }), 'sun'));
    expect(records).toHaveLength(66);
    expect(records.every(record => record.status === 'registered')).toBe(true);
  });

  it('registers exactly the 33 named public-animal pairs', () => {
    const records = unorderedPairs(ANIMALS).map(([left, right]) =>
      axis(profile({ animal: left }), profile({ animal: right }), 'animal'));
    expect(records.filter(record => record.status === 'registered')).toHaveLength(33);
    expect(records.filter(record => record.status === 'unfiled')).toHaveLength(33);
    const overlap = axis(profile({ animal: 'snake' }), profile({ animal: 'monkey' }), 'animal');
    expect(overlap.relation).toBe('liuhe · harmony + xing · punishment');
  });

  it('registers all 10 distinct five-phase pairs with direction', () => {
    const records = unorderedPairs(ELEMENTS).map(([left, right]) =>
      axis(profile({ chineseElement: left }), profile({ chineseElement: right }), 'element'));
    expect(records).toHaveLength(10);
    expect(records.every(record => record.status === 'registered')).toBe(true);
    expect(axis(
      profile({ chineseElement: 'fire' }),
      profile({ chineseElement: 'wood' }),
      'element',
    ).relation).toBe('wood generates fire · sheng cycle');
  });

  it('registers only the three master-number reduction links', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
    const records = unorderedPairs(values).map(([left, right]) =>
      axis(profile({ lifePath: left }), profile({ lifePath: right }), 'lifePath'));
    expect(records.filter(record => record.status === 'registered')).toHaveLength(3);
    for (const [master, base] of MASTER_REDUCTION_LINKS) {
      expect(axis(profile({ lifePath: master }), profile({ lifePath: base }), 'lifePath'))
        .toMatchObject({ status: 'registered', relation: `${master} reduces to ${base}` });
    }
  });

  it('registers only the 21 adjacent trump-number pairs', () => {
    const cards = MAJOR_ARCANA.map((name, number) => ({ number, label: `${number} · ${name}` }));
    const records = unorderedPairs(cards).map(([left, right]) =>
      axis(profile({ birthCard: left }), profile({ birthCard: right }), 'birthCard'));
    expect(records.filter(record => record.status === 'registered')).toHaveLength(21);
    expect(records.filter(record => record.status === 'unfiled')).toHaveLength(210);
  });

  it('marks same-value and unsupported pairs unfiled instead of inventing synthesis', () => {
    const result = buildConcordance(profile(), profile(), { tier: 't1' });
    expect(result.axes.map(item => item.status)).toEqual([
      'unfiled', 'unfiled', 'unfiled', 'unfiled', 'unfiled',
    ]);
    expect(result.axes.every(item => item.relation === 'no named relation is filed for this pair.')).toBe(true);
  });
});

describe('content/concordance.v1.js — voice register + content policy (DOCTRINE §2/§1.I RC-L2)', () => {
  /** Collect every string the shipped registry may surface or cite. */
  function* registryStrings() {
    for (const [key, text] of Object.entries(REGISTRY_SOURCES)) {
      yield { path: `REGISTRY_SOURCES.${key}`, text };
    }
    for (const [dist, rec] of Object.entries(SIGN_DISTANCE_RELATIONS)) {
      yield { path: `SIGN_DISTANCE_RELATIONS[${dist}].distance`, text: rec.distance };
      yield { path: `SIGN_DISTANCE_RELATIONS[${dist}].relation`, text: rec.relation };
    }
    for (const family of ANIMAL_RELATION_FAMILIES) {
      yield { path: `ANIMAL_RELATION_FAMILIES.${family.key}.label`, text: family.label };
      yield { path: `ANIMAL_RELATION_FAMILIES.${family.key}.note`, text: family.note };
    }
    for (const name of SIGNS) yield { path: `SIGNS:${name}`, text: name };
    for (const name of ELEMENTS) yield { path: `ELEMENTS:${name}`, text: name };
    for (const name of MAJOR_ARCANA) yield { path: `MAJOR_ARCANA:${name}`, text: name };
    for (const [from, to] of Object.entries(ELEMENT_SHENG)) {
      yield { path: `ELEMENT_SHENG.${from}`, text: `${from}→${to}` };
    }
    for (const [from, to] of Object.entries(ELEMENT_KE)) {
      yield { path: `ELEMENT_KE.${from}`, text: `${from}→${to}` };
    }
    yield { path: 'CONCORDANCE_QUALIFIER', text: CONCORDANCE_QUALIFIER };
    // Master links are numbers only; still stringify for a complete walk.
    for (const [i, link] of MASTER_REDUCTION_LINKS.entries()) {
      yield { path: `MASTER_REDUCTION_LINKS[${i}]`, text: link.join('→') };
    }
  }

  it('no BANNED_VOICE_REGISTER hits', () => {
    const hits = [];
    for (const { path, text } of registryStrings()) {
      for (const term of BANNED_VOICE_REGISTER) {
        const re = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (re.test(text)) hits.push(`${path}: matched "${term}" in "${text}"`);
      }
    }
    expect(hits, `Voice-register violations in concordance.v1.js:\n${hits.join('\n')}`).toEqual([]);
  });

  it('no BANNED_PATTERNS slur hits', () => {
    const hits = [];
    for (const { path, text } of registryStrings()) {
      for (const re of BANNED_PATTERNS) {
        if (re.test(text)) hits.push(`${path}: matched ${re}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('never addresses the reader directly ("you"/"your")', () => {
    const hits = [];
    for (const { path, text } of registryStrings()) {
      if (/\byou\b|\byour\b|\byou're\b/i.test(text)) hits.push(`${path}: ${text}`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

describe('concordance product and privacy contract', () => {
  it('omits the paid element axis at free and includes it when entitled', () => {
    const left = profile();
    const right = profile({ chineseElement: 'fire' });
    const free = buildConcordance(left, right, { tier: 'free' });
    expect(free.axes.map(item => item.key)).toEqual(['sun', 'animal', 'lifePath', 'birthCard']);
    expect(free.omitted).toEqual(['element']);
    expect(buildConcordance(left, right, { tier: 't1' }).axes.map(item => item.key))
      .toEqual(['sun', 'animal', 'element', 'lifePath', 'birthCard']);
  });

  it('returns only disclosed statuses, source metadata, and transient retention', () => {
    const result = buildConcordance(
      profile(),
      profile({ sunSign: 'libra', animal: 'ox', chineseElement: 'fire', lifePath: 2,
        birthCard: { number: 2, label: 'II · the high priestess' } }),
      { tier: 't1' },
    );
    expect(result.retention).toBe('transient');
    expect(Object.keys(CONCORDANCE_STATUSES).sort()).toEqual(['adjacent', 'registered', 'unfiled']);
    for (const record of result.axes) {
      expect(CONCORDANCE_STATUSES).toHaveProperty(record.status);
      expect(record.registry).toBeTruthy();
      expect(record.citation).toBeTruthy();
      expect(record.qualifier).toBe('recorded, not certified.');
    }
    expect(JSON.stringify(result)).not.toMatch(/percent|score|forecast|advice|soulmate/i);
  });

  it('does not mutate calculated profiles', () => {
    const left = profile();
    const right = profile({ sunSign: 'taurus', birthCard: { number: 2, label: 'II' } });
    const before = JSON.stringify([left, right]);
    buildConcordance(left, right, { tier: 't1' });
    expect(JSON.stringify([left, right])).toBe(before);
  });

  it('recomputes in the host and gives concordance no storage or network capability', () => {
    expect(html).toMatch(/import\s*\{\s*buildConcordance\s*\}\s*from\s*['"]\.\/ui\/concordance\.js['"]/);
    expect(html).toMatch(/compareReadings:\s*\(left, right\)\s*=>\s*buildConcordance\([\s\S]*profileFromPayload\(left\.profile\)[\s\S]*profileFromPayload\(right\.profile\)[\s\S]*getRenderTier/);
    expect(concordanceJs).not.toMatch(/localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|sendBeacon/);
    expect(readingsJs.match(/eight_ball_[a-z0-9_]+/g)).toEqual(['eight_ball_saved_readings_v1']);
  });

  it('exposes an accessible two-selection flow and a separate comparison screen', () => {
    expect(readingsJs).toMatch(/type = 'checkbox'/);
    expect(readingsJs).toMatch(/aria-label.*for comparison/);
    expect(readingsJs).toMatch(/id="readings-compare"[^>]*aria-describedby="readings-selection-status"[^>]*disabled/);
    expect(readingsJs).toMatch(/className = 'screen hidden concordance-screen'/);
    expect(readingsJs).toMatch(/comparisonHeading\.focus\(\)/);
    expect(readingsJs).toMatch(/min-height: 44px/);
    expect(readingsJs).toMatch(/@media \(min-width: 720px\)/);
    expect(readingsJs).toMatch(/comparisons are not stored/);
  });
});
