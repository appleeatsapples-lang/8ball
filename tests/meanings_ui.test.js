// tests/meanings_ui.test.js
// ui/meanings.js DI shape (DOCTRINE §6 v0.23) + index.html boot wiring pins.
// Static-source assertions, matching the convention in tests/modals.test.js
// and tests/tiers.test.js — no jsdom environment configured for this repo.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const meaningsJs = readFileSync(join(__dirname, '..', 'ui', 'meanings.js'), 'utf-8');

describe('ui/meanings.js DI shape + boot wiring', () => {
  it('exports initMeaningsUI with a single refs-object arity', () => {
    expect(meaningsJs).toMatch(/export function initMeaningsUI\s*\(\s*refs\s*\)/);
  });

  it('index.html imports and calls initMeaningsUI once, passing cardFace', () => {
    expect(html).toMatch(/import\s*{\s*initMeaningsUI\s*}\s*from\s*'\.\/ui\/meanings\.js'/);
    expect(html).toMatch(/initMeaningsUI\(\{\s*cardFace\s*\}\)/);
  });

  it('excludes catalog from COORDINATES — no detail trigger for the compound card', () => {
    expect(meaningsJs).not.toMatch(/catalog:\s*'coord-catalog/);
  });

  it('registers every coordinate value id as interactive', () => {
    for (const id of [
      'coord-arcana-symbol', 'coord-element-symbol',
      'coord-sun-symbol', 'coord-rising-symbol',
      'coord-animal-symbol', 'coord-inner-symbol',
      'coord-lifepath-symbol', 'coord-namenumber-symbol', 'coord-soulurge-symbol',
      'coord-personality-symbol', 'coord-birthday-symbol', 'coord-maturity-symbol',
      'coord-daypillar-symbol', 'coord-hourpillar-symbol',
    ]) {
      expect(meaningsJs).toContain(`valueId: '${id}'`);
    }
  });

  it('imports the expanded meaning/context registry from meanings.v2.js', () => {
    expect(meaningsJs).toMatch(
      /import\s*{[\s\S]*ARCANA_MEANINGS,[\s\S]*ELEMENT_MEANINGS,[\s\S]*COORDINATE_CONTEXT,[\s\S]*}\s*from\s*'\.\.\/content\/meanings\.v2\.js'/
    );
  });

  it('uses meaning context rather than derivation/provenance copy', () => {
    expect(meaningsJs).toContain('harmonyFor');
    expect(meaningsJs).toContain('in this sheet');
    expect(meaningsJs).not.toMatch(/PROV_NOTE|ATLAS_NOTE|derived by/);
  });

  it('injects its own style/panel rather than editing index.html markup/CSS', () => {
    // Structural guard for the "2-line index.html footprint" design constraint.
    expect(html).not.toMatch(/id="meaning-panel"/);
    expect(html).not.toMatch(/\.meaning-panel\s*\{/);
    expect(meaningsJs).toMatch(/document\.createElement\('style'\)/);
    expect(meaningsJs).toMatch(/id = 'meaning-panel'/);
  });

  it('index.html net line-budget for this feature is import + one init call (single-file rule)', () => {
    const lines = html.split('\n').length;
    expect(lines, `index.html is ${lines} lines — over the DOCTRINE §6 1500-line cap`).toBeLessThanOrEqual(1500);
  });
});
