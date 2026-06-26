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