// 8ball / ui / pairShare.js — the Pair Imprint (DOCTRINE §5.D / §1.J v0.79)
//
// A DEDICATED, narrow share surface for the paired reading — deliberately a
// separate module from ui/share.js rather than a second call into it. That
// module's builder reads the live DOM sheet snapshot for ONE person
// (shareRowRefs); this module never READS live sheet, profile, or form DOM,
// and never reaches beyond the two refs it is handed at init (its own
// button + status node) for anything it looks UP. Fourth remediation gate,
// item 3: this does NOT mean the module never creates DOM — svgToPngBlob()
// below creates a detached `<canvas>` and an `Image`, and downloadBlob()
// creates a detached `<a>` it briefly appends to `document.body` to trigger
// a download, then removes; none of that is READ from, none of it is the
// app's own sheet/profile/form markup, and none of it lives beyond a single
// operation. The actual boundary is INPUT, not "zero DOM interaction": the
// only data this file ever RECEIVES is whatever `hooks.getRelation()`
// returns or a host hands to `notifyRelationChange()` (see below) — it
// never queries `document.getElementById`/`querySelector` for anything
// outside its own two injected refs.
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
// 1080×1350 portrait — the SVG source, content, ordering, and geometry are
// fixed for a given relation (three short strings and fixed product copy,
// never a profile or a timestamp) and reproduce byte-for-byte across
// repeated exports IN THE SAME resolved browser/font environment (seventh
// remediation gate: narrowed per the canonical brief's exact scoping —
// this exporter uses the OS-dependent system monospace font stack
// (`FONT` above), never a bundled/fixed font, so cross-platform or
// cross-font-environment raster-byte identity is NOT claimed; only the
// deterministic SOURCE/content/geometry, and same-runtime byte identity,
// are).
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
  // Eighth remediation gate: `formattedRelation` is produced entirely by
  // ui/dyad.js's own formatDyadRelation() in normal operation, never
  // user-controlled directly — but the field reads and String() coercions
  // below were still bare, unguarded property/toString accesses. A hostile
  // getter on `elementDirectionAB`/`numerologySpine`/`cardPairHead`, or a
  // value whose String() coercion itself throws (a poisoned toString/
  // valueOf/Symbol.toPrimitive), would otherwise escape uncaught from a
  // synchronous call site in onShareClick that runs BEFORE the busy/opInFlight
  // state is even set — contained the same way every other external read in
  // this module is, degrading to `null` (the same "nothing to share" result
  // an already-missing/failed relation produces) rather than throwing.
  let elementCycle, combinedLifePath, cardPair;
  try {
    elementCycle = String(formattedRelation.elementDirectionAB || '');
    combinedLifePath = String(formattedRelation.numerologySpine || '');
    cardPair = String(formattedRelation.cardPairHead || '');
  } catch (_) {
    return null;
  }
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

// ── status copy — the FULL real taxonomy is eleven states ──────────────────
// (third remediation gate, item 8, corrected again by the fourth gate, item
// 1: an earlier journal entry undercounted this as "six distinguished
// outcomes" before `busy`/`stale` existed as states in their own right, and
// the third gate's eight-state count was itself incomplete — it had no way
// to say "an irreversible effect completed, but for the pair you started
// with, not the one on screen now"). Sixth remediation gate, item 2: the
// fourth/fifth gates named these `*-previous` and reported them whenever a
// post-effect re-read came back `changed` OR `unknown` (the getRelation()
// hook threw). That was a real defect: a THROW proves neither that the pair
// changed nor that it is "the previous" one — it proves nothing about
// identity at all. `*-selected` replaces `*-previous` because "selected" is
// truthful in BOTH cases without needing to tell them apart: the exported
// artifact is certainly the snapshot SELECTED at click time, whether the
// on-screen pair is later confirmed different or simply unconfirmable.
// Pure mapping, one entry per branch the click handler can take, so no two
// distinct outcomes ever share a message:
//   busy                       — preparing (pre-render OR an active click);
//                                NOT a terminal outcome — see setStatus()'s
//                                timer rule below, this one never auto-hides.
//   shared                     — navigator.share() genuinely resolved FOR
//                                THE PAIR CURRENTLY ON SCREEN (identity
//                                re-read CONFIRMED current).
//   shared-selected            — navigator.share() genuinely resolved, but
//                                current identity could not be CONFIRMED
//                                afterward — either a fresh read found a
//                                different relation, or the read itself
//                                threw and currency is simply unknown. The
//                                share is a REAL, COMPLETED effect for the
//                                pair SELECTED at click time; it is reported
//                                as concerning that selected pair, never
//                                folded into `stale` (which would falsely
//                                imply nothing happened) or `failed` (which
//                                would falsely imply the share itself broke).
//   download-started           — the on-device download fallback genuinely
//                                fired FOR THE PAIR CURRENTLY ON SCREEN (a
//                                claim this module CAN make — the browser
//                                call was invoked — never "saved", which
//                                this module cannot observe: nothing here
//                                learns whether the browser actually wrote
//                                the file to disk).
//   download-started-copied    — the above, plus the caption copied to the
//                                clipboard, for the pair currently on screen.
//   download-started-selected          — the download genuinely fired, but
//                                        for the pair SELECTED at click
//                                        time, whose currency could not be
//                                        confirmed at the clipboard step
//                                        (the only await after the download
//                                        itself) — a confirmed change or an
//                                        unconfirmed (hook-threw) read both
//                                        land here, identically truthful
//                                        either way.
//   download-started-selected-copied   — the above, AND the clipboard copy
//                                        (of the selected pair's caption)
//                                        also succeeded before currency
//                                        could be confirmed.
//   cancelled                  — a dismissed native chooser (AbortError) —
//                                never "shared".
//   stale                      — the pair CONFIRMED changed while a
//                                NON-irreversible step (rasterizing, waiting
//                                for a pre-render, or a share attempt that
//                                has not yet resolved/rejected) was in
//                                flight, so no irreversible share/download
//                                effect occurred for the pair this operation
//                                started with. Reserved EXCLUSIVELY for a
//                                CONFIRMED change before any irreversible
//                                effect starts — an unconfirmed (hook-threw)
//                                pre-effect read is `failed`, not `stale`,
//                                since a throw proves no change, only that
//                                currency couldn't be read (sixth gate, item
//                                2). Never used once a share() call has
//                                already resolved or a download has already
//                                fired (those use the `-selected` states
//                                above instead, since something real DID
//                                happen by then). Fifth gate, item 3: "saved"
//                                is never the right word here regardless —
//                                this module can only observe a download
//                                STARTING, never completing (item 6).
//   empty                      — nothing resolved to share; the failure
//                                state has no relation to export.
//   failed                     — a render/share exception, a getRelation()
//                                hook that threw on read (P2 hook truth,
//                                including an unconfirmed pre-effect
//                                re-read — sixth gate, item 2), or a
//                                download that never fired at all — always
//                                before any irreversible action.
export function pairShareStatusMessage(state) {
  switch (state) {
    case 'busy': return 'preparing pair image…';
    case 'shared': return 'shared.';
    case 'shared-selected': return 'selected pair shared.';
    case 'download-started': return 'download started.';
    case 'download-started-copied': return 'download started · caption copied.';
    case 'download-started-selected': return 'download started for selected pair.';
    case 'download-started-selected-copied': return 'download started for selected pair · caption copied.';
    case 'cancelled': return 'share cancelled.';
    case 'stale': return 'the pair changed. share the pair again.';
    case 'empty': return 'nothing to share yet — read a pair first.';
    case 'failed': return 'share failed. try again.';
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
// own: the download itself already STARTED (this module observes the
// click firing, never disk completion), so a failure to tidy the DOM
// afterward must not flip an already-truthful "download-started" into
// "failed" — but the object URL is still guaranteed to be revoked (on the existing
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
// names the on-device download as the fallback, rather than promising a
// direct share outright. When neither method exists at all, the wording
// collapses to a plain, unconditional image-download statement — nothing
// conditional to hedge. Sixth remediation gate, item 4: "save"/"saved"
// never appears in this disclosure — this module can only observe a
// download STARTING (item 6), never reaching disk.
function detectShareCapability() {
  try {
    return typeof navigator !== 'undefined'
      && typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function';
  } catch (_) {
    return false;
  }
}

// Item 6 (truthful download wording) applies here too — "saves" describes a
// completion this module cannot observe (only that a download was
// started); "downloads" describes the action itself, which this module DOES
// know it performed.
export function pairImprintDisclosureText(capable) {
  return capable
    ? 'created on this device · personal details excluded · shares directly when your device supports it, otherwise downloads it as an image'
    : 'created on this device · personal details excluded · downloads the pair imprint as an image to this device';
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
// ── hostile-accessor containment (eighth remediation gate) ─────────────────
// `navigator.share` / `navigator.canShare` / `navigator.clipboard` /
// `.writeText` are ordinary property reads throughout this file, which had
// assumed a well-behaved global. A property that THROWS ON GET — a hostile
// or broken `navigator` (an extension, a locked-down embed, or an
// adversarial test harness) — is possible and was not contained the same
// way a merely-missing method already was: `typeof navigator.share` at a
// bare property-access site throws straight through the function that reads
// it, rather than degrading to the same `{attempted:false}` a genuinely
// absent method produces. `safeProp`/`safeFn` read a property (and confirm
// it's callable) through a try/catch so a hostile getter degrades exactly
// like an absent one; the caller still invokes the returned function via an
// explicit `.call(receiver, ...)` so the native method keeps its correct
// `this` (an extracted bare reference would lose that binding and could
// itself throw "Illegal invocation" on some engines).
function safeProp(obj, key) {
  try { return obj == null ? undefined : obj[key]; } catch (_) { return undefined; }
}
function safeFn(obj, key) {
  const fn = safeProp(obj, key);
  return typeof fn === 'function' ? fn : null;
}
// `typeof navigator` itself throws if `navigator` is redefined as a global
// accessor property with a throwing getter — `typeof` only shields an
// UNRESOLVABLE (undeclared) reference, not a hostile one (confirmed
// directly: Object.defineProperty(globalThis,'navigator',{get(){throw}})
// makes even `typeof navigator` throw). `safeNavigator()` is the one place
// that reference is ever evaluated in this file.
function safeNavigator() {
  try { return typeof navigator === 'undefined' ? null : navigator; } catch (_) { return null; }
}
// A caught error's OWN `.name` can itself be a throwing getter — reading it
// to classify AbortError vs. everything else must not let that escape.
function safeErrorName(err) {
  try { return err && err.name; } catch (_) { return undefined; }
}
// A callable that returns something other than a real promise/thenable
// (undefined, a plain value, or a hostile object whose `.then` getter
// throws) must not be awaited as a success — `await nonThenable` resolves
// immediately rather than throwing, which would otherwise read as the
// native share/clipboard call having genuinely completed.
function isThenable(v) {
  try { return !!v && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function'; }
  catch (_) { return false; }
}

function trySyncNativeShare(blob, snapshot) {
  const nav = safeNavigator();
  if (!nav) return { attempted: false };
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
  const canShareFn = safeFn(nav, 'canShare');
  let canShareFiles = false;
  try {
    // Evaluated with the EXACT payload navigator.share() below will
    // receive (files AND text) — canShare({files}) alone can answer yes
    // for a payload navigator.share() then refuses once `text` is
    // present.
    canShareFiles = !!(canShareFn && canShareFn.call(nav, { files: [file], text: caption }));
  } catch (_) {
    canShareFiles = false;
  }
  const shareFn = safeFn(nav, 'share');
  if (!canShareFiles || !shareFn) return { attempted: false };
  try {
    const result = shareFn.call(nav, { files: [file], text: caption });
    // A callable-but-non-promise return (undefined, a plain value) is not a
    // genuine share attempt this module can await for a truthful outcome —
    // falls back to download exactly like an absent/uncallable share would.
    if (!isThenable(result)) return { attempted: false };
    return { attempted: true, promise: result };
  } catch (err) {
    // Eighth remediation gate: a DIRECT SYNCHRONOUS AbortError (some
    // platforms throw rather than reject the promise) is a genuine,
    // already-settled cancellation, not an unattempted call — it must
    // resolve to `cancelled` with zero download/clipboard fallback, the
    // same as an async-rejected AbortError already does. Wrapping it as a
    // rejected promise lets shareOrFallback's existing async catch (which
    // already reads the error name safely, see below) handle both shapes
    // through one path. Any OTHER synchronous throw (not AbortError) is
    // genuinely unattempted and still falls straight through to the
    // on-device download, exactly as before.
    if (safeErrorName(err) === 'AbortError') return { attempted: true, promise: Promise.reject(err) };
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

// Third remediation gate, item 1: `busy` is NOT a terminal outcome — it is
// the whole visible/live explanation for a disabled, aria-busy button, and
// the pending window it describes (a slow proactive render, a native share
// chooser sitting open, a clipboard prompt) can genuinely outlast 4 seconds.
// Auto-hiding it on a blind timer would leave a disabled control with no
// live-announced reason showing. Only a TERMINAL state (everything except
// `busy`) ever arms the 4s auto-hide timer; `busy` clears only when the
// pending window actually settles — via a later setStatus() call to a
// terminal state (which itself arms its own timer), or via
// syncBusyFromPrerender()'s own direct clear when a pre-render settles with
// no click ever having started.
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
  if (msg && state !== 'busy' && typeof setTimeout === 'function') {
    controller.statusTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }
}

// Third remediation gate, item 2: the deterministic DOM state a controller's
// refs should show whenever it is NOT actively busy/mid-operation — used
// both to initialize a fresh controller's DOM (so a live, REUSED button/
// status pair never inherits a prior controller's stuck "busy" look) and to
// relinquish a retiring controller's hold on shared DOM before a new
// controller takes over the same nodes. A direct, synchronous, one-time
// write — not a guarded method a retired controller's async tail could
// later call, so it does not weaken "a retired controller writes nothing
// once retired" (this call itself happens BEFORE/AT the moment of
// retirement, performed by the retiring code, not by a stale continuation).
function resetControllerDOM(controller) {
  const btn = controller.refs && controller.refs.btn;
  if (btn) {
    btn.disabled = false;
    if (btn.setAttribute) btn.setAttribute('aria-busy', 'false');
  }
  const el = controller.refs && controller.refs.status;
  if (el) {
    el.textContent = '';
    el.hidden = true;
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
  const busyMsg = pairShareStatusMessage('busy');
  // Eighth remediation gate: a background prerender becoming pending for a
  // NEWER pair (started via notifyRelationChange while a click-triggered
  // operation was still in flight) must not stomp the truthful terminal
  // status that operation's own `finally` just wrote (shared-selected,
  // stale, download-started[-selected][-copied], cancelled, failed) the
  // instant opInFlight clears and this function runs unguarded again. The
  // BUTTON's disabled/aria-busy state may still legitimately reflect the
  // pending render (a second click would have to wait for it either way);
  // only the live status TEXT is protected, and only for as long as it is
  // genuinely still showing a real terminal result (`!el.hidden` — the
  // moment that message's own auto-hide timer actually fires, this stops
  // applying and a later prerender is free to show `busy` normally).
  const showingTerminal = !!(el && !el.hidden && el.textContent && el.textContent !== busyMsg);
  if (pending) {
    if (!showingTerminal) setStatus(controller, 'busy');
  } else if (el && el.textContent === busyMsg) {
    // The pre-render just settled (or there is nothing to prepare) with no
    // click in flight — no download was started and no share was attempted,
    // so there is no terminal outcome to announce. Only ever clears OUR OWN
    // "preparing…" text, never a real terminal status a click already wrote.
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
// rejected clipboard.writeText(), and the pending pre-render promise.
// Returns one of four verdicts, fourth-gate item 1's finer distinction over
// the old boolean {stale,failed} pair:
//   'current'     — identity confirmed unchanged; safe to speak of "the
//                   pair" with no qualifier.
//   'changed'     — a fresh, successful read found a DIFFERENT relation (or
//                   null) than the one this operation started with. Before
//                   an irreversible effect this means `stale`; after one it
//                   means the effect completed for the pair SELECTED at
//                   click time (sixth gate, item 2: never "the previous"
//                   pair — this module never claims to know what's
//                   currently on screen, only what it started with).
//   'unknown'     — the getRelation() hook threw on this re-read (second-
//                   gate P2 hook truth) — currency cannot be confirmed
//                   either way. Before an irreversible effect this is
//                   `failed` (the same read failure it always was) — NEVER
//                   `stale`, since a throw proves no change, only that
//                   currency couldn't be read (sixth gate, item 2). After an
//                   irreversible effect, this module still cannot claim the
//                   effect concerned the pair NOW on screen, so it is
//                   reported the same conservative way as 'changed' — as
//                   concerning the pair SELECTED at click time, never as an
//                   unqualified success and never as "previous" (a throw
//                   does not prove the pair changed at all).
//   'suppressed'  — this controller was retired (a new controller has taken
//                   over the same DOM — see initPairShareUI) or this
//                   operation's own token no longer matches (defensive:
//                   opInFlight already prevents a second concurrent
//                   operation on the SAME live controller, so this arm is a
//                   backstop, not the common path). Nothing may be
//                   announced — writing here could land on a DIFFERENT
//                   owner's refs, or on refs no one is looking at anymore.
function recheck(controller, myToken, relationAtStart) {
  if (controller.retired || controller.opToken !== myToken) return { verdict: 'suppressed' };
  const read = readRelation(controller.hooks);
  if (!read.ok) return { verdict: 'unknown' };
  if (read.value !== relationAtStart) return { verdict: 'changed' };
  return { verdict: 'current' };
}

// Maps a recheck() verdict to the correct status BEFORE any irreversible
// effect has happened, on the SUCCESS path (a render/wait just completed
// and the caller is deciding whether to proceed to the effect or stop) —
// 'current' returns null, meaning "proceed, nothing to announce yet";
// 'changed'/'unknown' both mean "no irreversible share/download effect
// occurred for this pair", which is exactly what `stale`/`failed` say.
// 'suppressed' writes nothing (setStatus()'s own retired-check already
// no-ops for the retired
// case; this helper never gets called for the true owner in that state
// anyway).
function preEffectStatus(verdict) {
  if (verdict === 'current') return null; // caller proceeds; no status to write yet
  if (verdict === 'suppressed') return null; // write nothing
  return verdict === 'unknown' ? 'failed' : 'stale';
}

// The same pre-effect mapping, but for a call site where the async step
// ITSELF already failed (a render/rasterization exception) — there is
// nothing to "proceed" to, so 'current' must also resolve to a real status
// (`failed`, matching the render's own genuine failure) rather than the
// null "keep going" signal `preEffectStatus` gives its success-path
// callers. 'changed' still reports `stale` (the pair moved on regardless
// of the render outcome, so that's the more relevant fact to the reader);
// 'unknown' reports `failed` (matches `current`, since neither can rule out
// that the render failure is what a reader on the SAME pair needs to hear).
function renderFailureStatus(verdict) {
  if (verdict === 'suppressed') return null;
  return verdict === 'changed' ? 'stale' : 'failed';
}

// Maps a recheck() verdict to the correct status AFTER an irreversible
// effect (a resolved share(), or a fired download) has already happened —
// fourth-gate item 1, corrected by the sixth gate item 2. 'changed' and
// 'unknown' both mean "cannot confirm this was for the pair now on screen",
// so both get the SAME truthful "selected pair" wording — never "previous
// pair" (that would claim a change this module cannot prove when the
// verdict is merely 'unknown'), never a bare ambiguous claim, and never a
// false `stale`/`failed` that would erase a real completed effect.
// "Selected" is truthful either way: the artifact IS the snapshot selected
// at click time, regardless of whether the pair now on screen is confirmed
// different or simply unconfirmable. `currentState`/`selectedState` are the
// two status keys to choose between; 'suppressed' returns null (write
// nothing).
function postEffectStatus(verdict, currentState, selectedState) {
  if (verdict === 'suppressed') return null;
  return verdict === 'current' ? currentState : selectedState;
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

  // Item 7 / fourth-gate item 1 (truthful stale/native-share contract, the
  // same logic applied to the download side of the fallback), corrected by
  // the sixth gate item 2: `downloadBlob()` above already invoked the
  // browser's download — an IRREVERSIBLE action outside this controller's
  // power to undo. From this point on, identity changing (or becoming
  // unconfirmable) can only affect whether the CLIPBOARD copy is
  // attempted/announced and whether the download is reported as concerning
  // the pair now on screen or the pair SELECTED at click time — it must
  // never be reported as if the download itself never happened.
  let copied = false;
  // Eighth remediation gate: `navigator.clipboard` and its `.writeText`
  // property are read through `safeProp`/`safeFn` (defined above,
  // trySyncNativeShare) rather than as bare property accesses — a hostile
  // `navigator.clipboard` getter must degrade to "no clipboard available"
  // the same way an absent one already does, never throw straight through
  // this function and skip the `setStatus` calls below. That containment is
  // what keeps the ALREADY-TRUE `downloaded` outcome above from being
  // erased: a throw here can only affect the clipboard branch that follows,
  // never unwind past the point the download was already reported.
  const clipboardObj = safeProp(safeNavigator(), 'clipboard');
  const writeTextFn = safeFn(clipboardObj, 'writeText');
  if (writeTextFn) {
    let clipboardOk = false;
    try {
      const result = writeTextFn.call(clipboardObj, caption);
      // Eighth remediation gate: a callable-but-non-promise return is not a
      // genuine copy this module can vouch for — `await result` on a
      // non-thenable resolves immediately rather than throwing, which would
      // otherwise read as the clipboard write having actually succeeded.
      // Retains the download-started status without the falsely-earned
      // "-copied" suffix, exactly like a thrown/rejected write does.
      if (isThenable(result)) {
        await result;
        clipboardOk = true;
      }
    } catch (_) { /* clipboard denied — the download was still started */ }
    // P1-2: re-check AFTER this await REGARDLESS of whether the write
    // resolved or rejected — a clipboard call is a real async boundary the
    // pair can change across either way. A changed OR unconfirmed
    // (hook-threw) identity here does NOT erase the download that already
    // fired — it only means (a) don't claim the copy succeeded for a pair
    // that isn't confirmed current and (b) name the download as concerning
    // the SELECTED pair, truthfully — never "previous" (a throw does not
    // prove a change happened) and never an ambiguous unqualified claim.
    const check = recheck(controller, myToken, relationAtStart);
    const state = postEffectStatus(
      check.verdict,
      clipboardOk ? 'download-started-copied' : 'download-started',
      clipboardOk ? 'download-started-selected-copied' : 'download-started-selected',
    );
    if (state) setStatus(controller, state);
    return;
  }
  setStatus(controller, copied ? 'download-started-copied' : 'download-started');
}

// The fast path: a cached Blob is already ready at click time, so a native
// share attempt can still happen with transient activation intact. Every
// step up to and including `navigator.share(...)`'s CALL is synchronous;
// only the returned promise is awaited.
async function shareOrFallback(controller, myToken, relationAtStart, snapshot, blob) {
  const attempt = trySyncNativeShare(blob, snapshot);
  if (attempt.attempted) {
    try {
      // Item 7 / fourth-gate item 1, corrected by the sixth gate item 2: by
      // the time `await` returns here, `navigator.share()` has ALREADY
      // genuinely resolved — a real platform action this controller
      // invoked and cannot take back. What happens next can only change
      // what this module SAYS about it, never the fact that it happened. A
      // confirmed-changed pair OR an unconfirmed (hook-threw) read
      // discovered now is reported as `shared-selected` — truthfully
      // naming the effect as real but concerning the pair SELECTED at
      // click time, never `shared-previous` (a throw proves no change,
      // only that currency is unknown), never `stale` (which would falsely
      // imply nothing happened), and never `failed` (which would falsely
      // imply the share itself broke, when it plainly succeeded).
      await attempt.promise;
      const check = recheck(controller, myToken, relationAtStart);
      const state = postEffectStatus(check.verdict, 'shared', 'shared-selected');
      if (state) setStatus(controller, state);
      return;
    } catch (err) {
      // Nothing irreversible has happened yet on THIS path — the share
      // call rejected, so no platform action completed. A changed/
      // unconfirmed identity here is still ordinary pre-effect `stale`/
      // `failed`, exactly as it was before any effect existed to protect.
      const check = recheck(controller, myToken, relationAtStart);
      const pre = preEffectStatus(check.verdict);
      if (pre) { setStatus(controller, pre); return; }
      if (check.verdict === 'suppressed') return;
      // Eighth remediation gate: `err.name` read through `safeErrorName` —
      // a rejection object with a THROWING `.name` getter must not escape
      // this catch block and erase the fallback below; it is classified as
      // "not AbortError" (safeErrorName returns undefined on a throw) and
      // falls straight through to the same download-preserving path any
      // other non-Abort rejection already takes.
      if (safeErrorName(err) === 'AbortError') { setStatus(controller, 'cancelled'); return; }
      // Second-gate P1-4: a non-Abort rejection (NotAllowedError included)
      // preserves the local download — the platform only refused to open
      // its OWN chooser; the PNG this device already rendered is still
      // right here. Identity was just confirmed 'current' above (the only
      // way execution reaches this line), so the download below correctly
      // proceeds for the pair genuinely on screen right now.
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
        // No irreversible effect has happened on this path (rasterization
        // itself failed) — but unlike the success path below, there is
        // nothing to "proceed" to, so `renderFailureStatus` (not
        // `preEffectStatus`) is what applies: even a CONFIRMED-current
        // identity still reports `failed` here, since the render itself
        // is what broke.
        const check = recheck(controller, myToken, relationAtStart);
        const status = renderFailureStatus(check.verdict);
        if (status) setStatus(controller, status);
        return;
      }
      // P1-2: re-check after the render/wait await, before any side effect
      // — nothing irreversible has happened yet, so this is still ordinary
      // pre-effect `stale`/`failed`.
      const check = recheck(controller, myToken, relationAtStart);
      const pre = preEffectStatus(check.verdict);
      if (pre) { setStatus(controller, pre); return; }
      if (check.verdict === 'suppressed') return;
      // Activation was already lost waiting for this render — download-only,
      // never a native share attempt (second-gate P1-4: "enable activation
      // only when the blob is ready" at CLICK time, not after the fact).
      // Identity was just confirmed 'current' above.
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
  // Second-gate P1-3 / third-gate item 2: retire whatever controller a prior
  // init created BEFORE constructing the new one, so an in-flight operation
  // from that instance can never write into the new refs and a stray
  // leftover click listener never piles up on a re-initialized DOM node.
  // Retirement is now a complete handover, not just a flag flip: the prior
  // controller's own pending auto-hide timer is cancelled (an ARMED timer
  // closing over the shared status node would otherwise fire LATER and hide
  // whatever the NEW controller has since written there — a real same-node
  // race when refs are reused, as they normally are, across a re-init), and
  // the shared DOM is reset to its quiet/idle shape before the new
  // controller ever touches it — a live button must never be left disabled/
  // aria-busy="true" forever just because the controller that put it there
  // retired mid-operation.
  if (_activeController) {
    const prior = _activeController;
    prior.retired = true;
    if (prior.statusTimer && typeof clearTimeout === 'function') {
      clearTimeout(prior.statusTimer);
      prior.statusTimer = null;
    }
    const priorBtn = prior.refs && prior.refs.btn;
    if (priorBtn && typeof priorBtn.removeEventListener === 'function' && prior.listener) {
      priorBtn.removeEventListener('click', prior.listener);
    }
    resetControllerDOM(prior);
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
  // Deterministic initial DOM, independent of whatever the retirement reset
  // above did or didn't reach (e.g. the very first init, or refs that
  // happen to differ from the prior controller's) — a fresh controller
  // never starts from an ambiguous DOM state.
  resetControllerDOM(controller);
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
