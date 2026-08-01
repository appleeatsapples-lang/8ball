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
// `bridge` is supplied explicitly here. In production index.html names four
// ids and ui/public.js injects the fifth node itself (§6 v0.23 DI shape, the
// pattern ui/meanings.js and ui/dyad.js already use) — pinned separately
// below, along with the four-id boot call that proves index.html is untouched.
const makeRefs = () => ({
  root: { classList: makeClassList() },
  families: makeNode(),
  antiFit: makeNode(),
  roleLine: makeNode(),
  bridge: makeNode(),
});

const PROFILE = buildProfile('specimen', '2000-01-01');
// Calc v4 (§1.B v0.62): both master birthday values reachable from a day of
// the month. Each reads a BASE work mode through MASTER_MODE_BRIDGE, so each
// must carry the disclosure on the rendered surface.
const MASTER_PROFILES = [
  ['birthday 11 → mode 2', buildProfile('specimen', '2000-01-11'), '11', '2'],
  ['birthday 22 → mode 4', buildProfile('specimen', '2000-01-22'), '22', '4'],
];

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
    // Birthday 1 is not a master, so nothing is bridged and the line is empty
    // rather than absent — the negative half of the master pins below.
    expect(refs.bridge.textContent).toBe('');
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
      expect(refs.bridge.textContent).toBe('');
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

  // ── the master-birthday disclosure (§1.B v0.62 / §1.D v0.62) ─────
  //
  // The P1 this suite could not previously catch: every case above uses a
  // NON-master birthday, so the engine's bridge fields were correct while the
  // formatter discarded them and the block silently showed base-mode copy.
  // Both reachable master values are driven end to end, through the real
  // engine, the real formatter and the real render.

  it.each(MASTER_PROFILES)(
    'a master birthday DISCLOSES its base mode on the rendered surface (%s)',
    (_label, profile, master, base) => {
      const refs = makeRefs();
      initPublicUI(refs);
      const read = renderPublicRead(profile, { entitled: true });
      expect(read).not.toBeNull();
      // The reading is complete — the bridge is a disclosure, not a fallback.
      expect(refs.families.textContent.length).toBeGreaterThan(0);
      expect(refs.antiFit.textContent).toMatch(/^anti-fit · /);
      expect(refs.roleLine.textContent.endsWith('.')).toBe(true);
      // ...and the substitution is VISIBLE, naming both numbers.
      const note = refs.bridge.textContent;
      expect(note.length).toBeGreaterThan(0);
      expect(note).toContain(master);
      expect(note).toContain(base);
      // It is the engine's own string, not copy this module authored.
      expect(note).toBe(buildPublicReading(dobIsoFromProfile(profile)).mode.bridgeNote);
    }
  );

  it.each(MASTER_PROFILES)(
    'a sealed render clears a previously disclosed bridge note (%s)',
    (_label, profile) => {
      const refs = makeRefs();
      initPublicUI(refs);
      renderPublicRead(profile, { entitled: true });
      expect(refs.bridge.textContent.length).toBeGreaterThan(0);
      renderPublicRead(profile, { entitled: false });
      expect(refs.bridge.textContent).toBe('');
    }
  );

  it('a non-master render after a master one does not keep the stale note', () => {
    // The sharp case a per-branch clear would miss: both renders are ENTITLED,
    // so the sealed branch never runs. Shared-device / try-another path.
    const refs = makeRefs();
    initPublicUI(refs);
    renderPublicRead(MASTER_PROFILES[0][1], { entitled: true });
    expect(refs.bridge.textContent.length).toBeGreaterThan(0);
    renderPublicRead(PROFILE, { entitled: true });
    expect(refs.bridge.textContent).toBe('');
  });

  it('the formatter emits the bridge, and emits it empty when unbridged', () => {
    // Directly on formatPublicRead, so a render-layer pin cannot be the only
    // thing standing between the engine's disclosure and the user.
    const bridged = formatPublicRead(buildPublicReading('2000-01-22'));
    expect(bridged.bridge).toBe(buildPublicReading('2000-01-22').mode.bridgeNote);
    expect(bridged.bridge).toContain('22');
    const direct = formatPublicRead(buildPublicReading('2000-01-09'));
    expect(direct.bridge).toBe('');
  });

  it('injects its own node rather than asking index.html for a fifth id', () => {
    // §6 v0.23: the module owns its markup and scoped CSS. This is what keeps
    // index.html byte-identical and the four-id boot pin below true.
    const src = readFileSync(join(__dirname, '..', 'ui', 'public.js'), 'utf-8');
    expect(src).toMatch(/document\.createElement\('div'\)/);
    expect(src).toContain('public-bridge');
    expect(html).not.toContain('public-bridge');
    // `:empty`, never the `hidden` attribute — this repo has a logged case of
    // an author display rule beating the UA [hidden] rule (the F1 bug class
    // pinned further down this file).
    expect(src).toMatch(/\.public-bridge:empty \{[^}]*display:\s*none/);
  });

  it('production fallback creates, fills and clears the bridge without refs.bridge', () => {
    // The former P1 lived in this seam: index.html supplies only four refs,
    // so production depends on resolveBridgeNode creating the fifth node.
    // Source-shape assertions above cannot prove that append/write/clear path.
    const priorDocument = globalThis.document;
    const children = [];
    const styles = [];
    const root = {
      classList: makeClassList(),
      appendChild(node) { children.push(node); return node; },
      querySelector(selector) {
        if (selector !== '.public-bridge') return null;
        return children.find(node => String(node.className || '').split(/\s+/).includes('public-bridge')) || null;
      },
    };
    const makeElement = tag => ({
      tagName: String(tag).toUpperCase(),
      id: '', className: '', textContent: '', classList: makeClassList(),
    });
    globalThis.document = {
      getElementById: id => styles.find(node => node.id === id) || null,
      createElement: makeElement,
      head: { appendChild(node) { styles.push(node); return node; } },
    };

    try {
      const refs = {
        root,
        families: makeNode(),
        antiFit: makeNode(),
        roleLine: makeNode(),
      };
      initPublicUI(refs); // deliberately no refs.bridge — production shape
      expect(children).toHaveLength(1);
      const bridge = children[0];
      expect(bridge.className).toContain('public-bridge');

      renderPublicRead(MASTER_PROFILES[0][1], { entitled: true });
      expect(bridge.textContent).toContain('11');
      expect(bridge.textContent).toContain('2');

      renderPublicRead(PROFILE, { entitled: true });
      expect(bridge.textContent).toBe('');
      renderPublicRead(MASTER_PROFILES[1][1], { entitled: true });
      expect(bridge.textContent).toContain('22');
      renderPublicRead(MASTER_PROFILES[1][1], { entitled: false });
      expect(bridge.textContent).toBe('');
    } finally {
      initPublicUI(null);
      globalThis.document = priorDocument;
    }
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
  it('t4 is still not current, and the dyad append did not revive it', () => {
    // §1.D v0.61 appends a rung. The thing that would silently break every
    // t4-holding device is appending it AS t4, so this pin now carries the
    // whole ladder: t4 stays retired, the successor is unchanged, and the
    // new rung took the clean token instead.
    expect(TIER_ORDER).toEqual(['t1', 't2', 't3', 't5']);
    expect(isTier('t4')).toBe(false);
    expect(tierRank('t4')).toBe(0);
    expect(RETIRED_TIERS).toEqual({ t4: 't3' });
    expect(TIER_ORDER).not.toContain('t4');
  });

  it('a stored t4 still migrates to t3 with the dyad rung on the ladder', () => {
    // The migration must land on t3 — the rung that absorbed the public read
    // — and must NOT follow the top of the ladder to the new rung. A t4
    // holder never bought a second person's sheet.
    expect(normalizeTier('t4')).toBe('t3');
    expect(resolveRenderTier({ tier: 't4', credits: 0 })).toBe('t3');
    expect(resolveRenderTier({ tier: 't4', credits: 9 })).toBe('t3');
    expect(applyPaidReturn({ pendingProfile: null, tier: 't4', purchasedTier: 't1' }).tier).toBe('t3');
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
