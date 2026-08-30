// 8ball / content / meanings.v5.js — ACTIVE meanings registry (§1.G)
//
// v5 = v4 carried UNEDITED (imported and re-exported below — meanings v1
// through v4 all remain immutable on disk per §4) plus one additive
// table closing the LAST measured duplication (journal 2026-08-30,
// optimization pass): after the v4 slot lines, the only sheets still
// showing the same body sentence twice were sun/rising sharing
// SUN_MEANINGS and public/private animal sharing ANIMAL_MEANINGS
// verbatim (3 of the 33 diagnosis sample).
//
//   PLACEMENT_LINES — one authored line per (placement, value) for the
//   two table-sharing surfaces. The rising line reads the sign as the
//   FRONT of the encounter (what meets a person first — the ascendant's
//   traditional office); the private-animal line reads the branch as
//   the OFF-STAGE register (the month animal, the §1 card's "private"
//   coordinate). The shared base body stays byte-identical; the
//   placement line is APPENDED after it, never edited into it — the
//   NUMEROLOGY_SLOT_LINES contract, applied to the two remaining
//   shared-table surfaces.
//
// Register laws apply in full (§2): lowercase clinical prose, no second
// person, no directive, no oracle vocabulary, no diagnostic framing —
// scanned by tests/meanings_content.test.js through the shared
// voice-register tables.

export * from './meanings.v4.js';

export const PLACEMENT_LINES = Object.freeze({
  rising: Object.freeze({
    aries: 'as the rising sign it fronts the encounter — the first read off this sheet is the head-on approach, arriving before any history does.',
    taurus: 'as the rising sign it fronts the encounter — the first read off this sheet is steadiness, presented before any flexibility is.',
    gemini: 'as the rising sign it fronts the encounter — the first read off this sheet is talk already in motion, ahead of whatever settles later.',
    cancer: 'as the rising sign it fronts the encounter — the first read off this sheet is guardedness, the shell met before the keeper is.',
    leo: 'as the rising sign it fronts the encounter — the first read off this sheet is presence, staged before any content is offered.',
    virgo: 'as the rising sign it fronts the encounter — the first read off this sheet is exactness, the corrected detail arriving first.',
    libra: 'as the rising sign it fronts the encounter — the first read off this sheet is accommodation, the smoothed surface shown first.',
    scorpio: 'as the rising sign it fronts the encounter — the first read off this sheet is reserve under pressure, withheld before it is spent.',
    sagittarius: 'as the rising sign it fronts the encounter — the first read off this sheet is range, the far reference offered before the near one.',
    capricorn: 'as the rising sign it fronts the encounter — the first read off this sheet is formality, the office presented before the person.',
    aquarius: 'as the rising sign it fronts the encounter — the first read off this sheet is the cool remove, the stance offered before the warmth.',
    pisces: 'as the rising sign it fronts the encounter — the first read off this sheet is permeability, the weather of the room absorbed on entry.',
  }),
  innerAnimal: Object.freeze({
    rat: 'as the private animal it runs off-stage — with the audience gone, the working mode is the side door found early, stores counted twice.',
    ox: 'as the private animal it runs off-stage — with the audience gone, the working mode is unhurried continuation, the same furrow kept.',
    tiger: 'as the private animal it runs off-stage — with the audience gone, the working mode is the unannounced leap, measured while nobody watches.',
    rabbit: 'as the private animal it runs off-stage — with the audience gone, the working mode is the soft-footed check of the ground, exits noted early.',
    dragon: 'as the private animal it runs off-stage — with the audience gone, the working mode is command rehearsed before it is claimed.',
    snake: 'as the private animal it runs off-stage — with the audience gone, the working mode is the long game held close, moves unshown.',
    horse: 'as the private animal it runs off-stage — with the audience gone, the working mode is ground covered for its own sake, the gate kept in view.',
    goat: 'as the private animal it runs off-stage — with the audience gone, the working mode is unhurried making, the craft kept personal.',
    monkey: 'as the private animal it runs off-stage — with the audience gone, the working mode is taking the mechanism apart to learn it, put back before anyone asks.',
    rooster: 'as the private animal it runs off-stage — with the audience gone, the working mode is private inventory, the list squared at close.',
    dog: 'as the private animal it runs off-stage — with the audience gone, the working mode is watch kept without being asked.',
    pig: 'as the private animal it runs off-stage — with the audience gone, the working mode is the well-set table, plenty enjoyed without apology.',
  }),
});
