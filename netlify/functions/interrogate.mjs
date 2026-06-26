// netlify/functions/interrogate.mjs
// Lab-only LLM proxy — narrates precomputed derivation traces.
// Requires ANTHROPIC_API_KEY in Netlify env. Not wired to index.html.

import {
  SYSTEM_PROMPT,
  validateTracePayload,
  payloadIntegrityFails,
  postFilterFails,
  buildUserMessage,
} from '../../lab/interrogate-shared.js';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 180;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 30;

const rateBuckets = new Map();

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function clientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip']
    || event.headers['client-ip']
    || event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || 'unknown'
  );
}

function rateLimit(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + RATE_WINDOW_MS;
  }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count <= RATE_MAX;
}

function refererOk(event) {
  const ref = event.headers.referer || event.headers.Referer || '';
  return ref.includes('/lab/');
}

async function callAnthropic(apiKey, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anthropic ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const block = data.content?.find(b => b.type === 'text');
  return block?.text?.trim() || '';
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method not allowed' });
  }

  if (!refererOk(event)) {
    return json(403, { error: 'lab referer required' });
  }

  const ip = clientIp(event);
  if (!rateLimit(ip)) {
    return json(429, { error: 'rate limit exceeded' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.INTERROGATE_API_KEY;
  if (!apiKey) {
    return json(503, { error: 'interrogation offline — api key not configured' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const validated = validateTracePayload(body);
  if (!validated.ok) {
    return json(400, { error: validated.error });
  }

  const integrityFail = payloadIntegrityFails(validated.payload);
  if (integrityFail) {
    return json(400, { error: 'payload integrity failed', detail: integrityFail });
  }

  const userMessage = buildUserMessage(validated.payload);

  try {
    let narration = await callAnthropic(apiKey, userMessage);
    let filterFail = postFilterFails(narration, validated.payload);

    if (filterFail) {
      const retryMsg = `${userMessage}\n\nPrevious draft violated output rules (${filterFail}). Rewrite in clerk register, third-person, no advice. Use only numbers from the provided steps; state the recorded value. Plain text only, two to four sentences, no markdown or JSON.`;
      narration = await callAnthropic(apiKey, retryMsg);
      filterFail = postFilterFails(narration, validated.payload);
      if (filterFail) {
        return json(422, { error: 'narration failed output filter', detail: filterFail });
      }
    }

    return json(200, { narration });
  } catch (e) {
    return json(502, { error: e.message || 'llm request failed' });
  }
}