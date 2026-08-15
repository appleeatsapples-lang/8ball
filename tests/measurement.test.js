// 8ball / tests / measurement.test.js
//
// The measurement contract (DOCTRINE §5 v0.70 / §7 gate 7).
//
// Two jobs, and the second is the one that matters:
//
//   1. The SHAPE cannot carry a person. Asserted positively (what a record
//      holds) and negatively (that a caller cannot smuggle anything else in).
//   2. The four CALL SITES fire at the right moment. A contract nothing calls
//      is a comment.
//
// On (2), stated precisely because the first version of this file did not:
// THREE of the four are driven against a recording sink through the real
// module functions, and they live in the suites that already carry the
// harnesses for those modules (see the call-site block below for the map).
// The fourth, `reading_completed`, is a SOURCE-SHAPE pin — `renderCard` sits
// inside index.html's inline module and no test harness executes it. A
// cross-model lane caught the earlier header claiming all four were driven
// when three were string matches, and one of those string matches was
// asserting the exact call ordering that turned out to be wrong.
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

// ── the four call sites ───────────────────────────────────────────
//
// Three of the four are driven against a recording sink through the real
// module functions. They do not live here, because the machinery that drives
// them already exists elsewhere and `vi.mock` is per-file:
//
//   comparative_opened → tests/dyad_surface.test.js  ("the comparative_opened
//                        record") — fires the real click listener through the
//                        fake DOM: entitled open, three refused rungs, a
//                        throwing host hook, and a tier that moves mid-handler.
//   share_completed    → tests/share_behavior.test.js ("the share_completed
//                        record") — boots the real onShare() end to end:
//                        native resolve, native dismiss, download fallback,
//                        clipboard failure, and an unwired host.
//   paid_t3_cta_clicked → below, driven here.
//
// `reading_completed` is the one exception and is pinned by SOURCE SHAPE, not
// behaviour. `renderCard` lives inside index.html's single inline module;
// nothing in tests/ evaluates that script, and extracting it to make it
// drivable would refactor the §6 single-file posture for a call site whose
// correctness nobody disputes. Its real cover is the browser pass, where the
// event was observed firing with the render tier. That split is stated rather
// than papered over: claiming behavioural coverage one does not have is the
// same defect as the false-green tests this cycle exists to remove.

describe('measurement — the behavioural pins live where the harnesses are', () => {
  it('names where each driven suite is, so a deletion there is noticed here', () => {
    const dyadTests = read(join('tests', 'dyad_surface.test.js'));
    const shareTests = read(join('tests', 'share_behavior.test.js'));
    expect(dyadTests).toMatch(/describe\('the comparative_opened record'/);
    expect(dyadTests).toMatch(/setMeasurementSink/);
    expect(shareTests).toMatch(/describe\('the share_completed record'/);
    expect(shareTests).toMatch(/setMeasurementSink/);
  });
});

describe('measurement — call site: share_completed (ui/share.js)', () => {
  // The hook routing is what keeps ui/share.js import-free (§5.D), so the
  // thing that can silently break is the HOST forgetting to wire it. The
  // behaviour is driven in share_behavior.test.js with a stub tier; this is
  // the cross-file check that the real host passes the real key.
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
    // The exact record, not merely the right event name and a plausible tier.
    expect(Object.keys(seen[0]).sort()).toEqual(['event', 'tier']);
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

describe('measurement — call site: paid_t3_cta_clicked, the absent-CTA case', () => {
  it('binds nothing and records nothing when the modal carries no CTA', async () => {
    const { initPaywallUI } = await import('../ui/payments.js');
    const seen = recorder();
    const modal = {
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      querySelector: () => null,      // no #paywall-cta-t3
      querySelectorAll: () => [],
    };
    expect(() => initPaywallUI({
      modal, closeBtn: { addEventListener() {} }, banner: {},
    })).not.toThrow();
    expect(seen).toEqual([]);
  });
});

// SOURCE-SHAPE PIN, not a behavioural one — see the header block above for
// why renderCard cannot be driven from vitest and what actually covers it.
describe('measurement — call site: reading_completed (index.html renderCard, source pin)', () => {
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
