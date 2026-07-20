// 8ball / tests / provenance.test.js
// Provenance placards (Coordinate Legibility Pack, DOCTRINE §1.E v0.40).
// Surface-only per-coordinate derivation notes. Pins: full cell coverage,
// clinical voice (§2), the value-leak / PII sentinel, labels-gating (no new
// key), and exclusion from the §5.D share artifact.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROV_NOTE, provText, initTiersUI, renderTierSections } from '../ui/tiers.js';
import { BANNED_VOICE_REGISTER, INTERPRETATION_VERBS, voiceRegisterHits } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');

// The §2 mysticism/interpretation register enforced on deck content, plus a
// few interpretation verbs a derivation note must never reach for. Both lists
// are imported from the canonical tables in tests/helpers/voice-register.js
// so this scan can never drift from the deck scan.
const BANNED_VOICE = [...BANNED_VOICE_REGISTER, ...INTERPRETATION_VERBS];

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

// ── DOM-write behavior (the §1.E wiring itself) ──────────────────────
// tiers.test.js's mock no-ops attachProvenance (its sections carry no
// ownerDocument), so the actual write path is pinned here with a DOM-
// capable mock: placards are created, survive a render that seals cells
// (the F1-WATCH claim), and re-init does not duplicate them.
function makeClassSet() {
  const s = new Set();
  return {
    add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c),
    toggle: (c, f) => { const on = f === undefined ? !s.has(c) : !!f; if (on) s.add(c); else s.delete(c); return on; },
  };
}
function makeStyle() {
  const p = {};
  return { setProperty: (k, v) => { p[k] = v; }, removeProperty: k => { delete p[k]; } };
}
function makeSection(title) {
  const titleNode = { className: 'coord-title', textContent: title };
  const kids = [];
  return {
    titleNode, kids,
    ownerDocument: { createElement: tag => ({ tagName: tag, className: '', textContent: '' }) },
    appendChild: n => { kids.push(n); return n; },
    querySelector: sel => sel === '.coord-title' ? titleNode
      : sel === '.coord-prov' ? (kids.find(k => k.className === 'coord-prov') || null) : null,
  };
}
function makeCell(section) {
  const root = { classList: makeClassSet(), style: makeStyle() };
  const val = {
    textContent: '',
    closest: sel => sel === '.coord-cell' ? root : sel === '.coord-section' ? section : null,
  };
  return { root, val };
}

const SECTION_OF = {
  arcana: 'arcana', element: 'element', sun: 'sun', rising: 'sun',
  animal: 'animal', innerAnimal: 'animal',
  lifePath: 'numerology', nameNumber: 'numerology', soulUrge: 'numerology',
  personality: 'numbers2', birthday: 'numbers2', maturity: 'numbers2',
  dayPillar: 'dayPillar', hourPillar: 'hourPillar',
};
const ROW_KEYS = {
  arcana: ['arcana'], element: ['element'], sun: ['sun', 'rising'],
  animal: ['animal', 'innerAnimal'], numerology: ['lifePath', 'nameNumber', 'soulUrge'],
  numbers2: ['personality', 'birthday', 'maturity'], dayPillar: ['dayPillar'], hourPillar: ['hourPillar'],
};
const CELL_KEYS = Object.keys(PROV_NOTE);
const PROFILE = {
  sunSign: 'capricorn', risingSign: 'leo', animal: 'rabbit', innerAnimal: 'dog',
  chineseElement: 'water', lifePath: 1, nameNumber: 5, soulUrge: 3,
  personality: 2, birthday: 7, maturity: 6,
  birthCard: { label: 'x · wheel of fortune' },
  dayPillar: { animal: 'horse', stemElement: 'fire' },
  hourPillar: { animal: 'rat', stemElement: 'wood' },
};

function buildDom() {
  const sections = {};
  for (const s of Object.keys(ROW_KEYS)) sections[s] = makeSection('T');
  const cells = {};
  for (const key of CELL_KEYS) cells[key] = makeCell(sections[SECTION_OF[key]]);
  initTiersUI({
    sunTitle: sections.sun.titleNode, animalTitle: sections.animal.titleNode,
    entry: { classList: makeClassSet(), style: makeStyle() },
    cells: Object.fromEntries(CELL_KEYS.map(k => [k, cells[k].val])),
  }, {});
  return { sections, cells };
}

describe('provenance placards — DOM write (§1.E wiring)', () => {
  it('writes one .coord-prov per section with the row note in cell order', () => {
    const { sections } = buildDom();
    for (const [s, keys] of Object.entries(ROW_KEYS)) {
      const prov = sections[s].querySelector('.coord-prov');
      expect(prov, `section ${s} has no placard`).not.toBeNull();
      expect(prov.textContent).toBe(provText(keys));
    }
  });

  it('a SEALED compartment still shows its derivation placard (F1-WATCH fix)', () => {
    const { sections, cells } = buildDom();
    renderTierSections(PROFILE, 'free'); // seals every t1+ cell
    // five-element is sealed at free — its placard must still be present.
    expect(cells.element.root.classList.contains('sealed')).toBe(true);
    expect(sections.element.querySelector('.coord-prov').textContent).toBe('year stem');
    // private (inner) animal sealed at free — the animal row placard survives.
    expect(cells.innerAnimal.root.classList.contains('sealed')).toBe(true);
    expect(sections.animal.querySelector('.coord-prov').textContent)
      .toBe('lunar new year · solar term');
  });

  it('is idempotent — re-init over the same sections does not duplicate placards', () => {
    const { sections } = buildDom();
    const cells2 = Object.fromEntries(
      CELL_KEYS.map(k => [k, makeCell(sections[SECTION_OF[k]]).val]));
    initTiersUI({
      sunTitle: sections.sun.titleNode, animalTitle: sections.animal.titleNode,
      entry: { classList: makeClassSet(), style: makeStyle() }, cells: cells2,
    }, {});
    for (const s of Object.keys(ROW_KEYS)) {
      const provs = sections[s].kids.filter(k => k.className === 'coord-prov');
      expect(provs.length, `section ${s} duplicated placard`).toBe(1);
    }
  });
});
