// 8ball / ui / kua.js — the kua trigram t3 block (§1.D kua amendment)
//
// DOM controller in the §6 v0.23 shape: pure exports above, an
// initKuaUI({refs}) injection point below, no module-level DOM access at
// import time. No storage, no network, no new localStorage key —
// entitlement is resolved by the caller and handed in, exactly the
// ui/public.js contract.
//
// This module is the ONLY consumer of core/kua.js (pinned in
// tests/kua_surface.test.js, the single-importer twin of the
// tests/public.test.js pin), and it injects everything it owns: its
// style tag, the block node on #card-face, and the optional gender
// control on the host form. index.html carries no kua markup, no kua
// CSS, and no new ids beyond what the module creates for itself — the
// dyad.js injection posture applied at block scale, which is what keeps
// the §6 single-file budget flat.
//
// The read has two modes, both honest:
//   gender on file  → that gender's kua, trigram registry line, and the
//                     5→2/5→8 remap note whenever core disclosed one.
//   no gender       → BOTH classical values, labeled, plus a register
//                     note saying why there are two — never a silent
//                     default to one gender (the sibling-engine defect
//                     class this product refuses to import).

import { getKua, getKuaBoth } from '../core/kua.js';
import { KUA_TRIGRAMS } from '../content/kua.v1.js';
import { registerKuaRoot } from './tiers.js';

// ── pure ──────────────────────────────────────────────────────────

const trigramLine = (number, t) =>
  `kua ${number} · ${t.trigram} ${t.glyph} · ${t.direction} · ${t.group} group`;

const remapNote = number =>
  `a raw 5 has no trigram — the tradition files it to ${KUA_TRIGRAMS[number].trigram} (${number}).`;

/**
 * The rendered strings of the block, derived purely from core results.
 * Single-gender: primary = the registry line, secondary = the §1.G
 * citation body verbatim, note = the remap disclosure or ''.
 */
export function formatKuaRead(kua, gender) {
  const t = KUA_TRIGRAMS[kua.number];
  return {
    primary: `${gender} · ${trigramLine(kua.number, t)}`,
    secondary: t.body,
    note: kua.remapped ? remapNote(kua.number) : '',
  };
}

/**
 * Both-genders read for a profile with no gender on file. One value per
 * line, labeled; the note names the method's gender dependence rather
 * than hiding it. At most one of the two values can be a remap for any
 * year, so the disclosures compose without colliding.
 */
export function formatKuaBoth(both) {
  const tm = KUA_TRIGRAMS[both.male.number];
  const tf = KUA_TRIGRAMS[both.female.number];
  let note = 'no gender on file — the eight mansions method assigns by gender; both classical values shown.';
  if (both.male.remapped) note += ` ${remapNote(both.male.number)}`;
  if (both.female.remapped) note += ` ${remapNote(both.female.number)}`;
  return {
    primary: `male · ${trigramLine(both.male.number, tm)}`,
    secondary: `female · ${trigramLine(both.female.number, tf)}`,
    note,
  };
}

/**
 * Full block content for a profile, or null when the profile cannot
 * resolve. Total: a malformed profile or an out-of-calendar-range year
 * seals the block rather than throwing into the render path (the
 * publicReadFor shape).
 */
export function kuaReadFor(profile) {
  if (!profile) return null;
  const { yyyy, mm, dd, gender } = profile;
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) {
    return null;
  }
  try {
    if (gender === 'male' || gender === 'female') {
      return formatKuaRead(getKua(yyyy, mm, dd, gender), gender);
    }
    return formatKuaBoth(getKuaBoth(yyyy, mm, dd));
  } catch (_) {
    return null;
  }
}

// ── DI injection (refs at boot) ───────────────────────────────────

let _root = null;
let _nodes = null;
let _genderSelect = null;

// Scoped CSS for the injected block, in the ui/public.js BRIDGE_STYLE
// shape. Everything the host <style> gives .public-read is restated here
// for .kua-read because the host is deliberately untouched; the global
// pieces (.sealed .coord-seal display, the seal-hatch background, the
// sealOut/valIn keyframes) cascade in from index.html already.
// `:empty` rather than `hidden` for the note, per the F1 bug class
// ui/public.js documents.
const KUA_STYLE = `
.kua-read { position: relative; min-height: 52px; }
.kua-title { font-size: 10px; letter-spacing: .14em; opacity: .55; margin-bottom: 4px; visibility: hidden; }
.card.labels-revealed .kua-title { visibility: visible; }
.kua-read .coord-seal { inset: 16px 10% 4px; }
.kua-note:empty { display: none; }
.kua-read.unsealing .card-habit,
.kua-read.unsealing .card-note { animation: valIn 340ms ease both; animation-delay: var(--unseal-delay, 0ms); }
@media (prefers-reduced-motion: reduce) {
  .kua-read.unsealing .card-habit,
  .kua-read.unsealing .card-note { animation: none; }
}
`;

function injectKuaStyle() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  if (document.getElementById('kua-style')) return;
  if (!document.createElement || !document.head || !document.head.appendChild) return;
  const style = document.createElement('style');
  style.id = 'kua-style';
  style.textContent = KUA_STYLE;
  document.head.appendChild(style);
}

/**
 * Create (or find) the block node on the card face. index.html carries no
 * kua markup — the module appends its own block after the host's static
 * ones, id-guarded by class lookup so a re-init reuses the same node.
 */
function resolveKuaRoot(refs) {
  const face = refs && refs.cardFace;
  if (!face || typeof face.appendChild !== 'function') return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const existing = face.querySelector && face.querySelector('.kua-read');
  if (existing) return existing;
  const node = document.createElement('div');
  node.className = 'kua-read';
  node.innerHTML = '<div class="card-prose-rule"></div>' +
    '<div class="kua-title">KUA</div>' +
    '<div class="card-habit kua-primary"></div>' +
    '<div class="card-note kua-secondary"></div>' +
    '<div class="card-note kua-note"></div>' +
    '<span class="coord-seal" aria-hidden="true"></span>';
  face.appendChild(node);
  return node;
}

/**
 * Create (or find) the optional gender control on the host form, before
 * `refs.anchor` (the rising fields) so it reads as part of the birth
 * entry. Strict two-token vocabulary end-to-end: the empty option IS the
 * no-gender state, and it is the default.
 */
function resolveGenderSelect(refs) {
  if (refs && refs.genderSelect) return refs.genderSelect;
  const form = refs && refs.form;
  if (!form || typeof form.appendChild !== 'function') return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const existing = form.querySelector && form.querySelector('#gender-input');
  if (existing) return existing;
  const field = document.createElement('div');
  field.className = 'field kua-gender-field';
  field.innerHTML = '<label for="gender-input">gender (optional · kua line only)</label>' +
    '<select id="gender-input">' +
    '<option value="">—</option>' +
    '<option value="male">male</option>' +
    '<option value="female">female</option>' +
    '</select>';
  const anchor = refs && refs.anchor;
  if (anchor && typeof form.insertBefore === 'function' && anchor.parentNode === form) {
    form.insertBefore(field, anchor);
  } else {
    form.appendChild(field);
  }
  return field.querySelector ? field.querySelector('#gender-input') : null;
}

export function initKuaUI(refs) {
  injectKuaStyle();
  // Test surface may hand every node directly (the public_surface makeRefs
  // shape); production hands { cardFace, form, anchor } and the module
  // builds its own nodes.
  if (refs && refs.root && refs.primary) {
    _root = refs.root;
    _nodes = { primary: refs.primary, secondary: refs.secondary, note: refs.note };
  } else {
    _root = resolveKuaRoot(refs);
    const qq = c => (_root && _root.querySelector ? _root.querySelector(c) : null);
    _nodes = _root ? { primary: qq('.kua-primary'), secondary: qq('.kua-secondary'), note: qq('.kua-note') } : null;
  }
  _genderSelect = resolveGenderSelect(refs);
  // Hand the block root to ui/tiers.js so the unseal beat can reach it —
  // the dead-beat defect public_surface pinned for the public block.
  registerKuaRoot(_root);
}

/** The form control's current value under the strict vocabulary. */
export function getGenderInput() {
  const v = _genderSelect && _genderSelect.value;
  return v === 'male' || v === 'female' ? v : undefined;
}

/** Rehydrate/clear the control (ui/profile.js populate/reset hooks). */
export function setGenderInput(v) {
  if (!_genderSelect) return;
  _genderSelect.value = v === 'male' || v === 'female' ? v : '';
}

/**
 * Render the block for `profile`. Sealed-DOM purity (§1.D v0.37): below
 * t3 every value node is emptied — absent, not hidden — and no entitled
 * string is ever present in an unentitled render. Entitlement is handed
 * in by the caller, never read from storage here.
 */
export function renderKuaRead(profile, { entitled } = {}) {
  if (!_root) return null;
  const read = entitled ? kuaReadFor(profile) : null;
  _root.classList.toggle('sealed', !read);
  if (_root.setAttribute) {
    _root.setAttribute('aria-label', read ? 'kua trigram' : 'kua trigram · sealed at this device tier');
  }
  if (_nodes) {
    if (_nodes.primary) _nodes.primary.textContent = read ? read.primary : '';
    if (_nodes.secondary) _nodes.secondary.textContent = read ? read.secondary : '';
    if (_nodes.note) _nodes.note.textContent = read ? read.note : '';
  }
  return read;
}
