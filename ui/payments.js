// 8ball / ui/payments.js
// v0.3.0 paid-surface controller (DOCTRINE §4.B / §5 v0.22 / §6;
// ownership model §1.D / §5 v0.55).
//
// Owns:
//   - localStorage keys for credits (legacy, read-only) / pending_profile /
//     tier / facet
//   - getter/setter shims for the stored tier and current facet, plus the
//     read-only legacy-credits getter feeding the §1.D R2 grandfather
//   - paywall modal open/close + outside-click + Escape handlers
//   - paid-return banner fade animation
//   - the `?paid=t1|t2|t3` redirect handler (handlePaidReturn) which calls
//     applyPaidReturn from core/payments.js, persists the monotonic tier,
//     and signals to the caller whether a pending profile was consumed
//
// Does NOT own:
//   - the state-machine logic itself (lives in core/payments.js — pure,
//     no DOM, vitest-testable without jsdom)
//   - the stored-profile shape or saveProfile/loadSavedProfile (those
//     are in index.html alongside the v0.2.7.2 city+tz payload schema;
//     this module passes the consumed pending profile back via callback)
//   - the unlocked-render branch in renderCard (lives in index.html
//     because it shares cardFace + the symbol-render state)
//   - the lock-icon Path B click handler (the only paywall trigger,
//     §4.B v0.55 — it calls openPaywall directly from index.html)
//
// Extracted from index.html at step 6/12 of v0.3.0 because index.html
// crossed the 1500-line single-file ceiling (DOCTRINE §6). The split
// target — `ui/*.js` modules — is exactly what §6 specifies.

import {
  anchorFacetIndex, applyPaidReturn, isTier, nextFacetState,
  normalizeCounter, normalizeFacetIndex, normalizeTier, resolveRenderTier,
} from '../core/payments.js';
// Shared modal open/close (class + aria-hidden + focus save/restore)
// and Tab trap. One-way dependency: modals.js never imports payments.js.
import { openModal, closeModal, trapTab } from './modals.js';

// ── localStorage keys ─────────────────────────────────────────────
// CREDITS_KEY and PENDING_KEY are §5 v0.22 allow-list keys; TIER_KEY and
// FACET_KEY are the v0.6.0 and v0.7.1 extensions. tests/privacy_scan resolves
// identifier-as-key via same-file `const IDENT = '...'` lookup, so the
// bare string definitions here are mandatory for the scan.
// The v0.3.0 tries counter is RETIRED (§5 v0.55) — its key is named
// nowhere in runtime source, never read or written; stale values on old
// devices are inert, per the v0.48 retired-key precedent.
export const CREDITS_KEY = 'eight_ball_credits_v1';
export const PENDING_KEY = 'eight_ball_pending_profile_v1';
export const TIER_KEY = 'eight_ball_tier_v1';
export const FACET_KEY = 'eight_ball_facet_index_v2';
// Pre-calc-v3 facet position (v0.49–v0.53). A former-master profile could
// anchor `high` here; under calc v3 that life path reduces (11→2, 22→4,
// 33→6), so the stored position may contradict the new anchor. Retired:
// never read, cleared once on the first facet read after calc-v3 load.
// Funded flip history is not representable in the single stored index, so
// the first v3 load re-anchors every device (accepted cost — journal
// 2026-07-20 §3 row 8 supersession entry).
export const LEGACY_FACET_KEY = 'eight_ball_facet_index_v1';

// Controller-authorized c.1: reuse immutable v1 note slots positionally.
// These are render positions, not newly authored lateral copy.
const FACET_SLOTS = ['low', 'mid', 'high'];

// ── storage shims ─────────────────────────────────────────────────
// Two payment-state payloads live in localStorage (ownership model, §5 v0.55):
//   credits     LEGACY, read-only int — written by pre-v0.55 purchases,
//               never written or decremented again. Its only consumer is
//               the §1.D R2 grandfather read inside getRenderTier; once
//               that persists the tier, the value is ignored forever.
//   pending     JSON payload — written when the paywall opens (Path B
//               lock-tap), consumed on the ?paid=tN return to render the
//               user's pending profile at the stored tier. Lifetime is
//               one round-trip.
//
// Every read defends against a localStorage exception (private mode,
// quota, etc.) by returning a safe zero/null default. Corrupt legacy
// payloads are normalized to whole non-negative integers before use.
// Writes silently no-op on exception — the worst case is state resetting
// on the next visit, which is the same shape as a fresh user.

export function getCredits() {
  try { return normalizeCounter(localStorage.getItem(CREDITS_KEY)); }
  catch (_) { return 0; }
}
// Tier is the highest rung purchased ("t1" | "t2" | "t3"); absent = free.
// Monotonic — only handlePaidReturn writes it, via the max-rank result of
// applyPaidReturn. Garbage in storage reads as free (never throws).
//
// A RAW retired-tier value (currently only 't4', §1.D v0.60) is let through
// UNNORMALIZED rather than gated out here. Both callers — getRenderTier via
// resolveRenderTier, and handlePaidReturn via applyPaidReturn — immediately
// run the value through normalizeTier/RETIRED_TIERS themselves, so this is
// the one seam a retired token must survive to reach that table. Gating it
// to null here (the pre-fix behavior) discarded the raw 't4' before either
// caller could apply the retirement mapping, so a device holding a raw
// stored 't4' fell through to the unrelated legacy-credit grandfather path
// instead — silently landing on 'free' with no credits, or on t3 via the
// WRONG mechanism with credits, and never persisting a rewrite in the
// no-credits case. `isTier(normalizeTier(t))` is true for both a current
// rung and a retired one that maps onto a current rung, and false for any
// other garbage — so true unknown/corrupt values still fail closed to null.
export function getTier() {
  try {
    const t = localStorage.getItem(TIER_KEY);
    return isTier(normalizeTier(t)) ? t : null;
  } catch (_) { return null; }
}
export function setTier(tier) {
  if (!isTier(tier)) return;
  try { localStorage.setItem(TIER_KEY, tier); } catch (_) {}
}
// THE single render-density helper (remediation R1, PR #36 Codex inv.
// 5+11): every render path — cold-boot rehydration, same-card shake,
// same-pair submit, paid-return boot — resolves density here and only
// here. Delegates the rule to core/payments.js resolveRenderTier; this
// wrapper adds the storage read and the R2 grandfather persistence:
// credits with no tier key (pre-v0.6.0 purchase shape) resolve to t3
// and the key is written on first detection so the rule is total.
export function getRenderTier() {
  const stored = getTier();
  const resolved = resolveRenderTier({ tier: stored, credits: getCredits() });
  // Persist whenever the resolved tier differs from what is stored. That
  // covers both migrations: the R2 legacy-credit grandfather (no stored
  // tier) and a retired rung (§1.D v0.60 — a stored 't4' is rewritten to
  // 't3' on first detection, so the withdrawal is a one-time normalization
  // rather than a lookup every device repeats forever).
  if (isTier(resolved) && resolved !== stored) setTier(resolved);
  return resolved;
}
export function getFacetIndex() {
  // One-shot calc-v3 migration: drop any pre-v3 position before reading the
  // active key, so a stale former-master anchor can never render again.
  try { localStorage.removeItem(LEGACY_FACET_KEY); } catch (_) {}
  try { return normalizeFacetIndex(localStorage.getItem(FACET_KEY)); }
  catch (_) { return null; }
}
export function setFacetIndex(index) {
  const clean = normalizeFacetIndex(index);
  if (clean === null) return;
  try { localStorage.setItem(FACET_KEY, String(clean)); } catch (_) {}
}
export function clearFacetIndex() {
  try { localStorage.removeItem(FACET_KEY); } catch (_) {}
  try { localStorage.removeItem(LEGACY_FACET_KEY); } catch (_) {}
}
export function ensureFacetIndex(lifePath, { reset = false } = {}) {
  const stored = reset ? null : getFacetIndex();
  const resolved = stored === null ? anchorFacetIndex(lifePath) : stored;
  if (stored === null) setFacetIndex(resolved);
  return resolved;
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
  setFacetIndex(state.facetIndex);
  return state;
}
export function getPendingProfile() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.name && obj.dob) return obj;
    return null;
  } catch (_) { return null; }
}
export function setPendingProfile(payload) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); }
  catch (_) {}
}
export function clearPendingProfile() {
  try { localStorage.removeItem(PENDING_KEY); } catch (_) {}
}

// ── paywall modal + banner ────────────────────────────────────────
// DOM refs are injected at boot via initPaywallUI so this module
// remains import-safe before the DOM parses. The three-rung ladder CTAs
// are plain <a href> elements in the HTML — no JS hook, browser
// navigates to each rung's Gumroad Buy Link on tap (DOCTRINE §5.B
// Call 2 v0.36: three products, same bare-href mechanism).

let paywallModal = null;
let paywallClose = null;
let paidBanner = null;

export function initPaywallUI({ modal, closeBtn, banner }) {
  paywallModal = modal;
  paywallClose = closeBtn;
  paidBanner = banner;
  paywallClose.addEventListener('click', closePaywall);
  paywallModal.addEventListener('click', e => {
    if (e.target === paywallModal) closePaywall();
  });
  trapTab(paywallModal);
}

export function openPaywall() {
  // Focus lands on "maybe later" — dismissal stays one keypress away;
  // the opener (usually the shake button) is restored on close.
  openModal(paywallModal, paywallClose);
}

export function closePaywall() {
  closeModal(paywallModal);
}

export function isPaywallOpen() {
  return paywallModal != null && paywallModal.classList.contains('open');
}

export function showPaidBanner() {
  paidBanner.hidden = false;
  // Force reflow so the opacity transition fires from 0 → 1.
  void paidBanner.offsetWidth;
  paidBanner.classList.add('visible');
  setTimeout(() => {
    paidBanner.classList.remove('visible');
    setTimeout(() => { paidBanner.hidden = true; }, 600);
  }, 4000);
}

// ── paid-return handler (§5.B Call 2 / §6.6 / §7.2; ownership v0.55) ──
// Reads `?paid=<rung>` and runs applyPaidReturn. The accepted set is
// whatever `isTier` accepts — deliberately NOT enumerated here, because the
// enumeration is what went stale when §1.D v0.58 appended t4 (this comment
// said `t1|t2|t3` for a day while the code below already honoured t4).
// The purchase is permanent: the stored tier rises to max(current,
// purchased) and never downgrades — that write is the entire grant; no
// credits exist. Unknown ?paid= values are ignored — the replay-safe
// branch is preserved: no tier write, no banner. If a pending profile is
// present (the Path B lock-tap wrote it before the redirect) the caller's
// onConsumePending callback is fired with the profile so it can persist
// it through the host's saveProfile (which owns the v0.2.7.2 city+tz
// payload shape). Always strips the query string and shows the banner;
// returns true iff a pending profile was consumed.
//
// Caller is expected to fire this from inside boot() so the tier +
// banner sequence runs on every load, including a fresh return-from-payment.

export function handlePaidReturn(onConsumePending) {
  const params = new URLSearchParams(window.location.search);
  const purchased = params.get('paid');
  if (!isTier(purchased)) return false;
  const paidState = applyPaidReturn({
    pendingProfile: getPendingProfile(),
    tier: getTier(),
    purchasedTier: purchased
  });
  setTier(paidState.tier);
  clearPendingProfile();
  let consumedPending = false;
  if (paidState.action === 'render-unlocked' && paidState.profile) {
    if (typeof onConsumePending === 'function') {
      onConsumePending(paidState.profile);
    }
    consumedPending = true;
  }
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, '', window.location.pathname);
  }
  showPaidBanner();
  return consumedPending;
}
