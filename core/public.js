// 8ball / core / public.js — public-tier computation engine
//
// Pure functions. No DOM, no globals, no I/O, no network, no model call at
// runtime or at any other time: every value below is a lookup or an integer
// reduction over the frozen tables in content/public.v1.js. Same date in,
// byte-identical object out, forever.
//
// SCOPE. This module computes only the public-tier reading. It does not enter
// getCard / resolveBracket (the catalog driver stays (sunSign, animal) per
// DOCTRINE §1), does not read or write storage, does not know about tiers,
// prices, entitlement or any UI surface. Nothing in ui/, index.html or
// core/payments.js imports it yet — wiring is a separate change on an
// operator-approved doctrine amendment (see PUBLIC_TIER_SPEC.md §7).
//
// INPUT. Birth date only, `YYYY-MM-DD`. The day master derives from the day
// pillar, which is date-only, so no birth time is required. An hour may be
// supplied and is accepted without error, but it is deliberately UNUSED: the
// output of a date + hour call is byte-identical to the same date alone
// (pinned in tests/public.test.js). A future hour-aware strength refinement is
// named in the spec as an amendment, not smuggled in here.
//
// ARCHITECTURE NOTE — first core/ → content/ import edge. Every other core/
// module is table-free or carries its own constants; the public tier is
// explicitly table-driven, and DOCTRINE §6 puts versioned static data in
// content/. So this module reads its tables from content/public.v1.js. The
// direction is one-way (content/ imports nothing from core/) and adds no
// runtime capability — content/public.v1.js is frozen data.

import { getDayPillar, STEMS } from './pillars.js';
import { getInnerAnimal, getLifePath, getLifePathSum } from './profile.js';
import { getBirthCard } from './birthcard.js';
import {
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  DOMAIN_FAMILIES,
  EXPRESSION_MODES,
  ROLE_POSTURES,
  PUBLIC_SOURCES,
} from '../content/public.v1.js';

// ── Input ───────────────────────────────────────────────────────────────────

// Date validation, deliberately a second implementation of the buildProfile
// guard rather than an import: core/profile.js is the shipped calculation
// core for the paid ladder and this tier does not touch it. The fork is
// pinned against drift by a differential test — tests/public.test.js asserts
// that buildProfile and this parser accept and reject exactly the same dates
// across a wide sweep, so a leap-year rule fixed in one and not the other
// fails CI rather than diverging silently.
export function parsePublicDob(dobIso) {
  if (!dobIso || !/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) {
    throw new Error('DOB must be YYYY-MM-DD');
  }
  const [year, month, day] = dobIso.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('DOB out of range');
  }
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) {
    throw new Error('DOB out of range');
  }
  return { year, month, day };
}

// ── 1. Day master + strength → favourable / unfavourable elements ───────────

// The day master is the heavenly stem of the day pillar; its element is the
// element the whole reading is keyed on. Polarity follows the stem index —
// even stems are yang, odd are yin — the same parity the STEM_ELEMENTS
// pairing in core/pillars.js rides on.
export function getDayMaster(year, month, day) {
  const pillar = getDayPillar(year, month, day);
  return {
    stem: STEMS[pillar.stemIndex],
    stemIndex: pillar.stemIndex,
    polarity: pillar.stemIndex % 2 === 0 ? 'yang' : 'yin',
    element: pillar.stemElement,
    branchAnimal: pillar.animal,
  };
}

// Seasonal state of a day master against the element of its month branch.
// Total by construction: for any ordered pair of the five elements exactly
// one of the five relations holds, so this never falls through.
export function getSeasonalState(dayMasterElement, seasonElement) {
  if (seasonElement === dayMasterElement) return SEASONAL_STATES.wang;
  if (ELEMENT_SHENG[seasonElement] === dayMasterElement) return SEASONAL_STATES.xiang;
  if (ELEMENT_SHENG[dayMasterElement] === seasonElement) return SEASONAL_STATES.xiu;
  if (ELEMENT_KE[dayMasterElement] === seasonElement) return SEASONAL_STATES.qiu;
  return SEASONAL_STATES.si; // ELEMENT_KE[seasonElement] === dayMasterElement
}

// The season is the month pillar's branch, resolved through the solar-term
// table core/profile.js already owns (getInnerAnimal, calc v3.1). Reusing it
// keeps one jieqi implementation in the repo.
export function getSeason(year, month, day, dayMasterElement) {
  const monthAnimal = getInnerAnimal(year, month, day);
  const element = BRANCH_ELEMENTS[monthAnimal];
  const state = getSeasonalState(dayMasterElement, element);
  return {
    monthAnimal,
    element,
    state: state.key,
    stateHan: state.han,
    stateLabel: state.label,
    relation: state.relation,
    strength: state.strength,
  };
}

export function getFavorability(dayMasterElement, strength) {
  const entry = ELEMENT_FAVORABILITY[`${dayMasterElement}_${strength}`];
  if (!entry) {
    throw new Error(`No favorability entry for element="${dayMasterElement}" strength="${strength}"`);
  }
  return entry;
}

// ── 2. Expression number → mode of work ─────────────────────────────────────
//
// NINE modes, not eleven. The first draft of this tier retained the 11 and 22
// stops, which made the table eleven entries and diverged from the strict
// nine-number reduction DOCTRINE §1.B v0.54 (calc v3) fixed. Controller ruling
// 2026-07-29: collapse to nine. The brief specified eleven; the constitution
// wins, and this comment is the record that the brief was overruled rather
// than misread.
//
// CONSEQUENCE, stated because it is not obvious and it matters. A date digit
// sum reduced strictly to 1..9 IS the life path — the same sum, the same
// reduction, already shipped on the free surface as `lifePath`
// (DOCTRINE §1.D v0.38). So this tier's mode driver is no longer a distinct
// number, and these two functions do not reimplement it: they delegate to
// core/profile.js, which owns that calculation. Keeping a private copy would
// have been a fork of an identical rule, the exact drift risk core/math.js's
// header names. A test pins the delegation across the whole date range.
//
// The label is now doubly wrong — this is neither §1.B's name-derived
// expression/name number nor a new number — and renaming it before anything
// surfaces is open question 1 in PUBLIC_TIER_SPEC.md §6.
export function getExpressionSum(year, month, day) {
  return getLifePathSum(year, month, day);
}

export function getExpressionNumber(year, month, day) {
  return getLifePath(year, month, day);
}

export function getExpressionMode(expressionNumber) {
  const mode = EXPRESSION_MODES[expressionNumber];
  if (!mode) throw new Error(`No expression mode for number=${expressionNumber}`);
  return mode;
}

// ── 3. Domain families ──────────────────────────────────────────────────────

// Rank an element's three families by the mode's character priority. Each
// element carries exactly one family per character, so the sort is a total
// order with no tie-break and no positional bias.
export function rankDomainFamilies(element, expressionNumber) {
  const families = DOMAIN_FAMILIES[element];
  if (!families) throw new Error(`No domain families for element="${element}"`);
  const { priority } = getExpressionMode(expressionNumber);
  return families
    .map(family => ({ family, rank: priority.indexOf(family.character) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ family }) => family);
}

// The anti-fit is drawn from the top UNFAVOURABLE element, taking the family
// whose character sits last in the same mode priority. Because the anti-fit
// element and the fit element are always different (a favourable element is
// never also the unfavourable one — pinned in tests/public.test.js) and
// families never cross elements, the anti-fit can never collide with a fit
// family.
export function getAntiFitFamily(element, expressionNumber) {
  const families = DOMAIN_FAMILIES[element];
  if (!families) throw new Error(`No domain families for element="${element}"`);
  const { priority } = getExpressionMode(expressionNumber);
  const lastCharacter = priority[priority.length - 1];
  const family = families.find(f => f.character === lastCharacter);
  if (!family) {
    throw new Error(`No "${lastCharacter}" family for element="${element}"`);
  }
  return family;
}

// ── 4. Role posture + the shape-of-role line ────────────────────────────────

export function getRolePosture(arcanaNumber) {
  const posture = ROLE_POSTURES[arcanaNumber];
  if (!posture) throw new Error(`No role posture for arcana=${arcanaNumber}`);
  return posture;
}

// One line, assembled from exactly two table fields: the posture's stance
// (from the birth card) and the mode's method (from the expression number).
// No adjectives are computed, nothing is generated — the line is a join.
export function getRoleLine(expressionNumber, arcanaNumber) {
  return `${getRolePosture(arcanaNumber).stance}, ${getExpressionMode(expressionNumber).method}.`;
}

// ── Assembly ────────────────────────────────────────────────────────────────

// Build the full public-tier reading from a birth date.
//
//   buildPublicReading('2000-01-01')
//   buildPublicReading('2000-01-01', { time: '07:30' })  // identical output
//
// opts.time / opts.hour are accepted and ignored (see the INPUT note at the
// top of this file). Throws on a malformed or impossible date, matching
// buildProfile's two error messages exactly.
export function buildPublicReading(dobIso, _opts = {}) {
  const { year, month, day } = parsePublicDob(dobIso);

  const dayMaster = getDayMaster(year, month, day);
  const season = getSeason(year, month, day, dayMaster.element);
  const favorability = getFavorability(dayMaster.element, season.strength);
  const primaryFavorable = favorability.favorable[0];
  const primaryUnfavorable = favorability.unfavorable[0];

  const expressionSum = getExpressionSum(year, month, day);
  const expressionNumber = getExpressionNumber(year, month, day);
  const mode = getExpressionMode(expressionNumber);

  const birthCard = getBirthCard(year, month, day);
  const posture = getRolePosture(birthCard.number);

  return {
    dob: { year, month, day },
    dayMaster: {
      stem: dayMaster.stem,
      polarity: dayMaster.polarity,
      element: dayMaster.element,
      branchAnimal: dayMaster.branchAnimal,
    },
    season: {
      monthAnimal: season.monthAnimal,
      element: season.element,
      state: season.state,
      stateHan: season.stateHan,
      stateLabel: season.stateLabel,
      relation: season.relation,
    },
    strength: season.strength,
    favorable: [...favorability.favorable],
    unfavorable: [...favorability.unfavorable],
    primaryFavorable,
    primaryUnfavorable,
    favorabilityNote: favorability.body,
    expression: {
      sum: expressionSum,
      number: expressionNumber,
      theme: mode.theme,
      register: mode.register,
      method: mode.method,
    },
    posture: {
      number: posture.number,
      roman: birthCard.roman,
      arcana: posture.arcana,
      register: posture.register,
      stance: posture.stance,
    },
    families: rankDomainFamilies(primaryFavorable, expressionNumber)
      .map((family, index) => ({ rank: index + 1, ...family })),
    antiFit: { ...getAntiFitFamily(primaryUnfavorable, expressionNumber) },
    roleLine: getRoleLine(expressionNumber, birthCard.number),
    sources: PUBLIC_SOURCES,
  };
}
