// 8ball / ui/payments.js
// Storage + status-banner module. Historically the v0.3.0 paid-surface
// controller; the product went COMPLETELY FREE on the controller's
// 2026-09-02 order (doctrine v0.71), and on 2026-09-05 (doctrine v0.81)
// the model became FREE COMPLETE SINGLE SHEET + PAID DYAD: the single sheet
// stays at the v0.71 density for every device, and the dyad (§1.J) is the
// one paid surface — USD $3 once, permanent, unlimited. What lives here:
//   - the render-density resolver (getRenderTier — `t3`, the complete
//     single sheet, for every device; `t5` once a signed dyad access token
//     has verified — the same single-resolver seam every render path uses)
//   - the dyad entitlement storage (DYAD_KEY) and the boot-time resolution
//     that verifies the stored or returned token through core/entitlement.js
//   - the facet (written-entry note rotation) storage machinery, which
//     was never commerce
//   - the status banner
//   - the one-time boot scrub that retires the v0.3.0–v0.67 commerce keys
// STILL retired: the paywall modal, purchase staging, the unsigned `?paid=`
// return handler, and the tier/credits/pending storage shims. A stored
// `eight_ball_tier_v1` — whatever it says, `t5` included — grants nothing:
// that key was only ever written by an unsigned return (§5.B lineage), the
// dyad checkout never went live before v0.71 (no dyad purchase ever
// completed), and the scrub keeps removing it. core/payments.js stays as the
// tested state-machine registry (the kua-retirement precedent).

import { anchorFacetIndex, nextFacetState, normalizeFacetIndex } from '../core/payments.js';
import { verifyDyadToken, returnTokenFrom, hasLegacyPaidParam } from '../core/entitlement.js';

// Re-exported so index.html keeps a single import edge for the return path.
export { returnTokenFrom, hasLegacyPaidParam };

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
// The dyad entitlement (doctrine v0.81, §5): the SIGNED ACCESS TOKEN itself,
// verbatim, never a flag. Storing the token rather than a boolean is the
// point — it is re-verified against the configured public key at every
// boot, so a hand-written value grants nothing, and a device that holds a
// valid token stays entitled for good (nothing here ever deletes it, not
// even a failed verification: a missing key list or a browser without Web
// Crypto must not erase a purchase). Carries a sale id and a timestamp;
// nothing about the person.
export const DYAD_KEY = 'eight_ball_dyad_entitlement_v1';
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
// The three outcomes of opening a signed access link (status banner copy,
// §2 register — a filing notice, not a celebration).
export const DYAD_FILED_MESSAGE = 'dyad · filed on this device.';
export const DYAD_REJECTED_MESSAGE = 'that access link did not verify. nothing was filed.';
export const DYAD_STORAGE_MESSAGE = 'dyad · open for this visit — allow local storage, then reopen the link to keep it.';
// A bad link on a device that ALREADY holds a verified token: the link is
// named as unverified, and the device is told nothing was lost (pr242 audit,
// Lane B M1 — the plain rejection read as a failed purchase).
export const DYAD_ALREADY_FILED_MESSAGE = 'that access link did not verify. the dyad is already filed on this device.';

// ── storage shims ─────────────────────────────────────────────────
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning a safe null default. Facet display state is
// read-verified: a blocked/no-op write must not make the UI claim that a
// different written entry is now visible.

// THE single render-density helper (remediation R1, PR #36): every render
// path — cold-boot rehydration, same-card shake, same-pair submit — resolves
// density here and only here. Doctrine v0.81: the answer is `t3` — the
// COMPLETE single sheet, every coordinate, the meanings, the written entry
// and domain fit, nothing sealed, exactly the v0.71 single-sheet density —
// for every device, and `t5` (the dyad added) once resolveDyadEntitlement
// has verified a signed token. The resolver itself consults no storage and
// writes none: entitlement is settled once at boot, held in module state,
// and it can only ever go UP within a session (a return link verifying
// mid-boot), never down.
let _dyadEntitled = false;

export function getRenderTier() {
  return _dyadEntitled ? 't5' : 't3';
}

/** The dyad entitlement as currently resolved for this session. */
export function isDyadEntitled() {
  return _dyadEntitled;
}

function readStoredDyadToken() {
  try {
    const raw = localStorage.getItem(DYAD_KEY);
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch (_) { return null; }
}

// Read-verified write; the token is stored verbatim. Returns false when
// storage is blocked — the caller then keeps the entitlement for the
// session and asks the buyer to reopen the link once storage is allowed.
function storeDyadToken(token) {
  try {
    localStorage.setItem(DYAD_KEY, token);
    return localStorage.getItem(DYAD_KEY) === token;
  } catch (_) { return false; }
}

/**
 * Settle the dyad entitlement for this session. Called ONCE by boot, before
 * the first render, with whatever the return url carried (null when it
 * carried nothing). Order, fail-closed at every step:
 *
 *   1. A RETURNED token is verified first. Valid → entitled, and stored
 *      (read-verified). Invalid → nothing is written, nothing is granted
 *      by it, and the stored token (if any) is still consulted below —
 *      a bad link can never LOWER a device that already owns the dyad.
 *   2. A STORED token is verified. Valid → entitled. Invalid → not
 *      entitled for this session, but the token is LEFT IN PLACE: the
 *      failure may be the environment (no Web Crypto, an unconfigured
 *      key list) rather than the token, and a purchase is permanent.
 *   3. Neither → the complete single sheet, free.
 *
 * Nothing is consumed, counted or decremented anywhere: the same token
 * resolves the same way at every boot, and every render within the session
 * asks getRenderTier(), which reads the settled flag.
 *
 * `keys` / `subtle` are pass-throughs to core/entitlement.js so the audit
 * probe and the tests can drive the real path with a throwaway key pair.
 *
 * @returns {Promise<{granted: boolean, source: 'return'|'stored'|'none',
 *          stored: boolean|null, reason?: string}>}
 */
export async function resolveDyadEntitlement({ returnToken = null, keys, subtle } = {}) {
  const opts = {};
  if (keys !== undefined) opts.keys = keys;
  if (subtle !== undefined) opts.subtle = subtle;
  let returnReason;
  if (returnToken !== null && returnToken !== undefined) {
    const verdict = await verifyDyadToken(returnToken, opts);
    if (verdict.ok) {
      _dyadEntitled = true;
      const already = readStoredDyadToken() === returnToken;
      return { granted: true, source: 'return', stored: already || storeDyadToken(returnToken) };
    }
    returnReason = verdict.reason;
  }
  const stored = readStoredDyadToken();
  if (stored !== null) {
    const verdict = await verifyDyadToken(stored, opts);
    if (verdict.ok) {
      _dyadEntitled = true;
      return { granted: true, source: 'stored', stored: true, ...(returnReason ? { reason: returnReason } : {}) };
    }
    return { granted: _dyadEntitled, source: 'stored', stored: true, reason: returnReason || verdict.reason };
  }
  return { granted: _dyadEntitled, source: 'none', stored: null, ...(returnReason ? { reason: returnReason } : {}) };
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
 * the §5 inventory must match what IS stored, so they go too — and under
 * doctrine v0.81 a stored tier is an UNSIGNED record that must never be
 * mistaken for the dyad entitlement, which lives in DYAD_KEY as a signed
 * token. DYAD_KEY is deliberately NOT in this list. Read-
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
