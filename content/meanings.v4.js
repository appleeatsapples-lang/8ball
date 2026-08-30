// 8ball / content / meanings.v4.js — ACTIVE meanings registry (§1.G)
//
// v4 = v3 carried UNEDITED (imported and re-exported below — meanings.v1,
// .v2 and .v3 all remain immutable on disk per §4) plus two additive
// tables that exist to close the two measured interpretation defects
// (journal 2026-08-30, optimization pass):
//
//   NUMEROLOGY_SLOT_LINES — 76% of sampled sheets showed the SAME body
//   sentence on two or more numerology compartments, because six
//   coordinates draw from one 12-entry table. Each slot now appends one
//   authored line reading the value IN THAT SLOT (vowel line ≠ day-of-
//   birth accent ≠ maturity sum), so a repeated value stops reading as a
//   copy-paste. The shared base body stays byte-identical — including
//   the three master entries' v1-reused bodies (§1.B v0.62) — the slot
//   line is appended after it, never edited into it.
//
//   THEME_TENSIONS — the harmony clause could only say two themes "work
//   through" each other; a sheet carrying persistence AND change read as
//   word algebra. Where a genuinely opposing theme pair co-occurs, the
//   combination clause is replaced by one authored sentence that names
//   the tension. Keys are the two theme words sorted and joined with
//   '|'; lookups must sort the same way. Absent pairs keep the existing
//   harmony clause byte-for-byte.
//
// Register laws apply in full (§2): lowercase clinical prose, no second
// person, no directive, no oracle vocabulary, no diagnostic framing —
// all of it scanned by tests/meanings_content.test.js through the shared
// voice-register tables.

import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
  ELEMENT_MEANINGS,
  COORDINATE_CONTEXT,
  NUMEROLOGY_MEANINGS,
} from './meanings.v3.js';

export { ARCANA_MEANINGS, SUN_MEANINGS, ANIMAL_MEANINGS, LIFE_PATH_MEANINGS };
export { ELEMENT_MEANINGS, COORDINATE_CONTEXT, NUMEROLOGY_MEANINGS };

// One line per (slot, terminal value). Each slot family keeps its own
// syntactic frame — a card shows at most one line from each family, so
// the frames orient without repeating on a single sheet.
export const NUMEROLOGY_SLOT_LINES = Object.freeze({
  lifePath: Object.freeze({
    1: 'carried as the life path, the starting impulse is the through-line — sequences opened across years, not moments.',
    2: 'carried as the life path, the balancing habit is the through-line — positions weighed against each other over the long run.',
    3: 'carried as the life path, expression is the through-line — the long arc bends toward being heard.',
    4: 'carried as the life path, building is the through-line — the long arc accumulates rather than leaps.',
    5: 'carried as the life path, variation is the through-line — the long arc resists settling into one track.',
    6: 'carried as the life path, upkeep of others is the through-line — the long arc gathers dependents.',
    7: 'carried as the life path, inquiry is the through-line — the long arc keeps returning to the unexamined part.',
    8: 'carried as the life path, scale is the through-line — the long arc measures itself in organized results.',
    9: 'carried as the life path, the wider circle is the through-line — the long arc closes accounts for more than one person.',
    11: 'carried as the life path, the heightened read is the through-line — a long arc lived at higher signal and higher tension.',
    22: 'carried as the life path, large construction is the through-line — the long arc wants a work that outlasts it.',
    33: 'carried as the life path, instruction is the through-line — the long arc keeps handing forward what it learned.',
  }),
  nameNumber: Object.freeze({
    1: 'in the full-name pattern it reads as a capacity for opening — the name equips a first move.',
    2: 'in the full-name pattern it reads as a capacity for brokering — the name equips the middle position.',
    3: 'in the full-name pattern it reads as a capacity for delivery — the name equips the telling.',
    4: 'in the full-name pattern it reads as a capacity for assembly — the name equips the slow build.',
    5: 'in the full-name pattern it reads as a capacity for range — the name equips the changed course.',
    6: 'in the full-name pattern it reads as a capacity for tending — the name equips the holding role.',
    7: 'in the full-name pattern it reads as a capacity for depth — the name equips the close reading.',
    8: 'in the full-name pattern it reads as a capacity for administration — the name equips the large lever.',
    9: 'in the full-name pattern it reads as a capacity for representation — the name equips speaking for others.',
    11: 'in the full-name pattern it reads as a capacity for the finer signal — the name equips the noticed detail.',
    22: 'in the full-name pattern it reads as a capacity for the durable work — the name equips the long project.',
    33: 'in the full-name pattern it reads as a capacity for transmission — the name equips the teaching seat.',
  }),
  soulUrge: Object.freeze({
    1: 'as the vowel line it runs inward — what is privately wanted is the open field, before anyone else arrives.',
    2: 'as the vowel line it runs inward — what is privately wanted is accord, the argument already settled.',
    3: 'as the vowel line it runs inward — what is privately wanted is an audience for the unsaid thing.',
    4: 'as the vowel line it runs inward — what is privately wanted is order in place before anything is shown.',
    5: 'as the vowel line it runs inward — what is privately wanted is the open door more than any room behind it.',
    6: 'as the vowel line it runs inward — what is privately wanted is somebody kept well.',
    7: 'as the vowel line it runs inward — what is privately wanted is the answer nobody else has checked.',
    8: 'as the vowel line it runs inward — what is privately wanted is the deciding seat.',
    9: 'as the vowel line it runs inward — what is privately wanted is the loose end tied for everyone.',
    11: 'as the vowel line it runs inward — what is privately wanted is the signal behind the noise, at whatever cost of rest.',
    22: 'as the vowel line it runs inward — what is privately wanted is the finished structure, not the praise for it.',
    33: 'as the vowel line it runs inward — what is privately wanted is the student outgrowing the lesson.',
  }),
  personality: Object.freeze({
    1: 'in the consonant line it shows first — the surface presents decision before deliberation is visible.',
    2: 'in the consonant line it shows first — the surface presents accommodation before any position is visible.',
    3: 'in the consonant line it shows first — the surface presents fluency before the full argument is visible.',
    4: 'in the consonant line it shows first — the surface presents method before any warmth is visible.',
    5: 'in the consonant line it shows first — the surface presents motion before any commitment is visible.',
    6: 'in the consonant line it shows first — the surface presents welcome before any demand is visible.',
    7: 'in the consonant line it shows first — the surface presents reserve before the interest is visible.',
    8: 'in the consonant line it shows first — the surface presents competence before any ease is visible.',
    9: 'in the consonant line it shows first — the surface presents breadth before the personal stake is visible.',
    11: 'in the consonant line it shows first — the surface presents attentiveness that can read as distance.',
    22: 'in the consonant line it shows first — the surface presents steadiness sized to the plan behind it.',
    33: 'in the consonant line it shows first — the surface presents patience worn like a uniform.',
  }),
  birthday: Object.freeze({
    1: 'as the day-of-birth accent it marks a native knack — cold starts come cheaper here than they do elsewhere on the sheet.',
    2: 'as the day-of-birth accent it marks a native knack — reading the second party comes cheaper here than elsewhere on the sheet.',
    3: 'as the day-of-birth accent it marks a native knack — the apt phrasing comes cheaper here than elsewhere on the sheet.',
    4: 'as the day-of-birth accent it marks a native knack — the workable plan comes cheaper here than elsewhere on the sheet.',
    5: 'as the day-of-birth accent it marks a native knack — the course correction comes cheaper here than elsewhere on the sheet.',
    6: 'as the day-of-birth accent it marks a native knack — noticing what a person needs comes cheaper here than elsewhere on the sheet.',
    7: 'as the day-of-birth accent it marks a native knack — the overlooked detail comes cheaper here than elsewhere on the sheet.',
    8: 'as the day-of-birth accent it marks a native knack — sizing the resource comes cheaper here than elsewhere on the sheet.',
    9: 'as the day-of-birth accent it marks a native knack — the wider view comes cheaper here than elsewhere on the sheet.',
    11: 'as the day-of-birth accent it marks a native knack — the unprompted read comes cheaper here, and quiet costs more.',
    22: 'as the day-of-birth accent it marks a native knack — the load-bearing estimate comes cheaper here than elsewhere on the sheet.',
    33: 'as the day-of-birth accent it marks a native knack — the patient explanation comes cheaper here than elsewhere on the sheet.',
  }),
  maturity: Object.freeze({
    1: 'as the maturity sum it arrives late — the later years consolidate toward acting first and consulting after.',
    2: 'as the maturity sum it arrives late — the later years consolidate toward the negotiated middle.',
    3: 'as the maturity sum it arrives late — the later years consolidate toward the told story.',
    4: 'as the maturity sum it arrives late — the later years consolidate toward the kept structure.',
    5: 'as the maturity sum it arrives late — the later years consolidate toward the unfinished map.',
    6: 'as the maturity sum it arrives late — the later years consolidate toward the tended table.',
    7: 'as the maturity sum it arrives late — the later years consolidate toward the examined life.',
    8: 'as the maturity sum it arrives late — the later years consolidate toward the managed estate.',
    9: 'as the maturity sum it arrives late — the later years consolidate toward the settled debt to the wider circle.',
    11: 'as the maturity sum it arrives late — the later years consolidate toward the read that others come to ask for.',
    22: 'as the maturity sum it arrives late — the later years consolidate toward the one large finished thing.',
    33: 'as the maturity sum it arrives late — the later years consolidate toward the handed-on craft.',
  }),
});

// Authored tension sentences for opposing theme pairs that genuinely
// co-occur on real sheets. Key = the two theme words sorted, '|'-joined.
// One sentence each: names the pull, in register, without ranking the
// two sides or prescribing anything.
export const THEME_TENSIONS = Object.freeze({
  'change|persistence': 'persistence and change pull against each other on this sheet — one holds the position, the other keeps moving it, and neither reads as the default.',
  'adaptability|persistence': 'persistence and adaptability sit in tension here — the settled grip and the adjusted grip cannot both lead at once.',
  'change|structure': 'structure and change pull opposite ways — what one assembles, the other is already revising.',
  'expression|structure': 'structure and expression run at different tempos here — the built thing wants finishing, the said thing wants saying now.',
  'boldness|caution': 'caution and boldness contradict each other on this sheet — the same opening reads as a risk from one side and an invitation from the other.',
  'caution|initiative': 'caution and initiative pull against each other — the first move and the second thought are both native here.',
  'discretion|expression': 'discretion and expression sit in open tension — the private hold and the public telling claim the same material.',
  'discretion|visibility': 'discretion and visibility contradict each other here — what one keeps back, the other is built to display.',
  'cooperation|independence': 'independence and cooperation pull opposite ways — the solo line and the joined line are both carried, and the sheet does not choose between them.',
  'attachment|independence': 'independence and attachment sit in tension — the open distance and the held bond ask for different postures.',
  'attachment|detachment': 'attachment and detachment contradict each other on this sheet — the same tie is gripped from one side and released from the other.',
  'visibility|withdrawal': 'withdrawal and visibility pull against each other — the stepped-back position and the front position trade off directly.',
  'change|stability': 'stability and change run counter here — the kept ground and the left ground cannot be the same ground.',
  'ingenuity|tradition': 'tradition and ingenuity sit in tension — the received way and the invented way answer the same question differently.',
  'initiative|patience': 'patience and initiative pull opposite ways — the waited moment and the taken moment rarely coincide.',
  'intensity|moderation': 'intensity and moderation contradict each other here — full commitment and measured commitment are different instruments.',
  'expansion|moderation': 'moderation and expansion pull against each other — the trimmed scope and the widened scope compete for the same decision.',
});
