// 8ball / tests / monochrome_surface.test.js
//
// Pins the black-background / white-writing monochrome surface (operator
// decision, journal 2026-07-29) that superseded the Phase-2E cream lock
// (`--paper: #ebe5d4`). Static-scan style, mirrors tests/share_surface.js /
// tests/payments_markup.test.js: read the shipped source as text and assert
// the surface shape a scan can prove — no jsdom, no rendering, no computed
// styles. If the warm palette (or a new chromatic one) creeps back into any
// consumer, this suite is the tripwire.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const citysearchJs = read('ui', 'citysearch.js');
const meaningsJs = read('ui', 'meanings.js');
const readingsJs = read('ui', 'readings.js');
const shareJs = read('ui', 'share.js');
const allSource = [html, citysearchJs, meaningsJs, readingsJs, shareJs].join('\n');

// WCAG relative-luminance contrast ratio for a white-alpha color composited
// over a pure black surface (no other blend layers) vs. that same black.
function contrastOfWhiteAlphaOnBlack(alpha) {
  const c = alpha; // white channel after compositing over black == alpha
  const lin = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return (lin + 0.05) / 0.05;
}

describe('monochrome surface — retired palette never returns', () => {
  it('no active source occurrence of any Phase-2E cream/warm-gray token', () => {
    // Old hex tokens (--paper/--ink/--rule/--label/--label-on-dark) and the
    // undefined --paper-bg fallback that used to leak into citysearch.js.
    const banned = [
      '#ebe5d4', '#1a1812', '#8a8472', '#5a5444', '#837c69', '#0e0c0a',
    ];
    for (const hex of banned) {
      expect(allSource, `${hex} must not appear in shipped source`).not.toContain(hex);
    }
    // The raw rgba() blends of --ink / --rule baked directly into
    // coord-cell/hatch/meanings rules (not routed through a var()).
    expect(allSource).not.toMatch(/rgba\(\s*26,\s*24,\s*18/);
    expect(allSource).not.toMatch(/rgba\(\s*138,\s*132,\s*114/);
    // The retired variable names themselves, in case a future edit
    // reintroduces them pointing at a new (still warm) value.
    expect(allSource).not.toMatch(/--paper\b/);
    expect(allSource).not.toMatch(/--ink\b/);
    expect(allSource).not.toMatch(/--label\b/);
    expect(allSource).not.toMatch(/--label-on-dark\b/);
    expect(allSource).not.toMatch(/--page-bg\b/);
  });

  it('theme-color is black', () => {
    expect(html).toMatch(/<meta name="theme-color" content="#000000">/);
  });

  it('the semantic token block is black-background / white-writing', () => {
    expect(html).toMatch(/--bg:\s*#000;/);
    expect(html).toMatch(/--surface:\s*#000;/);
    expect(html).toMatch(/--text:\s*#fff;/);
    expect(html).toMatch(/--text-muted:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);/);
    expect(html).toMatch(/--text-placeholder:\s*rgba\(255,\s*255,\s*255,\s*0\.55\);/);
    expect(html).toMatch(/--rule:\s*rgba\(255,\s*255,\s*255,\s*0\.45\);/);
    expect(html).toMatch(/--interaction-fill:\s*rgba\(255,\s*255,\s*255,\s*0\.10\);/);
    expect(html).toMatch(/--interaction-fill-active:\s*rgba\(255,\s*255,\s*255,\s*0\.16\);/);
  });

  it('card and modal surfaces resolve to the black --surface token, not a light fill', () => {
    expect(html).toMatch(/\.card\s*\{[^}]*background:\s*var\(--surface\)/);
    expect(html).toMatch(/\.card-back\s*\{[^}]*background:\s*var\(--surface\)/);
    expect(html).toMatch(/\.modal\s*\{[^}]*background:\s*var\(--surface\)/);
  });

  it('primary, muted and placeholder text meet their contrast targets on black', () => {
    // primary --text is opaque #fff — 21:1 by construction, nothing to compute.
    expect(contrastOfWhiteAlphaOnBlack(0.72)).toBeGreaterThanOrEqual(4.5); // --text-muted
    expect(contrastOfWhiteAlphaOnBlack(0.55)).toBeGreaterThanOrEqual(4.5); // --text-placeholder
    expect(contrastOfWhiteAlphaOnBlack(0.45)).toBeGreaterThanOrEqual(3); // --rule (border/focus, not text)
  });

  it('focus-visible outlines are at least two pixels, never one', () => {
    const focusVisibleBlocks = allSource.match(/:focus-visible[^{]*\{[^}]*\}/g) || [];
    expect(focusVisibleBlocks.length).toBeGreaterThan(0);
    for (const block of focusVisibleBlocks) {
      const outline = block.match(/outline:\s*(\d+)px/);
      if (outline) expect(Number(outline[1]), block).toBeGreaterThanOrEqual(2);
    }
    expect(allSource).not.toMatch(/:focus-visible[^{]*\{[^}]*outline:\s*1px/);
  });

  it('active/selected controls use a stronger white-alpha fill, not inversion to black text', () => {
    // The one deliberate exception is the paywall CTA (solid white fill,
    // black text) — every OTHER active/selected control must keep --text.
    expect(html).toMatch(/\.btn\.active,\s*\n\s*\.btn:active\s*\{\s*background:\s*var\(--interaction-fill-active\);\s*color:\s*var\(--text\);/);
    expect(html).toMatch(/\.modal-actions \.btn:active,\s*\n\s*\.modal \.modal-actions \.btn\.active\s*\{\s*background:\s*var\(--interaction-fill-active\)/);
  });

  it('share SVG palette is black background + white primary text, fully achromatic', () => {
    const paper = shareJs.match(/const PAPER = '(#[0-9a-fA-F]{6})';/);
    const ink = shareJs.match(/const INK = '(#[0-9a-fA-F]{6})';/);
    const label = shareJs.match(/const LABEL = '(#[0-9a-fA-F]{6})';/);
    const rule = shareJs.match(/const RULE = '(#[0-9a-fA-F]{6})';/);
    expect(paper, 'PAPER constant missing').not.toBeNull();
    expect(ink, 'INK constant missing').not.toBeNull();
    expect(label, 'LABEL constant missing').not.toBeNull();
    expect(rule, 'RULE constant missing').not.toBeNull();
    expect(paper[1]).toBe('#000000');
    expect(ink[1]).toBe('#ffffff');
    for (const [, hex] of [paper, ink, label, rule]) {
      const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
      expect(r, `${hex} must be achromatic (R=G=B)`).toBe(g);
      expect(g, `${hex} must be achromatic (R=G=B)`).toBe(b);
    }
  });

  it('the in-app specimen preview renders achromatic without a new tracked asset', () => {
    expect(html).toMatch(/\.paywall-specimen img\s*\{[^}]*filter:\s*grayscale\(1\)[^}]*\}/);
  });

  it('every rendered color literal in the shared surfaces is achromatic (R=G=B)', () => {
    const hexes = allSource.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const hex of hexes) {
      const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
      expect(r.toLowerCase(), `${hex} must be achromatic`).toBe(g.toLowerCase());
      expect(g.toLowerCase(), `${hex} must be achromatic`).toBe(b.toLowerCase());
    }
    const rgbaTriplets = allSource.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g) || [];
    for (const triplet of rgbaTriplets) {
      const [, r, g, b] = triplet.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      expect(`${r},${g},${b}`, `${triplet} must be achromatic`).toBe(`${r},${r},${r}`);
    }
  });
});
