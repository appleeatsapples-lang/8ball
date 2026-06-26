// lab/interrogate-shared.js
// Shared prompt, payload validation, and voice post-filter for the
// interrogation-layer prototype. Imported by netlify/functions/interrogate.mjs
// and tests. Not part of the live product surface.

import { getBirthCard } from '../core/birthcard.js';
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

// Catalog row/column order — must match core/engine.js SUN_ORDER / ANIMAL_ORDER.
// Guarded by tests/lab_sun_order_drift.test.js (drift fails CI if core reorders).
const SUN_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];
const ANIMAL_ORDER = ANIMALS;

function buildCanonicalArcanaByIndex() {
  const byIndex = new Map();
  outer:
  for (let y = 1900; y < 2100; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        const card = getBirthCard(y, m, d);
        if (!byIndex.has(card.number)) byIndex.set(card.number, card);
        if (byIndex.size === 22) break outer;
      }
    }
  }
  return byIndex;
}

const CANONICAL_ARCANA_BY_INDEX = buildCanonicalArcanaByIndex();
const ARCANA_LABELS = new Set(
  [...CANONICAL_ARCANA_BY_INDEX.values()].map(c => c.label),
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

function arabicToRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null;
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let out = '';
  let rem = n;
  for (let i = 0; i < values.length; i++) {
    while (rem >= values[i]) {
      out += numerals[i];
      rem -= values[i];
    }
  }
  return out;
}

function integrityLifePath(value, steps) {
  let lastResult = null;
  let prevOp = null;
  let prevReduceFrom = null;

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
        lastResult = step.result;
        prevOp = step.op;
        break;
      }
      case 'reduce_pythagorean': {
        if (lastResult !== null && step.from !== lastResult) {
          return 'reduce_pythagorean chain break';
        }
        const masters = step.masters || [11, 22, 33];
        if (step.result !== pythagoreanReduce(step.from, masters)) {
          return 'reduce_pythagorean contradiction';
        }
        prevReduceFrom = step.from;
        lastResult = step.result;
        prevOp = step.op;
        break;
      }
      case 'digit_sum_reduce': {
        const expectedFrom = prevOp === 'reduce_pythagorean' ? prevReduceFrom : lastResult;
        if (expectedFrom !== null && step.from !== expectedFrom) {
          return 'digit_sum_reduce chain break';
        }
        if (step.result !== digitSum(step.from)) return 'digit_sum_reduce contradiction';
        if (prevOp === 'reduce_pythagorean' && step.result !== lastResult) {
          return 'digit_sum_reduce contradicts reduce_pythagorean';
        }
        prevOp = step.op;
        break;
      }
      case 'result': {
        if (step.field !== 'lifePath') break;
        const terminal = String(step.value);
        if (terminal !== value) return 'result contradicts value';
        if (lastResult !== null && Number(terminal) !== lastResult) {
          return 'result contradicts chain';
        }
        break;
      }
      default:
        break;
    }
  }

  const resultStep = steps.find(s => s.op === 'result' && s.field === 'lifePath');
  if (!resultStep) return 'missing lifePath result';
  return null;
}

function majorArcanaTupleFails(step) {
  const index = step.index;
  if (!Number.isInteger(index) || index < 0 || index > 21) {
    return 'major_arcana_map index out of range';
  }
  const canonical = CANONICAL_ARCANA_BY_INDEX.get(index);
  if (!canonical) return 'major_arcana_map missing canonical tuple';
  if (step.roman !== canonical.roman
    || step.name !== canonical.name
    || step.label !== canonical.label) {
    return 'major_arcana_map tuple mismatch';
  }
  return null;
}

function integrityArcana(value, steps) {
  let lastResult = null;
  let arcanaLabel = null;

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
        lastResult = step.result;
        break;
      }
      case 'digit_sum_reduce_to_22': {
        if (lastResult !== null && step.from !== lastResult) {
          return 'digit_sum_reduce_to_22 chain break';
        }
        if (step.result !== digitSum(step.from)) return 'digit_sum_reduce_to_22 contradiction';
        lastResult = step.result;
        break;
      }
      case 'fool_mapping': {
        if (lastResult !== null && step.input !== lastResult) {
          return 'fool_mapping chain break';
        }
        if (step.majorArcanaIndex !== 0) {
          return 'fool_mapping majorArcanaIndex contradicts fool rule';
        }
        break;
      }
      case 'major_arcana_map': {
        const tupleFail = majorArcanaTupleFails(step);
        if (tupleFail) return tupleFail;
        if (lastResult === null) return 'major_arcana_map missing reduction chain';
        const expectedIndex = lastResult === 22 ? 0 : lastResult;
        if (step.index !== expectedIndex) {
          return 'major_arcana_map index contradicts reduction';
        }
        arcanaLabel = step.label;
        break;
      }
      default:
        break;
    }
  }

  if (arcanaLabel === null) return 'missing major_arcana_map';
  if (arcanaLabel !== value) return 'major_arcana_map contradicts value';
  return null;
}

function integritySun(value, steps) {
  let cuspSign = null;
  let terminalSign = null;

  for (const step of steps) {
    if (step.op === 'cusp_match') {
      if (!SUN_SIGN_NAMES.has(step.sign)) return 'cusp_match contradiction';
      cuspSign = step.sign;
    } else if (step.op === 'result' && step.field === 'sunSign') {
      terminalSign = step.value;
    }
  }

  if (cuspSign === null) return 'missing cusp_match';
  if (terminalSign === null) return 'missing sun result';
  if (cuspSign !== terminalSign) return 'cusp_match contradicts result';
  if (terminalSign !== value) return 'value contradicts steps';
  return null;
}

function integrityAnimal(value, steps) {
  let cycleIndex = null;
  let lookupIndex = null;
  let lookupAnimal = null;
  let terminalAnimal = null;

  for (const step of steps) {
    switch (step.op) {
      case 'zodiac_cycle':
        cycleIndex = step.index;
        break;
      case 'animal_lookup':
        lookupIndex = step.index;
        lookupAnimal = step.animal;
        if (Array.isArray(step.animalList) && step.animalList[step.index] !== step.animal) {
          return 'animal_lookup contradiction';
        }
        break;
      case 'result':
        if (step.field === 'publicAnimal') terminalAnimal = step.value;
        break;
      default:
        break;
    }
  }

  if (cycleIndex === null || lookupIndex === null) return 'missing animal linkage';
  if (cycleIndex !== lookupIndex) return 'zodiac_cycle contradicts animal_lookup index';
  if (lookupAnimal !== terminalAnimal) return 'animal_lookup contradicts result';
  if (terminalAnimal !== value) return 'value contradicts steps';
  return null;
}

function integrityCatalog(value, steps) {
  // Tuple-internal + canonical-table consistency only; does not bind tuple to DOB.
  let sunIndex = null;
  let animalIndex = null;
  let positionalArabic = null;
  let romanArabic = null;
  let roman = null;

  for (const step of steps) {
    switch (step.op) {
      case 'sun_row_index': {
        sunIndex = step.index;
        if (!Number.isInteger(sunIndex) || sunIndex < 0 || sunIndex >= 12) {
          return 'sun_row_index out of range';
        }
        if (typeof step.sunSign !== 'string' || SUN_ORDER[sunIndex] !== step.sunSign) {
          return 'sun_row_index index contradicts sunSign';
        }
        break;
      }
      case 'animal_col_index': {
        animalIndex = step.index;
        if (!Number.isInteger(animalIndex) || animalIndex < 0 || animalIndex >= 12) {
          return 'animal_col_index out of range';
        }
        if (typeof step.publicAnimal !== 'string' || ANIMAL_ORDER[animalIndex] !== step.publicAnimal) {
          return 'animal_col_index index contradicts publicAnimal';
        }
        break;
      }
      case 'positional_index':
        positionalArabic = step.arabic;
        if (sunIndex !== null && animalIndex !== null) {
          const expected = sunIndex * 12 + animalIndex + 1;
          if (step.arabic !== expected) return 'positional_index contradiction';
        }
        break;
      case 'roman_numeral':
        romanArabic = step.arabic;
        roman = step.roman;
        break;
      case 'result':
        if (step.field === 'catalog' && String(step.value).toLowerCase() !== value.toLowerCase()) {
          return 'result contradicts value';
        }
        break;
      default:
        break;
    }
  }

  if (positionalArabic === null || roman === null) return 'missing catalog terminal';
  if (romanArabic !== null && romanArabic !== positionalArabic) {
    return 'roman_numeral contradicts positional_index';
  }
  if (roman.toLowerCase() !== value.toLowerCase()) return 'roman contradicts value';
  const encoded = arabicToRoman(positionalArabic);
  if (encoded === null || encoded !== roman.toLowerCase()) {
    return 'roman contradicts arabic encoding';
  }
  return null;
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
  switch (coordinate) {
    case 'lifePath':
      return integrityLifePath(value, steps);
    case 'arcana':
      return integrityArcana(value, steps);
    case 'sun':
      return integritySun(value, steps);
    case 'animal':
      return integrityAnimal(value, steps);
    case 'catalog':
      return integrityCatalog(value, steps);
    default:
      return 'unknown coordinate';
  }
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