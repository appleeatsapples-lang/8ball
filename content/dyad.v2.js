// content/dyad.v2.js
// Active relation tables for the dyad reading under calc v4 (DOCTRINE §1.J,
// as amended v0.62).
//
// DOCTRINE §4 ("versioned, not edited"): content/dyad.v1.js is IMMUTABLE and
// untouched. This file imports every relation table byte-for-byte — the 25
// ordered element pairs, the six branch registers, the bracket arc and the
// nine ordered bracket registers — and changes exactly two strings, both of
// which named the retired nine-number contract rather than describing a
// relation:
//
//   1. `COMBINED_PATH_FRAMES` — the two clauses that state the arithmetic of
//      the combined-path reduction. v1's wording said "the nine-number rule"
//      and "already inside the nine-number range"; calc v4's rule preserves
//      the three master stops, so both phrases named a rule that no longer
//      exists. The frames still carry NO per-number content — that is what
//      makes them safe (PR #187 finding F6) — and the meaning still comes
//      from the existing registry, unmodified.
//
//   2. `DYAD_SOURCES.numerology` — the provenance line for that axis, which
//      likewise named the nine-number system.
//
// The `direct` / `reduced` split also changes its SELECTION rule, and that
// change lives in core/dyad.js rather than here: v1 chose by `sum > 9`, which
// under calc v4 would fire the `reduced` frame for a sum of 11 that stops AT
// 11 and read "sums to 11, which the rule reduces to 11" — a claim about a
// reduction that did not happen, the exact defect the two-frame split exists
// to prevent. The rule is now "the sum changed", which is what the two frames
// actually distinguish.
//
// GRAMMAR DISCIPLINE. Unchanged and still enforced: every body is one
// sentence of 10–22 words with a single terminal period, and the frames are
// scanned in their resolved form. `tests/dyad_content.test.js` and
// `tests/content_shape.test.js` read this file, so the pins move with it.

import {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  ANIMAL_RELATION_FAMILIES,
  ELEMENT_RELATION_KINDS,
  ELEMENT_RELATIONS,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_QUALIFIER,
  DYAD_SOURCES as V1_DYAD_SOURCES,
} from './dyad.v1.js';

// Carried over unedited — the v1 tables ARE the v2 tables.
export {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  ANIMAL_RELATION_FAMILIES,
  ELEMENT_RELATION_KINDS,
  ELEMENT_RELATIONS,
  BRANCH_REGISTERS,
  BRACKET_ARC,
  BRACKET_REGISTERS,
  DYAD_QUALIFIER,
};

// Two clauses stating the arithmetic that produced the combined value, and
// nothing else. They name no theme, no register and no body, and would read
// identically whatever the number turned out to mean — core/dyad.js pairs the
// clause with the registry's own entry, unmodified, as a labelled citation.
export const COMBINED_PATH_FRAMES = Object.freeze({
  // The sum changed on its way to the combined value.
  reduced: 'the two life paths sum to {sum}, which the master-preserving rule reduces to {combined}.',
  // The sum was already terminal — a single digit, or one of the three master
  // stops. Say so rather than claiming a reduction that did not happen.
  direct: 'the two life paths sum to {combined}, which is already a terminal numerology value.',
});

// The single provenance delta: v1 read "life-path sum, nine-number system".
export const DYAD_SOURCES = Object.freeze({
  ...V1_DYAD_SOURCES,
  numerology: 'pythagorean numerology · life-path sum, master-preserving system',
});
