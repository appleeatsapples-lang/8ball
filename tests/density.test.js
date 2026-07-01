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
    expect(html).toMatch(/\.density-strip\s*\{/);
    expect(html).not.toMatch(/labels-revealed[^{]*\.density-strip/);
    expect(html).not.toMatch(/\.density-strip[^}]*display:\s*none/);
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
