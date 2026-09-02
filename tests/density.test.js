// 8ball / tests / density.test.js
// Paid-tier density strip (Coordinate Legibility Pack cut 3). An aggregate
// census derived PURELY from the tier constants. Pins: the count math,
// profile-independence (value-leak sentinel), no-FOMO copy (§2/§5.C),
// always-on gating, and §5.D PNG exclusion.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tierDensitySummary, TIER_COORDS } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const shellCss = read('ui', 'shell.css');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');

describe('tierDensitySummary count math (derived from tier constants)', () => {
  // base = 15: the 14 sheet cells + the always-open catalog numeral (a free
  // coordinate per §1.D), so the free count (5) matches the product-wide
  // "five coordinates" framing. sealed counts only the sealable cells.
  it('free: 5 of 15 open, 10 sealed', () => {
    expect(tierDensitySummary('free')).toEqual({ open: 5, sealed: 10, total: 15 });
  });
  it('t1: 10 open, 5 sealed', () => {
    expect(tierDensitySummary('t1')).toEqual({ open: 10, sealed: 5, total: 15 });
  });
  it('t2: 14 open, 1 sealed', () => {
    expect(tierDensitySummary('t2')).toEqual({ open: 14, sealed: 1, total: 15 });
  });
  it('t3: 15 of 15 open, 0 sealed (written entry is a block, not a coordinate)', () => {
    expect(tierDensitySummary('t3')).toEqual({ open: 15, sealed: 0, total: 15 });
  });
  it('unknown tier falls back to free', () => {
    expect(tierDensitySummary('bogus')).toEqual({ open: 5, sealed: 10, total: 15 });
  });
  it('free open count matches the product-wide "five coordinates" framing', () => {
    // couples the strip numerator to prose_coordinate_count's base
    // (TIER_COORDS.free.length + 1 = catalog numeral) so they cannot drift.
    expect(tierDensitySummary('free').open).toBe(TIER_COORDS.free.length + 1);
  });
});

describe('density strip — value-leak / PII sentinel', () => {
  it('is a pure function of tier — integers only, profile-independent', () => {
    const r = tierDensitySummary('free');
    for (const k of ['open', 'sealed', 'total']) expect(Number.isInteger(r[k])).toBe(true);
    expect(tierDensitySummary('t2')).toEqual(tierDensitySummary('t2'));
  });
  it('the helper never reads a profile or the catalog driver', () => {
    const start = tiersJs.indexOf('export function tierDensitySummary');
    const fn = tiersJs.slice(start, tiersJs.indexOf('export function', start + 1));
    expect(fn).not.toMatch(/profile|getCard|resolveBracket|sunSign/);
  });
});

describe('density strip — copy + placement + gating', () => {
  const block = html.slice(
    html.indexOf('CLP cut 3: aggregate density census'),
    html.indexOf('try {', html.indexOf('CLP cut 3: aggregate density census')));

  it('copy is clinical — no FOMO / sales / urgency tokens (§2 / §5.C)', () => {
    // Scan the LITERAL user-facing copy: the template strings with their
    // ${...} interpolations stripped (those are code, not displayed text).
    const copy = (block.match(/`[^`]*`/g) || [])
      .map(s => s.replace(/\$\{[^}]*\}/g, '').replace(/`/g, ''))
      .join(' ');
    expect(copy, 'density copy not captured').toMatch(/coordinates open/);
    expect(copy).not.toMatch(/unlock|discover|reveal|buy|free/i);
    expect(copy).not.toMatch(/\bnow\b|only|hurry|countdown|\$|price|upgrade|limited/i);
  });
  it('copy interpolates count fields only — no profile value (free amendment: constant full-open line)', () => {
    // The sealed branch left with the storefront; the census is the total,
    // interpolated from the tier constants and never a profile value.
    expect(block).toMatch(/\$\{density\.total\} of \$\{density\.total\} coordinates open · full sheet/);
    expect(block).not.toMatch(/density\.sealed|sealed at paid/);
    expect(block).not.toMatch(/profile\.|currentProfile/);
  });
  it('strip lives in .result-rail, OUTSIDE the share-serialized #card-face', () => {
    const rail = html.slice(html.indexOf('class="result-rail"'), html.indexOf('/.result-rail'));
    expect(rail).toMatch(/id="density-strip"/);
    const card = html.slice(html.indexOf('id="card-face"'), html.indexOf('</article>'));
    expect(card).not.toMatch(/density-strip/);
  });
  it('is always-on — no .card.labels-revealed gate (unlike placards/atlas)', () => {
    expect(shellCss).toMatch(/\.density-strip\s*\{/);
    expect(html + shellCss).not.toMatch(/labels-revealed[^{]*\.density-strip/);
    expect(html + shellCss).not.toMatch(/\.density-strip[^}]*display:\s*none/);
  });
});

describe('density strip — §5.D PNG exclusion', () => {
  it('ui/share.js never references the strip (off-snapshot by construction)', () => {
    expect(shareJs).not.toMatch(/density-strip|tierDensitySummary/);
  });
});

describe('result surface — accessibility pins (evolution pass)', () => {
  it('density census is a live status region for screen readers', () => {
    const strip = html.match(/<p class="density-strip" id="density-strip"[^>]*>/);
    expect(strip, 'density-strip tag not found').not.toBeNull();
    expect(strip[0]).toMatch(/role="status"/);
  });
  it('the specimen sheet region is named + live for assistive tech', () => {
    const card = html.match(/<article class="card seal-hatch" id="card-face"[^>]*>/);
    expect(card, 'card-face tag not found').not.toBeNull();
    expect(card[0]).toMatch(/aria-live="polite"/);
    expect(card[0]).toMatch(/aria-label="specimen sheet"/);
  });
});

// ── desktop rail fold contract (2026-08-31 desktop layout pass) ───────────
// On ≥720px viewports the result rail sat vertically CENTERED beside the
// card. Harmless at free-tier heights, but the t3 card is ~1034px tall and
// centering pushed the rail's last items — the $6 comparative offer and its
// disclosure — to ~730px from the top: fully below the fold at 1280×720,
// cut in half on 768-tall desktops (and #forget-btn clipped in revealed
// states). The pass top-aligns the rail (the shell block's flex-start
// governs once the experience layer stops re-centering) and pins it sticky
// at 24px — NOT topbar+24: body is the scroll container and its padding
// already clears the fixed bar, so a topbar-added offset parked the rail
// 64px low and re-armed the defect at 150% zoom (the pr224 audit's F1).
//
// The pr224 audit broke the first version of these pins four ways (later
// overriding rule, double-spaced selector, child combinator, bare-class
// selector — presence checks, not cascade checks). These pins therefore
// normalize selector whitespace, match ANY selector shape naming the
// element, and assert the CASCADE WINNER: no rule anywhere in either host
// stylesheet may re-declare the guarded properties to a defeating value.
describe('desktop rail fold contract (≥720px)', () => {
  const experienceCss = read('ui', 'experience.css')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = source => [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(m => ({ sel: m[1].replace(/\s+/g, ' ').trim(), body: m[2] }));
  const targeting = (source, needle) =>
    rules(source).filter(r => r.sel.split(',').some(s => s.includes(needle)));
  const decls = (body, prop) =>
    [...body.matchAll(new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]+)', 'g'))]
      .map(m => m[1].trim());

  it('no rule in either host stylesheet re-centers the rail against the card', () => {
    // The shell's ≥720 block sets align-items: flex-start on the flex row;
    // ANY later align-items on a .result-main-targeting selector — any
    // shape, any file — can re-arm the fold defect.
    for (const [name, source] of [['experience', experienceCss], ['shell', shellCss.replace(/\/\*[\s\S]*?\*\//g, '')]]) {
      for (const r of targeting(source, '.result-main')) {
        for (const v of decls(r.body, 'align-items')) {
          expect(v, `${name}: align-items "${v}" on "${r.sel}"`).toBe('flex-start');
        }
      }
    }
    // non-vacuous: the experience gap rule and the shell layout rule exist
    expect(targeting(experienceCss, '.result-main').length).toBeGreaterThan(0);
    expect(targeting(shellCss, '.result-main').length).toBeGreaterThan(0);
  });

  it('the rail is sticky at 24px, top-aligned — and nothing anywhere defeats it', () => {
    const railRules = targeting(experienceCss, '.result-rail')
      .concat(targeting(shellCss.replace(/\/\*[\s\S]*?\*\//g, ''), '.result-rail'));
    expect(railRules.length).toBeGreaterThan(0);
    const all = prop => railRules.flatMap(r => decls(r.body, prop));
    // every declaration of the guarded properties, in every rule of every
    // shape, must carry the contract value — a later "position: static"
    // override is a re-arm, not a tie-break this test loses.
    const positions = all('position');
    expect(positions.length).toBeGreaterThan(0);
    for (const v of positions) expect(v, 'position').toBe('sticky');
    for (const v of all('align-self')) expect(v, 'align-self').toBe('flex-start');
    const tops = all('top');
    expect(tops.length).toBeGreaterThan(0);
    // 24px exactly: body is the scroll container and its padding already
    // clears the topbar; any topbar-added value parks the rail low and
    // re-arms the fold defect under zoom (pr224 audit F1).
    for (const v of tops) expect(v, 'top').toBe('24px');
  });

  it('the shell keeps the flex row the rail contract rides on', () => {
    const main = targeting(shellCss.replace(/\/\*[\s\S]*?\*\//g, ''), '#result .result-main');
    expect(main.length).toBeGreaterThan(0);
    const bodyAll = main.map(r => r.body).join(';');
    expect(bodyAll).toMatch(/display:\s*flex/);
    expect(bodyAll).toMatch(/align-items:\s*flex-start/);
  });
});
