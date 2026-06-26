// tests/derive_traces.test.js — lab trace builders match core outputs

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfile } from '../core/profile.js';
import { getCard } from '../core/engine.js';
import { getBirthCard } from '../core/birthcard.js';
import {
  buildFreeTraces,
  traceArcana,
  traceSun,
  traceAnimal,
  traceLifePath,
  traceCatalog,
} from '../lab/derive-traces.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(join(__dirname, 'fixtures.json'), 'utf-8')
);

describe('derive-traces — value parity with core', () => {
  for (const c of fixtures.cases) {
    if (!c.dob || !c.expected) continue;
    const needs = ['sunSign', 'animal', 'lifePath'].filter(k => k in c.expected);
    if (needs.length === 0) continue;

    it(`${c.label}: trace values match buildProfile`, () => {
      const profile = buildProfile('Test Specimen', c.dob);
      const traces = buildFreeTraces(profile);

      if ('sunSign' in c.expected) {
        expect(traces.sun.value).toBe(c.expected.sunSign);
        expect(profile.sunSign).toBe(c.expected.sunSign);
      }
      if ('animal' in c.expected) {
        expect(traces.animal.value).toBe(c.expected.animal);
        expect(profile.animal).toBe(c.expected.animal);
      }
      if ('lifePath' in c.expected) {
        expect(traces.lifePath.value).toBe(String(c.expected.lifePath));
        expect(profile.lifePath).toBe(c.expected.lifePath);
      }

      expect(traces.arcana.value).toBe(getBirthCard(profile.yyyy, profile.mm, profile.dd).label);
      expect(traces.catalog.value).toBe(getCard(profile).catalog);
    });
  }
});

describe('derive-traces — structure', () => {
  it('each free trace has coordinate, label, value, steps with op', () => {
    const profile = buildProfile('Sam Carter', '1991-07-16');
    const traces = buildFreeTraces(profile);
    for (const key of ['arcana', 'sun', 'animal', 'lifePath', 'catalog']) {
      const t = traces[key];
      expect(t.coordinate).toBe(key);
      expect(typeof t.label).toBe('string');
      expect(typeof t.value).toBe('string');
      expect(t.value.length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
      expect(t.steps.every(s => s && typeof s.op === 'string')).toBe(true);
    }
  });

  it('catalog trace documents positional driver', () => {
    const profile = buildProfile('Jane Doe', '1988-03-02');
    const t = traceCatalog(profile);
    expect(t.steps.some(s => s.op === 'positional_index')).toBe(true);
    expect(t.steps.some(s => s.op === 'catalog_driver')).toBe(true);
  });

  it('lifePath trace includes digit sums and reduction', () => {
    const t = traceLifePath(1993, 7, 24);
    expect(t.value).toBe(String(buildProfile('X', '1993-07-24').lifePath));
    expect(t.steps.some(s => s.op === 'digit_sum')).toBe(true);
    expect(t.steps.some(s => s.op === 'reduce_pythagorean' || s.op === 'digit_sum_reduce')).toBe(true);
  });

  it('Mara Solin (1993-07-24): pins exact steps arrays for all free coordinates', () => {
    const profile = buildProfile('Mara Solin', '1993-07-24');
    const traces = buildFreeTraces(profile);

    expect(traces.lifePath.steps).toEqual([
      { op: 'digit_sum', field: 'year', digits: '1993', sum: 22 },
      { op: 'digit_sum', field: 'month', digits: '7', sum: 7 },
      { op: 'digit_sum', field: 'day', digits: '24', sum: 6 },
      { op: 'add', values: [22, 7, 6], result: 35 },
      { op: 'reduce_pythagorean', from: 35, masters: [11, 22, 33], result: 8 },
      { op: 'digit_sum_reduce', from: 35, result: 8 },
      { op: 'result', field: 'lifePath', value: 8 },
    ]);

    expect(traces.arcana.steps).toEqual([
      { op: 'digit_sum', field: 'year', digits: '1993', sum: 22 },
      { op: 'digit_sum', field: 'month', digits: '7', sum: 7 },
      { op: 'digit_sum', field: 'day', digits: '24', sum: 6 },
      { op: 'add', values: [22, 7, 6], result: 35 },
      { op: 'digit_sum_reduce_to_22', from: 35, result: 8 },
      {
        op: 'major_arcana_map',
        index: 8,
        roman: 'VIII',
        name: 'strength',
        label: 'VIII · strength',
      },
    ]);

    expect(traces.sun.steps).toEqual([
      {
        op: 'tropical_cusp_lookup',
        dob: '1993-07-24',
        system: 'western tropical zodiac',
      },
      {
        op: 'cusp_match',
        sign: 'leo',
        start: '07-23',
        end: '08-22',
        wrapsYear: false,
      },
      { op: 'result', field: 'sunSign', value: 'leo' },
    ]);

    expect(traces.animal.steps).toEqual([
      {
        op: 'lunar_new_year_lookup',
        gregorianYear: 1993,
        lnyDate: '1993-01-23',
        timezone: 'Asia/Shanghai (date-precision)',
      },
      {
        op: 'lunar_year_resolve',
        dob: '1993-07-24',
        beforeLny: false,
        lunarYear: 1993,
      },
      {
        op: 'zodiac_cycle',
        anchorYear: 2020,
        anchorAnimal: 'rat',
        lunarYear: 1993,
        index: 9,
      },
      {
        op: 'animal_lookup',
        index: 9,
        animal: 'rooster',
        animalList: [
          'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
          'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
        ],
      },
      {
        op: 'result',
        field: 'publicAnimal',
        value: 'rooster',
        pillar: 'year-pillar',
      },
    ]);

    expect(traces.catalog.steps).toEqual([
      {
        op: 'catalog_driver',
        note: 'catalog index derives from (sunSign, publicAnimal) only',
        sunSign: 'leo',
        publicAnimal: 'rooster',
      },
      {
        op: 'sun_row_index',
        sunSign: 'leo',
        index: 4,
        sunOrder: [
          'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
          'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
        ],
      },
      {
        op: 'animal_col_index',
        publicAnimal: 'rooster',
        index: 9,
        animalOrder: [
          'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
          'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
        ],
      },
      { op: 'positional_index', formula: 'sunIdx * 12 + animalIdx + 1', arabic: 58 },
      { op: 'roman_numeral', arabic: 58, roman: 'lviii' },
      { op: 'result', field: 'catalog', value: 'lviii' },
    ]);
  });

  it('animal trace references lunar new year', () => {
    const t = traceAnimal(2021, 2, 3);
    expect(t.value).toBe('rat');
    expect(t.steps.some(s => s.op === 'lunar_new_year_lookup')).toBe(true);
  });

  it('sun trace matches getSunSign', () => {
    const t = traceSun(1990, 1, 20);
    expect(t.value).toBe('aquarius');
  });
});