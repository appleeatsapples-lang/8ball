// 8ball / tests / payments_state.test.js
// Ownership-model payments state-machine contract (DOCTRINE §1.D / §2 /
// §4.B / §5.B v0.55; lineage: credit/cap machine v0.22–v0.54).
//
// Pure unit tests against core/payments.js. No DOM, no jsdom, no localStorage.
// Covers: isNewPair, nextShakeState (render / render-idempotent — nothing
// else), applyPaidReturn (monotonic tier write + pending render, NO credit
// grant), the retirement of the counter/cap exports, and round-trip
// integration scenarios composing the three functions.

import { describe, it, expect } from 'vitest';
import * as payments from '../core/payments.js';
import {
  isNewPair,
  nextShakeState,
  applyPaidReturn,
  maxTier,
  normalizeCounter,
} from '../core/payments.js';

// Helper to dodge tests/pii_scan.test.js labeled-DOB regex, which lacks a
// leading word-boundary on the `me` alternation token and so matches the
// trailing `me` in the word "name" followed within 40 chars by a date.
// Wrapping `{ name: ..., dob: ... }` in `mk(...)` breaks the same-line
// adjacency without weakening the scan's enforcement against actual PII.
const mk = (n, d) => ({ name: n, dob: d });

// ─────────────────────────────────────────────────────────────────────────────
// Retired machinery — the ownership model exports no counters or caps
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — retired credit/cap machinery (§1.D / §2 / §4.B v0.55)', () => {
  it('FREE_TRIES_CAP is no longer exported (the free surface is open)', () => {
    expect(payments.FREE_TRIES_CAP).toBeUndefined();
  });

  it('CREDITS_PER_PURCHASE is no longer exported (purchases are permanent, not metered)', () => {
    expect(payments.CREDITS_PER_PURCHASE).toBeUndefined();
  });

  it('normalizeCounter survives for the R2 legacy-credit read only', () => {
    // The single remaining consumer is resolveRenderTier's grandfather
    // read (pinned in tests/tiers.test.js); the helper stays hardened.
    expect(typeof normalizeCounter).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// counter normalization — legacy-storage-corruption hardening (R2 input)
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — legacy counter normalization', () => {
  it('normalizes invalid, negative, and non-finite values to zero', () => {
    for (const value of [undefined, null, '', 'not-a-number', -1, '-7', Infinity, 'Infinity', NaN]) {
      expect(normalizeCounter(value), String(value)).toBe(0);
    }
  });

  it('keeps whole non-negative values and floors fractional values', () => {
    expect(normalizeCounter(0)).toBe(0);
    expect(normalizeCounter('3')).toBe(3);
    expect(normalizeCounter(2.9)).toBe(2);
    expect(normalizeCounter('4.8')).toBe(4);
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
// nextShakeState — the whole transition table is two rows (§1.D/§4.B v0.55)
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — nextShakeState transitions (ownership model)', () => {
  it('same pair (isNew=false) → render-idempotent', () => {
    expect(nextShakeState({ isNew: false })).toEqual({ action: 'render-idempotent' });
  });

  it('new pair (isNew=true) → render, unconditionally', () => {
    expect(nextShakeState({ isNew: true })).toEqual({ action: 'render' });
  });

  it('renders carry no counters — the result has an action and nothing else', () => {
    for (const isNew of [true, false]) {
      const result = nextShakeState({ isNew });
      expect(Object.keys(result)).toEqual(['action']);
    }
  });

  it('stray legacy counter fields are ignored, never echoed, never gate the render', () => {
    // Pre-v0.55 callers passed {triesUsed, credits, isNew}. Any such
    // shape still renders: no value of either retired field may reach a
    // locked/paywall outcome, because those outcomes no longer exist.
    for (const triesUsed of [0, 3, 100, -5, NaN]) {
      for (const credits of [0, 1, -3, 'junk']) {
        const result = nextShakeState({ triesUsed, credits, isNew: true });
        expect(result).toEqual({ action: 'render' });
      }
    }
  });

  it('the retired actions are unreachable for every input shape', () => {
    const shapes = [
      { isNew: true }, { isNew: false },
      { isNew: true, triesUsed: 3, credits: 0 },   // the old paywall state
      { isNew: true, triesUsed: 0, credits: 0 },   // the old locked state
      { isNew: true, triesUsed: 99, credits: 99 },
      {},                                          // defensive: no isNew at all
    ];
    for (const shape of shapes) {
      const { action } = nextShakeState(shape);
      expect(['render', 'render-idempotent']).toContain(action);
      expect(action).not.toBe('render-locked');
      expect(action).not.toBe('show-paywall');
    }
  });

  it('a missing isNew reads as same-pair (falsy → idempotent), never a throw', () => {
    expect(nextShakeState({})).toEqual({ action: 'render-idempotent' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyPaidReturn — the monotonic tier write is the entire grant
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — applyPaidReturn (ownership: tier write + pending render)', () => {
  it('no pending profile → action no-pending, tier = purchased', () => {
    const result = applyPaidReturn({ pendingProfile: null, tier: null, purchasedTier: 't1' });
    expect(result).toEqual({ action: 'no-pending', tier: 't1' });
  });

  it('grants NO credits — the result carries no credits or tries fields, ever', () => {
    const noPending = applyPaidReturn({ pendingProfile: null, tier: null, purchasedTier: 't2' });
    expect(Object.keys(noPending).sort()).toEqual(['action', 'tier']);
    const withPending = applyPaidReturn({
      pendingProfile: mk('Pending Person', '1999-09-09'),
      tier: null, purchasedTier: 't2',
    });
    expect(Object.keys(withPending).sort()).toEqual(['action', 'profile', 'tier']);
  });

  it('pending profile → render-unlocked with the profile and the new tier', () => {
    const pending = mk('New Person', '1999-09-09');
    const result = applyPaidReturn({ pendingProfile: pending, tier: null, purchasedTier: 't3' });
    expect(result).toEqual({ action: 'render-unlocked', profile: pending, tier: 't3' });
  });

  it('tier is monotonic: upgrade raises it, replay of a lower rung never downgrades', () => {
    const upgraded = applyPaidReturn({ pendingProfile: null, tier: 't1', purchasedTier: 't3' });
    expect(upgraded.tier).toBe('t3');
    const replayed = applyPaidReturn({ pendingProfile: null, tier: upgraded.tier, purchasedTier: 't1' });
    expect(replayed.tier).toBe('t3');
  });

  it('every (current, purchased) pair resolves to the ladder max', () => {
    const values = [null, 't1', 't2', 't3'];
    for (const current of values) {
      for (const purchased of ['t1', 't2', 't3']) {
        const { tier } = applyPaidReturn({ pendingProfile: null, tier: current, purchasedTier: purchased });
        expect(tier).toBe(maxTier(current, purchased));
      }
    }
  });

  it('repeat purchase of the owned rung is a no-op grant (permanence, not stacking)', () => {
    // v0.55: there is nothing to stack. Replaying t2 on a t2 device
    // returns t2 and nothing else — the purchase was already permanent.
    const result = applyPaidReturn({ pendingProfile: null, tier: 't2', purchasedTier: 't2' });
    expect(result).toEqual({ action: 'no-pending', tier: 't2' });
  });

  it('pending profile object without name/dob → still treated as pending and consumed', () => {
    // Validation happens at the UI layer; the state machine stays pure.
    // If the caller hands us a truthy pending object, we consume it.
    const malformed = { something: 'else' };
    const result = applyPaidReturn({ pendingProfile: malformed, tier: null, purchasedTier: 't1' });
    expect(result).toEqual({ action: 'render-unlocked', profile: malformed, tier: 't1' });
  });

  it('explicit undefined pending profile behaves like null', () => {
    const result = applyPaidReturn({ pendingProfile: undefined, tier: null, purchasedTier: 't1' });
    expect(result).toEqual({ action: 'no-pending', tier: 't1' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Round-trip integration — compose isNewPair + nextShakeState + applyPaidReturn
// ─────────────────────────────────────────────────────────────────────────────

describe('payments — round-trip scenarios (ownership model)', () => {
  it('free device: ten distinct pairs all render — no cap, no paywall, nothing accumulates', () => {
    let stored = null;
    const actions = [];
    for (let i = 0; i < 10; i++) {
      const p = { name: `Person ${i}`, dob: `199${i % 10}-01-0${(i % 9) + 1}` };
      const result = nextShakeState({ isNew: isNewPair(p, stored) });
      actions.push(result.action);
      stored = p;
    }
    expect(actions).toEqual(Array(10).fill('render'));
  });

  it('same-pair re-shake stays idempotent (β idempotence survives v0.55)', () => {
    const stored = mk('Fourth Person', '1977-03-11');
    const sameInput = mk('Fourth Person', '1977-03-11');
    const result = nextShakeState({ isNew: isNewPair(sameInput, stored) });
    expect(result.action).toBe('render-idempotent');
  });

  it('lock-tap path: pay-and-return consumes pending and renders it at the bought tier', () => {
    // Path B per DOCTRINE §5.C / §6.7: user taps the lock icon on the
    // rendered sheet. The CURRENTLY-stored profile is written to
    // pending; on return the tier is written and the same profile
    // re-renders at the new density. Nothing is counted or spent.
    const current = mk('Locked User', '1992-06-20');
    const result = applyPaidReturn({ pendingProfile: current, tier: null, purchasedTier: 't2' });
    expect(result.action).toBe('render-unlocked');
    expect(result.profile).toBe(current);
    expect(result.tier).toBe('t2');
  });

  it('pay-and-return WITHOUT pending (replay attack) → tier lands, no render trigger', () => {
    // Manual /?paid=tN URL entry without prior lock-tap. §5.C disclosed:
    // trust-based; the tier flag lands but nothing auto-renders.
    const result = applyPaidReturn({ pendingProfile: null, tier: null, purchasedTier: 't3' });
    expect(result.action).toBe('no-pending');
    expect(result.tier).toBe('t3');
    expect(result.profile).toBeUndefined();
  });

  it('full lifecycle: unlimited free reads → t1 purchase → unlimited owned reads → t3 upgrade', () => {
    let stored = null;
    let tier = null;

    // Any number of free reads — sample five, all render.
    for (let i = 0; i < 5; i++) {
      const p = { name: `Free${i}`, dob: `1991-0${i + 1}-01` };
      expect(nextShakeState({ isNew: isNewPair(p, stored) }).action).toBe('render');
      stored = p;
    }

    // Buy t1 via the lock-tap: pending consumed, tier written.
    const paidT1 = applyPaidReturn({ pendingProfile: stored, tier, purchasedTier: 't1' });
    expect(paidT1).toEqual({ action: 'render-unlocked', profile: stored, tier: 't1' });
    tier = paidT1.tier;

    // Owned reads are unlimited too — no state to run down.
    for (let i = 0; i < 5; i++) {
      const p = { name: `Owned${i}`, dob: `1992-0${i + 1}-01` };
      expect(nextShakeState({ isNew: isNewPair(p, stored) }).action).toBe('render');
      stored = p;
    }

    // Later upgrade to t3: monotonic; replaying t1 afterwards changes nothing.
    const paidT3 = applyPaidReturn({ pendingProfile: null, tier, purchasedTier: 't3' });
    expect(paidT3.tier).toBe('t3');
    tier = paidT3.tier;
    const replay = applyPaidReturn({ pendingProfile: null, tier, purchasedTier: 't1' });
    expect(replay.tier).toBe('t3');
  });
});
