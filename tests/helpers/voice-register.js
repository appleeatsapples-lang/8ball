// 8ball / tests / helpers / voice-register.js
//
// Canonical §2/§4 voice-policy tables AND the canonical matching semantics,
// shared by every scan that enforces the clinical/anti-oracle register. A
// plain module — NO describe/it — so importing it never re-runs a suite
// (importing a *.test.js file re-executes its top-level describe blocks in
// the importer's context; these tables used to live in profile.test.js and
// each importer silently re-ran all 133 of its tests).
//
// MATCHING SEMANTICS — one canon (PR #101 MED-1 follow-up): case-insensitive
// SUBSTRING over lowercased text, via voiceRegisterHits() below. Substring is
// the strict direction: it catches suffix inflections ("mysticism", "auras",
// "manifesting", "channeled") that the word-bounded `\b term \b` regexes the
// three content scans previously hand-rolled provably false-greened on.
// Benign English containments (e.g. "restaurant" ⊃ "aura") are suppressed
// only by the explicit SUBSTRING_SAFELIST — adding an entry is a reviewed
// policy change and needs a journal note. BANNED_PATTERNS deliberately stays
// word-bounded regex: those are exact clinical/slur words where substring
// would false-positive on ordinary vocabulary ("elemental" ⊃ "mental").
// Positive-fire sentinels for the matcher, the safelist, and both framing
// patterns live in meanings_content.test.js (the pii_scan.test.js
// guard-the-guard pattern).
//
// Consumers — every BANNED_VOICE_REGISTER-based scan routes through
// voiceRegisterHits (the #104/#108 LOW-3 debt clear closed the last two
// inline forks); the framing REs and BANNED_PATTERNS below are separate
// voice-policy surfaces with their own (regex) semantics:
//   - profile.test.js          matcher + framing REs + BANNED_PATTERNS over the deck
//   - meanings_content.test.js same, over content/meanings.v1.js (+ the sentinels)
//   - concordance.test.js      same, over content/concordance.v1.js registry
//                              + the assembled buildConcordance output
//   - provenance.test.js       matcher with register + INTERPRETATION_VERBS over §1.E placards
//   - atlas.test.js            matcher with register + INTERPRETATION_VERBS over the CLP legend

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

// Known-benign English words that CONTAIN a banned term without carrying its
// sense — the only way past the substring matcher. Grow it deliberately, one
// reviewed word at a time (journal note required), never by weakening the
// semantic. Entries are compared against the full containing word run, so a
// possessive ("restaurant's") needs its own entry if content ever uses one.
export const SUBSTRING_SAFELIST = [
  'restaurant', 'restaurants', // ⊃ 'aura'
  'aural',                     // ⊃ 'aura' (hearing-related)
  'sulfate', 'sulfates',       // ⊃ 'fate'
];

// Expand a substring match to the full word run around it. [a-z'] only —
// hyphens and other punctuation stay boundaries, so "non-spiritual" reports
// containing word "spiritual" (and still fires).
function containingRun(lower, idx, len) {
  const isWord = c => (c >= 'a' && c <= 'z') || c === "'";
  let start = idx;
  let end = idx + len;
  while (start > 0 && isWord(lower[start - 1])) start--;
  while (end < lower.length && isWord(lower[end])) end++;
  return lower.slice(start, end);
}

// Canonical matcher: every term found as a substring of the lowercased text,
// reported with its containing word run so a failure message shows WHY it
// fired. Occurrences whose containing run is safelisted are skipped; a later
// non-safelisted occurrence of the same term still fires. One hit per term
// per string keeps failure output readable. `terms` defaults to the register
// table; the provenance/atlas placard scans pass the INTERPRETATION_VERBS
// extension on top so the verbs ride the same semantics + safelist.
export function voiceRegisterHits(text, terms = BANNED_VOICE_REGISTER) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const term of terms) {
    let idx = lower.indexOf(term);
    while (idx !== -1) {
      const containing = containingRun(lower, idx, term.length);
      if (!SUBSTRING_SAFELIST.includes(containing)) {
        hits.push({ term, containing });
        break;
      }
      idx = lower.indexOf(term, idx + 1);
    }
  }
  return hits;
}

// Second-person address — reference/content prose never speaks TO the
// reader. `\byou\b` also fires inside the contractions ("you're", "you'll",
// "you've") because the apostrophe is a word boundary; the second leg closes
// yours/yourself/yourselves, which the old `\byour\b` shape provably missed
// (PR #101 MED-1).
export const SECOND_PERSON_RE = /\byou\b|\byour(s|self|selves)?\b/i;

// Diagnostic framing — the whole diagnos* family (diagnosis / diagnose /
// diagnosed / diagnoses / diagnosing / diagnostic / diagnostics), which the
// old (is|e|ed) alternation missed, plus plural/adjectival closure of
// disorder and syndrome.
export const DIAGNOSTIC_FRAMING_RE = /\bdiagnos\w*\b|\bdisorder(s|ed)?\b|\bsyndromes?\b/i;

// Slur subset. Fast pre-merge tripwire; the local audit and reviewer diff
// close the long tail. Word-bounded REGEX on purpose — see the semantics
// note up top ("elemental"/"fundamental" must not trip 'mental').
export const BANNED_PATTERNS = [
  /\bretard(ed|ation)?\b/i,
  /\bidiot\b/i,
  /\b(insane|crazy|mental)\b/i,
  /\b(faggot|tranny)\b/i,
  /\bn[i1]gg[ae]r/i,
];
