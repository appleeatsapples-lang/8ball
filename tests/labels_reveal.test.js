// 8ball / tests / labels_reveal.test.js
// Symbol-label visibility toggle (DOCTRINE.md §5 allow-list extension).
// Verifies the markup shape of the labels-reveal feature in index.html.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');
const labelsJs = readFileSync(join(__dirname, '..', 'ui', 'labels.js'), 'utf-8');

describe('labels-reveal toggle (v0.2.7)', () => {
  it('toggle button element exists with id', () => {
    expect(html).toMatch(/id="labels-toggle"/);
  });

  it('default toggle copy is "→ reveal labels"', () => {
    expect(html).toMatch(/→ reveal labels/);
  });

  it('toggle has aria-pressed attribute (default false)', () => {
    expect(html).toMatch(/id="labels-toggle"[^>]*aria-pressed="false"/);
  });

  // §1.L v0.66 — the sheet is FOUR system lines (tarot · astro ·
  // numerology · animals), one per divination system, no interleaving.
  // Visibility per tier is still JS-gated per CELL by ui/tiers.js
  // (tests/tiers.test.js); the markup ships all four lines and all
  // fifteen compartments at every tier.
  it('four coord-section elements present', () => {
    const matches = html.match(/class="coord-section"/g) || [];
    expect(matches.length).toBe(4);
  });

  it('four coord-title elements present', () => {
    const matches = html.match(/class="coord-title"/g) || [];
    expect(matches.length).toBe(4);
  });

  it('fifteen compartment value nodes present (v0.7.0 per-cell sheet)', () => {
    // 1+1+2+1+2+3+3+1+1 cells per the §1.D v0.37 row table (+moon, §1.K);
    // every cell carries one .coord-val value node.
    const matches = html.match(/class="coord-val"/g) || [];
    expect(matches.length).toBe(15);
  });

  it('locked title copy: the four system lines, in order (§1.L v0.66)', () => {
    for (const title of ['TAROT', 'ASTRO', 'NUMEROLOGY', 'ANIMALS']) {
      expect(html, `${title} line missing`).toMatch(new RegExp(`>${title}<`));
    }
    const order = [...html.matchAll(/<div class="coord-title">([^<]+)<\/div>/g)].map(m => m[1]);
    expect(order).toEqual(['TAROT', 'ASTRO', 'NUMEROLOGY', 'ANIMALS']);
  });

  it('the retired per-coordinate row titles are gone from the markup', () => {
    // Superseded by the four system lines; DOCTRINE §1.L quotes them as
    // lineage, the shipped surface must not.
    for (const retired of ['FIVE-ELEMENT', 'SUN ↑ RISING', 'SUN · RISING',
      'PUBLIC ⇌ PRIVATE', 'PUBLIC · PRIVATE', 'LIFE · NAME · SOUL',
      'PERSONALITY · BIRTHDAY · MATURITY', 'DAY PILLAR', 'HOUR PILLAR']) {
      expect(html, `retired title "${retired}" still shipped`).not.toContain(`>${retired}<`);
    }
  });

  it('the retired dynamic-title ids are gone with the grammar they served', () => {
    // coord-sun-title / coord-animal-title existed only so the render path
    // could rewrite those two titles per tier; titles are static now.
    expect(html).not.toMatch(/id="coord-sun-title"/);
    expect(html).not.toMatch(/id="coord-animal-title"/);
    expect(tiersJs).not.toMatch(/(sunTitle|animalTitle)\s*\.textContent\s*=/);
  });

  it('localStorage key lives in ui/labels.js (canonical labels key, §6 split)', () => {
    // The toggle controller moved out of index.html into ui/labels.js during
    // the desktop side-rail cycle; the key is now owned there as a bare const
    // so tests/privacy_scan.test.js's same-file identifier lookup resolves it.
    expect(labelsJs).toMatch(/const LABELS_KEY = 'eight_ball_labels_revealed_v1'/);
  });

  it('about-modal discloses the toggle', () => {
    const m = html.match(/id="about-modal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    expect(m, 'about-modal subtree not found').not.toBeNull();
    expect(m[0]).toMatch(/toggle|symbol names|labels/i);
  });
});

// DI shape of the extracted controller (DOCTRINE §6 v0.23 — locked split
// shape: init*UI({refs}, {hooks}) + pure exports testable without jsdom).
describe('ui/labels.js DI shape (DOCTRINE §6)', () => {
  it('exports initLabelsUI with (refs, hooks) arity', () => {
    expect(labelsJs).toMatch(/export function initLabelsUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('exports the pure persistence helpers', () => {
    expect(labelsJs).toMatch(/export function isLabelsRevealed\s*\(/);
    expect(labelsJs).toMatch(/export function setLabelsRevealed\s*\(/);
  });

  it('index.html boots the labels surface via initLabelsUI', () => {
    expect(html).toMatch(/import\s*\{[^}]*initLabelsUI[^}]*\}\s*from\s*['"]\.\/ui\/labels\.js['"]/);
    expect(html).toMatch(/initLabelsUI\(/);
  });
});

// iOS/WebKit revealed-label overlap fix (2026-08-02): revealed labels make
// the card taller than its compact 5/8 face, and the flip-stage box that
// wraps it doesn't reliably grow to match on WebKit, so the excess paints
// over the result rail stacked below it on mobile. ui/labels.js now toggles
// a layout-state class on #flip-stage in the same function that toggles
// #card-face, and self-injects the mobile-only CSS that consumes it (the
// same pattern tests/dyad_surface.test.js pins for ui/dyad.js's
// injectStyle/STYLE). These are source pins; tests/meanings_behavior.test.js
// runs initLabelsUI for real and asserts the class actually moves together
// on both elements through every call path (click + boot-time apply).
describe('flip-stage revealed-label layout state (iOS/WebKit fix)', () => {
  it('index.html wires #flip-stage into initLabelsUI', () => {
    expect(html).toMatch(/initLabelsUI\(\{[^}]*flipStage:\s*\$\('flip-stage'\)/);
  });

  it('applyLabelsState toggles labels-revealed on flipStage, not just cardFace', () => {
    expect(labelsJs).toMatch(
      /flipStage\.classList\.toggle\(\s*['"]labels-revealed['"]\s*,\s*revealed\s*\)/
    );
  });

  it('the mobile-only intrinsic-height override lives below the 720px side-rail breakpoint', () => {
    expect(labelsJs).toMatch(/@media \(max-width: 719\.98px\)/);
    expect(labelsJs).toMatch(/\.flip-stage\.labels-revealed\s*\{[^}]*height:\s*auto/);
  });

  // PR-196 premerge audit (relay, 2026-08-02): the base .flip-stage rule in
  // index.html sets NO height — only the 5/8 aspect-ratio box — so
  // `height: auto` above pins a no-op declaration. `aspect-ratio: auto` is
  // the property that actually releases the fixed box; without this pin the
  // suite stayed green with the fix deleted.
  it('pins aspect-ratio: auto — the declaration that actually releases the 5/8 box', () => {
    expect(labelsJs).toMatch(/\.flip-stage\.labels-revealed\s*\{[^}]*aspect-ratio:\s*auto/);
  });

  // PR-196 premerge audit: only the FRONT card drops to intrinsic height.
  // The back face keeps index.html's height:100% (definite once the front's
  // content has sized the grid row), so the pre-flip back-beat paints a
  // full-height card back, not a content-height strip in a tall stage.
  it('drops only the front card to intrinsic height; the back face keeps its full-height rule', () => {
    expect(labelsJs).toMatch(/\.flip-side \.card\s*\{[^}]*height:\s*auto/);
    expect(labelsJs).not.toMatch(/\.flip-side \.card-back/);
  });

  it('does not touch the ≥720px desktop side-rail breakpoint (index.html owns that block)', () => {
    expect(labelsJs).not.toMatch(/min-width:\s*720px/);
    expect(html).not.toMatch(/\.flip-stage\.labels-revealed/);
  });

  it('self-injects its stylesheet the same way ui/dyad.js does (idempotent, scoped <style> id)', () => {
    expect(labelsJs).toMatch(/document\.getElementById\(\s*['"]labels-style['"]\s*\)/);
    expect(labelsJs).toMatch(/style\.id = ['"]labels-style['"]/);
  });
});
