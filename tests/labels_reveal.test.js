// 8ball / tests / labels_reveal.test.js
// Symbol-label visibility toggle (DOCTRINE.md §5 allow-list extension).
// Verifies the markup shape of the labels-reveal feature in index.html.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const shellCss = readFileSync(join(__dirname, '..', 'ui', 'shell.css'), 'utf-8');
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');
const labelsJs = readFileSync(join(__dirname, '..', 'ui', 'labels.js'), 'utf-8');

describe('labels-reveal — the toggle reveals the row titles (pr233 audit F5)', () => {
  // v0.74 retired the last two positive .labels-revealed pins with the
  // placard/atlas rules; inverting the shell rule then left a labeled
  // view showing NOTHING while the suite passed. Pin both halves.
  const shell = readFileSync(join(__dirname, '..', 'ui', 'shell.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
  it('titles are hidden by default and visible under .labels-revealed', () => {
    expect(shell).toMatch(/\.card \.coord-title \{[^}]*visibility: hidden;[^}]*\}/);
    expect(shell).toMatch(/\.card\.labels-revealed \.coord-title \{ visibility: visible; \}/);
  });
  it('no other rule in either stylesheet hides a title under .labels-revealed', () => {
    const exp = readFileSync(join(__dirname, '..', 'ui', 'experience.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [sel, decl] of [...(shell + exp).matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim(), m[2]])) {
      if (/labels-revealed/.test(sel) && /coord-title/.test(sel)) {
        expect(decl, sel).not.toMatch(/visibility:\s*hidden|display:\s*none|opacity:\s*0(?![.\d])/);
      }
    }
  });
});

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

  // v0.6.0: eight coordinate rows — arcana (lead) + element + sun + animal
  // + numerology + numbers2 + day pillar + hour pillar. Visibility per
  // tier is JS-gated by ui/tiers.js (tests/tiers.test.js); the markup
  // ships all eight rows.
  it('eight coord-section elements present', () => {
    const matches = html.match(/class="coord-section"/g) || [];
    expect(matches.length).toBe(9);
  });

  it('nine coord-title elements present (§1.K: the MOON row)', () => {
    const matches = html.match(/class="coord-title"/g) || [];
    expect(matches.length).toBe(9);
  });

  it('fifteen compartment value nodes present (v0.7.0 per-cell sheet + the §1.K moon)', () => {
    // 1+2+1+1+2+1+1+3+3 cells per the §1.F v0.72 groups plus the §1.K MOON
    // row; every cell carries one .coord-val value node.
    const matches = html.match(/class="coord-val"/g) || [];
    expect(matches.length).toBe(15);
  });

  it('locked title copy: FIVE-ELEMENT', () => {
    expect(html).toMatch(/>FIVE-ELEMENT</);
  });

  it('locked title copy: SUN ↑ RISING', () => {
    expect(html).toMatch(/>SUN ↑ RISING</);
  });

  it('coord-sun-title element has id for runtime conditional (v0.2.7.1.1)', () => {
    expect(html).toMatch(/<div class="coord-title" id="coord-sun-title">/);
  });

  it('coord-animal-title element has id for runtime conditional (v0.6.0)', () => {
    expect(html).toMatch(/<div class="coord-title" id="coord-animal-title">/);
  });

  it('tier render keeps the paired-row title grammar — SUN ↑ RISING vs SUN · RISING (v0.7.0)', () => {
    expect(tiersJs).toMatch(/sunTitle\.textContent\s*=\s*withRising\s*\?\s*['"`]SUN ↑ RISING['"`]\s*:\s*['"`]SUN · RISING['"`]/);
  });

  it('tier render keeps the paired-row title grammar — PUBLIC ⇌ PRIVATE vs PUBLIC · PRIVATE (v0.7.0)', () => {
    expect(tiersJs).toMatch(/animalTitle\.textContent\s*=\s*withInner\s*\?\s*['"`]PUBLIC ⇌ PRIVATE['"`]\s*:\s*['"`]PUBLIC · PRIVATE['"`]/);
  });

  it('locked title copy: PUBLIC ⇌ PRIVATE', () => {
    expect(html).toMatch(/>PUBLIC ⇌ PRIVATE</);
  });

  it('locked title copy: LIFE · NAME · SOUL', () => {
    expect(html).toMatch(/>LIFE · NAME · SOUL</);
  });

  it('locked title copy: PERSONALITY · BIRTHDAY · MATURITY (v0.6.0 t2 row)', () => {
    expect(html).toMatch(/>PERSONALITY · BIRTHDAY · MATURITY</);
  });

  it('locked title copy: DAY PILLAR + HOUR PILLAR — clinical register (v0.6.0 §2 voice)', () => {
    expect(html).toMatch(/>DAY PILLAR</);
    expect(html).toMatch(/>HOUR PILLAR</);
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

  // The pr223 audit proved whole-file toMatch pins vacuous in the file's
  // own documented failure class (an appended media condition disabled the
  // whole fix at the field viewport with the suite green; a decoy block
  // rode green too). The pins below therefore operate on the EXTRACTED
  // injected stylesheet — the STYLE template literal the module actually
  // ships — and its contract since the 2026-08-31 layout audit is that
  // the rules are UNCONDITIONAL: no media query may scope them at all,
  // because every width band a condition excludes is a band where the
  // WKWebView ratio-box trap re-arms (sub-720 was the phone field report;
  // ≥720 measured +146..+465px on the side rail, iPad-class WebViews).
  const styleBlock = (() => {
    const m = labelsJs.match(/const STYLE = `\n([\s\S]*?)`;/);
    return m ? m[1] : '';
  })();

  it('the injected stylesheet exists and carries no condition of any kind', () => {
    // Delta-audit hardening, both halves: (1) exactly ONE STYLE literal in
    // the module — the extractor takes the first match, so a dead decoy
    // literal ahead of the real one satisfied every pin below while the
    // shipped payload drifted free; (2) NO at-rule of any kind, not just
    // @media — an @layer wrapper survived the @media ban with the suite
    // green and re-armed the trap at 390×844 (+135px, the field viewport):
    // layered rules lose to the unlayered shell, so any scoping at-rule
    // (@media, @layer, @supports, @container) is a re-narrowing.
    expect((labelsJs.match(/const STYLE = /g) || []).length).toBe(1);
    expect(styleBlock.length, 'STYLE literal missing or malformed').toBeGreaterThan(50);
    expect(styleBlock).not.toMatch(/@/);
    expect(styleBlock).toMatch(/\.flip-stage\s*\{[^}]*height:\s*auto/);
  });

  it('the shell never re-arms the ratio box on the flip surfaces (delta audit MED-3)', () => {
    // One higher-specificity line in the shell (`#result .flip-stage {
    // aspect-ratio: 5 / 8; }`) beat the injected same-specificity rules and
    // restored the 576px box against a 722px card with the whole suite
    // green. The injected stylesheet wins today only because the base
    // `.flip-stage` selector ties it and loses on order; the contract is
    // therefore pinned at the source: in the two host stylesheets, the ONLY
    // rule targeting a flip surface that may declare aspect-ratio or height
    // is the base `.flip-stage` rule (the box the injection releases) and
    // `.flip-side .card, .flip-side .card-back`'s height:100% (the
    // back-beat contract the injection deliberately preserves).
    const experienceCss = readFileSync(join(__dirname, '..', 'ui', 'experience.css'), 'utf-8');
    for (const source of [shellCss, experienceCss]) {
      const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
      const re = /([^{}]+)\{([^{}]*)\}/g;
      let m;
      while ((m = re.exec(noComments)) !== null) {
        const sels = m[1].split(',').map(x => x.trim());
        if (!sels.some(s => /flip-stage|flip-inner|flip-side/.test(s))) continue;
        // A RELEASE (aspect-ratio: auto) is always legal — it is the fix's
        // own vocabulary. A ratio VALUE re-arms the box and is legal only
        // on the three single-selector BASE rules: `.flip-stage` (the box
        // the injection is ordered after and releases), and the bare
        // `.card` / `.card-back` boxes (whose ratio GIVES their height on
        // surfaces with smaller content; on the flip surfaces both are
        // released by `.flip-side .card, .flip-side .card-back`'s auto,
        // and the dyad screen releases its sheets by data attribute).
        const RATIO_BASES = ['.flip-stage', '.card', '.card-back'];
        const ratioValues = [...m[2].matchAll(/aspect-ratio\s*:\s*([^;]+)/g)].map(v => v[1].trim());
        for (const v of ratioValues) {
          if (v === 'auto') continue;
          expect(sels.length === 1 && RATIO_BASES.includes(sels[0]),
            `ratio-box value "${v}" on "${m[1].trim()}" would out-cascade the injected release`).toBe(true);
        }
        // Heights on flip surfaces may only be auto (a release) or 100%
        // (the back-beat contract); any fixed value is the same trap.
        const heights = [...m[2].matchAll(/(?:^|;)\s*height\s*:\s*([^;]+)/g)].map(h => h[1].trim());
        for (const h of heights) {
          expect(['auto', '100%'].includes(h), `fixed height "${h}" on "${m[1].trim()}"`).toBe(true);
        }
      }
    }
  });

  // PR-196 premerge audit (relay, 2026-08-02): the base .flip-stage rule in
  // the shell styles (index.html then; ui/shell.css since the 2026-08-31
  // split) sets NO height — only the 5/8 aspect-ratio box — so
  // `height: auto` above pins a no-op declaration. `aspect-ratio: auto` is
  // the property that actually releases the fixed box; without this pin the
  // suite stayed green with the fix deleted.
  it('pins aspect-ratio: auto — the declaration that actually releases the 5/8 box', () => {
    expect(styleBlock).toMatch(/\.flip-stage\s*\{[^}]*aspect-ratio:\s*auto/);
  });

  // pr223 audit MED-3: Chromium-invisible, so only a pin can hold it. The
  // grid's min-height released here is part of the explicit-layout contract
  // the #196 fix established.
  it('pins min-height: 0 on the inner grid — Chromium-invisible, WKWebView-load-bearing', () => {
    expect(styleBlock).toMatch(/\.flip-inner\s*\{[^}]*min-height:\s*0/);
  });

  // 2026-08-31 field report (iOS in-app browser): with labels HIDDEN the
  // resting card had outgrown the ratio box too — the kua sealed block and
  // the comprehension hint pushed the free card past the 5/8 height at
  // every sub-720 width — and the same WKWebView non-growth painted the
  // card over the $3 offer. The layout rule is therefore unconditional on
  // mobile. A token ban over the whole extracted block, not a selector
  // regex: the pr223 audit dodged the first version with a descendant
  // combinator, so ANY reappearance of the class inside the block —
  // whatever the selector shape — reintroduces the resting overflow on the
  // engines the fix exists for and fails here.
  it('the intrinsic-height rules never condition on labels-revealed, in any selector shape', () => {
    expect(styleBlock).not.toMatch(/labels-revealed/);
  });

  // PR-196 premerge audit: only the FRONT card drops to intrinsic height.
  // The back face keeps index.html's height:100% (definite once the front's
  // content has sized the grid row), so the pre-flip back-beat paints a
  // full-height card back, not a content-height strip in a tall stage.
  it('drops only the front card to intrinsic height; the back face keeps its full-height rule', () => {
    expect(labelsJs).toMatch(/\.flip-side \.card\s*\{[^}]*height:\s*auto/);
    expect(labelsJs).not.toMatch(/\.flip-side \.card-back/);
  });

  it('leaves the side-rail LAYOUT to the shell — this module only releases heights', () => {
    // Since the 2026-08-31 layout audit the height rules deliberately apply
    // at every width (the >=720 rail was the last trap band); the shell
    // still owns the rail's flex layout, and this module must never grow
    // its own breakpoints back.
    expect(labelsJs).not.toMatch(/min-width:\s*720px/);
    expect(styleBlock).not.toMatch(/flex|grid-template|max-width/);
    // The mobile flip-stage layout stays owned by ui/labels.js (pr223: the
    // rule is unconditional now, no longer keyed to .labels-revealed) — a
    // competing .flip-stage.labels-revealed definition appearing in the
    // shell (index.html markup or ui/shell.css, where the side-rail block
    // moved on 2026-08-31) would re-condition the layout behind this
    // module's back.
    expect(html + shellCss).not.toMatch(/\.flip-stage\.labels-revealed/);
  });

  it('self-injects its stylesheet the same way ui/dyad.js does (idempotent, scoped <style> id)', () => {
    expect(labelsJs).toMatch(/document\.getElementById\(\s*['"]labels-style['"]\s*\)/);
    expect(labelsJs).toMatch(/style\.id = ['"]labels-style['"]/);
  });
});
