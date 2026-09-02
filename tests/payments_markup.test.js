// 8ball / tests / payments_markup.test.js
//
// The FREE-surface suite. This file was the v0.3.0 paid-surface
// markup + disclosure suite until the free amendment (2026-09-02,
// controller order): the storefront retired — no paywall, no checkout,
// no prices, no third-party payment processor anywhere in the shipped
// product. The filename stays for lineage (and so the §7 stage list
// keeps naming a payments leg): what it pins now is that the commerce
// surface STAYS GONE, that the free ceiling is total, and that the two
// survivors of the old module — the status banner and the boot scrub —
// behave.
//
// Scope:
//   1. absence guards      — zero checkout tokens across every shipped
//                            source file, zero commerce ids/classes
//   2. free ceiling        — getRenderTier is the ceiling for every
//                            device, storage consulted never
//   3. boot scrub          — the three retired commerce keys leave the
//                            device (read-verified, surgical, fail-safe)
//   4. status banner       — reveal/fade/hide behavior, no default copy
//   5. free disclosure     — the about modal states the free surface
//   6. retired exports     — the checkout API cannot quietly return

import { afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as paymentsUI from '../ui/payments.js';
import {
  CREDITS_KEY,
  FACET_KEY,
  PENDING_KEY,
  PROFILE_SAVE_STORAGE_MESSAGE,
  TIER_KEY,
  getRenderTier,
  initStatusBanner,
  scrubRetiredCommerceKeys,
  showStatusBanner,
} from '../ui/payments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const paymentsJs = readFileSync(join(root, 'ui', 'payments.js'), 'utf-8');

// Every shipped source file the product serves: the host page, every ui
// module and stylesheet, every core module, every content batch.
function shippedSources() {
  const files = [['index.html', html]];
  for (const dir of ['ui', 'core', 'content']) {
    for (const name of readdirSync(join(root, dir))) {
      if (!/\.(js|css)$/.test(name)) continue;
      files.push([`${dir}/${name}`, readFileSync(join(root, dir, name), 'utf-8')]);
    }
  }
  return files;
}

const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  vi.useRealTimers();
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

function mockStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); },
  };
}

// ── 1. absence guards ─────────────────────────────────────────────

describe('free surface — the storefront leaves no token behind', () => {
  it('no shipped source names the retired payment processor, in any case', () => {
    for (const [name, src] of shippedSources()) {
      expect(src, name).not.toMatch(/gumroad/i);
    }
  });

  it('no shipped source carries a checkout or price-tag token outside comments', () => {
    // Price tags ($ followed by a digit) and the retired product slugs.
    // Comments may keep the commercial HISTORY (incident records cite the
    // old prices); rendered markup, code and strings may not.
    const stripComments = src => src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
    for (const [name, src] of shippedSources()) {
      const code = stripComments(src);
      expect(code, name).not.toMatch(/\$\d/);
      expect(code, name).not.toMatch(/xjpvp|neysyv/);
    }
  });

  it('the commerce ids and classes are gone from the host page', () => {
    for (const token of ['paywall', 'card-lock-icon', 'lock-icon', 'offer-btn',
      'dyad-offer', 'modal-cta', 'paid-banner', 'specimen-entry']) {
      expect(html, token).not.toContain(token);
    }
  });

  it('the commerce styles are gone from both host stylesheets', () => {
    for (const sheet of ['shell.css', 'experience.css']) {
      const css = readFileSync(join(root, 'ui', sheet), 'utf-8');
      for (const token of ['.paywall', '.lock-icon', '.modal-cta', '#offer-btn',
        '#dyad-offer', '.paid-banner']) {
        expect(css, `${sheet} ${token}`).not.toContain(token);
      }
    }
  });

  it('the host page handles no ?paid= return and stages no purchase', () => {
    expect(html).not.toMatch(/[?'"&]paid\b/);
    expect(html).not.toMatch(/stagePurchase|handlePaidReturn|openPaywall|openPurchase/);
  });
});

// ── 2. the free ceiling ───────────────────────────────────────────

describe('free ceiling — getRenderTier is the ceiling for every device', () => {
  it('returns t5 with no storage at all', () => {
    delete globalThis.localStorage;
    expect(getRenderTier()).toBe('t5');
  });

  it('returns t5 whatever a legacy device has stored', () => {
    for (const stored of ['t1', 't2', 't3', 't4', 'free', 'garbage', '']) {
      globalThis.localStorage = mockStorage({ [TIER_KEY]: stored });
      expect(getRenderTier(), `stored ${JSON.stringify(stored)}`).toBe('t5');
    }
  });

  it('never reads or writes storage — the resolver is pure (source pin)', () => {
    const fn = paymentsJs.match(/export function getRenderTier\(\) \{([\s\S]*?)\n\}/);
    expect(fn, 'getRenderTier missing from ui/payments.js').not.toBeNull();
    expect(fn[1]).not.toMatch(/localStorage/);
    expect(fn[1]).toMatch(/return 't5';/);
  });
});

// ── 3. the boot scrub ─────────────────────────────────────────────

describe('boot scrub — the retired commerce keys leave the device', () => {
  it('removes pending, tier and credits, read-verified true', () => {
    globalThis.localStorage = mockStorage({
      [PENDING_KEY]: JSON.stringify({ name: 'x', dob: '2000-01-01' }),
      [TIER_KEY]: 't3',
      [CREDITS_KEY]: '2',
    });
    expect(scrubRetiredCommerceKeys()).toBe(true);
    for (const key of [PENDING_KEY, TIER_KEY, CREDITS_KEY]) {
      expect(globalThis.localStorage.getItem(key), key).toBe(null);
    }
  });

  it('is surgical: every other key survives verbatim', () => {
    globalThis.localStorage = mockStorage({
      [TIER_KEY]: 't2',
      [FACET_KEY]: '1',
      eight_ball_profile_v1: '{"name":"x"}',
      eight_ball_saved_readings_v1: '[]',
    });
    scrubRetiredCommerceKeys();
    expect(globalThis.localStorage.getItem(FACET_KEY)).toBe('1');
    expect(globalThis.localStorage.getItem('eight_ball_profile_v1')).toBe('{"name":"x"}');
    expect(globalThis.localStorage.getItem('eight_ball_saved_readings_v1')).toBe('[]');
  });

  it('is a pure read-shaped pass when nothing is stored', () => {
    const storage = mockStorage();
    globalThis.localStorage = storage;
    expect(scrubRetiredCommerceKeys()).toBe(true);
    expect(storage.store.size).toBe(0);
  });

  it('reports false without throwing when storage is blocked', () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(scrubRetiredCommerceKeys()).toBe(false);
  });

  it('boot() runs the commerce scrub alongside the gender scrubs (index.html wiring)', () => {
    const bootFn = html.match(/function boot\(\) \{([\s\S]*?)\n\}\n\nboot\(\);/);
    expect(bootFn, 'boot() not found').not.toBeNull();
    expect(bootFn[1]).toMatch(/scrubRetiredCommerceKeys\(\)/);
    expect(bootFn[1]).toMatch(/scrubStoredGender\(\)/);
    expect(bootFn[1]).toMatch(/scrubSavedReadingsGender\(\)/);
    // ...and before the stored profile is read, so no retired payload
    // shapes the boot render.
    expect(bootFn[1].indexOf('scrubRetiredCommerceKeys()'))
      .toBeLessThan(bootFn[1].indexOf('loadSavedProfile()'));
  });
});

// ── 4. the status banner ──────────────────────────────────────────

describe('status banner — the one transient status surface', () => {
  it('exists in the host page, hidden by default, with no baked-in copy', () => {
    const m = html.match(/<div class="status-banner" id="status-banner"[^>]*>([^<]*)<\/div>/);
    expect(m, 'status banner missing').not.toBeNull();
    expect(html).toMatch(/id="status-banner"[^>]*\bhidden\b|class="status-banner"[^>]*\bhidden\b/);
    expect(m[1].trim()).toBe('');
  });

  it('reveals, fades, then hides on a message', () => {
    vi.useFakeTimers();
    const banner = {
      textContent: '', hidden: true, offsetWidth: 0,
      classList: { set: new Set(), add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); }, contains(c) { return this.set.has(c); } },
    };
    initStatusBanner(banner);
    showStatusBanner(PROFILE_SAVE_STORAGE_MESSAGE);
    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toBe(PROFILE_SAVE_STORAGE_MESSAGE);
    expect(banner.classList.contains('visible')).toBe(true);
    vi.advanceTimersByTime(4000);
    expect(banner.classList.contains('visible')).toBe(false);
    vi.advanceTimersByTime(600);
    expect(banner.hidden).toBe(true);
  });

  it('is a no-op without a message — nothing flashes an empty toast', () => {
    const banner = { textContent: 'stale', hidden: true, offsetWidth: 0,
      classList: { add() { throw new Error('should not show'); }, remove() {}, contains() { return false; } } };
    initStatusBanner(banner);
    expect(() => showStatusBanner('')).not.toThrow();
    expect(banner.hidden).toBe(true);
  });

  it('the save-failure message dropped its purchase clause and both save sites use it', () => {
    expect(PROFILE_SAVE_STORAGE_MESSAGE).toBe('reading not saved — allow local storage to reopen it later.');
    expect(PROFILE_SAVE_STORAGE_MESSAGE).not.toMatch(/purchase|buy|pay/i);
    const sites = html.match(/showStatusBanner\(PROFILE_SAVE_STORAGE_MESSAGE\)/g) || [];
    expect(sites.length).toBe(2);
  });
});

// ── 5. the free disclosure ────────────────────────────────────────

describe('free disclosure — the about modal states the free surface', () => {
  const aboutStart = html.indexOf('id="about-modal"');
  const aboutSubtree = html.slice(aboutStart, html.indexOf('</div>', html.indexOf('modal-actions', aboutStart)));

  it('the about modal exists and opens with "everything is free"', () => {
    expect(aboutStart).toBeGreaterThan(-1);
    expect(aboutSubtree).toMatch(/everything is free\./);
  });

  it('names the whole free surface: sheet, meanings, written entry, domain fit, paired read', () => {
    expect(aboutSubtree).toMatch(/all fifteen coordinates/);
    expect(aboutSubtree).toMatch(/their meanings/);
    expect(aboutSubtree).toMatch(/written card entry/);
    expect(aboutSubtree).toMatch(/domain fit/);
    expect(aboutSubtree).toMatch(/paired read/);
  });

  it('negates the whole commerce shape in one breath', () => {
    expect(aboutSubtree).toMatch(/no payment, no subscription, no 8ball account, nothing to unlock/);
  });

  it('word "subscription" appears only inside the negation', () => {
    const matches = aboutSubtree.match(/subscription/g) || [];
    const negated = aboutSubtree.match(/no subscription/g) || [];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBe(negated.length);
  });

  it('honors prior buyers without presenting a checkout', () => {
    expect(aboutSubtree).toMatch(/devices that bought a rung while the sheet was paid keep everything they had/);
  });

  it('keeps the on-device data boundary and source visibility disclosures', () => {
    expect(aboutSubtree).toMatch(/nothing leaves your device on its own/);
    expect(aboutSubtree).toMatch(/the deck is visible in source\./);
  });

  it('contains "calculator-grade"', () => {
    expect(aboutSubtree).toMatch(/calculator-grade/);
  });

  it('the stored-locally list no longer names a paid rung', () => {
    expect(aboutSubtree).toMatch(/inputs, the show-labels toggle, and readings you choose to save are stored locally/);
  });
});

// ── 6. retired exports ────────────────────────────────────────────

describe('retired exports — the checkout API cannot quietly return', () => {
  it('ui/payments.js no longer exports any commerce function', () => {
    for (const name of ['stagePurchase', 'handlePaidReturn', 'openPaywall',
      'closePaywall', 'isPaywallOpen', 'initPaywallUI', 'showPaidBanner',
      'getTier', 'setTier', 'getCredits', 'getPendingProfile',
      'setPendingProfile', 'clearPendingProfile', 'scrubPendingGender']) {
      expect(paymentsUI[name], name).toBeUndefined();
    }
  });

  it('the facet machinery survives untouched', () => {
    for (const name of ['getFacetSlot', 'getFreshFacetSlot', 'ensureFacetIndex',
      'consumeFacetShake', 'clearFacetIndex', 'getFacetIndex', 'setFacetIndex']) {
      expect(typeof paymentsUI[name], name).toBe('function');
    }
  });

  it('ui/payments.js never writes the retired keys (source pin)', () => {
    // The scrub REMOVES them; nothing may setItem them back.
    const writes = [...paymentsJs.matchAll(/localStorage\.setItem\(([A-Z_]+)/g)].map(m => m[1]);
    expect(writes).toEqual(['FACET_KEY']);
  });
});
