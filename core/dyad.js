// 8ball / core / dyad.js — the dyad relation layer (DOCTRINE §1.J, t5)
//
// Pure functions. No DOM, no globals, no I/O, no network, no storage, no
// model call at runtime or at any other time: every value below is a lookup
// or an integer reduction over active content/dyad.v2.js, which carries the
// immutable v1 relation tables and versions only the calc-v4 frames. Two
// profiles in, byte-identical object out, forever.
//
// INPUT — two ALREADY-CALCULATED profiles, not two payloads. This is the
// order DOCTRINE §1.I fixes for Concordance and it is load-bearing here for
// the same reason: "both stored input payloads are recomputed independently
// through the unchanged profileFromPayload → buildProfile path; only after
// both calculated profiles exist does the relation lookup run." The dyad
// therefore CANNOT drift from the single reading — it does not recompute a
// coordinate, it reads the ones buildProfile already produced.
//
// That also makes the brief's byte-identity requirement structural rather
// than tested-for: `reading.a` IS the profile object handed in, the same
// reference, so a standalone single reading and the A side of a dyad cannot
// differ. There is no second code path to keep in sync.
//
// SCOPE. This module does not enter getCard's driver or resolveBracket's
// rule — it CALLS both, on each profile separately, exactly as the single
// render does. It computes no new coordinate for either person: the catalog
// index, the bracket, the day master and the life path are all values the
// single sheet already carries. What t5 adds is the relation BETWEEN two
// sheets, which is why §1.J files it as a block and the §1.F census does not
// move (see ui/tiers.js T5_COORDS).
//
// REGISTER (§1.J, bounded by the §1.I register law). Every string this module
// emits comes from a frozen table or is a join of two of them. Nothing is
// generated, nothing is scored, nothing is ranked, and no output says whether
// two people suit each other — the tables describe relations between
// branches, elements, brackets and numbers, and this module only selects and
// joins them. The `qualifier` rides every reading for the same reason
// Concordance carries it: what is on offer is a citation, not a verdict.

import { getCard, resolveBracket } from './engine.js';
import { STEMS, STEM_ELEMENTS } from './pillars.js';
import { sumDigits } from './math.js';
import { NUMEROLOGY_MEANINGS } from '../content/meanings.v6.js';
import { LIFE_PATH_VALUES } from '../content/concordance.v3.js';
import {
  ELEMENT_SHENG,
  ELEMENT_KE,
  ELEMENTS,
  ANIMAL_RELATION_FAMILIES,
  ELEMENT_RELATIONS,
  ELEMENT_RELATION_KINDS,
  COMBINED_PATH_FRAMES,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_SOURCES,
  DYAD_QUALIFIER,
} from '../content/dyad.v2.js';

// ── 1. Day master ───────────────────────────────────────────────────────────
//
// The day master is the heavenly stem of the day pillar; its element is the
// element the element axis is keyed on.
//
// It is READ OFF `profile.dayPillar`, never recomputed. The first version of
// this function destructured `yyyy/mm/dd` and called `getDayPillar()` again,
// which contradicted this module's own header and DOCTRINE §1.J's calculation-
// isolation clause in the same breath as asserting them — a Codex pre-merge
// audit (PR #187, finding F4) passed a profile whose supplied `dayPillar` had
// been deliberately altered and got back the day master re-derived from the
// raw date. The recomputation was deterministic and agreed with the supplied
// coordinate in every ordinary case, which is exactly why it survived a green
// suite: "usually identical" is not the contract. The contract is that the
// relation layer consumes what `buildProfile` produced, so that there is one
// calculation of record and a caller cannot be shown a relation computed from
// coordinates it was never given.
//
// `getDayPillar` returns `{stemIndex, branchIndex, stemElement, animal}` and
// stores no stem NAME, so `STEMS[stemIndex]` is a label lookup on the supplied
// index — not a second derivation from the date. The guard below checks the
// supplied object is internally coherent (a stem index in range whose element
// matches the sexagenary table) and throws otherwise: on a paid surface a
// malformed coordinate must fail closed rather than resolve to a plausible
// wrong relation. `ui/dyad.js` catches and seals the block.
export function dyadDayMaster(profile) {
  const pillar = profile && profile.dayPillar;
  if (!pillar || typeof pillar !== 'object') {
    throw new TypeError('profile.dayPillar is required — the dyad consumes calculated coordinates');
  }
  const { stemIndex, stemElement } = pillar;
  if (!Number.isInteger(stemIndex) || stemIndex < 0 || stemIndex >= STEMS.length) {
    throw new TypeError(`invalid day-pillar stem index: ${stemIndex}`);
  }
  if (stemElement !== STEM_ELEMENTS[stemIndex]) {
    throw new TypeError(
      `incoherent day pillar: stem index ${stemIndex} is ${STEM_ELEMENTS[stemIndex]}, not "${stemElement}"`
    );
  }
  return {
    stem: STEMS[stemIndex],
    element: stemElement,
  };
}

// ── 2. Directed element relation ────────────────────────────────────────────

/**
 * The kind of relation the ORDERED pair (from → to) stands in, re-derived
 * from the wuxing cycles rather than read off the table. Total over the five
 * elements: for any ordered pair exactly one branch fires.
 */
export function elementRelationKind(from, to) {
  if (from === to) return 'same';
  if (ELEMENT_SHENG[from] === to) return 'sheng';
  if (ELEMENT_SHENG[to] === from) return 'sheng_by';
  if (ELEMENT_KE[from] === to) return 'ke';
  return 'ke_by'; // ELEMENT_KE[to] === from
}

/**
 * One direction of the element axis. `body` is the authored passage for this
 * exact ordered pair; `kind`/`label`/`verb` name the register it sits in.
 * Throws on an element outside the five — a malformed profile must fail
 * loudly here rather than render a relation that does not exist.
 */
export function elementDirection(from, to) {
  if (!ELEMENTS.includes(from) || !ELEMENTS.includes(to)) {
    throw new TypeError(`invalid five-element value: "${from}" / "${to}"`);
  }
  const entry = ELEMENT_RELATIONS[`${from}_${to}`];
  if (!entry) throw new Error(`No element relation for "${from}_${to}"`);
  const kind = ELEMENT_RELATION_KINDS[entry.kind];
  return {
    from, to,
    kind: entry.kind,
    label: kind.label,
    verb: kind.verb,
    body: entry.body,
  };
}

// ── 3. Combined life path ───────────────────────────────────────────────────

// The §1.B v0.62 master-preserving reduction, applied to the SUM of two life
// paths. core/profile.js owns this rule for a single reading but keeps its
// reducer private and exposes it only through per-coordinate functions, none
// of which takes an arbitrary total. Rather than widen that module's surface
// for one caller, the rule is restated here in its canonical form (repeated
// digit sum while the value is above 9, stopping at a master value) and
// pinned against the shipped behaviour by a differential test:
// tests/dyad.test.js checks this against core/profile.js getBirthday — the
// one exported function that reduces an arbitrary positive integer — across
// the whole reachable domain and well beyond it.
//
// Renamed from `reduceNine` (calc v3): the old name asserted a domain the
// rule no longer has, and a function called `reduceNine` that can return 22
// is worse than one with a neutral name.
const MASTER_STOPS = new Set([11, 22, 33]);

export function reduceTerminal(total) {
  if (!Number.isInteger(total) || total <= 0) return null;
  let n = total;
  while (n > 9 && !MASTER_STOPS.has(n)) n = sumDigits(n);
  return n;
}

/**
 * The reduction clause: the arithmetic, and nothing else. Two frames, chosen
 * by whether the sum ACTUALLY CHANGED — a single frame would have to say
 * "sums to 6, which reduces to 6" whenever the sum was already terminal,
 * which is a claim about a reduction that did not happen.
 *
 * The test is `sum !== combined`, not `sum > 9`. Under calc v3 those were the
 * same test because every terminal value was a single digit; under calc v4
 * they are not — a life path 9 beside a 2 sums to 11, which STOPS at 11, and
 * `sum > 9` would fire the reduced frame to announce that 11 reduces to 11.
 */
export function combinedPathClause(sum, combined) {
  const frame = sum === combined ? COMBINED_PATH_FRAMES.direct : COMBINED_PATH_FRAMES.reduced;
  return frame.replace('{sum}', String(sum)).replace('{combined}', String(combined));
}

/**
 * The numerology axis. Both life paths are in the calc-v4 terminal domain
 * (`1..9, 11, 22, 33`), so the sum runs 2..66 and the reduction lands back in
 * the same domain — including on a master value, which 9+2, 11+11 and 11+22
 * all reach. A combined path may therefore itself be 11, 22 or 33, and reads
 * the registry entry for that value like any other.
 *
 * The returned object separates the two things §1.J requires to stay separate:
 *
 *   `reduction` — the arithmetic clause authored for this tier, no meaning;
 *   `meaning`   — the EXISTING registry's own body for that number, byte-for-
 *                 byte, plus its `register`. Not paraphrased, not re-authored,
 *                 not summarized. `ui/dyad.js` renders it as a labelled
 *                 citation so the reader can see it is the same entry the
 *                 single sheet shows for that number.
 *
 * PR #187 finding F6: the first version emitted nine authored bodies here that
 * restated the registry's clauses, while ALSO looking the registry up — two
 * sources for one number's meaning, with only the copy ever rendered.
 */
export function combinedPath(lifePathA, lifePathB) {
  // Both inputs are validated against the ACTIVE domain before they are
  // summed, not merely checked for integer-ness. Summing first hides the
  // whole class of bad input this guard exists for: an out-of-domain value is
  // often a perfectly good integer, so `10 + 4` would reduce to a plausible 5
  // and render a combined path built on a coordinate the calculator cannot
  // produce. `resolveBracket` rejects those values on the single sheet; the
  // dyad has to reject them too or it becomes the one surface where a stale
  // hand-edited profile still reads. 0 and negatives fail here for the same
  // reason — they survive a sum but are not numerology coordinates. The
  // domain widened at calc v4 to admit 11 / 22 / 33; it did not stop being a
  // domain.
  for (const value of [lifePathA, lifePathB]) {
    if (!LIFE_PATH_VALUES.includes(value)) {
      throw new TypeError(`invalid life path pair: ${lifePathA} / ${lifePathB}`);
    }
  }
  const sum = lifePathA + lifePathB;
  const combined = reduceTerminal(sum);
  if (combined === null) {
    throw new TypeError(`invalid life path pair: ${lifePathA} / ${lifePathB}`);
  }
  const entry = NUMEROLOGY_MEANINGS[String(combined)];
  if (!entry) throw new Error(`No numerology registry entry for ${combined}`);
  return {
    lifePathA, lifePathB,
    sum,
    combined,
    register: entry.register,
    theme: entry.theme,
    reduction: combinedPathClause(sum, combined),
    // The registry's own body, carried unmodified. If this is ever replaced by
    // a locally authored string, F6 has recurred.
    meaning: entry.body,
    meaningSource: 'content/meanings.v6.js NUMEROLOGY_MEANINGS',
  };
}

// ── 4. Card pair ────────────────────────────────────────────────────────────

// Expand every branch family into its unordered pairs once, at module load.
// Same expansion ui/concordance.js performs; it is repeated rather than
// imported because core/ must not depend on ui/ (the dependency direction is
// one-way per DOCTRINE §6). tests/dyad.test.js pins the two expansions
// agree, so the repetition cannot drift into a second registry.
const BRANCH_PAIRS = (() => {
  const map = new Map();
  const key = (a, b) => [String(a), String(b)].sort().join('|');
  for (const family of ANIMAL_RELATION_FAMILIES) {
    const pairs = [...(family.pairs || [])];
    for (const group of family.groups || []) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) pairs.push([group[i], group[j]]);
      }
    }
    for (const [a, b] of pairs) {
      const k = key(a, b);
      map.set(k, [...(map.get(k) || []), family.key]);
    }
  }
  return map;
})();

export function branchPairKey(a, b) {
  return [String(a), String(b)].sort().join('|');
}

/**
 * Named branch relations for a pair of year animals, in ANIMAL_RELATION_FAMILIES
 * declaration order. A pair can hold more than one (ox × goat is both a chong
 * and a xing), so all matches are recorded and the FIRST is the register the
 * passage is drawn from — deterministic, and it never hides the others.
 *
 * Same animal is `unfiled` rather than invented, per the §1.I register law:
 * the branch tables name no relation for a branch with itself, so the dyad
 * claims none.
 */
export function branchRelation(animalA, animalB) {
  const families = animalA === animalB
    ? []
    : (BRANCH_PAIRS.get(branchPairKey(animalA, animalB)) || []);
  const key = families.length > 0 ? families[0] : 'unfiled';
  const register = BRANCH_REGISTERS[key];
  return {
    animalA, animalB,
    families,
    status: families.length > 0 ? 'registered' : 'unfiled',
    key,
    body: register.body,
  };
}

/**
 * The ordered bracket pair. `low_high` and `high_low` are distinct entries —
 * the axis reads A against B, not a set of two.
 */
export function bracketPair(lifePathA, lifePathB) {
  const a = resolveBracket(lifePathA);
  const b = resolveBracket(lifePathB);
  const register = BRACKET_REGISTERS[`${a}_${b}`];
  return {
    a, b,
    arcA: BRACKET_ARC[a],
    arcB: BRACKET_ARC[b],
    body: register.body,
  };
}

/**
 * The card-pair axis: the two catalog cells read across the two registers the
 * four-slot grammar exposes to a pair — the year branches (which drive the
 * cell) and the life-path brackets (which drive the written note position).
 *
 * NO deck string is read. The catalog numerals are positional output of
 * getCard, and both passages come through active content/dyad.v2.js from its
 * immutable v1 relation tables — so the t3
 * written entry is not given away, recombined, or paraphrased at t5.
 */
export function cardPair(profileA, profileB) {
  const branch = branchRelation(profileA.animal, profileB.animal);
  const bracket = bracketPair(profileA.lifePath, profileB.lifePath);
  return {
    catalogA: getCard(profileA).catalog,
    catalogB: getCard(profileB).catalog,
    branch,
    bracket,
    body: `${branch.body} ${bracket.body}`,
  };
}

// ── Assembly ────────────────────────────────────────────────────────────────

/**
 * Build the full dyad reading from two calculated profiles.
 *
 *   buildDyadReading(buildProfile(nameA, dobA), buildProfile(nameB, dobB))
 *
 * Returns `{ a, b, relation }`. `a` and `b` are the SAME objects handed in —
 * not copies, not rebuilt — so each side is byte-identical to the standalone
 * reading by construction. `relation` is the t5 layer and the only thing this
 * module authors a shape for.
 *
 * Throws a TypeError on anything that is not a pair of calculated profiles,
 * and propagates the element/life-path guards above. The dyad screen catches
 * and reports rather than rendering half a relation.
 */
export function buildDyadReading(a, b) {
  if (!a || typeof a !== 'object' || !b || typeof b !== 'object') {
    throw new TypeError('two calculated profiles are required');
  }
  const dayMasterA = dyadDayMaster(a);
  const dayMasterB = dyadDayMaster(b);
  return {
    a,
    b,
    relation: {
      element: {
        a: dayMasterA,
        b: dayMasterB,
        aToB: elementDirection(dayMasterA.element, dayMasterB.element),
        bToA: elementDirection(dayMasterB.element, dayMasterA.element),
        source: DYAD_SOURCES.element,
      },
      numerology: {
        ...combinedPath(a.lifePath, b.lifePath),
        source: DYAD_SOURCES.numerology,
      },
      cardPair: {
        ...cardPair(a, b),
        source: DYAD_SOURCES.cardPair,
      },
      qualifier: DYAD_QUALIFIER,
    },
  };
}
