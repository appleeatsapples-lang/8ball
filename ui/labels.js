// labels-reveal toggle controller (DOCTRINE §5 allow-list / §6).
//
// Owns:
//   - localStorage key for the symbol-label visibility preference
//     (eight_ball_labels_revealed_v1)
//   - pure persistence helpers: isLabelsRevealed / setLabelsRevealed
//   - DOM-touching init: wires the toggle button + returns applyLabelsState
//
// Does NOT own:
//   - the result-card render or the .labels-revealed CSS surface (those
//     live in index.html); this module only flips the class + toggle copy
//
// Extracted from index.html during the desktop side-rail layout cycle to
// free the line budget required by the §6 split (index.html was 1499/1500).
// Mirrors the DI shape established by ui/payments.js and ui/profile.js
// (v0.23 §6 amendment): pure exports testable without jsdom alongside a
// single init*UI({refs}, {hooks}) injection point.

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

// ── DOM-touching init ────────────────────────────────────────────
// Wires the toggle's click handler and returns applyLabelsState so the
// host can apply the stored preference at boot (after the §4.A age gate).
export function initLabelsUI(refs, hooks) {
  const { cardFace, labelsToggle } = refs;

  function applyLabelsState(revealed) {
    cardFace.classList.toggle('labels-revealed', revealed);
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
