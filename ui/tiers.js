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
//   - shareRowRefs — per-row snapshot proxies for ui/share.js (§5.D).
//     The PNG keeps rendering OPEN coordinates only: a row with no open
//     cell reads as hidden; row text joins open cell values in the row's
//     pair grammar (↑ / ⇌ / space), excluding `—` unresolved cells from
//     pairs. ui/share.js is untouched this cycle — these proxies satisfy
//     its existing refs contract (closest / textContent / section.hidden).
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
// compartment gaps and in the shareRowRefs join.
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
  setCell('lifePath', coords.has('lifePath') ? 'value' : 'sealed', String(profile.lifePath));
  const numInner = coords.has('numerology') ? 'value' : 'sealed';
  setCell('nameNumber', numInner, String(profile.nameNumber));
  setCell('soulUrge', numInner, String(profile.soulUrge));
  const num2 = coords.has('numbers2') ? 'value' : 'sealed';
  setCell('personality', num2, String(profile.personality));
  setCell('birthday', num2, String(profile.birthday));
  setCell('maturity', num2, String(profile.maturity));
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

// ── share-row snapshot proxies (§5.D — ui/share.js untouched) ─────
// One proxy per coordinate row, in DOM order. share.js filters on the
// row's section.hidden and reads textContent + the section's
// .coord-title — these proxies answer all three from live cell state:
// hidden ⇔ no open cell (the PNG renders open coordinates only; the
// sealed structure stays off the share surface — logged deferral),
// text = open cell values joined in the row's pair grammar, `—`
// unresolved cells dropped from pairs (single-cell rows keep the `—`
// empty-field register, matching the on-screen card).
const SHARE_ROWS = [
  { cells: ['arcana'], join: ' ' },
  { cells: ['element'], join: ' ' },
  { cells: ['sun', 'rising'], join: ' ↑ ' },
  { cells: ['animal', 'innerAnimal'], join: ' ⇌ ' },
  { cells: ['lifePath', 'nameNumber', 'soulUrge'], join: ' ' },
  { cells: ['personality', 'birthday', 'maturity'], join: ' ' },
  { cells: ['dayPillar'], join: ' ' },
  { cells: ['hourPillar'], join: ' ' },
];

function cellOpen(cell) {
  return !!(cell && cell.root && cell.root.classList && !cell.root.classList.contains('sealed'));
}

function rowSnapshotText(row) {
  const open = row.cells.map(key => _cells && _cells[key]).filter(cellOpen);
  const vals = open
    .filter(cell => !cell.root.classList.contains('unres'))
    .map(cell => (cell.val ? String(cell.val.textContent).trim() : ''))
    .filter(Boolean);
  if (vals.length) return vals.join(row.join);
  return open.length ? '—' : '';
}

export function shareRowRefs() {
  return SHARE_ROWS.map(row => {
    const section = {
      get hidden() {
        return !row.cells.some(key => cellOpen(_cells && _cells[key]));
      },
      querySelector(selector) {
        const lead = _cells && _cells[row.cells[0]];
        const sectionEl = lead && lead.val && lead.val.closest
          ? lead.val.closest('.coord-section') : null;
        return sectionEl && sectionEl.querySelector
          ? sectionEl.querySelector(selector) : null;
      },
    };
    return {
      closest: () => section,
      get textContent() { return rowSnapshotText(row); },
    };
  });
}
