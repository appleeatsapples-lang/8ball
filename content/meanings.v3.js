// content/meanings.v3.js
// Active coordinate-meaning registry for calc v4 (DOCTRINE §1.G v0.62).
//
// DOCTRINE §4 ("versioned, not edited"): content/meanings.v1.js and
// content/meanings.v2.js are IMMUTABLE and untouched. This file imports both
// byte-for-byte and changes exactly one thing — the active numerology view.
//
// WHY. meanings.v2.js narrowed `NUMEROLOGY_MEANINGS` to the nine terminal
// values calc v3 admitted, and said so in its own comment. Calc v4 restores
// the three master stops (§1.B v0.62), so the active view widens back to the
// twelve values v1 always carried. The 11 / 22 / 33 bodies and registers are
// NOT re-authored: they are the entries v1 shipped, reused unmodified, and
// `tests/meanings_content.test.js` pins them byte-identical to v1 so a later
// edit here cannot quietly become a second authority for a number's meaning.
//
// The only field this file adds for them is `theme` — the process noun v2
// introduced so ui/meanings.js can build a grammatical synthesis sentence
// ("read together, intuition serves as the long route…"). v1 supplies a role
// noun ("the illuminator (master number)"), which does not fit that grammar.
// The three new themes are constrained to be consistent with the immutable
// bodies rather than invented: v1's 11 reads as heightened intuition, its 22
// as large ambition made real through discipline, its 33 as guidance offered
// in service of others.
//
// DOMAIN. The active domain is NOT enumerated here. It is the key set of the
// immutable v1 life-path table, which has carried all twelve values since
// §1.G v0.44 — so widening the active view is a matter of no longer
// narrowing it. `content/concordance.v3.js` declares the same domain for the
// registry side, and `tests/profile.test.js` pins both against
// `TERMINAL_NUMBERS` in `core/profile.js`, which is the calculation
// authority. Deriving the keys rather than restating them is deliberate:
// `content/` imports nothing from `core/` (the one-way direction
// `core/public.js` states), so the agreement is pinned by CI instead of by
// an import edge that would put a cycle between the calc core and its own
// content tables.

import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
} from './meanings.v1.js';
import {
  ELEMENT_MEANINGS,
  COORDINATE_CONTEXT,
} from './meanings.v2.js';

// Carried over unedited — the v1/v2 tables ARE the v3 tables.
export { ARCANA_MEANINGS, SUN_MEANINGS, ANIMAL_MEANINGS, LIFE_PATH_MEANINGS };
export { ELEMENT_MEANINGS, COORDINATE_CONTEXT };

// Process-language equivalent of each value's v1 role noun, used only for the
// `with the other numbers` synthesis. 1..9 are v2's themes, carried across
// unchanged; 11 / 22 / 33 are the three this version adds.
const NUMEROLOGY_THEMES = Object.freeze({
  1: 'initiative', 2: 'cooperation', 3: 'expression',
  4: 'structure', 5: 'change', 6: 'care',
  7: 'analysis', 8: 'command', 9: 'service',
  11: 'intuition', 22: 'construction', 33: 'guidance',
});

/**
 * The active numerology registry: every value the immutable v1 table filed,
 * each entry that exact v1 record plus its theme. Twelve entries under calc
 * v4 — the nine single digits and the three master stops.
 */
export const NUMEROLOGY_MEANINGS = Object.freeze(Object.fromEntries(
  Object.entries(LIFE_PATH_MEANINGS).map(([key, entry]) => {
    const theme = NUMEROLOGY_THEMES[Number(key)];
    if (!theme) throw new Error(`meanings.v3: no theme for numerology value ${key}`);
    return [key, Object.freeze({ ...entry, theme })];
  })
));
