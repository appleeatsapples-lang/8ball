// tests/derive_integrity.test.js — payloadIntegrityFails chain validation

import { describe, it, expect } from 'vitest';
import { buildProfile } from '../core/profile.js';
import { buildFreeTraces } from '../lab/derive-traces.js';
import { validateTracePayload, payloadIntegrityFails } from '../lab/interrogate-shared.js';

function tracePayload(trace) {
  const validated = validateTracePayload(trace);
  expect(validated.ok).toBe(true);
  return validated.payload;
}

function mutate(trace, mutator) {
  const steps = trace.steps.map(s => ({ ...s }));
  mutator(steps);
  return tracePayload({ ...trace, steps });
}

describe('payloadIntegrityFails — legitimate traces pass', () => {
  it('Mara Solin (1993-07-24): all five free coordinates', () => {
    const traces = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24'));
    for (const key of ['arcana', 'sun', 'animal', 'lifePath', 'catalog']) {
      expect(payloadIntegrityFails(tracePayload(traces[key]))).toBeNull();
    }
  });

  it('master-22 life path (1990-01-20)', () => {
    const trace = buildFreeTraces(buildProfile('X', '1990-01-20')).lifePath;
    expect(payloadIntegrityFails(tracePayload(trace))).toBeNull();
  });

  it('cusp sun (1985-12-22 capricorn)', () => {
    const trace = buildFreeTraces(buildProfile('X', '1985-12-22')).sun;
    expect(payloadIntegrityFails(tracePayload(trace))).toBeNull();
  });

  it('LNY-boundary animal (2021-02-03 rat)', () => {
    const trace = buildFreeTraces(buildProfile('X', '2021-02-03')).animal;
    expect(payloadIntegrityFails(tracePayload(trace))).toBeNull();
  });

  it('fool/22 arcana (1900-02-19)', () => {
    const trace = buildFreeTraces(buildProfile('X', '1900-02-19')).arcana;
    expect(payloadIntegrityFails(tracePayload(trace))).toBeNull();
  });
});

describe('payloadIntegrityFails — mutation probes reject', () => {
  it('sun: cusp_match.sign vs terminal result.value mismatch', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).sun;
    const payload = mutate(trace, steps => {
      const cusp = steps.find(s => s.op === 'cusp_match');
      cusp.sign = 'aries';
    });
    expect(payloadIntegrityFails(payload)).toBe('cusp_match contradicts result');
  });

  it('animal: animal_lookup.animal vs terminal result.value mismatch', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).animal;
    const payload = mutate(trace, steps => {
      const result = steps.find(s => s.op === 'result');
      result.value = 'rat';
    });
    expect(payloadIntegrityFails(payload)).toBe('animal_lookup contradicts result');
  });

  it('arcana: major_arcana_map.label vs value mismatch', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).arcana;
    const payload = tracePayload({
      ...trace,
      value: 'IX · the hermit',
    });
    expect(payloadIntegrityFails(payload)).toBe('major_arcana_map contradicts value');
  });

  it('arcana: index/roman/name/label tuple mismatch', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).arcana;
    const payload = mutate(trace, steps => {
      const map = steps.find(s => s.op === 'major_arcana_map');
      map.index = 9;
      map.roman = 'IX';
      map.name = 'the hermit';
    });
    expect(payloadIntegrityFails(payload)).toBe('major_arcana_map tuple mismatch');
  });

  it('catalog: sun_row_index.index not matching sunSign', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).catalog;
    const payload = mutate(trace, steps => {
      const sun = steps.find(s => s.op === 'sun_row_index');
      sun.index = 5;
    });
    expect(payloadIntegrityFails(payload)).toBe('sun_row_index index contradicts sunSign');
  });

  it('catalog: animal_col_index.index not matching publicAnimal', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).catalog;
    const payload = mutate(trace, steps => {
      const animal = steps.find(s => s.op === 'animal_col_index');
      animal.index = 0;
    });
    expect(payloadIntegrityFails(payload)).toBe('animal_col_index index contradicts publicAnimal');
  });

  it('catalog: positional_index.arabic vs roman_numeral.roman mismatch', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).catalog;
    const payload = mutate(trace, steps => {
      const roman = steps.find(s => s.op === 'roman_numeral');
      roman.roman = 'lix';
    });
    expect(payloadIntegrityFails(payload)).toBe('roman contradicts value');
  });

  it('lifePath: add result 35 then reduce_pythagorean.from 36', () => {
    const trace = buildFreeTraces(buildProfile('Mara Solin', '1993-07-24')).lifePath;
    const payload = mutate(trace, steps => {
      const reduce = steps.find(s => s.op === 'reduce_pythagorean');
      reduce.from = 36;
    });
    expect(payloadIntegrityFails(payload)).toBe('reduce_pythagorean chain break');
  });
});