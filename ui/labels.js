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

// ── flip-stage intrinsic height (iOS/WebKit fix, 2026-08-02;
//    unconditioned for state 2026-08-31, then for width the same day) ──
// The .flip-stage 5/8 ratio box does not reliably grow to match a card
// face taller than the ratio height in embedded WKWebView builds (iOS
// in-app browsers — where both field reports came from), so the excess
// paints over whatever sits beyond the stage: the stacked result rail
// below 720px, the side rail's neighbors above it. Chromium and desktop
// WebKit grow it, which is why the defect never shows in container
// live-fires. Three narrowings have now been retired in sequence, each
// after the content outgrew the box in a state the previous scope
// excluded: the 2026-08-02 fix covered `.labels-revealed` only (the one
// state that outgrew the box then); the resting card outgrew it by
// 2026-08-31 (the kua sealed block, the comprehension hint — ~708px vs
// ~573 at 390 wide) and a live device showed the card over the $3 offer,
// so the state condition went; the same day's layout audit measured the
// ≥720px side rail at +146px resting and +458..465px at t3/revealed —
// the same trap on iPad-class embedded WebViews — so the width condition
// goes too. The rules are now UNCONDITIONAL: on growing engines they are
// a measured no-op at every width (the stage already sizes to content;
// the ≥720 rail centers its items, so nothing stretched depended on the
// box), and on WKWebView there is no ratio box left to under-size, in
// any state, at any width. The `.labels-revealed` class toggle on
// #flip-stage stays — pinned API surface, keeps the layout state
// observable — but layout does not depend on it.
// `aspect-ratio: auto` is the load-bearing declaration — the base
// .flip-stage rule sets no height, only the 5/8 ratio box. The back face
// is deliberately NOT dropped to auto: it keeps index.html's
// height:100%, which resolves against its grid-stretched .flip-side once
// the front's content has sized the row (definite in every engine), so
// the pre-flip back-beat still paints a full-height card back instead of
// a content-height strip.
const STYLE = `
.flip-stage { aspect-ratio: auto; height: auto; }
.flip-stage .flip-inner { min-height: 0; }
.flip-stage .flip-side .card { height: auto; }
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
