// 8ball / ui/share.js
// v0.4.0 share-surface controller (DOCTRINE §5.D v0.31 / §6; tier-aware
// per §5.D v0.36, v0.6.0).
//
// Owns:
//   - the #share-btn click handler on the result surface
//   - card-to-image: serialize the rendered, symbols-only card as an SVG
//     string, raster it through an offscreen <canvas>, emit a PNG Blob.
//     v0.6.0: the builder is tier-aware by construction — it reads the
//     rendered coordinate rows and skips rows the tier gate has hidden,
//     so the PNG matches the card at the user's current render tier
//     (paid users emit denser PNGs; §5.D v0.36 / brief §3).
//   - the share flow: Web Share API (navigator.share with the PNG file)
//     where available; otherwise a local PNG download + clipboard copy
//     of the bare production URL, with a transient inline confirmation
//
// Does NOT own:
//   - any profile / card-content state. The image builder reads ONLY the
//     rendered coordinate symbol nodes (+ their section titles and the
//     catalog number) from the live DOM. It never touches the paid
//     card-content layer (name/type/habit/note) and never reads a
//     profile object — so name and DOB cannot reach the shared artifact
//     (DOCTRINE §5.D invariants a/b).
//   - tier resolution. Row visibility is decided by ui/tiers.js at
//     render time; this module only respects the hidden state it finds.
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
// v0.6.0: row positions are computed from the row count (the stack
// distributes evenly between STACK_TOP and STACK_BOTTOM) so the card
// holds anywhere from the 3-row free render to the 8-row t3 render.
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
// refs:  { btn, status, catalog, symbols: [arcana, elem, sun, animal, numerology] }
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
// Reads only the free coordinate symbol nodes injected via refs.symbols
// and, for each, the sibling .coord-title text inside the same
// .coord-section. Plus the catalog number. Nothing else from the DOM.

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function titleFor(symbolNode) {
  const section = symbolNode.closest ? symbolNode.closest('.coord-section') : null;
  const titleNode = section ? section.querySelector('.coord-title') : null;
  return titleNode ? titleNode.textContent.trim() : '';
}

export function buildCardSVGFromSnapshot(snapshot) {
  const safeSnapshot = snapshot || {};
  const catalog = esc(safeSnapshot.catalog || '');
  const sectionItems = Array.isArray(safeSnapshot.sections)
    ? safeSnapshot.sections
    : [];
  // Even vertical distribution: row i is centered in slot i of n equal
  // slots between the stack rules; +8 optically centers the title+symbol
  // pair (title sits at -14, symbol at +10 relative to the row origin).
  const n = Math.max(sectionItems.length, 1);
  const slot = (STACK_BOTTOM - STACK_TOP) / n;
  const rowY = i => STACK_TOP + slot * (i + 0.5) + 8;
  const separators = sectionItems.slice(1).map((_, i) => {
    const y = STACK_TOP + slot * (i + 1);
    return (
      `<line x1="${SAFE_X}" y1="${y}" x2="${CARD_W - SAFE_X}" y2="${y}" ` +
      `stroke="${RULE}" stroke-width="0.5" opacity="0.35"/>`
    );
  }).join('');
  const sections = sectionItems.map((item, i) => {
    const cy = rowY(i);
    const title = esc(item && item.title);
    const symbol = esc(item && item.symbol);
    return (
      `<g transform="translate(0 ${cy})">` +
      `<text x="${CARD_W / 2}" y="-14" text-anchor="middle" ` +
      `font-family="${FONT}" font-size="9" letter-spacing="1.25" fill="${LABEL}">${title}</text>` +
      `<text x="${CARD_W / 2}" y="10" text-anchor="middle" ` +
      `font-family="${FONT}" font-size="14" font-weight="600" fill="${INK}">${symbol}</text>` +
      `</g>`
    );
  }).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W * SCALE}" height="${CARD_H * SCALE}" ` +
    `viewBox="0 0 ${CARD_W} ${CARD_H}">` +
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

// A symbol node is rendered iff its .coord-section is not tier-hidden.
// ui/tiers.js sets `hidden` on rows above the current render tier, so
// filtering on it keeps the PNG equal to the on-screen card at the
// user's current tier (§5.D v0.36) without this module knowing tiers.
function isRenderedSymbol(node) {
  const section = node && node.closest ? node.closest('.coord-section') : null;
  return !(section && section.hidden);
}

function buildCardSVG() {
  const symbols = ((_refs && _refs.symbols) || []).filter(isRenderedSymbol);
  return buildCardSVGFromSnapshot({
    catalog: _refs && _refs.catalog ? _refs.catalog.textContent.trim() : '',
    sections: symbols.map(node => ({
      title: titleFor(node),
      symbol: node ? node.textContent.trim() : ''
    }))
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
// Mobile / supported: hand the PNG file to the native share sheet via
// navigator.share — the image carries the wordmark, so no text body is
// needed. Desktop / unsupported: download the PNG and copy the bare URL
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
  const file = new File([blob], 'eight-ball.png', { type: 'image/png' });
  if (
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({ files: [file] });
    } catch (_) {
      // user dismissed the sheet or share rejected — no fallback noise
    }
    return;
  }
  // Desktop / unsupported fallback: download + clipboard copy.
  downloadBlob(blob, 'eight-ball.png');
  let copied = false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      copied = true;
    } catch (_) {}
  }
  flashStatus(copied ? 'image saved · link copied' : 'image saved');
}
