// 8ball / ui/share.js
// v0.4.0 share-surface controller (DOCTRINE §5.D v0.31 / §6; tier-aware
// per §5.D v0.36, v0.6.0).
//
// Owns:
//   - the #share-btn click handler on the result surface
//   - card-to-image: serialize the rendered card as an SVG string, raster
//     it through an offscreen <canvas>, emit a PNG Blob.
//     v0.39 (§5.D): the builder renders the FULL specimen sheet per
//     compartment — open cells carry their value; sealed cells render an
//     SVG hatch + label with the VALUE absent (each row ref carries its
//     per-cell {state, value}). The sealed value never exists in the
//     snapshot, so it cannot reach the artifact (a mixed row shows its
//     open value beside its sealed compartment; paid users emit more open).
//   - the share flow: Web Share API (navigator.share with the PNG file +
//     a clinical caption) where available; otherwise a local PNG download
//     + clipboard copy of the caption (catalog + open coords + bare URL),
//     with a transient inline confirmation
//
// Does NOT own:
//   - any profile / card-content state. The image builder reads ONLY the
//     per-row snapshot refs (each row's title + per-cell {state, value},
//     DOM-derived in ui/tiers.js) and the catalog number. It never touches
//     the paid card-content layer (name/type/habit/note) and never reads a
//     profile object — and a sealed cell carries no value — so name, DOB,
//     and paid coordinate values cannot reach the shared artifact
//     (DOCTRINE §5.D invariants a/b).
//   - tier resolution. The per-cell state (open / sealed / unres) is decided
//     by ui/tiers.js at render time; this module renders each compartment
//     from the state it finds (sealed → hatch, value absent).
//
// Network: none. SVG → canvas → toBlob is entirely on-device; the only
// outbound surfaces are the user's own native share sheet and clipboard.
// No fetch / XHR / beacon is introduced — §5 same-origin/no-beacon and
// §7 no-telemetry are preserved (DOCTRINE §5.D invariant c). DI shape
// mirrors ui/payments.js initPaywallUI and ui/profile.js initProfileUI.

// ── constants ─────────────────────────────────────────────────────
// The bare production URL is the only discovery handle that travels
// with a shared card (carried in the image footer, and copied to the
// clipboard on the desktop fallback). No query parameters, no profile
// fields — §5.D invariant (b).
const SITE_URL = 'https://the-eight-ball.netlify.app';
const BRAND_WORDMARK = '8ball';

// Specimen-card geometry, in SVG user-space units. SCALE rasters the
// PNG at higher density so the mono type stays crisp on retina shares.
// Row positions are computed from the row count (the stack distributes
// evenly between STACK_TOP and STACK_BOTTOM). v0.39: all 8 rows render at
// every tier (the full sheet); the geometry still holds 1..8 rows by count.
const CARD_W = 320;
const CARD_H = 480;
const SCALE = 3;
const SAFE_X = 30;
const HEADER_Y = 43;
const STACK_TOP = 86;
const STACK_BOTTOM = 398;
const FOOTER_Y = 442;

// Grayscale specimen palette, mirroring the on-screen free card
// (index.html :root --paper / --ink / --label / --rule).
const PAPER = '#ebe5d4';
const INK = '#1a1812';
const LABEL = '#5a5444';
const RULE = '#8a8472';
const FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ── DI injection (refs + hooks at boot) ───────────────────────────
// refs:  { btn, status, catalog, symbols: [...] } — the eight row snapshot
//        refs from ui/tiers.js shareRowRefs(), in DOM order. Each exposes
//        { title, cells: [{state, value}] } read from live cell state;
//        sealed cells carry no value (§5.D v0.39). The full sheet renders.
// hooks: reserved for parity with the other ui/*.js modules; unused today.
let _refs = null;
let _hooks = null;

export function initShareUI(refs, hooks) {
  _refs = refs;
  _hooks = hooks || {};
  if (_refs && _refs.btn) {
    _refs.btn.addEventListener('click', onShare);
  }
}

// ── card → SVG ────────────────────────────────────────────────────
// Reads only the per-row snapshot refs injected via refs.symbols — each
// carries the row TITLE and its per-cell {state, value} (DOM-derived in
// ui/tiers.js). Plus the catalog number. Nothing else from the DOM.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCardSVGFromSnapshot(snapshot) {
  const safeSnapshot = snapshot || {};
  const catalog = esc(safeSnapshot.catalog || '');
  const sectionItems = Array.isArray(safeSnapshot.sections)
    ? safeSnapshot.sections
    : [];
  // Even vertical distribution: row i is centered in slot i of n equal
  // slots between the stack rules; +2 balances the title (-14) and cell
  // (+10) clearance from the slot separators above and below the pair.
  const n = Math.max(sectionItems.length, 1);
  const slot = (STACK_BOTTOM - STACK_TOP) / n;
  const rowY = i => STACK_TOP + slot * (i + 0.5) + 2;
  const separators = sectionItems.slice(1).map((_, i) => {
    const y = STACK_TOP + slot * (i + 1);
    return (
      `<line x1="${SAFE_X}" y1="${y}" x2="${CARD_W - SAFE_X}" y2="${y}" ` +
      `stroke="${RULE}" stroke-width="0.4" opacity="0.22"/>`
    );
  }).join('');
  const sections = sectionItems.map((item, i) => {
    const cy = rowY(i);
    const title = esc(item && item.title);
    const cells = item && Array.isArray(item.cells) ? item.cells : [];
    const m = Math.max(cells.length, 1);
    const cellW = (CARD_W - 2 * SAFE_X) / m;
    // Per-cell render (§5.D v0.39): every compartment shows — a mixed row
    // surfaces both its open value(s) AND its sealed compartment(s). A
    // sealed cell draws a hatch bar, NEVER a value (DOM-derived: sealed
    // cells carry no value). Open / unresolved cells render their text (the
    // `—` empty field stays an empty field, no seal — F4).
    const body = cells.map((cell, j) => {
      const cx = SAFE_X + cellW * (j + 0.5);
      if (cell && cell.state === 'sealed') {
        const w = Math.min(cellW - 18, 44);
        return (
          `<rect x="${cx - w / 2}" y="1" width="${w}" height="10" ` +
          `fill="url(#seal-hatch)" stroke="${RULE}" stroke-width="0.4"/>`
        );
      }
      return (
        `<text x="${cx}" y="10" text-anchor="middle" font-family="${FONT}" ` +
        `font-size="13" font-weight="600" fill="${INK}">${esc(cell && cell.value)}</text>`
      );
    }).join('');
    return (
      `<g transform="translate(0 ${cy})">` +
      `<text x="${CARD_W / 2}" y="-14" text-anchor="middle" ` +
      `font-family="${FONT}" font-size="9" letter-spacing="1.25" fill="${LABEL}">${title}</text>` +
      body +
      `</g>`
    );
  }).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W * SCALE}" height="${CARD_H * SCALE}" ` +
    `viewBox="0 0 ${CARD_W} ${CARD_H}">` +
    `<defs><pattern id="seal-hatch" width="6" height="6" patternUnits="userSpaceOnUse" ` +
    `patternTransform="rotate(45)"><rect width="6" height="6" fill="${PAPER}"/>` +
    `<line x1="0" y1="0" x2="0" y2="6" stroke="${RULE}" stroke-width="0.8" opacity="0.4"/></pattern></defs>` +
    `<rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" fill="${PAPER}"/>` +
    `<rect x="16" y="16" width="${CARD_W - 32}" height="${CARD_H - 32}" fill="none" stroke="${RULE}" stroke-width="1"/>` +
    `<text x="${SAFE_X}" y="${HEADER_Y}" text-anchor="start" font-family="${FONT}" ` +
    `font-size="16" font-weight="600" letter-spacing="1.1" fill="${INK}">${BRAND_WORDMARK}</text>` +
    `<text x="${CARD_W - SAFE_X}" y="${HEADER_Y - 2}" text-anchor="end" font-family="${FONT}" font-size="9" ` +
    `letter-spacing="1.4" fill="${LABEL}">${catalog}</text>` +
    `<line x1="${SAFE_X}" y1="${STACK_TOP}" x2="${CARD_W - SAFE_X}" y2="${STACK_TOP}" ` +
    `stroke="${RULE}" stroke-width="0.75"/>` +
    separators +
    sections +
    `<line x1="${SAFE_X}" y1="${STACK_BOTTOM}" x2="${CARD_W - SAFE_X}" y2="${STACK_BOTTOM}" ` +
    `stroke="${RULE}" stroke-width="0.75"/>` +
    `<text x="${CARD_W / 2}" y="${FOOTER_Y}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="9" letter-spacing="1" fill="${LABEL}">${esc(SITE_URL.replace(/^https:\/\//, ''))}</text>` +
    `</svg>`
  );
}

// §5.D v0.39: render every row's every cell. The refs (from ui/tiers.js
// shareRowRefs) carry per-cell {state, value}; sealed cells carry no value,
// so a paid coordinate value cannot reach the artifact.
function rowSections(rows) {
  return rows.map(row => ({
    title: row ? row.title : '',
    cells: (row && Array.isArray(row.cells) ? row.cells : []).map(c => ({
      state: c ? c.state : 'open',
      value: c && c.state === 'sealed' ? '' : (c ? c.value : ''),
    })),
  }));
}

function buildCardSVG() {
  return buildCardSVGFromSnapshot({
    catalog: _refs && _refs.catalog ? _refs.catalog.textContent.trim() : '',
    sections: rowSections((_refs && _refs.symbols) || []),
  });
}

// ── caption (§5.D v0.39) ──────────────────────────────────────────
// A clinical, paste-ready caption built from the SAME per-cell snapshot as
// the PNG: catalog numeral + the open coordinate values + a `sealed
// remainder` marker when any cell is sealed + the bare production URL. No
// name/DOB, no profile read, no per-result parameter (invariants a/b).
// Sealed cells contribute no value; `—` unresolved fields are skipped.
export function buildCaptionFromSnapshot(snapshot) {
  const s = snapshot || {};
  const catalog = String(s.catalog == null ? '' : s.catalog).trim();
  const sections = Array.isArray(s.sections) ? s.sections : [];
  const open = [];
  let sealed = false;
  for (const sec of sections) {
    const cells = sec && Array.isArray(sec.cells) ? sec.cells : [];
    for (const c of cells) {
      if (!c) continue;
      if (c.state === 'sealed') { sealed = true; continue; }
      const v = String(c.value == null ? '' : c.value).trim();
      if (v && v !== '—') open.push(v);
    }
  }
  const head = catalog ? `${BRAND_WORDMARK} specimen ${catalog}` : `${BRAND_WORDMARK} specimen`;
  const parts = [head];
  if (open.length) parts.push(open.join(' · '));
  if (sealed) parts.push('sealed remainder');
  return `${parts.join(' · ')}\n${SITE_URL}`;
}

function buildCaption() {
  return buildCaptionFromSnapshot({
    catalog: _refs && _refs.catalog ? _refs.catalog.textContent.trim() : '',
    sections: rowSections((_refs && _refs.symbols) || []),
  });
}

// ── SVG → PNG Blob ────────────────────────────────────────────────
// Rasters the SVG string through an Image + offscreen canvas. Fully
// on-device; the object URL is same-origin (a blob: URL of our own
// bytes) and revoked as soon as it is consumed.

function renderCardPng() {
  return new Promise((resolve, reject) => {
    const svg = buildCardSVG();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = CARD_W * SCALE;
        canvas.height = CARD_H * SCALE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
          'image/png'
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

// ── share flow ────────────────────────────────────────────────────
// Mobile / supported: hand the PNG file + the clinical caption (text) to
// the native share sheet via navigator.share. Desktop / unsupported:
// download the PNG and copy the caption (catalog + open coords + bare URL)
// to the clipboard, then surface a transient confirmation. Any failure
// (including the user dismissing the share sheet) is swallowed silently —
// no retry, no telemetry (§7).

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

function flashStatus(msg) {
  const el = _refs && _refs.status;
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  void el.offsetWidth; // force reflow so the opacity transition fires
  el.classList.add('visible');
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => { el.hidden = true; }, 400);
  }, 3000);
}

async function onShare() {
  let blob;
  try {
    blob = await renderCardPng();
  } catch (_) {
    return; // render failed — nothing to share, fail silent
  }
  // §5.D v0.39 / H5: the caption travels WITH the artifact so a shared PNG
  // never lands captionless (the paywall-screenshot misread). DOM-derived,
  // no PII.
  const caption = buildCaption();
  const file = new File([blob], 'eight-ball.png', { type: 'image/png' });
  if (
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({ files: [file], text: caption });
    } catch (_) {
      // user dismissed the sheet or share rejected — no fallback noise
    }
    return;
  }
  // Desktop / unsupported fallback: download + clipboard copy of the
  // caption (which carries the bare URL), not the bare URL alone.
  downloadBlob(blob, 'eight-ball.png');
  let copied = false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(caption);
      copied = true;
    } catch (_) {}
  }
  flashStatus(copied ? 'image saved · caption copied' : 'image saved');
}
