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
  it('copy interpolates count fields only — no profile value', () => {
    expect(block).toMatch(/\$\{density\.open\}/);
    expect(block).toMatch(/\$\{density\.sealed\}/);
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
// cut in half on 768-tall desktops. The pass top-aligns the rail (the shell
// block's flex-start governs once the experience layer stops re-centering)
// and pins it sticky, so every control including the revenue CTA sits in
// the first ~500px at every tier AND stays in view while the tall card
// scrolls. Source pins here; the fold measurements live in the live-fire
// record (journal entry of the pass).
describe('desktop rail fold contract (≥720px)', () => {
  const experienceCss = read('ui', 'experience.css')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('the experience layer no longer re-centers the rail against the card', () => {
    // The shell's ≥720 block sets align-items: flex-start; the defect was
    // the experience layer overriding it back to center. No #result
    // .result-main rule may re-declare align-items anywhere.
    const rules = [...experienceCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const mains = rules.filter(r => r[1].includes('#result .result-main'));
    expect(mains.length).toBeGreaterThan(0); // non-vacuous: the gap rule stays
    for (const r of mains) {
      expect(r[2], `align-items on "${r[1].trim()}" re-arms the fold defect`)
        .not.toMatch(/align-items/);
    }
  });

  it('the rail is sticky and self-aligned to the top', () => {
    const rail = [...experienceCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(r => r[1].includes('#result .result-rail'));
    expect(rail.length).toBeGreaterThan(0);
    const body = rail.map(r => r[2]).join(';');
    expect(body).toMatch(/position:\s*sticky/);
    // align-self pins the sticky element against any future align-items
    // change on the container.
    expect(body).toMatch(/align-self:\s*flex-start/);
    expect(body).toMatch(/top:\s*calc\(var\(--topbar-height,\s*56px\)\s*\+\s*24px\)/);
  });

  it('the shell keeps the flex-start the experience layer now defers to', () => {
    expect(shellCss).toMatch(/#result \.result-main \{[^}]*align-items:\s*flex-start/);
  });
});
