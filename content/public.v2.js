// content/public.v2.js
// Public-tier tables, v2 — the mode driver moves off the life path.
//
// DOCTRINE §4 ("versioned, not edited"): content/public.v1.js shipped in #144
// and #153 and is IMMUTABLE. This file does not edit it — it imports every
// table byte-for-byte and overrides exactly one thing: the provenance string
// for the mode, which named the wrong coordinate as of §1.D v0.59. Same reuse
// pattern content/concordance.v2.js and content/meanings.v2.js follow.
//
// WHY THE DRIVER MOVED (spec §6.1, controller ruling 2026-07-29). The nine
// modes were keyed by LIFE PATH — a coordinate the FREE sheet has shown since
// §1.D v0.38. A paid rung whose only new content is a re-reading of a
// coordinate every visitor already has is thin, and the objection was raised
// by this lane before the rung shipped rather than found after.
//
// The replacement is the BIRTHDAY number: the day of the month reduced by the
// same nine-number rule (core/profile.js getBirthday). Three properties make
// it the right key rather than merely a different one:
//
//   1. It is date-only, so the tier's input contract (§2 of the spec: a birth
//      date and nothing else) is unchanged.
//   2. Its domain is exactly 1..9, so the authored mode table carries over
//      unedited — themes, registers, methods and character priorities are all
//      byte-identical to v1.
//   3. It is a t2 coordinate (`numbers2` in ui/tiers.js), NOT free. The driver
//      is now itself paid information, which is the whole point of the swap.
//
// And on the merits rather than the mechanics: content/meanings.v2.js already
// names the birthday "the recurring skill" and the life path "the long route".
// A mode OF WORK is a recurring skill. The first keying was defensible; this
// one is apt.

import {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  FAMILY_CHARACTERS,
  DOMAIN_FAMILIES,
  WORK_MODES as V1_WORK_MODES,
  ROLE_POSTURES,
  PUBLIC_SOURCES as V1_PUBLIC_SOURCES,
} from './public.v1.js';

// Carried over unedited — the v1 tables ARE the v2 tables.
export {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  FAMILY_CHARACTERS,
  DOMAIN_FAMILIES,
  ROLE_POSTURES,
};

// The authored content of every mode — theme, register, method, priority — is
// carried over byte-for-byte. The one field that changes is the self-naming
// key: v1 entries carry `lifePath: n`, which named the driver correctly then
// and names the wrong coordinate now. A table whose own field lies about what
// keys it is the kind of drift §4's versioning rule exists to prevent, so v2
// re-derives the entries with the field renamed rather than editing v1.
export const WORK_MODES = Object.freeze(Object.fromEntries(
  Object.entries(V1_WORK_MODES).map(([key, mode]) => {
    const { lifePath, ...rest } = mode;
    return [key, Object.freeze({ birthday: lifePath, ...rest })];
  })
));

// The single delta: the mode's named tradition. v1 read "life path,
// nine-number system"; the mode is now keyed by the birthday number, and a
// provenance line that names the wrong coordinate is worse than none (§1.E —
// a placard records what a value was read off).
export const PUBLIC_SOURCES = Object.freeze({
  ...V1_PUBLIC_SOURCES,
  mode: 'pythagorean numerology · birthday, nine-number system',
});
