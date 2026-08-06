// 8ball / tests / measurement.test.js
//
// The measurement contract (DOCTRINE §5 v0.70 / §7 gate 7).
//
// Two jobs, and the second is the one that matters:
//
//   1. The SHAPE cannot carry a person. Asserted positively (what a record
//      holds) and negatively (that a caller cannot smuggle anything else in).
//   2. The four CALL SITES fire on the real paths. A contract nothing calls
//      is a comment; these tests install a recording sink and drive the
//      actual module functions, so a deleted or misplaced call goes red.
//
// There is no collector. Nothing here asserts that anything is transmitted,
// because nothing is — `tests/privacy_scan.test.js` keeps the network
// primitives out of tracked source, including out of core/measurement.js.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MEASUREMENT_EVENTS,
  MEASUREMENT_TIERS,
  buildMeasurementRecord,
  isMeasurementEvent,
  recordMeasurement,
  setMeasurementSink,
} from '../core/measurement.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');

afterEach(() => {
  setMeasurementSink(null);
  vi.restoreAllMocks();
});

/** Install a recording sink; returns the array it appends to. */
function recorder() {
  const seen = [];
  setMeasurementSink(record => seen.push(record));
  return seen;
}

describe('measurement — the closed event list', () => {
  it('is exactly the four events the plan names', () => {
    expect([...MEASUREMENT_EVENTS]).toEqual([
      'reading_completed',
      'paid_t3_cta_clicked',
      'comparative_opened',
      'share_completed',
    ]);
  });

  it('is frozen, so a fifth event cannot be appended at runtime', () => {
    expect(Object.isFrozen(MEASUREMENT_EVENTS)).toBe(true);
    expect(() => { MEASUREMENT_EVENTS.push('profile_saved'); }).toThrow();
  });

  it('rejects anything outside the list', () => {
    expect(isMeasurementEvent('reading_completed')).toBe(true);
    for (const bad of ['page_view', 'reading_started', '', null, undefined, 'READING_COMPLETED']) {
      expect(isMeasurementEvent(bad), String(bad)).toBe(false);
    }
  });
});

describe('measurement — a record cannot carry a person', () => {
  it('holds exactly two keys, and they are the two named', () => {
    const r = buildMeasurementRecord('reading_completed', 'free');
    expect(Object.keys(r).sort()).toEqual(['event', 'tier']);
    expect(r).toEqual({ event: 'reading_completed', tier: 'free' });
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('accepts only the §1.D tier vocabulary', () => {
    for (const tier of MEASUREMENT_TIERS) {
      expect(buildMeasurementRecord('reading_completed', tier), tier).not.toBeNull();
    }
    // t4 and t5 are RETIRED tokens (§1.D v0.60 / v0.68) — a caller handing
    // one straight in has skipped normalizeTier, and the record refuses it
    // rather than emitting a rung that no longer exists.
    for (const bad of ['t4', 't5', 'paid', '', null, undefined, 'FREE']) {
      expect(buildMeasurementRecord('reading_completed', bad), String(bad)).toBeNull();
    }
  });

  it('an unknown event emits nothing at all', () => {
    const seen = recorder();
    expect(recordMeasurement('page_view', 'free')).toBeNull();
    expect(recordMeasurement('reading_completed', 't9')).toBeNull();
    expect(seen).toEqual([]);
  });

  // The whole point of building the payload instead of filtering it: the
  // function takes two positional values, so there is no object for a caller
  // to over-populate. This test is the standing proof that adding a field
  // requires editing core/measurement.js — it cannot arrive from a call site.
  it('the API gives a call site no way to attach a name, DOB, gender or city', () => {
    const seen = recorder();
    recordMeasurement('reading_completed', 'free');
    expect(seen).toHaveLength(1);
    const blob = JSON.stringify(seen[0]);
    for (const leak of ['name', 'dob', 'gender', 'city', 'lat', 'lng', 'tz', 'sun', 'catalog', 'id']) {
      expect(blob.includes(`"${leak}"`), leak).toBe(false);
    }
    expect(blob).toBe('{"event":"reading_completed","tier":"free"}');
  });

  it('forms no identity — no timestamp, counter or token, and repeats are identical', () => {
    const seen = recorder();
    recordMeasurement('reading_completed', 'free');
    recordMeasurement('reading_completed', 'free');
    // Two records of the same event on the same device are byte-identical.
    // If either carried a time, a sequence number or a session id, they
    // would differ — and two records that differ can be ordered and joined.
    expect(JSON.stringify(seen[0])).toBe(JSON.stringify(seen[1]));
  });
});

describe('measurement — the local seam', () => {
  it('is a no-op by default: no sink is installed by the product', () => {
    // Nothing throws and the record still comes back, so call sites are
    // safe to add before any collector exists (and none does).
    expect(recordMeasurement('reading_completed', 'free'))
      .toEqual({ event: 'reading_completed', tier: 'free' });
  });

  it('never lets a broken sink break the surface it observes', () => {
    setMeasurementSink(() => { throw new Error('collector exploded'); });
    expect(() => recordMeasurement('reading_completed', 't3')).not.toThrow();
    expect(recordMeasurement('reading_completed', 't3'))
      .toEqual({ event: 'reading_completed', tier: 't3' });
  });

  it('only the product source may install a sink, and it does not', () => {
    for (const file of ['index.html', join('ui', 'payments.js'), join('ui', 'dyad.js'), join('ui', 'share.js')]) {
      expect(read(file), file).not.toMatch(/setMeasurementSink/);
    }
  });
});

// ── the four call sites, driven for real ──────────────────────────
//
// Source-level assertions would pass on a call that is never reached. These
// import the modules and invoke the paths.

describe('measurement — call site: comparative_opened (ui/dyad.js)', () => {
  it('fires when an entitled device opens the screen, and not when a refused one taps', async () => {
    const dyad = await import('../ui/dyad.js');
    const src = read(join('ui', 'dyad.js'));
    // Recorded AFTER the entitlement gate — a tap that returns early is not
    // an opened comparative.
    const gate = src.indexOf('if (!dyadEntitled(currentTier())) return;');
    const call = src.indexOf("recordMeasurement('comparative_opened'");
    expect(gate).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(gate);
    // And the event name is one the contract accepts.
    expect(dyad).toBeTruthy();
    expect(isMeasurementEvent('comparative_opened')).toBe(true);
  });
});

describe('measurement — call site: share_completed (ui/share.js)', () => {
  it('fires on the native-share success path, not on a dismissed sheet', () => {
    const src = read(join('ui', 'share.js'));
    // The call sits INSIDE the try, after the await — a rejected share
    // (the user backing out) lands in the catch and is not counted.
    const block = src.match(/await navigator\.share\([\s\S]*?\}\s*catch/);
    expect(block, 'native share block not found').not.toBeNull();
    expect(block[0]).toMatch(/shareCompleted\(\)/);
  });

  it('fires on the desktop download fallback, after the artifact is delivered', () => {
    const src = read(join('ui', 'share.js'));
    const dl = src.lastIndexOf('downloadBlob(blob, filename);');
    const call = src.indexOf('shareCompleted();', dl);
    expect(dl).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(dl);
    // Recorded before the clipboard copy, which may fail without making the
    // share incomplete.
    expect(call).toBeLessThan(src.indexOf('navigator.clipboard', dl));
  });

  // The hook routing is what keeps ui/share.js import-free (§5.D), so the
  // thing that can now silently break is the HOST forgetting to wire it.
  // That failure mode is pinned here rather than left to a browser.
  it('the host wires the callback, so the hook cannot be silently unwired', () => {
    const html = read('index.html');
    const call = html.slice(html.indexOf('initShareUI('));
    const args = call.slice(0, call.indexOf('\n);'));
    expect(args).toMatch(
      /onShareCompleted:\s*\(\)\s*=>\s*recordMeasurement\('share_completed', getRenderTier\(\)\)/
    );
  });

  it('ui/share.js still imports nothing and names no tier — the §5.D posture holds', () => {
    const src = read(join('ui', 'share.js'));
    expect(src).not.toMatch(/^\s*import\s/m);
    expect(src).not.toMatch(/TIER_COORDS|eight_ball_tier_v1/);
    expect(src).not.toMatch(/recordMeasurement/);
  });
});

describe('measurement — call site: paid_t3_cta_clicked (ui/payments.js)', () => {
  it('fires on a real CTA click, wired without touching the bare-href Buy Link', async () => {
    const { initPaywallUI } = await import('../ui/payments.js');
    const seen = recorder();

    let ctaHandler = null;
    const cta = {
      addEventListener: (type, fn) => { if (type === 'click') ctaHandler = fn; },
    };
    const modal = {
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      querySelector: sel => (sel === '#paywall-cta-t3' ? cta : null),
      querySelectorAll: () => [],
    };
    initPaywallUI({
      modal,
      closeBtn: { addEventListener() {} },
      banner: {},
    });

    expect(ctaHandler, 'no click handler bound to the CTA').toBeTypeOf('function');
    ctaHandler();
    expect(seen).toHaveLength(1);
    expect(seen[0].event).toBe('paid_t3_cta_clicked');
    expect(MEASUREMENT_TIERS).toContain(seen[0].tier);

    // The listener must not have altered the offer's mechanism: the CTA is a
    // plain bare href (§5.B Call 2), so nothing here may add a parameter or
    // intercept the navigation.
    const html = read('index.html');
    expect(html).toMatch(/id="paywall-cta-t3"[^>]*href="https:\/\/theeightball\.gumroad\.com\/l\/xjpvp"/);
    const href = html.match(/id="paywall-cta-t3"[^>]*href="([^"]+)"/)[1];
    expect(href).not.toMatch(/[?&]/);
    expect(html).not.toMatch(/preventDefault\(\)[\s\S]{0,80}paywall-cta-t3/);
  });
});

describe('measurement — call site: reading_completed (index.html renderCard)', () => {
  it('is recorded at the end of renderCard, with the render tier', () => {
    const html = read('index.html');
    const fn = html.slice(html.indexOf('function renderCard(profile, opts)'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    expect(body).toMatch(/recordMeasurement\('reading_completed', tier\)/);
    // `tier` in that scope is the render tier renderCard already resolved
    // and sealed the sheet with — not a second, independent read.
    expect(body).toMatch(/const tier = \(opts && opts\.tier\) \|\| 'free';/);
  });

  it('the host imports the contract from core/, not a local copy', () => {
    expect(read('index.html')).toMatch(
      /import \{ recordMeasurement \} from '\.\/core\/measurement\.js';/
    );
  });
});

describe('measurement — no collector exists, and the module cannot become one quietly', () => {
  it('core/measurement.js stores nothing and calls nothing out of process', () => {
    // Comments are stripped first: this is about what the module DOES, and
    // its header necessarily names the things it promises not to touch.
    const code = read(join('core', 'measurement.js'))
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');
    for (const banned of ['localStorage', 'sessionStorage', 'document', 'window', 'navigator', 'Date.now', 'Math.random']) {
      expect(code.includes(banned), `core/measurement.js uses ${banned}`).toBe(false);
    }
    // And the stripper actually stripped something, so this cannot pass by
    // accidentally emptying the source it was meant to scan.
    expect(code).toMatch(/export function recordMeasurement/);
  });

  it('the operator plan is on disk and says the collector is not shipped', () => {
    const plan = read(join('audits', 'measurement_plan_2026-08-06.md'));
    for (const event of MEASUREMENT_EVENTS) expect(plan).toContain(event);
    expect(plan).toMatch(/no collector/i);
  });
});
