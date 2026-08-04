// 8ball / tests / payments_markup.test.js
//
// v0.3.0 paid-surface markup + disclosure invariants (DOCTRINE §1
// v0.22 / §6 / brief §10.2). Forward-ports a subset of brief §11.2 from
// step 9 → step 7 per codex pre-merge audit hook 9 P1: bring
// markup/static or thin DOM smoke tests forward before piling on
// step 7 copy/UI work.
//
// Scope (step-7 forward port; v0.55 ownership re-pins):
//   1. lock_icon_markup        — DOM existence
//   2. paywall_modal_markup    — DOM existence + Gumroad Buy Link shape +
//                                $1/$2/$3 ownership copy
//   3. reads_chip_retired      — the counter chip is gone (v0.55)
//   4. unlocked_render_markup  — DOM existence
//   5. paid_query_handler      — URL handling JS pattern (in ui/payments.js)
//   6. disclosure_in_about_modal + paywall_modal_disclosure — §10.3 copy
//
// Deferred to step 9 (the JS-pattern groups that scan across both
// index.html and ui/payments.js for state-machine wiring):
//   - pending_profile_write
//   - pending_profile_consume
//   - try_another_behavior
//   - profile_animal_field

import { afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as paymentsUI from '../ui/payments.js';
import {
  CREDITS_KEY,
  PAID_SUCCESS_MESSAGE,
  PENDING_KEY,
  PROFILE_SAVE_STORAGE_MESSAGE,
  PURCHASE_STORAGE_MESSAGE,
  RETURN_STORAGE_MESSAGE,
  TIER_KEY,
  clearPendingProfile,
  getCredits,
  handlePaidReturn,
  initPaywallUI,
  setTier,
  showPaidBanner,
  stagePurchase,
} from '../ui/payments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const paymentsJs = readFileSync(
  join(__dirname, '..', 'ui', 'payments.js'),
  'utf-8'
);
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  vi.useRealTimers();
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  vi.restoreAllMocks();
});

// ── helper: extract a modal subtree by id ──
function modalSubtree(id) {
  const re = new RegExp(`id="${id}"[\\s\\S]*?<\\/div>\\s*<\\/div>\\s*<\\/div>`);
  const m = html.match(re);
  if (!m) throw new Error(`subtree for #${id} not found`);
  return m[0];
}

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
  initPaywallUI({
    modal: makeElement(),
    closeBtn: makeElement(),
    banner,
  });
  return banner;
}

const mk = (n, d) => ({ name: n, dob: d });

describe('paid-surface markup (DOCTRINE §1 v0.22 / §6)', () => {
  // 1. lock_icon_markup ──────────────────────────────────────────────
  it('lock-icon element exists with id and SVG', () => {
    expect(html).toMatch(/id="card-lock-icon"/);
    const m = html.match(/id="card-lock-icon"[\s\S]*?<\/(?:span|div)>/);
    expect(m, 'card-lock-icon subtree not found').not.toBeNull();
    expect(m[0]).toMatch(/<svg[\s\S]*?<\/svg>/);
  });

  // 2. paywall_modal_markup ─────────────────────────────────────────
  it('paywall modal element exists with required attributes', () => {
    expect(html).toMatch(/id="paywall-modal"/);
    const subtree = modalSubtree('paywall-modal');
    expect(subtree).toMatch(/aria-hidden="true"/);
  });

  it('paywall CTA is a Gumroad Buy Link (v0.3.0.3)', () => {
    const subtree = modalSubtree('paywall-modal');
    expect(subtree).toMatch(
      /href="https:\/\/[a-z0-9-]+\.gumroad\.com\/l\/[a-z0-9]+"/
    );
  });

  it('sprint paywall carries exactly one Gumroad CTA — the t3 complete offer (v0.56)', () => {
    // Gumroad Buy Link redirect mechanism (DOCTRINE §5.B Call 2 v0.36 as
    // repriced v0.55). The 14-day sprint presentation (§4.B v0.56,
    // 2026-07-26 → 2026-08-08) narrows the buyer-facing surface to ONE
    // purchase choice: the existing t3 product on its existing URL. The
    // t1/t2 products, their ?paid= return handling, and stored-tier
    // rendering all stay live — only the modal's choice set narrows.
    // Locks the exact product URL and the bare-URL shape — guards against
    // accidental UTM tag addition / tracking param leakage and against a
    // rung→product mismatch.
    const subtree = modalSubtree('paywall-modal');
    const ctaRe = /<a class="modal-cta" id="paywall-cta-(t[123])" href="([^"]+)"/g;
    const ctas = {};
    let m;
    while ((m = ctaRe.exec(subtree)) !== null) ctas[m[1]] = m[2];
    expect(ctas).toEqual({
      t3: 'https://theeightball.gumroad.com/l/xjpvp',
    });
    for (const href of Object.values(ctas)) {
      expect(href, 'Buy Link hrefs must stay bare — no query string').not.toMatch(/[?&]/);
    }
    // No buyer-facing t1/t2 choice anywhere in the modal — ids and product
    // URLs alike (the rungs stay purchasable and honored, just not offered).
    expect(subtree).not.toMatch(/paywall-cta-t1|paywall-cta-t2/);
    expect(subtree).not.toMatch(/rzqezp|neysyv/);
  });

  it('offer copy: the single CTA names the $3 price, the complete contents, no other price (v0.56)', () => {
    const subtree = modalSubtree('paywall-modal');
    const t3 = subtree.match(/id="paywall-cta-t3"[^>]*>([^<]+)<\/a>/)[1];
    expect(t3).toContain('$3');
    expect(t3).toMatch(/every coordinate/);
    expect(t3).toMatch(/written card/); // t3 carries the content unlock
    // Exactly one dollar figure on the CTA (guards a partial re-label).
    const priceOf = text => (text.match(/\$(\d+)/g) || []).join(',');
    expect(priceOf(t3)).toBe('$3');
    // §2 voice: no destiny/unlock-your-X language on the offer.
    expect(t3).not.toMatch(/destiny|fate|secret|reveal your/i);
  });

  it('paywall title and body carry the single-offer ownership framing (v0.56)', () => {
    const subtree = modalSubtree('paywall-modal');
    expect(subtree).toMatch(/complete your sheet · \$3 once/);
    expect(subtree).toMatch(/adds 10 coordinates, their meanings, the written card, domain fit, and the kua line/);
    expect(subtree).toMatch(/for every reading in this browser/);
    expect(subtree).toMatch(/\$3 once · no subscription · no 8ball account/);
    expect(subtree).toMatch(/aria-describedby="paywall-value paywall-facts paywall-disclosure"/);
    expect(subtree).not.toMatch(/permanent|yours for good/i);
    // The metered framing is gone: no tries, no reads-count promises.
    expect(subtree).not.toMatch(/three tries/);
    expect(subtree).not.toMatch(/three more reads/);
  });

  it('specimen preview is a labeled fixed example, never the visitor result (v0.56)', () => {
    const subtree = modalSubtree('paywall-modal');
    // The preview demonstrates the complete result before checkout: the
    // complete-sheet image plus the written entry for the SAME fixed
    // catalog cell (no. v = aries × dragon), rendered from the public
    // deck bundle (§5.C posture) — never derived from the visitor.
    expect(subtree).toMatch(/id="paywall-specimen"/);
    expect(subtree).toMatch(/an example, not your sheet/);
    expect(subtree).toMatch(/src="\/cards\/spec_no-v\.jpg"/);
    for (const id of ['specimen-entry-name', 'specimen-entry-type', 'specimen-entry-habit', 'specimen-entry-note']) {
      expect(subtree).toContain(`id="${id}"`);
    }
    expect(subtree).toMatch(/your sheet files your own coordinates/);
    // The entry slots ship EMPTY in static markup — content strings stay in
    // content/cards.v1.full.js (§4), filled at boot from the deck import.
    expect(subtree).toMatch(/<span id="specimen-entry-name"><\/span>/);
    expect(paymentsJs).toMatch(/CARDS\.aries && CARDS\.aries\.dragon/);
    // The preview image URL is same-origin-relative and bare.
    const src = subtree.match(/src="([^"]+)"/)[1];
    expect(src.startsWith('/cards/')).toBe(true);
    expect(src).not.toMatch(/[?&]/);
  });

  it('result-rail offer control mirrors the lock icon: present, priced, one staging path (v0.56)', () => {
    // The offer button is a second presentation of the SAME Path B
    // trigger (stage pending profile → open paywall) — hidden markup
    // default; renderCard shows it below t3 and hides it at t3, the
    // lock icon visibility rule.
    const m = html.match(/<button([^>]*id="offer-btn"[^>]*)>([\s\S]*?)<\/button>/);
    expect(m, 'offer button not found').not.toBeNull();
    expect(m[1]).toMatch(/\bhidden\b/);
    expect(m[2]).toContain('$3');
    expect(html).toMatch(/offerBtn\.hidden = cardEntry/);
    expect(html).toMatch(/offerBtn\.addEventListener\(\s*['"]click['"]\s*,\s*openPurchase\s*\)/);
  });

  // 3. reads chip — RETIRED (v0.55: no counter exists to display) ───
  it('the reads chip is fully retired — markup, CSS, and wiring', () => {
    expect(html).not.toMatch(/reads-chip/);
    expect(html).not.toMatch(/readsChip/);
    expect(html).not.toMatch(/reads left/);
  });

  // 3b. v0.6.1 card geometry — growable flip stack ──────────────────

  it('flip faces are grid-stacked so the card can grow at t3 (v0.6.1)', () => {
    const inner = html.match(/\.flip-inner\s*\{([\s\S]*?)\}/);
    expect(inner, '.flip-inner CSS block not found').not.toBeNull();
    expect(inner[1]).toMatch(/display:\s*grid/);
    expect(inner[1]).not.toMatch(/position:\s*absolute/);
    const side = html.match(/\.flip-side\s*\{([\s\S]*?)\}/);
    expect(side, '.flip-side CSS block not found').not.toBeNull();
    expect(side[1]).toMatch(/grid-area:\s*1 \/ 1/);
    expect(side[1]).not.toMatch(/position:\s*absolute/);
  });

  // 3c. v0.7.0 compartment card — seal system tokens ────────────────
  it('the locked-extras bars are fully retired (v0.7.0 seal system supersedes)', () => {
    expect(html).not.toMatch(/locked-extras/);
  });

  it('compartment cells and seal layers are present (v0.7.0)', () => {
    expect((html.match(/class="coord-cell"/g) || []).length).toBe(14);
    // 14 cell seals + 1 written-entry block seal.
    // 14 cells + the t3 entry block + the t4 public block (§1.D v0.58).
    expect((html.match(/class="coord-seal"/g) || []).length).toBe(16);
    expect(html).toMatch(/id="card-entry"/);
  });

  it('seal treatment is the single root token .card.seal-hatch with one gradient (F1)', () => {
    expect(html).toMatch(/class="card seal-hatch"/);
    expect(html).toMatch(/\.card\.seal-hatch \.coord-seal/);
    // The hatch gradient is defined exactly once — swapping treatment
    // later (bars/stamp) must stay a single-token change.
    expect((html.match(/repeating-linear-gradient/g) || []).length).toBe(1);
  });

  // 4. unlocked_render_markup ───────────────────────────────────────
  it('unlocked-render slots exist (card-name / card-type / card-habit / card-note)', () => {
    expect(html).toMatch(/id="card-name"/);
    expect(html).toMatch(/id="card-type"/);
    expect(html).toMatch(/id="card-habit"/);
    expect(html).toMatch(/id="card-note"/);
  });

  it('paid-return banner exists hidden-by-default with exact ownership copy', () => {
    const m = html.match(/<div([^>]*id="paid-banner"[^>]*)>([\s\S]*?)<\/div>/);
    expect(m, 'paid-banner element not found').not.toBeNull();
    expect(m[1]).toMatch(/\bhidden\b/);
    expect(m[2].trim()).toBe(PAID_SUCCESS_MESSAGE);
  });

  // 5. paid_query_handler (URL handling lives in ui/payments.js) ────
  it('handlePaidReturn reads ?paid via URLSearchParams', () => {
    expect(paymentsJs).toMatch(/URLSearchParams\(window\.location\.search\)/);
    expect(paymentsJs).toMatch(/params\.get\(['"]paid['"]\)/);
  });

  it('handlePaidReturn calls applyPaidReturn from core', () => {
    expect(paymentsJs).toMatch(/applyPaidReturn\(/);
  });

  it('handlePaidReturn strips query via replaceState to pathname (not hard-coded /)', () => {
    expect(paymentsJs).toMatch(
      /history\.replaceState\([^)]*window\.location\.pathname[^)]*\)/
    );
    // Defensive: no hard-coded `'/'` second-arg in the replaceState call.
    // Comments may discuss the rejected shape; we only forbid it inside
    // the actual replaceState call.
    expect(paymentsJs).not.toMatch(/replaceState\([^)]*['"]\/['"]\s*\)/);
  });
});

describe('paid-return banner behavior', () => {
  it('showPaidBanner reveals, fades, then hides the banner', () => {
    vi.useFakeTimers();
    const banner = installPaywallUI();

    showPaidBanner();

    expect(banner.textContent).toBe(PAID_SUCCESS_MESSAGE);
    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains('visible')).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains('visible')).toBe(false);

    vi.advanceTimersByTime(600);
    expect(banner.hidden).toBe(true);
  });

  it('showPaidBanner can surface storage recovery in the same live region', () => {
    vi.useFakeTimers();
    const banner = installPaywallUI();
    showPaidBanner(RETURN_STORAGE_MESSAGE);
    expect(banner.textContent).toBe(RETURN_STORAGE_MESSAGE);
    expect(banner.classList.contains('visible')).toBe(true);
  });

  it('handlePaidReturn shows the banner and persists exactly the tier (v0.55)', () => {
    vi.useFakeTimers();
    const banner = installPaywallUI();
    const pending = mk('Paid Path', '1999-09-09');
    const storage = makeStorage({
      [CREDITS_KEY]: '0',
      [PENDING_KEY]: JSON.stringify(pending),
    });
    const replaceState = vi.fn();
    globalThis.localStorage = storage;
    globalThis.window = {
      location: { search: '?paid=t1', pathname: '/return' },
      history: { replaceState },
    };
    const onConsume = vi.fn();

    const consumed = handlePaidReturn(onConsume);

    expect(consumed).toBe(true);
    expect(onConsume).toHaveBeenCalledWith(pending);
    expect(storage.snapshot()).toMatchObject({
      [TIER_KEY]: 't1',
      [CREDITS_KEY]: '0', // no grant, no decrement — the write IS the tier
    });
    expect(storage.snapshot()).not.toHaveProperty(PENDING_KEY);
    expect(storage.snapshot()).not.toHaveProperty('eight_ball_tries_used_v1');
    expect(replaceState).toHaveBeenCalledWith({}, '', '/return');
    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains('visible')).toBe(true);
  });

  it('handlePaidReturn ignores non-paid loads and leaves the banner hidden', () => {
    const banner = installPaywallUI();
    globalThis.localStorage = makeStorage();
    globalThis.window = {
      location: { search: '', pathname: '/' },
      history: { replaceState: vi.fn() },
    };

    expect(handlePaidReturn()).toBe(false);
    expect(banner.hidden).toBe(true);
    expect(banner.classList.contains('visible')).toBe(false);
  });
});

describe('verified purchase storage boundary', () => {
  it('read-verifies pending state before opening checkout', () => {
    vi.useFakeTimers();
    const banner = makeElement();
    const modal = makeElement();
    initPaywallUI({ modal, closeBtn: makeElement(), banner });
    const storage = makeStorage();
    globalThis.localStorage = storage;
    const pending = mk('Prepared Buyer', '1990-01-01');
    expect(stagePurchase(pending)).toBe(true);
    expect(JSON.parse(storage.snapshot()[PENDING_KEY])).toEqual(pending);
    expect(modal.classList.contains('open')).toBe(true);
  });

  it('blocks checkout and explains recovery when the pending write is a no-op', () => {
    vi.useFakeTimers();
    const banner = makeElement();
    const modal = makeElement();
    initPaywallUI({ modal, closeBtn: makeElement(), banner });
    const storage = makeStorage();
    storage.setItem = vi.fn();
    globalThis.localStorage = storage;
    expect(stagePurchase(mk('No Storage', '1990-01-01'))).toBe(false);
    expect(modal.classList.contains('open')).toBe(false);
    expect(banner.textContent).toBe(PURCHASE_STORAGE_MESSAGE);
  });

  it('keeps tier grants monotonic and verifies pending cleanup', () => {
    const pending = mk('Cleanup Buyer', '1990-01-01');
    const storage = makeStorage({ [TIER_KEY]: 't3', [PENDING_KEY]: JSON.stringify(pending) });
    globalThis.localStorage = storage;
    expect(setTier('t1')).toBe(true);
    expect(storage.snapshot()[TIER_KEY]).toBe('t3');
    expect(clearPendingProfile()).toBe(true);
    expect(storage.snapshot()).not.toHaveProperty(PENDING_KEY);
  });
});

describe('retained t1/t2 ownership — the sprint presentation never touches entitlement (v0.56)', () => {
  // The buyer-facing modal offers only t3 during the sprint, but the t1/t2
  // return paths and stored tiers are load-bearing compatibility surfaces:
  // every existing buyer keeps exactly the access they own.

  it('a ?paid=t2 return still persists tier t2 (no CTA required to honor a purchase)', () => {
    installPaywallUI();
    const storage = makeStorage();
    globalThis.localStorage = storage;
    globalThis.window = {
      location: { search: '?paid=t2', pathname: '/' },
      history: { replaceState: vi.fn() },
    };

    handlePaidReturn();
    expect(storage.snapshot()).toMatchObject({ [TIER_KEY]: 't2' });
  });

  it('a stored t1 device buying the t3 complete offer upgrades monotonically', () => {
    installPaywallUI();
    const storage = makeStorage({ [TIER_KEY]: 't1' });
    globalThis.localStorage = storage;
    globalThis.window = {
      location: { search: '?paid=t3', pathname: '/' },
      history: { replaceState: vi.fn() },
    };

    handlePaidReturn();
    expect(storage.snapshot()).toMatchObject({ [TIER_KEY]: 't3' });
  });

  it('a stored t2 device replaying a t1 URL is never downgraded', () => {
    installPaywallUI();
    const storage = makeStorage({ [TIER_KEY]: 't2' });
    globalThis.localStorage = storage;
    globalThis.window = {
      location: { search: '?paid=t1', pathname: '/' },
      history: { replaceState: vi.fn() },
    };

    handlePaidReturn();
    expect(storage.snapshot()).toMatchObject({ [TIER_KEY]: 't2' });
  });
});

describe('legacy-credit storage wrapper (read-only R2 signal, v0.55)', () => {
  it('getCredits clamps corrupt stored legacy values to safe zero', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: '-5' });
    expect(getCredits()).toBe(0);
  });

  it('getCredits floors fractional stored legacy values', () => {
    globalThis.localStorage = makeStorage({ [CREDITS_KEY]: '2.9' });
    expect(getCredits()).toBe(2);
  });

  it('the counter mutation surface is retired — no setter or tries accessor exports', () => {
    expect(paymentsUI.setCredits).toBeUndefined();
    expect(paymentsUI.getTriesUsed).toBeUndefined();
    expect(paymentsUI.setTriesUsed).toBeUndefined();
    expect(paymentsUI.TRIES_KEY).toBeUndefined();
  });

  it('ui/payments.js never writes the credits or retired tries keys (source pin)', () => {
    // The bare CREDITS_KEY string must survive for the privacy scan and
    // the R2 read, but no setItem against it may exist; the tries key
    // string must be gone from executable source entirely (a comment
    // documenting the retirement is fine — the scan resolves calls).
    expect(paymentsJs).not.toMatch(/setItem\(\s*CREDITS_KEY/);
    expect(paymentsJs).not.toMatch(/const TRIES_KEY/);
    expect(paymentsJs).not.toMatch(/setItem\([^)]*tries/i);
  });

  it('handlePaidReturn leaves corrupt legacy credits exactly as it found them', () => {
    installPaywallUI();
    const storage = makeStorage({ [CREDITS_KEY]: '-5' });
    globalThis.localStorage = storage;
    globalThis.window = {
      location: { search: '?paid=t3', pathname: '/return' },
      history: { replaceState: vi.fn() },
    };

    expect(handlePaidReturn()).toBe(false);
    expect(storage.snapshot()).toMatchObject({
      [CREDITS_KEY]: '-5', // untouched garbage — reads clamp, writes never happen
      [TIER_KEY]: 't3',
    });
  });
});

describe('disclosure copy (DOCTRINE §4 v0.22 / brief §10.3)', () => {
  // 6a. disclosure_in_about_modal ───────────────────────────────────
  // The about-modal subtree must contain every disclosure the brief
  // names (§10.3). Substrings are case-insensitive where the brief
  // permits, exact otherwise.

  const aboutSubtree = modalSubtree('about-modal');

  it('about-modal: contains "calculator-grade"', () => {
    expect(aboutSubtree).toMatch(/calculator-grade/);
  });

  it('about-modal: discloses the single sprint offer ("three dollars, once"), not the v0.55 ladder prices (§4.B v0.56)', () => {
    expect(aboutSubtree).toMatch(/three dollars, once/);
    expect(aboutSubtree).not.toMatch(/one, two, or three dollars/);
    expect(aboutSubtree).not.toMatch(/three, six, or nine dollars/);
  });

  it('about-modal: honors existing lower-rung ownership without presenting it as a current checkout choice (§4.B v0.56)', () => {
    expect(aboutSubtree).toMatch(/devices that already own a lower rung keep it/);
    expect(aboutSubtree).not.toMatch(/three paid rungs/);
  });

  it('about-modal: discloses the open free surface ("free and unlimited")', () => {
    expect(aboutSubtree).toMatch(/readings are free and unlimited, on the free sheet/);
    expect(aboutSubtree).not.toMatch(/first three readings are free/);
  });

  it('about-modal: names gumroad (case-insensitive)', () => {
    expect(aboutSubtree).toMatch(/gumroad/i);
  });

  it('about-modal: discloses on-device data boundary', () => {
    expect(aboutSubtree).toMatch(
      /your name, DOB, optional gender, and reading stay in this browser/
    );
  });

  it('about-modal: discloses source visibility ("the deck is visible in source")', () => {
    expect(aboutSubtree).toMatch(/the deck is visible in source/);
  });

  it('about-modal: discloses lock-as-convention framing', () => {
    expect(aboutSubtree).toMatch(/the lock is a convention, not a vault/);
  });

  it('about-modal: discloses what the offer buys and the browser-local boundary', () => {
    expect(aboutSubtree).toMatch(/opens the ten sealed coordinates, their meanings, the written card, domain fit, and the kua line for every reading in this browser/);
    expect(aboutSubtree).toMatch(/clearing this site's data removes that local record/);
    expect(aboutSubtree).not.toMatch(/three more reads/);
    expect(aboutSubtree).not.toMatch(/adds three more reads/);
  });

  it('about-modal: discloses the t3 written-entry ceiling and the stored rung (v0.55)', () => {
    expect(aboutSubtree).toMatch(/the written card/);
    expect(aboutSubtree).toMatch(/the paid rung/); // §5 storage disclosure
    expect(aboutSubtree).toMatch(/upgrades the stored access/);
    expect(aboutSubtree).toMatch(/without downgrading it/);
  });

  it('about-modal: conditional coordinates carry their input qualifiers (v0.6.0 absorb)', () => {
    // Rising needs birth time + place; the hour pillar needs birth time.
    // Both are paid-rung coordinates sold on the ladder, so the load-
    // bearing disclosure surface must carry the conditionality.
    expect(aboutSubtree).toMatch(/rising sign \(with birth time \+ place\)/);
    expect(aboutSubtree).toMatch(/hour pillar \(with birth time\)/);
  });

  it('free-card copy binds the free coordinates to DOB only (v0.6.0 absorb / §1.D v0.38)', () => {
    // All five free coordinates are DOB-derived — life path joined free as
    // the DOB-derived numerology number; the name enters the math at t1
    // (expression + soul urge). Meta + about must not overclaim.
    expect(aboutSubtree).toMatch(/five coordinates from your date of birth/);
    expect(html).not.toMatch(/[Ff]ive calibrated coordinates from your name/);
  });

  it('about-modal: word "subscription" only appears in the negation "no subscription"', () => {
    const occurrences = (aboutSubtree.match(/subscription/g) || []).length;
    const negations = (aboutSubtree.match(/no subscription/g) || []).length;
    expect(occurrences).toBe(negations);
  });

  // 6b. paywall_modal_disclosure ────────────────────────────────────
  const paywallSubtree = modalSubtree('paywall-modal');

  it('paywall modal contains .modal-disclosure element', () => {
    expect(paywallSubtree).toMatch(/class="modal-disclosure"/);
  });

  it('paywall modal disclosure names gumroad (case-insensitive)', () => {
    expect(paywallSubtree).toMatch(/gumroad/i);
  });

  it('paywall modal disclosure routes payment + email to Gumroad', () => {
    expect(paywallSubtree).toMatch(/gumroad handles payment and email/);
  });

  it('paywall modal disclosure keeps reading on-device', () => {
    expect(paywallSubtree).toMatch(/your name, birth data, optional gender, and reading stay in this browser/);
  });
});

describe('paid-surface JS wiring (brief §11.2, deferred from step 7)', () => {
  // pending_profile_write ────────────────────────────────────────────
  // Path B (lock icon click) must stage the stored profile via
  // setPendingProfile BEFORE openPaywall fires. Order matters: the
  // paid-return handler reads the pending profile from localStorage,
  // so it must exist on disk before the redirect. Path A (form submit
  // → show-paywall) is retired at v0.55: submits always render, so the
  // lock-tap is the ONLY paywall trigger left.

  it('stagePurchase read-verifies pending state before openPaywall (Path B)', () => {
    expect(html).toMatch(/stagePurchase\(loadSavedProfile\(\)\)/);
    const match = paymentsJs.match(/export function stagePurchase\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    expect(match, 'stagePurchase body not found').not.toBeNull();
    expect(match[1]).toMatch(/!setPendingProfile\(payload\)/);
    expect(match[1]).toMatch(/showPaidBanner\(PURCHASE_STORAGE_MESSAGE\)/);
    expect(match[1]).toMatch(/openPaywall\(\)/);
    // And the submit handler carries no paywall branch at all.
    expect(html).not.toMatch(/show-paywall/);
  });

  it('a failed saveProfile write is surfaced immediately, not discovered later at purchase time', () => {
    // Regression: the archive-reopen and form-submit call sites used to
    // discard saveProfile()'s read-verified boolean return. A blocked-
    // storage write (private browsing, quota) would then render a full
    // result as if nothing was wrong, and the failure would only surface
    // later — confusingly — when stagePurchase() correctly refused to
    // open the paywall on a profile it couldn't re-read. Both call sites
    // must now check the return and warn immediately instead.
    // (The third saveProfile call site, inside handlePaidReturn's
    // onConsumePending callback, is unrelated: handlePaidReturn already
    // checks that callback's return value itself — see ui/payments.js.)
    expect(html).toMatch(/if \(!saveProfile\(payload\.name, payload\.dob, payload\)\) showPaidBanner\(PROFILE_SAVE_STORAGE_MESSAGE\)/);
    expect(html).toMatch(/if \(!saveProfile\(name, dob, opts\)\) showPaidBanner\(PROFILE_SAVE_STORAGE_MESSAGE\)/);
  });

  it('the actual localStorage write for the pending profile lives in ui/payments.js', () => {
    // The bare-string write is in the module per the same-file
    // privacy_scan resolution pattern. index.html should call the
    // exported helper, not write to localStorage directly.
    expect(paymentsJs).toMatch(/localStorage\.setItem\(\s*PENDING_KEY/);
    expect(html).not.toMatch(
      /localStorage\.setItem\(\s*['"]eight_ball_pending_profile_v1['"]/
    );
  });

  // pending_profile_consume ──────────────────────────────────────────
  // handlePaidReturn must clear the pending key after consuming it
  // (or after a no-pending replay) — otherwise a paid round-trip
  // could re-fire on the next page load. The clear lives inside the
  // function body in ui/payments.js.

  it('clearPendingProfile is called inside handlePaidReturn', () => {
    const m = paymentsJs.match(
      /export function handlePaidReturn\([^)]*\)\s*\{([\s\S]*?)\n\}/
    );
    expect(m, 'handlePaidReturn body not found').not.toBeNull();
    expect(m[1]).toMatch(/clearPendingProfile\(\s*\)/);
  });

  // try_another_behavior ─────────────────────────────────────────────
  // β try-counting (test invariant per DOCTRINE §7 stage 6, not §-codified): tryAnotherBtn clears the
  // form DOM, NOT localStorage. Re-entering the same (name, dob)
  // remains idempotent. The "forget this device" path is the only
  // surface that calls clearProfile.

  it('tryAnotherBtn handler calls resetFormDisplay and NOT clearProfile', () => {
    const m = html.match(
      /tryAnotherBtn\.addEventListener\(\s*['"]click['"]\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/
    );
    expect(m, 'tryAnotherBtn click handler not found').not.toBeNull();
    expect(m[1]).toMatch(/resetFormDisplay\(\s*\)/);
    expect(m[1]).not.toMatch(/clearProfile\(\s*\)/);
  });

  // profile_animal_field ─────────────────────────────────────────────
  // The unlocked-render branch indexes the card deck by sun row × animal
  // column; the catalog driver uses `profile.animal`, the public year-
  // pillar animal. `profile.publicAnimal` was an earlier naming variant
  // and must not resurface — it would silently route to the wrong card.

  it('renderCard references profile.animal in the unlocked branch', () => {
    expect(html).toMatch(/sunCells\s*\?\s*sunCells\[\s*profile\.animal\s*\]/);
  });

  it('profile.publicAnimal is not referenced anywhere in index.html', () => {
    expect(html).not.toMatch(/profile\.publicAnimal/);
  });
});
