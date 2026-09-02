// 8ball / tests / provenance.test.js
// Provenance placards (Coordinate Legibility Pack, DOCTRINE §1.E v0.40).
// Surface-only per-coordinate derivation notes. Pins: full cell coverage,
// clinical voice (§2), the value-leak / PII sentinel, exclusion from the
// §5.D share artifact — and, since the v0.74 labeled-view simplification,
// that the note is NOT written on the card: it closes the meaning panel's
// derivation line (`system name · derivation`, ui/tiers.js derivationText),
// so the labeled sheet carries row titles only.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROV_NOTE, provText, derivationText, CELL_KEYS as REGISTRY_CELL_KEYS } from '../ui/tiers.js';
import { BANNED_VOICE_REGISTER, INTERPRETATION_VERBS, voiceRegisterHits } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const shellCss = read('ui', 'shell.css');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');
const sheetJs = read('ui', 'sheet.js');

// The §2 mysticism/interpretation register enforced on deck content, plus a
// few interpretation verbs a derivation note must never reach for. Both lists
// are imported from the canonical tables in tests/helpers/voice-register.js
// so this scan can never drift from the deck scan.
const BANNED_VOICE = [...BANNED_VOICE_REGISTER, ...INTERPRETATION_VERBS];

const NOTES = Object.values(PROV_NOTE);

describe('provenance placards (DOCTRINE §1.E v0.40)', () => {
  it('the two time-derived placards are pinned by value and distinct (pr232 audit)', () => {
    expect(PROV_NOTE.rising).toBe('ascendant');
    expect(PROV_NOTE.moon).toBe('lunar longitude');
    expect(new Set(Object.values(PROV_NOTE)).size).toBeGreaterThanOrEqual(Object.keys(PROV_NOTE).length - 1); // only the two digit-sum rows may share
  });

  it('covers every one of the 15 coordinate cells in DOM order', () => {
    expect(Object.keys(PROV_NOTE)).toEqual([
      'arcana', 'element', 'sun', 'rising', 'moon', 'animal', 'innerAnimal',
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
    // Canonical shared matcher (same substring semantics this scan always
    // ran, now with SUBSTRING_SAFELIST applied) — #104/#108 LOW-3 debt clear.
    for (const note of NOTES) {
      const hits = voiceRegisterHits(note, BANNED_VOICE);
      expect(hits, `provenance note "${note}" hits: ${hits
        .map(hit => `"${hit.term}" in "${hit.containing}"`).join(', ')}`).toEqual([]);
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

  it('v0.74: the placard is NOT written on any sheet — no writer, no node, no gated rule', () => {
    expect(tiersJs).not.toMatch(/attachProvenance|coord-prov/);
    expect(sheetJs).not.toMatch(/coord-prov|provText/);
    expect(html).not.toMatch(/coord-prov/);
    expect(shellCss).not.toMatch(/coord-prov/);
    expect(tiersJs).not.toMatch(/localStorage/);
  });

  it('v0.74: every coordinate reaches the panel derivation line with its note last', () => {
    for (const key of REGISTRY_CELL_KEYS) {
      expect(PROV_NOTE[key], `${key} has no note`).toBeTruthy();
      expect(derivationText(key).endsWith(PROV_NOTE[key]), `${key} line must end with its note`).toBe(true);
    }
  });

  it('NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-prov)', () => {
    // The PNG builder is pure over the shareRowRefs snapshot (.coord-val
    // values + .coord-title); it never reads .coord-prov, so the placard
    // text cannot reach the artifact.
    expect(shareJs).not.toMatch(/coord-prov/);
  });
});

// ── v0.74 repo-wide retirement guard (pr233 audit F4/F6) ─────────────
// The first draft scanned four files; a `.coord-prov` writer injected into
// ui/labels.js rode the suite green and rendered nine always-visible
// placards. The guard now walks EVERY shipped source — no allow-list.
import { readdirSync } from 'node:fs';
describe('v0.74: no shipped source writes, styles or names the card placard or atlas', () => {
  const shipped = [];
  for (const dir of ['ui', 'core', 'content']) {
    for (const f of readdirSync(join(__dirname, '..', dir))) {
      if (/\.(js|css)$/.test(f)) shipped.push(join(dir, f));
    }
  }
  for (const f of readdirSync(join(__dirname, '..'))) if (/\.html$/.test(f)) shipped.push(f);
  it('walks a real inventory', () => {
    expect(shipped.length).toBeGreaterThan(30);
    expect(shipped).toContain(join('ui', 'labels.js'));
    expect(shipped).toContain(join('ui', 'experience.css'));
    expect(shipped).toContain('index.html');
  });
  for (const f of shipped) {
    it(`${f} carries no coord-prov / coord-atlas / attachProvenance / attachAtlas`, () => {
      expect(read(f)).not.toMatch(/coord-prov|coord-atlas|attachProvenance|attachAtlas/);
    });
  }
});
