// 8ball / tests / public_surface.test.js
//
// The t4 public rung (§1.D v0.58) — the wiring, not the engine. Engine
// behaviour is pinned in tests/public.test.js; this file covers the four
// seams the wiring introduced:
//
//   1. ui/public.js render — sealed below t4, filled at t4, DOM-pure either
//      way (§1.D v0.37: an unentitled render carries no entitled string).
//   2. The ladder append — t4 ranks above t3, every existing rung keeps its
//      rank and its meaning, and the R2 legacy grandfather does NOT follow
//      the top of the ladder.
//   3. The census — t4 adds a BLOCK, so open/sealed/total must NOT move.
//   4. The offer — fail-closed while the Gumroad product does not exist.
//
// Node env, hand-rolled DOM per §12 (no jsdom), sharing makeClassList with
// the other surface suites.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeClassList } from './helpers/dom.js';
import {
  dobIsoFromProfile,
  formatPublicRead,
  publicReadFor,
  initPublicUI,
  renderPublicRead,
} from '../ui/public.js';
import { T4_PRODUCT_URL, applyT4Offer } from '../ui/payments.js';
import {
  TIER_ORDER, isTier, tierRank, maxTier, resolveRenderTier, applyPaidReturn,
} from '../core/payments.js';
import { TIER_COORDS, coordsForTier, tierDensitySummary, newlyEntitledCells } from '../ui/tiers.js';
import { buildPublicReading } from '../core/public.js';
import { buildProfile } from '../core/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

const makeNode = () => ({ textContent: 'STALE', classList: makeClassList() });
const makeRefs = () => ({
  root: { classList: makeClassList() },
  families: makeNode(),
  antiFit: makeNode(),
  roleLine: makeNode(),
});

const PROFILE = buildProfile('specimen', '2000-01-01');

describe('t4 public read — render', () => {
  it('fills the block at t4', () => {
    const refs = makeRefs();
    initPublicUI(refs);
    const read = renderPublicRead(PROFILE, { entitled: true });
    expect(read).not.toBeNull();
    expect(refs.families.textContent).toBe('1 energy · 2 tech · 3 media');
    expect(refs.antiFit.textContent).toBe('anti-fit · teaching');
    expect(refs.roleLine.textContent)
      .toBe('a role held as the setting of order, worked to a plan, in fixed stages.');
    expect(refs.root.classList.contains('sealed')).toBe(false);
  });

  it('seals below t4 and leaves NO entitled string in the DOM', () => {
    for (const entitled of [false, undefined]) {
      const refs = makeRefs();
      initPublicUI(refs);
      const read = renderPublicRead(PROFILE, { entitled });
      expect(read).toBeNull();
      // Absent, not hidden — the §1.D v0.37 purity rule.
      expect(refs.families.textContent).toBe('');
      expect(refs.antiFit.textContent).toBe('');
      expect(refs.roleLine.textContent).toBe('');
      expect(refs.root.classList.contains('sealed')).toBe(true);
    }
  });

  it('clears a previously entitled block when the same refs re-render sealed', () => {
    // The downgrade path exists in one place only: a shared-device render
    // after the tier resolves lower. Stale entitled text must not survive it.
    const refs = makeRefs();
    initPublicUI(refs);
    renderPublicRead(PROFILE, { entitled: true });
    expect(refs.roleLine.textContent.length).toBeGreaterThan(0);
    renderPublicRead(PROFILE, { entitled: false });
    expect(refs.roleLine.textContent).toBe('');
  });

  it('seals rather than throws on a profile that cannot resolve a date', () => {
    for (const bad of [null, {}, { yyyy: 2000 }, { yyyy: 2001, mm: 2, dd: 29 }]) {
      const refs = makeRefs();
      initPublicUI(refs);
      expect(() => renderPublicRead(bad, { entitled: true })).not.toThrow();
      expect(refs.roleLine.textContent).toBe('');
    }
    expect(publicReadFor({ yyyy: 2001, mm: 2, dd: 29 })).toBeNull();
  });

  it('is inert before init and without refs', () => {
    initPublicUI(null);
    expect(renderPublicRead(PROFILE, { entitled: true })).toBeNull();
  });

  it('formats straight off the engine — no copy of its own', () => {
    const reading = buildPublicReading('1984-02-02');
    const formatted = formatPublicRead(reading);
    expect(formatted.roleLine).toBe(reading.roleLine);
    expect(formatted.antiFit).toContain(reading.antiFit.label);
    for (const family of reading.families) {
      expect(formatted.families).toContain(family.label);
    }
  });

  it('maps profile calendar fields to the engine ISO date, zero-padded', () => {
    expect(dobIsoFromProfile({ yyyy: 2000, mm: 1, dd: 1 })).toBe('2000-01-01');
    expect(dobIsoFromProfile({ yyyy: 999, mm: 12, dd: 31 })).toBe('0999-12-31');
    expect(dobIsoFromProfile({ yyyy: 2000, mm: '1', dd: 1 })).toBeNull();
  });
});

describe('t4 public read — ladder append (§1.D v0.58)', () => {
  it('ranks above t3 without moving any existing rung', () => {
    expect(tierRank('t4')).toBe(4);
    expect([tierRank('t1'), tierRank('t2'), tierRank('t3')]).toEqual([1, 2, 3]);
    expect(tierRank('free')).toBe(0);
    expect(isTier('t4')).toBe(true);
    expect(TIER_ORDER.indexOf('t4')).toBe(TIER_ORDER.length - 1);
  });

  it('upgrades monotonically and never downgrades a t4 owner', () => {
    expect(maxTier('t3', 't4')).toBe('t4');
    expect(maxTier('t4', 't1')).toBe('t4');
    expect(maxTier('t4', 't3')).toBe('t4');
    expect(maxTier(null, 't4')).toBe('t4');
    for (const lower of ['t1', 't2', 't3']) {
      expect(applyPaidReturn({ pendingProfile: null, tier: 't4', purchasedTier: lower }).tier)
        .toBe('t4');
    }
  });

  it('honours a ?paid=t4 return with and without a pending profile', () => {
    const pending = { name: 'specimen', dob: '2000-01-01' };
    expect(applyPaidReturn({ pendingProfile: pending, tier: 't3', purchasedTier: 't4' }))
      .toEqual({ action: 'render-unlocked', profile: pending, tier: 't4' });
    // Replay-attack branch (§5.C): unsigned redirect, no pending profile.
    expect(applyPaidReturn({ pendingProfile: null, tier: null, purchasedTier: 't4' }))
      .toEqual({ action: 'no-pending', tier: 't4' });
  });

  it('does NOT widen the R2 legacy grandfather to the new top rung', () => {
    // Legacy credit-holders bought the written entry. They keep t3; a rung
    // that did not exist when they paid is not retroactively theirs. This is
    // the one place the ladder is deliberately not generalised.
    expect(resolveRenderTier({ tier: null, credits: 3 })).toBe('t3');
    expect(resolveRenderTier({ tier: null, credits: 99 })).toBe('t3');
    expect(resolveRenderTier({ tier: 't4', credits: 0 })).toBe('t4');
    expect(resolveRenderTier({ tier: null, credits: 0 })).toBe('free');
  });
});

describe('t4 public read — density census unchanged', () => {
  it('adds a block, not a compartment: the census is identical to t3', () => {
    expect(tierDensitySummary('t4')).toEqual(tierDensitySummary('t3'));
    expect(tierDensitySummary('t4')).toEqual({ open: 15, sealed: 0, total: 15 });
  });

  it('t4 is t3 plus exactly the publicRead block', () => {
    expect(TIER_COORDS.t4).toEqual([...TIER_COORDS.t3, 'publicRead']);
    expect(coordsForTier('t4').has('publicRead')).toBe(true);
    for (const lower of ['free', 't1', 't2', 't3']) {
      expect(coordsForTier(lower).has('publicRead'), lower).toBe(false);
    }
  });

  it('unseals exactly the public block on a t3 → t4 upgrade', () => {
    expect(newlyEntitledCells('t3', 't4')).toEqual(['publicRead']);
    expect(newlyEntitledCells('t4', 't4')).toEqual([]);
    expect(newlyEntitledCells('t4', 't3')).toEqual([]);
    expect(newlyEntitledCells('t2', 't4')).toContain('publicRead');
    expect(newlyEntitledCells('t2', 't4')).toContain('cardEntry');
  });
});

describe('t4 public read — the offer fails closed', () => {
  it('renders no buyable CTA while the product does not exist', () => {
    // The rung is fully wired; only the Gumroad product is missing, and
    // creating it is the operator's action. Until then the anchor must carry
    // no href and stay hidden — a dead checkout link is worse than no offer.
    const anchor = { hidden: false, href: 'https://example.invalid/stale', removeAttribute() { delete this.href; } };
    expect(applyT4Offer(anchor)).toBe(false);
    expect(anchor.hidden).toBe(true);
    expect(anchor.href).toBeUndefined();
    expect(applyT4Offer(null)).toBe(false);
  });

  it('the shipped constant is empty, and the markup ships hidden with no href', () => {
    expect(T4_PRODUCT_URL).toBe('');
    const tag = html.match(/<a[^>]*id="paywall-cta-t4"[^>]*>/);
    expect(tag).not.toBeNull();
    expect(tag[0]).toMatch(/\shidden\b/);
    expect(tag[0]).not.toMatch(/href=/);
    // No new payment host enters the tracked source with this rung.
    expect((html.match(/gumroad\.com/g) || []).length).toBe(1);
  });

  it('the sprint $3 offer control is untouched by the new rung', () => {
    expect(html).toMatch(/id="offer-btn"[^>]*>open the complete sheet · \$3 once</);
    expect(html).toMatch(/id="paywall-cta-t3"[^>]*href="https:\/\/theeightball\.gumroad\.com\/l\/xjpvp"/);
  });
});

// ── the guard the suite did not have ──────────────────────────────
//
// A post-merge cross-read of #153 found the "fail-closed" t4 CTA VISIBLE in
// production: the anchor ships `hidden`, but `[hidden] { display: none }` is
// a UA-origin rule and `.modal .modal-cta { display: block }` is an author
// rule, which wins regardless of specificity. `applyT4Offer` re-asserted
// `.hidden` and stripped `href` — neither touches `display`.
//
// §12 forbids jsdom, so no test in this suite can evaluate a cascade. What a
// test CAN do is pin the invariant structurally: any class that both ships
// (or is toggled) hidden AND carries an author `display:` rule must have a
// matching `[hidden]` guard. That covers the whole bug class rather than the
// one instance — including `#offer-btn`, which had the same defect before
// this rung existed.
describe('hidden-attribute guards (the F1 bug class)', () => {
  const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));

  // Classes on elements that ship with a bare `hidden` attribute, plus those
  // on elements whose id is assigned `.hidden = ...` anywhere in the script.
  function hiddenElements() {
    const out = [];
    const tags = html.match(/<[a-z]+\s[^>]*>/g) || [];
    const toggledIds = new Set(
      [...html.matchAll(/\b([A-Za-z_$][\w$]*)\.hidden\s*=/g)].map(m => m[1])
    );
    for (const tag of tags) {
      const cls = (tag.match(/class="([^"]+)"/) || [])[1];
      if (!cls) continue;
      const id = (tag.match(/id="([^"]+)"/) || [])[1] || '';
      const camel = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const shipsHidden = /\shidden(\s|>|=)/.test(tag);
      if (shipsHidden || toggledIds.has(camel)) out.push({ id, classes: cls.split(/\s+/) });
    }
    return out;
  }

  it('finds the elements it is supposed to be checking', () => {
    const ids = hiddenElements().map(e => e.id);
    expect(ids).toContain('paywall-cta-t4'); // the t4 CTA
    expect(ids).toContain('offer-btn');      // the sprint offer control
  });

  it('every element that ships or toggles hidden is actually hidden by a guard', () => {
    // Per ELEMENT, not per class: an element is safe when ANY class it
    // carries has a [hidden] guard, since one display:none settles it.
    const guardedClass = cls => new RegExp(`\\.${cls}\\[hidden\\]`).test(css);
    const hasDisplayRule = cls =>
      new RegExp(`\\.${cls}\\b[^{}]*\\{[^}]*display\\s*:`).test(css);
    const unguarded = [];
    for (const { id, classes } of hiddenElements()) {
      if (!classes.some(hasDisplayRule)) continue;   // UA [hidden] still wins
      if (classes.some(guardedClass)) continue;      // an author guard wins back
      unguarded.push(`${id || '(no id)'} [${classes.join(' ')}]`);
    }
    expect(
      unguarded,
      `these elements ship/toggle hidden but an author display rule overrides ` +
      `the UA [hidden] rule, so the attribute does nothing: ${unguarded.join(', ')}`
    ).toEqual([]);
  });

  it('the guards resolve to display: none, not merely to a selector', () => {
    for (const sel of ['.modal .modal-cta[hidden]', '.btn-block[hidden]']) {
      const at = css.indexOf(sel);
      expect(at, `${sel} missing`).toBeGreaterThan(-1);
      expect(css.slice(at, at + 200)).toMatch(/display:\s*none/);
    }
  });
});

describe('t4 wiring seams the first pass left unpinned', () => {
  it('the render decision consults the ladder table, not a tier literal', () => {
    // TIER_COORDS.t4 previously had zero effect on what shipped: the render
    // asked `tier === 't4'` directly, so the table this change added was
    // pinned by tests while being ignored by the product.
    expect(html).toMatch(/coordsForTier\(tier\)\.has\('publicRead'\)/);
    expect(html).not.toMatch(/entitled: tier === 't4'/);
  });

  it('the written-entry rotation follows entitlement, so t4 keeps what t3 bought', () => {
    expect(html).not.toMatch(/tier === 't3'/);
    expect((html.match(/coordsForTier\(tier\)\.has\('cardEntry'\)/g) || []).length).toBe(4);
  });

  it('the boot wiring names ids that exist — a typo would ship an empty $9 block', () => {
    const call = html.match(/initPublicUI\(\{[\s\S]*?\}\)/);
    expect(call).not.toBeNull();
    const ids = [...call[0].matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]);
    expect(ids).toEqual(['public-read', 'public-families', 'public-antifit', 'public-roleline']);
    for (const id of ids) expect(html, `#${id} missing from markup`).toContain(`id="${id}"`);
  });

  it('the unseal beat can actually reach the block', () => {
    // newlyEntitledCells reported 'publicRead' while the consumer had no way
    // to resolve its root — the beat was dead code and its test a tautology.
    expect(html).toMatch(/publicRead: \$\('public-read'\)/);
    const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
    expect(css).toMatch(/\.public-read\.unsealing \.card-habit/);
  });

  it('the block label follows the labels-reveal convention like every other label', () => {
    const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
    expect(css).toMatch(/\.public-title \{[^}]*visibility: hidden/);
    expect(css).toMatch(/\.card\.labels-revealed \.public-title \{[^}]*visibility: visible/);
  });

  it('the density strip does not claim a full sheet over a sealed block', () => {
    expect(html).toMatch(/domain fit sealed/);
  });

  it('the internal spec is not published on the product domain', () => {
    const toml = readFileSync(join(__dirname, '..', 'netlify.toml'), 'utf-8');
    const cmd = (toml.match(/command = "([^"]+)"/) || [])[1] || '';
    for (const doc of ['PUBLIC_TIER_SPEC.md', 'DOCTRINE.md', 'journal.md', 'audits']) {
      expect(cmd, `${doc} would be served publicly`).toContain(doc);
    }
  });
});
