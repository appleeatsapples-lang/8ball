// 8ball / core / engine.js
// Response generation. Pulls trait phrases from content/, fills templates.
// Pure logic. Caller manages "recent" memory.

import { TRAITS_SUN, TRAITS_ANIMAL, TRAITS_LP } from '../content/traits.v1.js';
import {
  TEMPLATES_NO_QUESTION,
  TEMPLATES_YES,
  TEMPLATES_NO,
  TEMPLATES_MAYBE
} from '../content/templates.v1.js';

const lpFallback = n => {
  if (TRAITS_LP[n]) return TRAITS_LP[n];
  return TRAITS_LP[((n - 1) % 9) + 1] || TRAITS_LP[1];
};

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

// Weighted axis selection: sun 40%, animal 35%, life path 25%.
// Tweaked once empirically — keep here, not buried in the UI layer.
function axisTrait(profile, rng) {
  const r = rng();
  if (r < 0.40) return pick(TRAITS_SUN[profile.sunSign] || TRAITS_SUN.aries, rng);
  if (r < 0.75) return pick(TRAITS_ANIMAL[profile.animal] || TRAITS_ANIMAL.ox, rng);
  return pick(lpFallback(profile.lifePath), rng);
}

export function classifyQuestion(q, rng = Math.random) {
  if (!q || q.trim().length < 2) return 'none';
  const text = q.trim().toLowerCase();
  if (/^(should i|am i|will i ever|why do|why does|what if)\b/.test(text)) {
    return pick(['yes', 'no', 'maybe', 'maybe', 'maybe'], rng);
  }
  if (/^(is|do|does|can|could|would|will|are|am)\b/.test(text)) {
    return pick(['yes', 'no', 'maybe'], rng);
  }
  return pick(['yes', 'no', 'maybe', 'maybe'], rng);
}

function fillTemplate(tpl, profile, rng) {
  return tpl
    .replace('{name}', profile.firstName || 'you')
    .replace('{sun}', profile.sunSign)
    .replace('{animal}', profile.animal)
    .replace('{lp}', String(profile.lifePath))
    .replace('{trait_sun}', pick(TRAITS_SUN[profile.sunSign] || TRAITS_SUN.aries, rng))
    .replace('{trait_animal}', pick(TRAITS_ANIMAL[profile.animal] || TRAITS_ANIMAL.ox, rng))
    .replace('{trait_lp}', pick(lpFallback(profile.lifePath), rng))
    .replace('{trait_any_alt}', axisTrait(profile, rng))
    .replace(/\{trait_any\}/g, () => axisTrait(profile, rng));
}

function pickTemplate(mode, rng) {
  if (mode === 'none') return pick(TEMPLATES_NO_QUESTION, rng);
  // Mix in a few "no question" lines to keep yes/no/maybe answers from feeling repetitive
  if (mode === 'yes')   return pick(TEMPLATES_YES.concat(TEMPLATES_NO_QUESTION.slice(0, 4)), rng);
  if (mode === 'no')    return pick(TEMPLATES_NO.concat(TEMPLATES_NO_QUESTION.slice(0, 4)), rng);
  return pick(TEMPLATES_MAYBE.concat(TEMPLATES_NO_QUESTION.slice(0, 4)), rng);
}

/**
 * Generate one answer.
 * @param {object} profile - from buildProfile()
 * @param {string} question - user's question, or empty
 * @param {string[]} recent - array of recently shown answers (caller-managed)
 * @param {function} rng - optional rng for tests; defaults to Math.random
 * @returns {string}
 */
export function generateAnswer(profile, question, recent = [], rng = Math.random) {
  const mode = classifyQuestion(question, rng);
  let answer;
  let attempts = 0;
  do {
    const tpl = pickTemplate(mode, rng);
    answer = fillTemplate(tpl, profile, rng);
    attempts++;
  } while (recent.includes(answer) && attempts < 10);
  return answer;
}
