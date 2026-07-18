// ui/meanings.js
// Free-tier coordinate meanings UI: arcana / sun / public animal / life path
// become tappable, opening an inline panel with the tradition-cited entry
// from content/meanings.v1.js. Catalog index is deliberately excluded (see
// that file's header) — the compound reading is the paid card entry.
//
// DI shape per DOCTRINE §6 v0.23: initMeaningsUI(refs). Injects its own
// panel markup + scoped CSS at init time rather than touching index.html's
// static markup/style block — keeps the §6 1500-line single-file budget
// intact. index.html footprint for this feature is 2 lines: one import,
// one init call.
//
// Controller override (2026-07-04): shipped while product features are
// FROZEN per REACH_CONTROL.md's reach-bottleneck finding (2026-06-24) —
// same class of exception as the v0.38 free-life-path-split override.
// Dissent on record: reach has not crossed the tripwire; this ships anyway
// on operator direction. See journal.md entry this same date.

import {
  ARCANA_MEANINGS,
  SUN_MEANINGS,
  ANIMAL_MEANINGS,
  LIFE_PATH_MEANINGS,
} from '../content/meanings.v1.js';

const TABLES = {
  arcana: ARCANA_MEANINGS,
  sun: SUN_MEANINGS,
  animal: ANIMAL_MEANINGS,
  lifePath: LIFE_PATH_MEANINGS,
};

const VALUE_IDS = {
  arcana: 'coord-arcana-symbol',
  sun: 'coord-sun-symbol',
  animal: 'coord-animal-symbol',
  lifePath: 'coord-lifepath-symbol',
};

const STYLE = `
.meaning-panel { max-height: 0; overflow: hidden; opacity: 0; margin-top: 0;
  border-top: 1px solid rgba(26,24,18,0.15);
  transition: max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease; }
.meaning-panel.open { max-height: 220px; opacity: 1; margin-top: 4px; padding-top: 16px; }
.meaning-head { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--label); margin-bottom: 6px; }
.meaning-title { font-size: 14px; font-style: italic; color: var(--ink);
  text-transform: lowercase; margin-bottom: 8px; }
.meaning-body { font-size: 12px; line-height: 1.55; color: var(--ink); text-align: left; }
.meaning-close { display: block; margin: 10px auto 0; background: none; border: none;
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--label); cursor: pointer; }
.coord-cell.has-meaning { cursor: pointer; }
.coord-cell.has-meaning.active { background: rgba(26,24,18,0.06); border-color: var(--ink); }
`;

function injectStyle() {
  if (document.getElementById('meanings-style')) return;
  const style = document.createElement('style');
  style.id = 'meanings-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.className = 'meaning-panel';
  panel.id = 'meaning-panel';
  panel.innerHTML =
    '<div class="meaning-head" id="meaning-head"></div>' +
    '<div class="meaning-title" id="meaning-title"></div>' +
    '<div class="meaning-body" id="meaning-body"></div>' +
    '<button type="button" class="meaning-close" id="meaning-close">close</button>';
  return panel;
}

// Arcana renders as the full "roman · name" label on the card; the table is
// keyed by name alone, so split off everything after the "·" separator.
function lookupKeyFor(key, rawValue) {
  if (key !== 'arcana') return rawValue.trim();
  const parts = rawValue.split('\u00b7');
  return parts.length > 1 ? parts.slice(1).join('\u00b7').trim() : rawValue.trim();
}

export function initMeaningsUI(refs) {
  const cardFace = refs && refs.cardFace;
  if (!cardFace || cardFace.querySelector('#meaning-panel')) return;
  injectStyle();
  const panel = buildPanel();
  cardFace.appendChild(panel);
  const head = panel.querySelector('#meaning-head');
  const title = panel.querySelector('#meaning-title');
  const body = panel.querySelector('#meaning-body');
  let activeCell = null;

  // The collapsed panel is max-height:0/overflow:hidden \u2014 pixels gone, but
  // its close button stayed in the tab order. `inert` (mirrored by
  // aria-hidden) takes the whole panel out of the focus/AT tree with state.
  function setPanelHidden(hidden) {
    panel.inert = hidden;
    panel.setAttribute('aria-hidden', String(hidden));
  }
  setPanelHidden(true);

  function close() {
    const cell = activeCell;
    if (cell) {
      cell.classList.remove('active');
      cell.setAttribute('aria-expanded', 'false');
    }
    activeCell = null;
    // Focus moves OUT to the toggler cell FIRST, then the panel goes inert —
    // hiding a subtree that still contains the focused close button strands
    // focus, and Chromium blocks aria-hidden on a focused ancestor.
    if (cell && typeof cell.focus === 'function') cell.focus({ preventScroll: true });
    panel.classList.remove('open');
    setPanelHidden(true);
  }

  function openFor(key, cell) {
    const valEl = document.getElementById(VALUE_IDS[key]);
    const rawValue = valEl ? valEl.textContent.trim() : '';
    if (!rawValue || rawValue === '\u2014') return;
    const entry = TABLES[key][lookupKeyFor(key, rawValue)];
    if (!entry) return;
    if (activeCell === cell) { close(); return; }
    if (activeCell) {
      activeCell.classList.remove('active');
      activeCell.setAttribute('aria-expanded', 'false');
    }
    activeCell = cell;
    cell.classList.add('active');
    cell.setAttribute('aria-expanded', 'true');
    head.textContent = key.toUpperCase();
    title.textContent = entry.register;
    body.textContent = entry.body;
    panel.classList.add('open');
    setPanelHidden(false);
  }

  // Mark the four cells interactive. Delegated click/keydown on cardFace
  // (stable across re-renders) rather than on the value spans themselves,
  // which get their textContent replaced on every renderCard call.
  for (const key of Object.keys(VALUE_IDS)) {
    const valEl = document.getElementById(VALUE_IDS[key]);
    const cell = valEl && valEl.closest('.coord-cell');
    if (cell) {
      cell.classList.add('has-meaning');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-expanded', 'false');
      cell.setAttribute('aria-controls', 'meaning-panel');
      cell.dataset.meaningKey = key;
    }
  }

  cardFace.addEventListener('click', e => {
    const cell = e.target.closest('.coord-cell.has-meaning');
    if (cell) openFor(cell.dataset.meaningKey, cell);
  });
  cardFace.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cell = e.target.closest('.coord-cell.has-meaning');
    if (cell) { e.preventDefault(); openFor(cell.dataset.meaningKey, cell); }
  });
  panel.querySelector('#meaning-close').addEventListener('click', close);
}
