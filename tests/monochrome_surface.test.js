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
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf-8');
const html = read('index.html');
const shellCss = read('ui', 'shell.css');
const shareJs = read('ui', 'share.js');
// All ui/*.js modules AND ui/*.css stylesheets, not a hand-picked
// subset — a stray old-token consumer in an untouched-looking module
// (concordance/labels/modals/payments/profile/public/tiers) must not go
// unscanned just because this change's own file list didn't happen to
// name it. The .css leg was added when the shell styles moved out of
// index.html (2026-08-31): without it, both shell.css and the
// pre-existing experience.css would sit outside every palette scan.
const uiFiles = readdirSync(join(root, 'ui')).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
const allSource = [html, ...uiFiles.map((f) => read('ui', f))].join('\n');

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
      '#ebe5d4', '#1a1812', '#8a8472', '#5a5444', '#837c69', '#0e0c0a', '#0a0a0a',
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
    expect(shellCss).toMatch(/--bg:\s*#000;/);
    expect(shellCss).toMatch(/--surface:\s*#000;/);
    expect(shellCss).toMatch(/--text:\s*#fff;/);
    expect(shellCss).toMatch(/--text-muted:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);/);
    expect(shellCss).toMatch(/--text-placeholder:\s*rgba\(255,\s*255,\s*255,\s*0\.55\);/);
    expect(shellCss).toMatch(/--rule:\s*rgba\(255,\s*255,\s*255,\s*0\.45\);/);
    expect(shellCss).toMatch(/--interaction-fill:\s*rgba\(255,\s*255,\s*255,\s*0\.10\);/);
    expect(shellCss).toMatch(/--interaction-fill-active:\s*rgba\(255,\s*255,\s*255,\s*0\.16\);/);
  });

  it('card and modal surfaces resolve to the black --surface token, not a light fill', () => {
    expect(shellCss).toMatch(/\.card\s*\{[^}]*background:\s*var\(--surface\)/);
    expect(shellCss).toMatch(/\.card-back\s*\{[^}]*background:\s*var\(--surface\)/);
    expect(shellCss).toMatch(/\.modal\s*\{[^}]*background:\s*var\(--surface\)/);
  });

  it('primary, muted and placeholder text meet their contrast targets on black', () => {
    // primary --text is opaque #fff — 21:1 by construction, nothing to compute.
    expect(contrastOfWhiteAlphaOnBlack(0.72)).toBeGreaterThanOrEqual(4.5); // --text-muted
    expect(contrastOfWhiteAlphaOnBlack(0.55)).toBeGreaterThanOrEqual(4.5); // --text-placeholder
    expect(contrastOfWhiteAlphaOnBlack(0.45)).toBeGreaterThanOrEqual(3); // --rule (border/focus, not text)
  });

  it('the coord-cell border and seal-hatch lines clear the 3:1 non-text UI floor', () => {
    // These are raw rgba literals (not var(--rule)), produced by a straight
    // channel inversion from the old ink-alpha values with the alpha left
    // unchanged — 0.25/0.20 measured 2.02:1/1.66:1 on the new black surface,
    // under the brief's own 3:1 floor for borders/state-bearing indicators
    // (confirmed reproducible, 2026-07-29 cross-model audit). Pin both the
    // literal values AND that whatever they are now clears 3:1, so a future
    // edit can't quietly drop back below the floor.
    const coordCellBorder = shellCss.match(/\.coord-cell\s*\{[^}]*border:\s*1px solid rgba\(\s*255,\s*255,\s*255,\s*([\d.]+)\)/);
    const sealHatch = shellCss.match(/\.card\.seal-hatch \.coord-seal\s*\{[^}]*rgba\(\s*255,\s*255,\s*255,\s*([\d.]+)\)/);
    expect(coordCellBorder, '.coord-cell border rgba not found').not.toBeNull();
    expect(sealHatch, '.seal-hatch rgba not found').not.toBeNull();
    expect(contrastOfWhiteAlphaOnBlack(Number(coordCellBorder[1]))).toBeGreaterThanOrEqual(3);
    expect(contrastOfWhiteAlphaOnBlack(Number(sealHatch[1]))).toBeGreaterThanOrEqual(3);
  });

  it('--rule is never used as a text color (it is 4.41:1, under the 4.5:1 AA floor)', () => {
    // --rule (0.45 alpha) is the border/divider/focus token — 3:1 is its own
    // contract, computed above. If a `color:` declaration ever points at it,
    // that usage needs 4.5:1 for normal text and --rule doesn't clear that
    // (confirmed 2026-07-29 cross-model audit: 13 such sites shipped in the
    // first monochrome pass, all AA text-contrast failures). Repoint any
    // future text usage to --text-muted (already 10.5:1) instead of loosening
    // --rule itself, which would also weaken every border/divider it draws.
    expect(allSource).not.toMatch(/(?<![-\w])color:\s*var\(--rule\)/);
  });

  it('focus-visible outlines are at least two pixels, never one', () => {
    const focusVisibleBlocks = allSource.match(/:focus-visible[^{]*\{[^}]*\}/g) || [];
    expect(focusVisibleBlocks.length).toBeGreaterThan(0);
    for (const block of focusVisibleBlocks) {
      // Shorthand (`outline: 2px solid ...`) and longhand (`outline-width:
      // 2px`) both need catching — a future rewrite to longhand form would
      // silently bypass a shorthand-only regex (confirmed reproducible,
      // 2026-07-29 cross-model audit).
      const outline = block.match(/outline(?:-width)?:\s*(\d+)px/);
      if (outline) expect(Number(outline[1]), block).toBeGreaterThanOrEqual(2);
    }
    expect(allSource).not.toMatch(/:focus-visible[^{]*\{[^}]*outline(?:-width)?:\s*1px/);
  });

  it('active/selected controls use a stronger white-alpha fill, not inversion to black text', () => {
    // The one deliberate exception is the paywall CTA (solid white fill,
    // black text) — every OTHER active/selected control must keep --text.
    expect(shellCss).toMatch(/\.btn\.active,\s*\n\s*\.btn:active\s*\{\s*background:\s*var\(--interaction-fill-active\);\s*color:\s*var\(--text\);/);
    expect(shellCss).toMatch(/\.modal-actions \.btn:active,\s*\n\s*\.modal \.modal-actions \.btn\.active\s*\{\s*background:\s*var\(--interaction-fill-active\)/);
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

  it('the paywall specimen preview is retired with the storefront (free amendment)', () => {
    // Its achromatic-filter pin guarded the only in-app color image; with
    // the paywall gone the selector must be gone too, not merely unstyled.
    expect(shellCss).not.toMatch(/paywall-specimen/);
  });

  it('every rendered color literal in the shared surfaces is achromatic (R=G=B)', () => {
    const hexes6 = allSource.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const hex of hexes6) {
      const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7);
      expect(r.toLowerCase(), `${hex} must be achromatic`).toBe(g.toLowerCase());
      expect(g.toLowerCase(), `${hex} must be achromatic`).toBe(b.toLowerCase());
    }
    // 3-digit shorthand (#000, #fff, ...) — a 6-digit-only regex misses these
    // entirely (confirmed 2026-07-29 cross-model audit: --bg/--surface/--text
    // and .modal-cta's #000 all ship as shorthand and were unverified by this
    // scan). \b after a hex run only breaks on a non-word char, so exclude a
    // 4th hex digit to avoid matching the first 3 of a 6-digit code twice.
    // Only match in a plausible CSS-value position (after `:` or `,` — a
    // property assignment or a comma-separated arg like var(--x, #000)) so a
    // `(#101/#107)`-style PR/issue reference in a comment doesn't false
    // -positive — those are valid hex DIGITS (0-9 is a subset of 0-9a-f) but
    // not color literals. Deliberately excludes bare `(` as a trigger:
    // nothing in this codebase's CSS opens a hex value directly after `(`.
    const hexes3Matches = [...allSource.matchAll(/[:,]\s*(#[0-9a-fA-F]{3})\b(?![0-9a-fA-F])/g)];
    for (const m of hexes3Matches) {
      const hex = m[1];
      const [r, g, b] = [hex[1], hex[2], hex[3]];
      expect(r.toLowerCase(), `${hex} must be achromatic`).toBe(g.toLowerCase());
      expect(g.toLowerCase(), `${hex} must be achromatic`).toBe(b.toLowerCase());
    }
    const rgbaTriplets = allSource.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g) || [];
    for (const triplet of rgbaTriplets) {
      const [, r, g, b] = triplet.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      expect(`${r},${g},${b}`, `${triplet} must be achromatic`).toBe(`${r},${r},${r}`);
    }
  });

  it('no HSL/named chromatic color literal anywhere in the touched surfaces', () => {
    // The R=G=B hex/rgb scan above can't see hsl()/hsla() or CSS named
    // colors — a `color: red` or `background: hsl(45,100%,50%)` would ship
    // green through every other check here (verified reproducible,
    // 2026-07-29 cross-model audit). Ban both outright: this surface has no
    // legitimate use for either.
    expect(allSource).not.toMatch(/\bhsla?\(/i);
    const chromaticNamed = [
      'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
      'gold', 'cyan', 'magenta', 'teal', 'navy', 'maroon', 'olive', 'lime',
      'indigo', 'violet', 'salmon', 'coral', 'crimson', 'beige', 'tan',
    ];
    for (const name of chromaticNamed) {
      const re = new RegExp(`:\\s*${name}\\b`, 'i');
      expect(allSource, `color: ${name} must not appear`).not.toMatch(re);
    }
  });
});
