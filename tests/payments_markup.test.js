// 8ball / tests / payments_markup.test.js
//
// v0.3.0 paid-surface markup + disclosure invariants (DOCTRINE §1
// v0.22 / §6 / §10.2). Forward-ports a subset of brief §11.2 from
// step 9 → step 7 per codex pre-merge audit hook 9 P1: bring
// markup/static or thin DOM smoke tests forward before piling on
// step 7 copy/UI work.
//
// Scope (step-7 forward port):
//   1. lock_icon_markup        — DOM existence
//   2. paywall_modal_markup    — DOM existence + LS Buy Link shape
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

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const paymentsJs = readFileSync(
  join(__dirname, '..', 'ui', 'payments.js'),
  'utf-8'
);

// ── helper: extract a modal subtree by id (same shape as age_gate.test) ──
function modalSubtree(id) {
  const re = new RegExp(`id="${id}"[\\s\\S]*?<\\/div>\\s*<\\/div>\\s*<\\/div>`);
  const m = html.match(re);
  if (!m) throw new Error(`subtree for #${id} not found`);
  return m[0];
}

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

  it('paywall CTA is a Lemon Squeezy Buy Link', () => {
    const subtree = modalSubtree('paywall-modal');
    expect(subtree).toMatch(
      /href="https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\/checkout\/buy\/[a-f0-9-]+"/
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

  it('about-modal: names lemon squeezy (case-insensitive)', () => {
    expect(aboutSubtree).toMatch(/lemon squeezy/i);
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

  // 6b. paywall_modal_disclosure ────────────────────────────────────
  const paywallSubtree = modalSubtree('paywall-modal');

  it('paywall modal contains .modal-disclosure element', () => {
    expect(paywallSubtree).toMatch(/class="modal-disclosure"/);
  });

  it('paywall modal disclosure names lemon squeezy (case-insensitive)', () => {
    expect(paywallSubtree).toMatch(/lemon squeezy/i);
  });

  it('paywall modal disclosure routes payment + email to LS', () => {
    expect(paywallSubtree).toMatch(/payment \+ email go to them/);
  });

  it('paywall modal disclosure keeps reading on-device', () => {
    expect(paywallSubtree).toMatch(/your reading stays here/);
  });
});
