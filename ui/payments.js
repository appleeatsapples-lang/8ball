// 8ball / ui/payments.js
// Storage + status-banner module. Historically the v0.3.0 paid-surface
// controller; the product went COMPLETELY FREE on the controller's
// 2026-09-02 order (no storefront, no checkout, nothing to unlock) —
// see the DOCTRINE free amendment. What remains here:
//   - the render-density resolver (getRenderTier — now the free ceiling,
//     the same single-resolver seam every render path already used)
//   - the facet (written-entry note rotation) storage machinery, which
//     was never commerce
//   - the status banner (formerly the paid-return banner)
//   - the one-time boot scrub that retires the commerce keys
// Retired with the storefront: the paywall modal, purchase staging, the
// `?paid=` return handler, and the tier/credits/pending storage shims.
// core/payments.js stays untouched as the tested state-machine registry
// (the kua-retirement precedent: a surface retires, its engine stands).
// The filename stays for exactly that lineage — renaming it would churn
// every import edge to erase a history the journal already records.

import { anchorFacetIndex, nextFacetState, normalizeFacetIndex } from '../core/payments.js';

// ── localStorage keys ─────────────────────────────────────────────
// FACET_KEY is live. CREDITS_KEY, PENDING_KEY and TIER_KEY are RETIRED
// commerce keys (free amendment): nothing reads or writes them anymore,
// and scrubRetiredCommerceKeys below actively removes them at boot —
// PENDING_KEY held a staged name+DOB payload, which must not linger on a
// device for a checkout that no longer exists (the v0.64 gender-scrub
// standard: retired personal data is erased, not left inert). The
// constants stay exported so the scrub and the privacy scan both name
// the exact keys.
export const CREDITS_KEY = 'eight_ball_credits_v1';
export const PENDING_KEY = 'eight_ball_pending_profile_v1';
export const TIER_KEY = 'eight_ball_tier_v1';
export const FACET_KEY = 'eight_ball_facet_index_v3';
// Pre-calc-v3 facet position (v0.49–v0.53). A former-master profile could
// anchor `high` here; under calc v3 that life path reduces (11→2, 22→4,
// 33→6), so the stored position may contradict the new anchor. Retired:
// never read, cleared once on the first facet read after calc-v3 load.
// Funded flip history is not representable in the single stored index, so
// the first v3 load re-anchors every device (accepted cost — journal
// 2026-07-20 §3 row 8 supersession entry).
export const LEGACY_FACET_KEY = 'eight_ball_facet_index_v1';
// Calc-v3 facet position (v0.54–v0.61). Calc v4 restores the master values
// (§1.B v0.62), so a device that stored a position under calc v3 stored it
// against a life path that has since MOVED — 1970-01-04 anchored `mid` as a
// reduced 4 and anchors `third` as the restored 22. Reading a v2 position
// under calc v4 would therefore render a note slot that was never computed
// for the life path now on screen. The key is versioned rather than
// migrated for exactly the reason v1 was: the single stored index cannot
// represent how it got there, so there is nothing to migrate, and both
// retired generations are cleared once on the first v3 facet read.
export const LEGACY_FACET_KEY_V2 = 'eight_ball_facet_index_v2';
const RETIRED_FACET_KEYS = [LEGACY_FACET_KEY, LEGACY_FACET_KEY_V2];

// Controller-authorized c.1: reuse immutable v1 note slots positionally.
// These are render positions, not newly authored lateral copy.
const FACET_SLOTS = ['low', 'mid', 'high'];

// Surfaced at save time when saveProfile()'s read-verified write fails.
// The purchase clause left this string with the storefront.
export const PROFILE_SAVE_STORAGE_MESSAGE = 'reading not saved — allow local storage to reopen it later.';

// ── storage shims ─────────────────────────────────────────────────
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning a safe null default. Facet display state is
// read-verified: a blocked/no-op write must not make the UI claim that a
// different written entry is now visible.

// THE single render-density helper (remediation R1, PR #36): every render
// path — cold-boot rehydration, same-card shake, same-pair submit —
// resolves density here and only here. Under the free amendment the
// resolution is the CEILING for every device: the complete sheet plus the
// dyad, with nothing sealed and nothing stored. The single-resolver seam
// is deliberately kept (rather than deleting the call sites) so density
// still has exactly one authority.
export function getRenderTier() {
  return 't5';
}
export function getFacetIndex() {
  // One-shot calc-v4 migration: drop BOTH retired generations before reading
  // the active key, so neither a pre-v3 former-master anchor nor a v3 anchor
  // computed against a since-restored master life path can render again.
  for (const key of RETIRED_FACET_KEYS) {
    try { localStorage.removeItem(key); } catch (_) {}
  }
  try { return normalizeFacetIndex(localStorage.getItem(FACET_KEY)); }
  catch (_) { return null; }
}
export function setFacetIndex(index) {
  const clean = normalizeFacetIndex(index);
  if (clean === null) return null;
  try {
    localStorage.setItem(FACET_KEY, String(clean));
    const stored = normalizeFacetIndex(localStorage.getItem(FACET_KEY));
    return stored === clean ? stored : null;
  } catch (_) { return null; }
}
export function clearFacetIndex() {
  const keys = [FACET_KEY, ...RETIRED_FACET_KEYS];
  let verified = true;
  for (const key of keys) {
    try { localStorage.removeItem(key); }
    catch (_) { verified = false; }
  }
  for (const key of keys) {
    try { if (localStorage.getItem(key) !== null) verified = false; }
    catch (_) { verified = false; }
  }
  return verified;
}
export function ensureFacetIndex(lifePath, { reset = false } = {}) {
  const stored = reset ? null : getFacetIndex();
  const resolved = stored === null ? anchorFacetIndex(lifePath) : stored;
  return stored === null ? setFacetIndex(resolved) : resolved;
}
export function getFacetSlot(lifePath) {
  const stored = getFacetIndex();
  return FACET_SLOTS[stored === null ? anchorFacetIndex(lifePath) : stored];
}
// The note slot a FRESH standalone profile would show — never reads the
// stored position. §1.J's second person (dyad `t5`) is never anchored,
// rotated or persisted (§5.F), so resolving their note through getFacetSlot
// would apply THIS DEVICE's stored position (anchored or since rotated by A)
// to a life path it was never computed for (PR #187 R2). A fresh profile's
// own first read is exactly `anchorFacetIndex(lifePath)` — see
// ensureFacetIndex's `stored === null` branch — so this is that same
// resolution, pure and storage-free, for a person who must never touch the
// key at all.
export function getFreshFacetSlot(lifePath) {
  return FACET_SLOTS[anchorFacetIndex(lifePath)];
}
export function consumeFacetShake(lifePath) {
  const stored = getFacetIndex();
  const state = nextFacetState({
    facetIndex: stored === null ? anchorFacetIndex(lifePath) : stored,
  });
  const verified = setFacetIndex(state.facetIndex);
  return verified === null ? null : { ...state, facetIndex: verified };
}
/**
 * One-time boot scrub (free amendment, 2026-09-02): the three retired
 * commerce keys leave the device. PENDING_KEY is the load-bearing one —
 * it staged a name+DOB payload across checkout, personal data that must
 * not linger for a flow that no longer exists (this also subsumes the
 * v0.64 scrubPendingGender pass: removing the payload removes any stale
 * gender token inside it). TIER_KEY and CREDITS_KEY are non-personal but
 * the §5 inventory must match what IS stored, so they go too. Read-
 * verified, pure when there is nothing to remove, silent-fail-safe on
 * storage errors (nothing reads the keys anymore, so a failed removal
 * only delays cleanliness to the next boot).
 */
export function scrubRetiredCommerceKeys() {
  const keys = [PENDING_KEY, TIER_KEY, CREDITS_KEY];
  let verified = true;
  for (const key of keys) {
    try { localStorage.removeItem(key); } catch (_) { verified = false; }
  }
  for (const key of keys) {
    try { if (localStorage.getItem(key) !== null) verified = false; }
    catch (_) { verified = false; }
  }
  return verified;
}

// ── status banner ─────────────────────────────────────────────────
// Formerly the paid-return banner; the fade mechanism survives as the
// host's one transient status surface (today: the blocked-storage save
// message). DOM ref injected at boot so the module stays import-safe
// before the DOM parses.

let statusBanner = null;

export function initStatusBanner(banner) {
  statusBanner = banner;
}

export function showStatusBanner(message) {
  if (!statusBanner || !message) return;
  statusBanner.textContent = message;
  statusBanner.hidden = false;
  // Force reflow so the opacity transition fires from 0 → 1.
  void statusBanner.offsetWidth;
  statusBanner.classList.add('visible');
  setTimeout(() => {
    statusBanner.classList.remove('visible');
    setTimeout(() => { statusBanner.hidden = true; }, 600);
  }, 4000);
}
