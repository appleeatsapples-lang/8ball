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

  // v0.6.0: eight coordinate rows — arcana (lead) + element + sun + animal
  // + numerology + numbers2 + day pillar + hour pillar. Visibility per
  // tier is JS-gated by ui/tiers.js (tests/tiers.test.js); the markup
  // ships all eight rows.
  it('eight coord-section elements present', () => {
    const matches = html.match(/class="coord-section"/g) || [];
    expect(matches.length).toBe(8);
  });

  it('eight coord-title elements present', () => {
    const matches = html.match(/class="coord-title"/g) || [];
    expect(matches.length).toBe(8);
  });

  it('fourteen compartment value nodes present (v0.7.0 per-cell sheet)', () => {
    // 1+1+2+2+3+3+1+1 cells per the §1.D v0.37 row table; every cell
    // carries one .coord-val value node.
    const matches = html.match(/class="coord-val"/g) || [];
    expect(matches.length).toBe(14);
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
