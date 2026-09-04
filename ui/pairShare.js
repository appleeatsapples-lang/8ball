// 8ball / ui / pairShare.js — the Pair Imprint (DOCTRINE §5.D / §1.J v0.79)
//
// A DEDICATED, narrow share surface for the paired reading — deliberately a
// separate module from ui/share.js rather than a second call into it. That
// module's builder reads the live DOM sheet snapshot for ONE person
// (shareRowRefs); this module never touches a sheet, a profile, or ANY DOM
// beyond the two refs it is handed at init (its own button + status node).
//
// INPUT BOUNDARY, stated as the whole of this module's privacy contract: the
// only data this file ever sees is whatever `hooks.getRelation()` returns, or
// what a host passes to the returned `notifyRelationChange()` — both wired by
// index.html to ui/dyad.js's currentRelation() getter and its one
// relation-change notification point, which hand back the FORMATTED relation
// record (formatDyadRelation's return shape), never a profile, never a sheet,
// never form fields. buildPairImprintSnapshot below then narrows THAT
// further: it reads exactly three fields off it by name and discards
// everything else — the meaning prose, the qualifier, the full citations,
// all of it. What the snapshot cannot contain, it cannot leak; that is the
// allow-list construction the brief's risk register asks for, done by never
// spreading the input object.
//
// ZERO IMPORTS (mirrors ui/share.js's self-containment convention) — this
// file cannot reach ui/dyad.js, ui/sheet.js, ui/tiers.js or any core/
// module even by accident, which is the structural half of the "cannot
// receive profile or sheet data" proof the brief asks for; the other half is
// the allow-list above.
//
// Render pipeline: SVG string → offscreen <canvas> → PNG Blob, entirely
// on-device, exactly ui/share.js's technique, reimplemented independently
// rather than imported (its buildCardSVGFromSnapshot reads a coordinate-row
// snapshot shape this module must never construct). Deterministic
// 1080×1350 portrait — the same content renders the same pixels every time,
// since the input is three short strings and fixed product copy, never a
// profile or a timestamp.
//
// CONTROLLER ARCHITECTURE (second remediation gate, audit-blocked bc23c12
// P1-3). Every `initPairShareUI()` call creates a fresh, self-contained
// controller object — refs, hooks, cache, timers, in-flight state — rather
// than writing to module-level globals. A re-init RETIRES the prior
// controller (marks it `retired`, detaches its click listener) so any async
// continuation it already started becomes an inert no-op: a retired
// controller's rasterization/share/download promise still resolves, but
// every checkpoint below checks `controller.retired` first and returns
// before touching a ref, a status node, or the in-flight flag. Two live
// controllers can never both admit an operation, and an old controller's
// completion can never write into a new controller's refs or open a slot for
// a third click — the isolation is structural (separate objects), not a
// shared counter one instance could out-race another on.
//
// PRE-RENDER / TRANSIENT ACTIVATION (P1-4). The Web Share API requires the
// call to `navigator.share()` to happen inside a user-activation event
// handler with no prior `await` — rasterizing the PNG on click, THEN calling
// `navigator.share()`, loses that activation and throws NotAllowedError in
// browsers that enforce it strictly. So rendering happens proactively: the
// host calls the controller's `notifyRelationChange(relation)` the instant a
// resolved relation becomes current (or `null` the instant it stops being
// current — close, Compare Another, Previous Readings, a failed or
// successful replacement all resolve to exactly one of those two calls
// through ui/dyad.js's own `_relation` assignment points), and this module
// rasterizes in the background and caches the resulting Blob. A click
// attempts `navigator.share()` SYNCHRONOUSLY — before this function's first
// `await` — ONLY when that cached Blob is already present; otherwise it
// waits for the pending render and goes straight to the on-device download,
// since activation cannot survive that wait regardless.
//
// Network: none. The only outbound surfaces are the user's own native share
// sheet and clipboard — no fetch, no beacon, no telemetry (§5/§7).
// Storage: none — no localStorage key is named, read or written here.

// ── constants ─────────────────────────────────────────────────────
const SITE_HOST = 'the-eight-ball.netlify.app';
const IMPRINT_FILENAME = '8ball-pair-reading.png';

const PNG_W = 1080;
const PNG_H = 1350;
const SAFE_X = 90;
// Frame geometry, named so the footer's clearance is a checkable relationship
// rather than two coincidentally-close magic numbers (audit A4: the URL
// baseline at y=1300 sat 2px from the frame's own bottom edge at y=1302 —
// inside a descender's reach on "y" in "netlify", so the glyph clipped the
// rule it was drawn beside). FRAME_BOTTOM is the frame's inner edge;
// FOOTER_URL_Y carries an explicit ≥20px clearance, asserted in
// tests/pair_share.test.js rather than eyeballed.
const FRAME_INSET = 48;
const FRAME_BOTTOM = PNG_H - FRAME_INSET;
const FOOTER_DISCLOSURE_Y = 1190;
const FOOTER_PRIVACY_Y = 1225;
const FOOTER_URL_Y = 1266;
const PAPER = '#000000';
const INK = '#ffffff';
const LABEL = '#b8b8b8';
const RULE = '#737373';
const FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// The three share-approved relation summaries, in the order the compact
// pair signature (ui/dyad.js #dyad-signature) presents them.
const SIGNATURE_ROWS = Object.freeze([
  Object.freeze({ label: 'ELEMENT CYCLE', key: 'elementCycle' }),
  Object.freeze({ label: 'COMBINED LIFE PATH', key: 'combinedLifePath' }),
  Object.freeze({ label: 'CARD PAIR', key: 'cardPair' }),
]);

// ── the narrow snapshot ─────────────────────────────────────────────
//
// Every key the Pair Imprint may ever carry — the allow-list itself, so a
// test can assert the constructed object has exactly these keys and no
// others, rather than trusting the function body not to have grown one.
export const PAIR_IMPRINT_ALLOW = Object.freeze([
  'brand', 'pairLabel', 'elementCycle', 'combinedLifePath', 'cardPair',
  'disclosure', 'privacyLine', 'url',
]);

/**
 * Build the immutable Pair Imprint snapshot from a FORMATTED relation
 * record (ui/dyad.js formatDyadRelation's return shape — never a profile,
 * never sheet DOM). Reads exactly three fields off it BY NAME; nothing else
 * on the input object — however large or however it grows — can reach the
 * snapshot, because this function never spreads it.
 *
 * Returns null for a missing/failed relation (Step 4's failure state has
 * nothing to share) rather than a snapshot of empty strings, which would
 * render a technically-valid-looking but content-free artifact.
 */
export function buildPairImprintSnapshot(formattedRelation) {
  if (!formattedRelation || typeof formattedRelation !== 'object') return null;
  const elementCycle = String(formattedRelation.elementDirectionAB || '');
  const combinedLifePath = String(formattedRelation.numerologySpine || '');
  const cardPair = String(formattedRelation.cardPairHead || '');
  if (!elementCycle || !combinedLifePath || !cardPair) return null;
  return Object.freeze({
    brand: '8 ball · pair reading',
    pairLabel: 'A × B',
    elementCycle,
    combinedLifePath,
    cardPair,
    disclosure: 'relation, not compatibility',
    privacyLine: 'personal details excluded',
    url: SITE_HOST,
  });
}

// ── snapshot → SVG (1080×1350 portrait) ────────────────────────────

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── geometry fit (audit A4 follow-on / second-gate "P2 geometry") ─────────
// The three signature values are FINITE outputs of immutable content tables
// (25 ordered element pairs, the numerology domain, 144×144 catalog roman
// numerals) — not free text — so their worst case is enumerable, not merely
// estimated. tests/pair_share.test.js enumerates all three domains through
// the real production functions and asserts the longest real string this
// module will ever be asked to render still fits inside TEXT_LANE_WIDTH at a
// font size no smaller than VALUE_FONT_MIN. CHAR_ADVANCE_EM is a deliberately
// conservative (wider than typical) per-character advance-width estimate for
// this monospace stack, so the fit is a real margin, not an optimistic one.
const VALUE_FONT_MAX = 42;
const VALUE_FONT_MIN = 22;
const CHAR_ADVANCE_EM = 0.62;
const TEXT_LANE_WIDTH = PNG_W - 2 * SAFE_X;

export const VALUE_GEOMETRY = Object.freeze({
  fontMax: VALUE_FONT_MAX,
  fontMin: VALUE_FONT_MIN,
  charAdvanceEm: CHAR_ADVANCE_EM,
  laneWidth: TEXT_LANE_WIDTH,
});

/**
 * The font size a value row should render at so its estimated width never
 * exceeds the safe text lane. Deterministic: same string, same size, every
 * time — never a runtime DOM measurement (there is no DOM at render time;
 * this function must work identically whether it runs in a browser or this
 * suite's plain-node harness). Short strings (the overwhelming common case)
 * render at the full VALUE_FONT_MAX unchanged; only a string long enough to
 * risk the lane shrinks, and never below VALUE_FONT_MIN.
 */
export function fitValueFontSize(text) {
  const len = String(text == null ? '' : text).length || 1;
  const fitted = Math.floor(TEXT_LANE_WIDTH / (CHAR_ADVANCE_EM * len));
  return Math.max(VALUE_FONT_MIN, Math.min(VALUE_FONT_MAX, fitted));
}

export function buildPairImprintSVG(snapshot) {
  const s = snapshot || {};
  const rows = SIGNATURE_ROWS.map((row, i) => {
    const y = 560 + i * 220;
    const valueFontSize = fitValueFontSize(s[row.key]);
    return (
      `<text x="${PNG_W / 2}" y="${y}" text-anchor="middle" font-family="${FONT}" ` +
      `font-size="26" letter-spacing="2" fill="${LABEL}">${esc(row.label)}</text>` +
      `<text x="${PNG_W / 2}" y="${y + 56}" text-anchor="middle" font-family="${FONT}" ` +
      `font-size="${valueFontSize}" font-weight="600" fill="${INK}">${esc(s[row.key])}</text>`
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PNG_W}" height="${PNG_H}" ` +
    `viewBox="0 0 ${PNG_W} ${PNG_H}">` +
    `<rect x="0" y="0" width="${PNG_W}" height="${PNG_H}" fill="${PAPER}"/>` +
    `<rect x="48" y="48" width="${PNG_W - 96}" height="${PNG_H - 96}" fill="none" stroke="${RULE}" stroke-width="2"/>` +
    `<text x="${PNG_W / 2}" y="180" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="32" letter-spacing="3" fill="${INK}">${esc(s.brand)}</text>` +
    `<text x="${PNG_W / 2}" y="300" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="72" font-weight="700" fill="${INK}">${esc(s.pairLabel)}</text>` +
    `<line x1="${SAFE_X}" y1="360" x2="${PNG_W - SAFE_X}" y2="360" stroke="${RULE}" stroke-width="2"/>` +
    rows +
    `<line x1="${SAFE_X}" y1="1150" x2="${PNG_W - SAFE_X}" y2="1150" stroke="${RULE}" stroke-width="2"/>` +
    `<text x="${PNG_W / 2}" y="${FOOTER_DISCLOSURE_Y}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="26" letter-spacing="1.5" fill="${LABEL}">${esc(s.disclosure)}</text>` +
    `<text x="${PNG_W / 2}" y="${FOOTER_PRIVACY_Y}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="24" letter-spacing="1.2" fill="${LABEL}">${esc(s.privacyLine)}</text>` +
    `<text x="${PNG_W / 2}" y="${FOOTER_URL_Y}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="26" letter-spacing="1.5" fill="${INK}">${esc(s.url)}</text>` +
    `</svg>`
  );
}

// Exported for a layout/geometry assertion (audit A4) rather than a visual
// read: the URL baseline must clear the frame's own bottom edge by a real
// margin, accounting for a descender's typical reach at this font size
// ("y" in "netlify" is the actual glyph the clipped render hit — the
// baseline sat 2px from the frame edge, well inside its own descent).
export const FOOTER_LAYOUT = Object.freeze({
  frameBottom: FRAME_BOTTOM,
  urlBaselineY: FOOTER_URL_Y,
  urlFontSize: 26,
});

// ── snapshot → caption ──────────────────────────────────────────────
// Built from the SAME snapshot the PNG renders — never a second read of the
// relation record — so the two artifacts cannot disagree about what they
// disclose.
export function buildPairImprintCaption(snapshot) {
  const s = snapshot || {};
  return [
    `${s.brand || ''} · ${s.pairLabel || ''}`,
    `element cycle: ${s.elementCycle || ''}`,
    `combined life path: ${s.combinedLifePath || ''}`,
    `card pair: ${s.cardPair || ''}`,
    `${s.disclosure || ''} · ${s.privacyLine || ''}`,
    s.url || SITE_HOST,
  ].join('\n');
}

// ── status copy (Step 2: distinguish every outcome) ─────────────────
// Pure mapping, one entry per branch the click handler can take, so no two
// distinct outcomes ever share a message and a claim of success never rides
// a branch that only opened a chooser. `empty` (nothing resolved to share)
// is deliberately its own state, distinct from `failed` (a render or share
// exception, OR — second gate, P2 hook truth — a getRelation() hook that
// threw on read) — the first is "nothing to share yet", the second is
// "tried and it broke". `native-share unavailable` has no message of its
// own: it is the CONDITION that routes to the download-fallback branch
// below, which resolves to `downloaded` or `downloaded-copied`.
export function pairShareStatusMessage(state) {
  switch (state) {
    case 'busy': return 'preparing pair image…';
    case 'shared': return 'shared.';
    case 'downloaded': return 'image saved to this device.';
    case 'downloaded-copied': return 'image saved · caption copied.';
    case 'cancelled': return 'share cancelled.';
    // A2 / second-gate P1-2: the pair changed (closed, replaced, or a new
    // one submitted) while this export was in flight — distinct from
    // `failed` (a genuine exception) and from `cancelled` (the reader
    // dismissed a native chooser); nothing was shared or saved for the
    // stale pair.
    case 'stale': return 'the pair changed. share the pair again.';
    case 'empty': return 'nothing to share yet — read a pair first.';
    case 'failed': return 'share failed. image not saved.';
    default: return '';
  }
}

// ── SVG → PNG Blob (on-device only) ─────────────────────────────────
//
// Second gate, P2 cleanup: every failure path below revokes the SVG object
// URL exactly once and rejects exactly once (`settled` guards both), so a
// throw from ANY step — Blob construction, createObjectURL, `new Image()`,
// the `img.src` setter, `document.createElement('canvas')`, `getContext`,
// `drawImage`, or `toBlob` returning null — settles the promise truthfully
// instead of leaking an object URL or leaving the caller's await hanging.

function svgToPngBlob(svg, width, height) {
  return new Promise((resolve, reject) => {
    let url = null;
    let settled = false;
    const cleanupUrl = () => {
      if (url == null) return;
      try { URL.revokeObjectURL(url); } catch (_) { /* best-effort — already failing */ }
      url = null;
    };
    const fail = err => {
      if (settled) return;
      settled = true;
      cleanupUrl();
      reject(err);
    };
    const succeed = blob => {
      if (settled) return;
      settled = true;
      cleanupUrl();
      resolve(blob);
    };
    try {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            blob => (blob ? succeed(blob) : fail(new Error('toBlob returned null'))),
            'image/png',
          );
        } catch (e) {
          fail(e);
        }
      };
      img.onerror = () => fail(new Error('SVG image failed to load'));
      img.src = url;
    } catch (e) {
      fail(e);
    }
  });
}

// Second gate, P2 cleanup: idempotent and leak-free regardless of where a
// throw lands. `document.createElement('a')`, `appendChild`, and `click` are
// covered by the first try/catch — if any of them throws, whatever the
// anchor got attached is detached again (best-effort) and the object URL is
// revoked before this function re-throws, so the caller's containment (P1-1/
// A3 in ui/pairShare.js's own click handler) reports a truthful `failed`
// rather than leaking a floating `<a>`/object URL AND still reporting
// success. `a.remove()` after a successful `click()` is best-effort on its
// own: the download itself already started, so a failure to tidy the DOM
// afterward must not flip an already-truthful "downloaded" into "failed" —
// but the object URL is still guaranteed to be revoked (on the existing
// 1000ms grace timer, or immediately if scheduling that timer itself throws).
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  let a = null;
  try {
    a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
  } catch (e) {
    try { if (a && typeof a.remove === 'function') a.remove(); } catch (_) { /* best-effort */ }
    try { URL.revokeObjectURL(url); } catch (_) { /* best-effort */ }
    throw e;
  }
  try {
    a.remove();
  } catch (_) { /* best-effort — the download itself already fired */ }
  let revoked = false;
  const revoke = () => {
    if (revoked) return;
    revoked = true;
    try { URL.revokeObjectURL(url); } catch (_) { /* best-effort */ }
  };
  try {
    setTimeout(revoke, 1000);
  } catch (_) {
    revoke();
  }
}

// ── capability disclosure (audit C1, reworded for second-gate P2) ──────────
// Feature-detected ONCE, at init — capability is a property of the browser,
// not of any particular pair, so it needs no per-relation re-sync. Method
// presence (`typeof navigator.share === 'function'`) is necessary but not
// sufficient for an actual share to succeed — the platform can still refuse
// at call time for reasons this module cannot predict in advance (no share
// targets configured, a policy restriction, etc.) — so the disclosure text
// itself states the native path as CONDITIONAL ("when supported") and always
// names the on-device save as the fallback, rather than promising a direct
// share outright. When neither method exists at all, the wording collapses
// to a plain, unconditional image-save statement — nothing conditional to
// hedge.
function detectShareCapability() {
  try {
    return typeof navigator !== 'undefined'
      && typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function';
  } catch (_) {
    return false;
  }
}

export function pairImprintDisclosureText(capable) {
  return capable
    ? 'created on this device · personal details excluded · shares directly when your device supports it, otherwise saves as an image'
    : 'created on this device · personal details excluded · saves the pair imprint as an image on this device';
}

// ── the live relation read (second-gate P2 hook truth) ─────────────────────
// `hooks.getRelation` is the authoritative accessor; a throw from it is a
// READ FAILURE, distinguishable from a legitimate "nothing to share" (a
// clean `null`) and from a legitimate "the pair changed" (a different
// reference on a later read). `{ ok:false }` lets every caller tell those
// three apart instead of collapsing a broken hook into `empty` or into a
// false "the pair changed".
function readRelation(hooks) {
  try {
    return { ok: true, value: typeof hooks.getRelation === 'function' ? hooks.getRelation() : null };
  } catch (_) {
    return { ok: false, value: null };
  }
}

// ── native share, attempted SYNCHRONOUSLY (second-gate P1-4) ───────────────
// Every step here is synchronous EXCEPT the `navigator.share(...)` call
// itself, which returns a promise the caller awaits separately — the call
// site of `navigator.share` is what must happen with no prior `await`, and
// it does: `new File`, `navigator.canShare`, and the `navigator.share(...)`
// invocation all run in the same synchronous stretch this function executes
// in. Second-gate P1-1: a missing or throwing `File` constructor, or an
// absent `navigator` entirely, resolves to `{ attempted:false }` — never a
// block, never a `failed` outcome — so the caller always has a path to the
// on-device download fallback.
function trySyncNativeShare(blob, snapshot) {
  if (typeof navigator === 'undefined') return { attempted: false };
  let file = null;
  try {
    if (typeof File === 'function') {
      file = new File([blob], IMPRINT_FILENAME, { type: 'image/png' });
    }
  } catch (_) {
    file = null;
  }
  if (!file) return { attempted: false };
  const caption = buildPairImprintCaption(snapshot);
  let canShareFiles = false;
  try {
    // Evaluated with the EXACT payload navigator.share() below will
    // receive (files AND text) — canShare({files}) alone can answer yes
    // for a payload navigator.share() then refuses once `text` is
    // present.
    canShareFiles = typeof navigator.canShare === 'function'
      && !!navigator.canShare({ files: [file], text: caption });
  } catch (_) {
    canShareFiles = false;
  }
  if (!canShareFiles || typeof navigator.share !== 'function') return { attempted: false };
  try {
    const promise = navigator.share({ files: [file], text: caption });
    return { attempted: true, promise };
  } catch (_) {
    // Some platforms can throw synchronously rather than reject — contained
    // exactly like an async rejection would be: fall back, never block.
    return { attempted: false };
  }
}

// ── controller (second-gate P1-3) ───────────────────────────────────────
// One object per initPairShareUI() call. Nothing below this point reads or
// writes a module-level mutable field except `_activeController` itself
// (which only exists to retire the PRIOR controller on re-init) — every
// other piece of state (refs, hooks, cache, timers, in-flight flag, the
// operation token) lives on the controller instance a given click closed
// over, so two live controllers cannot interfere with each other and a
// retired controller's async tail cannot write anywhere.

let _activeController = null;

function applyBusyDOM(controller, busy) {
  const btn = controller.refs && controller.refs.btn;
  if (btn) {
    btn.disabled = !!busy;
    if (btn.setAttribute) btn.setAttribute('aria-busy', String(!!busy));
  }
}

function setStatus(controller, state) {
  if (controller.retired) return;
  const el = controller.refs && controller.refs.status;
  if (!el) return;
  const msg = pairShareStatusMessage(state);
  if (controller.statusTimer && typeof clearTimeout === 'function') {
    clearTimeout(controller.statusTimer);
    controller.statusTimer = null;
  }
  el.textContent = msg;
  el.hidden = !msg;
  if (msg && typeof setTimeout === 'function') {
    controller.statusTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }
}

function isPrerenderPending(controller) {
  const c = controller.cache;
  return !!(c && c.promise && !c.blob && !c.error);
}

// Reconciles the button's busy/disabled state with whatever the background
// pre-render is doing, EXCEPT while a click-triggered operation owns busy
// state (opInFlight) — the click's own start/finally bracket is
// authoritative during that window, so this function defers to it rather
// than fighting over the same DOM attributes. Called on every pre-render
// state transition (start, settle) so the button is disabled for exactly the
// window a click could not yet get a synchronous native-share attempt.
function syncBusyFromPrerender(controller) {
  if (controller.retired || controller.opInFlight) return;
  const pending = isPrerenderPending(controller);
  applyBusyDOM(controller, pending);
  const el = controller.refs && controller.refs.status;
  if (pending) {
    setStatus(controller, 'busy');
  } else if (el && el.textContent === pairShareStatusMessage('busy')) {
    // The pre-render just settled (or there is nothing to prepare) with no
    // click in flight — nothing was shared or saved, so there is no
    // terminal outcome to announce. Only ever clears OUR OWN "preparing…"
    // text, never a real terminal status a click already wrote.
    if (controller.statusTimer && typeof clearTimeout === 'function') {
      clearTimeout(controller.statusTimer);
      controller.statusTimer = null;
    }
    el.textContent = '';
    el.hidden = true;
  }
}

/**
 * The host's one relation-change notification (wired by index.html to fire
 * every time ui/dyad.js's `_relation` is assigned — on a successful render,
 * on a failed one, and on every clearOutput() call: close, Compare Another,
 * Previous Readings via closeActiveScreens, and the invalidate-first step of
 * a fresh submission). Rasterizes proactively so a later click can attempt
 * `navigator.share()` with no intervening `await` (second-gate P1-4). The
 * cache is replaced WHOLESALE on every call (a fresh object, or null) — an
 * in-flight rasterization from a SUPERSEDED entry checks object identity
 * against `controller.cache` before writing its result, so it can never
 * resurrect a dead cache slot or clobber a newer one.
 */
function notifyRelationChange(controller, relation) {
  if (controller.retired) return;
  const snapshot = relation ? buildPairImprintSnapshot(relation) : null;
  if (!snapshot) {
    controller.cache = null;
    syncBusyFromPrerender(controller);
    return;
  }
  const entry = { relation, snapshot, blob: null, error: null, promise: null };
  entry.promise = svgToPngBlob(buildPairImprintSVG(snapshot), PNG_W, PNG_H);
  entry.promise.then(
    blob => {
      if (controller.retired || controller.cache !== entry) return;
      entry.blob = blob;
      syncBusyFromPrerender(controller);
    },
    err => {
      if (controller.retired || controller.cache !== entry) return;
      entry.error = err;
      syncBusyFromPrerender(controller);
    },
  );
  controller.cache = entry;
  syncBusyFromPrerender(controller);
}

// Re-read the relation and compare it against what the operation started
// with. Called after EVERY async boundary the click flow crosses (second-
// gate P1-2): a resolved OR rejected navigator.share(), a resolved OR
// rejected clipboard.writeText(), and the pending pre-render promise. A
// throwing hook is reported distinctly from a changed pair (second-gate P2
// hook truth) so a broken read is never mistaken for "the reader moved on".
function recheck(controller, myToken, relationAtStart) {
  if (controller.retired || controller.opToken !== myToken) return { stale: true, failed: false };
  const read = readRelation(controller.hooks);
  if (!read.ok) return { stale: false, failed: true };
  if (read.value !== relationAtStart) return { stale: true, failed: false };
  return { stale: false, failed: false };
}

async function downloadFallback(controller, myToken, relationAtStart, snapshot, blob) {
  const caption = buildPairImprintCaption(snapshot);
  let downloaded = false;
  try {
    downloadBlob(blob, IMPRINT_FILENAME);
    downloaded = true;
  } catch (_) {
    downloaded = false;
  }
  if (!downloaded) { setStatus(controller, 'failed'); return; }

  let copied = false;
  if (typeof navigator !== 'undefined'
    && navigator.clipboard
    && typeof navigator.clipboard.writeText === 'function') {
    let clipboardOk = false;
    try {
      await navigator.clipboard.writeText(caption);
      clipboardOk = true;
    } catch (_) { /* clipboard denied — the download still landed */ }
    // P1-2: re-check AFTER this await REGARDLESS of whether the write
    // resolved or rejected — a clipboard call is a real async boundary the
    // pair can change across either way, and "the pair changed" must be
    // reported over both "copied" and "denied" once it has.
    const check = recheck(controller, myToken, relationAtStart);
    if (check.failed) { setStatus(controller, 'failed'); return; }
    if (check.stale) { setStatus(controller, 'stale'); return; }
    copied = clipboardOk;
  }
  setStatus(controller, copied ? 'downloaded-copied' : 'downloaded');
}

// The fast path: a cached Blob is already ready at click time, so a native
// share attempt can still happen with transient activation intact. Every
// step up to and including `navigator.share(...)`'s CALL is synchronous;
// only the returned promise is awaited.
async function shareOrFallback(controller, myToken, relationAtStart, snapshot, blob) {
  const attempt = trySyncNativeShare(blob, snapshot);
  if (attempt.attempted) {
    try {
      await attempt.promise;
      const check = recheck(controller, myToken, relationAtStart);
      if (check.failed) { setStatus(controller, 'failed'); return; }
      if (check.stale) { setStatus(controller, 'stale'); return; }
      setStatus(controller, 'shared');
      return;
    } catch (err) {
      const check = recheck(controller, myToken, relationAtStart);
      if (check.failed) { setStatus(controller, 'failed'); return; }
      if (check.stale) { setStatus(controller, 'stale'); return; }
      if (err && err.name === 'AbortError') { setStatus(controller, 'cancelled'); return; }
      // Second-gate P1-4: a non-Abort rejection (NotAllowedError included)
      // preserves the local download — the platform only refused to open
      // its OWN chooser; the PNG this device already rendered is still
      // right here.
      await downloadFallback(controller, myToken, relationAtStart, snapshot, blob);
      return;
    }
  }
  // No native share attempted (unsupported / File failed / canShare false)
  // — still fully synchronous so far; fall straight through.
  await downloadFallback(controller, myToken, relationAtStart, snapshot, blob);
}

function onShareClick(controller) {
  return (async () => {
    if (controller.retired || controller.opInFlight) return;
    const read = readRelation(controller.hooks);
    if (!read.ok) { setStatus(controller, 'failed'); return; } // P2 hook truth: a throw is a read failure, not "empty"
    const relationAtStart = read.value;
    const snapshot = buildPairImprintSnapshot(relationAtStart);
    if (!snapshot) { setStatus(controller, 'empty'); return; }

    const myToken = ++controller.opToken;
    controller.opInFlight = true;
    applyBusyDOM(controller, true);
    setStatus(controller, 'busy');
    try {
      const cacheEntry = controller.cache;
      const cacheMatches = !!(cacheEntry && cacheEntry.relation === relationAtStart);

      if (cacheMatches && cacheEntry.blob) {
        await shareOrFallback(controller, myToken, relationAtStart, snapshot, cacheEntry.blob);
        return;
      }

      let blob;
      if (cacheMatches && cacheEntry.error) {
        setStatus(controller, 'failed');
        return;
      }
      try {
        blob = cacheMatches && cacheEntry.promise
          ? await cacheEntry.promise
          : await svgToPngBlob(buildPairImprintSVG(snapshot), PNG_W, PNG_H);
      } catch (_) {
        const check = recheck(controller, myToken, relationAtStart);
        setStatus(controller, check.stale ? 'stale' : 'failed');
        return;
      }
      // P1-2: re-check after the render/wait await, before any side effect.
      const check = recheck(controller, myToken, relationAtStart);
      if (check.failed) { setStatus(controller, 'failed'); return; }
      if (check.stale) { setStatus(controller, 'stale'); return; }
      // Activation was already lost waiting for this render — download-only,
      // never a native share attempt (second-gate P1-4: "enable activation
      // only when the blob is ready" at CLICK time, not after the fact).
      await downloadFallback(controller, myToken, relationAtStart, snapshot, blob);
    } catch (_) {
      setStatus(controller, 'failed');
    } finally {
      if (!controller.retired && controller.opToken === myToken) {
        controller.opInFlight = false;
        syncBusyFromPrerender(controller);
      }
    }
  })();
}

/**
 * DI injection (refs + hooks at boot).
 * refs:  { btn, status, disclosure? } — the "share the pair" button, its
 *        atomic polite live region, and (optionally) the pre-action
 *        disclosure node — all injected by ui/dyad.js's SCREEN_HTML, looked
 *        up and wired here — this module never creates them.
 * hooks: { getRelation() } — returns ui/dyad.js's currentRelation(), the
 *        last FORMATTED relation record, or null.
 * Returns { onShareClick, notifyRelationChange } — the second is the seam
 * index.html wires into ui/dyad.js's own hooks (as `onRelationChange`) so
 * this module can pre-render without ever importing ui/dyad.js.
 */
export function initPairShareUI(refs, hooks) {
  // Second-gate P1-3: retire whatever controller a prior init created BEFORE
  // constructing the new one, so an in-flight operation from that instance
  // can never write into the new refs and a stray leftover click listener
  // never piles up on a re-initialized DOM node.
  if (_activeController) {
    const prior = _activeController;
    prior.retired = true;
    const priorBtn = prior.refs && prior.refs.btn;
    if (priorBtn && typeof priorBtn.removeEventListener === 'function' && prior.listener) {
      priorBtn.removeEventListener('click', prior.listener);
    }
  }

  const controller = {
    refs: refs || {},
    hooks: hooks || {},
    retired: false,
    opToken: 0,
    opInFlight: false,
    cache: null,
    statusTimer: null,
    listener: null,
  };
  controller.listener = () => onShareClick(controller);
  if (controller.refs.btn && typeof controller.refs.btn.addEventListener === 'function') {
    controller.refs.btn.addEventListener('click', controller.listener);
  }
  const disclosureEl = controller.refs.disclosure;
  if (disclosureEl) disclosureEl.textContent = pairImprintDisclosureText(detectShareCapability());

  _activeController = controller;
  return {
    onShareClick: controller.listener,
    notifyRelationChange: relation => notifyRelationChange(controller, relation),
  };
}
