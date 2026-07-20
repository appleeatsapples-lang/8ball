// 8ball / tests / helpers / voice-register.js
//
// Canonical §2/§4 voice-policy tables, shared by every scan that enforces the
// clinical/anti-oracle register. A plain module — NO describe/it — so importing
// it never re-runs a suite (importing a *.test.js file re-executes its top-level
// describe blocks in the importer's context; these tables used to live in
// profile.test.js and each importer silently re-ran all 133 of its tests).
//
// Consumers:
//   - profile.test.js          BANNED_VOICE_REGISTER + BANNED_PATTERNS over the deck
//   - meanings_content.test.js same, over content/meanings.v1.js
//   - concordance.test.js      same, over content/concordance.v1.js (RC-L2 / §1.I)
//   - provenance.test.js       register + INTERPRETATION_VERBS over §1.E placards
//   - atlas.test.js            register + INTERPRETATION_VERBS over the CLP legend

// Case-insensitive substring match against lowercased content. Preserves
// inflections at end ("auras", "manifesting") — the scans lowercase then
// `.includes()` each term.
export const BANNED_VOICE_REGISTER = [
  'the universe', 'your stars', 'destiny', 'destined', 'fated', 'fate',
  'cosmic', 'the cosmos', 'spiritual', 'mystic', 'mystical', 'psychic',
  'channel', 'channeling', 'aura', 'karma', 'manifest', 'manifestation',
  'third eye', 'soul mate', 'your guides', 'divine', 'sacred',
];

// Interpretation verbs a *derivation note / legend label* must never reach
// for — a stricter extension of the register above, applied by the provenance
// (§1.E) and atlas (CLP cut 2) surface scans. Kept here so those two files
// share one canonical extension instead of hand-copying it (they carried
// byte-identical forks before this consolidation).
export const INTERPRETATION_VERBS = [
  'reveal', 'reveals', 'meaning', 'predict', 'future',
];

// Slur subset. Fast pre-merge tripwire; the local audit and reviewer diff
// close the long tail.
export const BANNED_PATTERNS = [
  /\bretard(ed|ation)?\b/i,
  /\bidiot\b/i,
  /\b(insane|crazy|mental)\b/i,
  /\b(faggot|tranny)\b/i,
  /\bn[i1]gg[ae]r/i,
];
