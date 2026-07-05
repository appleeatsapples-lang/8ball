// core/birthcard.js — Tarot birth-card coordinate (v0.5.0)
//
// A FREE-SURFACE COORDINATE, not interpretation content. Outputs a Major
// Arcana numeral + lowercase name (e.g. "XXI · the world") in the same
// labeled-coordinate register as sun sign / animal / life-path. No meaning
// text, no per-card prose — that stays the paid card-content layer (§1).
//
// Reduction tradition: DIGIT-SUM (locked by operator, see journal 2026-05). Sum every digit of the DOB, reduce by repeated digit-sum until <= 22.
// Distinct from the life-path reduce() in profile.js — that stops at master
// numbers 11/22/33 and floors at a single digit; this one floors at <=22 with
// no master-number stop, because the target range is the 22 Major Arcana.
//
// Fool mapping: a reduced value of 22 maps to 0 · the fool (operator-locked
// "fool yes"). Without it, 22 would render as an out-of-range XXII coordinate.
// Rare in practice, but the mapping guarantees every DOB resolves to a real card.

import { sumDigits } from './math.js';

export const MAJOR_ARCANA = [
  'the fool',          // 0
  'the magician',      // 1
  'the high priestess',// 2
  'the empress',       // 3
  'the emperor',       // 4
  'the hierophant',    // 5
  'the lovers',        // 6
  'the chariot',       // 7
  'strength',          // 8  (Rider-Waite-Smith ordering)
  'the hermit',        // 9
  'wheel of fortune',  // 10
  'justice',           // 11
  'the hanged man',    // 12
  'death',             // 13
  'temperance',        // 14
  'the devil',         // 15
  'the tower',         // 16
  'the star',          // 17
  'the moon',          // 18
  'the sun',           // 19
  'judgement',         // 20
  'the world'          // 21
];

const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'
];

// Digit-sum reduction to the Major Arcana index range.
// Reduce until <= 22; map 22 -> 0 (the fool). Result is always 0..21.
export function getBirthCardNumber(year, month, day) {
  let n = sumDigits(year) + sumDigits(month) + sumDigits(day);
  while (n > 22) {
    n = sumDigits(n);
  }
  return n === 22 ? 0 : n;
}

// Full coordinate: { number, roman, name, label }.
// `label` is the render-ready "ROMAN · name" string used on the card.
export function getBirthCard(year, month, day) {
  const number = getBirthCardNumber(year, month, day);
  const roman = ROMAN[number];
  const name = MAJOR_ARCANA[number];
  return { number, roman, name, label: `${roman} · ${name}` };
}
