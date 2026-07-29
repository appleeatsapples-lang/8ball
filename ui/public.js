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
 * The three rendered strings of the block, derived purely from a reading.
 * Ranked families read as a numbered run in the catalog register; the
 * anti-fit is labeled as such rather than implied; the role line is the
 * engine's own join, unmodified.
 *
 * @returns {{families: string, antiFit: string, roleLine: string}}
 */
export function formatPublicRead(reading) {
  return {
    families: reading.families.map(f => `${f.rank} ${f.label}`).join(' · '),
    antiFit: `anti-fit · ${reading.antiFit.label}`,
    roleLine: reading.roleLine,
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

export function initPublicUI(refs) {
  _refs = refs || null;
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
  if (families) families.textContent = read ? read.families : '';
  if (antiFit) antiFit.textContent = read ? read.antiFit : '';
  if (roleLine) roleLine.textContent = read ? read.roleLine : '';
  return read;
}
