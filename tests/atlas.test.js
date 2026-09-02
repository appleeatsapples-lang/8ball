// 8ball / tests / atlas.test.js
// ATLAS legend (Coordinate Legibility Pack cut 2). Surface-only per-
// coordinate SYSTEM names that decode the abbreviated .coord-title. Same
// rails as the §1.E provenance placard. Pins: the documented partial
// coverage (self-naming rows omitted), clinical voice (§2), the value-leak /
// PII sentinel, exclusion from the §5.D share artifact — and, since the
// v0.74 labeled-view simplification, that the legend is NOT written on the
// card at all: it leads the meaning panel's derivation line
// (`system name · derivation`, ui/tiers.js derivationText), so the labeled
// sheet carries row titles only.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_NOTE, PROV_NOTE, atlasText, derivationText, initTiersUI, renderTierSections, shareRowRefs, CELL_KEYS as REGISTRY_CELL_KEYS } from '../ui/tiers.js';
import { BANNED_VOICE_REGISTER, INTERPRETATION_VERBS, voiceRegisterHits } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const shellCss = read('ui', 'shell.css');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');
const sheetJs = read('ui', 'sheet.js');
const meaningsJs = read('ui', 'meanings.js');

// The §2 mysticism/interpretation register, plus interpretation verbs a
// legend label must never reach for. Imported from the canonical tables in
// tests/helpers/voice-register.js (same extension provenance.test.js applies)
// so this scan can never drift from the deck scan.
const BANNED_VOICE = [...BANNED_VOICE_REGISTER, ...INTERPRETATION_VERBS];

const NOTES = Object.values(ATLAS_NOTE);

describe('ATLAS legend — the moon sign has its own legend (pr232 audit)', () => {
  it('rising and moon are pinned by value and every legend is distinct', () => {
    expect(ATLAS_NOTE.rising).toBe('rising sign');
    expect(ATLAS_NOTE.moon).toBe('moon sign');
    expect(new Set(Object.values(ATLAS_NOTE)).size).toBe(Object.keys(ATLAS_NOTE).length);
  });
});

describe('ATLAS legend (CLP cut 2)', () => {
  it('covers the abbreviated rows; self-naming rows are deliberately omitted', () => {
    // The 9 cells whose title is abbreviated or omits the tradition. The
    // personality/birthday/maturity row and the day/hour pillar rows already
    // spell every coordinate out in their .coord-title, so they carry NO
    // atlas note (a line there would only echo the title).
    expect(Object.keys(ATLAS_NOTE)).toEqual([
      'arcana', 'element', 'sun', 'rising', 'moon', 'animal', 'innerAnimal',
      'lifePath', 'nameNumber', 'soulUrge',
    ]);
    for (const k of ['personality', 'birthday', 'maturity', 'dayPillar', 'hourPillar']) {
      expect(ATLAS_NOTE[k], `${k} must be self-naming (no atlas note)`).toBeUndefined();
    }
  });

  it('atlasText joins a row’s system names in cell order; self-naming rows → ""', () => {
    expect(atlasText(['lifePath', 'nameNumber', 'soulUrge']))
      .toBe('life-path · expression · soul-urge');
    expect(atlasText(['animal', 'innerAnimal'])).toBe('year animal · month animal');
    expect(atlasText(['arcana'])).toBe('tarot arcana');
    // self-naming rows carry no note → empty (attachAtlas skips them).
    expect(atlasText(['personality', 'birthday', 'maturity'])).toBe('');
    expect(atlasText(['dayPillar'])).toBe('');
    expect(atlasText(['hourPillar'])).toBe('');
  });

  it('every note is a clinical system name — no mysticism/interpretation (§2)', () => {
    // Canonical shared matcher (same substring semantics this scan always
    // ran, now with SUBSTRING_SAFELIST applied) — #104/#108 LOW-3 debt clear.
    for (const note of NOTES) {
      const hits = voiceRegisterHits(note, BANNED_VOICE);
      expect(hits, `atlas note "${note}" hits: ${hits
        .map(hit => `"${hit.term}" in "${hit.containing}"`).join(', ')}`).toEqual([]);
    }
  });

  it('value-leak sentinel — notes are SYSTEM names, never coordinate VALUES (no digits)', () => {
    // A system name ("life-path", "year animal") names WHAT a coordinate is,
    // never its computed value, so it carries no numeral.
    for (const note of NOTES) {
      expect(/[0-9]/.test(note), `atlas note "${note}" contains a digit`).toBe(false);
    }
  });

  it('notes are short lowercase labels (specimen register)', () => {
    for (const note of NOTES) {
      expect(note).toBe(note.toLowerCase());
      expect(note.length).toBeLessThanOrEqual(24);
    }
  });

  it('v0.74: the legend is NOT written on any sheet — no writer, no node, no gated rule', () => {
    expect(tiersJs).not.toMatch(/attachAtlas|coord-atlas/);
    expect(sheetJs).not.toMatch(/coord-atlas|atlasText/);
    expect(html).not.toMatch(/coord-atlas/);
    expect(shellCss).not.toMatch(/coord-atlas/);
    expect(tiersJs).not.toMatch(/localStorage/);
  });

  it('v0.74: the legend leads the panel derivation line, then the §1.E note — pure over the registries', () => {
    expect(derivationText('nameNumber')).toBe('expression · letter-value sum');
    expect(derivationText('moon')).toBe('moon sign · lunar longitude');
    expect(derivationText('animal')).toBe('year animal · lunar new year');
    // self-naming rows: the panel head already names them, so the line is the note alone
    expect(derivationText('dayPillar')).toBe('sexagenary cycle');
    expect(derivationText('maturity')).toBe('life-path + name');
    expect(derivationText('nope')).toBe('');
    for (const key of REGISTRY_CELL_KEYS) {
      const line = derivationText(key);
      expect(line.endsWith(PROV_NOTE[key]), `${key} must end with its derivation`).toBe(true);
      if (ATLAS_NOTE[key]) expect(line.startsWith(ATLAS_NOTE[key] + ' · '), `${key} must lead with its legend`).toBe(true);
      expect(/[0-9]/.test(line), `${key} line carries a digit`).toBe(false);
    }
  });

  it('v0.74: ui/meanings.js writes the line under the panel head on every open', () => {
    expect(meaningsJs).toMatch(/import \{ derivationText \} from '\.\/tiers\.js'/);
    expect(meaningsJs).toMatch(/<div class="meaning-derivation" id="meaning-derivation"><\/div>/);
    expect(meaningsJs).toMatch(/derivation\.textContent = derivationText\(key\);/);
  });

  it('NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-atlas)', () => {
    // The PNG builder is pure over the shareRowRefs snapshot (.coord-val
    // values + .coord-title); it never reads .coord-atlas, so the legend
    // text cannot reach the artifact.
    expect(shareJs).not.toMatch(/coord-atlas/);
  });
});

// ── behavioral guarantees (beyond the static-source pins) ────────────
// The §5.D exclusion holds structurally (the legend is registry text that
// reaches only the meaning panel, never .coord-title or a cell); this pins
// it behaviorally against a real shareRowRefs snapshot, and pins that the
// card render itself writes no legend node anywhere.
describe('ATLAS legend — behavioral exclusion (v0.74: panel-only)', () => {
  const ATLAS_VALUES = Object.values(ATLAS_NOTE);
  const PROFILE = {
    sunSign: 'capricorn', risingSign: 'leo', moonSign: 'taurus', animal: 'rabbit', innerAnimal: 'dog',
    chineseElement: 'water', lifePath: 1, nameNumber: 5, soulUrge: 3,
    personality: 2, birthday: 7, maturity: 6,
    birthCard: { label: 'x · wheel of fortune' },
    dayPillar: { animal: 'horse', stemElement: 'fire' },
    hourPillar: { animal: 'rat', stemElement: 'wood' },
  };
  function makeClassSet() {
    const s = new Set();
    return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c),
      toggle: (c, f) => { const on = f === undefined ? !s.has(c) : !!f; if (on) s.add(c); else s.delete(c); return on; } };
  }
  function buildDom() {
    const sections = {};
    const cells = {};
    for (const key of REGISTRY_CELL_KEYS) {
      const kids = [];
      const section = { kids, appendChild: n => { kids.push(n); return n; }, insertBefore: n => { kids.unshift(n); return n; },
        ownerDocument: { createElement: tag => ({ tagName: tag, className: '', textContent: '' }) },
        querySelector: sel => sel === '.coord-title' ? { textContent: 'T' } : null };
      sections[key] = section;
      const root = { classList: makeClassSet(), style: { setProperty() {}, removeProperty() {} } };
      cells[key] = { root, val: { textContent: '', closest: sel => sel === '.coord-cell' ? root : sel === '.coord-section' ? section : null } };
    }
    initTiersUI({ sunTitle: { textContent: '' }, animalTitle: { textContent: '' },
      entry: { classList: makeClassSet(), style: { setProperty() {}, removeProperty() {} } },
      cells: Object.fromEntries(REGISTRY_CELL_KEYS.map(k => [k, cells[k].val])) }, {});
    return { sections, cells };
  }

  it('init + render write NO legend or placard node into any section', () => {
    const { sections } = buildDom();
    renderTierSections(PROFILE, 'free');
    renderTierSections(PROFILE, 't3');
    for (const [key, s] of Object.entries(sections)) {
      expect(s.kids, `${key} section gained a node`).toEqual([]);
    }
  });

  it('the §5.D share snapshot never carries the atlas gloss (title or cell value)', () => {
    buildDom();
    renderTierSections(PROFILE, 'free');
    for (const ref of shareRowRefs()) {
      for (const v of ATLAS_VALUES) {
        expect(ref.title.includes(v), `share title "${ref.title}" leaked atlas gloss "${v}"`).toBe(false);
        for (const c of ref.cells) {
          expect(String(c.value).includes(v), `share cell value "${c.value}" leaked atlas gloss "${v}"`).toBe(false);
        }
      }
    }
  });

  it('the derivation line is profile-independent — keyed by coordinate, never a value', () => {
    expect(derivationText.length).toBe(1);
    const before = REGISTRY_CELL_KEYS.map(derivationText);
    buildDom(); renderTierSections({ ...PROFILE, sunSign: 'aries', lifePath: 9 }, 't3');
    expect(REGISTRY_CELL_KEYS.map(derivationText)).toEqual(before);
    for (const line of before) expect(line).toBe(line.toLowerCase());
  });
});
