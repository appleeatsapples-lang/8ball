// 8ball / ui / sheet.js — a complete standalone specimen sheet, instanced
//
// WHY THIS EXISTS. The dyad (§1.J, t5) sells "A's standalone reading + B's
// standalone reading + a relation layer". The first implementation rendered a
// bespoke two-column coordinate table instead, and a Codex pre-merge audit
// (PR #187, finding F5) correctly refused it: a narrowed table is not the
// standalone reading, and the module's own header admitted it dropped both
// written entries and the rising sign.
//
// WHY NOT REFACTOR ui/tiers.js INTO A FACTORY. That was the obvious route and
// it is the wrong trade here. `ui/tiers.js` is imported by 14 of the 51 test
// files, and several of them assert
// on its SOURCE LAYOUT (through v0.73 two sliced the file between literal
// tokens and required zero-argument placard/atlas call forms; those writers
// retired in v0.74 and the source pins that remain are of the same kind). A
// factory refactor breaks such pins for reasons unrelated to what they guard,
// and the only way through is to rewrite protected tests to accommodate the
// refactor — which is exactly the move a re-audit should distrust. More
// importantly the audit packet requires that "existing single-reading behavior
// must remain unchanged"; a new module cannot regress the shipped render path,
// a rewrite of it can.
//
// SO: one VALUE mapping, two DOM writers. Every coordinate string on a sheet
// built here comes from `ui/tiers.js cellRenderState` — the same pure function
// `renderTierSections` resolves the host sheet through — and the rows, the
// entitlement sets and the row titles are all read from `ui/tiers.js` rather
// than restated (the placards and the atlas left every sheet in v0.74). What differs is only which nodes
// get written. `tests/dyad_surface.test.js` pins the equivalence directly: a
// bounded set (one profile per life-path facet-anchor group, across every
// tier) is run through a REAL `renderTierSections` host render and through
// this module's `render`, and every coordinate cell, plus the written-entry
// and public-read blocks each side varies independently of the cell grid,
// must agree. That is a stronger anti-drift guarantee than a shared function
// alone, because it drives two independent renderer call paths and tests the
// rendered result rather than re-invoking the shared function on both sides
// (PR #187 P2-R3 — the first version of this comment and its suite claimed
// "every profile" and never actually drove `renderTierSections`, so a written-
// entry regression in the shared caller (R2) passed it clean).
//
// ISOLATION. Each instance owns all of its state. This module never touches
// `ui/tiers.js`'s module-level cells, so `shareRowRefs()` — captured once at
// boot in index.html and closing over those cells — keeps pointing at the host
// sheet no matter how many sheets exist (§5.D; pinned in
// tests/share_surface.test.js, and green before this file existed).
//
// STORAGE / NETWORK: none. No localStorage key is named, read or written —
// notably NOT the facet index, so rendering a second person's sheet cannot
// advance or reset the host's written-entry rotation. The note slot is handed
// in by the caller.

import {
  CELL_KEYS,
  CELL_COORD,
  cellRenderState,
  coordsForTier,
  PROV_NOTE,
  ATLAS_NOTE,
  SHEET_GROUPS,
} from './tiers.js';
import { CARDS } from '../content/cards.v1.full.js';
import { getCard, MissingCardError } from '../core/engine.js';

// ── markup ────────────────────────────────────────────────────────
//
// Row titles are markup, so they live here rather than in ui/tiers.js. The
// sun and animal titles are rewritten per render (the paired-row grammar:
// the dot form names structure, the relation glyph marks a resolved entitled
// pair), exactly as renderTierSections does for the host sheet.
// `tests/dyad_surface.test.js` pins this list against index.html's own
// coord-section titles so the two structures cannot drift apart.
export const ROW_TITLES = Object.freeze({
  arcana: 'ARCANA',
  element: 'FIVE-ELEMENT',
  sun: 'SUN ↑ RISING',
  moon: 'MOON',
  animal: 'PUBLIC ⇌ PRIVATE',
  lifePath: 'LIFE · NAME · SOUL',
  personality: 'PERSONALITY · BIRTHDAY · MATURITY',
  dayPillar: 'DAY PILLAR',
  hourPillar: 'HOUR PILLAR',
});

const cellHtml = (prefix, key) =>
  '<span class="coord-cell">' +
  `<span class="coord-val" data-sheet-cell="${prefix}:${key}"></span>` +
  '<span class="coord-seal" aria-hidden="true"></span></span>';

/**
 * The DOM for one complete specimen sheet, structurally mirroring
 * index.html's `#card-face`.
 *
 * Cells are addressed by `data-sheet-cell` attributes, never by `id`. That is
 * deliberate and load-bearing: `ui/meanings.js` binds the host sheet's
 * compartments with `document.getElementById('coord-arcana-symbol')` and
 * friends, so emitting those ids on a second sheet would make the lookup
 * ambiguous and the host's own meaning panel would start reading whichever
 * node document order happened to return. Attributes keep the two sheets
 * addressable and disjoint. (The cost is that sheets built here are not
 * tappable — see the limit recorded in DOCTRINE §1.J.)
 */
export function buildSheetMarkup(prefix) {
  const sectionHtml = keys => {
    const lead = keys[0];
    // v0.74: titles only — the atlas gloss and the placard left every sheet
    // for the host's meaning panel (ui/tiers.js derivationText).
    return '<div class="coord-section">' +
      `<div class="coord-title" data-sheet-title="${prefix}:${lead}">${ROW_TITLES[lead]}</div>` +
      `<div class="coord-cells">${keys.map(k => cellHtml(prefix, k)).join('')}</div>` +
      '</div>';
  };
  // System groups (§1.F v0.72): the same registry the host sheet is built
  // from, so group order, titles and row membership cannot drift between
  // the two surfaces (tests/dyad_surface.test.js pins the parity).
  const sections = SHEET_GROUPS.map(g =>
    `<div class="coord-group" data-system="${g.key}">` +
    `<div class="coord-group-title">${g.title}</div>` +
    g.rows.map(sectionHtml).join('') +
    '</div>').join('');

  return '<article class="card seal-hatch" data-sheet-face="' + prefix + '">' +
    `<span class="catalog" data-sheet-catalog="${prefix}">no. —</span>` +
    `<div class="card-name" data-sheet-name="${prefix}"></div>` +
    `<div class="card-type" data-sheet-type="${prefix}"></div>` +
    sections +
    '<div class="card-entry" data-sheet-entry="' + prefix + '">' +
    '<div class="card-prose-rule"></div>' +
    '<div class="entry-title">WRITTEN ENTRY</div>' +
    `<div class="card-habit" data-sheet-habit="${prefix}"></div>` +
    `<div class="card-note" data-sheet-note="${prefix}"></div>` +
    '<span class="coord-seal" aria-hidden="true"></span></div>' +
    '<div class="public-read" data-sheet-public="' + prefix + '">' +
    '<div class="card-prose-rule"></div>' +
    '<div class="public-title">DOMAIN FIT</div>' +
    `<div class="card-habit" data-sheet-families="${prefix}"></div>` +
    `<div class="card-note" data-sheet-antifit="${prefix}"></div>` +
    `<div class="card-note" data-sheet-roleline="${prefix}"></div>` +
    `<div class="card-note public-bridge" data-sheet-public-bridge="${prefix}"></div>` +
    '<span class="coord-seal" aria-hidden="true"></span></div>' +
    '</article>';
}

// ── instance ──────────────────────────────────────────────────────

/**
 * A sheet bound to a host element, addressed by `prefix`.
 *
 * @param {Element} host  a node whose innerHTML has already been (or will be)
 *                        populated with buildSheetMarkup(prefix)
 * @param {{prefix: string}} opts
 */
export function createSheet(host, { prefix } = {}) {
  const q = sel => (host && host.querySelector ? host.querySelector(sel) : null);
  const cellNode = key => q(`[data-sheet-cell="${prefix}:${key}"]`);
  const titleNode = key => q(`[data-sheet-title="${prefix}:${key}"]`);

  // Every node this instance can write, so clear() is derived from the same
  // list render() fills rather than hand-maintained beside it. The PR #187 F1
  // defect was exactly a hand-maintained clear list falling behind its fill.
  const valueNodes = () => [
    ...CELL_KEYS.map(cellNode),
    q(`[data-sheet-catalog="${prefix}"]`),
    q(`[data-sheet-name="${prefix}"]`),
    q(`[data-sheet-type="${prefix}"]`),
    q(`[data-sheet-habit="${prefix}"]`),
    q(`[data-sheet-note="${prefix}"]`),
    q(`[data-sheet-families="${prefix}"]`),
    q(`[data-sheet-antifit="${prefix}"]`),
    q(`[data-sheet-roleline="${prefix}"]`),
    q(`[data-sheet-public-bridge="${prefix}"]`),
  ];

  function setCell(key, state, text) {
    const node = cellNode(key);
    if (!node) return;
    node.textContent = state === 'value' ? text : state === 'unres' ? '—' : '';
    const root = node.closest ? node.closest('.coord-cell') : null;
    if (root && root.classList) {
      root.classList.toggle('sealed', state === 'sealed');
      root.classList.toggle('unres', state === 'unres');
    }
  }

  return {
    prefix,

    /**
     * Fill the sheet for (profile, tier).
     *
     * @param {object} profile
     * @param {string} tier
     * @param {{noteSlot?: 'low'|'mid'|'high'}} opts
     *        noteSlot is handed in, never read from storage: the written-entry
     *        rotation lives in `eight_ball_facet_index_v3` (§1.H v0.62; `_v1`
     *        and `_v2` are retired generations, cleared once on first read)
     *        and a second person's sheet must not touch it (§5 — no storage
     *        write).
     *
     *        publicRead is likewise handed in rather than computed. This module
     *        deliberately does NOT import the public-tier surface: that engine
     *        carries a single-consumer pin (tests/public.test.js) whose matcher
     *        is intentionally broad, and widening a real guard to fit a new
     *        caller is the wrong direction. The host injects the read through
     *        ui/dyad.js, which is the §6 DI shape anyway.
     */
    render(profile, tier, { noteSlot = 'mid', publicRead = null } = {}) {
      if (!profile) return null;
      const coords = coordsForTier(tier);

      // Paired-row titles, same grammar as the host sheet.
      const risingOpen = coords.has('rising') && !!profile.risingSign;
      const sunTitle = titleNode('sun');
      if (sunTitle) sunTitle.textContent = risingOpen ? 'SUN ↑ RISING' : 'SUN · RISING';
      const animalTitle = titleNode('animal');
      if (animalTitle) {
        animalTitle.textContent = coords.has('innerAnimal') ? 'PUBLIC ⇌ PRIVATE' : 'PUBLIC · PRIVATE';
      }

      // THE shared mapping. Identical call renderTierSections makes.
      for (const key of CELL_KEYS) {
        const { state, text } = cellRenderState(profile, key, coords.has(CELL_COORD[key]));
        setCell(key, state, text);
      }

      const catalog = q(`[data-sheet-catalog="${prefix}"]`);
      if (catalog) {
        try {
          catalog.textContent = `no. ${getCard(profile).catalog}`;
        } catch (err) {
          if (err instanceof MissingCardError) catalog.textContent = 'no. —';
          else throw err;
        }
      }

      // Written 144-card entry — the t3 ceiling block, and per the audit
      // packet each side keeps its own.
      const entryOpen = coords.has('cardEntry');
      const face = q(`[data-sheet-face="${prefix}"]`);
      const entry = q(`[data-sheet-entry="${prefix}"]`);
      if (entry && entry.classList) entry.classList.toggle('sealed', !entryOpen);
      const cell = entryOpen && CARDS[profile.sunSign]
        ? CARDS[profile.sunSign][profile.animal]
        : null;
      setText(`[data-sheet-name="${prefix}"]`, cell ? cell.name : '');
      setText(`[data-sheet-type="${prefix}"]`, cell ? cell.type : '');
      setText(`[data-sheet-habit="${prefix}"]`, cell ? cell.habit : '');
      setText(`[data-sheet-note="${prefix}"]`, cell ? cell.note[noteSlot] : '');

      // Public read — the other t3 ceiling block.
      const publicOpen = coords.has('publicRead');
      const publicRoot = q(`[data-sheet-public="${prefix}"]`);
      const read = publicOpen ? publicRead : null;
      if (publicRoot && publicRoot.classList) publicRoot.classList.toggle('sealed', !read);
      setText(`[data-sheet-families="${prefix}"]`, read ? read.families : '');
      setText(`[data-sheet-antifit="${prefix}"]`, read ? read.antiFit : '');
      setText(`[data-sheet-roleline="${prefix}"]`, read ? read.roleLine : '');
      // The master-birthday disclosure (§1.B v0.62). Both sheets carry it for
      // the same reason the host does: a second person whose birthday is 11 or
      // 22 must not receive base-mode copy with nothing saying so. Empty for
      // an unbridged reading, and cleared on the sealed branch like every
      // other value node.
      setText(`[data-sheet-public-bridge="${prefix}"]`, read ? (read.bridge || '') : '');

      return { cardEntry: entryOpen, publicRead: !!read };
    },

    /**
     * Blank every value node this sheet can write, and drop the class state
     * that describes a tier. Derived from `valueNodes()`, so a node added to
     * the fill path is cleared without a second edit.
     */
    clear() {
      for (const node of valueNodes()) {
        if (node) node.textContent = '';
      }
      const catalog = q(`[data-sheet-catalog="${prefix}"]`);
      if (catalog) catalog.textContent = 'no. —';
      for (const key of CELL_KEYS) {
        const node = cellNode(key);
        const root = node && node.closest ? node.closest('.coord-cell') : null;
        if (root && root.classList) {
          root.classList.remove('sealed');
          root.classList.remove('unres');
        }
      }
      for (const sel of [`[data-sheet-face="${prefix}"]`, `[data-sheet-entry="${prefix}"]`,
        `[data-sheet-public="${prefix}"]`]) {
        const node = q(sel);
        if (node && node.classList) {
          node.classList.remove('sealed');
        }
      }
      const sunTitle = titleNode('sun');
      if (sunTitle) sunTitle.textContent = ROW_TITLES.sun;
      const animalTitle = titleNode('animal');
      if (animalTitle) animalTitle.textContent = ROW_TITLES.animal;
    },

    /** Read-only view of what is currently rendered — for tests and for the
     *  lifecycle assertions that must inspect hidden DOM rather than trust a
     *  `hidden` flag. */
    readCells() {
      const out = {};
      for (const key of CELL_KEYS) {
        const node = cellNode(key);
        out[key] = node ? String(node.textContent) : null;
      }
      return out;
    },
  };

  function setText(sel, text) {
    const node = q(sel);
    if (node) node.textContent = text;
  }
}

export { PROV_NOTE, ATLAS_NOTE };
