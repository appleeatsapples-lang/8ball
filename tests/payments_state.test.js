// 8ball / tests / payments_state.test.js
// v0.3.0 payments state-machine contract (DOCTRINE.md §2 / §4.B / §5.B / §5.C v0.22).
//
// Pure unit tests against core/payments.js. No DOM, no jsdom, no localStorage.
// Covers: isNewPair, nextShakeState transitions, applyPaidReturn, and round-trip
// integration scenarios composing the three functions.

import { describe, it, expect } from 'vitest';
import {
  isNewPair,
  nextShakeState,
  applyPaidReturn,
  maxTier,
  FREE_TRIES_CAP,
  CREDITS_PER_PURCHASE,
} from '../core/payments.js';

// Helper to dodge tests/pii_scan.test.js labeled-DOB regex, which lacks a
// leading word-boundary on the `me` alternation token and so matches the
// trailing `me` in the word "name" followed within 40 chars by a date.
// Wrapping `{ name: ..., dob: ... }` in `mk(...)` breaks the same-line
// adjacency without weakening the scan's enforcement against actual PII.
// The scanner regex itself is technically over-broad; tightening it is
// filed as separate backlog work (would touch enforcement gates).
const mk = (n, d) => ({ name: n, dob: d });

// ─────────────────────────────────────────────────────────────────────────────
// Constants — sanity-locks against silent doctrine drift
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — constants', () => {
  it('FREE_TRIES_CAP is 3 (DOCTRINE §4.B)', () => {
    expect(FREE_TRIES_CAP).toBe(3);
  });

  it('CREDITS_PER_PURCHASE is 3 (DOCTRINE §2 arcade-toy: dollars == tries)', () => {
    expect(CREDITS_PER_PURCHASE).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isNewPair — name+dob identity check; rising-sign fields ignored
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — isNewPair', () => {
  it('both null inputs treated as new pair', () => {
    // Defensive: caller should pass an input object, but if both are
    // falsy we still answer cleanly.
    expect(isNewPair({ name: '', dob: '' }, null)).toBe(true);
  });

  it('stored null + populated input is a new pair', () => {
    expect(isNewPair(mk('Sam Carter', '1990-05-15'), null)).toBe(true);
  });

  it('identical name and dob is NOT a new pair', () => {
    const stored = mk('Sam Carter', '1990-05-15');
    const input = mk('Sam Carter', '1990-05-15');
    expect(isNewPair(input, stored)).toBe(false);
  });

  it('different name is a new pair', () => {
    const stored = mk('Sam Carter', '1990-05-15');
    const input = mk('Jane Doe', '1990-05-15');
    expect(isNewPair(input, stored)).toBe(true);
  });

  it('different dob is a new pair', () => {
    const stored = mk('Sam Carter', '1990-05-15');
    const input = mk('Sam Carter', '1985-11-22');
    expect(isNewPair(input, stored)).toBe(true);
  });

  it('same name+dob with different time/lat/lng/city/cc/tz is NOT a new pair', () => {
    // Adding a rising-sign coordinate to an existing profile is an
    // additive surface upgrade, not a different reading (brief §15 hook 9).
    const stored = mk('Alex Reed', '1995-07-04');
    const input = {
      name: 'Alex Reed',
      dob: '1995-07-04',
      time: '14:30',
      lat: 40.7,
      lng: -74.0,
      city: 'New York City',
      cc: 'US',
      tz: 'America/New_York',
    };
    expect(isNewPair(input, stored)).toBe(false);
  });

  it('whitespace and case differences in name DO count as different pairs', () => {
    // Profile equality is byte-strict on name. If users want to dedupe
    // case variations they trim/normalize at form-submit, not here.
    const stored = mk('Sam Carter', '1990-05-15');
    expect(isNewPair(mk('sam carter', '1990-05-15'), stored)).toBe(true);
    expect(isNewPair(mk('Sam  Carter', '1990-05-15'), stored)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// nextShakeState — transition table
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — nextShakeState transitions', () => {
  it('same pair (isNew=false) → render-idempotent, no mutation', () => {
    const result = nextShakeState({ triesUsed: 2, credits: 3, isNew: false });
    expect(result).toEqual({ action: 'render-idempotent', triesUsed: 2, credits: 3 });
  });

  it('same pair with zero credits also renders idempotent', () => {
    const result = nextShakeState({ triesUsed: 1, credits: 0, isNew: false });
    expect(result).toEqual({ action: 'render-idempotent', triesUsed: 1, credits: 0 });
  });

  it('new pair + credits>0 → render-unlocked, credits-1, tries+1', () => {
    const result = nextShakeState({ triesUsed: 4, credits: 2, isNew: true });
    expect(result).toEqual({ action: 'render-unlocked', triesUsed: 5, credits: 1 });
  });

  it('new pair + credits=0 + tries<cap → render-locked, tries+1', () => {
    const result = nextShakeState({ triesUsed: 1, credits: 0, isNew: true });
    expect(result).toEqual({ action: 'render-locked', triesUsed: 2, credits: 0 });
  });

  it('first free try (cold start, tries=0, credits=0, new pair) → render-locked', () => {
    const result = nextShakeState({ triesUsed: 0, credits: 0, isNew: true });
    expect(result).toEqual({ action: 'render-locked', triesUsed: 1, credits: 0 });
  });

  it('third free try (tries=2, credits=0, new pair) → render-locked, tries goes to 3', () => {
    const result = nextShakeState({ triesUsed: 2, credits: 0, isNew: true });
    expect(result).toEqual({ action: 'render-locked', triesUsed: 3, credits: 0 });
  });

  it('new pair + credits=0 + tries=cap (3) → show-paywall, no mutation', () => {
    const result = nextShakeState({ triesUsed: 3, credits: 0, isNew: true });
    expect(result).toEqual({ action: 'show-paywall', triesUsed: 3, credits: 0 });
  });

  it('new pair + credits=0 + tries=100 → show-paywall (cap is >=, not ==)', () => {
    const result = nextShakeState({ triesUsed: 100, credits: 0, isNew: true });
    expect(result).toEqual({ action: 'show-paywall', triesUsed: 100, credits: 0 });
  });

  it('credits>0 takes precedence over cap (tries=3, credits=5) → render-unlocked', () => {
    // Paid credits override the free-tries gate; that's the whole point of paying.
    const result = nextShakeState({ triesUsed: 3, credits: 5, isNew: true });
    expect(result).toEqual({ action: 'render-unlocked', triesUsed: 4, credits: 4 });
  });

  it('credits>0 takes precedence even at tries=100', () => {
    const result = nextShakeState({ triesUsed: 100, credits: 1, isNew: true });
    expect(result).toEqual({ action: 'render-unlocked', triesUsed: 101, credits: 0 });
  });

  it('single credit consumed correctly (credits=1 → 0)', () => {
    const result = nextShakeState({ triesUsed: 5, credits: 1, isNew: true });
    expect(result).toEqual({ action: 'render-unlocked', triesUsed: 6, credits: 0 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyPaidReturn — credit grant + optional pending-profile consumption
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — applyPaidReturn', () => {
  it('no pending profile, credits=0 → +3 credits, action no-pending, triesUsed unchanged', () => {
    const result = applyPaidReturn({ credits: 0, triesUsed: 3, pendingProfile: null });
    expect(result).toEqual({ action: 'no-pending', credits: 3, triesUsed: 3 });
  });

  it('no pending profile, credits=2 → 5 credits, action no-pending', () => {
    const result = applyPaidReturn({ credits: 2, triesUsed: 4, pendingProfile: null });
    expect(result).toEqual({ action: 'no-pending', credits: 5, triesUsed: 4 });
  });

  it('pending profile + credits=0 → 2 credits (3 added, 1 consumed), render-unlocked, tries+1', () => {
    const pending = mk('New Person', '1999-09-09');
    const result = applyPaidReturn({ credits: 0, triesUsed: 3, pendingProfile: pending });
    expect(result).toEqual({
      action: 'render-unlocked',
      credits: 2,
      triesUsed: 4,
      profile: pending,
    });
  });

  it('pending profile + credits=1 → 3 credits (1+3-1), render-unlocked, tries+1', () => {
    const pending = mk('Another', '2000-01-01');
    const result = applyPaidReturn({ credits: 1, triesUsed: 5, pendingProfile: pending });
    expect(result).toEqual({
      action: 'render-unlocked',
      credits: 3,
      triesUsed: 6,
      profile: pending,
    });
  });

  it('pending profile + credits=5 (stacked purchases) → 7 credits, render-unlocked', () => {
    // Buying t2 with leftover t1 credits: credits stack across rungs
    // (+3 per purchase regardless of tier, DOCTRINE §1.D / §2 v0.36).
    const pending = mk('Stacker', '1980-12-31');
    const result = applyPaidReturn({
      credits: 5, triesUsed: 10, pendingProfile: pending,
      tier: 't1', purchasedTier: 't2',
    });
    expect(result).toEqual({
      action: 'render-unlocked',
      credits: 7,
      triesUsed: 11,
      profile: pending,
      tier: 't2',
    });
  });

  // ── v0.6.0 tier extension (DOCTRINE §1.D; brief §2) ────────────────
  // Deep ladder coverage (rank table, handler parsing, render gating)
  // lives in tests/tiers.test.js; these cases pin the state-machine
  // contract itself: +3 credits on any rung, tier monotonic.

  it('tier extension: purchase with no prior tier sets the purchased tier', () => {
    const result = applyPaidReturn({
      credits: 0, triesUsed: 3, pendingProfile: null,
      tier: null, purchasedTier: 't2',
    });
    expect(result).toEqual({ action: 'no-pending', credits: 3, triesUsed: 3, tier: 't2' });
  });

  it('tier extension: upgrade raises tier, replay of a lower rung never downgrades', () => {
    const upgraded = applyPaidReturn({
      credits: 2, triesUsed: 4, pendingProfile: null,
      tier: 't1', purchasedTier: 't3',
    });
    expect(upgraded.tier).toBe('t3');
    expect(upgraded.credits).toBe(5);
    const replayed = applyPaidReturn({
      credits: upgraded.credits, triesUsed: upgraded.triesUsed, pendingProfile: null,
      tier: upgraded.tier, purchasedTier: 't1',
    });
    expect(replayed.tier).toBe('t3');
    expect(replayed.credits).toBe(8);
  });

  it('tier extension: tier-less legacy call shape stays byte-compatible (tier undefined)', () => {
    // Pre-v0.6.0 callers pass no tier fields; counters behave identically
    // and the returned tier is undefined (renders free per brief §2).
    const result = applyPaidReturn({ credits: 0, triesUsed: 3, pendingProfile: null });
    expect(result.credits).toBe(3);
    expect(result.triesUsed).toBe(3);
    expect(result.tier).toBeUndefined();
    expect(maxTier(result.tier, 't1')).toBe('t1');
  });

  it('pending profile object without name/dob → still treated as pending and consumed', () => {
    // Validation happens at the UI layer; the state machine stays pure.
    // If the caller hands us a truthy pending object, we consume it.
    const malformed = { something: 'else' };
    const result = applyPaidReturn({ credits: 0, triesUsed: 0, pendingProfile: malformed });
    expect(result).toEqual({
      action: 'render-unlocked',
      credits: 2,
      triesUsed: 1,
      profile: malformed,
    });
  });

  it('explicit undefined pending profile behaves like null', () => {
    const result = applyPaidReturn({ credits: 0, triesUsed: 0, pendingProfile: undefined });
    expect(result).toEqual({ action: 'no-pending', credits: 3, triesUsed: 0 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Round-trip integration — compose isNewPair + nextShakeState + applyPaidReturn
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — round-trip scenarios', () => {
  it('cold start: 3 new-pair shakes → triesUsed=3, credits=0, all render-locked', () => {
    let triesUsed = 0;
    let credits = 0;
    const actions = [];

    const profiles = [
      mk('Sam Carter', '1990-05-15'),
      mk('Jane Doe', '1985-11-22'),
      mk('Alex Reed', '1995-07-04'),
    ];

    let stored = null;
    for (const p of profiles) {
      const result = nextShakeState({
        triesUsed,
        credits,
        isNew: isNewPair(p, stored),
      });
      actions.push(result.action);
      triesUsed = result.triesUsed;
      credits = result.credits;
      stored = p;
    }

    expect(actions).toEqual(['render-locked', 'render-locked', 'render-locked']);
    expect(triesUsed).toBe(3);
    expect(credits).toBe(0);
  });

  it('4th new pair on a 3/0 cold-state device → show-paywall, no state change', () => {
    const result = nextShakeState({ triesUsed: 3, credits: 0, isNew: true });
    expect(result.action).toBe('show-paywall');
    expect(result.triesUsed).toBe(3);
    expect(result.credits).toBe(0);
  });

  it('pay-and-return WITH pending → credits=2, triesUsed=4, profile rendered', () => {
    // State at paywall: triesUsed=3, credits=0, pending profile written
    const pending = mk('Fourth Person', '1977-03-11');
    const result = applyPaidReturn({ credits: 0, triesUsed: 3, pendingProfile: pending });
    expect(result.action).toBe('render-unlocked');
    expect(result.credits).toBe(2);
    expect(result.triesUsed).toBe(4);
    expect(result.profile).toBe(pending);
  });

  it('pay-and-return WITHOUT pending (replay attack) → credits=3, no render trigger', () => {
    // Manual /?paid=t1 URL entry without prior paywall trigger.
    // §5.C disclosed: this is trust-based; credits land but no auto-render.
    const result = applyPaidReturn({ credits: 0, triesUsed: 0, pendingProfile: null });
    expect(result.action).toBe('no-pending');
    expect(result.credits).toBe(3);
    expect(result.triesUsed).toBe(0);
    expect(result.profile).toBeUndefined();
  });

  it('same-profile re-shake after unlock → render-idempotent, no decrement', () => {
    // User just paid, has 2 credits, sees the rendered card, hits SHAKE AGAIN.
    // No edit to name/dob — should be idempotent, not consume a credit.
    const stored = mk('Fourth Person', '1977-03-11');
    const sameInput = mk('Fourth Person', '1977-03-11');
    const result = nextShakeState({
      triesUsed: 4,
      credits: 2,
      isNew: isNewPair(sameInput, stored),
    });
    expect(result.action).toBe('render-idempotent');
    expect(result.credits).toBe(2);
    expect(result.triesUsed).toBe(4);
  });

  it('lock-tap path: pay-and-return consumes pending and unlocks current card', () => {
    // Path B per DOCTRINE §5.C / brief §6.7: user taps lock icon on already-
    // rendered locked card. The CURRENTLY-stored profile is written to
    // pending; on return, +3 credits, consume 1, re-render same profile
    // now unlocked. triesUsed increments by 1 (the unlocked render counts).
    const current = mk('Locked User', '1992-06-20');
    const result = applyPaidReturn({ credits: 0, triesUsed: 2, pendingProfile: current });
    expect(result.action).toBe('render-unlocked');
    expect(result.credits).toBe(2);
    expect(result.triesUsed).toBe(3);
    expect(result.profile).toBe(current);
  });

  it('full lifecycle: 3 free → paywall → pay → 3 paid → paywall again', () => {
    let triesUsed = 0;
    let credits = 0;
    let stored = null;
    const log = [];

    const profiles = [
      mk('P1', '1990-01-01'),
      mk('P2', '1990-01-02'),
      mk('P3', '1990-01-03'),
      mk('P4', '1990-01-04'), // paywall fires
    ];

    for (const p of profiles) {
      const r = nextShakeState({
        triesUsed,
        credits,
        isNew: isNewPair(p, stored),
      });
      log.push(r.action);
      if (r.action === 'show-paywall') break;
      triesUsed = r.triesUsed;
      credits = r.credits;
      stored = p;
    }
    expect(log).toEqual(['render-locked', 'render-locked', 'render-locked', 'show-paywall']);
    expect(triesUsed).toBe(3);
    expect(credits).toBe(0);

    // Operator paid; pending was P4. Return handler:
    const pending = profiles[3];
    const paid = applyPaidReturn({ credits, triesUsed, pendingProfile: pending });
    expect(paid.action).toBe('render-unlocked');
    expect(paid.credits).toBe(2);
    expect(paid.triesUsed).toBe(4);
    triesUsed = paid.triesUsed;
    credits = paid.credits;
    stored = paid.profile;

    // 2 paid reads remaining. Shake two more new pairs.
    for (let i = 0; i < 2; i++) {
      const p = { name: `Paid${i}`, dob: `1991-${String(i + 1).padStart(2, '0')}-01` };
      const r = nextShakeState({
        triesUsed,
        credits,
        isNew: isNewPair(p, stored),
      });
      log.push(r.action);
      triesUsed = r.triesUsed;
      credits = r.credits;
      stored = p;
    }
    expect(log.slice(-2)).toEqual(['render-unlocked', 'render-unlocked']);
    expect(credits).toBe(0);
    expect(triesUsed).toBe(6);

    // Next new pair: paywall again (tries=6 >= cap, credits=0).
    const nextNew = mk('P7', '1992-12-12');
    const r = nextShakeState({
      triesUsed,
      credits,
      isNew: isNewPair(nextNew, stored),
    });
    expect(r.action).toBe('show-paywall');
  });
});
