// content/concordance.v3.js
// Active relation registries for the master-preserving contract (calc v4,
// DOCTRINE §1.I v0.62).
//
// DOCTRINE §4 ("versioned, not edited"): content/concordance.v1.js and
// content/concordance.v2.js are IMMUTABLE and untouched. v2 narrowed the
// life-path domain to the nine values calc v3 admitted and retired the three
// master-reduction links from active Concordance. Calc v4 restores the master
// values, so this version restores both: the twelve-value domain, and exactly
// the three links v1 filed — `11↔2`, `22↔4`, `33↔6`.
//
// EXACTLY THREE. `MASTER_REDUCTION_LINKS` is re-exported from the immutable v1
// registry rather than re-declared, so the active inventory cannot grow a
// fourth link by hand. Every other distinct life-path pair stays `unfiled`:
// the registry names no relation for it, and §1.I's register law says the
// dyad-free Concordance surface must say so rather than invent an `adjacent`
// reading to avoid an empty cell. No compatibility claim is added here or
// anywhere downstream.

import {
  REGISTRY_SOURCES as V1_REGISTRY_SOURCES,
  MASTER_REDUCTION_LINKS,
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
  ANIMAL_RELATION_FAMILIES,
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  MAJOR_ARCANA,
  CONCORDANCE_QUALIFIER,
} from './concordance.v1.js';

// Carried over unedited — the v1 tables ARE the v3 tables.
export {
  MASTER_REDUCTION_LINKS,
  SIGNS,
  SIGN_DISTANCE_RELATIONS,
  ANIMAL_RELATION_FAMILIES,
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  MAJOR_ARCANA,
  CONCORDANCE_QUALIFIER,
};

/**
 * The active terminal numerology domain: `1..9` plus the three master stops.
 *
 * This is the same list `TERMINAL_NUMBERS` exports from `core/profile.js`,
 * which is the calculation authority; `tests/profile.test.js` pins the two
 * equal so a domain restated in `content/` cannot drift from the calculator
 * that produces the values. It is restated rather than imported because
 * `content/` imports nothing from `core/` — the one-way direction
 * `core/public.js` records — and an import edge here would put a cycle
 * between the calc core and the tables its own consumers read.
 *
 * Consumed as a domain guard by `ui/concordance.js`, `ui/tiers.js` (which
 * numbers a numerology cell may render) and `core/dyad.js` (which life paths
 * may enter a combined path).
 */
export const LIFE_PATH_VALUES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);

// v1's own label, restored: the life-path registry is once again the
// master-reduction registry, so v2's "nine-number system" wording — accurate
// only while the links were retired — goes back to what it names.
export const REGISTRY_SOURCES = Object.freeze({ ...V1_REGISTRY_SOURCES });
