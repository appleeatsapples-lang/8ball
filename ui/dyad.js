// 8ball / ui / dyad.js — the dyad surface (DOCTRINE §1.J, tier t5)
//
// DOM controller in the §6 v0.23 shape: pure exports above, an
// initDyadUI({refs}, {hooks}) injection point below, no module-level DOM
// access at import time. Injects its own screen markup + scoped CSS at init
// rather than touching index.html's static markup/style block, so the §6
// 1500-line single-file budget takes a 2-line footprint there: one import,
// one init call. Same technique ui/meanings.js uses.
//
// STORAGE: NONE. This module names no localStorage key, reads none and
// writes none. The second person's data lives in a module-local variable for
// the lifetime of the screen and is gone on reload — the §5.F transient shape
// Concordance already establishes, and the reason the §5 key allow-list is
// unchanged by this tier. Person A is the profile the host already holds; the
// dyad neither persists it nor re-persists it.
//
// ENTITLEMENT is resolved by the caller and handed in, exactly as
// ui/public.js does it. This module never asks storage what the device owns.
//
// WHAT RENDERS. Both sides' coordinates at the device's entitled density,
// through the SAME pure mapping the specimen sheet renders by
// (ui/tiers.js cellRenderState) — so the A column of a dyad and a standalone
// single reading cannot disagree about a coordinate. Then the relation layer,
// sealed below t5 under the §1.D v0.37 contract: the value nodes are emptied,
// absent rather than hidden, so no entitled string exists in the DOM of an
// unentitled render.
//
// WHAT DOES NOT RENDER, named rather than left to be found:
//   1. The written 144-card entry for either side. That is the t3 ceiling
//      block and it renders on the single sheet; the dyad adds a relation,
//      it does not reprint the deck twice.
//   2. Birthplace for the second person. The minimal second-person form takes
//      name, date of birth and optional birth time — enough for every
//      coordinate the relation layer reads (all four are date-derived) and
//      for the hour pillar, but NOT for a rising sign, which needs a city.
//      B's rising therefore renders the honest `—` unresolved field, the same
//      state a single reading shows without a birthplace. It is a limit of
//      the minimal form, not a new failure mode.

import { buildDyadReading } from '../core/dyad.js';
import {
  CELL_KEYS, CELL_COORD, cellRenderState, coordsForTier,
} from './tiers.js';

// ── the rung is not live, and fails closed until it is ────────────
// The Gumroad product does not exist; creating it is the controller's action,
// never an agent's (§10). While this constant is empty the CTA carries no
// href and stays hidden, so no visitor can reach a dead checkout. Filling it
// in is the whole of what makes the rung buyable — the same fail-closed shape
// §1.D v0.58 used for T4_PRODUCT_URL, and the reason this ship leaves the
// §4.B v0.56 single-$3 sprint surface byte-untouched.
export const T5_PRODUCT_URL = '';

// ── pure ──────────────────────────────────────────────────────────

// Row labels for the compact two-column specimen listing. Keyed by the same
// CELL_KEYS the sheet uses, so a coordinate cannot appear here under a name
// the sheet does not know.
export const DYAD_ROW_LABELS = Object.freeze({
  arcana: 'arcana',
  element: 'five-element',
  sun: 'sun',
  rising: 'rising',
  animal: 'public animal',
  innerAnimal: 'private animal',
  lifePath: 'life path',
  nameNumber: 'expression',
  soulUrge: 'soul urge',
  personality: 'personality',
  birthday: 'birthday',
  maturity: 'maturity',
  dayPillar: 'day pillar',
  hourPillar: 'hour pillar',
});

/**
 * The two-column coordinate listing for a dyad, at `tier`.
 *
 * One row per sheet cell, in the sheet's own DOM order, each carrying both
 * sides' render state. Sealed rows carry `''` on BOTH sides — the seal is a
 * property of the device's tier, so it can never be open for one person and
 * shut for the other.
 *
 * @returns {Array<{key: string, label: string,
 *                  a: {state: string, text: string},
 *                  b: {state: string, text: string}}>}
 */
export function dyadCoordinateRows(profileA, profileB, tier) {
  const coords = coordsForTier(tier);
  return CELL_KEYS.map(key => {
    const entitled = coords.has(CELL_COORD[key]);
    return {
      key,
      label: DYAD_ROW_LABELS[key],
      a: cellRenderState(profileA, key, entitled),
      b: cellRenderState(profileB, key, entitled),
    };
  });
}

/**
 * The rendered strings of the relation layer, derived purely from a reading.
 * Five passages: the element axis in both directions (A→B and B→A are
 * separate lookups, not one sentence read twice), the combined path, the card
 * pair, and the qualifier that rides all of them.
 */
export function formatDyadRelation(reading) {
  const { element, numerology, cardPair, qualifier } = reading.relation;
  return {
    elementHead: `${element.a.element} → ${element.b.element} · ${element.aToB.label}`,
    elementAB: element.aToB.body,
    elementBA: element.bToA.body,
    numerologyHead: `${numerology.lifePathA} + ${numerology.lifePathB} → ${numerology.combined} · ${numerology.register}`,
    numerology: numerology.body,
    cardPairHead: `no. ${cardPair.catalogA} × no. ${cardPair.catalogB}`,
    cardPair: cardPair.body,
    qualifier,
  };
}

/**
 * Full relation content for two profiles, or null when the pair cannot
 * resolve. Total: a malformed profile seals the block rather than throwing
 * into the render path — the same guard shape ui/public.js uses.
 */
export function dyadRelationFor(profileA, profileB) {
  if (!profileA || !profileB) return null;
  try {
    return formatDyadRelation(buildDyadReading(profileA, profileB));
  } catch (_) {
    return null;
  }
}

// ── injected markup + scoped CSS ──────────────────────────────────

const STYLE = `
#dyad-screen .dyad-intro { margin: 0 0 1rem; }
#dyad-screen .dyad-field { margin-bottom: 0.75rem; }
#dyad-screen .dyad-grid { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; }
#dyad-screen .dyad-grid th, #dyad-screen .dyad-grid td {
  text-align: left; padding: 0.3rem 0.4rem; font-size: 0.82rem;
  border-bottom: 1px solid rgba(255,255,255,0.14); }
#dyad-screen .dyad-grid th { text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; font-weight: 400; }
#dyad-screen .dyad-grid tr.sealed td.dyad-val { position: relative; }
#dyad-screen .dyad-grid tr.sealed td.dyad-val::after {
  content: ''; position: absolute; inset: 0.3rem 0.4rem;
  background: repeating-linear-gradient(45deg,
    rgba(255,255,255,0.20) 0 2px, transparent 2px 5px); }
#dyad-screen .dyad-relation { margin-top: 1rem; position: relative; }
#dyad-screen .dyad-axis { margin-bottom: 0.9rem; }
#dyad-screen .dyad-axis-head {
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.72rem; opacity: 0.7; }
#dyad-screen .dyad-axis-body { font-size: 0.86rem; line-height: 1.45; }
#dyad-screen .dyad-qualifier { font-size: 0.72rem; opacity: 0.6; margin-top: 0.6rem; }
#dyad-screen .dyad-relation.sealed { min-height: 8rem; }
#dyad-screen .dyad-relation.sealed::after {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(45deg,
    rgba(255,255,255,0.16) 0 3px, transparent 3px 7px); }
#dyad-screen .dyad-error { font-size: 0.8rem; opacity: 0.75; }
`;

const ROW_HTML = CELL_KEYS.map(key =>
  `<tr data-dyad-row="${key}">` +
  `<th scope="row">${DYAD_ROW_LABELS[key]}</th>` +
  `<td class="dyad-val" data-dyad-a="${key}"></td>` +
  `<td class="dyad-val" data-dyad-b="${key}"></td>` +
  '</tr>').join('');

const SCREEN_HTML =
  '<div class="registry-header">specimen registry · paired entry</div>' +
  '<p class="hint dyad-intro" id="dyad-intro">the current sheet, read beside a second one. the second entry is not saved.</p>' +
  '<form id="dyad-form" autocomplete="off">' +
  '<div class="field dyad-field"><label for="dyad-name-input">second name</label>' +
  '<input id="dyad-name-input" type="text" required maxlength="60"></div>' +
  '<div class="field dyad-field"><label for="dyad-dob-input">second date of birth</label>' +
  '<input id="dyad-dob-input" type="date" required>' +
  '<p class="field-error" id="dyad-dob-error" hidden>enter a valid past date.</p></div>' +
  '<div class="field dyad-field"><label for="dyad-time-input">second birth time (optional)</label>' +
  '<input id="dyad-time-input" type="time"></div>' +
  '<button type="submit" class="btn btn-block" id="dyad-submit">read the pair</button>' +
  '</form>' +
  '<div id="dyad-output" hidden>' +
  '<table class="dyad-grid"><thead><tr><th>coordinate</th>' +
  '<th id="dyad-head-a">a</th><th id="dyad-head-b">b</th></tr></thead>' +
  `<tbody id="dyad-rows">${ROW_HTML}</tbody></table>` +
  '<div class="dyad-relation" id="dyad-relation">' +
  '<div class="dyad-axis"><div class="dyad-axis-head" id="dyad-element-head"></div>' +
  '<div class="dyad-axis-body" id="dyad-element-ab"></div>' +
  '<div class="dyad-axis-body" id="dyad-element-ba"></div></div>' +
  '<div class="dyad-axis"><div class="dyad-axis-head" id="dyad-numerology-head"></div>' +
  '<div class="dyad-axis-body" id="dyad-numerology-body"></div></div>' +
  '<div class="dyad-axis"><div class="dyad-axis-head" id="dyad-cardpair-head"></div>' +
  '<div class="dyad-axis-body" id="dyad-cardpair-body"></div></div>' +
  '<div class="dyad-qualifier" id="dyad-qualifier"></div>' +
  '</div>' +
  '<a class="btn btn-block" id="dyad-cta" hidden></a>' +
  '<p class="dyad-error" id="dyad-error" role="status" hidden></p>' +
  '</div>' +
  '<button class="btn btn-block btn-secondary" id="dyad-back">back to the sheet</button>';

// ── DI injection (refs + hooks at boot) ───────────────────────────

let _hooks = null;
let _root = null;
// The second person, for the life of this screen only. Never serialized,
// never written to storage, dropped by reset() and by a reload.
let _second = null;

function $(id) {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

function injectStyle() {
  if (!document.head || document.getElementById('dyad-style')) return;
  const style = document.createElement('style');
  style.id = 'dyad-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function injectScreen(stage) {
  let root = document.getElementById('dyad-screen');
  if (root) return root;
  root = document.createElement('section');
  root.className = 'screen hidden';
  root.id = 'dyad-screen';
  root.setAttribute('tabindex', '-1');
  root.innerHTML = SCREEN_HTML;
  stage.appendChild(root);
  return root;
}

/**
 * @param {{stage: Element, controls: Element}} refs
 *        - stage     the <main class="stage"> the screen mounts into
 *        - controls  the result rail the entry button is appended to
 * @param {{getProfile: function, getTier: function, buildSecond: function,
 *          onOpen: function, onExit: function}} hooks
 *        - getProfile()  the host's current profile (person A)
 *        - getTier()     the device's entitled tier, from the host's single
 *                        getRenderTier helper — this module never reads storage
 *        - buildSecond({name, dob, time}) the host's own profileFromPayload →
 *                        buildProfile path, so person B is calculated by the
 *                        SAME engine as person A and no second build path
 *                        exists to drift (DOCTRINE §1.I revisit contract)
 *        - onOpen()/onExit()  host callbacks that hide and restore the sheet
 */
export function initDyadUI(refs, hooks) {
  _hooks = hooks || {};
  if (!refs || !refs.stage || typeof document === 'undefined') return null;
  injectStyle();
  _root = injectScreen(refs.stage);
  injectEntryButton(refs.controls);

  const form = $('dyad-form');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      submitSecond();
    });
  }
  const back = $('dyad-back');
  if (back) {
    back.addEventListener('click', () => {
      close();
      if (typeof _hooks.onExit === 'function') _hooks.onExit();
    });
  }
  return _root;
}

// The entry control. Injected into the result rail rather than written into
// index.html, which keeps the host's footprint for this whole tier at four
// lines (§6 single-file budget). It carries no price and no urgency — §2
// clinical register, and the §4.B v0.56 sprint's single $3 offer is the only
// purchase surface on the page while the rung is unbuyable.
function injectEntryButton(controls) {
  if (!controls || document.getElementById('dyad-open-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-block btn-secondary';
  btn.id = 'dyad-open-btn';
  btn.textContent = 'read beside another sheet';
  btn.addEventListener('click', () => {
    if (typeof _hooks.onOpen === 'function') _hooks.onOpen();
    open();
  });
  controls.appendChild(btn);
}

/** Open the dyad screen. Clears any previous second person — a paired read is
 *  never resumed from a stale entry, and nothing about it survives the close. */
export function open() {
  reset();
  if (_root && _root.classList) _root.classList.remove('hidden');
  if (_root && _root.focus) _root.focus({ preventScroll: true });
}

export function close() {
  if (_root && _root.classList) _root.classList.add('hidden');
  reset();
}

/** Drop the second person and blank every value node the pair filled. */
export function reset() {
  _second = null;
  const output = $('dyad-output');
  if (output) output.hidden = true;
  const err = $('dyad-error');
  if (err) { err.hidden = true; err.textContent = ''; }
  for (const id of ['dyad-name-input', 'dyad-dob-input', 'dyad-time-input']) {
    const el = $(id);
    if (el) el.value = '';
  }
  clearRelationNodes();
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function clearRelationNodes() {
  for (const id of ['dyad-element-head', 'dyad-element-ab', 'dyad-element-ba',
    'dyad-numerology-head', 'dyad-numerology-body',
    'dyad-cardpair-head', 'dyad-cardpair-body', 'dyad-qualifier']) {
    const el = $(id);
    if (el) el.textContent = '';
  }
}

function submitSecond() {
  const name = ($('dyad-name-input') || {}).value || '';
  const dob = ($('dyad-dob-input') || {}).value || '';
  const time = ($('dyad-time-input') || {}).value || '';
  const dobError = $('dyad-dob-error');
  const build = _hooks.buildSecond;
  if (typeof build !== 'function') return;
  let profile = null;
  try {
    profile = build({ name, dob, time });
  } catch (_) {
    profile = null;
  }
  if (!profile) {
    if (dobError) dobError.hidden = false;
    return;
  }
  if (dobError) dobError.hidden = true;
  _second = profile;
  render();
}

/**
 * Fill both columns and the relation layer for the current pair.
 *
 * Sealed-DOM purity (§1.D v0.37): below t5 the relation value nodes are
 * emptied — absent, not hidden — so no entitled passage is ever present in
 * the DOM of an unentitled render. The coordinate rows seal the same way,
 * per the device's tier, identically on both sides.
 */
export function render() {
  const profileA = typeof _hooks.getProfile === 'function' ? _hooks.getProfile() : null;
  const tier = typeof _hooks.getTier === 'function' ? _hooks.getTier() : 'free';
  const output = $('dyad-output');
  const errEl = $('dyad-error');
  if (!profileA || !_second) {
    if (output) output.hidden = true;
    return null;
  }

  const rows = dyadCoordinateRows(profileA, _second, tier);
  for (const row of rows) {
    const tr = _root && _root.querySelector
      ? _root.querySelector(`[data-dyad-row="${row.key}"]`) : null;
    if (tr && tr.classList) tr.classList.toggle('sealed', row.a.state === 'sealed');
    const aCell = _root && _root.querySelector
      ? _root.querySelector(`[data-dyad-a="${row.key}"]`) : null;
    const bCell = _root && _root.querySelector
      ? _root.querySelector(`[data-dyad-b="${row.key}"]`) : null;
    if (aCell) aCell.textContent = row.a.state === 'unres' ? '—' : row.a.text;
    if (bCell) bCell.textContent = row.b.state === 'unres' ? '—' : row.b.text;
  }

  const headA = $('dyad-head-a');
  const headB = $('dyad-head-b');
  if (headA) headA.textContent = profileA.firstName || 'a';
  if (headB) headB.textContent = _second.firstName || 'b';

  const entitled = coordsForTier(tier).has('dyadRelation');
  const relation = entitled ? dyadRelationFor(profileA, _second) : null;
  const block = $('dyad-relation');
  if (block && block.classList) block.classList.toggle('sealed', !relation);
  if (block && block.setAttribute) {
    block.setAttribute('aria-label',
      relation ? 'relation layer' : 'relation layer · sealed at this device tier');
  }
  if (relation) {
    setText('dyad-element-head', relation.elementHead);
    setText('dyad-element-ab', relation.elementAB);
    setText('dyad-element-ba', relation.elementBA);
    setText('dyad-numerology-head', relation.numerologyHead);
    setText('dyad-numerology-body', relation.numerology);
    setText('dyad-cardpair-head', relation.cardPairHead);
    setText('dyad-cardpair-body', relation.cardPair);
    setText('dyad-qualifier', relation.qualifier);
  } else {
    clearRelationNodes();
  }

  // Fail-closed offer: while T5_PRODUCT_URL is empty the CTA has no href and
  // stays hidden, so an unentitled visitor is shown the sealed block and no
  // way to pay for it. This is deliberate — the rung ships unbuyable.
  const cta = $('dyad-cta');
  if (cta) {
    const offerable = !entitled && T5_PRODUCT_URL !== '';
    cta.hidden = !offerable;
    if (offerable) {
      cta.setAttribute('href', T5_PRODUCT_URL);
      cta.textContent = 'open the paired read';
    } else {
      cta.removeAttribute('href');
      cta.textContent = '';
    }
  }

  if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
  if (output) output.hidden = false;
  return { rows, relation, entitled };
}
