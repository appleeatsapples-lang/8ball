// 8ball / tests / payments_markup.test.js
//
// v0.3.0 paid-surface markup + disclosure invariants (DOCTRINE §1
// v0.22 / §6 / brief §10.2). Forward-ports a subset of brief §11.2 from
// step 9 → step 7 per codex pre-merge audit hook 9 P1: bring
// markup/static or thin DOM smoke tests forward before piling on
// step 7 copy/UI work.
//
// Scope (step-7 forward port):
//   1. lock_icon_markup        — DOM existence
//   2. paywall_modal_markup    — DOM existence + Gumroad Buy Link shape
//   3. credit_chip_markup      — DOM existence
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
import {
  CREDITS_KEY,
  PENDING_KEY,
  TRIES_KEY,
  handlePaidReturn,
  initPaywallUI,
  showPaidBanner,
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

// ── helper: extract a modal subtree by id (same shape as age_gate.test) ──
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

  it('paywall CTA points at the specific Gumroad product URL with no query string (v0.3.0.3)', () => {
    // Gumroad Buy Link redirect mechanism. Unlike the v0.3.0 LS path,
    // Gumroad does not accept a URL-encoded success_url query parameter
    // on the Buy Link href; post-purchase redirect to /?paid=t1 is
    // handled by the product's Content-tab Button on Gumroad's side
    // (single-source redirect, not belt-and-suspenders). Locks the
    // exact product URL and the bare-URL shape — guards against
    // accidental UTM tag addition / tracking param leakage.
    const subtree = modalSubtree('paywall-modal');
    expect(subtree).toMatch(
      /href="https:\/\/theeightball\.gumroad\.com\/l\/rzqezp"/
    );
  });

  // 3. credit_chip_markup ───────────────────────────────────────────
  it('reads-chip element exists', () => {
    expect(html).toMatch(/id="reads-chip"/);
  });

  it('no inline credit count hardcoded in markup', () => {
    // The chip should be empty in markup and populated by renderCard at
    // runtime — guards against a stale "3 reads left" baked into source.
    const m = html.match(/id="reads-chip"[^>]*>([\s\S]*?)<\/(?:span|div)>/);
    expect(m, 'reads-chip subtree not found').not.toBeNull();
    expect(m[1].trim()).toBe('');
  });

  // 4. unlocked_render_markup ───────────────────────────────────────
  it('unlocked-render slots exist (card-name / card-type / card-habit / card-note)', () => {
    expect(html).toMatch(/id="card-name"/);
    expect(html).toMatch(/id="card-type"/);
    expect(html).toMatch(/id="card-habit"/);
    expect(html).toMatch(/id="card-note"/);
  });

  it('paid-return banner exists hidden-by-default with exact unlock copy', () => {
    const m = html.match(/<div([^>]*id="paid-banner"[^>]*)>([\s\S]*?)<\/div>/);
    expect(m, 'paid-banner element not found').not.toBeNull();
    expect(m[1]).toMatch(/\bhidden\b/);
    expect(m[2].trim()).toBe('three reads unlocked. enjoy.');
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

    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains('visible')).toBe(true);

    vi.advanceTimersByTime(4000);
    expect(banner.hidden).toBe(false);
    expect(banner.classList.contains('visible')).toBe(false);

    vi.advanceTimersByTime(600);
    expect(banner.hidden).toBe(true);
  });

  it('handlePaidReturn shows the banner and persists the paid state', () => {
    vi.useFakeTimers();
    const banner = installPaywallUI();
    const pending = mk('Paid Path', '1999-09-09');
    const storage = makeStorage({
      [CREDITS_KEY]: '0',
      [TRIES_KEY]: '3',
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
      [CREDITS_KEY]: '2',
      [TRIES_KEY]: '4',
    });
    expect(storage.snapshot()).not.toHaveProperty(PENDING_KEY);
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

describe('disclosure copy (DOCTRINE §4 v0.22 / brief §10.3)', () => {
  // 6a. disclosure_in_about_modal ───────────────────────────────────
  // The about-modal subtree must contain every disclosure the brief
  // names (§10.3). Substrings are case-insensitive where the brief
  // permits, exact otherwise.

  const aboutSubtree = modalSubtree('about-modal');

  it('about-modal: contains "calculator-grade"', () => {
    expect(aboutSubtree).toMatch(/calculator-grade/);
  });

  it('about-modal: contains "three dollars"', () => {
    expect(aboutSubtree).toMatch(/three dollars/);
  });

  it('about-modal: names gumroad (case-insensitive)', () => {
    expect(aboutSubtree).toMatch(/gumroad/i);
  });

  it('about-modal: discloses on-device data boundary', () => {
    expect(aboutSubtree).toMatch(
      /your name, DOB, and reading stay on this device/
    );
  });

  it('about-modal: discloses source visibility ("the deck is visible in source")', () => {
    expect(aboutSubtree).toMatch(/the deck is visible in source/);
  });

  it('about-modal: discloses lock-as-convention framing', () => {
    expect(aboutSubtree).toMatch(/the lock is a convention, not a vault/);
  });

  it('about-modal: discloses what $3 unlocks ("three more reads with the card opened up")', () => {
    expect(aboutSubtree).toMatch(/three more reads with the card opened up/);
  });

  it('about-modal: word "subscription" only appears in the negation "no subscription"', () => {
    const occurrences = (aboutSubtree.match(/subscription/g) || []).length;
    const negations = (aboutSubtree.match(/no subscription/g) || []).length;
    expect(occurrences).toBe(negations);
  });

  it('about-modal: discloses the 18+ acknowledgment gate (§4.A carry)', () => {
    // The age gate has been live since v0.18 (§4.A). The brief §10.3
    // disclosure checklist includes the 18+ tap; this test guards
    // the substring presence in the about-modal body so a future copy
    // tightening doesn't silently drop the disclosure.
    expect(aboutSubtree).toMatch(/18\+/);
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
    expect(paywallSubtree).toMatch(/payment \+ email go to them/);
  });

  it('paywall modal disclosure keeps reading on-device', () => {
    expect(paywallSubtree).toMatch(/your reading stays here/);
  });
});

describe('paid-surface JS wiring (brief §11.2, deferred from step 7)', () => {
  // pending_profile_write ────────────────────────────────────────────
  // Both Path A (form submit → show-paywall) and Path B (lock icon
  // click) must stage the typed profile via setPendingProfile BEFORE
  // openPaywall fires. Order matters: the paid-return handler reads
  // the pending profile from localStorage, so it must exist on disk
  // before the redirect.

  it('setPendingProfile is called immediately before openPaywall (Path A + Path B)', () => {
    const matches = html.match(
      /setPendingProfile\([^)]*\)\s*;\s*\n\s*(?:if[^\n]*\n\s*)?openPaywall\(\s*\)/g
    );
    expect(matches, 'setPendingProfile → openPaywall sequence not found').not.toBeNull();
    // Path A (form submit) + Path B (lock icon click) = two sequences.
    expect(matches.length).toBeGreaterThanOrEqual(2);
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
