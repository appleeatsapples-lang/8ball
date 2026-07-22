// 8ball / ui/tiers.js
// v0.7.0 compartment-card render controller (DOCTRINE §1 / §1.D v0.37 / §6).
//
// Owns:
//   - TIER_COORDS — the single exported render constant defining which
//     coordinates each tier surfaces (the §3 rollback flag: reverting the
//     free card to the pre-v0.6.0 seven-coordinate surface is a one-line
//     change to the `free` list plus a test update, not surgery)
//   - coordsForTier — tier → coordinate-key set
//   - renderTierSections — fills every coordinate CELL from a profile at
//     the render tier. v0.7.0 compartment contract (§1.D v0.37): the card
//     renders the full sheet at every tier; rows are never hidden. A cell
//     at or below the tier carries its value; above it, a SEALED
//     compartment — empty value node (textContent === ''), seal layer
//     active. Entitled-but-uncomputable fields render the `—` empty field,
//     never a seal (F4: sealed ≠ unresolvable).
//   - newlyEntitledCells / primeUnsealBaseline — the unseal-trigger
//     decision. An upgrade render (entitled tier > previously rendered
//     tier) flags exactly the cells the new tier adds, in DOM order;
//     same-tier re-renders flag none (β idempotence — no replay on
//     shake-again / rehydrate). index.html primes the baseline with the
//     pre-paid-return tier at boot so a paid-return boot unseals once.
//   - shareRowRefs — per-row snapshot refs for ui/share.js (§5.D v0.39).
//     The PNG renders the FULL sheet per compartment: each row ref carries
//     its title + per-cell {state, value}. Open cells → value; sealed cells
//     → a `sealed` state with value forced to '' (share.js draws a hatch,
//     value never read); unresolved cells → the `—` empty field. A mixed
//     row surfaces its open value AND its sealed compartment(s). The sealed
//     VALUE never leaves the DOM (sealed cells hold textContent === '').
//
// Does NOT own:
//   - tier persistence (eight_ball_tier_v1 lives in ui/payments.js)
//   - the tier rank/upgrade math AND the density rule (core/payments.js;
//     ui/payments.js getRenderTier per remediation R1 — this module only
//     renders the tier it is handed)
//   - the catalog render and the t3 card-entry CONTENT fill — index.html's
//     renderCard reads the `cardEntry` flag this module returns; this
//     module only seals/unseals the entry block shell via refs.entry
//
// refs contract (v0.7.0 — widened to per-cell nodes):
//   refs: {
//     sunTitle, animalTitle,   // dynamic .coord-title nodes
//     entry,                   // #card-entry block root (seal target)
//     cells: { arcana, element, sun, rising, animal, innerAnimal,
//              lifePath, nameNumber, soulUrge,
//              personality, birthday, maturity,
//              dayPillar, hourPillar },   // .coord-val nodes, one per cell
//   }
// Each cell's bordered .coord-cell root is resolved from its value node
// at init via closest('.coord-cell'). hooks: reserved for parity with the
// other ui/*.js modules; unused today.
//
// Voice: clinical labels only (DOCTRINE §2). Paired-row title grammar
// (brief §3 LOCKED): the dot form names structure; the relation glyph
// marks a resolved entitled pair. A bare sun-only title never renders —
// the rising compartment is always present and always labeled.

import { LIFE_PATH_VALUES } from '../content/concordance.v2.js';

// ── TIER_COORDS (LOCKED ladder, DOCTRINE §1.D) ────────────────────
// Cumulative coordinate keys per tier. Keys name coordinates, not rows:
// `rising` joins the sun row, `innerAnimal` joins the animal row, and
// `cardEntry` is the t3 written-deck unlock consumed by index.html.
// The catalog numeral renders at every tier (it is a free coordinate
// per §1.D; it lives in the card corner, not a row).
// §1.D v0.38 (override #3, 2026-06-12): the numerology coordinate is
// split — `lifePath` (DOB-derived, preserves the free = DOB-only
// invariant) joins free; `numerology` narrows to the name-derived inner
// pair (expression/name number, soul urge) and stays t1. Free carries
// five coordinate VALUES; the t1 numerology line is a pair, not a triplet.
const FREE_COORDS = ['arcana', 'sun', 'animal', 'lifePath'];
const T1_COORDS = [...FREE_COORDS, 'rising', 'element', 'innerAnimal', 'numerology'];
const T2_COORDS = [...T1_COORDS, 'numbers2', 'dayPillar'];
const T3_COORDS = [...T2_COORDS, 'hourPillar', 'cardEntry'];

export const TIER_COORDS = {
  free: FREE_COORDS,
  t1: T1_COORDS,
  t2: T2_COORDS,
  t3: T3_COORDS,
};

// Cell keys in DOM order, each mapped to the §1.D coordinate key that
// entitles it. life path is its own (DOB-derived) coordinate at free;
// expression/name number and soul urge share the name-derived `numerology`
// coordinate at t1. The §1.B space-separated guarantee survives in the
// compartment gaps and in the per-cell share snapshot.
const CELL_KEYS = [
  'arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
  'lifePath', 'nameNumber', 'soulUrge',
  'personality', 'birthday', 'maturity',
  'dayPillar', 'hourPillar',
];
const CELL_COORD = {
  arcana: 'arcana', element: 'element', sun: 'sun', rising: 'rising',
  animal: 'animal', innerAnimal: 'innerAnimal',
  lifePath: 'lifePath', nameNumber: 'numerology', soulUrge: 'numerology',
  personality: 'numbers2', birthday: 'numbers2', maturity: 'numbers2',
  dayPillar: 'dayPillar', hourPillar: 'hourPillar',
};

/** Coordinate keys for a tier, as a Set. Unknown tiers resolve to free. */
export function coordsForTier(tier) {
  return new Set(TIER_COORDS[tier] || TIER_COORDS.free);
}

/**
 * Aggregate coordinate census for a tier (CLP cut 3 — density strip).
 * Derived PURELY from the tier constants (CELL_KEYS + CELL_COORD via
 * coordsForTier) — NEVER from a profile, so it carries no coordinate VALUE
 * and no PII. Counts the 14 sheet cells PLUS the catalog numeral, which is
 * a free coordinate per §1.D (always open, never a sealable cell) — so the
 * base (15) matches the product-wide "five coordinates" free framing
 * (prose_coordinate_count = TIER_COORDS.free.length + 1 = 5). The t3 written
 * entry is a block (cardEntry), not a coordinate, so it is excluded.
 * open = open cells + catalog · sealed = sealable cells still hidden · total = 15.
 * Returns { open, sealed, total }.
 */
export function tierDensitySummary(tier) {
  const coords = coordsForTier(tier);
  const cellsOpen = CELL_KEYS.filter(key => coords.has(CELL_COORD[key])).length;
  return {
    open: cellsOpen + 1,
    sealed: CELL_KEYS.length - cellsOpen,
    total: CELL_KEYS.length + 1,
  };
}

/** `animal · stem-element` — the clinical pillar register (e.g. `horse · fire`). */
export function formatPillar(pillar) {
  return pillar ? `${pillar.animal} · ${pillar.stemElement}` : '—';
}

// ── unseal-trigger decision (pure — brief §3 motion grammar) ──────
// Cells (plus the 'cardEntry' block) entitled at `tier` but not at
// `prevTier`, in DOM order. Empty for same/lower tiers — the animation
// can only fire on a genuine upgrade render.
export function newlyEntitledCells(prevTier, tier) {
  const prev = coordsForTier(prevTier);
  const next = coordsForTier(tier);
  const fresh = CELL_KEYS.filter(
    key => next.has(CELL_COORD[key]) && !prev.has(CELL_COORD[key])
  );
  if (next.has('cardEntry') && !prev.has('cardEntry')) fresh.push('cardEntry');
  return fresh;
}

// ── DI injection (refs + hooks at boot) ───────────────────────────
let _refs = null;
let _hooks = null;
let _cells = null;
let _entry = null;
let _lastRenderedTier = null;

export function initTiersUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  _entry = (refs && refs.entry) || null;
  _lastRenderedTier = null;
  _cells = {};
  const cells = (refs && refs.cells) || {};
  for (const key of CELL_KEYS) {
    const val = cells[key] || null;
    _cells[key] = {
      val,
      root: val && val.closest ? val.closest('.coord-cell') : null,
    };
  }
  attachProvenance();
  attachAtlas();
}

/**
 * Prime the unseal baseline with the tier the device was entitled to
 * BEFORE a possible paid return is applied (index.html boot, ahead of
 * handlePaidReturn). The first render then unseals exactly the delta on
 * a paid-return boot, and nothing on a plain rehydrate.
 */
export function primeUnsealBaseline(tier) {
  _lastRenderedTier = tier || 'free';
}

// setCell(key, state, text) with state ∈ value | sealed | unres.
// Sealed → value node textContent = '' (DOM purity: no paid value string
// exists anywhere in the DOM below its tier) and the seal layer active.
// Unres → `—`, no seal. The 'unsealing' beat class is always cleared
// here and re-applied only by an upgrade render.
function setCell(key, state, text) {
  const cell = _cells[key];
  if (!cell) return;
  if (cell.val) {
    cell.val.textContent = state === 'value' ? text : state === 'unres' ? '—' : '';
  }
  const root = cell.root;
  if (root && root.classList) {
    root.classList.toggle('sealed', state === 'sealed');
    root.classList.toggle('unres', state === 'unres');
    root.classList.remove('unsealing');
    if (root.style && root.style.removeProperty) root.style.removeProperty('--unseal-delay');
  }
}

const isNumerologyValue = value => LIFE_PATH_VALUES.includes(value);

// A numerology cell may display one of exactly nine values. Missing
// contributing letters resolve as an honest `—`; malformed/legacy values
// outside 1..9 are never rendered as a tenth number.
function setNumerologyCell(key, entitled, value) {
  const resolved = isNumerologyValue(value);
  setCell(key, entitled ? (resolved ? 'value' : 'unres') : 'sealed',
    resolved ? String(value) : '');
}

/**
 * Fill and seal every coordinate cell for (profile, tier). Returns
 * { cardEntry } — true only at t3, where index.html renders the written
 * 144-card entry through the existing unlocked-render path (§1.D / §4.B).
 */
export function renderTierSections(profile, tier) {
  const coords = coordsForTier(tier);

  // Sun row (paired-row title grammar): `SUN ↑ RISING` only when rising
  // is entitled AND computed; `SUN · RISING` while sealed (free) or
  // unresolved (`—` at t1+ without birth time/place).
  const risingEntitled = coords.has('rising');
  const withRising = risingEntitled && !!profile.risingSign;
  if (_refs.sunTitle) _refs.sunTitle.textContent = withRising ? 'SUN ↑ RISING' : 'SUN · RISING';
  setCell('sun', 'value', profile.sunSign);
  setCell('rising',
    risingEntitled ? (profile.risingSign ? 'value' : 'unres') : 'sealed',
    profile.risingSign);

  // Animal row: `PUBLIC · PRIVATE` while the private (month) animal is
  // sealed at free; `PUBLIC ⇌ PRIVATE` at t1+ (always computable).
  const withInner = coords.has('innerAnimal');
  if (_refs.animalTitle) _refs.animalTitle.textContent = withInner ? 'PUBLIC ⇌ PRIVATE' : 'PUBLIC · PRIVATE';
  setCell('animal', 'value', profile.animal);
  setCell('innerAnimal', withInner ? 'value' : 'sealed', profile.innerAnimal);

  setCell('arcana', 'value', profile.birthCard.label);
  setCell('element', coords.has('element') ? 'value' : 'sealed', profile.chineseElement);
  // Life path is free (DOB-derived); expression + soul urge stay t1
  // (name-derived) — §1.D v0.38 split.
  setNumerologyCell('lifePath', coords.has('lifePath'), profile.lifePath);
  const numInner = coords.has('numerology');
  setNumerologyCell('nameNumber', numInner, profile.nameNumber);
  setNumerologyCell('soulUrge', numInner, profile.soulUrge);
  const num2 = coords.has('numbers2');
  setNumerologyCell('personality', num2, profile.personality);
  setNumerologyCell('birthday', num2, profile.birthday);
  setNumerologyCell('maturity', num2, profile.maturity);
  setCell('dayPillar',
    coords.has('dayPillar') ? (profile.dayPillar ? 'value' : 'unres') : 'sealed',
    formatPillar(profile.dayPillar));
  // Hour pillar resolves on HH:MM alone; absent birth time renders the
  // specimen-register `—` empty field at t3 — F4, never a seal.
  setCell('hourPillar',
    coords.has('hourPillar') ? (profile.hourPillar ? 'value' : 'unres') : 'sealed',
    formatPillar(profile.hourPillar));

  // Written-entry block shell: sealed below t3 (the CONTENT fill/clear
  // stays in index.html renderCard, gated on the returned flag).
  const cardEntry = coords.has('cardEntry');
  if (_entry && _entry.classList) {
    _entry.classList.toggle('sealed', !cardEntry);
    _entry.classList.remove('unsealing');
    if (_entry.style && _entry.style.removeProperty) _entry.style.removeProperty('--unseal-delay');
  }

  // Unseal beat: fires only when this render's tier exceeds the last
  // rendered (or primed) tier — paid-return boot / upgrade. ~100ms DOM-
  // order stagger via --unseal-delay; the CSS keyframes own the settle.
  const newly = _lastRenderedTier === null ? [] : newlyEntitledCells(_lastRenderedTier, tier);
  let beat = 0;
  for (const key of newly) {
    const root = key === 'cardEntry' ? _entry : _cells[key] && _cells[key].root;
    if (!root || !root.classList) continue;
    root.classList.add('unsealing');
    if (root.style && root.style.setProperty) {
      root.style.setProperty('--unseal-delay', `${beat * 100}ms`);
    }
    beat += 1;
  }
  _lastRenderedTier = tier;

  return { cardEntry };
}

// ── share-row snapshot refs (§5.D v0.39 — full-sheet PNG) ─────────
// One entry per coordinate row, in DOM order. Each carries the row TITLE
// and its per-cell state (open | sealed | unres) + value, all read from
// live cell state so ui/share.js renders the FULL compartment sheet:
// open cells → value, sealed cells → hatch (the value is never read),
// unres cells → the `—` empty field. Per-cell (not per-row): a mixed row
// like SUN · RISING surfaces the open sun value AND the sealed rising
// compartment. The sealed VALUE never leaves the DOM (sealed cells hold
// textContent === '') and is forced to '' here as a second guarantee.
const SHARE_ROWS = [
  ['arcana'],
  ['element'],
  ['sun', 'rising'],
  ['animal', 'innerAnimal'],
  ['lifePath', 'nameNumber', 'soulUrge'],
  ['personality', 'birthday', 'maturity'],
  ['dayPillar'],
  ['hourPillar'],
];

function cellStateOf(cell) {
  const cl = cell && cell.root && cell.root.classList;
  if (!cl || cl.contains('sealed')) return 'sealed';
  if (cl.contains('unres')) return 'unres';
  return 'open';
}

function rowTitleOf(keys) {
  const lead = _cells && _cells[keys[0]];
  const sectionEl = lead && lead.val && lead.val.closest
    ? lead.val.closest('.coord-section') : null;
  const titleEl = sectionEl && sectionEl.querySelector
    ? sectionEl.querySelector('.coord-title') : null;
  return titleEl ? String(titleEl.textContent).trim() : '';
}

export function shareRowRefs() {
  return SHARE_ROWS.map(keys => ({
    get title() { return rowTitleOf(keys); },
    get cells() {
      return keys.map(key => {
        const cell = _cells && _cells[key];
        const state = cellStateOf(cell);
        return {
          state,
          // sealed → '' (the value never reaches the artifact); open/unres
          // → the live cell text ('—' for unres, per the on-card F4 field).
          value: state === 'sealed'
            ? ''
            : (cell && cell.val ? String(cell.val.textContent).trim() : ''),
        };
      });
    },
  }));
}

// ── provenance placards (Coordinate Legibility Pack, DOCTRINE §1.E) ───
// One derivation note per coordinate, surfaced per row in the row's cell
// order (mirroring the .coord-title grammar). Surface-only and TIER-
// INVARIANT: a coordinate's derivation never changes with seal state, so
// the note is written ONCE at init, never on render. Catalog-isolated —
// keyed off CELL_KEYS, never a profile field, so it adds NO coordinate
// VALUE to the free surface and carries no PII (it names the METHOD, not
// the value). Clinical derivation grammar only (DOCTRINE §2): the method,
// never interpretation. Rendered in .coord-prov, OUTSIDE .coord-title, so
// ui/share.js rowTitleOf never reads it — placards stay out of the §5.D
// PNG. Gated by the existing .card.labels-revealed toggle (no new key).
const PROV_NOTE = {
  arcana: 'digit-sum reduction',
  element: 'year stem',
  sun: 'tropical zodiac',
  rising: 'ascendant',
  animal: 'lunar new year',
  innerAnimal: 'solar term',
  lifePath: 'digit-sum reduction',
  nameNumber: 'letter-value sum',
  soulUrge: 'vowel sum',
  personality: 'consonant sum',
  birthday: 'day of birth',
  maturity: 'life-path + name',
  dayPillar: 'sexagenary cycle',
  hourPillar: 'five-rats hour',
};

export { PROV_NOTE };

/** Row provenance text: each cell's derivation note, joined in cell order. */
export function provText(keys) {
  return keys.map(k => PROV_NOTE[k] || '').join(' · ');
}

// Append one .coord-prov node per section, in cell order, reading the
// section element from each row's first cell. Idempotent (skips a section
// that already has a placard). Feature-detects a real DOM node via
// ownerDocument so it is a clean no-op under a non-DOM test mock or when a
// cell/section is absent.
function attachProvenance() {
  for (const keys of SHARE_ROWS) {
    const lead = _cells && _cells[keys[0]];
    const section = lead && lead.val && lead.val.closest
      ? lead.val.closest('.coord-section') : null;
    const doc = section && section.ownerDocument;
    if (!doc || typeof doc.createElement !== 'function'
      || typeof section.appendChild !== 'function') continue;
    if (section.querySelector && section.querySelector('.coord-prov')) continue;
    const el = doc.createElement('div');
    el.className = 'coord-prov';
    el.textContent = provText(keys);
    section.appendChild(el);
  }
}

// ── ATLAS legend (Coordinate Legibility Pack cut 2, under §1.D/§5.D) ──
// One system NAME per coordinate, surfaced per row in cell order — the
// gloss that decodes a compressed .coord-title (LIFE·NAME·SOUL → life-path
// · expression · soul-urge; PUBLIC ⇌ PRIVATE → year animal · month animal).
// Same rails as the §1.E provenance placard: surface-only · TIER-INVARIANT
// (a coordinate's system never changes with seal state → written ONCE at
// init, never on render) · catalog-isolated (keyed off CELL_KEYS via
// ATLAS_NOTE, never a profile value or the catalog driver; getCard
// untouched) · adds NO coordinate VALUE (free VALUE count unchanged) · no
// PII (names the system, never a name/DOB/value). Rendered in .coord-atlas,
// OUTSIDE .coord-title, so ui/share.js rowTitleOf never reads it — atlas
// stays out of the §5.D PNG. Gated by the existing .card.labels-revealed
// toggle (no new key). Only the rows whose title is abbreviated or omits
// the tradition carry a note: the personality/birthday/maturity row and the
// day/hour pillar rows already self-name in their .coord-title, so they are
// deliberately omitted (an atlas line there would only echo the title).
const ATLAS_NOTE = {
  arcana: 'tarot arcana',
  element: 'chinese five-element',
  sun: 'sun sign',
  rising: 'rising sign',
  animal: 'year animal',
  innerAnimal: 'month animal',
  lifePath: 'life-path',
  nameNumber: 'expression',
  soulUrge: 'soul-urge',
};

export { ATLAS_NOTE };

/** Row atlas text: each cell's system name, joined in cell order. Empty
 *  when no cell in the row carries an atlas note (the self-naming rows). */
export function atlasText(keys) {
  return keys.map(k => ATLAS_NOTE[k] || '').filter(Boolean).join(' · ');
}

// Insert one .coord-atlas node per section ABOVE its .coord-cells (so the
// legend reads directly under the title it decodes), in cell order. Skips a
// row with no atlas note (self-naming rows) and any section already carrying
// one (idempotent). Feature-detects a real DOM node via ownerDocument so it
// is a clean no-op under a non-DOM test mock or when a cell/section is absent.
function attachAtlas() {
  for (const keys of SHARE_ROWS) {
    const text = atlasText(keys);
    if (!text) continue;
    const lead = _cells && _cells[keys[0]];
    const section = lead && lead.val && lead.val.closest
      ? lead.val.closest('.coord-section') : null;
    const doc = section && section.ownerDocument;
    if (!doc || typeof doc.createElement !== 'function'
      || typeof section.insertBefore !== 'function') continue;
    if (section.querySelector && section.querySelector('.coord-atlas')) continue;
    const el = doc.createElement('div');
    el.className = 'coord-atlas';
    el.textContent = text;
    const cells = section.querySelector ? section.querySelector('.coord-cells') : null;
    section.insertBefore(el, cells || null);
  }
}
