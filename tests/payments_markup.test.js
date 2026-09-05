// 8ball / tests / payments_markup.test.js
//
// The SURFACE suite for the one commerce seam that exists. This file was
// the v0.3.0 paid-surface markup suite, became the FREE-surface suite at
// the free amendment (doctrine v0.71, 2026-09-02 — storefront retired),
// and under doctrine v0.81 (2026-09-05) pins the model that replaced it:
// the COMPLETE SINGLE SHEET is free and unlimited for every device, and
// the DYAD is the one paid surface — USD $3 once, permanent, unlimited,
// granted only by a signed access token (tests/dyad_entitlement.test.js
// drives the token itself). The filename stays for lineage (and so the §7
// stage list keeps naming a payments leg).
//
// Scope:
//   1. absence guards      — the v0.71 deletions STAY deleted: no paywall,
//                            no lock icon, no retired product slug, no
//                            unsigned ?paid= handler, no price string
//                            anywhere except the declared dyad offer copy
//   2. the resolver        — getRenderTier answers t3 (the complete single
//                            sheet) for every device, storage consulted
//                            never; t5 only after a verified token
//   3. boot scrub          — the three retired commerce keys leave the
//                            device (read-verified, surgical, fail-safe);
//                            the entitlement key is NOT among them
//   4. status banner       — reveal/fade/hide behavior, no default copy
//   5. disclosure          — the about modal states the free sheet, the
//                            paid dyad, the processor boundary, the key
//   6. retired exports     — the old checkout API cannot quietly return

import { afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as paymentsUI from '../ui/payments.js';
import {
  CREDITS_KEY,
  DYAD_KEY,
  FACET_KEY,
  PENDING_KEY,
  PROFILE_SAVE_STORAGE_MESSAGE,
  DYAD_FILED_MESSAGE, DYAD_REJECTED_MESSAGE, DYAD_STORAGE_MESSAGE, DYAD_ALREADY_FILED_MESSAGE,
  TIER_KEY,
  getRenderTier,
  initStatusBanner,
  scrubRetiredCommerceKeys,
  showStatusBanner,
} from '../ui/payments.js';
import { DYAD_OFFER_COPY } from '../ui/dyad.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf-8');
const paymentsJs = readFileSync(join(root, 'ui', 'payments.js'), 'utf-8');

// Every source file the product SERVES: the host page, every ui module
// and stylesheet, every core module, every content batch — and README.md,
// which netlify publishes on the production origin (pr229 audit HIGH:
// commerce copy survived there while every guard looked elsewhere).
function shippedSources() {
  const files = [
    ['index.html', html],
    ['README.md', readFileSync(join(root, 'README.md'), 'utf-8')],
  ];
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

const stripComments = src => src
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

describe('the v0.71 deletions stay deleted — the dyad offer is the only commerce surface', () => {
  it('no shipped source carries a retired product slug', () => {
    for (const [name, src] of shippedSources()) {
      expect(src, name).not.toMatch(/xjpvp|neysyv|rzqezp/);
    }
  });

  it('the only price string in shipped CODE is the declared dyad offer, in exactly the files that carry it', () => {
    // `$3` appears in DYAD_OFFER_COPY.head (ui/dyad.js) and in the about
    // modal's disclosure sentence (index.html). README.md is served on the
    // production origin too and may state the price in prose. Nowhere else
    // — and no other price: $1 / $2 / $6 / $9 are the retired ladder.
    const priced = {};
    for (const [name, src] of shippedSources()) {
      const hits = stripComments(src).match(/\$\d+/g) || [];
      if (hits.length) priced[name] = hits;
    }
    expect(priced).toEqual({
      'index.html': ['$3'],
      'README.md': ['$3'],
      'ui/dyad.js': ['$3'],
    });
    expect(DYAD_OFFER_COPY.head).toBe('dyad · $3 once');
  });

  it('the payment processor is named only where the §5.B disclosure requires it', () => {
    // The about modal, the offer note and README name Gumroad as the
    // processor and the data boundary (§5.B disclosure). core/ holds the
    // configurable Buy Link constant. No content batch, no other module.
    const naming = shippedSources().filter(([, src]) => /gumroad/i.test(src)).map(([n]) => n).sort();
    expect(naming).toEqual(['README.md', 'core/entitlement.js', 'index.html', 'ui/dyad.js']);
  });

  it('the commerce ids and classes of the retired storefront are gone from the host page', () => {
    for (const token of ['paywall', 'card-lock-icon', 'lock-icon', 'offer-btn',
      'modal-cta', 'paid-banner', 'specimen-entry']) {
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

  it('the host page handles no unsigned ?paid= return and stages no purchase', () => {
    // The retired parameter is named ONLY in core/entitlement.js, where it
    // is recognised to be stripped; index.html never spells it.
    expect(html).not.toMatch(/[?'"&]paid\b/);
    expect(html).not.toMatch(/stagePurchase|handlePaidReturn|openPaywall|openPurchase|applyPaidReturn/);
  });

  it('no subscription, credit, counter or ladder vocabulary reaches the rendered page', () => {
    const rendered = stripComments(html);
    expect(rendered).not.toMatch(/\bcredits?\b/i);
    expect(rendered).not.toMatch(/\bt1\b|\bt2\b|\bt4\b|ladder/);
    expect(rendered).not.toMatch(/everything is free|three free|\btries\b|\$6|\$9/);
    expect(rendered).not.toMatch(/subscribe/);
    expect(rendered).not.toMatch(/compatib|soulmate|percent|\d+%/i);
  });
});

// ── 2. the resolver ───────────────────────────────────────────────

describe('the resolver — the complete single sheet for every device; the dyad only on a verified token', () => {
  it('returns t3 with no storage at all', () => {
    delete globalThis.localStorage;
    expect(getRenderTier()).toBe('t3');
  });

  it('returns t3 whatever a legacy device has stored — an unsigned-era t5 grants nothing', () => {
    for (const stored of ['t1', 't2', 't3', 't4', 't5', 'free', 'garbage', '']) {
      globalThis.localStorage = mockStorage({ [TIER_KEY]: stored });
      expect(getRenderTier(), `stored ${JSON.stringify(stored)}`).toBe('t3');
    }
  });

  it('a hand-written entitlement value grants nothing either — the key holds a token that must verify', () => {
    for (const forged of ['true', 't5', '1', 'dyad', '{"entitled":true}', 'x.y']) {
      globalThis.localStorage = mockStorage({ [DYAD_KEY]: forged });
      expect(getRenderTier(), `forged ${forged}`).toBe('t3');
    }
  });

  it('never reads or writes storage — the resolver reads the boot-settled flag (source pin)', () => {
    const fn = paymentsJs.match(/export function getRenderTier\(\) \{([\s\S]*?)\n\}/);
    expect(fn, 'getRenderTier missing from ui/payments.js').not.toBeNull();
    expect(fn[1]).not.toMatch(/localStorage/);
    expect(fn[1]).toMatch(/return _dyadEntitled \? 't5' : 't3';/);
  });

  it('t3 is the complete single sheet — nothing the v0.71 ceiling opened is re-sealed', async () => {
    const { coordsForTier, tierDensitySummary } = await import('../ui/tiers.js');
    const t3 = coordsForTier('t3');
    for (const key of ['arcana', 'sun', 'rising', 'moon', 'element', 'animal', 'innerAnimal',
      'lifePath', 'numerology', 'numbers2', 'dayPillar', 'hourPillar', 'cardEntry', 'publicRead']) {
      expect(t3.has(key), key).toBe(true);
    }
    expect(tierDensitySummary('t3')).toEqual(tierDensitySummary('t5'));
    expect(tierDensitySummary('t3').sealed).toBe(0);
  });

  it('the boot path settles entitlement BEFORE the first render and strips the retired parameter (index.html wiring)', () => {
    const bootFn = html.match(/async function boot\(\) \{([\s\S]*?)\n\}\n\nboot\(\);/);
    expect(bootFn, 'async boot() not found').not.toBeNull();
    const body = bootFn[1];
    expect(body).toMatch(/await resolveDyadEntitlement\(\{ returnToken \}\)/);
    expect(body.indexOf('await resolveDyadEntitlement')).toBeLessThan(body.indexOf('loadSavedProfile()'));
    expect(body.indexOf('await resolveDyadEntitlement')).toBeLessThan(body.indexOf('primeUnsealBaseline'));
    expect(body).toMatch(/hasLegacyPaidParam\(search\)/);
    expect(body).toMatch(/DYAD_REJECTED_MESSAGE/);
    expect(body).toMatch(/DYAD_FILED_MESSAGE/);
    expect(body).toMatch(/DYAD_STORAGE_MESSAGE/);
    // pr242 audit (Lane B M1): an entitled device opening a bad link is told
    // the link failed AND that nothing was lost — never the bare rejection.
    expect(body).toMatch(/entitlement\.granted \? DYAD_ALREADY_FILED_MESSAGE : DYAD_REJECTED_MESSAGE/);
    // pr242 audit (Lane A LOW-1): the url is read ONCE, before the `?sent=1`
    // handler strips the whole query — boot never reads location.search itself
    expect(html.indexOf('const bootSearch = window.location.search;')).toBeGreaterThan(-1);
    expect(html.indexOf('const bootSearch = window.location.search;')).toBeLessThan(html.indexOf("get('sent') === '1'"));
    expect(body).toMatch(/const search = bootSearch;/);
    expect(body).not.toMatch(/window\.location\.search/);
    // pr242 audit (Lane A LOW-2 / M25): a verified link that could not be
    // stored is KEPT for the retry — as exactly `?dyad=<token>`, the retired
    // parameter beside it stripped
    expect(body).toMatch(/const keepUrl = returnToken !== null && entitlement\.granted\s*&& entitlement\.source === 'return' && !entitlement\.stored;/);
    expect(body).toMatch(/keepUrl\s*\? `\$\{window\.location\.pathname\}\?dyad=\$\{encodeURIComponent\(returnToken\)\}`\s*: window\.location\.pathname/);
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

  it('leaves the dyad entitlement key alone — a purchase is never scrubbed', () => {
    globalThis.localStorage = mockStorage({ [DYAD_KEY]: 'a.b', [TIER_KEY]: 't5' });
    expect(scrubRetiredCommerceKeys()).toBe(true);
    expect(globalThis.localStorage.getItem(DYAD_KEY)).toBe('a.b');
    expect(globalThis.localStorage.getItem(TIER_KEY)).toBe(null);
    expect(paymentsJs).toMatch(/const keys = \[PENDING_KEY, TIER_KEY, CREDITS_KEY\];/);
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

  it('the three access-link outcomes have plain filing copy — no celebration, no upsell', () => {
    for (const msg of [DYAD_FILED_MESSAGE, DYAD_REJECTED_MESSAGE, DYAD_STORAGE_MESSAGE, DYAD_ALREADY_FILED_MESSAGE]) {
      expect(msg).toMatch(/^[a-z]/);
      expect(msg).not.toMatch(/!|buy|purchase|unlock|congrat|welcome/i);
    }
    expect(DYAD_REJECTED_MESSAGE).toMatch(/nothing was filed/);
    expect(DYAD_ALREADY_FILED_MESSAGE).toMatch(/already filed on this device/);
  });

  it('the save-failure message dropped its purchase clause and both save sites use it', () => {
    expect(PROFILE_SAVE_STORAGE_MESSAGE).toBe('reading not saved — allow local storage to reopen it later.');
    expect(PROFILE_SAVE_STORAGE_MESSAGE).not.toMatch(/purchase|buy|pay/i);
    const sites = html.match(/showStatusBanner\(PROFILE_SAVE_STORAGE_MESSAGE\)/g) || [];
    expect(sites.length).toBe(2);
  });
});

// ── 5. the disclosure ─────────────────────────────────────────────

describe('disclosure — the about modal states the free sheet, the paid dyad and the boundary', () => {
  const aboutStart = html.indexOf('id="about-modal"');
  const aboutSubtree = html.slice(aboutStart, html.indexOf('</div>', html.indexOf('modal-actions', aboutStart)));

  it('the about modal exists and opens the commerce paragraph with "the sheet is free"', () => {
    expect(aboutStart).toBeGreaterThan(-1);
    expect(aboutSubtree).toMatch(/the sheet is free\./);
    expect(aboutSubtree).not.toMatch(/everything is free/);
  });

  it('names the whole free surface: sheet, meanings, written entry, domain fit, unlimited', () => {
    expect(aboutSubtree).toMatch(/all sixteen coordinates/);
    expect(aboutSubtree).toMatch(/their meanings/);
    expect(aboutSubtree).toMatch(/written card entry/);
    expect(aboutSubtree).toMatch(/domain fit/);
    expect(aboutSubtree).toMatch(/as many readings as you like/);
  });

  it('names the dyad as the one paid surface with its price, permanence and what it is — in the OPEN paragraph, hidden until a build is configured', () => {
    expect(aboutSubtree).toMatch(/<p id="about-dyad-open" hidden>the dyad — a second complete sheet read beside yours, with the relation layer between them — is the one paid surface: \$3 once, permanent, unlimited\./);
    expect(aboutSubtree).not.toMatch(/paired read is there for any two dates/);
  });

  it('while unconfigured the visible paragraph names no price and no processor — the page never advertises a checkout it cannot honour (pr242 audit, Lane A HIGH-1)', () => {
    const closed = aboutSubtree.match(/<p id="about-dyad-closed">([\s\S]*?)<\/p>/);
    expect(closed).not.toBeNull();
    expect(closed[1]).not.toMatch(/\$\d|gumroad|checkout|once/);
    expect(closed[1]).toMatch(/is the one part of 8ball that is not free, and it is not on sale on this build/);
    expect(closed[1]).toMatch(/nothing about the second person is ever saved/);
  });

  it('the forget-device copy says what stays: a filed dyad access (pr242 audit, Lane A MED-3)', () => {
    const forget = html.match(/<p id="forget-copy">([\s\S]*?)<\/p>/);
    expect(forget).not.toBeNull();
    expect(forget[1]).toMatch(/a filed dyad access stays on this device — it is a purchase, not paperwork\./);
  });

  it('negates the retired shapes in one breath — subscription, account, counter', () => {
    expect(aboutSubtree).toMatch(/no subscription, no 8ball account, no counter/);
    const matches = aboutSubtree.match(/subscription/g) || [];
    const negated = aboutSubtree.match(/no subscription/g) || [];
    expect(matches.length).toBe(negated.length);
  });

  it('states the §5.B boundary: processor named, payment + email stay there, the second person is never saved', () => {
    expect(aboutSubtree).toMatch(/checkout is on gumroad, which keeps the payment and your email/);
    // pr242 audit (Lane B M2): delivery of the link is the OPERATOR's step,
    // said so — never phrased as something the system does.
    expect(aboutSubtree).toMatch(/after purchase the operator sends an access link to that email/);
    expect(aboutSubtree).not.toMatch(/link sent to that email files/);
    expect(aboutSubtree).toMatch(/nothing about the second person is ever saved/);
  });

  it('honors prior buyers without a checkout for the sheet they bought', () => {
    expect(aboutSubtree).toMatch(/devices that bought a rung while the sheet was paid keep everything they had; the sheet they bought is free for everyone now/);
  });

  it('keeps the on-device data boundary and source visibility disclosures', () => {
    expect(aboutSubtree).toMatch(/nothing leaves your device on its own/);
    expect(aboutSubtree).toMatch(/the deck is visible in source\./);
  });

  it('contains "calculator-grade"', () => {
    expect(aboutSubtree).toMatch(/calculator-grade/);
  });

  it('the stored-locally list names the entitlement token and no paid rung', () => {
    expect(aboutSubtree).toMatch(/inputs, the show-labels toggle, readings you choose to save, and — once filed — the dyad access token are stored locally/);
    expect(aboutSubtree).not.toMatch(/rung.*stored locally/);
  });

  it('carries no compatibility, score, prediction or advice framing anywhere on the page', () => {
    expect(stripComments(html)).not.toMatch(/compatib|soulmate|harmony score|predict|advice/i);
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

  it('ui/payments.js writes exactly the facet key and the entitlement key — never a retired key', () => {
    // The scrub REMOVES the retired keys; nothing may setItem them back. The
    // one write v0.81 adds is the verified token, after verification only.
    const writes = [...paymentsJs.matchAll(/localStorage\.setItem\(([A-Z_]+)/g)].map(m => m[1]).sort();
    expect(writes).toEqual(['DYAD_KEY', 'FACET_KEY']);
    const storeFn = paymentsJs.match(/function storeDyadToken\(token\) \{([\s\S]*?)\n\}/);
    expect(storeFn).not.toBeNull();
    const resolveFn = paymentsJs.match(/export async function resolveDyadEntitlement[\s\S]*?\n\}/)[0];
    // every storeDyadToken call sits inside a `verdict.ok` branch
    for (const m of resolveFn.matchAll(/storeDyadToken\(/g)) {
      const before = resolveFn.slice(0, m.index);
      expect(before.lastIndexOf('if (verdict.ok)')).toBeGreaterThan(before.lastIndexOf('returnReason = verdict.reason'));
    }
  });

  it('nothing in ui/payments.js ever removes the entitlement key (a purchase is permanent)', () => {
    expect(paymentsJs).not.toMatch(/removeItem\(DYAD_KEY\)/);
    expect(paymentsJs).not.toMatch(/removeItem\('eight_ball_dyad/);
  });
});
