// ui/meanings.js
// Coordinate-meaning UI: every coordinate compartment becomes tappable and
// keyboard-reachable. Each resolved value opens its own meaning plus a compact
// contextual read of how that value sits beside the rest of the current sheet.
// Catalog index is deliberately excluded — the compound reading is the paid
// card entry.
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
  NUMEROLOGY_MEANINGS,
  ELEMENT_MEANINGS,
  HARMONY_THEME_ALIASES,
  COORDINATE_CONTEXT,
} from '../content/meanings.v2.js';

const TABLES = {
  arcana: ARCANA_MEANINGS,
  element: ELEMENT_MEANINGS,
  sun: SUN_MEANINGS,
  rising: SUN_MEANINGS,
  animal: ANIMAL_MEANINGS,
  innerAnimal: ANIMAL_MEANINGS,
  lifePath: NUMEROLOGY_MEANINGS,
  nameNumber: NUMEROLOGY_MEANINGS,
  soulUrge: NUMEROLOGY_MEANINGS,
  personality: NUMEROLOGY_MEANINGS,
  birthday: NUMEROLOGY_MEANINGS,
  maturity: NUMEROLOGY_MEANINGS,
};

const NUMEROLOGY_KEYS = new Set([
  'lifePath', 'nameNumber', 'soulUrge', 'personality', 'birthday', 'maturity',
]);

const COORDINATES = {
  arcana: { valueId: 'coord-arcana-symbol', label: 'arcana' },
  element: { valueId: 'coord-element-symbol', label: 'element' },
  sun: { valueId: 'coord-sun-symbol', label: 'sun' },
  rising: { valueId: 'coord-rising-symbol', label: 'rising' },
  animal: { valueId: 'coord-animal-symbol', label: 'public animal' },
  innerAnimal: { valueId: 'coord-inner-symbol', label: 'private animal' },
  lifePath: { valueId: 'coord-lifepath-symbol', label: 'life path' },
  nameNumber: { valueId: 'coord-namenumber-symbol', label: 'name number' },
  soulUrge: { valueId: 'coord-soulurge-symbol', label: 'soul urge' },
  personality: { valueId: 'coord-personality-symbol', label: 'personality' },
  birthday: { valueId: 'coord-birthday-symbol', label: 'birthday' },
  maturity: { valueId: 'coord-maturity-symbol', label: 'maturity' },
  dayPillar: { valueId: 'coord-daypillar-symbol', label: 'day pillar' },
  hourPillar: { valueId: 'coord-hourpillar-symbol', label: 'hour pillar' },
};

const UNRESOLVED_COPY = {
  rising: 'no rising value is present yet, so its first-impression meaning cannot be placed beside the sun and personality coordinates. birth time and birthplace complete this part of the sheet.',
  hourPillar: 'no hour-pillar value is present yet, so its time-specific meaning cannot be placed beside the private animal and rising coordinates. birth time completes this part of the sheet.',
  nameNumber: 'no name-number value is present because the entered name supplies no counted letters. this coordinate stays unresolved rather than creating a zero.',
  soulUrge: 'no soul-urge value is present because the entered name supplies no standard vowels. this coordinate stays unresolved rather than creating a zero.',
  personality: 'no personality value is present because the entered name supplies no consonants. this coordinate stays unresolved rather than creating a zero.',
  maturity: 'no maturity value is present because its required name-number component is unresolved. this coordinate stays unresolved rather than creating a zero.',
};

const STYLE = `
.meaning-panel { max-height: 0; overflow: hidden; opacity: 0; margin-top: 0;
  border-top: 1px solid rgba(26,24,18,0.15);
  transition: max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease; }
.meaning-panel.open { max-height: 420px; opacity: 1; margin-top: 4px; padding-top: 16px; }
.meaning-head { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--label); margin-bottom: 6px; }
.meaning-title { font-size: 14px; font-style: italic; color: var(--ink);
  text-transform: lowercase; margin-bottom: 8px; }
.meaning-body { font-size: 12px; line-height: 1.55; color: var(--ink); text-align: left; }
.meaning-context-head { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--label); text-align: left; margin-top: 12px; margin-bottom: 4px; }
.meaning-context { font-size: 12px; line-height: 1.55; color: var(--ink); text-align: left; }
.meaning-close { display: block; margin: 10px auto 0; background: none; border: none;
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--label); cursor: pointer; min-height: 44px;
  padding: 8px 16px; }
.coord-cell.has-detail { cursor: pointer; min-height: 44px; touch-action: manipulation;
  transition: background-color 100ms ease-out, border-color 100ms ease-out; }
@media (hover: hover) {
  .coord-cell.has-detail:hover { background: rgba(26,24,18,0.035); border-color: rgba(26,24,18,0.55); }
}
.coord-cell.has-detail:focus-visible, .meaning-close:focus-visible {
  outline: 2px solid var(--ink); outline-offset: 2px; }
.coord-cell.has-detail.active { background: rgba(26,24,18,0.06); border-color: var(--ink); }
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
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-live', 'polite');
  panel.setAttribute('aria-labelledby', 'meaning-head meaning-title');
  panel.innerHTML =
    '<div class="meaning-head" id="meaning-head"></div>' +
    '<div class="meaning-title" id="meaning-title"></div>' +
    '<div class="meaning-body" id="meaning-body"></div>' +
    '<div class="meaning-context-head" id="meaning-context-head">in this sheet</div>' +
    '<div class="meaning-context" id="meaning-context"></div>' +
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

function themeFor(entry) {
  if (entry.theme) return entry.theme;
  return HARMONY_THEME_ALIASES[entry.register]
    || entry.register.split('\u00b7')[0].trim();
}

function pillarEntry(rawValue) {
  const [animal, element] = rawValue.split('\u00b7').map(part => part.trim());
  const animalEntry = ANIMAL_MEANINGS[animal];
  const elementEntry = ELEMENT_MEANINGS[element];
  if (!animalEntry || !elementEntry) return null;
  const animalTheme = themeFor(animalEntry);
  const elementTheme = themeFor(elementEntry);
  return {
    register: `${animalTheme} \u00b7 ${elementTheme}`,
    theme: `${animalTheme} with ${elementTheme}`,
    body: `the ${animal} register brings ${animalEntry.register}; the ${element} register adds ${elementEntry.register}.`,
  };
}

function entryFor(key, rawValue) {
  if (!rawValue || rawValue === '\u2014') return null;
  if (key === 'dayPillar' || key === 'hourPillar') return pillarEntry(rawValue);
  const table = TABLES[key];
  return table ? table[lookupKeyFor(key, rawValue)] || null : null;
}

function readValues() {
  const values = {};
  for (const [key, coordinate] of Object.entries(COORDINATES)) {
    const valEl = document.getElementById(coordinate.valueId);
    values[key] = valEl ? valEl.textContent.trim() : '';
  }
  return values;
}

function harmonyFor(key, entry, values) {
  const context = COORDINATE_CONTEXT[key];
  if (!context) return '';
  const fallbacks = NUMEROLOGY_KEYS.has(key)
    ? [...NUMEROLOGY_KEYS]
    : ['sun', 'animal', 'lifePath', 'arcana', 'element', 'innerAnimal'];
  const candidates = [
    ...context.partners,
    ...fallbacks,
  ];
  const partners = [];
  for (const partnerKey of candidates) {
    if (partnerKey === key || partners.some(p => p.key === partnerKey)) continue;
    const partnerEntry = entryFor(partnerKey, values[partnerKey]);
    if (!partnerEntry) continue;
    partners.push({
      key: partnerKey,
      theme: themeFor(partnerEntry),
      role: COORDINATE_CONTEXT[partnerKey].role,
    });
    if (partners.length === 2) break;
  }
  if (partners.length < 2) return `read together, ${themeFor(entry)} serves as ${context.role}.`;
  return `read together, ${themeFor(entry)} serves as ${context.role}; ${partners[0].theme} enters as ${partners[0].role}, and ${partners[1].theme} as ${partners[1].role}. the combination is ${themeFor(entry)} working through ${partners[0].theme} and ${partners[1].theme}.`;
}

function detailFor(key, cell, rawValue) {
  if (cell.classList.contains('sealed') || !rawValue) {
    return {
      title: 'meaning sealed at this tier',
      body: 'the value is not present on this tier, so its meaning cannot yet be read beside the rest of the sheet.',
      context: '',
    };
  }
  if (rawValue === '\u2014') {
    return {
      title: 'not resolved',
      body: UNRESOLVED_COPY[key] || 'no value is present yet, so this meaning cannot be placed beside the rest of the sheet.',
      context: '',
    };
  }
  const entry = entryFor(key, rawValue);
  if (entry) {
    return {
      title: entry.register,
      body: entry.body,
      context: harmonyFor(key, entry, readValues()),
      contextLabel: NUMEROLOGY_KEYS.has(key) ? 'with the other numbers' : 'in this sheet',
    };
  }
  return {
    title: 'meaning not filed',
    body: 'this value has no meaning entry in the current content registry.',
    context: '',
  };
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
  const contextHead = panel.querySelector('#meaning-context-head');
  const contextBody = panel.querySelector('#meaning-context');
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
    const coordinate = COORDINATES[key];
    if (!coordinate) return;
    const valEl = document.getElementById(coordinate.valueId);
    const rawValue = valEl ? valEl.textContent.trim() : '';
    if (activeCell === cell) { close(); return; }
    if (activeCell) {
      activeCell.classList.remove('active');
      activeCell.setAttribute('aria-expanded', 'false');
    }
    activeCell = cell;
    cell.classList.add('active');
    cell.setAttribute('aria-expanded', 'true');
    const detail = detailFor(key, cell, rawValue);
    head.textContent = coordinate.label.toUpperCase();
    title.textContent = detail.title;
    body.textContent = detail.body;
    contextHead.hidden = !detail.context;
    contextBody.hidden = !detail.context;
    contextHead.textContent = detail.contextLabel || 'in this sheet';
    contextBody.textContent = detail.context;
    panel.classList.add('open');
    setPanelHidden(false);
  }

  // Mark every coordinate compartment interactive. Delegated click/keydown on cardFace
  // (stable across re-renders) rather than on the value spans themselves,
  // which get their textContent replaced on every renderCard call.
  for (const [key, coordinate] of Object.entries(COORDINATES)) {
    const valEl = document.getElementById(coordinate.valueId);
    const cell = valEl && valEl.closest('.coord-cell');
    if (cell) {
      cell.classList.add('has-detail');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-expanded', 'false');
      cell.setAttribute('aria-controls', 'meaning-panel');
      cell.setAttribute('aria-label', `${coordinate.label} details`);
      cell.dataset.coordinateKey = key;
    }
  }

  cardFace.addEventListener('click', e => {
    const cell = e.target.closest('.coord-cell.has-detail');
    if (cell) openFor(cell.dataset.coordinateKey, cell);
  });
  cardFace.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeCell) {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const cell = e.target.closest('.coord-cell.has-detail');
    if (cell) { e.preventDefault(); openFor(cell.dataset.coordinateKey, cell); }
  });
  panel.querySelector('#meaning-close').addEventListener('click', close);

  // Escape parity with about/forget/paywall (P3 post-spree audit). Defer when
  // any modal-bg overlay is open so modal Escape remains the higher priority.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!panel.classList.contains('open')) return;
    if (typeof document.querySelector === 'function'
        && document.querySelector('.modal-bg.open')) return;
    close();
  });
}
