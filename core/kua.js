// 8ball / core/kua.js
// Eight Mansions personal trigram (Kua number) — Ba Zhai Ming Jing.
//
// The Kua number files a person under one of eight trigrams by birth year
// and gender. This is the product's first gender-keyed coordinate: the
// method itself assigns by gender, so the input is consumed here and only
// here (§1.D kua amendment). Pure functions. No DOM, no globals, no I/O.
//
// REDUCTION. This module's reduce is its OWN repeated digit sum to a
// single digit 1..9 — deliberately NOT the master-preserving reduce() in
// core/profile.js. Master stops are a numerology contract (§1.B v0.62);
// the Kua arithmetic predates and ignores them, and a Kua of 11 does not
// exist. Same separation birthcard.js draws for its ≤22 floor.
//
// FORMULA (single rule for the whole 1900–2100 window): with S = the
// repeated digit sum of the SOLAR birth year, male = reduce(11 − S),
// female = reduce(4 + S). For 19xx years this is arithmetically identical
// to the classical (100 − yy) % 9 / (yy − 4) % 9 statements (pinned by a
// full-century sweep in tests/kua.test.js). A raw 5 has no trigram: it
// files male → 2 (Kun) and female → 8 (Gen), and the substitution is
// RETURNED (`remapped: true`), never silent — the §1.B v0.62 lesson that
// a value shown must be the value read.
//
// NAMED LIMITATION. A competing modern school changes the constants for
// post-2000 births (male 9 − S, female 6 + S; e.g. 2005 → S=7 → male 4
// here, 2 there). This module ships the single continuous rule and names
// the fork in KUA (content provenance) rather than implementing both —
// a switchable dual-school table is the wrong fix (§1.D kua amendment).
//
// YEAR BOUNDARY. The solar year turns at Li Chun (立春), not Jan 1 —
// derived from core/calendar.js's authority-pinned term table
// (monthAnimalSolarTerm(year, 0) IS Li Chun), with the same at-or-after
// semantics getInnerAnimal uses. Stricter than a fixed Feb-4 cutoff:
// e.g. Li Chun 2021 falls on Feb 3. Years below calendar RANGE_MIN can
// only appear as the RESULT of the boundary step (a 1900 birth before
// Li Chun files under solar 1899); the digit-sum arithmetic needs no
// table, so that value is computed, not thrown.

import { monthAnimalSolarTerm } from './calendar.js';

export const KUA_GENDERS = Object.freeze(['male', 'female']);

// Repeated digit sum to a single digit 1..9 (this module's own reduce —
// see header; NOT profile.js's master-preserving reduce).
const reduceDigit = n => {
  while (n > 9) n = String(n).split('').reduce((a, c) => a + Number(c), 0);
  return n;
};

// Solar year of a birth date: the Gregorian year, stepped back by one
// when the date falls before that year's Li Chun (at-or-after wins,
// matching getInnerAnimal's comparison shape).
export function solarYearOf(year, month, day) {
  const [m, d] = monthAnimalSolarTerm(year, 0); // index 0 = Li Chun
  return (month > m || (month === m && day >= d)) ? year : year - 1;
}

// Kua number for one gender. Returns { number, remapped } — `remapped`
// is true when the raw value was 5 and filed to 2 (male) / 8 (female).
// Invalid gender throws: the caller chose to ask for a single-gender
// value, so a missing gender is a caller bug, not a soft state (the
// both-genders read is getKuaBoth).
export function getKua(year, month, day, gender) {
  if (gender !== 'male' && gender !== 'female') {
    throw new Error(`gender must be 'male' or 'female': ${gender}`);
  }
  const s = reduceDigit(solarYearOf(year, month, day));
  const raw = reduceDigit(gender === 'male' ? 11 - s : 4 + s);
  if (raw === 5) {
    return { number: gender === 'male' ? 2 : 8, remapped: true };
  }
  return { number: raw, remapped: false };
}

// Both classical values for a date — the no-gender-on-file read.
export function getKuaBoth(year, month, day) {
  return {
    male: getKua(year, month, day, 'male'),
    female: getKua(year, month, day, 'female'),
  };
}
