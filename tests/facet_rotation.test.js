// t3 written-entry rotation (DOCTRINE §1.H / §5 / §7).
// Pure transition coverage plus localStorage/UI wiring. The shipped v1 deck
// is immutable; the controller-authorized c.1 path selects its existing
// low/mid/high note slots positionally.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  anchorFacetIndex, FACET_COUNT, nextFacetIndex, nextFacetState,
  normalizeFacetIndex,
} from '../core/payments.js';
import { resolveBracket } from '../core/engine.js';
import { TERMINAL_NUMBERS } from '../core/profile.js';
import {
  FACET_KEY, LEGACY_FACET_KEY, LEGACY_FACET_KEY_V2, CREDITS_KEY, clearFacetIndex, consumeFacetShake,
  ensureFacetIndex, getFacetIndex, getFacetSlot, getFreshFacetSlot, setFacetIndex,
} from '../ui/payments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const paymentsUi = readFileSync(join(__dirname, '..', 'ui', 'payments.js'), 'utf8');
const resultUi = readFileSync(join(__dirname, '..', 'ui', 'result.js'), 'utf8');

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, String(v)]));
  return {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    snapshot: () => Object.fromEntries(store),
  };
}

describe('pure facet transition', () => {
  it('uses three positions', () => {
    expect(FACET_COUNT).toBe(3);
  });

  it.each([
    [1, 0], [2, 0], [3, 0],
    [4, 1], [5, 1], [6, 1],
    [7, 2], [8, 2], [9, 2],
    // Calc v4 (§1.H v0.62): the three master values anchor the THIRD
    // position, restoring the pre-calc-v3 contract.
    [11, 2], [22, 2], [33, 2],
  ])('anchors life path %s to position %s', (lifePath, expected) => {
    expect(anchorFacetIndex(lifePath)).toBe(expected);
  });

  it('stays in parity with the bracket anchor table across the whole domain', () => {
    const slots = ['low', 'mid', 'high'];
    // TERMINAL_NUMBERS, not a literal: the two groupings are the SAME
    // partition of the calc-v4 domain, so widening the domain in one place
    // and not the other has to fail here rather than diverge silently.
    for (const lifePath of TERMINAL_NUMBERS) {
      expect(slots[anchorFacetIndex(lifePath)]).toBe(resolveBracket(lifePath));
    }
  });

  it('rejects unknown life-path values instead of silently choosing a slot', () => {
    // 10 and 44 are the sharp cases: plausible integers no reduction can
    // terminate on. Admitting 11/22/33 must not admit them.
    for (const value of [0, 10, 12, 44, '3', null, undefined]) {
      expect(() => anchorFacetIndex(value)).toThrow(/Unknown life path value/);
    }
  });

  it('normalizes only integer positions 0, 1, and 2', () => {
    expect(normalizeFacetIndex(0)).toBe(0);
    expect(normalizeFacetIndex('1')).toBe(1);
    expect(normalizeFacetIndex(2)).toBe(2);
    for (const value of [null, undefined, '', -1, 3, 1.5, NaN, 'junk']) {
      expect(normalizeFacetIndex(value)).toBeNull();
    }
  });

  it('rotates round-robin without an immediate repeat', () => {
    expect(nextFacetIndex(0)).toBe(1);
    expect(nextFacetIndex(1)).toBe(2);
    expect(nextFacetIndex(2)).toBe(0);
    expect(nextFacetIndex(nextFacetIndex(nextFacetIndex(1)))).toBe(1);
  });

  it('a t3 flip advances once — owned, nothing debited (§1.H v0.55)', () => {
    expect(nextFacetState({ facetIndex: 1 })).toEqual({
      action: 'render-facet', facetIndex: 2,
    });
  });

  it('the flip carries no funding state — action and position only', () => {
    const result = nextFacetState({ facetIndex: 2 });
    expect(Object.keys(result).sort()).toEqual(['action', 'facetIndex']);
    expect(result).toEqual({ action: 'render-facet', facetIndex: 0 });
  });

  it('legacy credit fields cannot gate or alter the flip', () => {
    // Pre-v0.55 callers passed {credits, facetIndex}; any credits value —
    // including the old zero-credit paywall state — now just advances.
    for (const credits of [0, 3, -1, NaN, 'junk']) {
      expect(nextFacetState({ credits, facetIndex: 0 })).toEqual({
        action: 'render-facet', facetIndex: 1,
      });
    }
  });

  it('an unknown position still throws instead of minting one', () => {
    for (const facetIndex of [null, undefined, -1, 3, 'junk']) {
      expect(() => nextFacetState({ facetIndex })).toThrow(/Unknown facet index/);
    }
  });
});

describe('facet storage and v1 slot selection', () => {
  const originalStorage = globalThis.localStorage;

  beforeEach(() => { globalThis.localStorage = makeStorage(); });
  afterEach(() => {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  });

  it('initializes to the life-path anchor and stores the visible position', () => {
    expect(ensureFacetIndex(5)).toBe(1);
    expect(getFacetIndex()).toBe(1);
    expect(localStorage.snapshot()[FACET_KEY]).toBe('1');
  });

  it('preserves the visible position across re-read/reload', () => {
    expect(setFacetIndex(2)).toBe(2);
    expect(ensureFacetIndex(1)).toBe(2);
    expect(getFacetSlot(1)).toBe('high');
  });

  it('a new profile reset replaces the old position with its anchor', () => {
    setFacetIndex(2);
    expect(ensureFacetIndex(2, { reset: true })).toBe(0);
    expect(getFacetIndex()).toBe(0);
  });

  it('maps positions to the immutable v1 slots in order', () => {
    for (const [index, slot] of [[0, 'low'], [1, 'mid'], [2, 'high']]) {
      setFacetIndex(index);
      expect(getFacetSlot(1)).toBe(slot);
    }
  });

  it('consumeFacetShake advances and persists the visible position — no credit coupling (v0.55)', () => {
    globalThis.localStorage = makeStorage({ [FACET_KEY]: 0 });
    expect(consumeFacetShake(1)).toEqual({
      action: 'render-facet', facetIndex: 1,
    });
    expect(localStorage.snapshot()).toMatchObject({ [FACET_KEY]: '1' });
  });

  it('legacy credits are never consulted or mutated by a flip', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: 0, [FACET_KEY]: 1 });
    expect(consumeFacetShake(5)).toEqual({ action: 'render-facet', facetIndex: 2 });
    expect(localStorage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '0', [FACET_KEY]: '2',
    });
  });

  it('a flip with no stored position anchors from life path, then advances', () => {
    // Life path 5 anchors mid (1); the explicit flip advances to high (2)
    // and persists it — the pre-v0.55 zero-credit dead-end is gone.
    globalThis.localStorage = makeStorage({});
    expect(consumeFacetShake(5)).toEqual({ action: 'render-facet', facetIndex: 2 });
    expect(localStorage.snapshot()[FACET_KEY]).toBe('2');
  });

  it('returns null and preserves the visible facet when a write is blocked', () => {
    const storage = makeStorage({ [FACET_KEY]: 0 });
    globalThis.localStorage = { ...storage, setItem() {} };
    expect(setFacetIndex(1)).toBeNull();
    expect(consumeFacetShake(1)).toBeNull();
    expect(getFacetIndex()).toBe(0);
    expect(getFacetSlot(1)).toBe('low');
  });

  it('getFreshFacetSlot ignores any stored position and slots by life-path anchor alone', () => {
    globalThis.localStorage = makeStorage({ [FACET_KEY]: 2 });
    for (const lifePath of [1, 2, 3]) expect(getFreshFacetSlot(lifePath)).toBe('low');
    for (const lifePath of [4, 5, 6]) expect(getFreshFacetSlot(lifePath)).toBe('mid');
    for (const lifePath of [7, 8, 9]) expect(getFreshFacetSlot(lifePath)).toBe('high');
    expect(localStorage.snapshot()).toEqual({ [FACET_KEY]: '2' });
  });

  it('getFreshFacetSlot rejects unknown life-path values without touching storage', () => {
    globalThis.localStorage = makeStorage({ [FACET_KEY]: 1 });
    for (const value of [0, 10, 12, 44, '3', null, undefined]) {
      expect(() => getFreshFacetSlot(value)).toThrow(/Unknown life path value/);
    }
    expect(localStorage.snapshot()).toEqual({ [FACET_KEY]: '1' });
  });

  it('getFreshFacetSlot resolves every master life path to the high slot', () => {
    globalThis.localStorage = makeStorage();
    for (const lifePath of [11, 22, 33]) {
      expect(getFreshFacetSlot(lifePath)).toBe('high');
    }
    // Pure and storage-free: resolving a fresh slot writes nothing.
    expect(localStorage.snapshot()).toEqual({});
  });

  it('forget removes the position', () => {
    setFacetIndex(1);
    expect(clearFacetIndex()).toBe(true);
    expect(getFacetIndex()).toBeNull();
    expect(localStorage.snapshot()).not.toHaveProperty(FACET_KEY);
  });

  it('storage exceptions fail closed to an anchorable missing state', () => {
    globalThis.localStorage = {
      getItem() { throw new Error('blocked'); },
      setItem() { throw new Error('blocked'); },
      removeItem() { throw new Error('blocked'); },
    };
    expect(getFacetIndex()).toBeNull();
    expect(setFacetIndex(1)).toBeNull();
    expect(ensureFacetIndex(5)).toBeNull();
    expect(consumeFacetShake(5)).toBeNull();
    expect(clearFacetIndex()).toBe(false);
    expect(getFacetSlot(8)).toBe('high');
  });
});

describe('calc-v4 facet-key migration (one-shot clear of BOTH retired keys)', () => {
  const originalStorage = globalThis.localStorage;
  const RETIRED = [LEGACY_FACET_KEY, LEGACY_FACET_KEY_V2];

  beforeEach(() => { globalThis.localStorage = makeStorage(); });
  afterEach(() => {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  });

  it('names the versioned active key and retires both older generations', () => {
    expect(FACET_KEY).toBe('eight_ball_facet_index_v3');
    expect(LEGACY_FACET_KEY).toBe('eight_ball_facet_index_v1');
    expect(LEGACY_FACET_KEY_V2).toBe('eight_ball_facet_index_v2');
    // Three distinct names — a version bump that aliased two of them would
    // silently reinstate the stale position this migration exists to drop.
    expect(new Set([FACET_KEY, ...RETIRED]).size).toBe(3);
  });

  it('a calc-v3 stored position never overrides a calc-v4 master anchor (the v0.62 repro)', () => {
    // A device read 1970-01-04 under calc v3: life path 4, anchor `mid`,
    // stored '1' under the v2 key. Calc v4 restores that life path to 22,
    // whose anchor is `high`. The v3 position must not survive reload,
    // same-profile submit, or archive reopen — all of which read through
    // ensureFacetIndex/getFacetSlot.
    globalThis.localStorage = makeStorage({ [LEGACY_FACET_KEY_V2]: 1 });
    expect(ensureFacetIndex(22)).toBe(2);
    expect(getFacetSlot(22)).toBe('high');
    const snap = localStorage.snapshot();
    expect(snap).not.toHaveProperty(LEGACY_FACET_KEY_V2);
    expect(snap[FACET_KEY]).toBe('2');
  });

  it('a pre-v3 stored position is still dropped (the v0.54 F3 repro, unchanged)', () => {
    globalThis.localStorage = makeStorage({ [LEGACY_FACET_KEY]: 2 });
    expect(ensureFacetIndex(2)).toBe(0);
    expect(getFacetSlot(2)).toBe('low');
    const snap = localStorage.snapshot();
    expect(snap).not.toHaveProperty(LEGACY_FACET_KEY);
    expect(snap[FACET_KEY]).toBe('0');
  });

  it('never migrates a retired value — the first read clears it', () => {
    for (const key of RETIRED) {
      globalThis.localStorage = makeStorage({ [key]: 1 });
      expect(getFacetIndex(), key).toBeNull();
      expect(localStorage.snapshot(), key).not.toHaveProperty(key);
    }
  });

  it('clears only the retired keys — a post-v4 position is preserved', () => {
    globalThis.localStorage = makeStorage({
      [LEGACY_FACET_KEY]: 2, [LEGACY_FACET_KEY_V2]: 0, [FACET_KEY]: 2,
    });
    expect(ensureFacetIndex(1)).toBe(2);
    expect(getFacetSlot(1)).toBe('high');
    const snap = localStorage.snapshot();
    for (const key of RETIRED) expect(snap, key).not.toHaveProperty(key);
    expect(snap[FACET_KEY]).toBe('2');
  });

  it('forget scrubs the active key and every retired generation', () => {
    globalThis.localStorage = makeStorage({
      [LEGACY_FACET_KEY]: 1, [LEGACY_FACET_KEY_V2]: 1, [FACET_KEY]: 1,
    });
    expect(clearFacetIndex()).toBe(true);
    const snap = localStorage.snapshot();
    expect(snap).not.toHaveProperty(FACET_KEY);
    for (const key of RETIRED) expect(snap, key).not.toHaveProperty(key);
  });
});

describe('t3-only host wiring', () => {
  it('the facet transition is gated on the written-entry ENTITLEMENT, not on a tier literal', () => {
    // Was pinned as `tier === 't3'`. That exact equality stranded t4 owners
    // when §1.D v0.58 appended a rung: T4_COORDS carries `cardEntry`, so the
    // entry rendered off an index that could never advance or re-anchor —
    // $9 buying strictly less rotation than $3. The gate now asks the ladder
    // table which tiers own the entry, so a fifth rung cannot repeat it.
    expect(html).toMatch(/ownsCardEntry:\s*tier\s*=>\s*coordsForTier\(tier\)\.has\('cardEntry'\)/);
    expect(html).toMatch(/advanceFacet:\s*profile\s*=>\s*consumeFacetShake\(profile\.lifePath\)/);
    expect(resultUi).toMatch(/hooks\.ownsCardEntry\(tier\)[\s\S]*?hooks\.advanceFacet\(currentProfile\)/);
    expect(`${html}\n${resultUi}`).not.toMatch(/tier === 't3'/);
  });

  it('rotation never opens the paywall or touches pending intent (v0.55)', () => {
    // The zero-credit branch is gone: shakeAgain carries no paywall exit,
    // no pending-profile clear, and no facetState action gate.
    expect(`${html}\n${resultUi}`).not.toMatch(/facetState && facetState\.action === 'show-paywall'/);
    const shakeBlock = resultUi.match(/function shakeAgain\(\)[\s\S]*?\n  \}/);
    expect(shakeBlock).not.toBeNull();
    expect(shakeBlock[0]).not.toMatch(/openPaywall|PendingProfile/);
  });

  it('renders the written note from the persisted current position', () => {
    expect(html).toMatch(/cardNote\.textContent = cell\.note\[getFacetSlot\(profile\.lifePath\)\]/);
  });

  it('new profiles explicitly reset to the anchor; the boot rehydrate never does', () => {
    // The consumed-pending reset retired with the paid return (free
    // amendment): boot is always a plain rehydrate now, pinned as an
    // explicit no-reset so the position survives reloads.
    expect(html).toMatch(/ensureFacetIndex\(profile\.lifePath, \{ reset: isNew \}\)/);
    expect(html).toMatch(/ensureFacetIndex\(profile\.lifePath, \{ reset: false \}\)/);
    expect(html).not.toMatch(/consumedPending/);
  });

  it('forget and corrupt-profile cleanup clear the facet position', () => {
    expect(html).toMatch(/clearFacetState:\s*clearFacetIndex/);
    expect(html).toMatch(
      /catch\s*\([^)]*\)\s*\{[\s\S]*?clearProfile\(\);[\s\S]*?clearFacetIndex\(\);[\s\S]*?resetFormDisplay\(\);/,
    );
  });

  it('mechanical c.1 mapping is explicit and does not claim v2 content', () => {
    expect(paymentsUi).toMatch(/const FACET_SLOTS = \['low', 'mid', 'high'\]/);
    expect(paymentsUi).not.toMatch(/FACET_SLOTS\s*=\s*\[[^\]]*(outward|inward|returning)/);
  });
});
