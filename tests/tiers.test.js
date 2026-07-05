// 8ball / tests / tiers.test.js
// v0.7.0 compartment-card contract (DOCTRINE §1 / §1.D v0.37 / §4.B;
// brief §5). Covers: TIER_COORDS composition per tier, tier rank/
// monotonic-upgrade math, the generalized ?paid=t1|t2|t3 handler,
// unknown-param replay safety — all carried from v0.6.0 unchanged —
// plus the v0.7.0 compartment render: constant skeleton (rows never
// hidden), DOM purity (sealed cells carry EMPTY value nodes — no paid
// value string in the DOM below its tier), seal-iff-above-tier, the F4
// sealed ≠ unresolvable distinction, the paired-row title grammar, the
// unseal-trigger decision (pure + β-idempotent), and the §5.D share-row
// snapshot refs (v0.39: per-cell {state, value} → the PNG renders the full sheet).

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  TIER_ORDER,
  isTier,
  tierRank,
  maxTier,
  resolveRenderTier,
  applyPaidReturn,
} from '../core/payments.js';
import {
  TIER_COORDS,
  coordsForTier,
  formatPillar,
  initTiersUI,
  renderTierSections,
  newlyEntitledCells,
  primeUnsealBaseline,
  shareRowRefs,
} from '../ui/tiers.js';
import {
  TIER_KEY,
  CREDITS_KEY,
  TRIES_KEY,
  PENDING_KEY,
  getTier,
  setTier,
  getRenderTier,
  handlePaidReturn,
  initPaywallUI,
} from '../ui/payments.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeClassList } from './helpers/dom.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');

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

// makeClassList comes from ./helpers/dom.js; makeElement/makeStorage stay local
// (this suite asserts vi.fn call spies, a different idiom from the modal mocks).
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
// TIER_COORDS — composition per tier (the §1.D locked table)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — TIER_COORDS composition (DOCTRINE §1.D locked table)', () => {
  it('free tier is birth card + sun + public animal + life path (5 coordinates with the catalog numeral)', () => {
    expect(TIER_COORDS.free).toEqual(['arcana', 'sun', 'animal', 'lifePath']);
    // The catalog numeral renders at every tier from the card corner —
    // it is the fifth free coordinate per §1.D v0.38, not a row key.
    expect(TIER_COORDS.free.length + 1).toBe(5);
  });

  it('free tier carries NO t1+ coordinate key', () => {
    for (const key of ['rising', 'element', 'innerAnimal', 'numerology',
      'numbers2', 'dayPillar', 'hourPillar', 'cardEntry']) {
      expect(TIER_COORDS.free, `free must not include ${key}`).not.toContain(key);
    }
  });

  it('free life path is its own (DOB-derived) coordinate, distinct from the t1 numerology pair', () => {
    expect(TIER_COORDS.free).toContain('lifePath');
    expect(TIER_COORDS.free).not.toContain('numerology');
  });

  it('t1 adds rising (conditional) + element + private animal + numerology (expression/soul-urge pair)', () => {
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

});

// ─────────────────────────────────────────────────────────────────────────────
// density resolution — the single rule (PR #36 Codex remediation R1 + R2)
// render density = f(stored tier, credit state) at render time, never
// f(boot circumstance) or f(shake action).
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — resolveRenderTier single density rule (remediation R1/R2)', () => {
  it('a stored tier governs density regardless of credit state', () => {
    for (const credits of [0, 1, 3, 100]) {
      expect(resolveRenderTier({ tier: 't1', credits })).toBe('t1');
      expect(resolveRenderTier({ tier: 't2', credits })).toBe('t2');
      expect(resolveRenderTier({ tier: 't3', credits })).toBe('t3');
    }
  });

  it('R2 grandfather: credits with no stored tier resolve to t3 (pre-v0.6.0 buyers bought the written-entry unlock)', () => {
    expect(resolveRenderTier({ tier: null, credits: 1 })).toBe('t3');
    expect(resolveRenderTier({ tier: undefined, credits: 3 })).toBe('t3');
    // total rule: garbage tier value with credits also grandfathers
    expect(resolveRenderTier({ tier: 'banana', credits: 2 })).toBe('t3');
  });

  it('free devices (no tier, no credits) render the free card — unchanged', () => {
    expect(resolveRenderTier({ tier: null, credits: 0 })).toBe('free');
    expect(resolveRenderTier({ tier: undefined, credits: 0 })).toBe('free');
    expect(resolveRenderTier({ tier: null, credits: undefined })).toBe('free');
  });

  it('normalizes corrupt credit values before the density decision (codex reliability + review follow-up)', () => {
    // negative / fractional / non-finite / junk credits floor to 0 → free
    expect(resolveRenderTier({ tier: null, credits: -5 })).toBe('free');
    expect(resolveRenderTier({ tier: null, credits: 0.9 })).toBe('free');
    expect(resolveRenderTier({ tier: null, credits: NaN })).toBe('free');
    expect(resolveRenderTier({ tier: null, credits: 'abc' })).toBe('free');
    // a whole-integer string still grandfathers to t3
    expect(resolveRenderTier({ tier: null, credits: '3' })).toBe('t3');
    // a stored tier still wins regardless of corrupt credits (grandfather path)
    expect(resolveRenderTier({ tier: 't1', credits: -5 })).toBe('t1');
  });

  it('the rule takes no action/boot argument — density cannot depend on them', () => {
    expect(resolveRenderTier.length).toBe(1); // single state object
  });
});

describe('tiers — getRenderTier storage wrapper (remediation R1/R2)', () => {
  it('t3 buyer after reload: stored tier wins on every resolution', () => {
    globalThis.localStorage = makeStorage({ [TIER_KEY]: 't3', [CREDITS_KEY]: '0' });
    expect(getRenderTier()).toBe('t3');
    // repeated calls (same-card shake, same-pair submit) stay t3
    expect(getRenderTier()).toBe('t3');
  });

  it('R2 grandfather persists the tier key on first detection', () => {
    const storage = makeStorage({ [CREDITS_KEY]: '2' });
    globalThis.localStorage = storage;
    expect(getRenderTier()).toBe('t3');
    expect(storage.snapshot()[TIER_KEY]).toBe('t3'); // persisted — rule is total
    // and stays stable once persisted
    expect(getRenderTier()).toBe('t3');
  });

  it('does not rewrite an already-stored tier (monotonic ownership stays with handlePaidReturn)', () => {
    const storage = makeStorage({ [TIER_KEY]: 't1', [CREDITS_KEY]: '5' });
    globalThis.localStorage = storage;
    expect(getRenderTier()).toBe('t1');
    expect(storage.snapshot()[TIER_KEY]).toBe('t1');
  });

  it('free user: resolves free and writes NO tier key', () => {
    const storage = makeStorage();
    globalThis.localStorage = storage;
    expect(getRenderTier()).toBe('free');
    expect(storage.snapshot()).not.toHaveProperty(TIER_KEY);
  });
});

describe('tiers — R1 wiring: every render path resolves via getRenderTier (index.html)', () => {
  it('cold-boot rehydration renders at getRenderTier() — no boot-circumstance branch', () => {
    // initAfterAck: the rehydrate showResult call passes the helper output.
    const m = html.match(/const existing = loadSavedProfile\(\);[\s\S]*?showResult\(profileFromPayload\(existing\),\s*\{([\s\S]*?)\}\s*\)/);
    expect(m, 'rehydration showResult call not found').not.toBeNull();
    expect(m[1]).toMatch(/tier:\s*getRenderTier\(\)/);
    // the paid-return special case is gone: no consumedPending ternary
    expect(html).not.toMatch(/consumedPending\s*\?/);
  });

  it('cold-boot rehydration passes triesUsed — the free-tries chip must survive a reload (Codex audit 2026-07-04, Hook 1)', () => {
    // Regression pin: the boot rehydrate call originally passed tier+credits
    // only, so a returning free-tier user who reloaded the page lost the
    // "N free reads left" chip even though eight_ball_tries_used_v1 persists.
    const m = html.match(/const existing = loadSavedProfile\(\);[\s\S]*?showResult\(profileFromPayload\(existing\),\s*\{([\s\S]*?)\}\s*\)/);
    expect(m, 'rehydration showResult call not found').not.toBeNull();
    expect(m[1]).toMatch(/triesUsed:\s*getTriesUsed\(\)/);
  });

  it('same-pair submit and paid reads render at getRenderTier() — no action-based density', () => {
    const m = html.match(/showResult\(profile,\s*\{\s*tier:\s*getRenderTier\(\)/);
    expect(m, 'submit-path showResult must resolve via getRenderTier').not.toBeNull();
    expect(html).not.toMatch(/renderTierFor/);
    expect(html).not.toMatch(/currentRenderTier/);
  });

  it('same-card shake renders at getRenderTier()', () => {
    const m = html.match(/renderCard\(currentProfile,\s*\{\s*tier:\s*getRenderTier\(\)/);
    expect(m, 'shakeAgain renderCard must resolve via getRenderTier').not.toBeNull();
  });

  it('t3 density end-to-end: the resolved tier renders the full sheet open including the card entry', () => {
    // Compose the R1 helper with the render contract: a t3 buyer's
    // rehydrate tier ('t3' from storage) opens every compartment.
    globalThis.localStorage = makeStorage({ [TIER_KEY]: 't3', [CREDITS_KEY]: '0' });
    const tier = getRenderTier();
    const { cells } = installCompartments();
    const { cardEntry } = renderTierSections(PROFILE, tier);
    expect(cardEntry).toBe(true);
    expect(cells.hourPillar.root.classList.contains('sealed')).toBe(false);
    expect(cells.hourPillar.val.textContent).toBe('rat · wood');
    expect(cells.dayPillar.root.classList.contains('sealed')).toBe(false);
    expect(cells.dayPillar.val.textContent).toBe('dragon · earth');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyPaidReturn tier extension + upgrade path
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
// v0.7.0 compartment harness — mock per-cell nodes mirroring the
// index.html DOM: each .coord-val resolves its .coord-cell root and its
// .coord-section (with .coord-title) via closest().
// ─────────────────────────────────────────────────────────────────────────────

const CELL_KEYS = [
  'arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
  'lifePath', 'nameNumber', 'soulUrge',
  'personality', 'birthday', 'maturity',
  'dayPillar', 'hourPillar',
];

function makeClassSet() {
  const classes = new Set();
  return {
    add: cls => classes.add(cls),
    remove: cls => classes.delete(cls),
    contains: cls => classes.has(cls),
    toggle: (cls, force) => {
      const on = force === undefined ? !classes.has(cls) : !!force;
      if (on) classes.add(cls); else classes.delete(cls);
      return on;
    },
  };
}

function makeStyle() {
  const props = {};
  return {
    props,
    setProperty: (key, value) => { props[key] = value; },
    removeProperty: key => { delete props[key]; },
  };
}

function makeSection(title) {
  const titleNode = { textContent: title };
  return {
    titleNode,
    querySelector: sel => (sel === '.coord-title' ? titleNode : null),
  };
}

function makeCompartmentCell(section) {
  const root = { classList: makeClassSet(), style: makeStyle() };
  const val = {
    textContent: '',
    closest: sel => (sel === '.coord-cell' ? root
      : sel === '.coord-section' ? section : null),
  };
  return { root, val };
}

const CELL_SECTION = {
  arcana: 'arcana', element: 'element', sun: 'sun', rising: 'sun',
  animal: 'animal', innerAnimal: 'animal',
  lifePath: 'numerology', nameNumber: 'numerology', soulUrge: 'numerology',
  personality: 'numbers2', birthday: 'numbers2', maturity: 'numbers2',
  dayPillar: 'dayPillar', hourPillar: 'hourPillar',
};

function installCompartments() {
  const sections = {
    arcana: makeSection('ARCANA'),
    element: makeSection('FIVE-ELEMENT'),
    sun: makeSection('SUN ↑ RISING'),
    animal: makeSection('PUBLIC ⇌ PRIVATE'),
    numerology: makeSection('LIFE · NAME · SOUL'),
    numbers2: makeSection('PERSONALITY · BIRTHDAY · MATURITY'),
    dayPillar: makeSection('DAY PILLAR'),
    hourPillar: makeSection('HOUR PILLAR'),
  };
  const cells = {};
  for (const key of CELL_KEYS) {
    cells[key] = makeCompartmentCell(sections[CELL_SECTION[key]]);
  }
  const entry = { classList: makeClassSet(), style: makeStyle() };
  // The dynamic titles ARE the section title nodes, as in index.html.
  initTiersUI({
    sunTitle: sections.sun.titleNode,
    animalTitle: sections.animal.titleNode,
    entry,
    cells: Object.fromEntries(CELL_KEYS.map(key => [key, cells[key].val])),
  }, {});
  return {
    cells, entry, sections,
    sunTitle: sections.sun.titleNode,
    animalTitle: sections.animal.titleNode,
  };
}

const sealed = cell => cell.root.classList.contains('sealed');
const unres = cell => cell.root.classList.contains('unres');
const unsealing = cell => cell.root.classList.contains('unsealing');

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

// Cell keys above each render tier per the §1.D locked table.
// §1.D v0.38: life path is free (DOB-derived) — sealed at NO tier;
// expression/name number + soul urge stay sealed at free.
const SEALED_AT = {
  free: ['element', 'rising', 'innerAnimal', 'nameNumber', 'soulUrge',
    'personality', 'birthday', 'maturity', 'dayPillar', 'hourPillar'],
  t1: ['personality', 'birthday', 'maturity', 'dayPillar', 'hourPillar'],
  t2: ['hourPillar'],
  t3: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// constant skeleton — rows never hidden (markup + module source)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — constant skeleton (§1.D v0.37: full sheet at every tier)', () => {
  it('all eight .coord-section rows ship without hidden attributes', () => {
    const sections = html.match(/<div class="coord-section"[^>]*>/g) || [];
    expect(sections).toHaveLength(8);
    for (const tag of sections) {
      expect(tag, 'coord-section must never carry hidden').not.toMatch(/\bhidden\b/);
    }
  });

  it('ui/tiers.js never hides a row — the v0.6.0 hidden-gating is retired', () => {
    expect(tiersJs).not.toMatch(/\.hidden\s*=/);
    expect(tiersJs).not.toMatch(/setRow\(/);
  });

  it('14 compartment cells + the entry block each carry a seal layer', () => {
    expect((html.match(/class="coord-cell"/g) || []).length).toBe(14);
    expect((html.match(/class="coord-seal"/g) || []).length).toBe(15);
  });

  it('every cell renders with structure intact at every tier (no node removed)', () => {
    const { cells } = installCompartments();
    for (const tier of ['free', 't1', 't2', 't3']) {
      renderTierSections(PROFILE, tier);
      for (const key of CELL_KEYS) {
        expect(cells[key].root, `${key} cell root must exist at ${tier}`).toBeTruthy();
        expect(cells[key].root.classList.contains('hidden')).toBe(false);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DOM purity — sealed cells carry EMPTY value nodes (the mock-port trap)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — DOM purity (§1.D v0.37: no paid value below its tier)', () => {
  it('free render: every t1+ value node is the empty string, never opacity-hidden text', () => {
    const { cells } = installCompartments();
    const { cardEntry } = renderTierSections(PROFILE, 'free');
    expect(cardEntry).toBe(false);
    for (const key of SEALED_AT.free) {
      expect(cells[key].val.textContent, `${key} must carry no value at free`).toBe('');
    }
    // The whole rendered cell text at free is exactly the free surface.
    // §1.D v0.38: life path (PROFILE value 3) is now a free value, so '3'
    // is no longer a leak marker; soul urge (also 3) stays empty by the
    // per-cell SEALED_AT check above. nameNumber 8 remains a t1 leak marker.
    const allText = CELL_KEYS.map(key => cells[key].val.textContent).join('|');
    for (const leaked of ['virgo', 'metal', 'rabbit', '8', '5', '7', '11',
      'dragon', 'earth', 'rat', 'wood']) {
      expect(allText, `t1+ value "${leaked}" leaked into the free DOM`).not.toContain(leaked);
    }
  });

  it('t1 render: t2+ value nodes empty (second triplet, day pillar, hour pillar)', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 't1');
    for (const key of SEALED_AT.t1) {
      expect(cells[key].val.textContent, `${key} must carry no value at t1`).toBe('');
    }
    const allText = CELL_KEYS.map(key => cells[key].val.textContent).join('|');
    for (const leaked of ['5', '7', '11', 'dragon', 'earth', 'rat', 'wood']) {
      expect(allText, `t2+ value "${leaked}" leaked into the t1 DOM`).not.toContain(leaked);
    }
  });

  it('t2 render: the hour-pillar value node is empty', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 't2');
    expect(cells.hourPillar.val.textContent).toBe('');
    const allText = CELL_KEYS.map(key => cells[key].val.textContent).join('|');
    expect(allText).not.toContain('rat');
    expect(allText).not.toContain('wood');
  });

  it('re-rendering free after t3 re-seals and re-clears every paid cell (no leak across renders)', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 't3');
    renderTierSections(PROFILE, 'free');
    for (const key of SEALED_AT.free) {
      expect(sealed(cells[key]), `${key} must re-seal`).toBe(true);
      expect(cells[key].val.textContent, `${key} must re-clear`).toBe('');
    }
  });

  it('index.html clears the written-entry slots below t3 (name/type/habit/note empty)', () => {
    const m = html.match(
      /Sub-t3: the sealed entry block carries no entry text[\s\S]{0,400}?cardName\.textContent = '';[\s\S]{0,200}?cardNote\.textContent = '';/
    );
    expect(m, 'renderCard sub-t3 clear branch not found').not.toBeNull();
  });

  it('the mock\'s opacity trick is not ported: no opacity-gated .coord-val rule', () => {
    expect(html).not.toMatch(/\.sealed[^{]*\.coord-val[^{]*\{[^}]*opacity:\s*0/);
    expect(html).not.toMatch(/\.coord-cell\.locked/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// seal state — present iff the cell is above the render tier
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — seal iff above tier (§2 locked table)', () => {
  it.each(['free', 't1', 't2', 't3'])('%s render seals exactly the cells above it', tier => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, tier);
    const expectSealed = new Set(SEALED_AT[tier]);
    for (const key of CELL_KEYS) {
      expect(sealed(cells[key]), `${key} sealed state wrong at ${tier}`)
        .toBe(expectSealed.has(key));
    }
  });

  it('open cells carry their values at the entitled tier', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 't3');
    expect(cells.arcana.val.textContent).toBe('XXI · the world');
    expect(cells.element.val.textContent).toBe('metal');
    expect(cells.sun.val.textContent).toBe('gemini');
    expect(cells.rising.val.textContent).toBe('virgo');
    expect(cells.animal.val.textContent).toBe('horse');
    expect(cells.innerAnimal.val.textContent).toBe('rabbit');
    expect(cells.lifePath.val.textContent).toBe('3');
    expect(cells.nameNumber.val.textContent).toBe('8');
    expect(cells.soulUrge.val.textContent).toBe('3');
    expect(cells.personality.val.textContent).toBe('5');
    expect(cells.birthday.val.textContent).toBe('7');
    expect(cells.maturity.val.textContent).toBe('11');
    expect(cells.dayPillar.val.textContent).toBe('dragon · earth');
    expect(cells.hourPillar.val.textContent).toBe('rat · wood');
  });

  it('free render shows the life path value and seals expression + soul urge (§1.D v0.38 split)', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 'free');
    // life path is free (DOB-derived): carries its value, never sealed.
    expect(sealed(cells.lifePath)).toBe(false);
    expect(cells.lifePath.val.textContent).toBe('3');
    // expression + soul urge are name-derived: sealed (empty) at free.
    expect(sealed(cells.nameNumber)).toBe(true);
    expect(cells.nameNumber.val.textContent).toBe('');
    expect(sealed(cells.soulUrge)).toBe(true);
    expect(cells.soulUrge.val.textContent).toBe('');
  });

  it('the written-entry block is sealed below t3 and open at t3', () => {
    const { entry } = installCompartments();
    for (const tier of ['free', 't1', 't2']) {
      const { cardEntry } = renderTierSections(PROFILE, tier);
      expect(cardEntry).toBe(false);
      expect(entry.classList.contains('sealed'), `entry must be sealed at ${tier}`).toBe(true);
    }
    const { cardEntry } = renderTierSections(PROFILE, 't3');
    expect(cardEntry).toBe(true);
    expect(entry.classList.contains('sealed')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F4 sealed ≠ unresolvable + paired-row title grammar
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — F4 sealed ≠ unresolvable + title grammar (brief §2/§3 LOCKED)', () => {
  it('t3 without birth time: hour pillar renders the — empty field, never a seal', () => {
    const { cells } = installCompartments();
    renderTierSections({ ...PROFILE, hourPillar: null }, 't3');
    expect(cells.hourPillar.val.textContent).toBe('—');
    expect(sealed(cells.hourPillar)).toBe(false);
    expect(unres(cells.hourPillar)).toBe(true);
  });

  it('t1 without computable rising: — empty field, no seal, title SUN · RISING', () => {
    const { cells, sunTitle } = installCompartments();
    renderTierSections({ ...PROFILE, risingSign: undefined }, 't1');
    expect(cells.rising.val.textContent).toBe('—');
    expect(sealed(cells.rising)).toBe(false);
    expect(unres(cells.rising)).toBe(true);
    expect(sunTitle.textContent).toBe('SUN · RISING');
  });

  it('free render: rising is paywalled → seal (not —) even when uncomputable', () => {
    const { cells } = installCompartments();
    renderTierSections({ ...PROFILE, risingSign: undefined }, 'free');
    expect(sealed(cells.rising)).toBe(true);
    expect(unres(cells.rising)).toBe(false);
    expect(cells.rising.val.textContent).toBe('');
  });

  it('the two states never conflate: a cell is sealed or unres, never both', () => {
    const { cells } = installCompartments();
    renderTierSections({ ...PROFILE, hourPillar: null, risingSign: undefined }, 't3');
    for (const key of CELL_KEYS) {
      expect(sealed(cells[key]) && unres(cells[key]), `${key} conflates seal/unres`).toBe(false);
    }
  });

  it('SUN ↑ RISING only when rising is entitled AND computed', () => {
    const { sunTitle } = installCompartments();
    renderTierSections(PROFILE, 't1');
    expect(sunTitle.textContent).toBe('SUN ↑ RISING');
  });

  it('SUN · RISING while the rising cell is sealed (free)', () => {
    const { sunTitle } = installCompartments();
    renderTierSections(PROFILE, 'free');
    expect(sunTitle.textContent).toBe('SUN · RISING');
  });

  it('a bare SUN title never renders — every state names the rising compartment', () => {
    const { sunTitle } = installCompartments();
    for (const [profile, tier] of [
      [PROFILE, 'free'], [PROFILE, 't1'], [PROFILE, 't3'],
      [{ ...PROFILE, risingSign: undefined }, 'free'],
      [{ ...PROFILE, risingSign: undefined }, 't1'],
      [{ ...PROFILE, risingSign: undefined }, 't3'],
    ]) {
      renderTierSections(profile, tier);
      expect(sunTitle.textContent).not.toBe('SUN');
      expect(sunTitle.textContent).toMatch(/^SUN [·↑] RISING$/);
    }
    // Source pin: no bare 'SUN' string assignment survives in the module.
    expect(tiersJs).not.toMatch(/['"`]SUN['"`]/);
  });

  it('animal title: PUBLIC · PRIVATE while private is sealed; PUBLIC ⇌ PRIVATE at t1+', () => {
    const { animalTitle } = installCompartments();
    renderTierSections(PROFILE, 'free');
    expect(animalTitle.textContent).toBe('PUBLIC · PRIVATE');
    renderTierSections(PROFILE, 't1');
    expect(animalTitle.textContent).toBe('PUBLIC ⇌ PRIVATE');
    renderTierSections(PROFILE, 't3');
    expect(animalTitle.textContent).toBe('PUBLIC ⇌ PRIVATE');
    expect(tiersJs).not.toMatch(/['"`]PUBLIC['"`]/);
  });

  it('formatPillar renders the clinical animal · stem-element register', () => {
    expect(formatPillar({ animal: 'ox', stemElement: 'fire' })).toBe('ox · fire');
    expect(formatPillar(null)).toBe('—');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// unseal trigger — the pure decision (brief §3 motion grammar, β idempotence)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — unseal trigger (upgrade renders only; β idempotence)', () => {
  it('newlyEntitledCells: free → t1 flags exactly the t1 delta in DOM order', () => {
    // §1.D v0.38: life path is already open at free, so it is NOT in the
    // free → t1 unseal delta; the numerology pair (expression/soul urge) is.
    expect(newlyEntitledCells('free', 't1')).toEqual(
      ['element', 'rising', 'innerAnimal', 'nameNumber', 'soulUrge']
    );
  });

  it('newlyEntitledCells: t1 → t3 flags the t2+t3 delta plus the entry block', () => {
    expect(newlyEntitledCells('t1', 't3')).toEqual(
      ['personality', 'birthday', 'maturity', 'dayPillar', 'hourPillar', 'cardEntry']
    );
  });

  it('newlyEntitledCells: same tier flags none; lower tier flags none', () => {
    for (const tier of ['free', 't1', 't2', 't3']) {
      expect(newlyEntitledCells(tier, tier)).toEqual([]);
    }
    expect(newlyEntitledCells('t3', 't1')).toEqual([]);
    expect(newlyEntitledCells('t2', 'free')).toEqual([]);
  });

  it('upgrade render flags newly entitled cells with the staggered beat', () => {
    const { cells } = installCompartments();
    primeUnsealBaseline('free');
    renderTierSections(PROFILE, 't1');
    const flagged = ['element', 'rising', 'innerAnimal', 'nameNumber', 'soulUrge'];
    flagged.forEach((key, i) => {
      expect(unsealing(cells[key]), `${key} must unseal on the upgrade render`).toBe(true);
      expect(cells[key].root.style.props['--unseal-delay']).toBe(`${i * 100}ms`);
    });
    for (const key of CELL_KEYS.filter(k => !flagged.includes(k))) {
      expect(unsealing(cells[key]), `${key} must not unseal`).toBe(false);
    }
  });

  it('paid-return boot to t3 also unseals the entry block, last in DOM order', () => {
    const { entry } = installCompartments();
    primeUnsealBaseline('t2');
    renderTierSections(PROFILE, 't3');
    expect(entry.classList.contains('unsealing')).toBe(true);
    expect(entry.classList.contains('sealed')).toBe(false);
    expect(entry.style.props['--unseal-delay']).toBe('100ms'); // after hourPillar
  });

  it('same-tier re-render flags none (shake-again / rehydrate — no replay)', () => {
    const { cells, entry } = installCompartments();
    primeUnsealBaseline('free');
    renderTierSections(PROFILE, 't1');
    renderTierSections(PROFILE, 't1'); // shake again
    for (const key of CELL_KEYS) {
      expect(unsealing(cells[key]), `${key} must not replay`).toBe(false);
    }
    expect(entry.classList.contains('unsealing')).toBe(false);
  });

  it('plain rehydrate at the stored tier flags none (baseline = entitled tier)', () => {
    const { cells, entry } = installCompartments();
    primeUnsealBaseline('t3');
    renderTierSections(PROFILE, 't3');
    for (const key of CELL_KEYS) {
      expect(unsealing(cells[key])).toBe(false);
    }
    expect(entry.classList.contains('unsealing')).toBe(false);
  });

  it('unprimed first render never animates (tests/dev harness safety)', () => {
    const { cells } = installCompartments();
    renderTierSections(PROFILE, 't3');
    for (const key of CELL_KEYS) {
      expect(unsealing(cells[key])).toBe(false);
    }
  });

  it('index.html primes the baseline BEFORE handlePaidReturn applies the purchase', () => {
    const m = html.match(/primeUnsealBaseline\(getRenderTier\(\)\);[\s\S]{0,900}?handlePaidReturn\(/);
    expect(m, 'baseline must be primed ahead of the paid return').not.toBeNull();
    // and never the other way around
    const primeIdx = html.indexOf('primeUnsealBaseline(getRenderTier())');
    const returnIdx = html.indexOf('handlePaidReturn(p =>');
    expect(primeIdx).toBeGreaterThan(-1);
    expect(primeIdx).toBeLessThan(returnIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// share-row snapshot refs (§5.D v0.39 — full-sheet PNG; per-cell state so
// ui/share.js renders open values AND sealed compartments, never a value)
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers — shareRowRefs (§5.D v0.39 full-sheet per-cell snapshot)', () => {
  const flatCells = rows => rows.flatMap(r => r.cells);

  it('returns 8 row refs, each with a title string and a cells array (14 cells total)', () => {
    installCompartments();
    const rows = shareRowRefs();
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      expect(typeof row.title).toBe('string');
      expect(Array.isArray(row.cells)).toBe(true);
    }
    expect(flatCells(rows)).toHaveLength(14);
  });

  it('free render: 4 open cells, 10 sealed; sealed carry no value, none leak', () => {
    installCompartments();
    renderTierSections(PROFILE, 'free');
    const cells = flatCells(shareRowRefs());
    expect(cells.filter(c => c.state === 'open')).toHaveLength(4);
    expect(cells.filter(c => c.state === 'sealed')).toHaveLength(10);
    for (const c of cells.filter(c => c.state === 'sealed')) {
      expect(c.value).toBe('');
    }
    expect(cells.filter(c => c.state === 'open').map(c => c.value))
      .toEqual(['XXI · the world', 'gemini', 'horse', '3']);
    const all = cells.map(c => c.value).join('|');
    for (const leaked of ['virgo', 'rabbit', 'metal', 'dragon', 'rat', '8']) {
      expect(all, `sealed value "${leaked}" leaked into the share snapshot`).not.toContain(leaked);
    }
  });

  it('free render: mixed rows expose the open cell AND the sealed compartment (P1 fix)', () => {
    installCompartments();
    renderTierSections(PROFILE, 'free');
    const rows = shareRowRefs();
    expect(rows[2].cells).toEqual([
      { state: 'open', value: 'gemini' },
      { state: 'sealed', value: '' },
    ]);
    expect(rows[4].cells).toEqual([
      { state: 'open', value: '3' },
      { state: 'sealed', value: '' },
      { state: 'sealed', value: '' },
    ]);
  });

  it('t1 render: pair + triplet cells all open', () => {
    installCompartments();
    renderTierSections(PROFILE, 't1');
    const rows = shareRowRefs();
    expect(rows[2].cells.map(c => c.value)).toEqual(['gemini', 'virgo']);
    expect(rows[3].cells.map(c => c.value)).toEqual(['horse', 'rabbit']);
    expect(rows[4].cells.map(c => c.value)).toEqual(['3', '8', '3']);
    expect(rows[1].cells.map(c => c.value)).toEqual(['metal']);
    expect(rows[2].cells.every(c => c.state === 'open')).toBe(true);
  });

  it('unresolved cells carry state unres + the — field, never a seal (F4)', () => {
    installCompartments();
    renderTierSections({ ...PROFILE, risingSign: undefined, hourPillar: null }, 't3');
    const rows = shareRowRefs();
    expect(rows[2].cells[1]).toEqual({ state: 'unres', value: '—' }); // rising
    expect(rows[7].cells[0]).toEqual({ state: 'unres', value: '—' }); // hour pillar
  });

  it('row titles resolve through the live section (dynamic pair titles reach the PNG)', () => {
    installCompartments();
    renderTierSections(PROFILE, 't1');
    expect(shareRowRefs()[2].title).toBe('SUN ↑ RISING');
    renderTierSections(PROFILE, 'free');
    expect(shareRowRefs()[2].title).toBe('SUN · RISING');
  });

  it('index.html wires the share surface through shareRowRefs', () => {
    expect(html).toMatch(/\] = shareRowRefs\(\)/);
    expect(html).toMatch(/symbols:\s*\[shareArcana, shareElement, shareSun, shareAnimal/);
  });
});
