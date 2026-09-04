// 8ball / ui / pairShare.js — the Pair Imprint (DOCTRINE §5.D / §1.J v0.79)
//
// A DEDICATED, narrow share surface for the paired reading — deliberately a
// separate module from ui/share.js rather than a second call into it. That
// module's builder reads the live DOM sheet snapshot for ONE person
// (shareRowRefs); this module never touches a sheet, a profile, or ANY DOM
// beyond the two refs it is handed at init (its own button + status node).
//
// INPUT BOUNDARY, stated as the whole of this module's privacy contract: the
// only data this file ever sees is whatever `hooks.getRelation()` returns —
// wired by index.html to ui/dyad.js's currentRelation() getter, which hands
// back the FORMATTED relation record (formatDyadRelation's return shape),
// never a profile, never a sheet, never form fields. buildPairImprintSnapshot
// below then narrows THAT further: it reads exactly three fields off it by
// name and discards everything else — the meaning prose, the qualifier, the
// full citations, all of it. What the snapshot cannot contain, it cannot
// leak; that is the allow-list construction the brief's risk register asks
// for, done by never spreading the input object.
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
// Network: none. The only outbound surfaces are the user's own native share
// sheet and clipboard — no fetch, no beacon, no telemetry (§5/§7).
// Storage: none — no localStorage key is named, read or written here.

// ── constants ─────────────────────────────────────────────────────
const SITE_HOST = 'the-eight-ball.netlify.app';
const SITE_URL = `https://${SITE_HOST}`;
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

export function buildPairImprintSVG(snapshot) {
  const s = snapshot || {};
  const rows = SIGNATURE_ROWS.map((row, i) => {
    const y = 560 + i * 220;
    return (
      `<text x="${PNG_W / 2}" y="${y}" text-anchor="middle" font-family="${FONT}" ` +
      `font-size="26" letter-spacing="2" fill="${LABEL}">${esc(row.label)}</text>` +
      `<text x="${PNG_W / 2}" y="${y + 56}" text-anchor="middle" font-family="${FONT}" ` +
      `font-size="42" font-weight="600" fill="${INK}">${esc(s[row.key])}</text>`
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
// exception) — the first is "nothing to share yet", the second is "tried
// and it broke". `native-share unavailable` has no message of its own: it
// is the CONDITION that routes to the download-fallback branch below, which
// resolves to `downloaded` or `downloaded-copied`.
export function pairShareStatusMessage(state) {
  switch (state) {
    case 'busy': return 'preparing pair image…';
    case 'shared': return 'shared.';
    case 'downloaded': return 'image saved to this device.';
    case 'downloaded-copied': return 'image saved · caption copied.';
    case 'cancelled': return 'share cancelled.';
    // A2: the pair changed (closed, replaced, or a new one submitted)
    // while this export was in flight — distinct from `failed` (a genuine
    // exception) and from `cancelled` (the reader dismissed a native
    // chooser); nothing was shared or saved for the stale pair.
    case 'stale': return 'the pair changed. share the pair again.';
    case 'empty': return 'nothing to share yet — read a pair first.';
    case 'failed': return 'share failed. image not saved.';
    default: return '';
  }
}

// ── SVG → PNG Blob (on-device only) ─────────────────────────────────

function svgToPngBlob(svg, width, height) {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
          'image/png',
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image failed to load'));
    };
    img.src = url;
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── capability disclosure (audit C1) ────────────────────────────────
// Feature-detected ONCE, at init — capability is a property of the browser,
// not of any particular pair, so it needs no per-relation re-sync. Never
// claims certainty about what WILL happen (a full canShare check needs an
// actual File, which does not exist until a click starts rasterizing); it
// discloses what CAN happen, in clinical, non-technical wording, before the
// reader ever presses the button.
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
    ? 'created on this device · personal details excluded · shares the pair imprint directly'
    : 'created on this device · personal details excluded · saves the pair imprint as an image on this device';
}

// ── DI injection (refs + hooks at boot) ───────────────────────────
// refs:  { btn, status, disclosure? } — the "share the pair" button, its
//        atomic polite live region, and (optionally) the pre-action
//        disclosure node — all injected by ui/dyad.js's SCREEN_HTML, looked
//        up and wired here — this module never creates them.
// hooks: { getRelation() } — returns ui/dyad.js's currentRelation(), the
//        last FORMATTED relation record, or null.
let _refs = null;
let _hooks = null;
let _statusTimer = null;
// Operation identity guard (audit A2). Bumped on every init (a re-init
// invalidates any operation an EARLIER instance started) and captured at
// the top of every click; combined with a fresh read of getRelation()
// re-checked after each async boundary, this catches all four named
// invalidation triggers without ui/dyad.js ever importing this module:
// reset/close and relation replacement change what getRelation() returns
// (a fresh object, or null); re-init changes the generation number.
let _generation = 0;
let _opInFlight = false;

function relationNow() {
  try {
    return typeof _hooks.getRelation === 'function' ? _hooks.getRelation() : null;
  } catch (_) {
    return null;
  }
}

function staleOperation(startGeneration, relationAtStart) {
  return _generation !== startGeneration || relationNow() !== relationAtStart;
}

function setStatus(state) {
  const el = _refs && _refs.status;
  if (!el) return;
  const msg = pairShareStatusMessage(state);
  if (_statusTimer && typeof clearTimeout === 'function') { clearTimeout(_statusTimer); _statusTimer = null; }
  el.textContent = msg;
  el.hidden = !msg;
  if (msg && typeof setTimeout === 'function') {
    _statusTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }
}

// Busy state (audit C2): disables the control and announces preparation
// on entry; on exit it clears ONLY disabled/aria-busy — the terminal
// setStatus() call that already ran (empty/stale/shared/downloaded/.../
// failed) owns the visible text, so leaving it alone here is what makes
// "clear it on every terminal path" true rather than a race between two
// writers.
function setBusy(busy) {
  const btn = _refs && _refs.btn;
  if (btn) {
    btn.disabled = !!busy;
    if (btn.setAttribute) btn.setAttribute('aria-busy', String(!!busy));
  }
  if (busy) setStatus('busy');
}

async function onShareClick() {
  // A2: permit only one active operation — a second click (synthetic or a
  // native click racing a disabled-but-not-yet-repainted button) is a
  // silent no-op rather than a second concurrent export.
  if (_opInFlight) return;
  const startGeneration = _generation;
  const relationAtStart = relationNow();
  const snapshot = buildPairImprintSnapshot(relationAtStart);
  if (!snapshot) { setStatus('empty'); return; }

  _opInFlight = true;
  setBusy(true);
  try {
    let blob;
    try {
      blob = await svgToPngBlob(buildPairImprintSVG(snapshot), PNG_W, PNG_H);
    } catch (_) {
      setStatus('failed');
      return;
    }
    // A2: the pair may have closed, been replaced, or Compare Another may
    // have fired while rasterization was in flight — recheck before any
    // side effect can act on what is now a stale artifact.
    if (staleOperation(startGeneration, relationAtStart)) { setStatus('stale'); return; }

    const caption = buildPairImprintCaption(snapshot);
    let file;
    try {
      // A3: `new File` can throw in an environment without a File
      // constructor (or a polyfill gap) — contained independently so a
      // missing constructor degrades to a truthful "failed" rather than an
      // unhandled rejection.
      file = new File([blob], IMPRINT_FILENAME, { type: 'image/png' });
    } catch (_) {
      setStatus('failed');
      return;
    }

    let canShareFiles = false;
    try {
      // A3: evaluated with the EXACT payload navigator.share() below will
      // receive (files AND text) — canShare({files}) alone can answer yes
      // for a payload navigator.share() then refuses once `text` is
      // present, which the first version of this function did not guard.
      canShareFiles = typeof navigator !== 'undefined'
        && typeof navigator.canShare === 'function'
        && !!navigator.canShare({ files: [file], text: caption });
    } catch (_) {
      canShareFiles = false;
    }

    if (canShareFiles && typeof navigator.share === 'function') {
      if (staleOperation(startGeneration, relationAtStart)) { setStatus('stale'); return; }
      try {
        await navigator.share({ files: [file], text: caption });
        setStatus('shared');
      } catch (err) {
        // The platform opened a chooser; it does not follow that anything
        // was shared. A user-dismissed sheet rejects with AbortError —
        // report that as cancelled, distinct from a genuine share failure,
        // and never as success ("without claiming success when the
        // platform only opened a chooser").
        setStatus(err && err.name === 'AbortError' ? 'cancelled' : 'failed');
      }
      return;
    }

    // Desktop / unsupported fallback: download, independently contained
    // from the clipboard copy so a clipboard failure can never invalidate
    // an already-successful download (A3).
    if (staleOperation(startGeneration, relationAtStart)) { setStatus('stale'); return; }
    let downloaded = false;
    try {
      downloadBlob(blob, IMPRINT_FILENAME);
      downloaded = true;
    } catch (_) {
      downloaded = false;
    }
    if (!downloaded) { setStatus('failed'); return; }

    let copied = false;
    try {
      if (typeof navigator !== 'undefined'
        && navigator.clipboard
        && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(caption);
        copied = true;
      }
    } catch (_) { /* clipboard denied — the download still landed */ }
    setStatus(copied ? 'downloaded-copied' : 'downloaded');
  } catch (_) {
    // A3: "contain the complete action and always settle to a truthful
    // accessible state" — a catch-all so nothing above (however unlikely)
    // can escape as an unhandled rejection and leave the status stuck on
    // "preparing pair image…".
    setStatus('failed');
  } finally {
    _opInFlight = false;
    setBusy(false);
  }
}

export function initPairShareUI(refs, hooks) {
  _generation += 1; // A2: invalidates any operation a prior instance started
  _opInFlight = false;
  _refs = refs || {};
  _hooks = hooks || {};
  if (_refs.btn && _refs.btn.addEventListener) {
    _refs.btn.addEventListener('click', onShareClick);
  }
  const disclosureEl = _refs.disclosure;
  if (disclosureEl) disclosureEl.textContent = pairImprintDisclosureText(detectShareCapability());
  return { onShareClick };
}
