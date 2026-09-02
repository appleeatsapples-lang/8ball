// 8ball / ui / dyad.js — the dyad surface (DOCTRINE §1.J, tier t5)
//
// DOM controller in the §6 v0.23 shape: pure exports above, an
// initDyadUI({refs}, {hooks}) injection point below, no module-level DOM
// access at import time. Injects its own screen markup + scoped CSS at init
// rather than touching index.html's static markup/style block, so the §6
// 1500-line single-file budget takes a four-line footprint there.
//
// This file was rewritten after a Codex pre-merge audit (PR #187) returned DO
// NOT MERGE. Four of its eight findings landed here; each is named at the code
// that answers it.
//
// ── F2 · WHAT t5 BUYS, AND WHEN THE SCREEN EXISTS AT ALL ──────────
// The first version injected the entry control on every rendered result and
// gated only the relation passages, so a free device could open the form,
// submit a second person, and receive their sheet at free density; a t3 device
// received person B's COMPLETE sheet for nothing. DOCTRINE §1.D v0.61 says t5
// buys a second complete sheet PLUS the relation layer. The code now says the
// same thing: `dyadEntitled(tier)` is a single predicate, and below t5 the
// entry control is absent, `open()` refuses, `submitSecond()` refuses, and
// `render()` produces nothing. There is no partial dyad.
//
// ── F5 · BOTH SIDES ARE REAL STANDALONE SHEETS ────────────────────
// Not a two-column table. Each side is a full specimen sheet built by
// ui/sheet.js — every coordinate, the written 144-card entry, and the public
// read — resolved through the SAME `cellRenderState` mapping the host sheet
// renders by, so the A sheet here and the A sheet on the result screen cannot
// disagree. The relation block follows the two sheets.
//
// ── F1 · NOTHING OF PERSON B SURVIVES CLOSING ─────────────────────
// `reset()` used to clear a hand-maintained subset of what `render()` wrote,
// so B's first name and fourteen coordinate values stayed in hidden DOM after
// the back control. Every clearable node is now enumerated ONCE (the sheets
// clear themselves from their own fill list; the relation nodes come from
// DYAD_RELATION_NODES, which `render()` also writes through). A clear list
// that cannot fall behind its fill list is the actual fix — the previous one
// was correct when written and wrong one edit later.
//
// ── STORAGE / NETWORK: NONE ───────────────────────────────────────
// No localStorage key is named, read or written. Person B lives in one
// module-local binding for the life of the screen and is dropped on close, on
// an invalid re-submission, and on reload — the §5.F transient shape. Notably
// the written-entry rotation key is never touched: both sheets take their note
// slot from the host, so rendering a second person cannot advance or reset the
// host's flip position.
//
// ENTITLEMENT and the public read are resolved by the host and handed in, the
// same one-way wiring ui/public.js uses. This module never asks storage.

import { buildDyadReading } from '../core/dyad.js';
import { coordsForTier } from './tiers.js';
import { buildSheetMarkup, createSheet } from './sheet.js';
import { initCitySearchUI } from './citysearch.js';
import { todayIsoLocal } from './profile.js';

// The rung's checkout is RETIRED (free amendment, 2026-09-02): the product
// is completely free and the dyad opens for every device through the same
// entitlement predicate as before — which now always answers yes, because
// the render tier is the ceiling. The staged comparative listing was
// never published; no checkout URL ships.

// ── pure ──────────────────────────────────────────────────────────

/**
 * Does this device own the dyad? ONE predicate, consulted by every gate, so
 * the entry control, the submit path and the render cannot disagree about
 * what t5 sells (PR #187 F2 — they did).
 */
export function dyadEntitled(tier) {
  return coordsForTier(tier).has('dyadRelation');
}

/**
 * Should the entry control exist on the result rail? One predicate,
 * entitlement-only (PR #187 R6) — under the free ceiling it is always
 * true, but the gate stays so the rule keeps a single seam.
 */
export function dyadEntryVisible(tier) {
  return dyadEntitled(tier);
}

// The relation layer's value nodes, mapped to the formatDyadRelation field
// each carries. ONE enumeration: render() fills through it and clearOutput()
// blanks through it, so a node added to the block is cleared without a second
// edit. This is the anti-drift shape F1 was missing.
//
// The `dyad-spine-*` entries are the terse symbolic heads shown on the
// always-visible spine/summary row; the fuller `*-head` strings (label,
// register) now live inside the collapsed per-axis detail alongside the
// prose they used to sit above. cardPairHead is reused verbatim for its own
// spine node — `no. A × no. B` was already exactly the terse form.
export const DYAD_RELATION_NODES = Object.freeze({
  'dyad-spine-element': 'elementSpine',
  'dyad-element-head': 'elementHead',
  'dyad-element-ab': 'elementAB',
  'dyad-element-ba': 'elementBA',
  'dyad-spine-numerology': 'numerologySpine',
  'dyad-numerology-head': 'numerologyHead',
  'dyad-numerology-reduction': 'numerologyReduction',
  'dyad-numerology-meaning': 'numerologyMeaning',
  'dyad-cardpair-head': 'cardPairHead',
  'dyad-cardpair-body': 'cardPair',
  'dyad-qualifier': 'qualifier',
});

// The three collapsible <details> wrappers, by id. ONE list, addressed by
// $(id) the same way DYAD_RELATION_NODES is — clearOutput() closes each of
// these on every reset, so an axis a reader expanded on the FIRST pair
// cannot stay expanded (stale, and pointing at blanked content) on the next.
export const DYAD_AXIS_IDS = Object.freeze([
  'dyad-axis-element', 'dyad-axis-numerology', 'dyad-axis-cardpair',
]);

/**
 * The rendered strings of the relation layer, derived purely from a reading.
 */
export function formatDyadRelation(reading) {
  const { element, numerology, cardPair, qualifier } = reading.relation;
  return {
    // Terse symbolic heads for the spine/summary row — no label, no
    // register, just the two-sided shape a reader can take in at a glance.
    elementSpine: `${element.a.element} ⇄ ${element.b.element}`,
    numerologySpine: `${numerology.lifePathA} + ${numerology.lifePathB} → ${numerology.combined}`,
    elementHead: `${element.a.element} → ${element.b.element} · ${element.aToB.label}`,
    elementAB: element.aToB.body,
    elementBA: element.bToA.body,
    numerologyHead: `${numerology.lifePathA} + ${numerology.lifePathB} → ${numerology.combined} · ${numerology.register}`,
    // Two separate strings on purpose (§1.J content-source rule, PR #187 F6):
    // the reduction is authored for this tier and carries no meaning; the
    // meaning is the numerology registry's OWN body, rendered unmodified and
    // labelled as the citation it is. They must never be merged into one
    // sentence — that is how the re-authored copy got written the first time.
    numerologyReduction: numerology.reduction,
    numerologyMeaning: numerology.meaning,
    cardPairHead: `no. ${cardPair.catalogA} × no. ${cardPair.catalogB}`,
    cardPair: cardPair.body,
    qualifier,
  };
}

/**
 * Full relation content for two profiles, or null when the pair cannot
 * resolve. Total: a malformed profile seals the block rather than throwing
 * into the render path — the same guard shape ui/public.js uses, and the
 * landing place for core/dyad.js's fail-closed coordinate guards.
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
/* The rail is a two-column grid (ui/experience.css .result-controls); the
   injected pair spans it like the host's own full-width controls, so the
   entry control never renders as a half-width cell wrapped to two
   lines (pr216 audit LOW 9). */
.result-controls #dyad-open-btn { grid-column: 1 / -1; }
#dyad-screen .dyad-intro { margin: 0 0 1rem; }
#dyad-screen .dyad-field { margin-bottom: 0.75rem; }
#dyad-screen #dyad-output { scroll-margin-top: calc(var(--topbar-height, 56px) + 12px); }
/* Dedicated wider paired-sheet layout (desktop only — mobile keeps the
   general 380px screen budget, see the pan rule below). Two 360px .card
   sheets plus the gap need ~760px, the same budget #result already spends
   on its own desktop side rail. */
@media (min-width: 720px) { #dyad-screen { max-width: 760px; } }
/* Adjacency, not stacking (the audit's point 5): the pair stays side by side
   at every width. Narrow screens get a horizontally pannable strip instead
   of shrinking the cards or falling back to a single column; ≥720px has
   room for both without scrolling. */
#dyad-screen .dyad-sheets {
  display: flex; gap: 1.25rem; margin: 1rem 0;
  overflow-x: auto; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}
#dyad-screen .dyad-sheets > div { flex: 0 0 auto; width: min(84vw, 320px); scroll-snap-align: center; }
/* The 2026-08-31 layout audit: the two standalone sheets inherit .card's
   5/8 aspect-ratio box while their content runs ~300-400px past it. On
   engines that grow ratio boxes to fit content this is invisible; the
   embedded-WebView family the field defect came from is not trusted to
   (the flip-stage provably did not on-device), so the box is released
   explicitly — the same make-the-layout-explicit posture as ui/labels.js's
   stage rule. Chromium-measured no-op. Scoped to the dyad's own sheets by
   the data attribute; the host card face is the flip-stage rule's job.
   No height declaration: nothing sets a height on these sheets, so unlike
   the stage's card (whose shell height:100% must be overridden) there is
   nothing to release — the delta audit proved an added height:auto dead. */
#dyad-screen [data-sheet-face] { aspect-ratio: auto; }
@media (min-width: 720px) {
  #dyad-screen .dyad-sheets { overflow-x: visible; }
  #dyad-screen .dyad-sheets > div { width: auto; flex: 1 1 0; }
}
#dyad-screen .dyad-sheet-label {
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.72rem;
  opacity: 0.7; margin-bottom: 0.35rem; }
/* The relation spine — a decorative connector between the two sheets, drawn
   once per render. Resting state (no JS, or the class below never lands) is
   fully drawn and static, so the diagram never depends on the animation to
   be legible. */
#dyad-screen .dyad-spine-wrap { margin: 0.25rem 0 0.75rem; }
#dyad-screen .dyad-spine { display: block; width: 100%; height: 44px; overflow: visible; }
#dyad-screen .dyad-spine-line {
  stroke: var(--rule); stroke-width: 1; fill: none;
  stroke-dasharray: 1; stroke-dashoffset: 0;
}
#dyad-screen .dyad-spine-dot { fill: var(--rule); }
#dyad-screen .dyad-spine.dyad-spine-revealing .dyad-spine-line {
  animation: dyadSpineDraw 320ms ease both;
}
@keyframes dyadSpineDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  #dyad-screen .dyad-spine.dyad-spine-revealing .dyad-spine-line { animation: none; }
}
#dyad-screen .dyad-relation { margin-top: 1rem; position: relative; }
#dyad-screen .dyad-axis {
  margin-bottom: 0.6rem; border: none; border-top: 1px solid var(--rule); padding-top: 0.6rem; }
#dyad-screen .dyad-axis > summary {
  cursor: pointer; list-style: none;
  display: flex; align-items: center; justify-content: space-between; min-height: 44px;
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.72rem; opacity: 0.7; }
#dyad-screen .dyad-axis > summary::-webkit-details-marker { display: none; }
#dyad-screen .dyad-axis > summary::after { content: '+'; opacity: 0.6; }
#dyad-screen .dyad-axis[open] > summary::after { content: '−'; }
/* Explicit visible focus ring — a <summary> is natively keyboard-focusable
   (it's the interactive part of <details>), and the general .info-icon
   focus-visible treatment elsewhere in the app doesn't reach into this
   module's own scoped stylesheet. */
#dyad-screen .dyad-axis > summary:focus-visible {
  outline: 2px solid var(--text); outline-offset: 2px; }
#dyad-screen .dyad-axis-detail { margin-top: 0.5rem; }
#dyad-screen .dyad-axis-head {
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.72rem; opacity: 0.7; }
#dyad-screen .dyad-axis-body { font-size: 0.86rem; line-height: 1.45; }
#dyad-screen .dyad-cite-label {
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.64rem;
  opacity: 0.55; margin-top: 0.4rem; }
#dyad-screen .dyad-cite { opacity: 0.85; }
#dyad-screen .dyad-qualifier { font-size: 0.72rem; opacity: 0.6; margin-top: 0.6rem; }
#dyad-screen .dyad-error { font-size: 0.8rem; opacity: 0.75; }
/* The back control is the last child of the injected screen, so without this
   it sits flush against the qualifier line and the button border reads as a
   strike through it (caught in the §8 gate 9 live-fire pass, not by the
   suite). */
#dyad-screen #dyad-back { margin-top: 1.25rem; }
`;

const SCREEN_HTML =
  '<div class="registry-header">specimen registry · paired entry</div>' +
  '<p class="hint dyad-intro" id="dyad-intro">the current sheet, read beside a second one. the second entry is not saved.</p>' +
  '<form id="dyad-form" autocomplete="off">' +
  '<div class="field dyad-field"><label for="dyad-name-input">second name</label>' +
  '<input id="dyad-name-input" type="text" required maxlength="60">' +
  '<p class="field-error" id="dyad-name-error" hidden>enter a name.</p></div>' +
  '<div class="field dyad-field"><label for="dyad-dob-input">second date of birth</label>' +
  '<input id="dyad-dob-input" type="date" required>' +
  '<p class="field-error" id="dyad-dob-error" hidden>enter a valid past date.</p></div>' +
  '<div class="field dyad-field"><label for="dyad-time-input">second birth time (optional)</label>' +
  '<input id="dyad-time-input" type="time"></div>' +
  '<div class="field city-field dyad-field"><label for="dyad-city-input">second birthplace (optional)</label>' +
  '<input id="dyad-city-input" type="text" placeholder="type a city" autocomplete="off" spellcheck="false">' +
  '<ul class="city-suggestions" id="dyad-city-suggestions" role="listbox" aria-label="city suggestions"></ul>' +
  '<p class="polar-message" id="dyad-polar-message" hidden>rising unavailable at this latitude.</p></div>' +
  '<button type="submit" class="btn btn-block" id="dyad-submit">read the pair</button>' +
  '</form>' +
  '<div id="dyad-output" role="region" aria-label="paired reading" tabindex="-1" hidden>' +
  '<div class="dyad-sheets" id="dyad-sheets">' +
  `<div><div class="dyad-sheet-label" id="dyad-head-a"></div>${buildSheetMarkup('a')}</div>` +
  `<div><div class="dyad-sheet-label" id="dyad-head-b"></div>${buildSheetMarkup('b')}</div>` +
  '</div>' +
  '<div class="dyad-spine-wrap">' +
  '<svg class="dyad-spine" id="dyad-spine" viewBox="0 0 100 54" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
  '<line class="dyad-spine-line" x1="4" y1="9" x2="96" y2="9" pathLength="1"></line>' +
  '<circle class="dyad-spine-dot" cx="4" cy="9" r="2"></circle>' +
  '<circle class="dyad-spine-dot" cx="96" cy="9" r="2"></circle>' +
  '<line class="dyad-spine-line" x1="4" y1="27" x2="96" y2="27" pathLength="1"></line>' +
  '<circle class="dyad-spine-dot" cx="4" cy="27" r="2"></circle>' +
  '<circle class="dyad-spine-dot" cx="96" cy="27" r="2"></circle>' +
  '<line class="dyad-spine-line" x1="4" y1="45" x2="96" y2="45" pathLength="1"></line>' +
  '<circle class="dyad-spine-dot" cx="4" cy="45" r="2"></circle>' +
  '<circle class="dyad-spine-dot" cx="96" cy="45" r="2"></circle>' +
  '</svg>' +
  '</div>' +
  '<div class="dyad-relation" id="dyad-relation">' +
  '<details class="dyad-axis" id="dyad-axis-element"><summary id="dyad-spine-element"></summary>' +
  '<div class="dyad-axis-detail">' +
  '<div class="dyad-axis-head" id="dyad-element-head"></div>' +
  '<div class="dyad-axis-body" id="dyad-element-ab"></div>' +
  '<div class="dyad-axis-body" id="dyad-element-ba"></div></div></details>' +
  '<details class="dyad-axis" id="dyad-axis-numerology"><summary id="dyad-spine-numerology"></summary>' +
  '<div class="dyad-axis-detail">' +
  '<div class="dyad-axis-head" id="dyad-numerology-head"></div>' +
  '<div class="dyad-axis-body" id="dyad-numerology-reduction"></div>' +
  '<div class="dyad-cite-label">numerology registry</div>' +
  '<div class="dyad-axis-body dyad-cite" id="dyad-numerology-meaning"></div></div></details>' +
  '<details class="dyad-axis" id="dyad-axis-cardpair"><summary id="dyad-cardpair-head"></summary>' +
  '<div class="dyad-axis-detail">' +
  '<div class="dyad-axis-body" id="dyad-cardpair-body"></div></div></details>' +
  '<div class="dyad-qualifier" id="dyad-qualifier"></div>' +
  '</div>' +
  '<p class="dyad-error" id="dyad-error" role="status" hidden></p>' +
  '</div>' +
  '<button class="btn btn-block btn-secondary" id="dyad-back">back to the sheet</button>';

// ── DI injection (refs + hooks at boot) ───────────────────────────

let _hooks = null;
let _root = null;
let _sheetA = null;
let _sheetB = null;
// The second person, for the life of this screen only. Never serialized,
// never written to storage, dropped by clearOutput() and by a reload.
let _second = null;
// Person B's optional birthplace. Held here, alongside _second, so it is
// dropped by exactly the same clear path — a stale city surviving a close
// would silently give the NEXT person B someone else's timezone.
let _city = null;
let _cityUI = null;

function $(id) {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function currentTier() {
  return typeof _hooks?.getTier === 'function' ? _hooks.getTier() : 'free';
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
  if (stage && stage.appendChild) stage.appendChild(root);
  return root;
}

// The entry control. Injected into the result rail rather than written into
// index.html, which keeps the host's footprint for this whole tier at four
// lines (§6 single-file budget). It carries no price and no urgency — §2
// clinical register — and its VISIBILITY is re-decided on every render by
// syncDyadEntry, so a tier change cannot leave it stranded.
function injectEntryButton(controls) {
  if (!controls || document.getElementById('dyad-open-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-block btn-secondary';
  btn.id = 'dyad-open-btn';
  btn.textContent = 'read beside another sheet';
  btn.hidden = true; // fail closed until a render says otherwise
  btn.addEventListener('click', () => {
    if (!dyadEntitled(currentTier())) return;
    if (typeof _hooks.onOpen === 'function') _hooks.onOpen();
    open();
  });
  controls.appendChild(btn);
}

/**
 * Show or hide the entry control for `tier`. Called from index.html's
 * renderCard on every render, so the control tracks the device's entitlement
 * rather than being decided once at boot.
 */
export function syncDyadEntry(tier) {
  const btn = $('dyad-open-btn');
  if (btn) btn.hidden = !dyadEntryVisible(tier);
  return btn ? !btn.hidden : false;
}

/**
 * @param {{stage: Element, controls: Element}} refs
 * @param {{getProfile, getTier, buildSecond, getNoteSlot, getPublicRead,
 *          onOpen, onExit}} hooks
 *        - getProfile()   the host's current profile (person A)
 *        - getTier()      the device's entitled tier, from the host's single
 *                         getRenderTier helper — never read from storage here
 *        - buildSecond(payload) the host's own profileFromPayload →
 *                         buildProfile path, so person B is calculated by the
 *                         SAME engine as person A
 *        - getNoteSlot(p, role) the written-entry slot for a profile, where
 *                         `role` is `'a'` or `'b'`. Handed in so this module
 *                         never touches the facet-index key itself. The two
 *                         roles are NOT the same lookup: A keeps whatever
 *                         slot is currently on screen (the host's stored
 *                         position), but B is never anchored, rotated or
 *                         persisted (§5.F) — resolving B through the SAME
 *                         stored-position lookup silently applies this
 *                         device's position for A's life path to B's (PR #187
 *                         R2). The host must resolve B exactly as a fresh
 *                         standalone build of B would, independent of
 *                         whatever is stored.
 *        - getPublicRead(p) the t3 public-read block for a profile
 *        - onOpen()/onExit()  host callbacks that hide and restore the sheet
 */
export function initDyadUI(refs, hooks) {
  _hooks = hooks || {};
  if (!refs || !refs.stage || typeof document === 'undefined') return null;
  injectStyle();
  _root = injectScreen(refs.stage);
  // The real gate, mirroring index.html's primary dobInput (ui/profile.js
  // todayIsoLocal — PR #187 R1). HTML5 max= alone is devtools-bypassable;
  // validateEntry (below) is what actually rejects a future date. This is
  // the native affordance a live-fire browser pass checks, which a unit test
  // calling the validator directly cannot.
  const dobEl = $('dyad-dob-input');
  if (dobEl) dobEl.max = todayIsoLocal();
  injectEntryButton(refs.controls);
  _sheetA = createSheet(_root, { prefix: 'a' });
  _sheetB = createSheet(_root, { prefix: 'b' });

  const form = $('dyad-form');
  if (form) {
    form.addEventListener('submit', event => {
      if (event && event.preventDefault) event.preventDefault();
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
  // The second birthplace field. ui/citysearch.js is per-instance as of the
  // §1.J remediation precisely so this can exist without repointing the
  // primary form's listeners (which would have dropped the rising sign from
  // every shipped single reading).
  const cityInput = $('dyad-city-input');
  if (cityInput) {
    _cityUI = initCitySearchUI(
      { cityInput, citySuggestions: $('dyad-city-suggestions'), polarMessage: $('dyad-polar-message') },
      { setSelectedCity: c => { _city = c; } },
    );
  }
  return _root;
}

/** Open the dyad screen. Refuses below t5 — the screen is the product. */
export function open() {
  if (!dyadEntitled(currentTier())) return false;
  clearOutput();
  clearEntryFields();
  if (_root && _root.classList) _root.classList.remove('hidden');
  if (_root && _root.focus) _root.focus({ preventScroll: true });
  return true;
}

export function close() {
  if (_root && _root.classList) _root.classList.add('hidden');
  clearOutput();
  clearEntryFields();
}

/**
 * Blank EVERYTHING the render path can write, and drop person B.
 *
 * This is the F1 fix and it is deliberately total. `hidden` is not deletion:
 * the screen stays in the document, so anything left here is live DOM a
 * reader can inspect. The two sheets clear themselves from their own fill
 * enumeration; the relation nodes come from DYAD_RELATION_NODES, which is the
 * same list render() fills through.
 */
export function clearOutput() {
  _second = null;
  // The pannable mobile strip (STYLE's .dyad-sheets) resets to its leading
  // edge too. Ordered before #dyad-output is hidden below on principle — a
  // scrollLeft write on a boxless (display:none-ancestor) element is a
  // CSSOM View no-op — but in this file's own close() the screen ROOT is
  // already hidden before clearOutput() ever runs, so THIS write is
  // typically already moot by the time it executes there; render()'s
  // post-reveal reset (below) is what a live-fire pass confirmed actually
  // lands for the close → reopen → next-pair path. This one still matters
  // on its own for a path render() never reaches: an invalid re-submission
  // (§ submitSecond) invalidates a STILL-VISIBLE pair mid-session, where
  // #dyad-output has a real layout box at the moment of the write.
  const sheetsWrap = $('dyad-sheets');
  if (sheetsWrap) sheetsWrap.scrollLeft = 0;
  const output = $('dyad-output');
  if (output) output.hidden = true;
  if (_sheetA) _sheetA.clear();
  if (_sheetB) _sheetB.clear();
  setText('dyad-head-a', '');
  setText('dyad-head-b', '');
  for (const id of Object.keys(DYAD_RELATION_NODES)) setText(id, '');
  const block = $('dyad-relation');
  if (block) {
    if (block.classList) block.classList.remove('sealed');
    if (block.removeAttribute) block.removeAttribute('aria-label');
  }
  // Every axis a reader may have expanded on the PREVIOUS pair closes here,
  // so opening again (or landing a new pair mid-session) never shows an
  // axis pre-expanded over content that hasn't rendered yet.
  for (const id of DYAD_AXIS_IDS) {
    const axis = $(id);
    if (axis) axis.open = false;
  }
  // Always cleared here, re-added only by a fresh render — the same
  // remove-then-reapply shape ui/tiers.js uses for its 'unsealing' beat, so
  // the draw-in animation restarts on every new pair rather than firing once
  // and going stale.
  const spine = $('dyad-spine');
  if (spine && spine.classList) spine.classList.remove('dyad-spine-revealing');
  const err = $('dyad-error');
  if (err) { err.hidden = true; err.textContent = ''; }
  hideEntryErrors();
}

/** The typed inputs. Separate from clearOutput so a validation failure can
 *  blank the stale result without discarding what the user is mid-way through
 *  correcting. */
function clearEntryFields() {
  for (const id of ['dyad-name-input', 'dyad-dob-input', 'dyad-time-input']) {
    const el = $(id);
    if (el) el.value = '';
  }
  _city = null;
  if (_cityUI) _cityUI.reset();
}

function hideEntryErrors() {
  for (const id of ['dyad-name-error', 'dyad-dob-error']) {
    const el = $(id);
    if (el) el.hidden = true;
  }
}

function showEntryError(field) {
  hideEntryErrors();
  const el = $(field === 'name' ? 'dyad-name-error' : 'dyad-dob-error');
  if (el) el.hidden = false;
}

/**
 * Validate and build person B, then render.
 *
 * FAIL CLOSED, in this order: the entitlement gate first, then the previous
 * result is invalidated BEFORE the new entry is validated. The first version
 * returned early on a bad build without touching the output, so the screen
 * showed person B-1's name and coordinates under a form describing B-2 — a
 * correctness defect as well as a privacy one, and it kept B-1's whole profile
 * object alive past an explicit attempt to replace them.
 */
export function submitSecond() {
  if (!dyadEntitled(currentTier())) { clearOutput(); return false; }
  // Invalidate first. Whatever happens next, the old pair is gone.
  clearOutput();

  const name = String(($('dyad-name-input') || {}).value || '');
  const dob = String(($('dyad-dob-input') || {}).value || '');
  const time = String(($('dyad-time-input') || {}).value || '');

  const validate = _hooks.validateEntry;
  if (typeof validate === 'function') {
    const verdict = validate({ name, dob });
    if (!verdict.ok) { showEntryError(verdict.field); return false; }
  }
  const build = _hooks.buildSecond;
  if (typeof build !== 'function') return false;
  let profile = null;
  try {
    // The same payload shape the primary form produces (index.html's submit
    // handler: `opts.cc = selectedCity.countryCode`), so person B is
    // calculated by the same buildProfile path with the same optional
    // fields. `cc` reads `_city.countryCode` — city records never carry a
    // `.cc` property (core/cities.js's shape is `{..., countryCode, ...}`) —
    // PR #187 R5. optsFromPayload doesn't consume `cc` for the rising calc,
    // which is why the wrong field name was invisible to rising specifically.
    profile = build({
      name: name.trim(), dob, time,
      ...(_city ? { city: _city.name, cc: _city.countryCode, tz: _city.tz, lat: _city.lat, lng: _city.lng } : {}),
    });
  } catch (_) {
    profile = null;
  }
  if (!profile) { showEntryError('dob'); return false; }
  hideEntryErrors();
  _second = profile;
  return !!render();
}

/**
 * Render both standalone sheets and the relation layer.
 *
 * Below t5 this produces nothing at all — not a sealed preview, nothing. The
 * screen is unreachable there by three independent gates, and this is the
 * last of them.
 */
export function render() {
  const tier = currentTier();
  const output = $('dyad-output');
  if (!dyadEntitled(tier)) { clearOutput(); return null; }

  const profileA = typeof _hooks.getProfile === 'function' ? _hooks.getProfile() : null;
  if (!profileA || !_second) {
    if (output) output.hidden = true;
    return null;
  }

  // `role` matters (PR #187 R2): A keeps whatever slot is currently on
  // screen, but B must resolve exactly as a fresh standalone build of B
  // would — never through A's stored/rotated position. Both roles are
  // handed to the SAME hook so this module still never touches the
  // facet-index key itself; the host decides what each role means.
  const noteSlot = (p, role) => (typeof _hooks.getNoteSlot === 'function' ? _hooks.getNoteSlot(p, role) : 'mid');
  const publicRead = p => (typeof _hooks.getPublicRead === 'function' ? _hooks.getPublicRead(p) : null);
  if (_sheetA) _sheetA.render(profileA, tier, { noteSlot: noteSlot(profileA, 'a'), publicRead: publicRead(profileA) });
  if (_sheetB) _sheetB.render(_second, tier, { noteSlot: noteSlot(_second, 'b'), publicRead: publicRead(_second) });

  setText('dyad-head-a', profileA.firstName || 'a');
  setText('dyad-head-b', _second.firstName || 'b');

  const relation = dyadRelationFor(profileA, _second);
  const block = $('dyad-relation');
  if (block && block.classList) block.classList.toggle('sealed', !relation);
  if (block && block.setAttribute) {
    block.setAttribute('aria-label',
      relation ? 'relation layer' : 'relation layer · unavailable for this pair');
  }
  for (const [id, field] of Object.entries(DYAD_RELATION_NODES)) {
    setText(id, relation ? relation[field] : '');
  }
  const spine = $('dyad-spine');
  if (spine && spine.classList && relation) spine.classList.add('dyad-spine-revealing');

  // The gate is open for every device under the free ceiling; open()
  // still refuses below t5 so the single predicate stays the rule.
  const errEl = $('dyad-error');
  if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
  if (output) {
    output.hidden = false;
    // On short mobile viewports the completed pair begins just below the
    // still-visible form. Move the new result into view and focus its named
    // region so submit never appears to do nothing to sighted or AT users.
    if (typeof output.scrollIntoView === 'function') output.scrollIntoView({ block: 'start' });
    if (typeof output.focus === 'function') output.focus({ preventScroll: true });
  }
  // THE decisive reset for close() → reopen() → next-pair: by this line
  // #dyad-sheets provably has a layout box (output.hidden just went false,
  // and open() left the screen root visible), so the write is guaranteed to
  // land — unlike clearOutput()'s pre-hide attempt, which close() usually
  // makes moot by hiding the screen root first. A live-fire pass against a
  // real browser (not this suite's plain-numeric harness fake) is what
  // caught the gap: content-refill-driven layout shift on this reveal
  // resurrected the OLD panned offset when this line was absent. Idempotent
  // either way — a fresh pair always starts on sheet A.
  const sheetsWrapAfterReveal = $('dyad-sheets');
  if (sheetsWrapAfterReveal) sheetsWrapAfterReveal.scrollLeft = 0;
  return { tier, relation, entitled: true };
}
