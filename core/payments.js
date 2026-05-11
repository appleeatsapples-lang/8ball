// core/payments.js
// Pure state machine for v0.3.0 paid surface (DOCTRINE §2 / §4.B / §5.B / §5.C v0.22).
//
// No DOM. No localStorage. No timers. No side effects. Inputs in, outputs out.
// The state machine is the contract for credit flow + cap enforcement + paid-return
// consumption. UI wiring in index.html reads from localStorage, calls these
// functions, and writes results back. Unit tests at tests/payments_state.test.js.

export const FREE_TRIES_CAP = 3;
export const CREDITS_PER_PURCHASE = 3;

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
 * Compute the post-return state when the page loads with ?paid=t1.
 *
 * Always grants +CREDITS_PER_PURCHASE (=3). If a pending profile is present
 * (the Path-A / Path-B paywall trigger wrote it before redirect), consume one
 * credit to render that profile unlocked; otherwise the credits sit waiting
 * for the user's next shake.
 *
 * The 'no-pending' branch is reserved for replay-attack (manual /?paid=t1
 * URL entry without payment) and browser-closed-mid-checkout edge cases.
 * Per DOCTRINE §5.C this is acceptable: the redirect is unsigned, the
 * arcade-toy model is trust-based.
 *
 * @param {{credits: number, triesUsed: number, pendingProfile: object | null}} state
 * @returns {{action: string, credits: number, triesUsed: number, profile?: object}}
 */
export function applyPaidReturn({ credits, triesUsed, pendingProfile }) {
  const newCredits = credits + CREDITS_PER_PURCHASE;
  if (!pendingProfile) {
    return {
      action: 'no-pending',
      credits: newCredits,
      triesUsed,
    };
  }
  return {
    action: 'render-unlocked',
    credits: newCredits - 1,
    triesUsed: triesUsed + 1,
    profile: pendingProfile,
  };
}
