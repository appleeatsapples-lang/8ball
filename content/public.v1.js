// content/public.v1.js
// Static tables for the public-tier computation (core/public.js).
//
// Data only — no derivation lives here. Every table is frozen and versioned
// per DOCTRINE §4 ("versioned, not edited"): a revision ships as public.v2.js
// rather than an in-place edit of this file.
//
// Register (DOCTRINE §2/§4): catalog. Third person, declarative, materialist.
// No second-person address, no guidance, no CTA, no predictive claim. These
// strings name categories of work and postures of role; they never tell a
// reader what to do. `tests/public.test.js` runs the canonical
// BANNED_VOICE_REGISTER / second-person / diagnostic-framing / slur scans
// over every string in this file.
//
// Reuse: the sheng (generating) and ke (controlling) cycles are NOT redefined
// here — they are imported from the immutable content/concordance.v1.js
// registry, the same reuse pattern content/concordance.v2.js follows. One
// wuxing table in the repo, not three.

import { ELEMENTS, ELEMENT_SHENG, ELEMENT_KE } from './concordance.v1.js';

export { ELEMENTS, ELEMENT_SHENG, ELEMENT_KE };

// Named tradition per computed field, in the §1.E provenance posture: what a
// value was read off, never what it is supposed to mean.
export const PUBLIC_SOURCES = Object.freeze({
  dayMaster: 'bazi · day-pillar heavenly stem',
  strength: 'wuxing seasonal states · 旺相休囚死',
  favorability: 'bazi · yongshen favourable-element convention',
  expression: 'pythagorean numerology · date digit sum, 11/22 retained',
  posture: 'major arcana · project birth-card reduction',
  families: 'wuxing · classical industry categories',
});

// ── Earthly-branch elements ─────────────────────────────────────────────────
// The twelve branches carry a fixed element. Keyed by the animal names the
// rest of the engine already uses (core/profile.js ANIMALS), so no second
// branch vocabulary enters the repo. The four earth branches (chen/xu/chou/wei
// — dragon/dog/ox/goat) are the season-closing months.
export const BRANCH_ELEMENTS = Object.freeze({
  tiger: 'wood',  rabbit: 'wood',
  snake: 'fire',  horse: 'fire',
  monkey: 'metal', rooster: 'metal',
  pig: 'water',   rat: 'water',
  dragon: 'earth', dog: 'earth', ox: 'earth', goat: 'earth',
});

// ── Seasonal states (旺相休囚死) ────────────────────────────────────────────
// The classical five-state read of a day master against the element of its
// month branch. Exactly one state holds for any (day-master, season) pair, so
// the resolution in core/public.js is total. `strength` is the two-value
// collapse the favourability table is keyed on.
export const SEASONAL_STATES = Object.freeze({
  wang: Object.freeze({
    key: 'wang', han: '旺', label: 'in season',
    relation: 'the season carries the day master · own element',
    strength: 'strong',
  }),
  xiang: Object.freeze({
    key: 'xiang', han: '相', label: 'supported',
    relation: 'the season generates the day master',
    strength: 'strong',
  }),
  xiu: Object.freeze({
    key: 'xiu', han: '休', label: 'retiring',
    relation: 'the day master generates the season',
    strength: 'weak',
  }),
  qiu: Object.freeze({
    key: 'qiu', han: '囚', label: 'held',
    relation: 'the day master controls the season',
    strength: 'weak',
  }),
  si: Object.freeze({
    key: 'si', han: '死', label: 'out of season',
    relation: 'the season controls the day master',
    strength: 'weak',
  }),
});

// ── Element favourability (10 entries: 5 elements × 2 strengths) ────────────
// Ranked, authored, not computed. The convention is the standard yongshen
// read: a day master with seasonal support wants what draws it out, spends it
// and bounds it (output · wealth · officer); a day master without support
// wants what feeds and joins it (resource · peer). `favorable[0]` selects the
// domain families; `unfavorable[0]` selects the anti-fit.
//
// The relation names are recorded per entry so the ranking can be checked
// against the sheng/ke cycles rather than taken on the table's word —
// tests/public.test.js re-derives all ten entries from ELEMENT_SHENG /
// ELEMENT_KE and fails if an entry drifts off the convention.
export const ELEMENT_FAVORABILITY = Object.freeze({
  wood_strong: Object.freeze({
    key: 'wood_strong', dayMaster: 'wood', strength: 'strong',
    favorable: Object.freeze(['fire', 'earth', 'metal']),
    unfavorable: Object.freeze(['water', 'wood']),
    body: 'a wood day master already carried by its season; the open side is what spends the growth, not what adds to it.',
  }),
  wood_weak: Object.freeze({
    key: 'wood_weak', dayMaster: 'wood', strength: 'weak',
    favorable: Object.freeze(['water', 'wood']),
    unfavorable: Object.freeze(['metal', 'fire', 'earth']),
    body: 'a wood day master outside its season; the open side is what feeds and joins it before anything draws on it.',
  }),
  fire_strong: Object.freeze({
    key: 'fire_strong', dayMaster: 'fire', strength: 'strong',
    favorable: Object.freeze(['earth', 'metal', 'water']),
    unfavorable: Object.freeze(['wood', 'fire']),
    body: 'a fire day master already carried by its season; the open side is what gives the heat somewhere to go.',
  }),
  fire_weak: Object.freeze({
    key: 'fire_weak', dayMaster: 'fire', strength: 'weak',
    favorable: Object.freeze(['wood', 'fire']),
    unfavorable: Object.freeze(['water', 'earth', 'metal']),
    body: 'a fire day master outside its season; the open side is fuel and company, not load.',
  }),
  earth_strong: Object.freeze({
    key: 'earth_strong', dayMaster: 'earth', strength: 'strong',
    favorable: Object.freeze(['metal', 'water', 'wood']),
    unfavorable: Object.freeze(['fire', 'earth']),
    body: 'an earth day master already carried by its season; the open side is what refines the mass and moves it.',
  }),
  earth_weak: Object.freeze({
    key: 'earth_weak', dayMaster: 'earth', strength: 'weak',
    favorable: Object.freeze(['fire', 'earth']),
    unfavorable: Object.freeze(['wood', 'metal', 'water']),
    body: 'an earth day master outside its season; the open side is warmth and bulk before any call on either.',
  }),
  metal_strong: Object.freeze({
    key: 'metal_strong', dayMaster: 'metal', strength: 'strong',
    favorable: Object.freeze(['water', 'wood', 'fire']),
    unfavorable: Object.freeze(['earth', 'metal']),
    body: 'a metal day master already carried by its season; the open side is what puts the edge to work.',
  }),
  metal_weak: Object.freeze({
    key: 'metal_weak', dayMaster: 'metal', strength: 'weak',
    favorable: Object.freeze(['earth', 'metal']),
    unfavorable: Object.freeze(['fire', 'water', 'wood']),
    body: 'a metal day master outside its season; the open side is the ground it forms in and the stock it joins.',
  }),
  water_strong: Object.freeze({
    key: 'water_strong', dayMaster: 'water', strength: 'strong',
    favorable: Object.freeze(['wood', 'fire', 'earth']),
    unfavorable: Object.freeze(['metal', 'water']),
    body: 'a water day master already carried by its season; the open side is what the volume runs into and against.',
  }),
  water_weak: Object.freeze({
    key: 'water_weak', dayMaster: 'water', strength: 'weak',
    favorable: Object.freeze(['metal', 'water']),
    unfavorable: Object.freeze(['earth', 'wood', 'fire']),
    body: 'a water day master outside its season; the open side is the source and the body of water it joins.',
  }),
});

// ── Domain families (5 elements × 3 families) ───────────────────────────────
// The classical wuxing industry categories, one family per character tag so
// the ranking below is a total order and the anti-fit selection is single-
// valued. `character` is the closed three-term vocabulary shared with
// EXPRESSION_MODES.priority:
//   origination  — the family makes the thing that was not there
//   transmission — the family carries it between parties
//   stewardship  — the family holds and runs it once it exists
export const FAMILY_CHARACTERS = Object.freeze(['origination', 'transmission', 'stewardship']);

export const DOMAIN_FAMILIES = Object.freeze({
  wood: Object.freeze([
    Object.freeze({
      key: 'growth', element: 'wood', label: 'growth', character: 'origination',
      body: 'cultivation and yield — work that develops a living stock across seasons.',
    }),
    Object.freeze({
      key: 'teaching', element: 'wood', label: 'teaching', character: 'transmission',
      body: 'instruction and transfer — work that moves a discipline into other hands.',
    }),
    Object.freeze({
      key: 'health', element: 'wood', label: 'health', character: 'stewardship',
      body: 'condition and recovery — work that keeps a body running rather than remaking it.',
    }),
  ]),
  fire: Object.freeze([
    Object.freeze({
      key: 'tech', element: 'fire', label: 'tech', character: 'origination',
      body: 'apparatus and invention — work that builds an instrument and puts it into use.',
    }),
    Object.freeze({
      key: 'media', element: 'fire', label: 'media', character: 'transmission',
      body: 'signal and circulation — work that carries a public message at volume.',
    }),
    Object.freeze({
      key: 'energy', element: 'fire', label: 'energy', character: 'stewardship',
      body: 'supply and load — work that keeps a current running under demand.',
    }),
  ]),
  earth: Object.freeze([
    Object.freeze({
      key: 'construction', element: 'earth', label: 'construction', character: 'origination',
      body: 'assembly on ground — work that raises a structure where none stood.',
    }),
    Object.freeze({
      key: 'advisory', element: 'earth', label: 'advisory', character: 'transmission',
      body: 'counsel on record — work that reads a situation and files a position on it.',
    }),
    Object.freeze({
      key: 'property', element: 'earth', label: 'property', character: 'stewardship',
      body: 'holding and tenancy — work that keeps ground in productive hands.',
    }),
  ]),
  metal: Object.freeze([
    Object.freeze({
      key: 'engineering', element: 'metal', label: 'engineering', character: 'origination',
      body: 'specification and tolerance — work that fixes a design to measured limits.',
    }),
    Object.freeze({
      key: 'law', element: 'metal', label: 'law', character: 'transmission',
      body: 'code and argument — work that carries a rule into a contested room.',
    }),
    Object.freeze({
      key: 'finance', element: 'metal', label: 'finance', character: 'stewardship',
      body: 'custody and allocation — work that holds a stock of value and places it.',
    }),
  ]),
  water: Object.freeze([
    Object.freeze({
      key: 'trade', element: 'water', label: 'trade', character: 'origination',
      body: 'exchange opened — work that makes a market between parties who had none.',
    }),
    Object.freeze({
      key: 'communication', element: 'water', label: 'communication', character: 'transmission',
      body: 'relay and routing — work that keeps a line open between distant points.',
    }),
    Object.freeze({
      key: 'logistics', element: 'water', label: 'logistics', character: 'stewardship',
      body: 'movement and schedule — work that keeps goods arriving in order.',
    }),
  ]),
});

// ── Expression modes (11 entries) ───────────────────────────────────────────
// Keyed by the date digit sum reduced with the 11 and 22 stops retained, so
// the domain is exactly {1..9, 11, 22}. `theme` for 1..9 is the same nine-term
// vocabulary content/meanings.v2.js already ships (pinned by a cross-check in
// tests/public.test.js); 11 and 22 extend it for the two retained stops.
//
// `priority` ranks the three family characters for this mode. It is a
// permutation of FAMILY_CHARACTERS: priority[0] takes rank 1 among the fit
// families, priority[2] selects the single anti-fit family from the
// unfavourable element.
//
// `method` is the second clause of the shape-of-role line. It describes how
// work of this mode is carried out, in the third person, as a category note.
export const EXPRESSION_MODES = Object.freeze({
  1: Object.freeze({
    number: 1, theme: 'initiative', register: 'the opening move',
    priority: Object.freeze(['origination', 'transmission', 'stewardship']),
    method: 'worked from a standing start, one line at a time',
  }),
  2: Object.freeze({
    number: 2, theme: 'cooperation', register: 'the second hand',
    priority: Object.freeze(['stewardship', 'transmission', 'origination']),
    method: 'worked in pairs, at the pace of the slower party',
  }),
  3: Object.freeze({
    number: 3, theme: 'expression', register: 'the open draft',
    priority: Object.freeze(['transmission', 'origination', 'stewardship']),
    method: 'worked in public drafts, revised where they can be seen',
  }),
  4: Object.freeze({
    number: 4, theme: 'structure', register: 'the fixed plan',
    priority: Object.freeze(['stewardship', 'origination', 'transmission']),
    method: 'worked to a plan, in fixed stages',
  }),
  5: Object.freeze({
    number: 5, theme: 'change', register: 'the short cycle',
    priority: Object.freeze(['transmission', 'origination', 'stewardship']),
    method: 'worked in short cycles, re-scoped as conditions move',
  }),
  6: Object.freeze({
    number: 6, theme: 'care', register: 'the standing duty',
    priority: Object.freeze(['stewardship', 'transmission', 'origination']),
    method: 'worked at the pace of the people it is for',
  }),
  7: Object.freeze({
    number: 7, theme: 'analysis', register: 'the closed study',
    priority: Object.freeze(['stewardship', 'origination', 'transmission']),
    method: 'worked from the record, slowly, to a stated confidence',
  }),
  8: Object.freeze({
    number: 8, theme: 'command', register: 'the wide operation',
    priority: Object.freeze(['origination', 'stewardship', 'transmission']),
    method: 'worked at scale, through delegated hands',
  }),
  9: Object.freeze({
    number: 9, theme: 'service', register: 'the standing obligation',
    priority: Object.freeze(['transmission', 'stewardship', 'origination']),
    method: 'worked to an obligation already accepted, on request',
  }),
  11: Object.freeze({
    number: 11, theme: 'projection', register: 'the long sight',
    priority: Object.freeze(['transmission', 'origination', 'stewardship']),
    method: 'worked toward a stated horizon, ahead of the evidence for it',
  }),
  22: Object.freeze({
    number: 22, theme: 'construction', register: 'the long build',
    priority: Object.freeze(['origination', 'stewardship', 'transmission']),
    method: 'worked as a long build, in load-bearing order',
  }),
});

// ── Role postures (22 entries) ──────────────────────────────────────────────
// Indexed by major-arcana number 0..21, the same ordering core/birthcard.js
// ships. `stance` is the first clause of the shape-of-role line: a role
// described as a way of being held, never as an identity claim about a person
// and never as an instruction.
export const ROLE_POSTURES = Object.freeze([
  Object.freeze({ number: 0,  arcana: 'the fool',           register: 'the open brief',      stance: 'a role held open before it is defined' }),
  Object.freeze({ number: 1,  arcana: 'the magician',       register: 'the operator',        stance: 'a role held as the working of instruments' }),
  Object.freeze({ number: 2,  arcana: 'the high priestess', register: 'the keeper of record', stance: 'a role held as custody of what is not yet stated' }),
  Object.freeze({ number: 3,  arcana: 'the empress',        register: 'the cultivator',      stance: 'a role held as the tending of a growing thing' }),
  Object.freeze({ number: 4,  arcana: 'the emperor',        register: 'the administrator',   stance: 'a role held as the setting of order' }),
  Object.freeze({ number: 5,  arcana: 'the hierophant',     register: 'the transmitter',     stance: 'a role held as the passing on of an established practice' }),
  Object.freeze({ number: 6,  arcana: 'the lovers',         register: 'the pairing',         stance: 'a role held as a choice between two commitments' }),
  Object.freeze({ number: 7,  arcana: 'the chariot',        register: 'the driver',          stance: 'a role held as forward motion under control' }),
  Object.freeze({ number: 8,  arcana: 'strength',           register: 'the handler',         stance: 'a role held as steady pressure on strong material' }),
  Object.freeze({ number: 9,  arcana: 'the hermit',         register: 'the examiner',        stance: 'a role held apart, at working distance' }),
  Object.freeze({ number: 10, arcana: 'wheel of fortune',   register: 'the cycle reader',    stance: 'a role held across the turns of a cycle' }),
  Object.freeze({ number: 11, arcana: 'justice',            register: 'the assessor',        stance: 'a role held as the weighing of a case' }),
  Object.freeze({ number: 12, arcana: 'the hanged man',     register: 'the suspended view',  stance: 'a role held in deliberate suspension' }),
  Object.freeze({ number: 13, arcana: 'death',              register: 'the closer',          stance: 'a role held at the ending of a form' }),
  Object.freeze({ number: 14, arcana: 'temperance',         register: 'the blender',         stance: 'a role held as proportion between two supplies' }),
  Object.freeze({ number: 15, arcana: 'the devil',          register: 'the bound term',      stance: 'a role held under a binding arrangement' }),
  Object.freeze({ number: 16, arcana: 'the tower',          register: 'the demolisher',      stance: 'a role held at the point a structure gives way' }),
  Object.freeze({ number: 17, arcana: 'the star',           register: 'the surveyor',        stance: 'a role held on a distant fixed reference' }),
  Object.freeze({ number: 18, arcana: 'the moon',           register: 'the night watch',     stance: 'a role held in low light, on partial information' }),
  Object.freeze({ number: 19, arcana: 'the sun',            register: 'the exhibit',         stance: 'a role held in full view' }),
  Object.freeze({ number: 20, arcana: 'judgement',          register: 'the auditor',         stance: 'a role held as the calling of a reckoning' }),
  Object.freeze({ number: 21, arcana: 'the world',          register: 'the completion',      stance: 'a role held at the closing of a full circuit' }),
]);
