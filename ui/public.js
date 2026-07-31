// 8ball / ui / public.js — the t4 public-read block (§1.D v0.58)
//
// DOM controller in the §6 v0.23 shape: pure exports above, an
// initPublicUI({refs}, {hooks}) injection point below, no module-level DOM
// access at import time. No storage, no network, no new localStorage key —
// entitlement is resolved by the caller and handed in.
//
// This module is the FIRST consumer of core/public.js. Until this file
// existed a test asserted that nothing imported that engine; the assertion
// has moved rather than been deleted — it now pins that this module is the
// only importer, so a second, unreviewed wiring still fails CI.
//
// What it renders is a reading OF the sheet, not new coordinates: the sheet
// is complete at t3, and t4 adds three ranked domain families, one anti-fit,
// and one shape-of-role line. `publicRead` is a block like `cardEntry`, so
// it never enters the 14-cell compartment grid or the density census.

import { buildPublicReading } from '../core/public.js';

// ── pure ──────────────────────────────────────────────────────────

/**
 * ISO date from a profile's calendar fields. The public engine takes a date
 * and nothing else — no name, no time — so this is the whole of the input
 * mapping, and it is the reason the block carries no PII beyond what the
 * sheet already shows.
 */
export function dobIsoFromProfile(profile) {
  if (!profile) return null;
  const { yyyy, mm, dd } = profile;
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) {
    return null;
  }
  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/**
 * The rendered strings of the block, derived purely from a reading. Ranked
 * families read as a numbered run in the catalog register; the anti-fit is
 * labeled as such rather than implied; the role line is the engine's own
 * join, unmodified.
 *
 * `bridge` is the fourth string and is empty for most readings. When the
 * birthday is a master value (calc v4, §1.B v0.62) the mode is read from the
 * base number through `MASTER_MODE_BRIDGE`, and this carries the engine's own
 * `mode.bridgeNote` so the substitution is VISIBLE rather than merely present
 * in the returned object. Without it a sheet showing birthday `11` sat beside
 * a role line built from mode `2` with nothing connecting them — which is the
 * silent substitution §1.D v0.62 names as the wrong fix, recreated one layer
 * down at the render surface (PR audit, 2026-07-31, P1).
 *
 * Still no copy of its own: every one of the four strings is the engine's,
 * joined or passed through.
 *
 * @returns {{families: string, antiFit: string, roleLine: string, bridge: string}}
 */
export function formatPublicRead(reading) {
  return {
    families: reading.families.map(f => `${f.rank} ${f.label}`).join(' · '),
    antiFit: `anti-fit · ${reading.antiFit.label}`,
    roleLine: reading.roleLine,
    bridge: reading.mode && reading.mode.bridged ? reading.mode.bridgeNote : '',
  };
}

/**
 * Full block content for a profile, or null when the profile cannot resolve
 * a date. Total: a malformed profile seals the block rather than throwing
 * into the render path.
 */
export function publicReadFor(profile) {
  const dob = dobIsoFromProfile(profile);
  if (!dob) return null;
  try {
    return formatPublicRead(buildPublicReading(dob));
  } catch (_) {
    return null;
  }
}

// ── DI injection (refs + hooks at boot) ───────────────────────────

let _refs = null;
let _bridge = null;

// Scoped CSS for the injected node, in the §6 v0.23 shape ui/meanings.js and
// ui/dyad.js already use: the module injects its own markup and style rather
// than touching index.html's static blocks, so the single-file budget and the
// host's four-ref boot wiring are both untouched.
//
// `:empty` rather than the `hidden` attribute, deliberately. This repo has a
// logged instance of an author `display:` rule beating the UA `[hidden]` rule
// and shipping a "hidden" control visible in production (the F1 bug class,
// pinned in tests/public_surface.test.js). `:empty` collapses on the node's
// actual content, so there is no attribute for a cascade to override.
const BRIDGE_STYLE = `
.public-bridge:empty { display: none; }
.public-bridge { margin-top: 8px; }
`;

const BRIDGE_CLASS = 'card-note public-bridge';

function injectBridgeStyle() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  if (document.getElementById('public-bridge-style')) return;
  if (!document.createElement || !document.head || !document.head.appendChild) return;
  const style = document.createElement('style');
  style.id = 'public-bridge-style';
  style.textContent = BRIDGE_STYLE;
  document.head.appendChild(style);
}

/**
 * Resolve the node the bridge note is written to.
 *
 * A caller MAY supply `refs.bridge` (the test surface does, so the write path
 * is driven directly rather than through a mock document). Otherwise the node
 * is created and appended to the block root — index.html carries no fifth id
 * and is byte-unchanged, which `tests/public_surface.test.js` pins by asserting
 * the boot call names exactly four ids.
 *
 * Returns null when neither is possible; every write below is null-guarded, so
 * a host without DOM degrades to the pre-existing three-line block rather than
 * throwing.
 */
function resolveBridgeNode(refs) {
  if (!refs) return null;
  if (refs.bridge) return refs.bridge;
  const root = refs.root;
  if (!root || typeof root.appendChild !== 'function') return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const existing = root.querySelector && root.querySelector('.public-bridge');
  if (existing) return existing;
  const node = document.createElement('div');
  node.className = BRIDGE_CLASS;
  root.appendChild(node);
  return node;
}

export function initPublicUI(refs) {
  _refs = refs || null;
  // Unconditional, and deliberately not tied to whether THIS module created a
  // node: ui/sheet.js emits `.public-bridge` in the two dyad sheets it builds,
  // and those rely on the same `:empty` collapse. Tying the style to the host
  // node's creation would leave an empty bordered line under both dyad sheets
  // whenever a ref was supplied instead.
  injectBridgeStyle();
  _bridge = resolveBridgeNode(_refs);
}

/**
 * Render the block for `profile` at `tier`.
 *
 * Sealed-DOM purity (§1.D v0.37): below t4 the value nodes are emptied —
 * absent, not hidden — so no entitled string is ever present in the DOM of
 * an unentitled render. The block's structure stays visible as a sealed
 * compartment, the same treatment every higher-tier cell gets.
 *
 * @param {object|null} profile
 * @param {{entitled: boolean}} state — entitlement resolved by the caller
 *        (index.html's getRenderTier), never read from storage here.
 */
export function renderPublicRead(profile, { entitled } = {}) {
  if (!_refs || !_refs.root) return null;
  const { root, families, antiFit, roleLine } = _refs;
  const read = entitled ? publicReadFor(profile) : null;
  root.classList.toggle('sealed', !read);
  // The seal is a visual treatment and its node is aria-hidden, so without
  // this a screen-reader user hears the label and then silence — no signal
  // that anything is withheld rather than broken.
  if (root.setAttribute) {
    root.setAttribute('aria-label', read ? 'domain fit' : 'domain fit · sealed at this device tier');
  }
  if (families) families.textContent = read ? read.families : '';
  if (antiFit) antiFit.textContent = read ? read.antiFit : '';
  if (roleLine) roleLine.textContent = read ? read.roleLine : '';
  // Cleared on the same branch as every other value node: a sealed or
  // downgraded render must leave no entitled string behind (§1.D v0.37), and
  // an unbridged reading must not keep the previous profile's bridge note.
  if (_bridge) _bridge.textContent = read ? read.bridge : '';
  return read;
}
