// 8ball / tests / provenance.test.js
// Provenance placards (Coordinate Legibility Pack, DOCTRINE §1.E v0.40).
// Surface-only per-coordinate derivation notes. Pins: full cell coverage,
// clinical voice (§2), the value-leak / PII sentinel, labels-gating (no new
// key), and exclusion from the §5.D share artifact.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROV_NOTE, provText } from '../ui/tiers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');

// The §2 mysticism/interpretation register enforced on deck content, plus a
// few interpretation verbs a derivation note must never reach for.
const BANNED_VOICE = [
  'the universe', 'your stars', 'destiny', 'destined', 'fated', 'fate',
  'cosmic', 'the cosmos', 'spiritual', 'mystic', 'mystical', 'psychic',
  'channel', 'channeling', 'aura', 'karma', 'manifest', 'manifestation',
  'third eye', 'soul mate', 'your guides', 'divine', 'sacred',
  'reveal', 'reveals', 'meaning', 'predict', 'future',
];

const NOTES = Object.values(PROV_NOTE);

describe('provenance placards (DOCTRINE §1.E v0.40)', () => {
  it('covers every one of the 14 coordinate cells in DOM order', () => {
    expect(Object.keys(PROV_NOTE)).toEqual([
      'arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
      'lifePath', 'nameNumber', 'soulUrge',
      'personality', 'birthday', 'maturity',
      'dayPillar', 'hourPillar',
    ]);
  });

  it('provText joins a row’s notes in cell order (mirrors the title)', () => {
    expect(provText(['lifePath', 'nameNumber', 'soulUrge']))
      .toBe('digit-sum reduction · letter-value sum · vowel sum');
    expect(provText(['arcana'])).toBe('digit-sum reduction');
  });

  it('every note is clinical derivation — no mysticism/interpretation (§2)', () => {
    for (const note of NOTES) {
      const lc = note.toLowerCase();
      for (const term of BANNED_VOICE) {
        expect(lc.includes(term),
          `provenance note "${note}" contains banned term "${term}"`).toBe(false);
      }
    }
  });

  it('value-leak sentinel — notes are METHODS, never coordinate VALUES (no digits)', () => {
    // Coordinate values are numerals (life path, the numbers) or sign names;
    // a derivation method names HOW, never the value, so it carries no digit.
    for (const note of NOTES) {
      expect(/[0-9]/.test(note), `provenance note "${note}" contains a digit`).toBe(false);
    }
  });

  it('notes are short lowercase labels (specimen register)', () => {
    for (const note of NOTES) {
      expect(note).toBe(note.toLowerCase());
      expect(note.length).toBeLessThanOrEqual(24);
    }
  });

  it('ui/tiers.js writes .coord-prov at init, never on render', () => {
    expect(tiersJs).toMatch(/function attachProvenance\s*\(/);
    expect(tiersJs).toMatch(/className = 'coord-prov'/);
    expect(tiersJs).toMatch(/attachProvenance\(\);/);
    // tier-invariant: renderTierSections must NOT touch provenance.
    const render = tiersJs.slice(
      tiersJs.indexOf('export function renderTierSections'),
      tiersJs.indexOf('export function shareRowRefs'),
    );
    expect(render.includes('attachProvenance')).toBe(false);
    expect(render.includes('coord-prov')).toBe(false);
  });

  it('gated behind the existing labels toggle — no new localStorage key', () => {
    expect(html).toMatch(/\.card \.coord-prov\s*\{[^}]*display:\s*none/);
    expect(html).toMatch(/\.card\.labels-revealed \.coord-prov\s*\{[^}]*display:\s*block/);
    expect(tiersJs).not.toMatch(/localStorage/);
  });

  it('NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-prov)', () => {
    // The PNG builder is pure over the shareRowRefs snapshot (.coord-val
    // values + .coord-title); it never reads .coord-prov, so the placard
    // text cannot reach the artifact.
    expect(shareJs).not.toMatch(/coord-prov/);
  });
});
