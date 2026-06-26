// tests/interrogate_function.test.js — shared validation + voice filter (no live API)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SYSTEM_PROMPT,
  validateTracePayload,
  voiceFilterFails,
  faithfulnessFails,
  buildUserMessage,
  FREE_COORDINATE_KEYS,
} from '../lab/interrogate-shared.js';
import { handler } from '../netlify/functions/interrogate.mjs';

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

describe('interrogate-shared — faithfulnessFails', () => {
  const faithfulNarration =
    'life path 8. the specimen\'s date of birth yields digit sums 22 + 7 + 6 = 35; reduction records 8.';

  it('passes narration that uses only step numbers and states the value', () => {
    expect(faithfulnessFails(faithfulNarration, validTrace)).toBeNull();
  });

  it('rejects a hallucinated number', () => {
    const bad = `${faithfulNarration} an extra factor of 99 was noted.`;
    expect(faithfulnessFails(bad, validTrace)).toMatch(/invented number: 99/);
  });

  it('rejects narration that omits the recorded value', () => {
    expect(faithfulnessFails(
      'digit sums 22 + 7 + 6 = 35; reduction records seven.',
      validTrace,
    )).toMatch(/value not stated/);
  });
});

function makeEvent(method, { body, referer = '' } = {}) {
  return {
    httpMethod: method,
    headers: {
      referer,
      'x-nf-client-connection-ip': '127.0.0.1',
    },
    body: body ? JSON.stringify(body) : undefined,
  };
}

function mockAnthropic(text) {
  return {
    ok: true,
    async json() {
      return { content: [{ type: 'text', text }] };
    },
  };
}

describe('interrogate.mjs — handler runtime', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });

  it('GET returns 405', async () => {
    const res = await handler(makeEvent('GET'));
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).error).toBe('method not allowed');
  });

  it('OPTIONS returns 204 with CORS headers', async () => {
    const res = await handler(makeEvent('OPTIONS'));
    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.body).toBe('');
  });

  it('POST without /lab/ referer returns 403', async () => {
    const res = await handler(makeEvent('POST', { body: validTrace, referer: 'https://example.com/' }));
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error).toBe('lab referer required');
  });

  it('POST with lab referer and clean mock returns 200 with narration', async () => {
    const narration =
      'life path 8. the specimen\'s date of birth yields digit sums 22 + 7 + 6 = 35; reduction records 8.';
    globalThis.fetch = async () => mockAnthropic(narration);

    const res = await handler(makeEvent('POST', {
      body: validTrace,
      referer: 'https://example.com/lab/interrogate.html',
    }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).narration).toBe(narration);
  });

  it('POST with banned word in mock both times returns 422', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return mockAnthropic('life path 8 means destiny for wealth');
    };

    const res = await handler(makeEvent('POST', {
      body: validTrace,
      referer: 'https://example.com/lab/interrogate.html',
    }));

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error).toBe('narration failed voice filter');
    expect(calls).toBe(2);
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