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
import {
  FACET_KEY, CREDITS_KEY, clearFacetIndex, consumeFacetShake,
  ensureFacetIndex, getFacetIndex, getFacetSlot, setFacetIndex,
} from '../ui/payments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const paymentsUi = readFileSync(join(__dirname, '..', 'ui', 'payments.js'), 'utf8');

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
    [7, 2], [8, 2], [9, 2], [11, 2], [22, 2], [33, 2],
  ])('anchors life path %s to position %s', (lifePath, expected) => {
    expect(anchorFacetIndex(lifePath)).toBe(expected);
  });

  it('stays in parity with the legacy bracket anchor table', () => {
    const slots = ['low', 'mid', 'high'];
    for (const lifePath of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
      expect(slots[anchorFacetIndex(lifePath)]).toBe(resolveBracket(lifePath));
    }
  });

  it('rejects unknown life-path values instead of silently choosing a slot', () => {
    for (const value of [0, 10, 12, 21, 34, '3', null, undefined]) {
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

  it('a funded t3 flip advances once and debits once', () => {
    expect(nextFacetState({ credits: 3, facetIndex: 1 })).toEqual({
      action: 'render-facet', credits: 2, facetIndex: 2,
    });
  });

  it('zero credits opens the paywall without changing the visible position', () => {
    expect(nextFacetState({ credits: 0, facetIndex: 2 })).toEqual({
      action: 'show-paywall', credits: 0, facetIndex: 2,
    });
  });

  it('counter normalization cannot mint a facet read', () => {
    for (const credits of [-1, NaN, 'junk']) {
      expect(nextFacetState({ credits, facetIndex: 0 }).action).toBe('show-paywall');
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
    setFacetIndex(2);
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

  it('consumeFacetShake couples credit debit and visible-position advance', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: 3, [FACET_KEY]: 0 });
    expect(consumeFacetShake(1)).toEqual({
      action: 'render-facet', credits: 2, facetIndex: 1,
    });
    expect(localStorage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '2', [FACET_KEY]: '1',
    });
  });

  it('zero-credit top-up path mutates neither counter nor position', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: 0, [FACET_KEY]: 1 });
    expect(consumeFacetShake(5).action).toBe('show-paywall');
    expect(localStorage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '0', [FACET_KEY]: '1',
    });
  });

  it('zero-credit top-up does not materialize a missing position', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: 0 });
    expect(consumeFacetShake(5).action).toBe('show-paywall');
    expect(localStorage.snapshot()).not.toHaveProperty(FACET_KEY);
  });

  it('forget removes the position', () => {
    setFacetIndex(1);
    clearFacetIndex();
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
    expect(() => setFacetIndex(1)).not.toThrow();
    expect(() => clearFacetIndex()).not.toThrow();
    expect(getFacetSlot(8)).toBe('high');
  });
});

describe('t3-only host wiring', () => {
  it('only t3 calls the credit-consuming facet transition', () => {
    expect(html).toMatch(/const facetState = tier === 't3' \? consumeFacetShake\(currentProfile\.lifePath\) : null/);
  });

  it('zero-credit rotation opens the paywall without staging pending intent', () => {
    const block = html.match(/if \(facetState && facetState\.action === 'show-paywall'\) \{([\s\S]*?)\n  \}/);
    expect(block).not.toBeNull();
    expect(block[1]).toMatch(/clearPendingProfile\(\)[\s\S]*openPaywall\(\)/);
    expect(block[1]).toMatch(/openPaywall\(\)/);
    expect(block[1]).not.toMatch(/setPendingProfile/);
  });

  it('renders the written note from the persisted current position', () => {
    expect(html).toMatch(/cardNote\.textContent = cell\.note\[getFacetSlot\(profile\.lifePath\)\]/);
  });

  it('new profiles and consumed pending profiles explicitly reset to the anchor', () => {
    expect(html).toMatch(/ensureFacetIndex\(profile\.lifePath, \{ reset: isNew \}\)/);
    expect(html).toMatch(/ensureFacetIndex\(profile\.lifePath, \{ reset: consumedPending \}\)/);
  });

  it('forget and corrupt-profile cleanup clear the facet position', () => {
    expect(html.match(/clearFacetIndex\(\)/g)).toHaveLength(2);
  });

  it('mechanical c.1 mapping is explicit and does not claim v2 content', () => {
    expect(paymentsUi).toMatch(/const FACET_SLOTS = \['low', 'mid', 'high'\]/);
    expect(paymentsUi).not.toMatch(/FACET_SLOTS\s*=\s*\[[^\]]*(outward|inward|returning)/);
  });
});
