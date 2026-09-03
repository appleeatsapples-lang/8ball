// 8ball / tests / render_cards.test.js
//
// scripts/render_cards.mjs — the in-repo renderer for the two artifacts
// that depict the sheet (the /cards specimen JPEGs and the og image),
// journal 2026-09-03. The browser step is not run here (§12: no browser in
// the suite; the JPEG/PNG shape pins live in cards_hosting and
// monochrome_assets). What this file pins is everything BEFORE the
// browser:
//   1. code parsing — the two specimen shapes, and nothing else
//   2. determinism — a code always derives the same synthetic inputs
//   3. honesty — the derived profile actually lands on the catalog
//      position (or the arcana + year) the code advertises, every
//      compartment resolves, and no synthetic name is on any card
//   4. registry parity — the snapshot's groups, titles and cells are the
//      sheet registry's, so a card cannot drift from the sheet again
//   5. the templates — the specimen carries the groups, the titles, every
//      value, the catalog numeral and the site, and never the name; the og
//      copy is free-era and price-free
//   6. the dependency-free JPEG stripper drops exactly EXIF / ICC / COM

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCode, fromRoman, seededRandom, syntheticName, specimenInputsFor, profileFor,
  snapshotFor, specimenHtml, ogHtml, OG_COPY, stripJpegMetadata, loadCities, CANVAS, OG, SITE,
} from '../scripts/render_cards.mjs';
import { SHEET_GROUPS } from '../ui/tiers.js';
import { ROW_TITLES } from '../ui/sheet.js';
import { getCard } from '../core/engine.js';
import { getBirthCard } from '../core/birthcard.js';
import { SECOND_PERSON_RE } from './helpers/voice-register.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'cards', 'manifest.json'), 'utf-8'));
const specCodes = manifest.cards.map(c => c.code).filter(parseCode);
const cities = loadCities();

describe('render_cards — codes', () => {
  it('parses the catalog and extended specimen shapes, and nothing else', () => {
    expect(parseCode('spec_no-v')).toEqual({ kind: 'catalog', n: 5 });
    expect(parseCode('spec_no-cxliv')).toEqual({ kind: 'catalog', n: 144 });
    expect(parseCode('spec_no-cxlv')).toBeNull(); // 145 is off the 144-card grid
    expect(parseCode('spec_extended_hanged-man-1996')).toEqual({ kind: 'extended', arcana: 'hanged-man', year: 1996 });
    for (const other of ['spec_archive_no-cxx', 'ss01_aries-x-taurus', 'a01_rat', 't00_the-fool', 'nt01_number-1-x-the-magician', '']) {
      expect(parseCode(other), other).toBeNull();
    }
    expect(fromRoman('xxxi')).toBe(31);
    expect(fromRoman('xc')).toBe(90);
    expect(fromRoman('XI')).toBeNull();
  });

  it('the manifest carries exactly 331 specimen codes, all rendered by this script', () => {
    expect(specCodes).toHaveLength(331);
    for (const c of manifest.cards) {
      if (parseCode(c.code)) expect(c.source, c.code).toBe('scripts/render_cards.mjs');
      else expect(c.source, c.code).not.toBe('scripts/render_cards.mjs');
    }
  });
});

describe('render_cards — deterministic synthetic profiles (§11)', () => {
  it('the same code always derives the same inputs; different codes differ', () => {
    const a = specimenInputsFor('spec_no-xxxi'), b = specimenInputsFor('spec_no-xxxi');
    expect(a).toEqual(b);
    expect(specimenInputsFor('spec_no-xxxii')).not.toEqual(a);
    const r1 = seededRandom(42), r2 = seededRandom(42);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it('every catalog specimen lands on the catalog card its code names', () => {
    for (const code of specCodes) {
      const parsed = parseCode(code);
      if (parsed.kind !== 'catalog') continue;
      const p = profileFor(specimenInputsFor(code, cities));
      expect(`spec_no-${getCard(p).catalog}`, code).toBe(code);
    }
  });

  it('every extended specimen carries the birth card and year its code names', () => {
    for (const code of specCodes) {
      const parsed = parseCode(code);
      if (parsed.kind !== 'extended') continue;
      const inputs = specimenInputsFor(code, cities);
      const [y, m, d] = inputs.dob.split('-').map(Number);
      expect(y, code).toBe(parsed.year);
      const card = getBirthCard(y, m, d).name.replace(/^the /, '').replace(/\s+/g, '-');
      expect(card, code).toBe(parsed.arcana);
    }
  });

  it('every specimen resolves every compartment — rising and moon included — so no card shows a dash', () => {
    for (const code of specCodes) {
      const p = profileFor(specimenInputsFor(code, cities));
      expect(p.risingSign, `${code} rising`).toBeTruthy();
      expect(p.moonSign, `${code} moon`).toBeTruthy();
      const snap = snapshotFor(p);
      expect(snap.sections.flatMap(r => r.cells).filter(c => c.state !== 'open'), code).toEqual([]);
    }
  });

  it('inputs are synthetic: a syllable name, a time on a five-minute grid, a city with a real IANA zone at |lat| <= 60', () => {
    for (const code of specCodes.slice(0, 40)) {
      const i = specimenInputsFor(code, cities);
      expect(i.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(i.time).toMatch(/^([01]\d|2[0-3]):[0-5][05]$/);
      expect(i.tz).toMatch(/^[A-Z][A-Za-z_]+\/[A-Za-z_\-/]+$/);
      expect(Math.abs(i.lat)).toBeLessThanOrEqual(60);
      expect(i.dob).toMatch(/^(19[5-9]\d|200[0-5])-\d{2}-\d{2}$/.test(i.dob) || parseCode(code).kind === 'extended' ? /^\d{4}-\d{2}-\d{2}$/ : /never/);
    }
    const rnd = seededRandom(7);
    for (let i = 0; i < 50; i++) expect(syntheticName(rnd)).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });
});

describe('render_cards — registry parity', () => {
  const p = profileFor(specimenInputsFor('spec_no-xxxi', cities));
  const snap = snapshotFor(p);

  it('the snapshot is the sheet registry: four groups, nine rows, fifteen cells, in order', () => {
    expect(snap.groups.map(g => [g.key, g.title])).toEqual(SHEET_GROUPS.map(g => [g.key, g.title]));
    expect(snap.sections).toHaveLength(SHEET_GROUPS.flatMap(g => g.rows).length);
    expect(snap.sections.flatMap(r => r.cells)).toHaveLength(15);
    expect(snap.sections.map(r => r.title)).toEqual(
      SHEET_GROUPS.flatMap(g => g.rows).map(keys => keys[0] === 'sun' ? 'SUN ↑ RISING' : keys[0] === 'animal' ? 'PUBLIC ⇌ PRIVATE' : ROW_TITLES[keys[0]]));
    expect(snap.catalog).toBe('no. xxxi');
  });

  it('the specimen template carries every group title, row title, value, the numeral and the site — never the name', () => {
    const html = specimenHtml(snap);
    for (const g of SHEET_GROUPS) expect(html).toContain(`<span>${g.title}</span>`);
    for (const r of snap.sections) {
      expect(html).toContain(r.title);
      for (const c of r.cells) expect(html).toContain(`>${c.value}</div>`);
    }
    expect(html).toContain('no. xxxi');
    expect(html).toContain(SITE);
    const inputs = specimenInputsFor('spec_no-xxxi', cities);
    for (const w of inputs.name.split(' ')) expect(html).not.toContain(w);
    expect(html).not.toContain(inputs.dob);
    expect(html).toMatch(new RegExp(`width:${CANVAS.w}px;height:${CANVAS.h}px`));
  });

  it('the og template embeds the share PNG\'s own card art beside free-era, price-free copy', () => {
    const html = ogHtml(snap);
    expect(html).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(html).toContain('>MOON</text>');
    expect(html).toContain('>leo</text>');
    expect(html).toMatch(new RegExp(`width:${OG.w}px;height:${OG.h}px`));
    const copy = [OG_COPY.title, OG_COPY.sub, ...OG_COPY.lines].join(' ');
    expect(copy).toContain('free');
    expect(copy).toContain('stored only on your device');
    expect(copy).not.toMatch(/\$|paid|rung|unlock|tier/);
    // the tagline 'a magic 8-ball that knows you' is the product's own line
    // (index.html og:description carries it); the body lines address no one
    expect(SECOND_PERSON_RE.test(OG_COPY.lines.join(' ').replace(/your device/g, ''))).toBe(false);
    // every colour in the og template is a grey (the achromatic pin's precondition)
    for (const hex of html.match(/#[0-9a-f]{3,6}\b/gi) || []) {
      const h = hex.length === 4 ? hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex.slice(1);
      expect(h.slice(0, 2), hex).toBe(h.slice(2, 4));
      expect(h.slice(2, 4), hex).toBe(h.slice(4, 6));
    }
  });
});

describe('render_cards — the JPEG stripper', () => {
  const seg = (marker, payload) => Buffer.concat([Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload]);
  it('drops EXIF (APP1), ICC (APP2) and COM, keeps JFIF (APP0) and everything from SOS on', () => {
    const jfif = seg(0xe0, Buffer.from('JFIF\0'));
    const exif = seg(0xe1, Buffer.from('Exif\0\0abc'));
    const icc = seg(0xe2, Buffer.from('ICC_PROFILE\0xyz'));
    const com = seg(0xfe, Buffer.from('comment'));
    const dqt = seg(0xdb, Buffer.alloc(3, 1));
    const sos = Buffer.concat([Buffer.from([0xff, 0xda, 0, 2]), Buffer.from([1, 2, 3]), Buffer.from([0xff, 0xd9])]);
    const input = Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, exif, icc, dqt, com, sos]);
    const out = stripJpegMetadata(input);
    expect(out.equals(Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, dqt, sos]))).toBe(true);
  });
  it('refuses a non-JPEG', () => {
    expect(() => stripJpegMetadata(Buffer.from([0x89, 0x50]))).toThrow(/not a JPEG/);
  });
});
