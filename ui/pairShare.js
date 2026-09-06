// 8ball / ui / pairShare.js — the Pair Imprint (DOCTRINE §5.D / §1.J v0.83)
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
//   failed                     — a RASTERIZATION exception (no PNG exists to
//                                fall back to), a getRelation() hook that
//                                threw on a PRE-EFFECT read (an UNREADABLE/
//                                unconfirmable identity — P2 hook truth,
//                                including the post-throw re-read case —
//                                sixth gate, item 2), or a download that
//                                itself never fired (a preparatory failure
//                                inside downloadFallback/downloadBlob) —
//                                always before any irreversible action. A
//                                CONFIRMED pre-effect identity CHANGE is
//                                `stale`, never `failed` — the two are not
//                                interchangeable: `failed` means currency
//                                could not be read at all, `stale` means it
//                                WAS read and is confirmed different (see
//                                `preEffectStatus` above, the single source
//                                of truth for this split). Exact-gate
//                                remediation correction (2026-09-05): a bare
//                                NATIVE-SHARE exception/rejection is
//                                deliberately NOT in this list — DOCTRINE
//                                §1.J v0.87/v0.88: a non-Abort
//                                `navigator.share()` failure proves only
//                                that the native chooser refused, not that
//                                the already-rendered local PNG is unusable,
//                                so that path attempts the on-device
//                                download fallback (see `shareOrFallback`'s
//                                own non-Abort catch branch) SUBJECT TO the
//                                SAME identity recheck every other
//                                preparatory boundary here already uses —
//                                if identity is confirmed current, the
//                                fallback proceeds and only an unrelated
//                                LATER failure could still report `failed`;
//                                if identity already changed/is
//                                unconfirmable at that exact recheck, the
//                                ordinary pre-effect `stale`/`failed` split
//                                above applies instead, and no download is
//                                attempted at all. A prior version of this
//                                comment listed "a render/share exception"
//                                as one undifferentiated cause, which read as
//                                though any share exception alone settles
//                                here — it does not.
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
// Like `safeFn`, but reports whether the property GETTER itself threw,
// rather than collapsing "threw" and "genuinely absent/non-function" to the
// same `null` — used only by `applyView` below, which treats BOTH as a
// failed pass (a permanently missing method can never succeed on retry, but
// `ok` must still honestly report that this field did not apply this pass;
// see applyView's own comment). `readFnOrThrew` keeps the two outcomes
// distinct only because a caller reasoning about WHY a pass failed still
// benefits from knowing whether it was a transient throw or a permanent
// absence — not because the two are treated differently here.
function readFnOrThrew(obj, key) {
  try {
    const fn = obj == null ? undefined : obj[key];
    return { threw: false, fn: typeof fn === 'function' ? fn : null };
  } catch (_) {
    return { threw: true, fn: null };
  }
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
  } catch (_) { /* best-effort — the coordinator's own armGen identity check is the real guard */ }
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
    // Non-Abort: DOCTRINE (§1.J v0.87) — a non-Abort share exception proves
    // only that native sharing failed, not that the already-rendered local
    // PNG is unusable, so this routes to the download fallback rather than
    // a direct `failed`. But recheck HERE, immediately, so a genuine
    // identity change carried through THIS call is reported precisely
    // (`preempted`/changed-or-unknown) instead of silently falling through
    // to download a pair that already moved on — the exact gap an unrelated
    // LATER preparatory throw could otherwise mask by collapsing everything
    // to a generic `failed`.
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

// ── the view coordinator (Fifteenth remediation gate — model-first
// reconciliation, replacing the per-boundary stillCurrent checkpoint
// mechanism) ─────────────────────────────────────────────────────────────
//
// A fourteenth-gate candidate (exact SHA `8a7906a`, and its own successor
// `b3db422`) was independently reviewed and BLOCKED: threading a
// `stillCurrent` predicate through every individual DOM write, and adding
// a `reconcileCurrentStatus()` recovery call after each one, papered over
// specific reported reentrancy shapes without closing the underlying
// structural hole — a hostile SETTER that reenters and only commits its
// OWN stale value to its backing field AFTER the reentrant call returns
// can still land its stale write one statement later than any single
// checkpoint anticipates, and the reviewer found a genuinely NEW instance
// of it inside `armStatusTimer`'s own busy-decision, inside
// `applyBusyDOM`'s two writes, inside a raw prerender-settlement write
// `reconcileCurrentStatus` never covered, inside three-generation (A→B→C)
// cascades where the recovery call ITSELF became a second reentrancy site,
// and inside a genuine host-setter THROW (not reentrancy) that the old
// bare `el.textContent = msg` had no containment for at all.
//
// The fix is architectural, not one more checkpoint: ONE canonical desired
// VIEW MODEL per physical button/status pair (`coordinatorFor`, WeakMap-
// keyed on the button, mirroring `_buttonWiring` — a coordinator persists
// across re-inits on the same refs, which is what lets a SUCCESSOR
// controller's idle reset survive a PREDECESSOR's stale post-reentry
// commit; see `initPairShareUI` below). Every transition (a relation
// change, a click starting, a terminal outcome, a timer firing) does
// exactly one thing: merge a patch into `coord.desired` and increment
// `coord.viewRev`. Transitions NEVER derive what to write by reading the
// DOM or by threading a same-generation predicate through multiple
// writes — the model itself is the single source of truth, and it is
// never host-controlled, so nothing can lie to it.
//
// A single `drain()` loop is the ONLY code that ever touches
// `btn.disabled`, `btn`'s `aria-busy` attribute, `status.textContent`, or
// `status.hidden`. It is non-recursive by construction: if a transition
// fires while a drain is already running (the coordinator's own DOM write
// synchronously triggered a nested transition, e.g. a hostile setter
// calling back into `notifyRelationChange`), that nested call finds
// `coord.running` true, updates the model, marks `coord.dirty`, and
// returns immediately — it never calls into `applyView` itself. The ONE
// active `drain()` call, still executing lower in the same call stack,
// is what notices `dirty` after its current apply attempt and loops to
// reapply the NEWEST model state. A hostile setter's own post-reentry
// stale commit therefore lands on a value the very next loop iteration
// overwrites with the true current state — proven exhaustively below and
// by every adversarial regression in tests/pair_share.test.js — without
// ever needing a bespoke recovery call at the site that lost the race.
// Recursion never grows with cascade depth: it is a `while` loop in one
// stack frame, bounded by `SYNC_PASS_BUDGET` (proven at a depth-5000
// synchronous cascade with room to spare) and backed by a queued
// microtask continuation for anything deeper — no `RangeError` is
// possible from reentrancy depth alone. An infinite adversary (a setter
// that reenters on literally every single call, forever) is not claimed
// to converge; that is the same honest limit every other recursive
// boundary in this module (`buttonWiringFor`'s state machine,
// `initPairShareUI`'s own `lostRace` handover) already carries.
//
// A DOM setter that THROWS (not reenters) is contained per-field inside
// `applyView` and treated as "this pass did not fully apply" — the SAME
// `dirty`-driven loop retries the identical (unchanged) view a small,
// separately-bounded number of times, which self-heals a transient host
// hiccup without ever letting the exception escape to a caller. This is
// load-bearing, not cosmetic: `onShareClick`'s own outer `catch` maps ANY
// escaping exception to `failed`, and once a share or download has
// genuinely fired, reporting `failed` would erase a real, irreversible,
// successful effect. Because `applyView` can never throw, that overclaim
// can no longer happen — the externally accurate terminal outcome (share
// or download succeeded) survives even when the best-effort display
// update needs a retry to catch up.
//
// `armGen` (owns exactly one question: "is this specific scheduled
// callback still the one whose firing should be honored") is
// DELIBERATELY never threaded into the model-mutation path — the
// fourteenth-gate candidate's own regression bumped its status-timer
// generation from INSIDE the same call that then checked that identical
// generation, self-invalidating an authorized transition for no
// adversarial reason at all (`repro_pair_timer_self_invalidate_b3.mjs`
// pins exactly this). `viewRev`/`dirty` (owns "does the model need
// reapplying") and `relationGen`/`opToken` (controller-level: "should
// THIS continuation even attempt a transition") remain fully distinct
// identities per the four the redesign brief named, never conflated.
function coordinatorFor(btn) {
  // Mirrors buttonWiringFor's own degrade path: a WeakMap key must be an
  // object: a missing/non-object button (no refs, or refs with no button)
  // gets its own throwaway, unshared coordinator rather than a lookup —
  // there is no physical identity to share state through.
  if (btn === null || (typeof btn !== 'object' && typeof btn !== 'function')) {
    return makeCoordinator();
  }
  let coord = _coordinators.get(btn);
  if (!coord) {
    coord = makeCoordinator();
    _coordinators.set(btn, coord);
  }
  return coord;
}

const _coordinators = new WeakMap();

function makeCoordinator() {
  return {
    btn: null,
    status: null,
    // The canonical desired view — read by decision-making code (never the
    // live DOM) and written to the DOM by drain()/applyView() alone.
    desired: { busy: false, text: '', hidden: true },
    viewRev: 0,
    dirty: false,
    running: false,
    armGen: 0,
    armedId: null,
    // Whichever controller currently owns this physical button — read only
    // by the armed timer's own fire() callback, to ask "is a prerender for
    // the CURRENT relation still pending right now" against live, current
    // controller state rather than anything captured at arm-time.
    activeController: null,
  };
}

const SYNC_PASS_BUDGET = 20000; // proven at a depth-5000 finite cascade with ample headroom
const MAX_APPLY_RETRIES = 5; // a persistently-throwing host setter gives up fast, never spins the full budget

// The ONLY function that ever writes to the four host-controlled surfaces
// this module owns. Operates on a SNAPSHOT of the model (`view`, taken by
// the caller — drain()) rather than re-reading `coord.desired` field by
// field, so every field written in one pass is mutually consistent with
// the others from that exact pass — the button's disabled/aria-busy pair
// can therefore never disagree in any state this function itself produces
// (requirement: they derive from the one `view.busy` boolean, together).
// Each field is its own try/catch: one throwing setter must not prevent
// the OTHER three fields from still being attempted this pass, and must
// never propagate — see the coordinator's own header comment for why an
// escaping exception here is a correctness bug, not just noise. Returns
// false if ANY field failed to apply, which the drain loop treats as "try
// this identical view again" (self-healing a transient throw) rather than
// "give up".
function applyView(coord, view) {
  let ok = true;
  const btn = coord.btn;
  if (btn) {
    try {
      btn.disabled = !!view.busy; // host-controlled setter — may throw or re-enter
    } catch (_) { ok = false; }
    try {
      // Redteam follow-up (2026-09-05): `safeFn` alone cannot tell this
      // call apart a THROWING `setAttribute` getter from a genuinely
      // MISSING one — both collapse to `null`, which used to be treated as
      // silent success either way. That let `disabled` and `aria-busy`
      // diverge: `disabled` (a plain setter, its own try/catch above) could
      // still succeed on a pass where the aria-busy attribute never got
      // written at all, and `ok` would report the whole pass successful
      // regardless. `ok` must honestly reflect "did every field this pass
      // touched actually apply" — so BOTH a throwing getter and a
      // genuinely absent one mark this field (and therefore the pass)
      // failed; `readFnOrThrew` is kept distinguishing the two only
      // because a caller reasoning about WHY a pass failed still benefits
      // from knowing whether it was a transient throw or a permanent
      // absence. This does not claim a permanently missing host API is
      // repairable — a persistently-absent `setAttribute` will keep
      // reporting failed for every retry exactly like a persistently-
      // throwing one already does, and `MAX_APPLY_RETRIES` below still
      // gives up after a small, fixed number of attempts either way.
      const attrRead = readFnOrThrew(btn, 'setAttribute'); // property read — contained, but distinguishes threw vs. absent
      if (attrRead.fn) {
        invoke(attrRead.fn, btn, ['aria-busy', String(!!view.busy)]); // call — may throw or re-enter
      } else {
        ok = false; // threw, or genuinely absent — either way, aria-busy did not get written this pass
      }
    } catch (_) { ok = false; } // the CALL itself threw (or re-entered and left a mess)
  }
  const status = coord.status;
  if (status) {
    try {
      status.textContent = view.text; // host-controlled setter — may throw or re-enter
    } catch (_) { ok = false; }
    try {
      status.hidden = !!view.hidden; // host-controlled setter — may throw or re-enter
    } catch (_) { ok = false; }
  }
  return ok;
}

// The non-recursive convergence loop. `coord.running` makes every NESTED
// call (a transition fired synchronously from inside applyView, via a
// hostile setter reentering this module) a hard no-op beyond marking
// `dirty` — only the one ACTIVE loop instance, already lower in the call
// stack, ever calls applyView. This is what converts what used to be
// unbounded recursive call nesting (one stack frame per reentry) into
// bounded iteration (one stack frame, however many iterations it takes).
function drain(coord) {
  if (coord.running) return;
  coord.running = true;
  try {
    let passes = 0;
    let consecutiveThrows = 0;
    while (coord.dirty || coord.pendingCancelId != null) {
      // A timer superseded by a transition (clearTimer below) defers its
      // actual host clearTimeout() CALL to exactly here, inside the
      // running-protected zone — that call is host-controlled and can
      // re-enter this module (a hostile clearTimeout is the whole point of
      // several adversarial regressions), and it must be treated exactly
      // like any other reentrant host call during an active apply pass: a
      // nested transition it triggers marks the model dirty and returns
      // (running is already true), and THIS loop's own next iteration
      // reapplies the newest state — never a stale caller resuming past an
      // unprotected boundary. `armGen` is already bumped by clearTimer at
      // the moment a timer is superseded, before this deferred call ever
      // runs, so the callback it might still cancel is inert either way;
      // this call is purely the best-effort optimization to stop the host
      // from firing it at all.
      if (coord.pendingCancelId != null) {
        const id = coord.pendingCancelId;
        coord.pendingCancelId = null;
        safeClearTimeout(id); // host-controlled — may re-enter
      }
      coord.dirty = false;
      const ok = applyView(coord, coord.desired);
      passes++;
      if (!ok) {
        consecutiveThrows++;
        // A persistently-broken setter must not spin the full pass budget
        // finding that out — five genuine failures in a row is already
        // conclusive. Give up silently: the display may stay stale, but
        // nothing here ever reports a false outcome because of it (the
        // caller's own logical status decision already happened before
        // any DOM write was attempted).
        if (consecutiveThrows > MAX_APPLY_RETRIES) return;
        coord.dirty = true; // retry the SAME (unchanged) view
      } else {
        consecutiveThrows = 0;
      }
      if (passes > SYNC_PASS_BUDGET) {
        // A cascade deeper than the synchronous budget (or a pathological
        // throw/reentry mix) continues on a fresh call stack via a queued
        // microtask rather than recursing or spinning forever inline.
        if (coord.dirty) scheduleContinuation(coord);
        return;
      }
    }
  } finally {
    coord.running = false;
  }
}

function scheduleContinuation(coord) {
  Promise.resolve().then(() => drain(coord));
}

// Merges a partial patch into the desired view and triggers a drain. This
// is the ONE place `coord.desired` is ever assigned — every named
// transition below (setStatusText, setBusyButton, setIdle) is a thin,
// named wrapper over this so call sites read as intent, not mechanism.
// Returns the `viewRev` this call itself published — callers that need to
// act AFTER the drain (e.g. arming a timer for the message they just
// wrote) compare this against `coord.viewRev` post-drain: if a nested
// transition (a reentrant setIdle/setStatusText from a hostile DOM setter
// firing during THIS call's own drain) published a LATER revision, that
// later revision has already superseded this call's patch by the time
// `drain()` returns — see the redteam follow-up fix in `setStatusText`.
function mutate(coord, patch) {
  coord.desired = { ...coord.desired, ...patch };
  // Captured into a local BEFORE drain() runs — drain() can synchronously
  // run nested mutate() calls (a hostile setter reentering this module),
  // each of which bumps `coord.viewRev` further. `myRev` is THIS call's own
  // published revision, frozen at the moment this patch was merged; it is
  // deliberately NOT re-read from `coord.viewRev` after drain() returns,
  // since that live value may already belong to a later, superseding call.
  const myRev = ++coord.viewRev;
  coord.dirty = true;
  drain(coord);
  return myRev;
}

// Coordinator-level timer management, replacing the old per-controller
// `statusTimer`/`statusTimerGen` pair — the timer is a property of "the
// current view for this physical button", which now legitimately outlives
// any one controller (a re-init must be able to cancel a PREDECESSOR's
// armed timer, exactly as before).
//
// `armGen` is bumped IMMEDIATELY — a plain counter increment, not a host
// call, so it needs no protection and always takes effect the instant a
// timer is superseded, regardless of what runs afterward. The actual host
// `clearTimeout()` call is deferred to `drain`'s own protected loop (see
// above): calling it here, before `mutate` has even claimed the running
// lock, left a genuine gap a live repro found — a hostile clearTimeout
// reentering at this exact, unprotected point could run an entire nested
// notify-to-settlement cascade to completion for real (not merely
// deferred), after which THIS call's own later, separately-issued `mutate`
// would still unconditionally apply its own now-stale patch on top of it,
// with nothing left to catch the clobber (`armGen` alone does not protect
// arbitrary model writes — only `viewRev`/`dirty`, inside the running
// lock, does). Recording the id and letting `drain` cancel it from inside
// that lock closes the gap the same way every other host boundary in this
// file is closed: by making it happen where reentrancy is already safe,
// not by adding another bespoke check.
function clearTimer(coord) {
  coord.armGen = (coord.armGen || 0) + 1;
  if (coord.armedId != null) coord.pendingCancelId = coord.armedId;
  coord.armedId = null;
}

// Arms the 4s auto-hide/reconcile timer. `armGen` answers exactly one
// question — is THIS callback still the one whose firing counts — checked
// ONCE at entry and never again inside the transition it goes on to make;
// seeing the busy/idle decision through is what "the timer must not
// invalidate its own authorized transition" (redesign requirement 6)
// means concretely. The busy-vs-idle decision itself is made fresh, from
// whichever controller currently owns this coordinator (`activeController`)
// — never from anything captured when the timer was armed — so a relation
// change between arming and firing is answered truthfully.
function armTimer(coord) {
  coord.armGen = (coord.armGen || 0) + 1;
  const myArmGen = coord.armGen;
  // Twelfth remediation gate (pre-commit race addendum, item 4), preserved:
  // `armed` flips true only AFTER safeSetTimeout() has RETURNED — a
  // hostile/re-entrant setTimeout(fn, ms) that invokes `fn` SYNCHRONOUSLY
  // must never fire early; the truthful terminal text is left visible
  // indefinitely instead, the honest behavior when the host cannot be
  // trusted to run real timers.
  let armed = false;
  const fire = () => {
    if (coord.armGen !== myArmGen) return; // stale — superseded or explicitly cleared; hard no-op
    if (!armed) {
      // Invoked synchronously, during scheduling itself — a genuine
      // timer-semantics violation. Invalidate this generation so neither
      // this callback (if the host calls back twice) nor the caller's own
      // post-return bookkeeping below can act on it.
      coord.armGen = (coord.armGen || 0) + 1;
      return;
    }
    coord.armedId = null;
    const controller = coord.activeController;
    const pending = !!(controller && !controller.retired && !controller.opInFlight && isPrerenderPending(controller));
    if (pending) setStatusText(coord, 'busy');
    else setStatusText(coord, undefined);
  };
  const id = safeSetTimeout(fire, 4000);
  if (coord.armGen === myArmGen) {
    armed = true;
    coord.armedId = id;
  } else {
    safeClearTimeout(id); // best-effort — some hostile implementations still schedule something real despite firing synchronously too
  }
}

// The two named transitions call sites use. Each touches only the fields
// its own concept owns — `setStatusText` never touches `busy`,
// `setBusyButton` never touches text/hidden — mirroring the exact
// separation the old `setStatus`/`applyBusyDOM` pair already had, so
// callers that only ever wanted one half keep meaning exactly what they
// said.
function setStatusText(coord, state) {
  const msg = pairShareStatusMessage(state);
  clearTimer(coord); // any previously-armed terminal timer is superseded by this new text
  const myRev = mutate(coord, { text: msg, hidden: !msg });
  // Redteam follow-up (2026-09-05): a hostile DOM setter can reenter
  // DURING the mutate()/drain() call above (e.g. re-initializing this same
  // physical button+status pair), which correctly reconciles the real DOM
  // to the NEWER model — but this call's own `msg`/`state` are frozen at
  // entry and know nothing about that. Arming a timer unconditionally here
  // would install a fresh 4s callback keyed to a message that is already
  // superseded, which could later fire and clear/alter whatever the
  // SUCCESSOR has since published. `coord.viewRev === myRev` is true only
  // when NO further mutate() call (nested or otherwise) has published a
  // later revision since this one — i.e. this exact terminal view still
  // owns the coordinator right now — so the timer is armed only then.
  if (msg && state !== 'busy' && coord.viewRev === myRev) armTimer(coord);
}

function setBusyButton(coord, busy) {
  mutate(coord, { busy: !!busy });
}

// The deterministic idle view — busy cleared AND text/hidden cleared
// together, one model update, one drain. Used both to initialize a fresh
// controller's coordinator (a live, REUSED button/status pair never
// inherits a prior controller's stuck "busy" look) and to relinquish a
// retiring controller's hold before a new one takes over (initPairShareUI
// below) — replacing the old `resetControllerDOM`'s four individually
// lostRace-checked writes with one reentrancy-safe transition.
function setIdle(coord) {
  clearTimer(coord);
  mutate(coord, { busy: false, text: '', hidden: true });
}

// Public-facing status write — signature UNCHANGED from every existing
// call site throughout this file (onShareClick, downloadFallback,
// shareOrFallback, trySyncNativeShare, setStatusRequalified all call this
// exactly as before). A retired controller's stale continuation still
// correctly no-ops; everything else about staleness/reentrancy is now the
// coordinator's problem, not this function's.
function setStatus(controller, state) {
  if (controller.retired) return;
  const coord = controller.coord;
  if (!coord) return;
  setStatusText(coord, state);
}

// Public-facing busy-button write — signature UNCHANGED from both existing
// call sites (onShareClick's unconditional start-of-click write, and
// syncBusyFromPrerender's prerender-driven write).
function applyBusyDOM(controller, busy) {
  if (controller.retired) return;
  const coord = controller.coord;
  if (!coord) return;
  setBusyButton(coord, busy);
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
// `expectedGen`, when given, is the relation-notification generation this
// call is speaking FOR (from notifyRelationChange, or from a settled/
// errored raster's own `.then` handler, both of which know exactly which
// generation they represent). When omitted (the click-settle `finally`
// block's own reconciliation call), this function always proceeds against
// whatever IS current — that caller has no specific generation to defend,
// it just wants the truth.
//
// Fifteenth remediation gate (model-first): "what is currently shown" is
// now read from `coord.desired` — the coordinator's own trusted model —
// never from the live DOM. The old per-boundary `safeProp(el, 'hidden')` /
// `safeProp(el, 'textContent')` reads existed ONLY because the prior
// design had no other way to know what was on screen; a hostile getter on
// either could itself carry a side effect. Reading the model instead
// removes that entire class of boundary, since `coord.desired` is a plain
// object this module owns outright. The one check that remains genuinely
// necessary — re-verifying `retired`/`opInFlight`/`relationGen` after
// `applyBusyDOM`'s own (now fully reentrancy-safe) write — guards a
// DIFFERENT thing: not a stale DOM write (the coordinator already cannot
// produce one), but a stale CONTROLLER-LEVEL decision. A hostile setter
// touched during that write can synchronously run an entire nested
// notifyRelationChange-to-settlement cascade to completion (the
// coordinator absorbs and correctly resolves it before applyBusyDOM even
// returns); this continuation must not then go on to make a FURTHER,
// separately-reasoned decision using `pending`/`expectedGen` captured
// before any of that happened.
function syncBusyFromPrerender(controller, expectedGen) {
  if (controller.retired || controller.opInFlight) return;
  if (expectedGen !== undefined && controller.relationGen !== expectedGen) return;
  const coord = controller.coord;
  if (!coord) return;
  const pending = isPrerenderPending(controller);
  applyBusyDOM(controller, pending);
  if (controller.retired || controller.opInFlight) return;
  if (expectedGen !== undefined && controller.relationGen !== expectedGen) return;
  const view = coord.desired;
  const busyMsg = pairShareStatusMessage('busy');
  // Eighth remediation gate, preserved under the new model: a background
  // prerender becoming pending for a NEWER pair (started via
  // notifyRelationChange while a click-triggered operation was still in
  // flight) must not stomp the truthful terminal status that operation's
  // own `finally` just wrote. The BUTTON's disabled/aria-busy state may
  // still legitimately reflect the pending render; only the live status
  // TEXT is protected, and only for as long as it is genuinely still
  // showing a real terminal result.
  const showingTerminal = !!(!view.hidden && view.text && view.text !== busyMsg);
  if (pending) {
    if (!showingTerminal) setStatus(controller, 'busy');
  } else if (view.text === busyMsg) {
    // The pre-render just settled (or there is nothing to prepare) with no
    // click in flight — no download was started and no share was
    // attempted, so there is no terminal outcome to announce. Only ever
    // clears OUR OWN "preparing…" text, never a real terminal status a
    // click already wrote.
    setStatus(controller, undefined);
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
  // Fifteenth remediation gate: claim this notification's generation
  // FIRST, before any re-entrant host boundary — `buildPairImprintSnapshot()`
  // below reads host-controlled properties off `relation` and can
  // synchronously call `notifyRelationChange()` again on this SAME
  // controller (a nested, NEWER notification). `stillLatest()` is
  // rechecked after every re-entrant boundary and before every cache
  // mutation from here on — only the call that still holds the latest
  // generation may publish or settle anything. The status-CLEARING step
  // below is now a single coordinator transition (`setStatus(controller,
  // undefined)`) rather than two individually-checked writes: the
  // coordinator's own drain loop is what makes a nested winner's write
  // survive a stale setter's post-reentry commit, so this function no
  // longer needs a bespoke recovery call of its own for that class of
  // race — it only needs to stop making FURTHER decisions once it has
  // lost the generation race, which `stillLatest()` still answers.
  const myGen = ++controller.relationGen;
  const stillLatest = () => !controller.retired && controller.relationGen === myGen;
  // Eleventh remediation gate, B1: this is now the SOLE place that decides
  // whether a relation change invalidates whatever status text is showing
  // — ui/dyad.js's own clearOutput() used to blank #dyad-share-status
  // directly and unconditionally, which raced a genuinely in-flight click.
  // While a click-triggered operation owns the status (`opInFlight`),
  // NOTHING about a relation change may touch it — that operation's own
  // `finally` is what eventually reconciles, once it knows the truthful
  // outcome. Only when no click currently owns it does a pair change clear
  // whatever was showing.
  if (!controller.opInFlight) {
    setStatus(controller, undefined);
  }
  // A nested notification claimed during that clear (via a hostile status
  // setter reentering this exact function) must stop this continuation
  // before it ever reads a single property off `relation`.
  if (!stillLatest()) return;
  const snapshot = relation ? buildPairImprintSnapshot(relation) : null;
  // The critical checkpoint: buildPairImprintSnapshot() reads host-
  // controlled properties off `relation` (elementDirectionAB,
  // numerologySpine, cardPairHead) and is exactly where a hostile getter
  // can install a newer generation. Stop here, BEFORE ever starting a
  // rasterization or touching the cache, if a newer notification already
  // won — closes the "wasted/corrupting third render" a live repro
  // observed.
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
      // Second-gate P1-4, restated as DOCTRINE §1.J v0.87: a non-Abort
      // rejection (NotAllowedError included) preserves the local download —
      // the platform only refused to open its OWN chooser; the PNG this
      // device already rendered is still right here. Identity was just
      // confirmed 'current' above (the only way execution reaches this
      // line), so the download below correctly proceeds for the pair
      // genuinely on screen right now.
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

// ── disclosure post-commit reassertion (adjacent redteam finding,
// 2026-09-05) ────────────────────────────────────────────────────────────
// The capability-disclosure `textContent` write below is a SEPARATE,
// smaller surface than the four-field share-view coordinator above (button
// disabled/aria-busy, status text/hidden) — it is written exactly once, at
// init, never by a transition — but it is exposed to the exact same class
// of hazard: `disclosureEl.textContent = text` is a host-controlled setter
// a hostile implementation can reenter, and a nested `initPairShareUI()`
// call on the SAME refs can complete an entire successor construction
// (including that successor's OWN correct disclosure write) BEFORE the
// outer setter call returns. The outer call's own `lostRace()` check right
// after the write correctly detects it lost — but the write itself already
// happened by then, and a bare property assignment cannot be "un-sent": if
// the setter commits the OUTER's now-stale text AFTER the nested winner
// already wrote its own correct one (exactly as a nested-during-drain
// setter can for the coordinator's four fields), the stale text is what's
// left on screen, and nothing afterward ever corrects it.
// Fix, scoped to this one element and deliberately NOT folded into
// `coordinatorFor`: a tiny model — desired text + a revision counter, plus
// an `applying` flag mirroring the coordinator's own `running` — so a
// nested call during an active write only updates the model and returns
// (never writes DOM itself), and the ACTIVE write's own loop notices the
// revision moved and reapplies the newest text before returning. This is
// the same reapply-until-stable shape as `drain()`, intentionally
// smaller: one field, no busy/timer semantics, no retry-on-throw (a
// disclosure line is advisory copy, not a correctness-load-bearing state
// the four-field contract requires — a throw here is best-effort, exactly
// as it already was).
const _disclosureState = new WeakMap();
const DISCLOSURE_PASS_BUDGET = 1000; // generous for any real cascade; a bound only against a pathological infinite reentry

function setDisclosureText(el, text) {
  if (el === null || (typeof el !== 'object' && typeof el !== 'function')) return;
  let state = _disclosureState.get(el);
  if (!state) {
    state = { rev: 0, desired: '', applying: false };
    _disclosureState.set(el, state);
  }
  state.rev++;
  state.desired = text;
  if (state.applying) return; // a nested call during an active write — the active write's own loop below will catch this
  state.applying = true;
  try {
    let passes = 0;
    let appliedRev;
    do {
      appliedRev = state.rev;
      try { el.textContent = state.desired; } catch (_) { /* best-effort — advisory copy, never load-bearing */ }
      passes++;
    } while (state.rev !== appliedRev && passes < DISCLOSURE_PASS_BUDGET);
  } finally {
    state.applying = false;
  }
}

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
  // Fifteenth remediation gate (model-first): retirement of whatever
  // controller was previously active is now ONE coordinator transition
  // (`setIdle`, which internally supersedes any armed timer too) instead
  // of a separately-cancelled timer plus four individually lostRace-
  // checked DOM writes — the coordinator's own drain loop absorbs any
  // reentrancy this transition's DOM writes trigger, so a single
  // checkpoint after it is exactly as safe as the old four, and the
  // coordinator PERSISTS across this handover (it is keyed by the
  // physical button, not by controller), which is what lets a SUCCESSOR
  // constructed moments later — see below — reassert its own idle state
  // if a stale predecessor setter tries to commit after the fact
  // (repro_pair_reinit_setter_post_reentry_b3.mjs).
  if (_activeController) {
    const prior = _activeController;
    prior.retired = true;
    if (prior.coord) {
      setIdle(prior.coord); // host-controlled writes inside — may re-enter this function
      if (lostRace()) return INERT_FACADE;
    }
  }

  const controller = {
    refs: refs || {},
    hooks: hooks || {},
    retired: false,
    opToken: 0,
    opInFlight: false,
    cache: null,
    coord: null,
    // Fifteenth remediation gate: a monotonic per-controller counter claimed
    // by notifyRelationChange() at entry, before any re-entrant host
    // boundary — the "latest notification wins" ownership token for the
    // whole notify/prerender/busy-sync lifecycle, distinct from opToken
    // (which governs CLICK operations, not relation-change notifications).
    relationGen: 0,
    listener: null,
  };
  // Thirteenth remediation gate (atomic-handoff follow-up), preserved: the
  // button reference read (`controller.refs.btn`, a property a hostile
  // `refs` object can shadow with its own getter) and everything that
  // follows are each their own checkpoint — `safeProp` contains a
  // throwing `refs.btn` getter the same way every other property this
  // module reads off a host-controlled object already is.
  const btnRef = safeProp(controller.refs, 'btn'); // contained property read — may re-enter
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  const statusRef = safeProp(controller.refs, 'status'); // contained property read — may re-enter
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  // One coordinator per physical button, found or created here and stored
  // directly on the controller (a trusted internal reference from then on,
  // never re-derived from host-controlled `refs` again) — this is the
  // SAME coordinator a same-button predecessor already owned, which is
  // exactly the persistence the redesign needs.
  const coord = coordinatorFor(btnRef);
  controller.coord = coord;
  coord.btn = btnRef;
  coord.status = statusRef;
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  // Deterministic initial DOM, independent of whatever the retirement reset
  // above did or didn't reach (e.g. the very first init, or refs that
  // happen to differ from the prior controller's) — a fresh controller
  // never starts from an ambiguous DOM state.
  setIdle(coord); // host-controlled writes inside — may re-enter this function
  if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  controller.listener = () => onShareClick(controller);
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
    setDisclosureText(disclosureEl, disclosureText); // host-controlled setter inside — may re-enter; self-reasserts the newest write (see setDisclosureText's own header comment)
    if (lostRace()) { controller.retired = true; return INERT_FACADE; }
  }

  // This controller WON the init race — claim ownership as the LAST step,
  // atomically from this function's own perspective (nothing further below
  // can lose the race, since nothing further re-enters).
  wiring.current = controller;
  _activeController = controller;
  coord.activeController = controller;
  return {
    onShareClick: controller.listener,
    notifyRelationChange: relation => notifyRelationChange(controller, relation),
  };
}
