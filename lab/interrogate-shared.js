// lab/interrogate-shared.js
// Shared prompt, payload validation, and voice post-filter for the
// interrogation-layer prototype. Imported by netlify/functions/interrogate.mjs
// and tests. Not part of the live product surface.

export const SYSTEM_PROMPT = `You are the registrar's clerk for the 8ball specimen registry. Your only job is to narrate how a single coordinate on a filed specimen card was computed.

INPUT YOU RECEIVE (JSON):
- coordinate: the field name (e.g. "lifePath", "sun", "catalog")
- label: the clinical row label shown on the card
- value: the computed result — this is already correct; do not recalculate or change it
- steps: an ordered list of deterministic operations that produced the value (digit sums, lookups, indices, reductions). Treat these as ground truth.

RULES — violating any rule is a failure:
1. DETERMINISTIC-FAITHFUL. Explain only the steps provided. Do not add steps, skip steps, or perform arithmetic yourself. If a step says the sum is 35, say 35 — do not verify or correct it.
2. NO ORACLE BEHAVIOR. Do not predict the future, give advice, suggest actions, flatter, diagnose, or assign meaning beyond what the computation states. Do not say what the coordinate "means" for a person's life, career, relationships, or character.
3. VOICE. Clinical, deadpan, third-person about the specimen. Write as a clerk filing paperwork: "the specimen's life path registers as 8" not "your life path is 8" and not "this suggests leadership." Lowercase except proper system names (Pythagorean, IANA, Meeus) and roman numerals. No emoji. No exclamation marks. No "the universe," destiny, energy, vibration, or spiritual framing.
4. LENGTH. Two to four sentences. One short paragraph. Enough to walk through the key steps; not a lecture.
5. SCOPE. If steps indicate a lookup table or cusp boundary, state the rule and the outcome. If a step references lunar new year or solar term cutoffs, name the mechanism clinically without claiming predictive power.
6. UNRESOLVED. If value is "—" or steps say "uncomputable", state what input was missing (e.g. birth time and place for rising) — do not speculate.

GOOD example (lifePath):
"Life path 8. The specimen's date of birth 1993-07-24 yields digit sums 22 + 7 + 6 = 35; Pythagorean reduction applies (no master stop at 35), 3 + 5 = 8. The registry records 8."

BAD examples (never produce):
- "Life path 8 means you're destined for wealth and leadership."
- "Your soul urges you toward balance."
- "The stars align to show a creative path."

OUTPUT: Plain text only. No markdown, no JSON, no preamble.`;

export const FREE_COORDINATE_KEYS = new Set([
  'arcana', 'sun', 'animal', 'lifePath', 'catalog',
]);

export const BANNED_VOICE_PATTERNS = [
  /\bthe universe\b/i,
  /\byour stars\b/i,
  /\bdestiny\b/i,
  /\bdestined\b/i,
  /\bfated\b/i,
  /\bfate\b/i,
  /\bcosmic\b/i,
  /\bthe cosmos\b/i,
  /\bspiritual\b/i,
  /\bmystic\b/i,
  /\bmystical\b/i,
  /\bpsychic\b/i,
  /\bchannel(?:ing)?\b/i,
  /\baura\b/i,
  /\bkarma\b/i,
  /\bmanifest(?:ation)?\b/i,
  /\bthird eye\b/i,
  /\bsoul mate\b/i,
  /\byour guides\b/i,
  /\bdivine\b/i,
  /\bsacred\b/i,
  /\byou(?:'re| are)\b/i,
  /\byour\b/i,
];

const MAX_STEPS = 32;
const MAX_STEP_JSON = 4096;
const MAX_VALUE_LEN = 120;
const MAX_LABEL_LEN = 64;

export function validateTracePayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'body must be a JSON object' };
  }
  const { coordinate, label, value, steps } = body;
  if (typeof coordinate !== 'string' || !FREE_COORDINATE_KEYS.has(coordinate)) {
    return { ok: false, error: 'coordinate must be a free-tier key' };
  }
  if (typeof label !== 'string' || !label.trim() || label.length > MAX_LABEL_LEN) {
    return { ok: false, error: 'label invalid' };
  }
  if (typeof value !== 'string' || value.length > MAX_VALUE_LEN) {
    return { ok: false, error: 'value invalid' };
  }
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > MAX_STEPS) {
    return { ok: false, error: 'steps must be a non-empty array' };
  }
  const stepsJson = JSON.stringify(steps);
  if (stepsJson.length > MAX_STEP_JSON) {
    return { ok: false, error: 'steps payload too large' };
  }
  for (const step of steps) {
    if (!step || typeof step !== 'object' || typeof step.op !== 'string') {
      return { ok: false, error: 'each step must be an object with op' };
    }
  }
  return {
    ok: true,
    payload: { coordinate, label: label.trim(), value, steps },
  };
}

export function voiceFilterFails(text) {
  if (typeof text !== 'string' || !text.trim()) return 'empty narration';
  for (const re of BANNED_VOICE_PATTERNS) {
    if (re.test(text)) return `banned pattern: ${re}`;
  }
  return null;
}

function extractIntegers(text) {
  const matches = String(text).match(/\d+/g);
  if (!matches) return [];
  return matches.map(m => Number(m));
}

function allowedNumbersFromPayload(payload) {
  const allowed = new Set(extractIntegers(JSON.stringify(payload.steps)));
  for (const n of extractIntegers(payload.value)) {
    allowed.add(n);
  }
  const asNumber = Number(payload.value);
  if (Number.isInteger(asNumber)) {
    allowed.add(asNumber);
  }
  return allowed;
}

export function faithfulnessFails(text, payload) {
  if (typeof text !== 'string' || !text.trim()) return 'empty narration';
  if (!text.includes(payload.value)) return 'value not stated in narration';

  const allowed = allowedNumbersFromPayload(payload);
  for (const n of extractIntegers(text)) {
    if (!allowed.has(n)) return `invented number: ${n}`;
  }
  return null;
}

export function buildUserMessage(payload) {
  return JSON.stringify(payload);
}