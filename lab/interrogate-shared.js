// lab/interrogate-shared.js
// Shared prompt, payload validation, and voice post-filter for the
// interrogation-layer prototype. Imported by netlify/functions/interrogate.mjs
// and tests. Not part of the live product surface.

import { MAJOR_ARCANA } from '../core/birthcard.js';
import { SUN_SIGNS, ANIMALS } from '../core/profile.js';

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

export const CANONICAL_LABELS = {
  arcana: 'ARCANA',
  sun: 'SUN',
  animal: 'PUBLIC',
  lifePath: 'LIFE PATH',
  catalog: 'CATALOG',
};

const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
];

const ARCANA_LABELS = new Set(
  MAJOR_ARCANA.map((name, i) => `${ROMAN[i]} · ${name}`),
);

const SUN_SIGN_NAMES = new Set(SUN_SIGNS.map(s => s.name));
const ANIMAL_NAMES = new Set(ANIMALS);
const LIFE_PATH_VALUE = /^(?:[1-9]|11|22|33)$/;
const CATALOG_VALUE = /^[ivxlcdm]+$/i;
const UNRESOLVED_VALUE = '—';

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
  // Partial semantic-gloss denylist; robust fix is deterministic templates (deferred).
  /\badministrator\b/i,
  /\bleader\b/i,
  /\bleadership\b/i,
  /\bcreative\b/i,
  /\bbalanced\b/i,
  /\bintuitive\b/i,
  /\bcorrective\b/i,
  /\bdisposition\b/i,
  /\btemperament\b/i,
  /\bcharacter\b/i,
  /\balways going to\b/i,
  /\bintends\b/i,
  /\bmeant to\b/i,
  /\breveals\b/i,
  /\bpoints to\b/i,
  /\bwill follow\b/i,
  /\blands on\b/i,
  /\bconsider\b/i,
  /\bnotice\b/i,
  /\bremember\b/i,
  /\bone's\b/i,
  /\boneself\b/i,
  /\bthe reader\b/i,
  /\bthe native\b/i,
  /\bthe querent\b/i,
  /\bthough\b/i,
  /\bmay lean\b/i,
  /\bsuggests\b/i,
  /\bleans toward\b/i,
];

const MAX_STEPS = 32;
const MAX_STEP_JSON = 4096;

function valueValidForCoordinate(coordinate, value) {
  if (value === UNRESOLVED_VALUE) return true;
  if (typeof value !== 'string' || !value) return false;
  switch (coordinate) {
    case 'lifePath':
      return LIFE_PATH_VALUE.test(value);
    case 'sun':
      return SUN_SIGN_NAMES.has(value);
    case 'animal':
      return ANIMAL_NAMES.has(value);
    case 'arcana':
      return ARCANA_LABELS.has(value);
    case 'catalog':
      return CATALOG_VALUE.test(value);
    default:
      return false;
  }
}

function digitSum(n) {
  return String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);
}

function pythagoreanReduce(from, masters = [11, 22, 33]) {
  let n = from;
  while (n > 9 && !masters.includes(n)) {
    n = digitSum(n);
  }
  return n;
}

export function validateTracePayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'body must be a JSON object' };
  }
  const { coordinate, value, steps } = body;
  if (typeof coordinate !== 'string' || !FREE_COORDINATE_KEYS.has(coordinate)) {
    return { ok: false, error: 'coordinate must be a free-tier key' };
  }
  if (!valueValidForCoordinate(coordinate, value)) {
    return { ok: false, error: 'value invalid for coordinate' };
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
    payload: {
      coordinate,
      label: CANONICAL_LABELS[coordinate],
      value,
      steps,
    },
  };
}

export function payloadIntegrityFails(payload) {
  const { coordinate, value, steps } = payload;
  let derived = null;
  let lastPythagoreanResult = null;
  let sawFurtherReductionAfterMaster = false;

  for (const step of steps) {
    switch (step.op) {
      case 'digit_sum': {
        const expected = digitSum(Number(step.digits));
        if (step.sum !== expected) return 'digit_sum contradiction';
        break;
      }
      case 'add': {
        const sum = step.values.reduce((a, b) => a + b, 0);
        if (sum !== step.result) return 'add contradiction';
        break;
      }
      case 'reduce_pythagorean': {
        const masters = step.masters || [11, 22, 33];
        const expected = pythagoreanReduce(step.from, masters);
        if (step.result !== expected) return 'reduce_pythagorean contradiction';
        lastPythagoreanResult = step.result;
        sawFurtherReductionAfterMaster = false;
        break;
      }
      case 'digit_sum_reduce':
      case 'digit_sum_reduce_to_22': {
        const expected = digitSum(step.from);
        if (step.result !== expected) return `${step.op} contradiction`;
        if (lastPythagoreanResult !== null && [11, 22, 33].includes(lastPythagoreanResult)) {
          sawFurtherReductionAfterMaster = true;
        }
        break;
      }
      case 'cusp_match':
        if (!SUN_SIGN_NAMES.has(step.sign)) return 'cusp_match contradiction';
        derived = step.sign;
        break;
      case 'animal_lookup':
        if (!ANIMAL_NAMES.has(step.animal)) return 'animal_lookup contradiction';
        if (Array.isArray(step.animalList) && step.animalList[step.index] !== step.animal) {
          return 'animal_lookup contradiction';
        }
        derived = step.animal;
        break;
      case 'major_arcana_map':
        if (!ARCANA_LABELS.has(step.label)) return 'major_arcana_map contradiction';
        derived = step.label;
        break;
      case 'roman_numeral':
        if (!CATALOG_VALUE.test(step.roman)) return 'roman_numeral contradiction';
        derived = step.roman;
        break;
      case 'result': {
        const terminalFields = {
          lifePath: 'lifePath',
          sun: 'sunSign',
          animal: 'publicAnimal',
          catalog: 'catalog',
        };
        if (step.field === terminalFields[coordinate]) {
          derived = String(step.value);
        }
        break;
      }
      default:
        break;
    }
  }

  if (derived === null) return 'no terminal value derivable from steps';

  const normalizedDerived = coordinate === 'catalog' ? derived.toLowerCase() : derived;
  const normalizedValue = coordinate === 'catalog' ? value.toLowerCase() : value;
  if (normalizedDerived !== normalizedValue) return 'value contradicts steps';

  if (
    coordinate === 'lifePath'
    && lastPythagoreanResult !== null
    && [11, 22, 33].includes(lastPythagoreanResult)
    && !sawFurtherReductionAfterMaster
    && String(lastPythagoreanResult) !== value
  ) {
    return 'master-number stop contradicts value';
  }

  return null;
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

export function formatFilterFails(text) {
  if (typeof text !== 'string' || !text.trim()) return 'empty narration';
  if (text.includes('{') || text.includes('}')) return 'json-like braces';
  if (/```/.test(text)) return 'code fence';
  if (/(?:^|\n)[-*#] /m.test(text)) return 'markdown marker';
  return null;
}

export function lengthFilterFails(text) {
  if (typeof text !== 'string' || !text.trim()) return 'empty narration';
  const terminators = text.match(/[.?;]/g);
  if (terminators && terminators.length > 4) return 'too many sentences';
  return null;
}

export function postFilterFails(text, payload) {
  return voiceFilterFails(text)
    || faithfulnessFails(text, payload)
    || formatFilterFails(text)
    || lengthFilterFails(text);
}

export function buildUserMessage(payload) {
  return JSON.stringify(payload);
}