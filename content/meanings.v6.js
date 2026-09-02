// 8ball / content / meanings.v6.js — ACTIVE meanings registry (§1.G)
//
// v6 = v5 carried UNEDITED (imported and re-exported below — meanings v1
// through v5 all remain immutable on disk per §4) plus one additive
// family in PLACEMENT_LINES for the moon sign (§1.K, the sixteenth
// coordinate): the moon shares SUN_MEANINGS with the sun and the rising
// sign, so without a placement line a repeated sign would render the
// same body a third time.
//
//   PLACEMENT_LINES.moon — one authored line per sign, APPENDED after
//   the unedited SUN_MEANINGS body (the v0.68 three-layer contract). The
//   moon's office in the tropical tradition is the NIGHT luminary — the
//   register of reflex and retention rather than the sun's daylight
//   intent or the ascendant's front. Where the tradition files an
//   essential dignity for the moon (domicile cancer · exaltation taurus ·
//   detriment capricorn · fall scorpio) the line names it; the other
//   eight carry no dignity claim, because the tradition files none.
//
// The star re-export carries every v5 table; the local PLACEMENT_LINES
// export below SHADOWS v5's per the module spec (an explicit export wins
// over a star-conflict), which is how the v5 object is extended without
// editing the v5 file.
//
// Register laws apply in full (§2): lowercase clinical prose, no second
// person, no directive, no oracle vocabulary, no diagnostic framing —
// scanned by tests/meanings_content.test.js through the shared
// voice-register tables.

import {
  PLACEMENT_LINES as V5_PLACEMENT_LINES,
  COORDINATE_CONTEXT as V5_COORDINATE_CONTEXT,
} from './meanings.v5.js';

export * from './meanings.v5.js';

// The moon's harmony role for the `in this sheet` context line (the v2
// COORDINATE_CONTEXT contract: a role phrase and two partner cells). Its
// partners are the two other western cells — the sun it shares a table
// with and the rising sign it shares a birth time with.
export const COORDINATE_CONTEXT = Object.freeze({
  ...V5_COORDINATE_CONTEXT,
  moon: { role: 'the night register', partners: ['sun', 'rising'] },
});

export const PLACEMENT_LINES = Object.freeze({
  ...V5_PLACEMENT_LINES,
  moon: Object.freeze({
    aries: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the quick answer, felt before it is weighed.',
    taurus: 'as the moon sign it keeps the night watch — what the sheet files by reflex is settledness, the same chair kept; the tradition places the moon in its exaltation here.',
    gemini: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the running commentary, mood carried in talk.',
    cancer: 'as the moon sign it keeps the night watch — what the sheet files by reflex is retention, the kept thing and the kept grievance; the tradition places the moon in its own house here.',
    leo: 'as the moon sign it keeps the night watch — what the sheet files by reflex is warmth that wants a witness, ease taken in being seen.',
    virgo: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the small correction, ease found in things put in order.',
    libra: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the levelled room, ease taken in company kept even.',
    scorpio: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the held reserve, feeling kept below the waterline; the tradition places the moon in its fall here.',
    sagittarius: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the open road, mood lifted by distance.',
    capricorn: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the measured response, feeling filed under duty; the tradition places the moon in its detriment here.',
    aquarius: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the cool read, feeling taken at one remove.',
    pisces: 'as the moon sign it keeps the night watch — what the sheet files by reflex is the porous edge, the weather of the room taken in whole.',
  }),
});
