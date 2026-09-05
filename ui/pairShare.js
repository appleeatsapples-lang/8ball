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
//
// Tenth remediation gate: `precheck`, when given, is called IMMEDIATELY
// BEFORE the anchor's `click` is invoked — the actual irreversible
// boundary. Every step before it (URL.createObjectURL, createElement,
// href/download assignment, appendChild) is fully reversible: if
// precheck() returns false, the anchor is discarded and the URL revoked,
// exactly as a preparatory throw already does.
//
// Eleventh remediation gate, B2/B5: two further corrections. (1) The
// anchor's `click` PROPERTY is itself a host-controlled read — a hostile
// getter could carry a side effect the same way navigator.share's getter
// does — so it is extracted via safeFn and rechecked ONE more time
// (addendum item 2) immediately before invocation, not read-and-called in
// one bare `a.click()` statement. (2) Once that invocation genuinely
// happens, a throw FROM the click call itself must never be reported as
// "nothing happened" — some hostile/broken environments could throw AFTER
// dispatching the event, and this module cannot prove otherwise. The
// return shape reflects this: `{clicked, clickThrew}` on success (clicked
// may still be accompanied by a clickThrew the caller must handle
// conservatively — never as a failure), or a genuine throw ONLY for a
// PREPARATORY failure that never reached invocation at all (createElement,
// appendChild, or the click property itself being non-invocable) — the
// caller recheck()s at that point to classify the failure precisely
// (`stale` if identity had already changed, never a blind `failed` that
// would mask a confirmed pre-effect change discovered earlier).
function downloadBlob(blob, filename, precheck) {
  const url = URL.createObjectURL(blob);
  let a = null;
  try {
    a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
  } catch (e) {
    try { if (a && typeof a.remove === 'function') a.remove(); } catch (_) { /* best-effort */ }
    try { URL.revokeObjectURL(url); } catch (_) { /* best-effort */ }
    throw e;
  }
  // Extract `click` safely (a hostile getter is itself a boundary), THEN
  // recheck ONE more time before invoking — this is the single check this
  // boundary needs; the reversible steps above do not each need their own.
  const clickFn = safeFn(a, 'click');
  if (precheck && !precheck()) {
    try { a.remove(); } catch (_) { /* best-effort */ }
    try { URL.revokeObjectURL(url); } catch (_) { /* best-effort */ }
    return { clicked: false };
  }
  if (!clickFn) {
    try { a.remove(); } catch (_) { /* best-effort */ }
    try { URL.revokeObjectURL(url); } catch (_) { /* best-effort */ }
    throw new Error('anchor click is not invocable');
  }
  let clickThrew = null;
  try {
    invoke(clickFn, a, []);
  } catch (e) {
    clickThrew = e;
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
  const timerId = safeSetTimeout(revoke, 1000);
  if (timerId == null) revoke();
  return { clicked: true, clickThrew };
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
// Fourteenth remediation gate: `typeof hooks.getRelation === 'function' ?
// hooks.getRelation() : null` read the `getRelation` property TWICE — once
// for the `typeof` check, once (a SEPARATE, later read) to actually call
// it. An exact live probe: a hostile `getRelation` GETTER reenters init on
// its first (`typeof`) read, and the SECOND read — used for the real call —
// then invokes whatever it returns, entirely unchecked, attributed to a
// controller that already lost the race. `safeFn` extracts the function
// ONCE; `stillCurrent` (when given) is rechecked after the GET and again
// after the CALL, so a losing caller's own stale invocation is caught at
// both of those exact boundaries, not only by whatever the caller happens
// to check after this function returns.
function readRelation(hooks, stillCurrent) {
  try {
    const getRelation = safeFn(hooks, 'getRelation'); // property read — may re-enter
    if (stillCurrent && !stillCurrent()) return { ok: false, value: null, suppressed: true };
    if (!getRelation) return { ok: true, value: null };
    const value = invoke(getRelation, hooks, []); // call — may re-enter
    if (stillCurrent && !stillCurrent()) return { ok: false, value: null, suppressed: true };
    return { ok: true, value };
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
// Twelfth remediation gate (final supplement, item 1): every host-supplied
// function this file invokes used to be called via a bare `fn.call(receiver,
// ...)` — but `.call` is ITSELF a property read on `fn`, and a hostile
// function can define its OWN `call` own-property (a getter, or a plain
// override) that shadows `Function.prototype.call` entirely. Reading
// `fn.call` at the call site is therefore a host-controlled boundary this
// file had not contained: a probe that changes relation inside a hostile
// `.call` getter, then returns the REAL `Function.prototype.call`, would
// still have the underlying share/click/writeText genuinely invoked with
// the identity already changed, past every recheck positioned around the
// call site. `reflectApply` is captured ONCE, at module load, from the
// intrinsic `Reflect.apply` — before any hostile code has had a chance to
// run — and used to invoke every extracted host function from here on,
// never touching `fn.call`/`fn.apply` at all.
const reflectApply = Reflect.apply;
function invoke(fn, receiver, args) {
  return reflectApply(fn, receiver, args || []);
}
// `typeof navigator` itself throws if `navigator` is redefined as a global
// accessor property with a throwing getter — `typeof` only shields an
// UNRESOLVABLE (undeclared) reference, not a hostile one (confirmed
// directly: Object.defineProperty(globalThis,'navigator',{get(){throw}})
// makes even `typeof navigator` throw). `safeNavigator()` is the one place
// that reference is ever evaluated in this file — exactly ONCE per call,
// into a local, before `typeof` ever inspects it: the previous shape
// (`typeof navigator === 'undefined' ? null : navigator`) read the global
// accessor TWICE for one logical boundary (once for the `typeof` check,
// again to actually return it), so a hostile getter with a call-counted or
// call-ordered side effect fired twice for what call sites treat as a
// single checkpoint.
function safeNavigator() {
  try {
    const nav = globalThis.navigator; // exactly one contained read
    return typeof nav === 'undefined' ? null : nav;
  } catch (_) {
    return null;
  }
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

// Eleventh remediation gate, B3: setTimeout/clearTimeout are themselves
// host-controlled globals — both the property LOOKUP (a hostile getter on
// globalThis) and the CALL (a throwing/no-op/re-entrant implementation) can
// misbehave, exactly like navigator.share/canShare above. Read through
// safeFn so a hostile getter degrades to "unavailable" rather than
// throwing straight through; invoke through a try/catch so a throwing call
// can never escape and turn an already-truthful outcome into an uncaught
// rejection (which onShareClick's own outer catch would otherwise turn
// into a false "failed", erasing whatever real status was just written).
// Ownership of an armed callback is deliberately NEVER inferred from
// clearTimeout() having actually cancelled anything — see armStatusTimer/
// clearStatusTimer below, which use an explicit identity token instead, so
// a hostile no-op clearTimeout can never let a stale callback resurrect
// its ability to touch a shared DOM node.
function safeSetTimeout(fn, ms) {
  try {
    const st = safeFn(globalThis, 'setTimeout');
    if (!st) return null;
    return invoke(st, globalThis, [fn, ms]);
  } catch (_) {
    return null;
  }
}
function safeClearTimeout(id) {
  if (id == null) return;
  try {
    const ct = safeFn(globalThis, 'clearTimeout');
    if (ct) invoke(ct, globalThis, [id]);
  } catch (_) { /* best-effort — the statusTimerGen identity check is the real guard */ }
}

// Tenth remediation gate: EVERY host-controlled step here — the canShare
// CALL, the share GETTER read, the share CALL — is a genuine boundary a
// well-behaved (non-throwing) adversarial implementation could carry a
// SIDE EFFECT through, not just a throw the existing try/catch containment
// already handled. A recheck sits after each preparatory boundary and
// before the NEXT one, so an identity change is caught at the earliest
// point after it happens rather than being silently carried into a later
// step. Returns one of three discriminated shapes the caller must handle
// distinctly: `not-attempted` (no capability at all — ordinary fallback,
// no identity concern raised here), `preempted` (identity already changed/
// unconfirmable/suppressed during a PREPARATORY call — nothing
// irreversible has happened, caller must map via preEffectStatus and never
// download), `attempted` (share() was genuinely invoked — the irreversible
// boundary — caller awaits and maps via postEffectStatus as before).
function trySyncNativeShare(controller, myToken, relationAtStart, blob, snapshot) {
  // Eleventh remediation gate, B4(d): safeNavigator()'s own read is a
  // host-controlled boundary too (a `navigator` accessor with a
  // side-effecting getter) — recheck immediately after it, before this
  // function proceeds on the strength of whatever it returned.
  const nav = safeNavigator();
  let check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  if (!nav) return { kind: 'not-attempted' };

  // B4(c) + twelfth remediation gate (final supplement, item 1): the global
  // `File` GETTER and the returned CONSTRUCTOR are two distinct
  // host-controlled boundaries — reading the property can itself carry a
  // side effect (e.g. a `get File() {...}` accessor on globalThis) that is
  // genuinely separate from whatever the returned constructor's OWN
  // invocation does. Recheck between the getter read and the constructor
  // call, and again after it, so a side effect at either boundary is caught
  // before this function decides anything on the strength of the result.
  const FileCtor = safeProp(globalThis, 'File');
  check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  let file = null;
  if (typeof FileCtor === 'function') {
    try {
      file = new FileCtor([blob], IMPRINT_FILENAME, { type: 'image/png' });
    } catch (_) {
      file = null;
    }
  }
  check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  if (!file) return { kind: 'not-attempted' };

  const caption = buildPairImprintCaption(snapshot);
  // Twelfth remediation gate, addendum item 2: `canShare`'s GETTER and its
  // returned CALLABLE are two distinct boundaries, exactly like `File`
  // above — a getter can change relation or retire the controller and
  // still hand back a perfectly callable function. Required order: read/
  // extract the getter, recheck, THEN (only if still current) invoke it,
  // then recheck again.
  const canShareFn = safeFn(nav, 'canShare');
  check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  let canShareFiles = false;
  if (canShareFn) {
    try {
      // Evaluated with the EXACT payload navigator.share() below will
      // receive (files AND text) — canShare({files}) alone can answer yes
      // for a payload navigator.share() then refuses once `text` is
      // present.
      canShareFiles = !!invoke(canShareFn, nav, [{ files: [file], text: caption }]);
    } catch (_) {
      canShareFiles = false;
    }
  }
  // Recheck immediately after the canShare CALL — a side effect carried
  // through it (even on a call that returns true, or throws nothing at
  // all) must be caught here, before ever reading the `share` getter.
  check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  if (!canShareFiles) return { kind: 'not-attempted' };

  const shareFn = safeFn(nav, 'share'); // the property READ itself is a second, distinct host-controlled boundary
  // Recheck again after reading the getter and before invoking it — a
  // side-effectful `navigator.share` ACCESSOR (not the call) is a genuinely
  // different boundary than the call, and must be caught before that call.
  check = recheck(controller, myToken, relationAtStart);
  if (check.verdict !== 'current') return { kind: 'preempted', verdict: check.verdict };
  if (!shareFn) return { kind: 'not-attempted' };

  // THE irreversible boundary: once shareFn is invoked below, this
  // function can never again claim "no attempt was made" — eleventh
  // remediation gate, B4(a)/(b): a non-thenable return and a synchronous
  // non-Abort throw both still mean the call genuinely happened. What
  // changes is only whether a side effect can be detected IMMEDIATELY
  // (rechecked right here, rather than trusted to a later, unrelated
  // preparatory check in the download fallback to eventually notice).
  // Invoked via `invoke()` (Reflect.apply), never `shareFn.call(...)` —
  // `.call` is itself a property read on `shareFn` a hostile function could
  // shadow with its own getter.
  let result;
  try {
    result = invoke(shareFn, nav, [{ files: [file], text: caption }]);
  } catch (err) {
    // The call itself already crossed the boundary before throwing.
    // Eighth remediation gate: a DIRECT SYNCHRONOUS AbortError (some
    // platforms throw rather than reject the promise) is a genuine,
    // already-settled cancellation — resolve to `cancelled` regardless of
    // any identity concern, since cancelled exports nothing either way.
    if (safeErrorName(err) === 'AbortError') return { kind: 'attempted', promise: Promise.reject(err) };
    // Non-Abort: DOCTRINE (§1.J v0.83) — a native-share exception routes to
    // the download fallback, it is never a direct `failed`. But recheck
    // HERE, immediately, so a genuine identity change carried through THIS
    // call is reported precisely (`preempted`/changed-or-unknown) instead
    // of silently falling through to download a pair that already moved on
    // — the exact gap an unrelated LATER preparatory throw could otherwise
    // mask by collapsing everything to a generic `failed`.
    const postCallCheck = recheck(controller, myToken, relationAtStart);
    if (postCallCheck.verdict !== 'current') return { kind: 'preempted', verdict: postCallCheck.verdict };
    return { kind: 'not-attempted' };
  }
  // Once shareFn.call has genuinely run, this function is committed to
  // `attempted` — it must never revert to `preempted`/`not-attempted` on
  // the strength of a side effect discovered AFTER the call, since that
  // would wrongly claim "nothing happened" for a call that already
  // happened. B4(e): `.then` is itself a property GETTER on the returned
  // value — reading it (inside isThenable) can carry the same class of
  // side effect as any other host-controlled property read; isThenable's
  // own try/catch only protects isThenable from throwing, not this caller
  // from a side-effecting getter that answers truthfully OR lies.
  const thenable = isThenable(result);
  if (thenable) {
    // Committed either way — the caller's own post-await recheck (in
    // shareOrFallback) applies the truthful current/selected split,
    // whether the side effect happened during the call itself or during
    // this very thenability check.
    return { kind: 'attempted', promise: result };
  }
  // Twelfth remediation gate (pre-commit race addendum, item 3): a
  // callable-but-non-promise return means `navigator.share()` never
  // genuinely RESOLVED — the eleven-state contract reserves `shared`/
  // `shared-selected` for a confirmed resolution, and a prior draft of this
  // fix synthesized a resolved `Promise.resolve()` here, producing the
  // false claim "selected pair shared." for a share that plainly did not
  // complete. Never synthesize that. If identity is still confirmed
  // current at this exact moment, this is an ordinary "no attempt this
  // module can vouch for" — the ordinary local-download fallback proceeds,
  // unchanged. If identity changed, became unconfirmable, or the
  // controller was retired/superseded, report through the SAME `preempted`
  // path every other preparatory-boundary side effect in this file uses —
  // never a stale download, and never a false `shared` claim.
  const postThenableCheck = recheck(controller, myToken, relationAtStart);
  if (postThenableCheck.verdict !== 'current') {
    return { kind: 'preempted', verdict: postThenableCheck.verdict };
  }
  return { kind: 'not-attempted' };
}

// ── controller (second-gate P1-3) ───────────────────────────────────────
// One object per initPairShareUI() call. Every piece of per-operation state
// (refs, hooks, cache, timers, in-flight flag, the operation token) lives on
// the controller instance a given click closed over, so two live
// controllers cannot interfere with each other and a retired controller's
// async tail cannot write anywhere. Three module-level mutables coordinate
// handover ACROSS controllers (updated below, in initPairShareUI, and in
// buttonWiringFor — twelfth remediation gate, final supplement, item 2):
// `_activeController` (which controller currently owns app-level identity,
// so a re-init knows what to retire), `_initGen` (an atomic generation
// token so a re-entrant/recursive init can detect it lost a race mid-
// handover and stop touching anything further), and `_buttonWiring` (a
// WeakMap ensuring at most one real DOM listener per physical button,
// ever, regardless of how many controllers take turns owning it).

let _activeController = null;
// Twelfth remediation gate (final supplement, item 2): bumped once per
// initPairShareUI() CALL (not per successful completion) — see that
// function's own comment for the atomic-handover protocol this backs.
let _initGen = 0;

// Twelfth remediation gate (further sweep): same shape as resetControllerDOM
// — btn.disabled, the setAttribute property read, and its invocation are
// three separate host-controlled boundaries. A hostile btn.disabled setter
// (or setAttribute getter) can synchronously re-enter initPairShareUI on
// these same refs; this function must stop at the exact boundary that
// re-entered rather than continuing to write over whatever the winner did.
// Fourteenth remediation gate: `controller.refs.btn` was read bare (no
// throw containment) and WRITTEN TO (`btn.disabled = ...`) with no
// checkpoint between the read and that first write — a hostile `refs`
// getter that reenters `initPairShareUI` on this same refs (retiring this
// controller, letting a nested winner reset the button to idle) let this
// function's own STALE write land right afterward, re-disabling a button
// the winner had already released. `safeProp` contains the read; the
// checkpoint immediately after it, before the FIRST write, is what a bare
// read-then-check-after pattern was missing.
// Fifteenth remediation gate: `stillCurrent`, when given, is an additional
// ownership check (e.g. a relation-generation token) rechecked between
// EVERY boundary here, alongside `controller.retired` — a live repro
// confirmed that `btn.disabled = busy`'s own setter can synchronously
// trigger a NEWER relation notification (via a hostile disabled-setter
// side effect) that fully installs and correctly busies/labels the SAME
// button for the newer relation, after which this call's OWN continuation
// — still describing the OLDER, now-superseded relation — would otherwise
// resume and overwrite the newer relation's aria-busy value. `controller.
// retired` alone cannot catch this: no re-init happens here, just relation
// churn on the SAME controller.
function applyBusyDOM(controller, busy, stillCurrent) {
  if (controller.retired) return;
  if (stillCurrent && !stillCurrent()) return;
  const btn = safeProp(controller.refs, 'btn'); // contained property read — may re-enter
  if (controller.retired) return;
  if (stillCurrent && !stillCurrent()) return;
  if (!btn) return;
  btn.disabled = !!busy; // host-controlled setter — may re-enter
  if (controller.retired) return;
  if (stillCurrent && !stillCurrent()) return;
  const setAttr = safeFn(btn, 'setAttribute'); // property read — may re-enter
  if (controller.retired) return;
  if (stillCurrent && !stillCurrent()) return;
  if (setAttr) {
    try { invoke(setAttr, btn, ['aria-busy', String(!!busy)]); } catch (_) { /* best-effort */ } // call — may re-enter
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
// Eleventh remediation gate, B3: cancel the controller's own armed timer
// (if any) and — regardless of whether the underlying host clearTimeout()
// call actually succeeds — bump `statusTimerGen` so any callback already
// in-flight (a hostile/no-op clearTimeout let it survive) fails its own
// identity check the instant it runs. The bump is the real ownership
// guard; the clearTimeout() call underneath is purely an optimization to
// avoid firing at all when the host behaves.
function clearStatusTimer(controller) {
  controller.statusTimerGen = (controller.statusTimerGen || 0) + 1;
  const id = controller.statusTimer;
  controller.statusTimer = null;
  safeClearTimeout(id);
}

// Arms the 4s auto-hide/reconcile timer under the SAME identity-token
// discipline. The callback checks `controller.retired` and its own token
// FIRST, before touching anything — a hard no-op, not merely a "skip the
// busy branch" — so a stale timer that a hostile clearTimeout failed to
// cancel can never write to a DOM node a NEWER controller (same reused
// refs) has since taken over. This is the exact shape of the bug a prior
// gate shipped: the old callback's retired-check lived INSIDE the
// busy-vs-hide branch, so "retired" fell through to the hide branch and
// still wrote `el.hidden = true` to what might by then be someone else's
// status node.
function armStatusTimer(controller, el) {
  controller.statusTimerGen = (controller.statusTimerGen || 0) + 1;
  const myStatusTimerGen = controller.statusTimerGen;
  // Twelfth remediation gate (pre-commit race addendum, item 4): `armed`
  // flips true only AFTER safeSetTimeout() has RETURNED — a hostile/
  // re-entrant setTimeout(fn, ms) that invokes `fn` SYNCHRONOUSLY (before
  // returning an id) must never hide/reconcile the status, since no real
  // 4-second wait has happened; the truthful terminal text is left visible
  // indefinitely instead, which is the honest behavior when the host
  // cannot be trusted to run real timers.
  let armed = false;
  const fire = () => {
    // Ownership check FIRST, by identity — never rely on clearTimeout()
    // having actually cancelled this callback.
    if (controller.retired || controller.statusTimerGen !== myStatusTimerGen) return;
    if (!armed) {
      // Invoked synchronously, during scheduling itself — a genuine timer-
      // semantics violation. Invalidate this generation so neither THIS
      // callback (if the host calls back more than once) nor the
      // caller's own post-return bookkeeping below can act on it.
      controller.statusTimerGen = (controller.statusTimerGen || 0) + 1;
      return;
    }
    controller.statusTimer = null;
    // Ninth remediation gate: this callback used to hide the status text
    // unconditionally — but syncBusyFromPrerender (eighth gate) can leave
    // the BUTTON disabled/aria-busy="true" for a genuinely still-pending
    // newer-pair prerender independent of this timer, and blindly hiding
    // the text at the 4s mark then left that disabled button with no
    // visible/live explanation at all. Reconcile with the CURRENT state
    // rather than assuming nothing changed in the last 4 seconds: if no
    // click operation owns busy right now and a prerender is genuinely
    // still pending, transition to the truthful `busy` explanation
    // (setStatus('busy') arms no further timer, matching how a real
    // click-triggered busy state never auto-hides either); otherwise hide
    // normally.
    if (!controller.opInFlight && isPrerenderPending(controller)) {
      setStatus(controller, 'busy');
    } else {
      el.hidden = true;
    }
  };
  const id = safeSetTimeout(fire, 4000);
  // If `fire` already ran synchronously above, `statusTimerGen` has already
  // been bumped past `myStatusTimerGen` by the branch inside it — this
  // assignment would then be a stale/no-op write; guard it so a stale id
  // (or a real one, orphaned) is never stored as this controller's
  // "current" timer, and never assigned after retirement either.
  if (!controller.retired && controller.statusTimerGen === myStatusTimerGen) {
    armed = true;
    controller.statusTimer = id;
  } else {
    safeClearTimeout(id); // best-effort — some hostile implementations still schedule something real despite firing synchronously too
  }
}

// Thirteenth-post-gate remediation: `stillCurrent`, when given, is an
// additional ownership predicate (e.g. syncBusyFromPrerender's own
// relation-generation check) rechecked at every boundary here ALONGSIDE
// `controller.retired` — a live repro confirmed a busy-sync caller can pass
// its own pre-call ownership check, then have a host-controlled read
// (`refs.status`) re-enter and install a NEWER notification's state, after
// which this function's stale continuation (still writing on behalf of the
// OLDER generation) would resume and overwrite what the newer notification
// already correctly wrote. `controller.retired` alone cannot catch this: no
// re-init happens in that scenario, just relation-generation churn on the
// SAME controller. Omitted (`undefined`), this predicate is always
// satisfied — existing click-operation callers (which own status purely
// through `controller.retired` and their own opToken/opInFlight discipline)
// keep their exact prior semantics.
function setStatus(controller, state, stillCurrent) {
  const ok = () => !controller.retired && (!stillCurrent || stillCurrent());
  if (!ok()) return;
  const el = safeProp(controller.refs, 'status'); // contained property read — may re-enter
  if (!ok()) return;
  if (!el) return;
  const msg = pairShareStatusMessage(state);
  clearStatusTimer(controller);
  // Twelfth remediation gate (pre-commit race addendum, item 4): clearStatusTimer's
  // own clearTimeout() call is host-controlled and can synchronously
  // re-init/retire this controller as a side effect — recheck immediately
  // before writing DOM so a just-retired controller (refs now owned by a
  // NEW controller, since refs are normally reused across a re-init) can
  // never corrupt what that new controller has already written.
  if (!ok()) return;
  el.textContent = msg; // host-controlled setter — may re-enter
  // Twelfth remediation gate (further sweep): el.textContent and el.hidden
  // are TWO separate host-controlled boundaries — a hostile textContent
  // setter reentering here must stop this call before el.hidden, the same
  // discipline resetControllerDOM uses, not one shared check before both.
  if (!ok()) return;
  el.hidden = !msg; // host-controlled setter — may re-enter
  if (!ok()) return;
  if (msg && state !== 'busy') {
    armStatusTimer(controller, el);
  }
}

// Eleventh remediation gate, B3 (re-entrant scheduler): arming the
// auto-hide timer above is itself a host-controlled CALL (safeSetTimeout)
// that could, in principle, carry a synchronous side effect the same way
// canShare/share/click do elsewhere in this file. The three UNQUALIFIED
// terminal states below (`shared`, `download-started`,
// `download-started-copied`) each claim to concern "the pair currently on
// screen" — call sites that write one of them requalify immediately
// afterward so a side effect carried through that scheduling call cannot
// leave an unqualified claim standing for a pair that, by the time anyone
// reads it, is no longer current.
const REQUALIFY_TO_SELECTED = Object.freeze({
  shared: 'shared-selected',
  'download-started': 'download-started-selected',
  'download-started-copied': 'download-started-selected-copied',
});
function setStatusRequalified(controller, myToken, relationAtStart, state) {
  setStatus(controller, state);
  const qualified = REQUALIFY_TO_SELECTED[state];
  if (!qualified) return;
  const after = recheck(controller, myToken, relationAtStart);
  if (after.verdict !== 'current' && after.verdict !== 'suppressed') {
    setStatus(controller, qualified);
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
// Twelfth remediation gate (final supplement, follow-up): every write below
// is itself a host-controlled boundary (a DOM property setter or method
// call) that can synchronously re-enter `initPairShareUI` on these SAME
// refs — an adversarial probe confirmed this with `btn.disabled = false`
// specifically. Checking `lostRace()` only once, after this whole function
// returns, is not enough: a nested winner completing INSIDE one of these
// writes can already have written its own truthful DOM (or even a click's
// own terminal status), and this function would then blindly continue past
// that point, overwriting it. `stillCurrent()` is checked after EVERY
// individual host-controlled boundary — the property read, the setter
// write, the method lookup, and the method call are each their own
// checkpoint — so a losing caller's own remaining writes here stop at the
// EXACT boundary that lost the race, never one step later.
function resetControllerDOM(controller, lostRace) {
  const stillCurrent = () => !lostRace || !lostRace();
  // Thirteenth remediation gate: a bare `controller.refs.btn`/`.status`
  // property read is itself a host-controlled boundary if `refs` is a
  // hostile object with its own throwing getter for either key — an
  // uncontained throw here would escape straight out of `initPairShareUI`
  // (both of resetControllerDOM's call sites), crashing the whole handover
  // instead of degrading like every other host accessor in this file.
  // `safeProp` is the same contained-read primitive already used for every
  // other property this module reads off a host-controlled object.
  const btn = safeProp(controller.refs, 'btn'); // contained refs/property read — may re-enter
  if (!stillCurrent()) return;
  if (btn) {
    btn.disabled = false; // host-controlled setter — may re-enter
    if (!stillCurrent()) return;
    const setAttr = safeFn(btn, 'setAttribute'); // property read — may re-enter
    if (!stillCurrent()) return;
    if (setAttr) {
      try { invoke(setAttr, btn, ['aria-busy', 'false']); } catch (_) { /* best-effort */ } // call — may re-enter
      if (!stillCurrent()) return;
    }
  }
  const el = safeProp(controller.refs, 'status'); // contained refs/property read — may re-enter
  if (!stillCurrent()) return;
  if (el) {
    el.textContent = ''; // host-controlled setter — may re-enter
    if (!stillCurrent()) return;
    el.hidden = true; // host-controlled setter — may re-enter
    if (!stillCurrent()) return;
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
// Fifteenth remediation gate: `expectedGen`, when given, is the relation-
// notification generation this call is speaking FOR (from
// notifyRelationChange, or from a settled/errored raster's own `.then`
// handler, both of which know exactly which generation they represent).
// When omitted (the click-settle `finally` block's own reconciliation
// call), this function always proceeds against whatever IS current — that
// caller has no specific generation to defend, it just wants the truth.
// A live repro confirmed: `applyBusyDOM`'s own `btn.disabled` setter can
// synchronously trigger a NEWER notifyRelationChange that fully installs
// and correctly busies the SAME button — after which this call's stale
// `pending`/`el` state (captured before that boundary) would otherwise go
// on to overwrite the newer generation's correct DOM. `stillCurrent` is
// threaded into `applyBusyDOM` itself so its OWN internal continuation
// (the disabled-write and the aria-busy write are two separate boundaries)
// aborts at the exact point ownership changes, not one step later; this
// function then rechecks and RE-READS pending state fresh (never trusting
// a pre-boundary snapshot) before ever deciding what to write next.
function syncBusyFromPrerender(controller, expectedGen) {
  if (controller.retired || controller.opInFlight) return;
  if (expectedGen !== undefined && controller.relationGen !== expectedGen) return;
  const stillCurrent = () => !controller.retired && !controller.opInFlight
    && (expectedGen === undefined || controller.relationGen === expectedGen);
  const pending = isPrerenderPending(controller);
  applyBusyDOM(controller, pending, stillCurrent);
  if (!stillCurrent()) return;
  // Re-read fresh — do not reuse `pending` computed before applyBusyDOM's
  // own re-entrant boundary; even though `stillCurrent()` just confirmed
  // this generation is still current, re-deriving from `controller.cache`
  // directly is the same cheap, no-trust-in-locals discipline every other
  // boundary in this file already uses.
  const pendingNow = isPrerenderPending(controller);
  // Thirteenth-post-gate remediation: `controller.refs.status` is itself a
  // host-controlled read (an exact live repro reentered notifyRelationChange
  // from THIS getter) — contain it via safeProp and recheck `stillCurrent()`
  // IMMEDIATELY afterward, before `pendingNow` (captured a moment earlier,
  // now possibly stale) is ever used to decide anything. A reentrant call
  // here always changes `controller.relationGen`, so `stillCurrent()` alone
  // is sufficient to detect it — the earlier live repro let this stale
  // `pendingNow` survive the read and go on to write "preparing…" back over
  // a newer notification's already-correct idle/null state.
  const el = safeProp(controller.refs, 'status'); // contained property read — may re-enter
  if (!stillCurrent()) return;
  if (!el) return;
  const busyMsg = pairShareStatusMessage('busy');
  // `el.hidden`/`el.textContent` are two more individually re-entrant
  // host-controlled getters — read each at most once, through safeProp, with
  // its own recheck immediately after, rather than folding both into one
  // compound expression a re-entrant getter could straddle undetected.
  const hiddenNow = safeProp(el, 'hidden'); // contained property read — may re-enter
  if (!stillCurrent()) return;
  const textNow = safeProp(el, 'textContent'); // contained property read — may re-enter
  if (!stillCurrent()) return;
  // Eighth remediation gate: a background prerender becoming pending for a
  // NEWER pair (started via notifyRelationChange while a click-triggered
  // operation was still in flight) must not stomp the truthful terminal
  // status that operation's own `finally` just wrote (shared-selected,
  // stale, download-started[-selected][-copied], cancelled, failed) the
  // instant opInFlight clears and this function runs unguarded again. The
  // BUTTON's disabled/aria-busy state may still legitimately reflect the
  // pending render (a second click would have to wait for it either way);
  // only the live status TEXT is protected, and only for as long as it is
  // genuinely still showing a real terminal result (`!hiddenNow` — the
  // moment that message's own auto-hide timer actually fires, this stops
  // applying and a later prerender is free to show `busy` normally).
  const showingTerminal = !!(!hiddenNow && textNow && textNow !== busyMsg);
  if (pendingNow) {
    // `stillCurrent` is threaded through so setStatus's OWN internal
    // boundaries (the status ref read, clearStatusTimer, the textContent/
    // hidden setters) each recheck ownership too — a busy-sync caller
    // passing one check up front must not go on to write after a re-entrant
    // boundary INSIDE setStatus itself hands ownership to a newer generation.
    if (!showingTerminal) setStatus(controller, 'busy', stillCurrent);
  } else if (textNow === busyMsg) {
    // The pre-render just settled (or there is nothing to prepare) with no
    // click in flight — no download was started and no share was attempted,
    // so there is no terminal outcome to announce. Only ever clears OUR OWN
    // "preparing…" text, never a real terminal status a click already wrote.
    clearStatusTimer(controller);
    // Twelfth remediation gate: clearStatusTimer's own clearTimeout() call
    // can synchronously re-init/retire this controller — recheck before
    // writing DOM a new controller (same reused refs) may have taken over.
    // Fifteenth remediation gate: also recheck the relation generation —
    // clearTimeout is host-controlled and could just as easily trigger a
    // newer notification as any other boundary here.
    if (!stillCurrent()) return;
    el.textContent = ''; // host-controlled setter — may re-enter
    if (!stillCurrent()) return;
    el.hidden = true; // host-controlled setter — may re-enter
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
  // Fifteenth remediation gate: claim this notification's generation FIRST,
  // before any re-entrant host boundary — `buildPairImprintSnapshot()`
  // below reads host-controlled properties off `relation` and can
  // synchronously call `notifyRelationChange()` again on this SAME
  // controller (a nested, NEWER notification). A live repro confirmed the
  // old code had no such claim: the nested call could fully install and
  // warm its own cache, after which the OUTER (now-stale) call resumed and
  // started its OWN rasterization, then overwrote the newer cache with its
  // own stale entry. `stillLatest()` is rechecked after every re-entrant
  // boundary and before every cache/status/DOM mutation from here on — only
  // the call that still holds the latest generation may publish, settle,
  // or synchronize anything.
  const myGen = ++controller.relationGen;
  const stillLatest = () => !controller.retired && controller.relationGen === myGen;
  // Eleventh remediation gate, B1: this is now the SOLE place that decides
  // whether a relation change invalidates whatever status text is showing
  // — ui/dyad.js's own clearOutput() used to blank #dyad-share-status
  // directly and unconditionally, which raced a genuinely in-flight click:
  // if a native-share promise for the OLD pair was still pending when the
  // pair was cleared/replaced, that direct write erased the truthful
  // "preparing pair image…" text a moment before this module's own
  // opInFlight guard would otherwise have protected it, leaving a
  // disabled/aria-busy button with an empty, unannounced status for the
  // rest of that operation. The guard here is the same one
  // syncBusyFromPrerender already trusts: while a click-triggered
  // operation owns the status (`opInFlight`), NOTHING about a relation
  // change may touch it — that operation's own `finally` is what
  // eventually reconciles, once it knows the truthful outcome. Only when
  // no click currently owns it does a pair change clear whatever was
  // showing (a stale terminal result from the pair that just left, or a
  // stale "preparing…" for a prerender that's about to be replaced).
  if (!controller.opInFlight) {
    // Thirteenth-post-gate remediation: `controller.refs.status` is itself a
    // host-controlled read — contained via safeProp, with `stillLatest()`
    // rechecked IMMEDIATELY afterward (before even calling
    // clearStatusTimer), not only after the writes below. A nested
    // notification claimed during this very read must stop this
    // continuation from touching `el` at all.
    const el = safeProp(controller.refs, 'status'); // contained property read — may re-enter
    if (stillLatest() && el) {
      clearStatusTimer(controller);
      // Twelfth remediation gate: clearStatusTimer's own clearTimeout()
      // call can synchronously re-init/retire this controller — recheck
      // before writing DOM a new controller (same reused refs) may have
      // already taken over. Fifteenth remediation gate: also recheck the
      // relation generation, for the SAME reason.
      if (stillLatest()) {
        el.textContent = ''; // host-controlled setter — may re-enter
        if (stillLatest()) {
          el.hidden = true; // host-controlled setter — may re-enter
        }
      }
    }
  }
  // Check again here, explicitly, before proceeding to snapshot/raster
  // work — a nested notification claimed anywhere in the status-clearing
  // block above (the refs.status read, or either setter) must stop this
  // continuation before it ever reads a single property off `relation`.
  if (!stillLatest()) return;
  const snapshot = relation ? buildPairImprintSnapshot(relation) : null;
  // The critical checkpoint: buildPairImprintSnapshot() reads host-
  // controlled properties off `relation` (elementDirectionAB,
  // numerologySpine, cardPairHead) and is exactly where a hostile getter
  // can install a newer generation. Stop here, BEFORE ever starting a
  // rasterization or touching the cache, if a newer notification already
  // won — closes the "wasted/corrupting third render" the repro observed.
  if (!stillLatest()) return;
  if (!snapshot) {
    controller.cache = null;
    syncBusyFromPrerender(controller, myGen);
    return;
  }
  const entry = { relation, snapshot, blob: null, error: null, promise: null };
  entry.promise = svgToPngBlob(buildPairImprintSVG(snapshot), PNG_W, PNG_H);
  entry.promise.then(
    blob => {
      if (controller.retired || controller.cache !== entry) return;
      entry.blob = blob;
      // `entry === controller.cache` already proves this generation is the
      // one currently published — read it fresh rather than closing over
      // `myGen`, since a settle can itself run long after this notify()
      // call returned.
      syncBusyFromPrerender(controller, controller.relationGen);
    },
    err => {
      if (controller.retired || controller.cache !== entry) return;
      entry.error = err;
      syncBusyFromPrerender(controller, controller.relationGen);
    },
  );
  // The final gate before publishing — a newer notification could have won
  // since the last check above (constructing `entry`/starting the raster
  // touches no host-controlled property, but this checkpoint costs nothing
  // and keeps the discipline uniform: never publish without confirming
  // ownership immediately beforehand).
  if (!stillLatest()) return;
  controller.cache = entry;
  syncBusyFromPrerender(controller, myGen);
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
  const read = readRelation(controller.hooks, () => !controller.retired && controller.opToken === myToken);
  // Eleventh remediation gate: ownership is re-verified AFTER the hook
  // call, not just before it. `hooks.getRelation()` is host-provided code
  // this module does not control — a hostile hook can synchronously call
  // `initPairShareUI()` again on the SAME refs as a side effect of being
  // read, which retires THIS controller (sets `controller.retired = true`)
  // mid-call. Without this second check, a retired controller whose hook
  // happens to return the value it started with would read as 'current'
  // and its caller would proceed to click/copy/share on a DOM it no longer
  // owns. Checking again here — after the read, before interpreting it —
  // closes that reentrancy window completely.
  if (controller.retired || controller.opToken !== myToken) return { verdict: 'suppressed' };
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
  // Tenth remediation gate: the actual irreversible boundary is the anchor
  // CLICK inside downloadBlob(), not entry into this function —
  // URL.createObjectURL/createElement/appendChild are all preparatory and
  // fully reversible (downloadBlob discards the anchor and revokes the URL
  // if precheck declines). `lastCheck` captures the verdict from that exact
  // moment so the status-mapping code below doesn't need to re-call the
  // hook a second time for the same logical check.
  let lastCheck = null;
  const precheck = () => {
    lastCheck = recheck(controller, myToken, relationAtStart);
    return lastCheck.verdict === 'current';
  };
  let result = null;
  let prepError = null;
  try {
    result = downloadBlob(blob, IMPRINT_FILENAME, precheck);
  } catch (e) {
    prepError = e;
  }
  if (prepError) {
    // Eleventh remediation gate, B5: a PREPARATORY throw (before the click
    // boundary was ever reached) does not erase an identity change that
    // already happened before it — e.g. a hostile URL.createObjectURL side
    // effect, followed by an unrelated createElement throw. A fresh recheck
    // here reports the more specific/accurate outcome (`stale` if identity
    // already changed) rather than a blind `failed` that would mask it.
    // renderFailureStatus (not preEffectStatus) applies: the step ITSELF
    // failed, so even a CONFIRMED-current identity still means `failed`
    // here, not "proceed".
    const finalCheck = recheck(controller, myToken, relationAtStart);
    const status = renderFailureStatus(finalCheck.verdict);
    if (status) setStatus(controller, status);
    return;
  }
  if (!result.clicked) {
    // precheck ran and declined — identity had already changed/became
    // unconfirmable/the controller retired, all BEFORE the click, so
    // nothing irreversible happened here: ordinary pre-effect mapping,
    // exactly like every other "before this pair's first irreversible
    // action" checkpoint in this file.
    const pre = preEffectStatus(lastCheck.verdict);
    if (pre) { setStatus(controller, pre); return; }
    if (lastCheck.verdict === 'suppressed') return;
    setStatus(controller, 'failed'); // defensive: verdict read 'current' yet declined should not occur
    return;
  }

  // Item 7 / fourth-gate item 1 (truthful stale/native-share contract, the
  // same logic applied to the download side of the fallback), corrected by
  // the sixth gate item 2: the click above already invoked the browser's
  // download — an IRREVERSIBLE action outside this controller's power to
  // undo. From this point on, identity changing (or becoming unconfirmable)
  // can only affect whether the CLIPBOARD copy is attempted/announced and
  // whether the download is reported as concerning the pair now on screen
  // or the pair SELECTED at click time — it must never be reported as if
  // the download itself never happened.
  //
  // Eleventh remediation gate, B2: `result.clickThrew` means the click was
  // genuinely INVOKED (crossed the boundary) but the call itself threw
  // afterward — this can NEVER be reported as `failed` (that would erase an
  // already-invoked, possibly-effective action). Skip the clipboard step
  // entirely in that case (too uncertain to layer a second host call on top
  // of an anchor that just misbehaved) and report the download truthfully
  // via the same current/selected split every other completed effect uses.
  if (result.clickThrew) {
    const check = recheck(controller, myToken, relationAtStart);
    const state = postEffectStatus(check.verdict, 'download-started', 'download-started-selected');
    if (state) setStatusRequalified(controller, myToken, relationAtStart, state);
    return;
  }

  // Eighth remediation gate: `navigator.clipboard` and its `.writeText`
  // property are read through `safeProp`/`safeFn` (defined above,
  // trySyncNativeShare) rather than as bare property accesses — a hostile
  // getter must degrade to "no clipboard available" the same way an absent
  // one already does, never throw straight through this function and skip
  // the `setStatus` calls below.
  // Fourteenth remediation gate: `safeNavigator()`, the `clipboard` getter,
  // and the `writeText` getter are THREE separate host-controlled
  // boundaries, each individually re-entrant — an exact live repro
  // confirmed a hostile `clipboard` getter can write DIRECTLY to DOM this
  // controller no longer owns (having already lost ownership to a nested
  // re-init the `navigator` read itself triggered), entirely BEFORE the
  // single compound recheck that used to follow all three reads together
  // ever ran. Each read now gets its own immediate ownership recheck,
  // exactly like every other host accessor sequence in this file — the
  // already-started download is never undone by any of them; only the
  // CLIPBOARD copy that follows is ever suppressed.
  const postDownloadCheckpoint = () => {
    const check = recheck(controller, myToken, relationAtStart);
    if (check.verdict === 'current') return false;
    const state = postEffectStatus(check.verdict, 'download-started', 'download-started-selected');
    if (state) setStatus(controller, state);
    return true; // caller must return
  };
  const nav = safeNavigator(); // host-controlled — may re-enter
  if (postDownloadCheckpoint()) return;
  const clipboardObj = safeProp(nav, 'clipboard'); // host-controlled getter — may re-enter
  if (postDownloadCheckpoint()) return;
  const writeTextFn = safeFn(clipboardObj, 'writeText'); // host-controlled getter — may re-enter
  if (postDownloadCheckpoint()) return;
  if (writeTextFn) {
    let clipboardOk = false;
    try {
      // Once invoked, the write is COMMITTED — exactly like navigator.share()
      // in trySyncNativeShare, a side effect discovered AFTER this call must
      // never suppress `clipboardOk`/erase that the write genuinely
      // happened; only the final recheck below (after the await) decides
      // how the outcome is REPORTED (selected vs. unqualified), never
      // whether it occurred.
      const result2 = invoke(writeTextFn, clipboardObj, [caption]); // host call — may re-enter
      // Eighth remediation gate: a callable-but-non-promise return is not a
      // genuine copy this module can vouch for — `await result` on a
      // non-thenable resolves immediately rather than throwing, which would
      // otherwise read as the clipboard write having actually succeeded.
      // Retains the download-started status without the falsely-earned
      // "-copied" suffix, exactly like a thrown/rejected write does.
      if (isThenable(result2)) {
        await result2;
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
    if (state) setStatusRequalified(controller, myToken, relationAtStart, state);
    return;
  }
  // "No clipboard at all" tail — recheck once more (the identity could
  // still have changed between the click's own precheck and this point,
  // e.g. while reading the clipboard capability itself) and map via the
  // same truthful selected/unqualified split as every other post-download
  // checkpoint above.
  const check = recheck(controller, myToken, relationAtStart);
  const state = postEffectStatus(check.verdict, 'download-started', 'download-started-selected');
  if (state) setStatusRequalified(controller, myToken, relationAtStart, state);
}

// The fast path: a cached Blob is already ready at click time, so a native
// share attempt can still happen with transient activation intact. Every
// step up to and including `navigator.share(...)`'s CALL is synchronous;
// only the returned promise is awaited.
async function shareOrFallback(controller, myToken, relationAtStart, snapshot, blob) {
  const attempt = trySyncNativeShare(controller, myToken, relationAtStart, blob, snapshot);
  if (attempt.kind === 'preempted') {
    // Identity already changed/became unconfirmable/the controller was
    // retired during one of trySyncNativeShare's own preparatory host
    // calls — nothing irreversible happened on this path (no share
    // attempt, no download), so this is the ordinary pre-effect mapping,
    // and — critically — falling all the way through here means we never
    // reach downloadFallback for this click at all.
    const pre = preEffectStatus(attempt.verdict);
    if (pre) { setStatus(controller, pre); return; }
    if (attempt.verdict === 'suppressed') return;
    setStatus(controller, 'failed'); // defensive: verdict was 'current' yet preempted should not occur
    return;
  }
  if (attempt.kind === 'attempted') {
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
      if (state) setStatusRequalified(controller, myToken, relationAtStart, state);
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
  // attempt.kind === 'not-attempted': no native-share capability at all
  // (or trySyncNativeShare's own rechecks already found the identity
  // unchanged at every preparatory boundary it checks). Nothing
  // irreversible has happened on this path yet — the actual irreversible
  // boundary is the anchor CLICK inside downloadBlob(), not entry into
  // downloadFallback() itself (URL.createObjectURL/createElement/
  // appendChild are all preparatory and fully reversible by revoking the
  // URL and discarding the anchor), so downloadFallback() below performs
  // its OWN identity precheck immediately before that click — the single
  // source of truth for this boundary, not duplicated here.
  await downloadFallback(controller, myToken, relationAtStart, snapshot, blob);
}

function onShareClick(controller) {
  return (async () => {
    if (controller.retired || controller.opInFlight) return;
    // Twelfth remediation gate (pre-commit race addendum, item 1 + second
    // supplement): ownership of this operation is claimed HERE, before any
    // host-controlled read — not after. `readRelation()` below calls
    // host-provided `getRelation()`, and `buildPairImprintSnapshot()` reads
    // three more host-controlled properties off whatever it returns; either
    // can synchronously (a) re-invoke this exact controller's
    // `onShareClick()` again (a re-entrant hook — the second-supplement's
    // exact probed scenario produced two native-share calls), or (b) call
    // `initPairShareUI()` on the same refs, retiring this controller mid-
    // read. Claiming `opInFlight`/`opToken` FIRST closes both windows: a
    // nested call sees `opInFlight` already true and returns immediately
    // (never a second share attempt), and a re-init sets `controller.
    // retired = true`, which every check below re-verifies before writing
    // anything further. The whole body now runs inside the SAME try/
    // finally that already existed — its own `!controller.retired &&
    // controller.opToken === myToken` guard is what correctly releases
    // (or declines to release, when superseded) the reservation on every
    // path, including these two new early returns.
    const myToken = ++controller.opToken;
    controller.opInFlight = true;
    // Fourteenth remediation gate: `applyBusyDOM`/`setStatus('busy')` used
    // to run BEFORE this try/finally even began — a throw from either (a
    // hostile `refs` getter, a throwing setter) would then escape as an
    // unhandled rejection with `opInFlight` never reset, silently wedging
    // every future click on this controller. Both now run INSIDE the same
    // guarded block whose `finally` is what always releases the
    // reservation.
    try {
      applyBusyDOM(controller, true);
      setStatus(controller, 'busy');
      const read = readRelation(controller.hooks, () => !controller.retired && controller.opToken === myToken);
      if (controller.retired || controller.opToken !== myToken) return; // suppressed — a newer/retiring event already happened; write nothing
      if (!read.ok) { setStatus(controller, 'failed'); return; } // P2 hook truth: a throw is a read failure, not "empty"
      const relationAtStart = read.value;
      const snapshot = buildPairImprintSnapshot(relationAtStart);
      if (controller.retired || controller.opToken !== myToken) return; // suppressed — the snapshot's own property reads could have re-entered too
      if (!snapshot) { setStatus(controller, 'empty'); return; }

      const cacheEntry = controller.cache;
      const cacheMatches = !!(cacheEntry && cacheEntry.relation === relationAtStart);

      if (cacheMatches && cacheEntry.blob) {
        await shareOrFallback(controller, myToken, relationAtStart, snapshot, cacheEntry.blob);
        return;
      }

      let blob;
      // Fifteenth remediation gate: a transient prerender failure for this
      // SAME (unchanged) relation used to be cached forever — every later
      // click on the still-current pair returned `failed` with no retry,
      // even though nothing about the pair itself is broken and a fresh
      // rasterization attempt could genuinely succeed. `usableCachedPromise`
      // excludes an errored entry, forcing a real re-render below instead
      // of re-awaiting the SAME already-rejected promise; the errored slot
      // is cleared from `controller.cache` (only if it's still the current
      // cache — never a newer relation's own entry) so a later
      // notifyRelationChange doesn't find a stale error sitting where a
      // fresh proactive prerender should go. If the retry succeeds,
      // control falls through to the SAME download-only path any other
      // click-time fresh render already takes (activation was already lost
      // crossing this await) — never a synthesized native-share success.
      const usableCachedPromise = cacheMatches && cacheEntry.promise && !cacheEntry.error;
      if (cacheMatches && cacheEntry.error && controller.cache === cacheEntry) {
        controller.cache = null;
      }
      try {
        blob = usableCachedPromise
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
        // Fourteenth remediation gate: `syncBusyFromPrerender` itself calls
        // `applyBusyDOM`, which can throw from an unguarded host SETTER
        // (e.g. `btn.disabled = ...`, never try/catch-contained the way a
        // property GETTER read is) — this call sits in `finally`, outside
        // the `try` above, so nothing catches that throw otherwise: it
        // would escape as an unhandled rejection from onShareClick() even
        // though `opInFlight` was already correctly released on the line
        // above. Best-effort DOM reconciliation must never turn into a
        // broken promise contract.
        try { syncBusyFromPrerender(controller); } catch (_) { /* best-effort */ }
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
// Twelfth remediation gate (final supplement, item 2): a WeakMap from a
// physical button element to its one, permanent dispatch wiring. Installed
// EXACTLY ONCE per button (cached), so re-init on the same button can never
// accumulate a second real listener — one physical click event reaches at
// most one controller BY CONSTRUCTION, never two, regardless of how a
// handover unfolds. Dispatch resolves `wiring.current` at CLICK TIME (not
// bind time), so re-init only ever needs to update a pointer, never touch
// `addEventListener` again.
const _buttonWiring = new WeakMap();
// Thirteenth remediation gate (live-repro follow-up): a hostile
// `addEventListener` GETTER doesn't just carry a side effect through — the
// FUNCTION IT RETURNS can do anything at all, since this file only ever
// controls how it's invoked (Reflect.apply, correct receiver), never what
// it does. An exact live repro confirmed: the getter reentrantly completes
// a nested winner, and the LOSING outer then invokes the STALE function the
// getter already returned to it, corrupting DOM the winner had already
// claimed — publishing the wiring record before the read (the twelfth
// gate's fix) stops a nested call from installing a SECOND listener, but it
// never stopped the OUTER from following through on its own now-stale read.
// `wiring.state` closes that: 'new' (published, unclaimed) -> 'installing'
// (claimed, BEFORE the invocation, so a CALL-time reentry — the invoke()
// below re-entering synchronously — finds this and never attempts a second
// install) -> 'installed' | 'failed' (terminal; every later call, nested or
// sequential, just returns the wiring). Only the call that finds 'new' AND
// confirms its own `stillCurrent()` immediately after the read may ever
// invoke what the read returned — a losing outer's read can complete after
// a nested winner has already finished installing, and it must stop right
// there, discarding whatever the getter handed it, never invoking it.
function buttonWiringFor(btn, stillCurrent) {
  // WeakMap keys must be objects — a missing/non-object `btn` (no refs, or
  // refs with no button at all, both tolerated elsewhere in this module)
  // gets its own throwaway, unshared wiring record instead of a lookup.
  if (btn === null || (typeof btn !== 'object' && typeof btn !== 'function')) {
    return { current: null };
  }
  let wiring = _buttonWiring.get(btn);
  if (!wiring) {
    // Twelfth remediation gate (second final-supplement correction): publish
    // the wiring record to the WeakMap BEFORE ever reading or invoking the
    // host-controlled `addEventListener` — not after. `btn.addEventListener`
    // is itself a property a hostile getter can carry a side effect through
    // (re-entering `initPairShareUI` on this SAME button, synchronously,
    // before the getter even returns a value), and the CALL to whatever it
    // returns can do the same (some environments invoke listener-registration
    // callbacks synchronously). Either way, a re-entrant `buttonWiringFor(btn)`
    // call must find this record ALREADY present and reuse it.
    wiring = { current: null, state: 'new' };
    _buttonWiring.set(btn, wiring);
  }
  if (wiring.state !== 'new') return wiring; // already claimed (installing/installed/failed) by an earlier call on this button — never touch addEventListener again
  // Getter and invocation are separate host-controlled boundaries, exactly
  // like every other host accessor in this file: read/extract via safeFn
  // (contained against a throwing/hostile getter), then invoke via the
  // trusted `invoke()` primitive (Reflect.apply) — never
  // `addEventListener.call(...)`, which would read a `.call` property a
  // hostile function could shadow.
  const addListener = safeFn(btn, 'addEventListener'); // getter — may re-enter
  // Re-check BOTH the state (a nested call reentering from inside the read
  // above may have already run this entire function to completion) and
  // this call's own ownership, immediately after the read and BEFORE ever
  // invoking whatever it returned.
  if (wiring.state !== 'new' || (stillCurrent && !stillCurrent())) return wiring;
  if (!addListener) { wiring.state = 'failed'; return wiring; }
  wiring.state = 'installing'; // claimed BEFORE invocation
  try {
    invoke(addListener, btn, ['click', () => {
      const live = wiring.current;
      // onShareClick() already invokes and returns the started promise
      // (not a function to call again) -- returned here so callers
      // dispatching a real click event and awaiting its handler's return
      // value (this suite's own `clickShare` helper does exactly that)
      // keep working identically to the old per-controller-listener
      // wiring.
      return live ? onShareClick(live) : undefined;
    }]);
    wiring.state = 'installed';
  } catch (_) {
    // A throwing addEventListener leaves this button with no real
    // dispatch — but the wiring record itself is still safely published
    // and singular; a later re-init on the same button reuses it rather
    // than retrying installation (matching this file's existing
    // discipline of degrading rather than retrying a failed host call).
    wiring.state = 'failed';
  }
  return wiring;
}

// A controller that LOSES the init race (a nested/re-entrant init completed
// during this one's own handover) returns this instead of a real
// controller — every method is a safe no-op that touches no DOM/state a
// winning controller now owns.
const INERT_FACADE = Object.freeze({
  onShareClick: () => Promise.resolve(),
  notifyRelationChange: () => {},
});

export function initPairShareUI(refs, hooks) {
  // Twelfth remediation gate (final supplement, item 2): a generation token
  // claimed FIRST, before any other work. Every host-controlled step in the
  // handover below (timer cancellation, DOM property/attribute resets,
  // capability/disclosure getters) can re-enter this exact function (e.g. a
  // hostile clearTimeout that synchronously calls initPairShareUI on the
  // SAME refs) — a nested call increments this SAME module-level counter,
  // so the OUTER (now-stale) call can detect at every later checkpoint that
  // it lost the race and stop touching anything further: no listener, no
  // DOM write, no `_activeController`/wiring ownership claim.
  const myGen = ++_initGen;
  const lostRace = () => _initGen !== myGen;

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
    clearStatusTimer(prior); // host-controlled call — may re-enter this function
    if (lostRace()) return INERT_FACADE;
    resetControllerDOM(prior, lostRace); // per-boundary guarded internally — may re-enter at any step
    if (lostRace()) return INERT_FACADE;
  }

  const controller = {
    refs: refs || {},
    hooks: hooks || {},
    retired: false,
    opToken: 0,
    opInFlight: false,
    cache: null,
    statusTimer: null,
    statusTimerGen: 0,
    // Fifteenth remediation gate: a monotonic per-controller counter claimed
    // by notifyRelationChange() at entry, before any re-entrant host
    // boundary — the "latest notification wins" ownership token for the
    // whole notify/prerender/busy-sync lifecycle, distinct from opToken
    // (which governs CLICK operations, not relation-change notifications).
    relationGen: 0,
    listener: null,
  };
  // Deterministic initial DOM, independent of whatever the retirement reset
  // above did or didn't reach (e.g. the very first init, or refs that
  // happen to differ from the prior controller's) — a fresh controller
  // never starts from an ambiguous DOM state.
  resetControllerDOM(controller, lostRace); // per-boundary guarded internally — may re-enter at any step
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  controller.listener = () => onShareClick(controller);
  // Thirteenth remediation gate (atomic-handoff follow-up): the button
  // reference read (`controller.refs.btn`, a property a hostile `refs`
  // object can shadow with its own getter) and the `buttonWiringFor(...)`
  // call are two separate boundaries — reading the reference and acting on
  // it are checked independently, exactly like every other host accessor
  // in this handover, rather than combined into one expression with a
  // single recheck after both. `safeProp` contains a throwing `refs.btn`
  // getter the same way every other property this module reads off a
  // host-controlled object already is — a bare `controller.refs.btn` would
  // let that throw escape uncaught, straight out of `initPairShareUI`.
  const btnRef = safeProp(controller.refs, 'btn'); // contained property read — may re-enter
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  // ONE real listener per physical button, ever (buttonWiringFor caches it)
  // — this call may itself run addEventListener for the FIRST TIME on this
  // button (host-controlled), but never a second time on a re-init.
  // `lostRace` is passed through as buttonWiringFor's own `stillCurrent` —
  // its internal state machine needs THIS call's ownership checked at the
  // exact moment between its addEventListener read and invocation, not
  // only before/after the whole buttonWiringFor call from out here.
  const wiring = buttonWiringFor(btnRef, () => !lostRace());
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  // Disclosure sequence: the refs lookup, the capability read (navigator —
  // host-controlled), and the textContent SETTER (DOM — host-controlled)
  // are three distinct boundaries, each individually re-entrant, checked
  // separately so a nested winner's own disclosure write can never be
  // displaced by this call resuming past just one of them.
  const disclosureEl = safeProp(controller.refs, 'disclosure'); // contained property read — may re-enter
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  if (disclosureEl) {
    // Thirteenth remediation gate: detectShareCapability() used to combine
    // the global `navigator` access, the `navigator.share` getter, and the
    // `navigator.canShare` getter into one boundary with a single recheck
    // after all three — each is its own host-controlled property read,
    // individually re-entrant, so a hostile `share` or `canShare` getter
    // reentering here must be caught at THAT exact read, not only after
    // the combined helper returns. safeNavigator() is the same single-
    // contained-read primitive every other navigator access in this file
    // uses — one boundary, one checkpoint, not a second bespoke reader.
    const nav = safeNavigator(); // global access — may re-enter
    if (lostRace()) { controller.retired = true; return INERT_FACADE; }
    let hasShare = false;
    if (nav) {
      try { hasShare = typeof nav.share === 'function'; } catch (_) { hasShare = false; } // getter — may re-enter
    }
    if (lostRace()) { controller.retired = true; return INERT_FACADE; }
    let capable = false;
    if (hasShare) {
      try { capable = typeof nav.canShare === 'function'; } catch (_) { capable = false; } // getter — may re-enter
    }
    if (lostRace()) { controller.retired = true; return INERT_FACADE; }
    const disclosureText = pairImprintDisclosureText(capable); // pure — no host boundary
    disclosureEl.textContent = disclosureText; // host-controlled setter — may re-enter
    if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  }

  // This controller WON the init race — claim ownership as the LAST step,
  // atomically from this function's own perspective (nothing further below
  // can lose the race, since nothing further re-enters).
  wiring.current = controller;
  _activeController = controller;
  return {
    onShareClick: controller.listener,
    notifyRelationChange: relation => notifyRelationChange(controller, relation),
  };
}
