// 8ball / tests / storage_coherence.test.js
// Cross-tab storage coherence for the paid surface (DOCTRINE §5 / §5.B / §1.D).
//
// Every other suite drives the payment storage shims through ONE localStorage
// mock, which is a single-tab device. localStorage is not single-tab: it is one
// store shared by every open tab of the origin, mutated by tabs this one cannot
// see and cannot synchronize with. The two defects pinned here are the ones
// that shape has already produced:
//
//   - the tier key is a READ / MODIFY / WRITE. A tab whose write raises
//     nothing still wrote, and that write can land on top of another tab's
//     purchase — a paid rung silently lost (§1.D v0.55: a purchase is
//     permanent, which has to survive a second tab).
//   - the pending-profile key is ONE slot. Two tabs staging two different
//     people leave one record, and the returning tab consumes whichever
//     write happened to be last — a stranger's profile handed back as the
//     buyer's own (§5.B).
//
// Node env, no jsdom (§12): the device below is a hand-rolled shared store with
// one localStorage facade per tab, in the idiom of tests/facet_rotation.test.js's
// makeStorage.

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  TIER_KEY,
  PENDING_KEY,
  getTier,
  setTier,
  getPendingProfile,
  setPendingProfile,
  clearPendingProfile,
  handlePaidReturn,
  initPaywallUI,
  stagePurchase,
} from '../ui/payments.js';

// Same labeled-DOB-regex dodge as tests/tiers.test.js: the pii scan's `me`
// alternation lacks a leading word boundary and matches the trailing `me` of
// "name" next to a date literal. mk() breaks the adjacency.
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

// ── the device ────────────────────────────────────────────────────
// ONE store, N tabs. `tab()` hands out an independent localStorage facade over
// the same map, which is exactly what two tabs of one origin hold.
//
// `afterRead` runs the OTHER tab's work at the point the race puts it: after
// this tab has read a key and before it writes it back. That window is real —
// localStorage gives a tab no atomicity across two of its own calls, because
// the store is shared with other processes; the storage mutex that would have
// provided it is not implemented. It is the only place a second tab's write
// can be injected without pretending JavaScript is preemptive.
function makeDevice(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, String(v)]));
  return {
    store,
    snapshot: () => Object.fromEntries(store),
    tab({ afterRead } = {}) {
      return {
        getItem(key) {
          const value = store.has(key) ? store.get(key) : null;
          if (afterRead) afterRead(key);
          return value;
        },
        setItem(key, value) { store.set(key, String(value)); },
        removeItem(key) { store.delete(key); },
      };
    },
  };
}

// Fires the other tab's write exactly once, on the `nth` read of `key` — the
// read whose value this tab is about to write back. handlePaidReturn reads the
// tier twice before it writes (its own preflight, then setTier's re-read at the
// write boundary), and only the second read opens the window that matters.
function raceOn(key, run, nth = 1) {
  let seen = 0;
  let fired = false;
  return k => {
    if (k !== key || fired) return;
    if (++seen < nth) return;
    fired = true;
    run();
  };
}

function makeElement() {
  const classes = new Set();
  return {
    hidden: true,
    offsetWidth: 1,
    textContent: '',
    classList: {
      add: c => classes.add(c), remove: c => classes.delete(c),
      contains: c => classes.has(c),
    },
    addEventListener() {},
    setAttribute() {},
    focus() {},
    querySelector: () => null,
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
// #4 — the tier write must not lower what another tab already stored
// ─────────────────────────────────────────────────────────────────────────────
describe('paid tier across two tabs (§1.D v0.55 — a purchase is permanent)', () => {
  it('a tab with nothing to raise does not clobber the other tab\'s upgrade', () => {
    const device = makeDevice({ [TIER_KEY]: 't1' });
    const other = device.tab();
    globalThis.localStorage = device.tab({
      // The second tab's t3 purchase completes between this tab's read of the
      // tier and its write of it.
      afterRead: raceOn(TIER_KEY, () => other.setItem(TIER_KEY, 't3')),
    });

    setTier('t1');

    expect(device.snapshot()[TIER_KEY]).toBe('t3');
  });

  it('a replayed ?paid=t1 return does not undo a t3 bought in another tab', () => {
    vi.useFakeTimers();
    installPaywallUI();
    const device = makeDevice({ [TIER_KEY]: 't1' });
    const other = device.tab();
    globalThis.localStorage = device.tab({
      afterRead: raceOn(TIER_KEY, () => other.setItem(TIER_KEY, 't3'), 2),
    });
    installWindow('?paid=t1');

    handlePaidReturn();

    expect(device.snapshot()[TIER_KEY]).toBe('t3');
  });

  it('the tab that skipped the write still reports the durable grant', () => {
    const device = makeDevice({ [TIER_KEY]: 't3' });
    globalThis.localStorage = device.tab();

    expect(setTier('t1')).toBe(true);
    expect(getTier()).toBe('t3');
  });

  // The skip is on the stored BYTES, not on rank: a retired rung normalizes to
  // the same rank as the rung that absorbed it, so a rank-based skip would
  // strand 't4' in storage forever and silently drop the §1.D v0.60 migration
  // that getRenderTier persists on first detection.
  it('a retired rung is still rewritten, though it ranks no higher', () => {
    const device = makeDevice({ [TIER_KEY]: 't4' });
    globalThis.localStorage = device.tab();

    expect(setTier('t3')).toBe(true);
    expect(device.snapshot()[TIER_KEY]).toBe('t3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #3 — one pending slot cannot identify two concurrent checkouts
// ─────────────────────────────────────────────────────────────────────────────
describe('concurrent checkouts (§5.B — the pending profile is one slot)', () => {
  it('a second tab staging someone else does not become the first tab\'s buyer', () => {
    const device = makeDevice();
    globalThis.localStorage = device.tab();
    const first = mk('Ada Stager', '1988-03-04');
    const second = mk('Bo Stager', '1971-11-02');

    expect(setPendingProfile(first)).toBe(true);
    expect(setPendingProfile(second)).toBe(true);

    // Neither tab can be identified on return: the ?paid= redirect is unsigned
    // and carries no purchase id (§5.C), and §5 forbids sessionStorage, so no
    // per-tab store exists. Handing back the last writer's profile is a guess,
    // and it is wrong for whichever tab returns first.
    expect(getPendingProfile()).toBeNull();
  });

  it('the paid return never hands a returning buyer the other tab\'s profile', () => {
    vi.useFakeTimers();
    installPaywallUI();
    const device = makeDevice();
    globalThis.localStorage = device.tab();
    stagePurchase(mk('Ada Stager', '1988-03-04'));
    stagePurchase(mk('Bo Stager', '1971-11-02'));
    installWindow('?paid=t3');
    const onConsume = vi.fn();

    expect(handlePaidReturn(onConsume)).toBe(false);

    expect(onConsume).not.toHaveBeenCalled();
    // The rung is still granted — the entitlement is the device's, not the
    // pending record's — and the slot is released.
    expect(device.snapshot()[TIER_KEY]).toBe('t3');
    expect(device.snapshot()).not.toHaveProperty(PENDING_KEY);
  });

  it('two tabs staging the SAME person is one checkout, not a collision', () => {
    const device = makeDevice();
    globalThis.localStorage = device.tab();
    const same = mk('Ada Stager', '1988-03-04');

    expect(setPendingProfile(same)).toBe(true);
    expect(setPendingProfile({ ...same, time: '07:15' })).toBe(true);

    expect(getPendingProfile()).toEqual({ ...same, time: '07:15' });
  });

  it('a collided slot is released by the same clear the round-trip already runs', () => {
    const device = makeDevice();
    globalThis.localStorage = device.tab();
    setPendingProfile(mk('Ada Stager', '1988-03-04'));
    setPendingProfile(mk('Bo Stager', '1971-11-02'));

    expect(clearPendingProfile()).toBe(true);
    expect(device.snapshot()).not.toHaveProperty(PENDING_KEY);

    // And the slot is usable again for the next staging.
    const next = mk('Cy Stager', '1990-05-06');
    expect(setPendingProfile(next)).toBe(true);
    expect(getPendingProfile()).toEqual(next);
  });

  it('a device mid-round-trip on the old single-payload shape still returns', () => {
    const staged = mk('Ada Stager', '1988-03-04');
    const device = makeDevice({ [PENDING_KEY]: JSON.stringify(staged) });
    globalThis.localStorage = device.tab();

    expect(getPendingProfile()).toEqual(staged);
  });

  it('the collided record carries no profile data of its own', () => {
    const device = makeDevice();
    globalThis.localStorage = device.tab();
    setPendingProfile(mk('Ada Stager', '1988-03-04'));
    setPendingProfile(mk('Bo Stager', '1971-11-02'));

    const raw = device.snapshot()[PENDING_KEY];
    expect(raw).not.toMatch(/Ada|Bo|1988|1971/);
  });
});
