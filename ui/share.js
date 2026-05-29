// 8ball / ui/share.js
// v0.4.0 share-surface controller (DOCTRINE §5.D v0.31 / §6).
//
// Owns:
//   - the #share-btn click handler on the free result surface
//   - card-to-image: serialize the free, symbols-only card as an SVG
//     string, raster it through an offscreen <canvas>, emit a PNG Blob
//   - the share flow: Web Share API (navigator.share with the PNG file)
//     where available; otherwise a local PNG download + clipboard copy
//     of the bare production URL, with a transient inline confirmation
//
// Does NOT own:
//   - any profile / card-content state. The image builder reads ONLY the
//     four rendered free-coordinate symbol nodes (+ their section titles
//     and the catalog number) from the live DOM. It never touches the
//     paid card-content layer (name/type/habit/note) and never reads a
//     profile object — so name and DOB cannot reach the shared artifact
//     (DOCTRINE §5.D invariants a/b).
//
// Network: none. SVG → canvas → toBlob is entirely on-device; the only
// outbound surfaces are the user's own native share sheet and clipboard.
// No fetch / XHR / beacon is introduced — §5 same-origin/no-beacon and
// §7 no-telemetry are preserved (DOCTRINE §5.D invariant c). DI shape
// mirrors ui/payments.js initPaywallUI and ui/profile.js initProfileUI.

// ── constants ─────────────────────────────────────────────────────
// The bare production URL is the only discovery handle that travels
// with a shared card (carried as the image footer wordmark, and copied
// to the clipboard on the desktop fallback). No query parameters, no
// profile fields — §5.D invariant (b).
const SITE_URL = 'https://the-eight-ball.netlify.app';

// Specimen-card geometry, in SVG user-space units. SCALE rasters the
// PNG at higher density so the mono type stays crisp on retina shares.
const CARD_W = 320;
const CARD_H = 480;
const SCALE = 3;

// Grayscale specimen palette, mirroring the on-screen free card
// (index.html :root --paper / --ink / --label / --rule).
const PAPER = '#ebe5d4';
const INK = '#1a1812';
const LABEL = '#5a5444';
const RULE = '#8a8472';
const FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ── DI injection (refs + hooks at boot) ───────────────────────────
// refs:  { btn, status, catalog, symbols: [elem, sun, animal, numerology] }
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

function buildCardSVG() {
  const symbols = (_refs && _refs.symbols) || [];
  const catalog = _refs && _refs.catalog ? _refs.catalog.textContent.trim() : '';

  // Four sections evenly stacked between the catalog row and the footer.
  const startY = 116;
  const stepY = 78;
  const sections = symbols.map((node, i) => {
    const cy = startY + i * stepY;
    const title = esc(titleFor(node));
    const symbol = esc(node ? node.textContent.trim() : '');
    return (
      `<text x="${CARD_W / 2}" y="${cy - 13}" text-anchor="middle" ` +
      `font-family="${FONT}" font-size="10" letter-spacing="1.2" fill="${LABEL}">${title}</text>` +
      `<text x="${CARD_W / 2}" y="${cy + 10}" text-anchor="middle" ` +
      `font-family="${FONT}" font-size="15" font-weight="500" fill="${INK}">${symbol}</text>`
    );
  }).join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W * SCALE}" height="${CARD_H * SCALE}" ` +
    `viewBox="0 0 ${CARD_W} ${CARD_H}">` +
    `<rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" fill="${PAPER}"/>` +
    `<rect x="12" y="12" width="${CARD_W - 24}" height="${CARD_H - 24}" fill="none" stroke="${RULE}" stroke-width="1"/>` +
    `<text x="${CARD_W - 24}" y="40" text-anchor="end" font-family="${FONT}" font-size="9" ` +
    `letter-spacing="1.5" fill="${LABEL}">${esc(catalog)}</text>` +
    sections +
    `<text x="${CARD_W / 2}" y="${CARD_H - 28}" text-anchor="middle" font-family="${FONT}" ` +
    `font-size="9" letter-spacing="1" fill="${LABEL}">${esc(SITE_URL.replace(/^https:\/\//, ''))}</text>` +
    `</svg>`
  );
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
