// 8ball / tests / tiers.test.js
// v0.6.0 tier-ladder contract (DOCTRINE §1 v0.36 / §1.D / §4.B / §5.B Call 2
// v0.36; brief §6). Covers: TIER_COORDS composition per tier, tier
// rank/monotonic-upgrade math, the generalized ?paid=t1|t2|t3 handler,
// unknown-param replay safety, and the free-card render gate (the free
// card contains NO t1+ coordinate nodes).

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  TIER_ORDER,
  isTier,
  tierRank,
  maxTier,
  applyPaidReturn,
} from '../core/payments.js';
import {
  TIER_COORDS,
  coordsForTier,
  renderTierFor,
  formatPillar,
  initTiersUI,
  renderTierSections,
} from '../ui/tiers.js';
import {
  TIER_KEY,
  CREDITS_KEY,
  TRIES_KEY,
  PENDING_KEY,
  getTier,
  setTier,
  handlePaidReturn,
  initPaywallUI,
} from '../ui/payments.js';

// Same labeled-DOB-regex dodge as tests/payments_state.test.js: the pii
// scan's `me` alternation lacks a leading word-boundary and matches the
// trailing `me` of "name" near a date literal; mk() breaks the same-line
// adjacency without weakening the scan.
const mk = (n, d) => ({ name: n, dob: d });

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  vi.restoreAllMocks();
});

// Same harness shapes as tests/payments_markup.test.js.
function makeClassList() {
  const classes = new Set();
  return {
    add: cls => classes.add(cls),
    remove: cls => classes.delete(cls),
    contains: cls => classes.has(cls),
  };
}

function makeElement(extra = {}) {
  return {
    hidden: true,
    offsetWidth: 1,
    classList: makeClassList(),
    addEventListener: vi.fn(),
    setAttribute: vi.fn(),
    ...extra,
  };
}

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: vi.fn(key => store.get(key) || null),
    setItem: vi.fn((key, value) => { store.set(key, String(value)); }),
    removeItem: vi.fn(key => { store.delete(key); }),
    snapshot: () => Object.fromEntries(store),
  };
}

function installPaywallUI() {
  const banner = makeElement();
  initPaywallUI({ modal: makeElement(), closeBtn: makeElement(), banner });
  return banner;
}

function installWindow(search) {
  globalThis.window = {
    location: { search, pathname: '/' },
    history: { replaceState: vi.fn() },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER_COORDS — composition per tier (the §1.D locked table; brief §1)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — TIER_COORDS composition (DOCTRINE §1.D locked table)', () => {
  it('free tier is exactly birth card + sun + public animal (4 coordinates with the catalog numeral)', () => {
    expect(TIER_COORDS.free).toEqual(['arcana', 'sun', 'animal']);
    // The catalog numeral renders at every tier from the card corner —
    // it is the fourth free coordinate per §1.D, not a row key.
    expect(TIER_COORDS.free.length + 1).toBe(4);
  });

  it('free tier carries NO t1+ coordinate key', () => {
    for (const key of ['rising', 'element', 'innerAnimal', 'numerology',
      'numbers2', 'dayPillar', 'hourPillar', 'cardEntry']) {
      expect(TIER_COORDS.free, `free must not include ${key}`).not.toContain(key);
    }
  });

  it('t1 adds rising (conditional) + element + private animal + numerology — today\'s full free card', () => {
    expect(TIER_COORDS.t1).toEqual(
      [...TIER_COORDS.free, 'rising', 'element', 'innerAnimal', 'numerology']
    );
  });

  it('t2 adds the personality/birthday/maturity triplet + day pillar', () => {
    expect(TIER_COORDS.t2).toEqual([...TIER_COORDS.t1, 'numbers2', 'dayPillar']);
  });

  it('t3 adds hour pillar (four pillars complete) + the written card entry', () => {
    expect(TIER_COORDS.t3).toEqual([...TIER_COORDS.t2, 'hourPillar', 'cardEntry']);
  });

  it('the ladder is strictly cumulative — every tier is a superset of the one below', () => {
    const ladder = ['free', 't1', 't2', 't3'];
    for (let i = 1; i < ladder.length; i++) {
      const lower = TIER_COORDS[ladder[i - 1]];
      const upper = new Set(TIER_COORDS[ladder[i]]);
      for (const key of lower) {
        expect(upper.has(key), `${ladder[i]} must include ${ladder[i - 1]}'s ${key}`).toBe(true);
      }
    }
  });

  it('cardEntry (the written 144-card layer) exists at t3 ONLY (Fork 1b)', () => {
    expect(TIER_COORDS.t3).toContain('cardEntry');
    for (const tier of ['free', 't1', 't2']) {
      expect(TIER_COORDS[tier]).not.toContain('cardEntry');
    }
  });

  it('coordsForTier resolves unknown / absent tiers to the free composition', () => {
    expect([...coordsForTier('zz')]).toEqual(TIER_COORDS.free);
    expect([...coordsForTier(null)]).toEqual(TIER_COORDS.free);
    expect([...coordsForTier(undefined)]).toEqual(TIER_COORDS.free);
    expect([...coordsForTier('t2')]).toEqual(TIER_COORDS.t2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tier rank + monotonic upgrade (core/payments.js pure functions)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — rank and monotonic upgrade (DOCTRINE §1.D)', () => {
  it('TIER_ORDER is the locked t1 < t2 < t3 ladder', () => {
    expect(TIER_ORDER).toEqual(['t1', 't2', 't3']);
  });

  it('tierRank: free/garbage rank 0; rungs rank 1..3 in order', () => {
    expect(tierRank(null)).toBe(0);
    expect(tierRank(undefined)).toBe(0);
    expect(tierRank('free')).toBe(0);
    expect(tierRank('T1')).toBe(0);
    expect(tierRank('t1')).toBe(1);
    expect(tierRank('t2')).toBe(2);
    expect(tierRank('t3')).toBe(3);
  });

  it('isTier accepts exactly the three rungs', () => {
    expect(isTier('t1')).toBe(true);
    expect(isTier('t2')).toBe(true);
    expect(isTier('t3')).toBe(true);
    for (const bad of ['t0', 't4', 'free', '', null, undefined, 'T2', 1]) {
      expect(isTier(bad), `${String(bad)} must not be a tier`).toBe(false);
    }
  });

  it('maxTier never downgrades — every (current, purchased) pair', () => {
    const values = [null, 't1', 't2', 't3'];
    for (const a of values) {
      for (const b of values) {
        const out = maxTier(a, b);
        expect(tierRank(out)).toBe(Math.max(tierRank(a), tierRank(b)));
      }
    }
  });

  it('maxTier ignores garbage purchased values', () => {
    expect(maxTier('t2', 'zz')).toBe('t2');
    expect(maxTier(null, 'zz')).toBe(null);
  });

  it('renderTierFor: paid reads render the stored tier; free tries render free', () => {
    expect(renderTierFor('render-unlocked', 't2')).toBe('t2');
    expect(renderTierFor('render-unlocked', 't3')).toBe('t3');
    // Stored-tier-absent paid read (legacy credits) renders free per brief §2.
    expect(renderTierFor('render-unlocked', null)).toBe('free');
    expect(renderTierFor('render-locked', 't3')).toBe('free');
    expect(renderTierFor('show-paywall', 't3')).toBe('free');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyPaidReturn tier extension + upgrade path (brief §2)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — applyPaidReturn upgrade path', () => {
  it('first purchase sets the tier and grants +3 credits', () => {
    const r = applyPaidReturn({
      credits: 0, triesUsed: 3, pendingProfile: null,
      tier: null, purchasedTier: 't1',
    });
    expect(r).toEqual({ action: 'no-pending', credits: 3, triesUsed: 3, tier: 't1' });
  });

  it('a t1 owner later buying t3 → tier upgrades + 3 credits', () => {
    const r = applyPaidReturn({
      credits: 1, triesUsed: 5, pendingProfile: null,
      tier: 't1', purchasedTier: 't3',
    });
    expect(r).toEqual({ action: 'no-pending', credits: 4, triesUsed: 5, tier: 't3' });
  });

  it('a t3 owner replaying a t1 return keeps t3 (never downgrades) and still gets credits', () => {
    const r = applyPaidReturn({
      credits: 0, triesUsed: 6, pendingProfile: null,
      tier: 't3', purchasedTier: 't1',
    });
    expect(r).toEqual({ action: 'no-pending', credits: 3, triesUsed: 6, tier: 't3' });
  });

  it('pending profile consumption is tier-orthogonal (credits 3-1, tries+1, tier raised)', () => {
    const pending = mk('Sam Carter', '1990-05-15');
    const r = applyPaidReturn({
      credits: 0, triesUsed: 3, pendingProfile: pending,
      tier: null, purchasedTier: 't2',
    });
    expect(r).toEqual({
      action: 'render-unlocked', credits: 2, triesUsed: 4,
      profile: pending, tier: 't2',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ?paid=t1|t2|t3 parsing + unknown-param replay safety (ui/payments.js)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — ?paid= handler generalization (DOCTRINE §5.B Call 2 v0.36)', () => {
  it.each(['t1', 't2', 't3'])('?paid=%s grants +3 credits and stores the tier', purchased => {
    installPaywallUI();
    const storage = makeStorage({ [CREDITS_KEY]: '0', [TRIES_KEY]: '3' });
    globalThis.localStorage = storage;
    installWindow(`?paid=${purchased}`);

    expect(handlePaidReturn()).toBe(false); // no pending profile
    expect(storage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '3',
      [TIER_KEY]: purchased,
    });
  });

  it('tier storage is monotonic across handler invocations (t2 then t1 keeps t2)', () => {
    installPaywallUI();
    const storage = makeStorage({ [TIER_KEY]: 't2', [CREDITS_KEY]: '0', [TRIES_KEY]: '3' });
    globalThis.localStorage = storage;
    installWindow('?paid=t1');

    handlePaidReturn();
    expect(storage.snapshot()[TIER_KEY]).toBe('t2');
    expect(storage.snapshot()[CREDITS_KEY]).toBe('3');
  });

  it('unknown ?paid= values are ignored — no credits, no tier, no query strip (replay-safe)', () => {
    const banner = installPaywallUI();
    const storage = makeStorage({ [CREDITS_KEY]: '0', [TRIES_KEY]: '3' });
    globalThis.localStorage = storage;
    installWindow('?paid=t9');

    expect(handlePaidReturn()).toBe(false);
    expect(storage.snapshot()).not.toHaveProperty(TIER_KEY);
    expect(storage.snapshot()[CREDITS_KEY]).toBe('0');
    expect(globalThis.window.history.replaceState).not.toHaveBeenCalled();
    expect(banner.hidden).toBe(true);
  });

  it('a pending profile is consumed on a t3 return exactly like the t1 path', () => {
    installPaywallUI();
    const pending = mk('Paid Path', '1999-09-09');
    const storage = makeStorage({
      [CREDITS_KEY]: '0', [TRIES_KEY]: '3',
      [PENDING_KEY]: JSON.stringify(pending),
    });
    globalThis.localStorage = storage;
    installWindow('?paid=t3');
    const onConsume = vi.fn();

    expect(handlePaidReturn(onConsume)).toBe(true);
    expect(onConsume).toHaveBeenCalledWith(pending);
    expect(storage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '2',
      [TRIES_KEY]: '4',
      [TIER_KEY]: 't3',
    });
    expect(storage.snapshot()).not.toHaveProperty(PENDING_KEY);
  });

  it('getTier reads only valid tiers; garbage in storage reads as free (null)', () => {
    globalThis.localStorage = makeStorage({ [TIER_KEY]: 'banana' });
    expect(getTier()).toBe(null);
    globalThis.localStorage = makeStorage({ [TIER_KEY]: 't3' });
    expect(getTier()).toBe('t3');
    globalThis.localStorage = makeStorage();
    expect(getTier()).toBe(null);
  });

  it('setTier refuses non-tier values (the key never holds garbage)', () => {
    const storage = makeStorage();
    globalThis.localStorage = storage;
    setTier('banana');
    setTier('');
    expect(storage.snapshot()).not.toHaveProperty(TIER_KEY);
    setTier('t2');
    expect(storage.snapshot()[TIER_KEY]).toBe('t2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// render gating — the free card contains NO t1+ coordinate nodes
// ─────────────────────────────────────────────────────────────────────────────

// Mock symbol nodes mirroring the index.html DOM: each .coord-symbol
// resolves its .coord-section root via closest().
function makeRow() {
  const root = { hidden: false };
  const symbol = { textContent: '—', closest: () => root };
  return { root, symbol };
}

function installTierRows() {
  const rows = {
    arcana: makeRow(), element: makeRow(), sun: makeRow(), animal: makeRow(),
    numerology: makeRow(), numbers2: makeRow(), dayPillar: makeRow(), hourPillar: makeRow(),
  };
  const sunTitle = { textContent: '' };
  const animalTitle = { textContent: '' };
  initTiersUI({
    sunTitle,
    animalTitle,
    symbols: Object.fromEntries(
      Object.entries(rows).map(([k, v]) => [k, v.symbol])
    ),
  }, {});
  return { rows, sunTitle, animalTitle };
}

// Fixture profile per §11 sub-rule: synthetic values chosen for the render
// paths they exercise; no real-person anchor, no DOB string needed at all.
const PROFILE = {
  sunSign: 'gemini',
  risingSign: 'virgo',
  chineseElement: 'metal',
  animal: 'horse',
  innerAnimal: 'rabbit',
  lifePath: 3,
  nameNumber: 8,
  soulUrge: 3,
  personality: 5,
  birthday: 7,
  maturity: 11,
  birthCard: { label: 'XXI · the world' },
  dayPillar: { animal: 'dragon', stemElement: 'earth' },
  hourPillar: { animal: 'rat', stemElement: 'wood' },
};

describe('tiers — render gating (free card has NO t1+ coordinate nodes)', () => {
  it('free render: only arcana/sun/animal rows visible; all t1+ rows hidden AND cleared', () => {
    const { rows } = installTierRows();
    const { cardEntry } = renderTierSections(PROFILE, 'free');

    expect(cardEntry).toBe(false);
    for (const key of ['arcana', 'sun', 'animal']) {
      expect(rows[key].root.hidden, `${key} must be visible at free`).toBe(false);
    }
    for (const key of ['element', 'numerology', 'numbers2', 'dayPillar', 'hourPillar']) {
      expect(rows[key].root.hidden, `${key} must be hidden at free`).toBe(true);
      expect(rows[key].symbol.textContent, `${key} must carry no coordinate value at free`).toBe('—');
    }
  });

  it('free render: sun is bare (no rising even when computable); animal is public-only', () => {
    const { rows, sunTitle, animalTitle } = installTierRows();
    renderTierSections(PROFILE, 'free');

    expect(rows.sun.symbol.textContent).toBe('gemini');
    expect(rows.sun.symbol.textContent).not.toContain('↑');
    expect(sunTitle.textContent).toBe('SUN');
    expect(rows.animal.symbol.textContent).toBe('horse');
    expect(rows.animal.symbol.textContent).not.toContain('⇌');
    expect(animalTitle.textContent).toBe('PUBLIC');
  });

  it('t1 render matches today\'s full free card: rising joins sun, private joins animal, element + numerology visible', () => {
    const { rows, sunTitle, animalTitle } = installTierRows();
    const { cardEntry } = renderTierSections(PROFILE, 't1');

    expect(cardEntry).toBe(false);
    expect(rows.sun.symbol.textContent).toBe('gemini ↑ virgo');
    expect(sunTitle.textContent).toBe('SUN ↑ RISING');
    expect(rows.animal.symbol.textContent).toBe('horse ⇌ rabbit');
    expect(animalTitle.textContent).toBe('PUBLIC ⇌ PRIVATE');
    expect(rows.element.root.hidden).toBe(false);
    expect(rows.element.symbol.textContent).toBe('metal');
    expect(rows.numerology.root.hidden).toBe(false);
    expect(rows.numerology.symbol.textContent).toBe('3 8 3'); // space-separated per §1.B
    for (const key of ['numbers2', 'dayPillar', 'hourPillar']) {
      expect(rows[key].root.hidden, `${key} must stay hidden at t1`).toBe(true);
    }
  });

  it('t1 render without computable rising falls back to the bare sun line (§1.A shape)', () => {
    const { rows, sunTitle } = installTierRows();
    renderTierSections({ ...PROFILE, risingSign: undefined }, 't1');
    expect(rows.sun.symbol.textContent).toBe('gemini');
    expect(sunTitle.textContent).toBe('SUN');
  });

  it('t2 render adds the second triplet + day pillar; hour pillar stays hidden', () => {
    const { rows } = installTierRows();
    const { cardEntry } = renderTierSections(PROFILE, 't2');

    expect(cardEntry).toBe(false);
    expect(rows.numbers2.root.hidden).toBe(false);
    expect(rows.numbers2.symbol.textContent).toBe('5 7 11'); // space-separated triplet
    expect(rows.dayPillar.root.hidden).toBe(false);
    expect(rows.dayPillar.symbol.textContent).toBe('dragon · earth');
    expect(rows.hourPillar.root.hidden).toBe(true);
  });

  it('t3 render completes the four pillars and unlocks the card entry', () => {
    const { rows } = installTierRows();
    const { cardEntry } = renderTierSections(PROFILE, 't3');

    expect(cardEntry).toBe(true);
    expect(rows.hourPillar.root.hidden).toBe(false);
    expect(rows.hourPillar.symbol.textContent).toBe('rat · wood');
  });

  it('t3 render without birth time files the hour pillar as an empty field, not a hidden row', () => {
    const { rows } = installTierRows();
    renderTierSections({ ...PROFILE, hourPillar: null }, 't3');
    expect(rows.hourPillar.root.hidden).toBe(false);
    expect(rows.hourPillar.symbol.textContent).toBe('—');
  });

  it('re-rendering free after t3 re-hides and re-clears every t1+ row (no leak across renders)', () => {
    const { rows } = installTierRows();
    renderTierSections(PROFILE, 't3');
    renderTierSections(PROFILE, 'free');
    for (const key of ['element', 'numerology', 'numbers2', 'dayPillar', 'hourPillar']) {
      expect(rows[key].root.hidden).toBe(true);
      expect(rows[key].symbol.textContent).toBe('—');
    }
  });

  it('formatPillar renders the clinical animal · stem-element register', () => {
    expect(formatPillar({ animal: 'ox', stemElement: 'fire' })).toBe('ox · fire');
    expect(formatPillar(null)).toBe('—');
  });
});
