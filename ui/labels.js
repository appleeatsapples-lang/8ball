// labels-reveal toggle controller (DOCTRINE §5 allow-list / §6).
//
// Owns:
//   - localStorage key for the symbol-label visibility preference
//     (eight_ball_labels_revealed_v1)
//   - pure persistence helpers: isLabelsRevealed / setLabelsRevealed
//   - DOM-touching init: wires the toggle button + returns applyLabelsState
//   - the mobile flip-stage intrinsic-height layout state (STYLE below),
//     self-injected at init — see the iOS/WebKit note there
//
// Does NOT own:
//   - the result-card's `.labels-revealed` content rules (coord-prov /
//     coord-atlas / public-title visibility) — those stay in index.html;
//     this module only flips the class + toggle copy
//
// Extracted from index.html during the desktop side-rail layout cycle to
// free the line budget required by the §6 split (index.html was 1499/1500).
// Mirrors the DI shape established by ui/payments.js and ui/profile.js
// (v0.23 §6 amendment): pure exports testable without jsdom alongside a
// single init*UI({refs}, {hooks}) injection point. The self-injected
// stylesheet below mirrors ui/dyad.js's injectStyle/STYLE pattern, for the
// same reason: a few lines of layout CSS have nowhere to go in index.html's
// 1500-line budget (1497/1500 before this change), so they ship as a
// scoped runtime stylesheet instead of static markup.

// ── localStorage key ─────────────────────────────────────────────
// Bare-string const so tests/privacy_scan.test.js's same-file identifier
// lookup resolves it against LOCALSTORAGE_KEY_ALLOW. Internal-only.
const LABELS_KEY = 'eight_ball_labels_revealed_v1';

// ── pure persistence ─────────────────────────────────────────────
// Every read/write defends against a localStorage exception (private
// mode, quota, etc.): a read returns false, a write silently no-ops, so
// the preference survives only the current session in that case.

export function isLabelsRevealed() {
  try { return localStorage.getItem(LABELS_KEY) === 'true'; }
  catch (_) { return false; }
}

export function setLabelsRevealed(revealed) {
  try { localStorage.setItem(LABELS_KEY, revealed ? 'true' : 'false'); }
  catch (_) { /* localStorage unavailable; preference survives only this session */ }
}

// ── revealed-label intrinsic height (iOS/WebKit fix, 2026-08-02) ──
// Below the 720px side-rail breakpoint (index.html), .flip-stage and
// .result-rail stack in normal flow, so anything the compact 5/8 card box
// doesn't contain paints over the rail beneath it. Revealed labels
// (coord-prov / coord-atlas / public-title, index.html) make the card
// taller than that box; Chromium grows the stage to match, but WebKit
// builds have been observed not to (unverified in WebKit itself — see the
// handoff brief this fix was built from). Rather than depend on that
// cross-engine behavior, drop the fixed box for the stage and the front
// card while revealed, so both size off actual rendered content (auto)
// instead of a ratio or a percentage of an ancestor. `aspect-ratio: auto`
// is the load-bearing declaration — the base .flip-stage rule sets no
// height, only the 5/8 ratio box. The back face is deliberately NOT
// dropped to auto: it keeps index.html's height:100%, which resolves
// against its grid-stretched .flip-side once the front's content has
// sized the row (definite in every engine), so the pre-flip back-beat
// still paints a full-height card back instead of a content-height strip.
// The 719.98px bound is the standard fractional-width complement of the
// 720px breakpoint (zoomed viewports can land between 719px and 720px).
// Desktop (≥720px) is untouched: this block only applies below it.
const STYLE = `
@media (max-width: 719.98px) {
  .flip-stage.labels-revealed { aspect-ratio: auto; height: auto; }
  .flip-stage.labels-revealed .flip-inner { min-height: 0; }
  .flip-stage.labels-revealed .flip-side .card { height: auto; }
}
`;

function injectStyle() {
  if (typeof document === 'undefined' || !document.head || document.getElementById('labels-style')) return;
  const style = document.createElement('style');
  style.id = 'labels-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

// ── DOM-touching init ────────────────────────────────────────────
// Wires the toggle's click handler and returns applyLabelsState so the
// host can apply the stored preference at boot.
export function initLabelsUI(refs, hooks) {
  const { cardFace, labelsToggle, flipStage } = refs;
  injectStyle();

  function applyLabelsState(revealed) {
    cardFace.classList.toggle('labels-revealed', revealed);
    flipStage.classList.toggle('labels-revealed', revealed);
    labelsToggle.textContent = revealed ? '→ hide labels' : '→ reveal labels';
    labelsToggle.setAttribute('aria-pressed', revealed ? 'true' : 'false');
  }

  labelsToggle.addEventListener('click', () => {
    const next = !cardFace.classList.contains('labels-revealed');
    setLabelsRevealed(next);
    applyLabelsState(next);
  });

  return { applyLabelsState };
}
