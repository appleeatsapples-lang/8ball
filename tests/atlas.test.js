// 8ball / tests / atlas.test.js
// ATLAS legend (Coordinate Legibility Pack cut 2). Surface-only per-
// coordinate SYSTEM names that decode the abbreviated .coord-title. Same
// rails as the §1.E provenance placard (DOCTRINE §1.D/§5.D cover it in
// substance — no new clause). Pins: the documented partial coverage (self-
// naming rows omitted), clinical voice (§2), the value-leak / PII sentinel,
// labels-gating (no new key), exclusion from the §5.D share artifact, and
// the init-time DOM write (created, survives a seal, idempotent).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_NOTE, atlasText, initTiersUI, renderTierSections, shareRowRefs } from '../ui/tiers.js';
import { BANNED_VOICE_REGISTER, INTERPRETATION_VERBS, voiceRegisterHits } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf-8');
const html = read('index.html');
const tiersJs = read('ui', 'tiers.js');
const shareJs = read('ui', 'share.js');

// The §2 mysticism/interpretation register, plus interpretation verbs a
// legend label must never reach for. Imported from the canonical tables in
// tests/helpers/voice-register.js (same extension provenance.test.js applies)
// so this scan can never drift from the deck scan.
const BANNED_VOICE = [...BANNED_VOICE_REGISTER, ...INTERPRETATION_VERBS];

const NOTES = Object.values(ATLAS_NOTE);

describe('ATLAS legend (CLP cut 2)', () => {
  it('covers the abbreviated rows; self-naming rows are deliberately omitted', () => {
    // The 9 cells whose title is abbreviated or omits the tradition. The
    // personality/birthday/maturity row and the day/hour pillar rows already
    // spell every coordinate out in their .coord-title, so they carry NO
    // atlas note (a line there would only echo the title).
    expect(Object.keys(ATLAS_NOTE)).toEqual([
      'arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
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

  it('ui/tiers.js writes .coord-atlas at init, never on render', () => {
    expect(tiersJs).toMatch(/function attachAtlas\s*\(/);
    expect(tiersJs).toMatch(/className = 'coord-atlas'/);
    expect(tiersJs).toMatch(/attachAtlas\(\);/);
    // tier-invariant: renderTierSections must NOT touch atlas.
    const render = tiersJs.slice(
      tiersJs.indexOf('export function renderTierSections'),
      tiersJs.indexOf('export function shareRowRefs'),
    );
    expect(render.includes('attachAtlas')).toBe(false);
    expect(render.includes('coord-atlas')).toBe(false);
  });

  it('gated behind the existing labels toggle — no new localStorage key', () => {
    expect(html).toMatch(/\.card \.coord-atlas\s*\{[^}]*display:\s*none/);
    expect(html).toMatch(/\.card\.labels-revealed \.coord-atlas\s*\{[^}]*display:\s*block/);
    expect(tiersJs).not.toMatch(/localStorage/);
  });

  it('NOT serialized into the §5.D share PNG (ui/share.js never reads .coord-atlas)', () => {
    // The PNG builder is pure over the shareRowRefs snapshot (.coord-val
    // values + .coord-title); it never reads .coord-atlas, so the legend
    // text cannot reach the artifact.
    expect(shareJs).not.toMatch(/coord-atlas/);
  });
});

// ── DOM-write behavior (the cut-2 wiring itself) ─────────────────────
// tiers.test.js's mock no-ops attachAtlas (its sections carry no
// ownerDocument), so the actual write path is pinned here with a DOM-
// capable mock: the legend is created above the cells, survives a render
// that seals cells (tier-invariant), and re-init does not duplicate it.
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
  const cellsNode = { className: 'coord-cells' };
  // Seed the section with its .coord-cells node so insertBefore(el, cells)
  // is exercised the way the real DOM runs it (title tracked separately).
  const kids = [cellsNode];
  const find = cls => kids.find(k => k.className === cls) || null;
  return {
    titleNode, cellsNode, kids,
    ownerDocument: { createElement: tag => ({ tagName: tag, className: '', textContent: '' }) },
    appendChild: n => { kids.push(n); return n; },
    insertBefore: (n, ref) => {
      const i = ref ? kids.indexOf(ref) : -1;
      if (i < 0) kids.push(n); else kids.splice(i, 0, n);
      return n;
    },
    querySelector: sel =>
      sel === '.coord-title' ? titleNode
        : sel === '.coord-cells' ? cellsNode
          : sel === '.coord-prov' ? find('coord-prov')
            : sel === '.coord-atlas' ? find('coord-atlas')
              : null,
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
const CELL_KEYS = [
  'arcana', 'element', 'sun', 'rising', 'animal', 'innerAnimal',
  'lifePath', 'nameNumber', 'soulUrge',
  'personality', 'birthday', 'maturity', 'dayPillar', 'hourPillar',
];
// Rows that carry an atlas legend vs the self-naming rows that do not.
const ATLAS_ROWS = ['arcana', 'element', 'sun', 'animal', 'numerology'];
const SELF_NAMING_ROWS = ['numbers2', 'dayPillar', 'hourPillar'];

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

describe('ATLAS legend — DOM write (cut-2 wiring)', () => {
  it('writes one .coord-atlas per abbreviated row, with the system names in cell order', () => {
    const { sections } = buildDom();
    for (const s of ATLAS_ROWS) {
      const atlas = sections[s].querySelector('.coord-atlas');
      expect(atlas, `row ${s} has no legend`).not.toBeNull();
      expect(atlas.textContent).toBe(atlasText(ROW_KEYS[s]));
    }
  });

  it('self-naming rows carry NO legend (title already spells them out)', () => {
    const { sections } = buildDom();
    for (const s of SELF_NAMING_ROWS) {
      expect(sections[s].querySelector('.coord-atlas'),
        `self-naming row ${s} should have no legend`).toBeNull();
    }
  });

  it('inserts the legend ABOVE the cells (and above the appended placard)', () => {
    const { sections } = buildDom();
    // Real DOM order is [title, atlas, cells, prov]; the mock tracks title
    // separately, so its kids are [atlas, cells, prov] — the legend decodes
    // the title directly above the compartments, before the derivation note.
    const kids = sections.numerology.kids.map(k => k.className);
    expect(kids.indexOf('coord-atlas')).toBeGreaterThanOrEqual(0);
    expect(kids.indexOf('coord-atlas')).toBeLessThan(kids.indexOf('coord-cells'));
    expect(kids.indexOf('coord-cells')).toBeLessThan(kids.indexOf('coord-prov'));
  });

  it('a SEALED compartment still shows its legend (tier-invariant)', () => {
    const { sections, cells } = buildDom();
    renderTierSections(PROFILE, 'free'); // seals every t1+ cell
    // five-element is sealed at free — its legend must still be present.
    expect(cells.element.root.classList.contains('sealed')).toBe(true);
    expect(sections.element.querySelector('.coord-atlas').textContent)
      .toBe('chinese five-element');
    // private (inner) animal sealed at free — the animal row legend survives.
    expect(cells.innerAnimal.root.classList.contains('sealed')).toBe(true);
    expect(sections.animal.querySelector('.coord-atlas').textContent)
      .toBe('year animal · month animal');
  });

  it('is idempotent — re-init over the same sections does not duplicate legends', () => {
    const { sections } = buildDom();
    const cells2 = Object.fromEntries(
      CELL_KEYS.map(k => [k, makeCell(sections[SECTION_OF[k]]).val]));
    initTiersUI({
      sunTitle: sections.sun.titleNode, animalTitle: sections.animal.titleNode,
      entry: { classList: makeClassSet(), style: makeStyle() }, cells: cells2,
    }, {});
    for (const s of ATLAS_ROWS) {
      const atlases = sections[s].kids.filter(k => k.className === 'coord-atlas');
      expect(atlases.length, `row ${s} duplicated legend`).toBe(1);
    }
  });
});

// ── behavioral guarantees (beyond the static-source pins) ────────────
// The §5.D exclusion and the value/PII safety hold structurally (atlas is a
// .coord-atlas sibling outside .coord-title; atlasText takes no profile and
// reads only the static ATLAS_NOTE). These pin that behaviorally so a future
// refactor that wired the gloss into the title — or a profile value into the
// write path — would fail a test, not just slip past a source grep.
describe('ATLAS legend — behavioral exclusion & profile-independence', () => {
  const ATLAS_VALUES = Object.values(ATLAS_NOTE);

  it('the §5.D share snapshot never carries the atlas gloss (title or cell value)', () => {
    buildDom();
    renderTierSections(PROFILE, 'free');
    const refs = shareRowRefs();
    for (const ref of refs) {
      for (const v of ATLAS_VALUES) {
        expect(ref.title.includes(v),
          `share title "${ref.title}" leaked atlas gloss "${v}"`).toBe(false);
        for (const c of ref.cells) {
          expect(String(c.value).includes(v),
            `share cell value "${c.value}" leaked atlas gloss "${v}"`).toBe(false);
        }
      }
    }
  });

  it('the written legend is profile-independent (no value/PII can reach it)', () => {
    const a = buildDom();
    renderTierSections(PROFILE, 'free');
    const textsA = ATLAS_ROWS.map(s => a.sections[s].querySelector('.coord-atlas').textContent);
    // A second build with entirely different coordinate VALUES must produce
    // byte-identical legends — the gloss is keyed off ATLAS_NOTE, never the profile.
    const b = buildDom();
    const PROFILE_B = {
      ...PROFILE, sunSign: 'aries', risingSign: 'virgo', animal: 'tiger', innerAnimal: 'snake',
      chineseElement: 'metal', lifePath: 9, nameNumber: 2, soulUrge: 7,
      birthCard: { label: 'i · the magician' },
    };
    renderTierSections(PROFILE_B, 'free');
    const textsB = ATLAS_ROWS.map(s => b.sections[s].querySelector('.coord-atlas').textContent);
    expect(textsB).toEqual(textsA);
  });
});
