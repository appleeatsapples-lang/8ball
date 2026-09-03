// tests/meanings_ui.test.js
// ui/meanings.js DI shape (DOCTRINE §6 v0.23) + index.html boot wiring pins.
// Static-source assertions, matching the convention in tests/modals.test.js
// and tests/tiers.test.js — no jsdom environment configured for this repo.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPanelMarkup, panelDetailFor, coordinateLabel } from '../ui/meanings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const shellCss = readFileSync(join(__dirname, '..', 'ui', 'shell.css'), 'utf-8');
const experienceCss = readFileSync(join(__dirname, '..', 'ui', 'experience.css'), 'utf-8');
const meaningsJs = readFileSync(join(__dirname, '..', 'ui', 'meanings.js'), 'utf-8');

describe('ui/meanings.js DI shape + boot wiring', () => {
  it('exports initMeaningsUI with a single refs-object arity', () => {
    expect(meaningsJs).toMatch(/export function initMeaningsUI\s*\(\s*refs\s*\)/);
  });

  it('index.html imports and calls initMeaningsUI once, passing cardFace and the reading pane', () => {
    expect(html).toMatch(/import\s*{\s*initMeaningsUI\s*}\s*from\s*'\.\/ui\/meanings\.js'/);
    // The pane ref is the ≥1100 desk's dock (tests/desk_layout.test.js);
    // cardFace stays first and stays the panel's home below the breakpoint.
    expect(html).toMatch(/initMeaningsUI\(\{\s*cardFace,\s*readingPane:\s*\$\('reading-pane'\)\s*\}\)/);
    expect((html.match(/initMeaningsUI\(/g) || []).length).toBe(1);
  });

  it('the moon carries its own unresolved line naming what completes it (pr232 audit L9)', () => {
    const m = meaningsJs.match(/\n  moon: '([^']+)',/);
    expect(m, 'UNRESOLVED_COPY.moon missing').not.toBeNull();
    expect(m[1]).toMatch(/^no moon value is present yet/);
    expect(m[1]).toMatch(/birth time/);
    expect(m[1]).toMatch(/timezone/);
    expect(m[1]).not.toMatch(/\byou\b|\byour\b/);
  });

  it('excludes catalog from COORDINATES — no detail trigger for the compound card', () => {
    expect(meaningsJs).not.toMatch(/catalog:\s*'coord-catalog/);
  });

  it('registers every coordinate value id as interactive', () => {
    for (const id of [
      'coord-arcana-symbol', 'coord-element-symbol',
      'coord-sun-symbol', 'coord-rising-symbol', 'coord-moon-symbol',
      'coord-animal-symbol', 'coord-inner-symbol',
      'coord-lifepath-symbol', 'coord-namenumber-symbol', 'coord-soulurge-symbol',
      'coord-personality-symbol', 'coord-birthday-symbol', 'coord-maturity-symbol',
      'coord-daypillar-symbol', 'coord-hourpillar-symbol',
    ]) {
      expect(meaningsJs).toContain(`valueId: '${id}'`);
    }
  });

  it('imports the expanded meaning/context registry from meanings.v6.js', () => {
    expect(meaningsJs).toMatch(
      /import\s*{[\s\S]*ARCANA_MEANINGS,[\s\S]*ELEMENT_MEANINGS,[\s\S]*COORDINATE_CONTEXT,[\s\S]*PLACEMENT_LINES,[\s\S]*}\s*from\s*'\.\.\/content\/meanings\.v6\.js'/
    );
  });

  it('the open panel fits the grown prose: 720px cap with overflow-y auto, never a silent clip', () => {
    // pr212 audit (opus headline): a cap + overflow:hidden cut the grown
    // bodies mid-sentence with no scrollbar. pr213's full §1.I emission
    // set grew the relation line, so the cap is 720px now — and overflow
    // must scroll, so any future growth degrades to a scroll, never to
    // silent loss.
    expect(meaningsJs).toMatch(/\.meaning-panel\.open \{ max-height: 720px; overflow-y: auto;/);
  });

  it('uses meaning context rather than derivation/provenance copy in the BODY', () => {
    expect(meaningsJs).toContain('harmonyFor');
    expect(meaningsJs).toContain('in this sheet');
    // the registries never reach the body: the v0.74 derivation line is its
    // own node, composed by ui/tiers.js derivationText, written on open
    expect(meaningsJs).not.toMatch(/PROV_NOTE|ATLAS_NOTE|derived by/);
    expect(meaningsJs).toMatch(/derivation\.textContent = derivationText\(key\);/);
    expect(meaningsJs).not.toMatch(/body\.textContent = [^;]*derivation/);
  });

  it('v0.74: the panel carries the derivation line between head and title, hidden when empty', () => {
    // v0.76: the panel parts are built by buildPanelMarkup(prefix) so the dyad
    // screen can carry a second panel under `dyad-meaning-`; the host's
    // markup is the `meaning` prefix and keeps its order
    const parts = buildPanelMarkup('meaning');
    expect(parts).toMatch(/id="meaning-head"><\/div><div class="meaning-derivation" id="meaning-derivation"><\/div><div class="meaning-title"/);
    expect(meaningsJs).toMatch(/panel\.innerHTML = buildPanelMarkup\('meaning'\);/);
    const dyad = buildPanelMarkup('dyad-meaning');
    expect(dyad).not.toMatch(/id="meaning-/);
    expect(dyad.match(/id="dyad-meaning-[a-z-]+"/g)).toHaveLength(9);
    expect(meaningsJs).toMatch(/\.meaning-derivation:empty \{ display: none; \}/);
  });

  it('injects its own style/panel rather than editing index.html markup/CSS', () => {
    // Structural guard for the "2-line index.html footprint" design constraint.
    expect(html).not.toMatch(/id="meaning-panel"/);
    expect(html + shellCss).not.toMatch(/\.meaning-panel\s*\{/);
    expect(meaningsJs).toMatch(/document\.createElement\('style'\)/);
    expect(meaningsJs).toMatch(/id = 'meaning-panel'/);
  });

  it('the comprehension hint is module-injected chrome: styled with a [hidden] guard, absent from the host', () => {
    expect(meaningsJs).toMatch(/\.meaning-hint \{[^}]*color: var\(--text-muted\)/);
    // .meaning-hint styles set no display, so the UA [hidden] rule would
    // suffice today — the author guard pins the F1 bug class shut against
    // a future display: declaration on the same selector.
    expect(meaningsJs).toMatch(/\.meaning-hint\[hidden\] \{ display: none; \}/);
    expect(meaningsJs).toMatch(/id = 'meaning-hint'/);
    expect(html + shellCss + experienceCss).not.toMatch(/meaning-hint/);
  });

  it('the shell styles live in ui/shell.css — linked before experience.css, never inlined back', () => {
    // 2026-08-31 split (DOCTRINE §6 shell-stylesheet amendment): the whole
    // inline <style> block moved VERBATIM to ui/shell.css. Link order is
    // load-bearing — the inline block preceded the experience.css link, so
    // shell.css must too, or every experience.css override flips. And no
    // <style> block may creep back into the shell markup: headroom eroding
    // back toward the 1500 cap starts exactly there.
    const shellLink = html.match(/<link[^>]+href="\/ui\/shell\.css"[^>]*>/);
    const expLink = html.match(/<link[^>]+href="\/ui\/experience\.css"[^>]*>/);
    expect(shellLink, 'shell.css link missing from index.html head').not.toBeNull();
    expect(expLink, 'experience.css link missing from index.html head').not.toBeNull();
    expect(shellLink.index).toBeLessThan(expLink.index);
    expect(html).not.toMatch(/<style[\s>]/);
    // Non-vacuous: the moved rules are really in the stylesheet (the block
    // was ~26.5KB at the split; 20000 still fails on any wholesale loss
    // while leaving room for ordinary rule churn).
    expect(shellCss.length).toBeGreaterThan(20000);
  });

  it('index.html net line-budget for this feature is import + one init call (single-file rule)', () => {
    const lines = html.split('\n').length;
    expect(lines, `index.html is ${lines} lines — over the DOCTRINE §6 1500-line cap`).toBeLessThanOrEqual(1500);
  });
});

describe('v0.76: the pure panel content path and the Escape listeners (pr235 audit)', () => {
  it('panelDetailFor never reads the sheet on the sealed or unresolved branches', () => {
    let reads = 0;
    const readSheet = () => { reads++; return {}; };
    expect(panelDetailFor('sun', 'leo', readSheet, { sealed: true }).title).toBe('meaning sealed at this tier');
    expect(panelDetailFor('sun', '', readSheet).title).toBe('meaning sealed at this tier');
    expect(panelDetailFor('rising', '\u2014', readSheet).title).toBe('not resolved');
    expect(reads).toBe(0);
    expect(panelDetailFor('sun', 'leo', readSheet).title.length).toBeGreaterThan(0);
    expect(reads).toBe(1);
    expect(panelDetailFor('sun', 'not a sign', readSheet).title).toBe('meaning not filed');
    expect(reads).toBe(1);
  });

  it('coordinateLabel is the panel-head label for every cell key, and the key itself for an unknown one', () => {
    expect(coordinateLabel('animal')).toBe('public animal');
    expect(coordinateLabel('innerAnimal')).toBe('private animal');
    expect(coordinateLabel('nope')).toBe('nope');
  });

  it('both Escape listeners are capture-phase, so the modal guard runs before ui/modals.js strips .open', () => {
    const dyadJs = readFileSync(join(__dirname, '..', 'ui', 'dyad.js'), 'utf-8');
    expect(meaningsJs).toMatch(/if \(e\.key !== 'Escape'\) return;[\s\S]{0,400}?\n  \}, true\);/);
    expect(dyadJs).toMatch(/e\.key !== 'Escape'[\s\S]{0,400}?\n    \}, true\);/);
    const modalsJs = readFileSync(join(__dirname, '..', 'ui', 'modals.js'), 'utf-8');
    // the modal handler is a bubble-phase document listener — the reason capture is needed
    expect(modalsJs).toMatch(/document\.addEventListener\('keydown'/);
  });
});
