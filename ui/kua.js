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
// style tag and the block node on #card-face. index.html carries no kua
// markup, no kua CSS, and no new ids beyond what the module creates for
// itself — the dyad.js injection posture applied at block scale, which
// is what keeps the §6 single-file budget flat.
//
// The read has ONE mode: the product asks no gender question (controller
// decision, journal 2026-08-30), so every profile takes the both-values
// read — BOTH classical values, labeled, each with its §1.G citation body
// under it (F4 resolution, journal 2026-08-30: the controller chose
// render over record), plus a register note saying why there are two
// values. When both variants land on the same number the citation is one
// sentence shown once, never duplicated. Never a silent default to one
// gender (the sibling-engine defect class this product refuses to
// import); the method's gender dependence is disclosed, not consumed.

import { getKuaBoth } from '../core/kua.js';
import { KUA_TRIGRAMS } from '../content/kua.v1.js';
import { registerKuaRoot } from './tiers.js';

// ── pure ──────────────────────────────────────────────────────────

const trigramLine = (number, t) =>
  `kua ${number} · ${t.trigram} ${t.glyph} · ${t.direction} · ${t.group} group`;

const remapNote = number =>
  `a raw 5 has no trigram — the tradition files it to ${KUA_TRIGRAMS[number].trigram} (${number}).`;

/**
 * The both-values read — the block's only read. One value per line,
 * labeled, with the §1.G citation body under each; when both variants
 * resolve to the same number the identical citation renders once, under
 * the first line, rather than twice. The note names the method's gender
 * dependence rather than hiding it. At most one of the two values can
 * be a remap for any year, so the disclosures compose without colliding.
 */
export function formatKuaBoth(both) {
  const tm = KUA_TRIGRAMS[both.male.number];
  const tf = KUA_TRIGRAMS[both.female.number];
  let note = 'the eight mansions method assigns by gender; both classical values shown.';
  if (both.male.remapped) note += ` ${remapNote(both.male.number)}`;
  if (both.female.remapped) note += ` ${remapNote(both.female.number)}`;
  return {
    primary: `male · ${trigramLine(both.male.number, tm)}`,
    primaryBody: tm.body,
    secondary: `female · ${trigramLine(both.female.number, tf)}`,
    secondaryBody: both.female.number === both.male.number ? '' : tf.body,
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
  const { yyyy, mm, dd } = profile;
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) {
    return null;
  }
  try {
    return formatKuaBoth(getKuaBoth(yyyy, mm, dd));
  } catch (_) {
    return null;
  }
}

// ── DI injection (refs at boot) ───────────────────────────────────

let _root = null;
let _nodes = null;

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
.kua-body:empty { display: none; }
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
    '<div class="card-note kua-body kua-body-primary"></div>' +
    '<div class="card-habit kua-secondary"></div>' +
    '<div class="card-note kua-body kua-body-secondary"></div>' +
    '<div class="card-note kua-note"></div>' +
    '<span class="coord-seal" aria-hidden="true"></span>';
  face.appendChild(node);
  return node;
}

export function initKuaUI(refs) {
  injectKuaStyle();
  // Test surface may hand every node directly (the public_surface makeRefs
  // shape); production hands { cardFace } and the module builds its own
  // nodes.
  if (refs && refs.root && refs.primary) {
    _root = refs.root;
    _nodes = {
      primary: refs.primary, primaryBody: refs.primaryBody,
      secondary: refs.secondary, secondaryBody: refs.secondaryBody,
      note: refs.note,
    };
  } else {
    _root = resolveKuaRoot(refs);
    const qq = c => (_root && _root.querySelector ? _root.querySelector(c) : null);
    _nodes = _root ? {
      primary: qq('.kua-primary'), primaryBody: qq('.kua-body-primary'),
      secondary: qq('.kua-secondary'), secondaryBody: qq('.kua-body-secondary'),
      note: qq('.kua-note'),
    } : null;
  }
  // Hand the block root to ui/tiers.js so the unseal beat can reach it —
  // the dead-beat defect public_surface pinned for the public block.
  registerKuaRoot(_root);
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
    if (_nodes.primaryBody) _nodes.primaryBody.textContent = read ? (read.primaryBody || '') : '';
    if (_nodes.secondary) _nodes.secondary.textContent = read ? read.secondary : '';
    if (_nodes.secondaryBody) _nodes.secondaryBody.textContent = read ? (read.secondaryBody || '') : '';
    if (_nodes.note) _nodes.note.textContent = read ? read.note : '';
  }
  return read;
}
