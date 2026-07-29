// 8ball / tests / public_surface.test.js
//
// The public read (§1.D v0.60) — the wiring, not the engine. Engine
// behaviour is pinned in tests/public.test.js; this file covers the seams
// the wiring introduced:
//
//   1. ui/public.js render — sealed below t3, filled at t3, DOM-pure either
//      way (§1.D v0.37: an unentitled render carries no entitled string).
//   2. The RETIREMENT of t4 — the block briefly had its own $9 rung
//      (§1.D v0.58) and was folded into t3 instead of sold. A device that
//      stored 't4' from the unsigned ?paid= return must be MIGRATED, never
//      downgraded: the stored tier is the only record of a purchase, so a
//      real t3 buyer who tried the t4 URL once must not lose the rung they
//      paid for. This is the highest-stakes thing in this file.
//   3. The census — the read is a BLOCK, so open/sealed/total must NOT move.
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
import {
  TIER_ORDER, isTier, tierRank, maxTier, resolveRenderTier, applyPaidReturn,
  RETIRED_TIERS, normalizeTier,
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

describe('public read — render', () => {
  it('fills the block when entitled (t3)', () => {
    const refs = makeRefs();
    initPublicUI(refs);
    const read = renderPublicRead(PROFILE, { entitled: true });
    expect(read).not.toBeNull();
    // 2000-01-01: birthday 1 (day of month) → mode 1, origination first.
    expect(refs.families.textContent).toBe('1 tech · 2 media · 3 energy');
    expect(refs.antiFit.textContent).toBe('anti-fit · health');
    expect(refs.roleLine.textContent)
      .toBe('a role held as the setting of order, worked from a standing start, one line at a time.');
    expect(refs.root.classList.contains('sealed')).toBe(false);
  });

  it('seals below t3 and leaves NO entitled string in the DOM', () => {
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

describe('public read — the t4 retirement must not downgrade anyone', () => {
  it('the ladder is three rungs again and t4 is not current', () => {
    expect(TIER_ORDER).toEqual(['t1', 't2', 't3']);
    expect(isTier('t4')).toBe(false);
    expect(tierRank('t4')).toBe(0);
    expect(RETIRED_TIERS).toEqual({ t4: 't3' });
  });

  it('a device holding the retired rung renders t3, NOT free', () => {
    // The regression this pins: with t4 gone from TIER_ORDER, a naive
    // implementation falls through to the credits check and lands on 'free'.
    // Anyone who opened the unsigned ?paid=t4 URL — which was live while the
    // rung existed — would silently lose everything.
    expect(resolveRenderTier({ tier: 't4', credits: 0 })).toBe('t3');
    expect(normalizeTier('t4')).toBe('t3');
  });

  it('a t3 BUYER who tried the t4 URL keeps the rung they paid for', () => {
    // The stored tier is the ONLY record of a purchase, which is what makes
    // this a correctness requirement rather than a courtesy: buy t3, tap the
    // unsigned ?paid=t4 URL once, and localStorage now reads 't4' with the
    // t3 purchase no longer recorded anywhere. Retiring the rung must not
    // cash that in.
    //
    // The stored value is written as a LITERAL on purpose. It cannot be
    // produced by today's code — applyPaidReturn now normalizes the stored
    // side, so it returns 't3' — but it is exactly what sits in the
    // localStorage of any device that used that URL while the rung was live.
    const storedWhileT4Existed = 't4';
    expect(resolveRenderTier({ tier: storedWhileT4Existed, credits: 0 })).toBe('t3');
    // And today's code cannot re-create the stranded state.
    expect(applyPaidReturn({ pendingProfile: null, tier: 't3', purchasedTier: 't4' }).tier)
      .toBe('t3');
  });

  it('buying a LOWER rung while holding the retired one does not downgrade', () => {
    for (const lower of ['t1', 't2', 't3']) {
      expect(applyPaidReturn({ pendingProfile: null, tier: 't4', purchasedTier: lower }).tier)
        .toBe('t3');
    }
    expect(maxTier(normalizeTier('t4'), 't1')).toBe('t3');
  });

  it('a live ?paid=t4 link is now inert rather than harmful', () => {
    // Unknown ?paid= values take the replay-safe branch: no tier write, no
    // grant. A t4 URL in the wild does nothing instead of granting a rung
    // that no longer exists.
    expect(isTier('t4')).toBe(false);
  });

  it('still does NOT widen the R2 legacy grandfather', () => {
    expect(resolveRenderTier({ tier: null, credits: 3 })).toBe('t3');
    expect(resolveRenderTier({ tier: null, credits: 99 })).toBe('t3');
    expect(resolveRenderTier({ tier: null, credits: 0 })).toBe('free');
  });

  it('the UI persists the migration instead of re-resolving it forever', () => {
    const src = readFileSync(join(__dirname, '..', 'ui', 'payments.js'), 'utf-8');
    expect(src).toMatch(/if \(isTier\(resolved\) && resolved !== stored\) setTier\(resolved\)/);
  });
});

describe('public read — density census unchanged', () => {
  it('is a block, not a compartment: carrying it does not move the census', () => {
    expect(tierDensitySummary('t3')).toEqual({ open: 15, sealed: 0, total: 15 });
    expect(TIER_COORDS.t4).toBeUndefined();
  });

  it('rides t3 and no lower rung', () => {
    expect(coordsForTier('t3').has('publicRead')).toBe(true);
    for (const lower of ['free', 't1', 't2']) {
      expect(coordsForTier(lower).has('publicRead'), lower).toBe(false);
    }
  });

  it('unseals with the other t3 ceiling block on an upgrade', () => {
    expect(newlyEntitledCells('t2', 't3')).toContain('publicRead');
    expect(newlyEntitledCells('t2', 't3')).toContain('cardEntry');
    expect(newlyEntitledCells('t3', 't3')).toEqual([]);
  });
});

describe('public read — the withdrawn offer leaves no surface behind', () => {
  it('no fourth-rung CTA, constant or handler survives', () => {
    expect(html).not.toMatch(/paywall-cta-t4/);
    expect(html).not.toMatch(/applyT4Offer/);
    const pay = readFileSync(join(__dirname, '..', 'ui', 'payments.js'), 'utf-8');
    expect(pay).not.toMatch(/T4_PRODUCT_URL|applyT4Offer/);
  });

  it('the sprint $3 offer is still the only purchase surface', () => {
    expect((html.match(/gumroad\.com/g) || []).length).toBe(1);
    expect(html).toMatch(/id="paywall-cta-t3"[^>]*href="https:\/\/theeightball\.gumroad\.com\/l\/xjpvp"/);
    expect(html).toMatch(/id="offer-btn"[^>]*>open the complete sheet · \$3 once</);
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

describe('public-read wiring seams the first pass left unpinned', () => {
  it('the render decision consults the ladder table, not a tier literal', () => {
    // TIER_COORDS.t4 previously had zero effect on what shipped: the render
    // asked `tier === 't4'` directly, so the table this change added was
    // pinned by tests while being ignored by the product.
    expect(html).toMatch(/coordsForTier\(tier\)\.has\('publicRead'\)/);
    expect(html).not.toMatch(/entitled: tier === 't[0-9]'/);
  });

  it('the written-entry rotation asks the ladder, not a tier literal', () => {
    // Counted across index.html AND ui/boot.js: the boot sequence was
    // extracted to that module (§6 split), taking one of the four call sites
    // with it. The invariant is four entitlement checks on the render path
    // and no surviving tier literal — not four of them in one file.
    const bootJs = readFileSync(join(__dirname, '..', 'ui', 'boot.js'), 'utf-8');
    const surfaces = html + bootJs;
    expect(surfaces).not.toMatch(/tier === 't3'/);
    expect((surfaces.match(/coordsForTier\(tier\)\.has\('cardEntry'\)/g) || []).length).toBe(4);
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
