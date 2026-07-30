// 8ball / core / public.js — public-tier computation engine
//
// Pure functions. No DOM, no globals, no I/O, no network, no model call at
// runtime or at any other time: every value below is a lookup or an integer
// reduction over the frozen tables in content/public.v3.js. Same date in,
// byte-identical object out, forever.
//
// SCOPE. This module computes only the public-tier reading. It does not enter
// getCard / resolveBracket (the catalog driver stays (sunSign, animal) per
// DOCTRINE §1), does not read or write storage, does not know about tiers,
// prices, entitlement or any UI surface. As of §1.D v0.58 it HAS a consumer —
// ui/public.js, the only one, pinned by a test — but the direction of that
// dependency is one-way: the surface is told whether the device is entitled;
// this module never asks (see PUBLIC_TIER_SPEC.md §7).
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
// content/. So this module reads its tables from content/public.v3.js, which
// carries the v1/v2 tables unedited, adds the master mode bridge and corrects
// one provenance string (§4 versioned-not-edited). The direction is one-way
// (content/ imports nothing from core/) and adds no runtime capability — all
// three files are frozen data.

import { getDayPillar, STEMS } from './pillars.js';
import { getInnerAnimal, getBirthday } from './profile.js';
import { getBirthCard } from './birthcard.js';
import {
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  DOMAIN_FAMILIES,
  WORK_MODES,
  MASTER_MODE_BRIDGE,
  MASTER_MODE_BRIDGE_NOTE,
  ROLE_POSTURES,
  PUBLIC_SOURCES,
} from '../content/public.v3.js';

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

// ── 2. Birthday → mode of work ──────────────────────────────────────────────
//
// NINE modes, keyed by the BIRTHDAY number: the day of the month reduced by
// the same reduction rule core/profile.js owns (§1.B v0.54 at the time of
// writing; calc v4 widened it — see THE MASTER BRIDGE below). Three
// controller rulings shaped this key, all recorded because each overruled
// something rather than interpreting it:
//
//   1. The first draft retained the 11 and 22 stops, making the table eleven
//      entries and diverging from §1.B v0.54. Ruling: collapse to nine.
//   2. Collapsing exposed that the driver was then the LIFE PATH — the same
//      sum under the same reduction, and a coordinate the free sheet has
//      shown since §1.D v0.38. Ruling: rename it to what it was.
//   3. Naming it made the real problem legible: a $9 rung whose only new
//      content re-read a coordinate every visitor already has. Ruling
//      (§1.D v0.59, spec §6.1): move the driver off the free surface.
//
// The birthday is the replacement because it is date-only (the input contract
// does not change), its domain is exactly 1..9 (the authored table carries
// over unedited), and it is a t2 coordinate — so the driver is itself paid
// information. content/meanings.v2.js already names it "the recurring skill",
// which is a better description of a mode of work than the life path's "the
// long route".
//
// As with the life path before it, there is deliberately no wrapper: the
// reduction rule belongs to core/profile.js and this module calls getBirthday
// directly rather than keeping a private copy under a tier-local name.
//
// THE MASTER BRIDGE (calc v4, §1.B v0.62). The clause above says the driver's
// domain is "exactly 1..9, so the authored table carries over unedited". That
// stopped being true when the master stops came back: a birthday of 11 or 22
// is now a real coordinate value, and the mode table has nine entries.
//
// The birthday keeps its master value — it is what the sheet shows and what
// this reading reports. What is bridged is only the TABLE LOOKUP, through the
// declared `MASTER_MODE_BRIDGE` in content/public.v3.js (11→2, 22→4, 33→6 —
// the same three links the immutable v1 Concordance registry files). The
// bridge is reported in the returned reading rather than applied silently, so
// nothing here can pass a base mode off as a master one.

/**
 * Which mode-table key a birthday number reaches, and whether it got there
 * through the bridge. Total over the calc-v4 terminal domain: a master value
 * has a bridge entry, every other value keys the table directly.
 *
 * @param {number} birthday
 * @returns {{key: number, bridged: boolean, from: number}}
 */
export function resolveModeKey(birthday) {
  const bridged = MASTER_MODE_BRIDGE[birthday];
  return bridged === undefined
    ? { key: birthday, bridged: false, from: birthday }
    : { key: bridged, bridged: true, from: birthday };
}

export function getWorkMode(birthday) {
  const mode = WORK_MODES[resolveModeKey(birthday).key];
  if (!mode) throw new Error(`No work mode for birthday=${birthday}`);
  return mode;
}

// ── 3. Domain families ──────────────────────────────────────────────────────

// Rank an element's three families by the mode's character priority. Each
// element carries exactly one family per character, so the sort is a total
// order with no tie-break and no positional bias.
export function rankDomainFamilies(element, birthday) {
  const families = DOMAIN_FAMILIES[element];
  if (!families) throw new Error(`No domain families for element="${element}"`);
  const { priority } = getWorkMode(birthday);
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
export function getAntiFitFamily(element, birthday) {
  const families = DOMAIN_FAMILIES[element];
  if (!families) throw new Error(`No domain families for element="${element}"`);
  const { priority } = getWorkMode(birthday);
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
// (from the birth card) and the mode's method (from the birthday). No
// adjectives are computed, nothing is generated — the line is a join.
export function getRoleLine(birthday, arcanaNumber) {
  return `${getRolePosture(arcanaNumber).stance}, ${getWorkMode(birthday).method}.`;
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

  const birthday = getBirthday(day);
  const modeKey = resolveModeKey(birthday);
  const mode = getWorkMode(birthday);

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
    mode: {
      // The coordinate, unreduced — 11 and 22 stay 11 and 22.
      birthday,
      dayOfMonth: day,
      // The table key the mode was actually read from, and whether the
      // master bridge was used to get there. Reported rather than hidden:
      // §1.B v0.62 requires the bridge to be visible in the data so it can
      // be tested and can never masquerade as a native master-mode table.
      modeKey: modeKey.key,
      bridged: modeKey.bridged,
      bridgeNote: modeKey.bridged
        ? MASTER_MODE_BRIDGE_NOTE
          .replace('{birthday}', String(modeKey.from))
          .replace('{mode}', String(modeKey.key))
        : null,
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
    families: rankDomainFamilies(primaryFavorable, birthday)
      .map((family, index) => ({ rank: index + 1, ...family })),
    antiFit: { ...getAntiFitFamily(primaryUnfavorable, birthday) },
    roleLine: getRoleLine(birthday, birthCard.number),
    sources: PUBLIC_SOURCES,
  };
}
