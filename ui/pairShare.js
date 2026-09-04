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
    `<text x="${PNG_W / 2}" y="1200" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="26" letter-spacing="1.5" fill="${LABEL}">${esc(s.disclosure)}</text>` +
    `<text x="${PNG_W / 2}" y="1240" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="24" letter-spacing="1.2" fill="${LABEL}">${esc(s.privacyLine)}</text>` +
    `<text x="${PNG_W / 2}" y="1300" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="26" letter-spacing="1.5" fill="${INK}">${esc(s.url)}</text>` +
    `</svg>`
  );
}

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
    case 'shared': return 'shared.';
    case 'downloaded': return 'image saved to this device.';
    case 'downloaded-copied': return 'image saved · caption copied.';
    case 'cancelled': return 'share cancelled.';
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

// ── DI injection (refs + hooks at boot) ───────────────────────────
// refs:  { btn, status } — the "share the pair" button and its atomic
//        polite live region (both injected by ui/dyad.js's SCREEN_HTML,
//        looked up and wired here — this module never creates them).
// hooks: { getRelation() } — returns ui/dyad.js's currentRelation(), the
//        last FORMATTED relation record, or null.
let _refs = null;
let _hooks = null;
let _statusTimer = null;

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

async function onShareClick() {
  const relation = typeof _hooks.getRelation === 'function' ? _hooks.getRelation() : null;
  const snapshot = buildPairImprintSnapshot(relation);
  if (!snapshot) { setStatus('empty'); return; }

  let blob;
  try {
    blob = await svgToPngBlob(buildPairImprintSVG(snapshot), PNG_W, PNG_H);
  } catch (_) {
    setStatus('failed');
    return;
  }
  const caption = buildPairImprintCaption(snapshot);
  const file = new File([blob], IMPRINT_FILENAME, { type: 'image/png' });

  if (
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({ files: [file], text: caption });
      setStatus('shared');
    } catch (err) {
      // The platform opened a chooser; it does not follow that anything was
      // shared. A user-dismissed sheet rejects with AbortError — report
      // that as cancelled, distinct from a genuine share failure, and never
      // as success (Step 2: "without claiming success when the platform
      // only opened a chooser").
      setStatus(err && err.name === 'AbortError' ? 'cancelled' : 'failed');
    }
    return;
  }

  // Desktop / unsupported fallback: download + clipboard copy of the
  // caption (which carries the bare host).
  downloadBlob(blob, IMPRINT_FILENAME);
  let copied = false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(caption);
      copied = true;
    } catch (_) { /* clipboard denied — the download still landed */ }
  }
  setStatus(copied ? 'downloaded-copied' : 'downloaded');
}

export function initPairShareUI(refs, hooks) {
  _refs = refs || {};
  _hooks = hooks || {};
  if (_refs.btn && _refs.btn.addEventListener) {
    _refs.btn.addEventListener('click', onShareClick);
  }
  return { onShareClick };
}
