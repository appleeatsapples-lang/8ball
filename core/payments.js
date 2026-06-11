// core/payments.js
// Pure state machine for the paid surface (DOCTRINE §2 / §4.B / §5.B / §5.C
// v0.22; tier ladder §1.D / §4.B v0.36, v0.6.0).
//
// No DOM. No localStorage. No timers. No side effects. Inputs in, outputs out.
// The state machine is the contract for credit flow + cap enforcement + paid-return
// consumption + tier-ladder rank/upgrade. UI wiring in index.html reads from
// localStorage, calls these functions, and writes results back. Unit tests at
// tests/payments_state.test.js and tests/tiers.test.js.

export const FREE_TRIES_CAP = 3;
export const CREDITS_PER_PURCHASE = 3;

// ── tier ladder (v0.6.0, DOCTRINE §1.D / §4.B v0.36) ──────────────
// Three paid rungs reveal progressively more of the coordinate sheet.
// The ladder is ordered; the stored tier is the HIGHEST rung purchased
// and is monotonic — applyPaidReturn never downgrades it.

export const TIER_ORDER = ['t1', 't2', 't3'];

/**
 * True iff the value is a known paid tier. Unknown ?paid= values are
 * ignored by the UI handler (replay-safe branch preserved).
 */
export function isTier(value) {
  return TIER_ORDER.includes(value);
}

/**
 * Ladder position of a tier: t1 → 1, t2 → 2, t3 → 3. Anything that is
 * not a known tier (null / undefined / garbage) ranks 0 — the free tier.
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
 * The single density rule (v0.6.0 remediation R1, PR #36 Codex inv. 5+11):
 * render density = f(stored tier, credit state) at render time — never a
 * function of boot circumstance or shake action.
 *
 *   - a stored tier governs every render of any card on the device;
 *   - credits held with NO stored tier are the pre-v0.6.0 purchase shape:
 *     that product sold the written-entry unlock, which now lives at t3,
 *     so the device is grandfathered to t3 (R2 — deterministic, total,
 *     never downgrades; the caller persists it on first detection);
 *   - neither → the free card.
 *
 * Credits/tries govern how many readings, never density (§1.D v0.36).
 *
 * @param {{tier?: string | null, credits?: number}} state
 * @returns {string} 'free' | 't1' | 't2' | 't3'
 */
export function resolveRenderTier({ tier, credits }) {
  if (isTier(tier)) return tier;
  if (credits > 0) return 't3';
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
 * Compute the next state for a shake against (input, stored, counters).
 * Pure: returns an action and the next counters; caller writes them back.
 *
 * Transitions:
 *   - same pair                                  -> 'render-idempotent', no mutation
 *   - new pair AND credits > 0                   -> 'render-unlocked',  credits-1, tries+1
 *   - new pair AND credits=0 AND tries < cap     -> 'render-locked',    tries+1
 *   - new pair AND credits=0 AND tries >= cap    -> 'show-paywall',     no mutation
 *
 * Note: credits > 0 takes precedence over the cap (paid credits override the
 * three-free-tries gate; that's the whole point of paying).
 *
 * @param {{triesUsed: number, credits: number, isNew: boolean}} state
 * @returns {{action: string, triesUsed: number, credits: number}}
 */
export function nextShakeState({ triesUsed, credits, isNew }) {
  if (!isNew) {
    return { action: 'render-idempotent', triesUsed, credits };
  }
  if (credits > 0) {
    return {
      action: 'render-unlocked',
      triesUsed: triesUsed + 1,
      credits: credits - 1,
    };
  }
  if (triesUsed < FREE_TRIES_CAP) {
    return {
      action: 'render-locked',
      triesUsed: triesUsed + 1,
      credits: 0,
    };
  }
  return { action: 'show-paywall', triesUsed, credits: 0 };
}

/**
 * Compute the post-return state when the page loads with ?paid=t1|t2|t3.
 *
 * Always grants +CREDITS_PER_PURCHASE (=3) — every rung buys three reads;
 * the rungs price coordinate density, not try count (DOCTRINE §2 v0.36).
 * If a pending profile is present (the Path-A / Path-B paywall trigger
 * wrote it before redirect), consume one credit to render that profile at
 * the new tier; otherwise the credits sit waiting for the user's next shake.
 *
 * v0.6.0 tier extension: `tier` is the currently stored tier (null when
 * free), `purchasedTier` the rung the user just bought. The returned tier
 * is max(current, purchased) by ladder order — monotonic, never
 * downgrades. A t1 owner later buying t3 upgrades; a t3 owner replaying a
 * t1 URL keeps t3. Both fields are optional so the pre-tier call shape
 * stays byte-compatible (tries/credits semantics unchanged).
 *
 * The 'no-pending' branch is reserved for replay-attack (manual /?paid=tN
 * URL entry without payment) and browser-closed-mid-checkout edge cases.
 * Per DOCTRINE §5.C this is acceptable: the redirect is unsigned, the
 * arcade-toy model is trust-based.
 *
 * @param {{credits: number, triesUsed: number, pendingProfile: object | null,
 *          tier?: string | null, purchasedTier?: string | null}} state
 * @returns {{action: string, credits: number, triesUsed: number,
 *            tier?: string | null, profile?: object}}
 */
export function applyPaidReturn({ credits, triesUsed, pendingProfile, tier, purchasedTier }) {
  const newTier = maxTier(tier, purchasedTier);
  const newCredits = credits + CREDITS_PER_PURCHASE;
  if (!pendingProfile) {
    return {
      action: 'no-pending',
      credits: newCredits,
      triesUsed,
      tier: newTier,
    };
  }
  return {
    action: 'render-unlocked',
    credits: newCredits - 1,
    triesUsed: triesUsed + 1,
    profile: pendingProfile,
    tier: newTier,
  };
}
