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
  COORDINATE_CONTEXT,
  NUMEROLOGY_SLOT_LINES,
  THEME_TENSIONS,
  PLACEMENT_LINES,
} from '../content/meanings.v6.js';
import { sheetRelationFor } from './concordance.js';

const TABLES = {
  arcana: ARCANA_MEANINGS,
  element: ELEMENT_MEANINGS,
  sun: SUN_MEANINGS,
  rising: SUN_MEANINGS,
  moon: SUN_MEANINGS,
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
  moon: { valueId: 'coord-moon-symbol', label: 'moon' },
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

// Shared trailing clause for the four name-derived coordinates: an absent
// contributing letter class resolves as unresolved, never a false zero.
const zeroGuardCopy = (label, missing) =>
  `no ${label} value is present because ${missing}. this coordinate stays unresolved rather than creating a zero.`;

const UNRESOLVED_COPY = {
  rising: 'no rising value is present yet, so its first-impression meaning cannot be placed beside the sun and personality coordinates. birth time and birthplace complete this part of the sheet.',
  moon: 'no moon value is present yet, so its night-register meaning cannot be placed beside the sun and rising coordinates. birth time and birthplace complete this part of the sheet.',
  dayPillar: 'no day-pillar value is present yet, so its date-specific meaning cannot be placed beside the public animal and element coordinates. date of birth completes this part of the sheet.',
  hourPillar: 'no hour-pillar value is present yet, so its time-specific meaning cannot be placed beside the private animal and rising coordinates. birth time completes this part of the sheet.',
  nameNumber: zeroGuardCopy('name-number', 'the entered name supplies no counted letters'),
  soulUrge: zeroGuardCopy('soul-urge', 'the entered name supplies no standard vowels'),
  personality: zeroGuardCopy('personality', 'the entered name supplies no consonants'),
  maturity: zeroGuardCopy('maturity', 'its required name-number component is unresolved'),
};

const STYLE = `
.meaning-panel { max-height: 0; overflow: hidden; opacity: 0; margin-top: 0;
  border-top: 1px solid rgba(255,255,255,0.15);
  transition: max-height 0.28s ease, opacity 0.2s ease, margin-top 0.28s ease; }
.meaning-panel.open { max-height: 720px; overflow-y: auto; opacity: 1; margin-top: 4px; padding-top: 16px; }
/* the ≥1100 desk (ui/experience.css) lifts this clamp for a DOCKED panel by
   specificity — keep this selector at class level, never #id or !important */
.meaning-head { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text-muted); margin-bottom: 6px; }
.meaning-title { font-size: 14px; font-style: italic; color: var(--text);
  text-transform: lowercase; margin-bottom: 8px; }
.meaning-body { font-size: 12px; line-height: 1.55; color: var(--text); text-align: left; }
.meaning-context-head { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text-muted); text-align: left; margin-top: 12px; margin-bottom: 4px; }
.meaning-context { font-size: 12px; line-height: 1.55; color: var(--text); text-align: left; }
.meaning-hint { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--text-muted); text-align: center; margin-top: 12px; }
.meaning-hint[hidden] { display: none; }
.meaning-close { display: block; margin: 10px auto 0; background: none; border: none;
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--text-muted); cursor: pointer; min-height: 44px;
  padding: 8px 16px; }
.coord-cell.has-detail { cursor: pointer; min-height: 44px; touch-action: manipulation;
  transition: background-color 100ms ease-out, border-color 100ms ease-out; }
@media (hover: hover) {
  .coord-cell.has-detail:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.55); }
}
.coord-cell.has-detail:focus-visible, .meaning-close:focus-visible {
  outline: 2px solid var(--text); outline-offset: 2px; }
.coord-cell.has-detail.active { background: rgba(255,255,255,0.10); border-color: var(--text); }
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
    '<div class="meaning-context-head" id="meaning-relation-head">filed relation</div>' +
    '<div class="meaning-context" id="meaning-relation"></div>' +
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
  return entry.theme || entry.register.split('\u00b7')[0].trim();
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

// Exported pure (no DOM): tests/meanings_content.test.js scans the ASSEMBLED
// runtime output (pillar bodies here, harmony sentences below) through the
// shared voice-register tables, mirroring the concordance assembled-output
// scan convention (#101/#107).
export function entryFor(key, rawValue) {
  if (!rawValue || rawValue === '\u2014') return null;
  if (key === 'dayPillar' || key === 'hourPillar') return pillarEntry(rawValue);
  const table = TABLES[key];
  const entry = table ? table[lookupKeyFor(key, rawValue)] || null : null;
  if (!entry) return null;
  // v4 slot lines: six numerology coordinates draw one shared 12-entry
  // table, so a value repeated across slots used to render the identical
  // sentence twice on one card (76% of sampled sheets — journal
  // 2026-08-30). The shared base body stays byte-identical (the master
  // entries' v1-reused bodies included); the slot's own authored line is
  // APPENDED, reading the value in this slot specifically.
  const slotLine = NUMEROLOGY_SLOT_LINES[key] && NUMEROLOGY_SLOT_LINES[key][lookupKeyFor(key, rawValue)];
  // v5/v6 placement lines: the same contract for the table-sharing
  // surfaces — rising AND the moon (v6, §1.K) reuse SUN_MEANINGS and the
  // private animal reuses ANIMAL_MEANINGS, so a shared sign/branch rendered
  // the identical body twice (or three times) on one card. Base body stays byte-identical;
  // the placement's authored line is appended.
  const placementLine = PLACEMENT_LINES[key] && PLACEMENT_LINES[key][lookupKeyFor(key, rawValue)];
  const appended = slotLine || placementLine;
  return appended ? { ...entry, body: `${entry.body} ${appended}` } : entry;
}

function readValues() {
  const values = {};
  for (const [key, coordinate] of Object.entries(COORDINATES)) {
    const valEl = document.getElementById(coordinate.valueId);
    values[key] = valEl ? valEl.textContent.trim() : '';
  }
  return values;
}

// Four sentence frames for the harmony line (optimization item 4 —
// every context sentence used to share one skeleton, and the pattern was
// visible by the second tap). Chosen deterministically from the tapped
// key and value so the same sheet always reads the same; the closing
// clause (harmony algebra or a filed tension sentence) is identical
// across frames, so the tension registry and its pins ride unchanged.
// Exported pure so the assembled-output voice scan can iterate ALL
// frames rather than only the ones a fixture happens to hit.
export const HARMONY_FRAME_COUNT = 4;
export function composeHarmony(frameIndex, theme, role, partners, closing) {
  const [p0, p1] = partners;
  const tail = closing ? ` ${closing}` : '';
  switch (((frameIndex % HARMONY_FRAME_COUNT) + HARMONY_FRAME_COUNT) % HARMONY_FRAME_COUNT) {
    case 1:
      return `${theme} carries ${role} here, beside ${p0.theme} as ${p0.role} and ${p1.theme} as ${p1.role}.${tail}`;
    case 2:
      return `in this reading, ${role} falls to ${theme}; ${p0.role} to ${p0.theme}, and ${p1.role} to ${p1.theme}.${tail}`;
    case 3:
      return `${theme} takes ${role}. ${p0.theme} holds ${p0.role}; ${p1.theme} holds ${p1.role}.${tail}`;
    default:
      return `read together, ${theme} serves as ${role}; ${p0.theme} enters as ${p0.role}, and ${p1.theme} as ${p1.role}.${tail}`;
  }
}
export function frameIndexFor(key, rawValue) {
  let sum = 0;
  const s = `${key}|${rawValue}`;
  for (let i = 0; i < s.length; i++) sum = (sum + s.charCodeAt(i)) % 997;
  return sum % HARMONY_FRAME_COUNT;
}

/**
 * The filed-relation line for the panel (optimization item 3): the §1.I
 * registries applied within one sheet, via ui/concordance.js's
 * sheetRelationFor. Registered relations only; '' when none — the panel
 * claims nothing by omission. Exported pure for the assembled-output
 * voice scan.
 */
export function relationLineFor(key, values) {
  const rel = sheetRelationFor(key, values);
  if (!rel) return '';
  // The full §1.I Register-law emission set, matching the two-reading
  // compare surface: values, relation, citation, registry, and the
  // qualifier verbatim (pr213 audit, opus MAJOR — the panel had dropped
  // three of the six, the qualifier included).
  return `${rel.label}: ${rel.left} and ${rel.right} — ${rel.relation}. registered — ${rel.citation}; registry: ${rel.registry}. ${rel.qualifier}`;
}

export function harmonyFor(key, entry, values, opts = {}) {
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
  // v4 tension registry: where the primary theme and a partner theme form
  // a filed opposing pair, the closing clause is the authored sentence
  // naming that tension instead of the generic "working through" algebra.
  // Deterministic — first filed pair in partner order wins; unfiled pairs
  // keep the harmony clause byte-for-byte.
  const theme = themeFor(entry);
  // Filed-pair lookup order: primary-vs-first partner, primary-vs-second,
  // then the two partners against each other — the pr212 audit showed a
  // sheet closing with "working through" harmony on a pair the registry
  // itself files as opposed (partner-vs-partner was never consulted, so
  // one panel contradicted its neighbor). First filed pair wins;
  // deterministic; unfiled triples keep the harmony clause byte-for-byte.
  const pairKey = (a, b) => [a, b].sort().join('|');
  const filedCandidates = [
    pairKey(theme, partners[0].theme),
    pairKey(theme, partners[1].theme),
    pairKey(partners[0].theme, partners[1].theme),
  ];
  const filed = filedCandidates.find(k => THEME_TENSIONS[k]);
  // An ADVERSE filed relation rendering on this same panel suppresses the
  // harmony algebra (pr213 audit, opus MED — "working through" one line
  // above a filed chong/square/ke record is the pr212 contradiction shape
  // across registries). A filed THEME tension still renders: friction
  // above friction is consistent.
  const closing = filed
    ? THEME_TENSIONS[filed]
    : (opts.adverse ? '' : `the combination is ${theme} working through ${partners[0].theme} and ${partners[1].theme}.`);
  return composeHarmony(frameIndexFor(key, values[key]), theme, context.role, partners, closing);
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
    const values = readValues();
    const rel = sheetRelationFor(key, values);
    return {
      title: entry.register,
      body: entry.body,
      context: harmonyFor(key, entry, values, { adverse: !!(rel && rel.adverse) }),
      contextLabel: NUMEROLOGY_KEYS.has(key) ? 'with the other numbers' : 'in this sheet',
      relation: rel
        ? `${rel.label}: ${rel.left} and ${rel.right} — ${rel.relation}. registered — ${rel.citation}; registry: ${rel.registry}. ${rel.qualifier}`
        : '',
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
  // Double-init guard: the panel may be docked OUTSIDE cardFace on the
  // ≥1100 desk, so the card-scoped probe alone went blind there (pr231
  // audit LOW-1) — ask the document as well.
  if (!cardFace || cardFace.querySelector('#meaning-panel')) return;
  if (typeof document.getElementById === 'function' && document.getElementById('meaning-panel')) return;
  injectStyle();
  // Comprehension hint (journal 2026-08-31): fifteen compartments are
  // tappable, but the only affordance was a desktop hover — on touch, and
  // for the bare labels-off glyphs, nothing said the sheet opens. One
  // clinical line under the sheet carries both affordances (the panel a
  // tap opens leads with the compartment's label). It hides after the
  // first open — the affordance has done its job — and holds NO stored
  // state (§5: no new key), so it deliberately returns on the next load.
  const hint = document.createElement('div');
  hint.className = 'meaning-hint';
  hint.id = 'meaning-hint';
  hint.textContent = 'each compartment opens — tap any value';
  // Visual/touch affordance only (pr217 audit LOW): AT users already get
  // the affordance from every cell's role="button" + aria-label, and the
  // card face is a polite live region — an unhidden hint is one redundant
  // announced line.
  hint.setAttribute('aria-hidden', 'true');
  // Above the prose blocks, under the compartments (pr217 audit MED 1):
  // appended last it sat at DOM index 15 — ~190px below the fold on the
  // t3 sheet, off screen at the exact moment it is supposed to teach.
  const entryBlock = typeof cardFace.querySelector === 'function'
    ? cardFace.querySelector('#card-entry') : null;
  if (entryBlock && typeof cardFace.insertBefore === 'function') {
    cardFace.insertBefore(hint, entryBlock);
  } else {
    cardFace.appendChild(hint);
  }
  const panel = buildPanel();
  // ── where the panel lives (the ≥1100 registry desk, journal 2026-09-02) ──
  // Below the desk breakpoint the panel is appended INSIDE #card-face and
  // expands inline, exactly as it has since #212. On a wide screen the host
  // offers a reading pane beside the sheet (refs.readingPane, index.html's
  // #reading-pane) and the panel docks there instead: the card keeps its
  // height, the entry reads in a column, and the card's own mutation
  // observer below still closes the panel on a re-render — the panel is
  // now OUTSIDE the observed subtree, so its own writes are never
  // self-noise. The node is MOVED, never duplicated, and moves back when
  // the viewport crosses the breakpoint; ids and aria-controls hold. A
  // crossing with a panel OPEN closes it: the move is a childList record
  // on cardFace outside the panel's subtree, which the observer treats as
  // a re-render — deterministic, and the cell is one tap away.
  const DESK_QUERY = '(min-width: 1100px)';
  const pane = refs && refs.readingPane;
  const mql = pane && typeof matchMedia === 'function' ? matchMedia(DESK_QUERY) : null;
  function mountPanel() {
    const docked = !!(mql && mql.matches && pane && typeof pane.appendChild === 'function');
    const target = docked ? pane : cardFace;
    if (panel.parentNode !== target) target.appendChild(panel);
    if (pane && pane.classList) pane.classList.toggle('docked', docked);
  }
  // The pane's empty line yields to an OPEN docked panel; the module owns
  // that state, so it is a class the module sets, not a :has() rule.
  function setPaneEntry(open) {
    if (pane && pane.classList) pane.classList.toggle('has-entry', !!open);
  }
  mountPanel();
  if (mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', mountPanel);
  const head = panel.querySelector('#meaning-head');
  const title = panel.querySelector('#meaning-title');
  const body = panel.querySelector('#meaning-body');
  const contextHead = panel.querySelector('#meaning-context-head');
  const contextBody = panel.querySelector('#meaning-context');
  const relationHead = panel.querySelector('#meaning-relation-head');
  const relationBody = panel.querySelector('#meaning-relation');
  let activeCell = null;
let scrollTimer = null;

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
    setPaneEntry(false);
  }

  function openFor(key, cell) {
    const coordinate = COORDINATES[key];
    if (!coordinate) return;
    hint.hidden = true; // first use retires the affordance for this load
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
    relationHead.hidden = !detail.relation;
    relationBody.hidden = !detail.relation;
    relationHead.textContent = detail.relation ? 'filed relation' : '';
    relationBody.textContent = detail.relation || '';
    panel.classList.add('open');
    setPanelHidden(false);
    setPaneEntry(true);
    // The panel lives BELOW the card, so a tap on a top-row cell of the tall
    // t3 sheet opened it ~200px under the fold — the tap looked like a no-op
    // (live-fire, 2026-08-30). Scroll it into view AFTER the 280ms max-height
    // transition so 'nearest' sees the expanded box; body is the scroller
    // (html is height:100%), which scrollIntoView handles either way. Guarded
    // for the injected-DOM test surface, and instant under reduced motion
    // (the global 0.01ms transition override collapses the wait, not the
    // scroll behavior, so ask the media query directly).
    if (typeof panel.scrollIntoView === 'function') {
      const instant = typeof matchMedia === 'function'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;
      // One pending scroll at a time: a reopen inside the window otherwise
      // double-fires (pr212 audit, sonnet LOW). 300ms > the 280ms
      // max-height transition, so 'nearest' measures the expanded box.
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        if (activeCell !== cell) return; // closed or retargeted meanwhile
        panel.scrollIntoView({ block: 'nearest', behavior: instant ? 'auto' : 'smooth' });
      }, 300);
    }
  }

  // A resubmission re-renders the card under an open panel, leaving stale
  // meaning text — and since pr213, a stale FILED RELATION could cite a
  // registry record the new values do not support (opus MED: a registered
  // sign-distance line rendered for a same-value pair §1.I says must be
  // unfiled). Close the panel whenever the card's values change under it;
  // guarded for the injected-DOM test surface.
  if (typeof MutationObserver === 'function' && cardFace) {
    // Close on card re-renders ONLY. openFor's own writes (head/title/body/
    // context/relation textContent) land inside this same observed subtree,
    // and without the panel-filter below the delivery microtask closed
    // every panel the instant it opened — panels wrote their prose into a
    // max-height:0, inert box. Shipped that way in #213 (its live-fire read
    // textContent, never the .open class); caught by the 2026-08-31
    // comprehension-hint live-fire. Direction of the filter is fail-safe:
    // any record OUTSIDE the panel's own subtree closes (a MIXED delivery
    // therefore closes — the every() is load-bearing and pinned), and an
    // UNQUALIFIED fire (no records — the unit harness's bare cb()) also
    // closes; only a delivery in which every record targets the panel's
    // own subtree is ignored as self-noise. The hint needs no clause here:
    // its only post-init mutations are attribute writes, which this
    // config (no attributes:true) never observes.
    const observer = new MutationObserver(records => {
      if (!activeCell) return;
      if (Array.isArray(records) && records.length &&
          records.every(r => r && r.target && panel.contains(r.target))) {
        return;
      }
      close();
    });
    observer.observe(cardFace, { subtree: true, childList: true, characterData: true });
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
