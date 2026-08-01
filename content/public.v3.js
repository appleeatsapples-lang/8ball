// content/public.v3.js
// Public-tier tables, v3 — the mode driver keeps its master values, and the
// nine-mode table is reached through an explicit bridge (DOCTRINE §1.D v0.60
// t3 ceiling block, as amended by §1.B v0.62).
//
// DOCTRINE §4 ("versioned, not edited"): content/public.v1.js and
// content/public.v2.js are IMMUTABLE and untouched. This file imports every
// table byte-for-byte — including all nine authored work modes, which are
// NOT re-authored, re-keyed or extended here — and adds exactly two things:
// the bridge table, and a provenance string that discloses it.
//
// THE PROBLEM. §1.D v0.59 keyed the mode of work by the BIRTHDAY number, on
// the reasoning that its domain was exactly 1..9 so "the authored nine-mode
// table carries over unedited". Calc v4 restores the master stops (§1.B
// v0.62), so a birthday of 11 or 22 is now a real coordinate value and the
// domain is no longer 1..9. (33 is unreachable from a day of the month, but
// the bridge covers it so the mapping is total over the terminal domain
// rather than total over what happens to be reachable today.)
//
// THE TWO WRONG FIXES, named so they are not re-proposed. (a) Reduce the
// birthday before keying the mode — that would put a coordinate on the sheet
// as 11 while the reading silently treated it as 2, which is the truth defect
// this whole cycle exists to repair. (b) Author three master work modes —
// that is new paid copy, out of scope for a calculation-contract change, and
// it would be authored under cover of a mechanical fix.
//
// THE FIX. The birthday coordinate keeps its master value everywhere it is
// shown. Reaching the mode table goes through `MASTER_MODE_BRIDGE`, a
// declared, exported mapping from each master value to its base — the same
// `11→2 / 22→4 / 33→6` reduction the immutable v1 Concordance registry files
// as a named link. core/public.js reports the bridge in the reading it
// returns (`mode.bridged`, `mode.modeKey`, `mode.bridgeNote`), so a consumer
// or a test can see that a master birthday read a base mode. Nothing here
// claims a native master-mode table exists.

import {
  ELEMENTS,
  ELEMENT_SHENG,
  ELEMENT_KE,
  BRANCH_ELEMENTS,
  SEASONAL_STATES,
  ELEMENT_FAVORABILITY,
  FAMILY_CHARACTERS,
  DOMAIN_FAMILIES,
  ROLE_POSTURES,
  WORK_MODES,
  PUBLIC_SOURCES as V2_PUBLIC_SOURCES,
} from './public.v2.js';

// Carried over unedited — the v1/v2 tables ARE the v3 tables. WORK_MODES in
// particular keeps its nine entries and its `birthday: n` self-naming field,
// which stays accurate: a mode is still keyed by a birthday number, and the
// bridge only decides WHICH birthday number reaches it.
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
  WORK_MODES,
};

/**
 * Master birthday value → the base mode it reads. Exactly the three links the
 * immutable v1 Concordance registry files, and nothing else: this is a
 * declared bridge, not a general reducer, so a value that is not a master
 * stop has no entry and keys the table directly.
 */
export const MASTER_MODE_BRIDGE = Object.freeze({ 11: 2, 22: 4, 33: 6 });

/**
 * The sentence core/public.js attaches to a bridged reading, so the bridge is
 * visible in the output and not only in this file's comments. `{birthday}`
 * and `{mode}` are filled with the two integers.
 */
export const MASTER_MODE_BRIDGE_NOTE =
  'the birthday number {birthday} is a master value; no master work mode is authored, so the mode is read from its base number {mode}.';

// The provenance delta: v2 read "birthday, nine-number system", which named a
// reduction rule that no longer runs on this coordinate. The line now names
// the domain the birthday actually has and discloses the bridge, because a
// placard that records the wrong derivation is worse than none (§1.E).
export const PUBLIC_SOURCES = Object.freeze({
  ...V2_PUBLIC_SOURCES,
  mode: 'pythagorean numerology · birthday, master-preserving; master values read the base mode',
});
