// tests/interrogate_function.test.js — shared validation + voice filter (no live API)

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PROMPT,
  validateTracePayload,
  voiceFilterFails,
  buildUserMessage,
  FREE_COORDINATE_KEYS,
} from '../lab/interrogate-shared.js';

const validTrace = {
  coordinate: 'lifePath',
  label: 'LIFE PATH',
  value: '8',
  steps: [
    { op: 'digit_sum', field: 'year', digits: '1993', sum: 22 },
    { op: 'add', values: [22, 7, 6], result: 35 },
    { op: 'reduce_pythagorean', from: 35, masters: [11, 22, 33], result: 8 },
  ],
};

describe('interrogate-shared — validateTracePayload', () => {
  it('accepts valid free-tier payload', () => {
    const r = validateTracePayload(validTrace);
    expect(r.ok).toBe(true);
    expect(r.payload.coordinate).toBe('lifePath');
  });

  it('rejects unknown coordinate', () => {
    const r = validateTracePayload({ ...validTrace, coordinate: 'rising' });
    expect(r.ok).toBe(false);
  });

  it('rejects empty steps', () => {
    const r = validateTracePayload({ ...validTrace, steps: [] });
    expect(r.ok).toBe(false);
  });

  it('rejects step without op', () => {
    const r = validateTracePayload({ ...validTrace, steps: [{ field: 'x' }] });
    expect(r.ok).toBe(false);
  });

  it('FREE_COORDINATE_KEYS matches five free coords', () => {
    expect([...FREE_COORDINATE_KEYS].sort()).toEqual(
      ['animal', 'arcana', 'catalog', 'lifePath', 'sun'].sort()
    );
  });
});

describe('interrogate-shared — voiceFilterFails', () => {
  it('passes clerk narration', () => {
    expect(voiceFilterFails(
      'life path 8. the specimen\'s date of birth yields digit sums 22 + 7 + 6 = 35; reduction records 8.'
    )).toBeNull();
  });

  it('fails destiny language', () => {
    expect(voiceFilterFails('life path 8 means destiny for wealth')).not.toBeNull();
  });

  it('fails second-person your', () => {
    expect(voiceFilterFails('your life path is 8')).not.toBeNull();
  });
});

describe('interrogate-shared — prompt', () => {
  it('SYSTEM_PROMPT forbids oracle behavior', () => {
    expect(SYSTEM_PROMPT).toMatch(/DETERMINISTIC-FAITHFUL/);
    expect(SYSTEM_PROMPT).toMatch(/NO ORACLE BEHAVIOR/);
    expect(SYSTEM_PROMPT).toMatch(/third-person/);
  });

  it('buildUserMessage serializes payload', () => {
    const msg = buildUserMessage(validTrace);
    const parsed = JSON.parse(msg);
    expect(parsed.value).toBe('8');
    expect(parsed.steps.length).toBe(3);
  });
});