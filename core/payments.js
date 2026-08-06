// core/payments.js
// Pure state machine for the paid surface (DOCTRINE §2 / §4.B / §5.B / §5.C;
// tier ladder §1.D v0.36; ownership model §1.D / §2 / §4.B v0.55).
//
// No DOM. No localStorage. No timers. No side effects. Inputs in, outputs out.
// The state machine is the contract for the ownership model: renders are
// unlimited at every tier (free included), a purchase is the permanent,
// monotonic tier write — no credits, no caps, no counters. UI wiring in
// index.html reads from localStorage, calls these functions, and writes
// results back. Unit tests at tests/payments_state.test.js,
// tests/tiers.test.js, and tests/facet_rotation.test.js.

// Legacy credit values persisted by pre-v0.55 code can be hand-edited or
// corrupted. The one surviving read (the §1.D R2 grandfather inside
// resolveRenderTier) only operates on whole, non-negative values; invalid,
// negative, or non-finite values read as 0.
export function normalizeCounter(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

// ── t3 written-entry rotation (v0.7.1, DOCTRINE §1.H) ─────────────
// The shipped v1 deck stays immutable. Its three note slots are selected
// positionally for the explicit t3 `flip again` interaction:
//   index 0 → low, index 1 → mid, index 2 → high.
// The index names position only; it does not relabel the v1 copy as newly
// authored lateral content. Storage I/O remains in ui/payments.js.

export const FACET_COUNT = 3;

// Facet anchor groups, in lockstep with resolveBracket's brackets in
// core/engine.js (§1.H v0.62). The three master values anchor at the THIRD
// position for the same reason they resolve to the `high` bracket — the two
// groupings are the same partition of the calc-v4 terminal domain and must
// not be allowed to disagree (tests/facet_rotation.test.js pins that).
const FIRST_FACET_LIFE_PATHS = new Set([1, 2, 3]);
const SECOND_FACET_LIFE_PATHS = new Set([4, 5, 6]);
const THIRD_FACET_LIFE_PATHS = new Set([7, 8, 9, 11, 22, 33]);

export function anchorFacetIndex(lifePath) {
  if (FIRST_FACET_LIFE_PATHS.has(lifePath)) return 0;
  if (SECOND_FACET_LIFE_PATHS.has(lifePath)) return 1;
  if (THIRD_FACET_LIFE_PATHS.has(lifePath)) return 2;
  throw new Error(`Unknown life path value: ${lifePath}`);
}

export function normalizeFacetIndex(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < FACET_COUNT ? n : null;
}

export function nextFacetIndex(current) {
  const clean = normalizeFacetIndex(current);
  if (clean === null) throw new Error(`Unknown facet index: ${current}`);
  return (clean + 1) % FACET_COUNT;
}

/**
 * One explicit t3 flip. This is deliberately separate from nextShakeState:
 * submitting the same form pair remains idempotent; only the result-screen
 * control advances written content. Ownership model (§1.H v0.55): t3 is
 * owned, so the flip always advances — nothing is spent, nothing gates it.
 */
export function nextFacetState({ facetIndex }) {
  const cleanFacet = normalizeFacetIndex(facetIndex);
  if (cleanFacet === null) throw new Error(`Unknown facet index: ${facetIndex}`);
  return {
    action: 'render-facet',
    facetIndex: nextFacetIndex(cleanFacet),
  };
}

// ── tier ladder (v0.6.0, DOCTRINE §1.D / §4.B v0.36) ──────────────
// Paid rungs reveal progressively more of the coordinate sheet. The ladder
// is ordered; the stored tier is the HIGHEST rung purchased and is
// monotonic — applyPaidReturn never downgrades it.
//
// ── the gap at t4 is deliberate (§1.D v0.61) ──────────────────────
// t1/t2/t3 are the three coordinate-density rungs of the SINGLE reading.
// `t5` is the dyad rung: two complete sheets plus the relation layer.
// The ladder therefore reads t1 · t2 · t3 · t5 with `t4` skipped, and the
// skip is load-bearing rather than cosmetic. `t4` was live for part of
// 2026-07-29 as the public rung (§1.D v0.58), was retired the same day
// (v0.60), and its unsigned `?paid=t4` return means devices can hold a
// stored 't4' forever. Reusing the token for the dyad would put the same
// key in TIER_ORDER and in RETIRED_TIERS below — normalizeTier would
// rewrite every paying dyad device to 't3' before isTier ever saw it, so
// dyad buyers would silently collapse to the rung beneath them. `t5` was
// never live as an unsigned return, so it is clean.
//
// RETIREMENT_COLLISIONS is the derived, exported form of that argument:
// it is computed from the two constants rather than restated, so the
// invariant cannot be pinned in a test while the source drifts.

// §1.D v0.68 — the comparative folds into t3. `t5` is RETIRED (below), so
// the ladder is three rungs again and the $3 rung carries the dyad.
export const TIER_ORDER = ['t1', 't2', 't3'];

// ── retired rungs (§1.D v0.60) ────────────────────────────────────
// `t4` existed on `main` for part of 2026-07-29 (§1.D v0.58) and was folded
// into t3 rather than sold. It was never buyable — its product URL never
// held a value — but the `?paid=t4` return was live and unsigned (§5.C), so
// devices CAN hold a stored 't4'.
//
// Dropping an unrecognised stored tier to free would DOWNGRADE those
// devices, and the sharp case is worse than it first looks: the stored tier
// is the only record of a purchase, so a real t3 BUYER who tried the t4 URL
// once would lose the rung they paid for. §1.D v0.55 says a purchase is
// permanent; that has to survive the retirement of a rung above it.
//
// So a retired rung resolves to the rung that absorbed it, and the caller
// persists the rewrite on first detection — the same shape as the R2
// legacy-credit grandfather below, and pinned by tests/public_surface.test.js.
//
// `t5` joins it at §1.D v0.68. The dyad rung was never buyable either —
// `T5_PRODUCT_URL` shipped empty for its whole life, so no device can hold
// a purchased 't5' — and unlike t4 its `?paid=t5` return granted a rung
// that now maps onto a tier which INCLUDES the comparative. So this
// retirement cannot downgrade anyone even in principle: t3 is a superset
// of what t5 conferred, not a reduction of it.
export const RETIRED_TIERS = Object.freeze({ t4: 't3', t5: 't3' });

/**
 * Every way the retirement table could contradict the ladder, derived from
 * both constants at module load. Two failure modes, and the §1.D v0.61 dyad
 * append is exactly the change that could have introduced the first one:
 *
 *   - `live`   — a retired token is ALSO a current rung. normalizeTier would
 *                rewrite it before isTier saw it, so buyers of that rung
 *                collapse to whatever absorbed it. This is why the dyad is
 *                `t5` and not `t4`.
 *   - `orphan` — a retired token maps onto something that is not a rung, so
 *                the migration lands nowhere and the device reads as free.
 *
 * Empty is the only correct value. Exported rather than asserted at import
 * time on purpose: a data error here is caught by CI (tests/tiers.test.js and
 * tests/dyad_surface.test.js both pin it empty), and throwing on module load
 * would white-screen the product for a fault the gate already blocks.
 */
export const RETIREMENT_COLLISIONS = Object.freeze(
  Object.entries(RETIRED_TIERS).flatMap(([retired, successor]) => {
    const problems = [];
    if (TIER_ORDER.includes(retired)) problems.push({ retired, successor, kind: 'live' });
    if (!TIER_ORDER.includes(successor)) problems.push({ retired, successor, kind: 'orphan' });
    return problems.map(Object.freeze);
  })
);

/**
 * Map a stored tier through the retirement table. Unknown and current
 * values pass through untouched, so this is safe to apply anywhere a
 * stored tier is read.
 */
export function normalizeTier(tier) {
  return Object.prototype.hasOwnProperty.call(RETIRED_TIERS, tier)
    ? RETIRED_TIERS[tier]
    : tier;
}

/**
 * True iff the value is a known paid tier. Unknown ?paid= values are
 * ignored by the UI handler (replay-safe branch preserved).
 */
export function isTier(value) {
  return TIER_ORDER.includes(value);
}

/**
 * Ladder POSITION of a tier: t1 → 1, t2 → 2, t3 → 3.
 *
 * Anything not in TIER_ORDER ranks 0 (the free tier) — and that
 * deliberately includes the RETIRED tokens `t4` and `t5`. Run a stored
 * tier through normalizeTier BEFORE ranking it: `maxTier('t5','t1')`
 * returns `'t1'`, because an un-normalized 't5' ranks below every rung.
 * `applyPaidReturn` normalizes first, which is why the runtime is
 * correct; a caller that ranks a stored tier directly would downgrade a
 * device holding the unsigned `?paid=t5` return.
 */
export function tierRank(tier) {
  return TIER_ORDER.indexOf(tier) + 1;
}

/**
 * The higher-ranked of two tiers. Used by applyPaidReturn to keep the
 * stored tier monotonic: tier = max(current, purchased) by ladder order.
 * A non-tier argument ranks 0, so maxTier(null, 't1') === 't1' and
 * maxTier('t3', 't1') === 't3'.
 */
export function maxTier(a, b) {
  return tierRank(b) > tierRank(a) ? b : a;
}

/**
 * The single density rule (v0.6.0 remediation R1, PR #36 Codex inv. 5+11;
 * ownership amendment §1.D v0.55): render density = f(stored tier, legacy
 * credit signal) at render time — never a function of boot circumstance or
 * shake action.
 *
 *   - a stored tier governs every render of any card on the device, after
 *     the retirement table maps any withdrawn rung onto its successor;
 *   - legacy credits held with NO stored tier are the pre-v0.6.0 purchase
 *     shape: that product sold the written-entry unlock, which now lives at
 *     t3, so the device is grandfathered to t3 (R2 — deterministic, total,
 *     never downgrades; the caller persists it on first detection, after
 *     which the credits are ignored forever). This stays 't3' and must NOT
 *     follow the top of the ladder: those buyers paid for the written entry,
 *     not for a public rung that did not exist when they bought. Pinned by
 *     tests/payments_state.test.js so a later rung cannot silently widen it —
 *     the §1.D v0.61 dyad append is the second rung to test that pin, and it
 *     holds for the same reason: a legacy buyer paid for the written entry,
 *     never for a second person's sheet;
 *   - neither → the free card.
 *
 * Nothing governs how many readings — quantity is unlimited at every tier
 * (§1.D / §4.B v0.55). Density is the only thing money buys.
 *
 * @param {{tier?: string | null, credits?: number}} state
 * @returns {string} 'free' | 't1' | 't2' | 't3'
 */
export function resolveRenderTier({ tier, credits }) {
  const cleanCredits = normalizeCounter(credits);
  const stored = normalizeTier(tier);
  if (isTier(stored)) return stored;
  if (cleanCredits > 0) return 't3';
  return 'free';
}

/**
 * Compare the typed input against the last successfully rendered profile.
 * Try-counting cares only about (name, dob); rising-sign optional fields
 * don't make a profile a "new pair" (DOCTRINE §4.B / brief §15 hook 9).
 *
 * @param {{name: string, dob: string}} input
 * @param {{name: string, dob: string} | null} stored
 * @returns {boolean}
 */
export function isNewPair(input, stored) {
  if (!stored) return true;
  return input.name !== stored.name || input.dob !== stored.dob;
}

/**
 * Compute the next state for a shake against (input, stored).
 * Pure: returns an action; the caller renders at the device's entitled
 * tier (getRenderTier) either way.
 *
 * Transitions (ownership model, §1.D / §4.B v0.55):
 *   - same pair  -> 'render-idempotent'  (β idempotence — facet position
 *                                         and stored profile survive)
 *   - new pair   -> 'render'             (always; no counter, no cap,
 *                                         no paywall — the free surface
 *                                         is open and paid tiers are owned)
 *
 * @param {{isNew: boolean}} state
 * @returns {{action: string}}
 */
export function nextShakeState({ isNew }) {
  return { action: isNew ? 'render' : 'render-idempotent' };
}

/**
 * Compute the post-return state when the page loads with a `?paid=` rung.
 * The accepted set is whatever `isTier` accepts — deliberately not
 * enumerated here, because an enumeration in a comment is what went stale
 * when the ladder last moved.
 *
 * Ownership model (§1.D / §2 / §5.B v0.55): a purchase is permanent and
 * unlimited. The only state a paid return writes is the monotonic tier —
 * max(current, purchased) by ladder order, never downgrades. A t1 owner
 * later buying t3 upgrades; a t3 owner replaying a t1 URL keeps t3. No
 * credits are granted; nothing is consumed on later renders.
 *
 * If a pending profile is present (the Path-B lock-tap wrote it before
 * redirect), it is handed back for render at the new tier.
 *
 * The 'no-pending' branch is reserved for replay-attack (manual /?paid=tN
 * URL entry without payment) and browser-closed-mid-checkout edge cases.
 * Per DOCTRINE §5.C this is acceptable: the redirect is unsigned, the
 * arcade-toy model is trust-based.
 *
 * @param {{pendingProfile: object | null,
 *          tier?: string | null, purchasedTier?: string | null}} state
 * @returns {{action: string, tier: string | null, profile?: object}}
 */
export function applyPaidReturn({ pendingProfile, tier, purchasedTier }) {
  // The stored side goes through the retirement table first: a device
  // holding a withdrawn rung must not be downgraded by buying a lower one.
  const newTier = maxTier(normalizeTier(tier), purchasedTier);
  if (!pendingProfile) {
    return { action: 'no-pending', tier: newTier };
  }
  return {
    action: 'render-unlocked',
    profile: pendingProfile,
    tier: newTier,
  };
}
