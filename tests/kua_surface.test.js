// 8ball / tests / kua_surface.test.js
//
// The kua block (§1.D kua amendment) — the wiring, not the arithmetic.
// Core behaviour is pinned in tests/kua.test.js; this file covers the
// seams, twinned from tests/public_surface.test.js:
//
//   1. ui/kua.js render — sealed below t3, filled at t3, DOM-pure either
//      way (§1.D v0.37); the both-values read is the only read (the
//      product asks no gender question — journal 2026-08-30); the 5-remap
//      disclosure visible, never silent.
//   2. Injection — index.html carries no kua markup, no gender control,
//      no kua CSS; the module builds its style and block node and the
//      boot call names only the host-owned card face.
//   3. The ladder — kuaRead rides t3 (and t5 by the append), is a BLOCK
//      (census unmoved), and the unseal beat can actually reach it.
//   4. The single-importer twin — ui/kua.js is the only consumer of
//      core/kua.js, scoped per directory so ui-internal './kua.js'
//      imports cannot false-fire.
//   5. Sheet parity — the dyad sheets render the same handed-in read.
//
// Node env, hand-rolled DOM per §12 (no jsdom).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeClassList } from './helpers/dom.js';
import {
  formatKuaBoth,
  kuaReadFor,
  initKuaUI,
  renderKuaRead,
} from '../ui/kua.js';
import { coordsForTier, tierDensitySummary, newlyEntitledCells } from '../ui/tiers.js';
import { createSheet } from '../ui/sheet.js';
import { buildProfile } from '../core/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const kuaJs = readFileSync(join(__dirname, '..', 'ui', 'kua.js'), 'utf-8');
const tiersJs = readFileSync(join(__dirname, '..', 'ui', 'tiers.js'), 'utf-8');

const makeNode = () => ({ textContent: 'STALE', classList: makeClassList() });
const makeRefs = () => ({
  root: { classList: makeClassList(), setAttribute() {} },
  primary: makeNode(),
  secondary: makeNode(),
  note: makeNode(),
});

// 1990: male → kua 1 (kan); female → raw 5 remapped to 8 (gen).
const P = buildProfile('specimen', '1990-06-01');
// The gendered-kua cycle stored gender on profiles; a stale payload's
// token must be inert, so it rides this fixture to prove it changes
// nothing about the read.
const P_STALE_GENDER = { ...P, gender: 'female' };

describe('kua render — boot order', () => {
  it('is inert before init: render returns null and touches nothing', () => {
    expect(renderKuaRead(P, { entitled: true })).toBeNull();
  });
});

describe('kua render — contract', () => {
  it('fills BOTH classical values at entitled:true, labeled, remap disclosed', () => {
    const refs = makeRefs();
    initKuaUI(refs);
    const read = renderKuaRead(P, { entitled: true });
    expect(read).not.toBeNull();
    expect(refs.primary.textContent).toBe('male · kua 1 · kan ☵ · north · east group');
    expect(refs.secondary.textContent).toBe('female · kua 8 · gen ☶ · northeast · west group');
    expect(refs.note.textContent).toMatch(/assigns by gender; both classical values shown/);
    expect(refs.note.textContent).toMatch(/a raw 5 has no trigram/); // the female remap
    expect(refs.root.classList.contains('sealed')).toBe(false);
  });

  it('a stale stored gender token changes nothing — the read is identical', () => {
    // The product asks no gender question; payloads written before the
    // 2026-08-30 removal may still carry one. It must be inert, not a
    // hidden third mode.
    expect(kuaReadFor(P_STALE_GENDER)).toEqual(kuaReadFor(P));
  });

  it('the note always discloses the method dependence, never claims a file state', () => {
    const read = kuaReadFor(P);
    expect(read.note).toMatch(/^the eight mansions method assigns by gender/);
    // The gendered-cycle phrasing implied a gender COULD be filed; it
    // cannot, so the phrase must be gone.
    expect(read.note).not.toMatch(/no gender on file/);
  });

  it('sealed below entitlement: every value node emptied, aria says sealed (§1.D v0.37)', () => {
    const refs = makeRefs();
    let aria = null;
    refs.root.setAttribute = (k, v) => { if (k === 'aria-label') aria = v; };
    initKuaUI(refs);
    renderKuaRead(P, { entitled: true });
    const read = renderKuaRead(P, { entitled: false });
    expect(read).toBeNull();
    expect(refs.root.classList.contains('sealed')).toBe(true);
    expect(refs.primary.textContent).toBe('');
    expect(refs.secondary.textContent).toBe('');
    expect(refs.note.textContent).toBe('');
    expect(aria).toBe('kua trigram · sealed at this device tier');
  });

  it('seals rather than throws on an unresolvable profile', () => {
    const refs = makeRefs();
    initKuaUI(refs);
    for (const bad of [null, {}, { yyyy: 'x', mm: 1, dd: 1 }]) {
      expect(renderKuaRead(bad, { entitled: true })).toBeNull();
      expect(refs.root.classList.contains('sealed')).toBe(true);
    }
  });

  it('format helper is pure and total over the registry', () => {
    const both = formatKuaBoth({ male: { number: 2, remapped: true }, female: { number: 1, remapped: false } });
    expect(both.primary).toBe('male · kua 2 · kun ☷ · southwest · west group');
    expect(both.secondary).toBe('female · kua 1 · kan ☵ · north · east group');
    expect(both.note).toMatch(/kun \(2\)/);
  });

  it('the module exposes no gender surface at all', () => {
    // The control, its accessors and the single-gender formatter left
    // together; any one returning is the ask coming back.
    expect(kuaJs).not.toMatch(/getGenderInput|setGenderInput|resolveGenderSelect|formatKuaRead\b/);
    expect(kuaJs).not.toMatch(/gender-input|kua-gender-field/);
  });
});

describe('kua injection — the host is untouched', () => {
  it('index.html carries no kua markup, no gender control, no kua CSS', () => {
    expect(html).not.toMatch(/class="kua-read"/);
    expect(html).not.toContain('id="gender-input"');
    expect(html).not.toContain('id="kua-style"');
    const css = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
    expect(css).not.toMatch(/\.kua-read/);
  });

  it('the boot call hands the host-owned card face only', () => {
    expect(html).toMatch(/initKuaUI\(\{ cardFace \}\)/);
  });

  it('the module owns its style: id-guarded tag, :empty note, label reveal, unseal + reduced-motion', () => {
    expect(kuaJs).toMatch(/kua-style/);
    expect(kuaJs).toMatch(/\.kua-note:empty \{ display: none; \}/);
    expect(kuaJs).toMatch(/\.card\.labels-revealed \.kua-title \{ visibility: visible/);
    expect(kuaJs).toMatch(/\.kua-read\.unsealing \.card-habit/);
    expect(kuaJs).toMatch(/prefers-reduced-motion/);
  });
});

describe('kua ladder — a block on the t3 ceiling', () => {
  it('rides t3 and t5, and no lower rung', () => {
    expect(coordsForTier('t3').has('kuaRead')).toBe(true);
    expect(coordsForTier('t5').has('kuaRead')).toBe(true);
    for (const tier of ['free', 't1', 't2']) {
      expect(coordsForTier(tier).has('kuaRead')).toBe(false);
    }
  });

  it('is a block, not a compartment: carrying it does not move the census', () => {
    expect(tierDensitySummary('t3')).toEqual({ open: 15, sealed: 0, total: 15 });
    expect(tierDensitySummary('t5')).toEqual({ open: 15, sealed: 0, total: 15 });
  });

  it('joins the unseal delta on a t2 → t3 upgrade and nothing above', () => {
    expect(newlyEntitledCells('t2', 't3')).toContain('kuaRead');
    expect(newlyEntitledCells('t3', 't5')).toEqual([]);
    expect(newlyEntitledCells('t3', 't3')).toEqual([]);
  });

  it('the unseal beat can actually reach the block', () => {
    expect(kuaJs).toMatch(/registerKuaRoot\(_root\)/);
    expect(tiersJs).toMatch(/key === 'kuaRead' \? _kuaRoot/);
  });

  it('the render decision consults the ladder table, not a tier literal', () => {
    expect(html).toMatch(/coordsForTier\(tier\)\.has\('kuaRead'\)/);
  });

  it('the density strip does not claim a full sheet over a sealed block', () => {
    expect(html).toMatch(/kua sealed/);
  });
});

describe('single-importer twin (the tests/public.test.js pattern, scoped)', () => {
  it('ui/kua.js is the ONLY consumer of core/kua.js', () => {
    const consumers = [];
    for (const dir of ['core', 'ui']) {
      const re = dir === 'core' ? /from '\.\/kua\.js'/ : /from '\.\.\/core\/kua\.js'/;
      for (const f of readdirSync(join(__dirname, '..', dir))) {
        if (!f.endsWith('.js')) continue;
        const src = readFileSync(join(__dirname, '..', dir, f), 'utf-8');
        if (re.test(src)) consumers.push(join(dir, f));
      }
    }
    if (/from '[^']*core\/kua\.js'/.test(html)) consumers.push('index.html');
    expect(consumers).toEqual([join('ui', 'kua.js')]);
  });
});

describe('dyad-sheet parity', () => {
  const makeSheetHost = prefix => {
    const byAttr = new Map();
    for (const attr of ['kua', 'kua-primary', 'kua-secondary', 'kua-note']) {
      byAttr.set(`[data-sheet-${attr}="${prefix}"]`, makeNode());
    }
    return { host: { querySelector: sel => byAttr.get(sel) || null }, byAttr };
  };

  it('a sheet renders the same handed-in read the host block shows, and seals below t3', () => {
    const { host, byAttr } = makeSheetHost('b');
    const sheet = createSheet(host, { prefix: 'b' });
    const read = kuaReadFor(P);

    const flags = sheet.render(P, 't3', { kua: read });
    expect(flags.kua).toBe(true);
    expect(byAttr.get('[data-sheet-kua-primary="b"]').textContent).toBe(read.primary);
    expect(byAttr.get('[data-sheet-kua-secondary="b"]').textContent).toBe(read.secondary);
    expect(byAttr.get('[data-sheet-kua-note="b"]').textContent).toBe(read.note);
    expect(byAttr.get('[data-sheet-kua="b"]').classList.contains('sealed')).toBe(false);

    const sealed = sheet.render(P, 't2', { kua: read });
    expect(sealed.kua).toBe(false);
    expect(byAttr.get('[data-sheet-kua="b"]').classList.contains('sealed')).toBe(true);
    expect(byAttr.get('[data-sheet-kua-primary="b"]').textContent).toBe('');
    expect(byAttr.get('[data-sheet-kua-secondary="b"]').textContent).toBe('');
    expect(byAttr.get('[data-sheet-kua-note="b"]').textContent).toBe('');
  });
});
