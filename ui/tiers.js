// 8ball / ui/tiers.js
// v0.6.0 tier-ladder render controller (DOCTRINE §1 / §1.D / §4.B v0.36 / §6).
//
// Owns:
//   - TIER_COORDS — the single exported render constant defining which
//     coordinates each tier surfaces (the §3 rollback flag: reverting the
//     free card to the pre-v0.6.0 seven-coordinate surface is a one-line
//     change to the `free` list plus a test update, not surgery)
//   - tier-resolution helpers (coordsForTier / renderTierFor)
//   - renderTierSections — fills every coordinate row from a profile and
//     gates row visibility to the render tier; rows above the tier are
//     hidden AND cleared so no t1+ coordinate value sits in the free DOM
//
// Does NOT own:
//   - tier persistence (eight_ball_tier_v1 lives in ui/payments.js)
//   - the tier rank/upgrade math (pure functions in core/payments.js)
//   - the catalog render, the t3 card-entry (written deck) block, and the
//     reads-chip — those stay in index.html's renderCard, which reads the
//     `cardEntry` flag this module returns
//
// Voice: clinical labels only — "day pillar", "hour pillar" (DOCTRINE §2;
// brief §3 locked-rung register). DI shape `initTiersUI(refs, hooks)` per
// DOCTRINE §6 v0.23, mirroring ui/payments.js / ui/profile.js / ui/share.js.

// ── TIER_COORDS (LOCKED ladder, brief §1 / DOCTRINE §1.D) ─────────
// Cumulative coordinate keys per tier. Keys name coordinates, not rows:
// `rising` joins the sun row, `innerAnimal` joins the animal row, and
// `cardEntry` is the t3 written-deck unlock consumed by index.html.
// The catalog numeral renders at every tier (it is the fourth free
// coordinate per §1.D; it lives in the card corner, not a row).
const FREE_COORDS = ['arcana', 'sun', 'animal'];
const T1_COORDS = [...FREE_COORDS, 'rising', 'element', 'innerAnimal', 'numerology'];
const T2_COORDS = [...T1_COORDS, 'numbers2', 'dayPillar'];
const T3_COORDS = [...T2_COORDS, 'hourPillar', 'cardEntry'];

export const TIER_COORDS = {
  free: FREE_COORDS,
  t1: T1_COORDS,
  t2: T2_COORDS,
  t3: T3_COORDS,
};

// Row keys in DOM order. A row is visible iff its key is in the tier's
// coordinate list; `rising` / `innerAnimal` / `cardEntry` modify rows
// rather than owning one.
const ROW_KEYS = [
  'arcana', 'element', 'sun', 'animal',
  'numerology', 'numbers2', 'dayPillar', 'hourPillar',
];

/** Coordinate keys for a tier, as a Set. Unknown tiers resolve to free. */
export function coordsForTier(tier) {
  return new Set(TIER_COORDS[tier] || TIER_COORDS.free);
}

/**
 * Resolve the tier a shake action renders at (brief §2): a paid read
 * renders coordinates up to the stored tier; free tries and cold-load
 * rehydration render the free-tier card.
 */
export function renderTierFor(action, storedTier) {
  if (action !== 'render-unlocked') return 'free';
  return TIER_COORDS[storedTier] ? storedTier : 'free';
}

/** `animal · stem-element` — the clinical pillar register (e.g. `horse · fire`). */
export function formatPillar(pillar) {
  return pillar ? `${pillar.animal} · ${pillar.stemElement}` : '—';
}

// ── DI injection (refs + hooks at boot) ───────────────────────────
// refs: { symbols: { arcana, element, sun, animal, numerology,
//                    numbers2, dayPillar, hourPillar },   // .coord-symbol nodes
//         sunTitle, animalTitle }                          // dynamic .coord-title nodes
// hooks: reserved for parity with the other ui/*.js modules; unused today.
// Each row's .coord-section root is resolved from its symbol node at init
// so index.html passes one ref per row, not two.
let _refs = null;
let _hooks = null;
let _rows = null;

export function initTiersUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  _rows = {};
  const symbols = (refs && refs.symbols) || {};
  for (const key of ROW_KEYS) {
    const symbol = symbols[key] || null;
    _rows[key] = {
      symbol,
      root: symbol && symbol.closest ? symbol.closest('.coord-section') : null,
    };
  }
}

function setRow(key, visible, text) {
  const row = _rows[key];
  if (!row) return;
  // Rows above the render tier are hidden AND cleared — the free card
  // carries no t1+ coordinate node content (tests/tiers.test.js).
  if (row.symbol) row.symbol.textContent = visible ? text : '—';
  if (row.root) row.root.hidden = !visible;
}

/**
 * Fill and gate every coordinate row for (profile, tier). Returns
 * { cardEntry } — true only at t3, where index.html renders the written
 * 144-card entry through the existing unlocked-render path (§1.D / §4.B).
 */
export function renderTierSections(profile, tier) {
  const coords = coordsForTier(tier);

  // Sun row: free renders the bare sun sign — rising joins at t1, and
  // only when computable (§1.A fallback shape preserved).
  const withRising = coords.has('rising') && !!profile.risingSign;
  if (_refs.sunTitle) _refs.sunTitle.textContent = withRising ? 'SUN ↑ RISING' : 'SUN';
  setRow('sun', coords.has('sun'), withRising
    ? `${profile.sunSign} ↑ ${profile.risingSign}`
    : profile.sunSign);

  // Animal row: free renders the public (year) animal alone — the
  // private (month) animal joins the equilibrium pair at t1.
  const withInner = coords.has('innerAnimal');
  if (_refs.animalTitle) _refs.animalTitle.textContent = withInner ? 'PUBLIC ⇌ PRIVATE' : 'PUBLIC';
  setRow('animal', coords.has('animal'), withInner
    ? `${profile.animal} ⇌ ${profile.innerAnimal}`
    : profile.animal);

  setRow('arcana', coords.has('arcana'), profile.birthCard.label);
  setRow('element', coords.has('element'), profile.chineseElement);
  // Numerology triplets are always space-separated (§1.B v0.23).
  setRow('numerology', coords.has('numerology'),
    [profile.lifePath, profile.nameNumber, profile.soulUrge].join(' '));
  setRow('numbers2', coords.has('numbers2'),
    [profile.personality, profile.birthday, profile.maturity].join(' '));
  setRow('dayPillar', coords.has('dayPillar'), formatPillar(profile.dayPillar));
  // Hour pillar resolves on HH:MM alone; absent birth time renders the
  // specimen-register empty field at t3 rather than hiding the row.
  setRow('hourPillar', coords.has('hourPillar'), formatPillar(profile.hourPillar));

  return { cardEntry: coords.has('cardEntry') };
}
