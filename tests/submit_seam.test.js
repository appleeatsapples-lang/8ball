// 8ball / tests / submit_seam.test.js
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { functionBody } from './helpers/js-lex.js';
// Imports whatever `ui/profile.js` currently BINDS to these names — which is
// not the same as what it declares, and the difference was a live bypass: a
// module-level `getGenderInput = somethingElse` left the declaration's bytes
// untouched and replaced what every importer receives. The whole-file pin below
// is what closes that; this import cannot.
import { buildSubmitOpts, getGenderInput, initProfileUI } from '../ui/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMIT_SIG = "profileForm.addEventListener('submit', e => {";
const HTML_PATH = join(__dirname, '..', 'index.html');
const PROFILE_PATH = join(__dirname, '..', 'ui', 'profile.js');
const readHtml = () => readFileSync(HTML_PATH, 'utf-8');
const readHtmlBytes = () => readFileSync(HTML_PATH);
const readProfile = () => readFileSync(PROFILE_PATH, 'utf-8');
const readProfileBytes = () => readFileSync(PROFILE_PATH);
const REPO_ROOT = join(__dirname, '..');
const CITY = { name: 'Manama', countryCode: 'BH', tz: 'Asia/Bahrain', lat: 26.2286, lng: 50.586 };
const HOST_CALL =
  '  const opts = buildSubmitOpts({ time: timeInput.value, gender: getGenderInput(), city: selectedCity });';
const FALLBACK = '  const opts = buildSubmitOpts({ time: timeInput.value, city: selectedCity });';
const inventory = h => h.split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));
// The boot region three of the H-fixtures splice into — unpinned by any region.
const BOOT_ANCHOR = 'readingsUI = initReadingsUI(';
// The reviewed module specifiers of index.html — one source of truth, so the
// H7 fixture asserts the same exact list the secondary check pins.
const REVIEWED_SPECIFIERS = [
  './content/cards.v1.full.js',
  './core/engine.js', './core/measurement.js', './core/payments.js', './core/profile.js',
  './ui/citysearch.js', './ui/concordance.js', './ui/dyad.js', './ui/labels.js',
  './ui/meanings.js', './ui/modals.js', './ui/payments.js', './ui/profile.js',
  './ui/public.js', './ui/readings.js', './ui/result.js', './ui/share.js', './ui/tiers.js',
];

// The handler is driven under BOTH environments the shipped bytes can meet.
//
// Node's globals are NOT the browser's, and an audit turned that into a live
// bypass: a handler branching on `typeof window === "undefined"` forwarded the
// field under the test harness and dropped it in a browser, while the raw
// inventory stayed byte-identical and all four driver tests passed. Executing
// the real bytes is necessary but not sufficient — they have to be executed in
// an environment that resembles the one that ships. So every drive runs twice,
// and every assertion below is made in both.
const ENVIRONMENTS = ['node', 'browser'];

// The globals a page actually has, with the IDENTITIES a page actually has.
//
// An earlier version set only `globalThis.window = {document:{}, navigator:{}}`
// and an audit walked straight past it: a handler probing `typeof document`
// (rather than `typeof window`) forwarded under BOTH declared shapes and
// dropped the field in a real browser. Closing one probe is not closing the
// class, so this installs every environment-sensitive global the handler could
// reach, linked the way a browser links them:
//   window === globalThis === self, document/location/navigator bare AND on
//   window, and window.navigator === navigator.
//
// This list is NOT load-bearing and must never be grown to chase a bypass. Two
// finite lists died that way (a seven-name shim and an eleven-name ban, both
// walked past by `history` and `HTMLElement`), and the free-identifier policy
// that replaced them died too. What closes the "runs differently outside a
// browser" class now is the byte pin, which enumerates nothing. These globals
// exist so the behavioural drives run in a page-shaped environment, not so the
// list can be completed.
const BROWSER_GLOBALS = ['window', 'self', 'document', 'location', 'navigator', 'top', 'parent'];

function withEnvironment(env, fn) {
  if (env === 'node') return fn();
  // Descriptors, not assignment: node defines `navigator` as a getter-only
  // accessor, so `globalThis.navigator = …` throws in strict mode.
  const saved = BROWSER_GLOBALS.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]);
  const put = (k, value) =>
    Object.defineProperty(globalThis, k, { value, writable: true, configurable: true, enumerable: false });

  put('document', { title: '', createElement: () => ({}), getElementById: () => null });
  put('location', { href: 'https://the-eight-ball.netlify.app/', search: '', pathname: '/' });
  put('navigator', { userAgent: 'test', language: 'en' });
  // Identity, not merely presence: a probe comparing window to globalThis, or
  // window.navigator to navigator, must see exactly what a page sees.
  for (const alias of ['window', 'self', 'top', 'parent']) put(alias, globalThis);

  try { return fn(); } finally {
    for (const [k, desc] of saved) {
      if (desc) Object.defineProperty(globalThis, k, desc);
      else delete globalThis[k];
    }
  }
}

// ── recording refs: FIRST-HOP root-member reads, and nothing more ──
//
// What this catches, exactly and only: a **string-keyed `get` on the root
// object itself**. An audit measured the rest, so the limits are stated rather
// than implied — every one of these was run and is silent:
//
//   nested reads (`e.target.ownerDocument` records `target` and nothing else,
//   because Reflect.get returns the value un-proxied) · symbol-keyed reads ·
//   `in` · `Object.keys` / `for…in` / `getOwnPropertyNames` / `Reflect.ownKeys`
//   · `getOwnPropertyDescriptor` · WRITES and `delete`, which have no trap at
//   all and are neither recorded nor blocked — including on the CONTROL, so
//   `control.value = 'male'` would rewrite the value under test unrecorded.
//
// (Spread IS recorded — `{...e}` performs a `get` per key.)
//
// The descriptor case is not academic. `Object.getOwnPropertyDescriptor(e,
// 'target').value.ownerDocument` returns exactly what `e.target.ownerDocument`
// returns and records NOTHING — verified against the real tree, where that
// rewrite of the flagship mutation leaves this test green while the freeze and
// the byte pin still fire.
//
// So this is not a "member-path policy" and the earlier records that called it
// one were broader than the instrument. It is one specific thing a byte pin
// cannot do: prove that the executed handler touched `preventDefault` on its
// event and nothing else at the root, and that the producer touched `value` on
// its control and nothing else — evidence that survives a blind hash update.
// Everything in the list above is covered by the SOURCE PINS instead, and is
// named in the residual.
//
// It still closes the gap that killed the free-identifier surface, which could
// not see a member access AT ALL: `e` was an allowed NAME, so
// `e.target.ownerDocument` cost nothing. Here the first hop is recorded because
// it was READ — and no declaration anywhere can launder a runtime read.
function strictAccess(target, reads) {
  return new Proxy(target, {
    get(obj, key, recv) {
      if (typeof key === 'string') reads.add(key);
      return Reflect.get(obj, key, recv);
    },
  });
}

// A production-shaped submit event. Deliberately NOT a bare `{preventDefault}`:
// the mutation that got past the previous guard needed `e.target` to be truthy
// and to carry `ownerDocument`, and against a bare stub it silently no-op'd —
// so the harness would have "passed" a live bypass by being too poor to run it.
// A counter-case that cannot execute proves nothing, so the event carries what
// a real submit event carries and the mutation runs for real.
function productionEvent() {
  const form = { tagName: 'FORM', id: 'profile-form', ownerDocument: { title: '8 ball' }, elements: {} };
  const e = {
    type: 'submit', isTrusted: true, defaultPrevented: false, cancelable: true,
    target: form, currentTarget: form, srcElement: form,
    preventDefault() { e.defaultPrevented = true; },
    stopPropagation() {},
  };
  return e;
}

function driveSubmit(html, { gender, city = CITY, time = '14:30', env = 'node' } = {}) {
  const controlReads = new Set();
  const eventReads = new Set();
  // Wire the real producer to a real control carrying the value under test.
  initProfileUI({ genderSelect: strictAccess({ value: gender === undefined ? '' : gender }, controlReads) }, {});
  const { body } = functionBody(html, SUBMIT_SIG);
  const seen = {
    build: null, save: null, rendered: false, threw: null, produced: [], buildRef: null, saveRef: null,
    producedKeysAfter: null, controlReads: null, eventReads: null,
  };
  const deps = {
    e: strictAccess(productionEvent(), eventReads),
    // FROZEN before it is handed over. The handler's contract is to pass the
    // produced object along untouched; freezing turns any in-place edit of it
    // into a strict-mode TypeError instead of a silent field deletion, which is
    // exactly how one bypass removed the value while every byte, count and
    // identity assertion stayed green. This is a harness fence, not a claim
    // that production freezes anything — production is byte-unchanged.
    buildSubmitOpts: (...args) => {
      const o = Object.freeze(buildSubmitOpts(...args));
      seen.produced.push(o);
      return o;
    },
    validateBirthInput: ({ name, dob }) => ({ name: name.trim(), dob }),
    applyBirthInputValidationState: () => true,
    birthValidationRefs: {},
    nameInput: { value: 'Profile Specimen' }, dobInput: { value: '1990-06-15' },
    timeInput: { value: time },
    // The REAL producer, wired to a stub control. An audit sabotaged
    // `getGenderInput` itself — `if (typeof history !== "undefined") return
    // undefined;` — and 246 tests stayed green, because the seam injected a
    // fake in its place. A driver that stubs the thing it is verifying proves
    // only that its own stub works.
    //
    // NOTE what this does and does not prove. It imports the module ONCE, at
    // load, from a `file:` URL. It therefore proves the LIVE export behaves
    // correctly here — which is why an alternate-export swap is caught by the
    // whole-file pin rather than by this, and why an `http(s)`-conditional
    // branch is invisible to it. Both are in the residual.
    getGenderInput,
    selectedCity: city,
    loadSavedProfile: () => null, isNewPair: () => true, nextShakeState: () => ({ action: 'render' }),
    // Record the REFERENCE as well as the shape: an audit routed both
    // consumers through a second, gender-free object while the pinned call
    // survived byte-for-byte beside it. Presence of the call says nothing
    // about what the consumers actually receive.
    buildProfile: (n, d, o) => { seen.build = { ...o }; seen.buildRef = o; return { lifePath: 7, name: n }; },
    saveProfile: (n, d, o) => { seen.save = { ...o }; seen.saveRef = o; return true; },
    showPaidBanner: () => {}, PROFILE_SAVE_STORAGE_MESSAGE: '',
    readingsUI: { setActiveReading: () => {} }, getRenderTier: () => 'complete',
    coordsForTier: () => new Set(['cardEntry']), ensureFacetIndex: () => {},
    showResult: () => { seen.rendered = true; },
  };
  const names = Object.keys(deps);
  withEnvironment(env, () => {
    // Recorded, not propagated: a mutation that dies on the frozen object must
    // show up as evidence, not as an unhandled crash that reads like a broken
    // test.
    try {
      new Function(...names, `"use strict";\n${body}`)(...names.map(k => deps[k]));
    } catch (err) { seen.threw = err; }
  });
  seen.producedKeysAfter = seen.produced.length ? Object.keys(seen.produced[0]) : null;
  seen.controlReads = [...controlReads].sort();
  seen.eventReads = [...eventReads].sort();
  return seen;
}

// ── SOURCE PINS — the primary guard ────────────────────────────────
//
// WHAT THIS REPLACED, AND WHY. Eight rounds tried to guarantee "no bypass can
// hide on the value path" by ANALYSING the source: byte pins over one line,
// then a browser-globals shim of seven names, then a raw ban of eleven, then a
// positive free-identifier surface built on the hand lexer, then per-function
// declaration slices. Each was defeated by something it had not modelled.
//
// The free-identifier surface fell three ways — all verified, all with the full
// suite green. MEMBER PATHS on an allowed root: `e` was on the surface, so
// `e.target.ownerDocument` referenced nothing new, because property accesses
// are excluded from such a scan by construction, and `Object` arrived as
// `opts.constructor`. `import.meta`: `import` is a keyword and every member
// name is discarded, so the producer's surface stayed exactly
// `['_genderSelect']`. FLAT SCOPE: the extractor put every declaration in one
// body-wide set, so a dead `if (false) { const Image = null; }` subtracted
// `Image` from a read that happened earlier and outside that block — JavaScript
// does not shadow backwards.
//
// The per-function DECLARATION SLICES that replaced it fell too, and how they
// fell is why this now pins a WHOLE FILE. A slice pins a SUBSTRING, not the
// live export. `export function f(){}` creates a MUTABLE binding and ES module
// exports are LIVE, so appending
//
//     function readControl() { …a different accessor… }
//     getGenderInput = readControl;
//
// leaves the pinned declaration byte-identical (143 bytes, 825a4df3…) while
// every importer receives `readControl`. Written with Unicode escapes the
// literal substring "gender" never appears, so the raw allowlist in
// tests/profile.test.js stays green too — without the escapes that test turns
// red, which is the measure of how load-bearing they are. Full suite 57 files /
// 2039 tests GREEN, and the same bytes under a real `https:` module URL return
// `undefined` where a `file:` URL returns the value.
//
// So `ui/profile.js` is pinned AS A WHOLE FILE, over its raw bytes. Nothing is
// "beside the pinned region" inside that module any more: a live-binding swap,
// a module-level statement, a new export, a changed comment and a stray space
// are the same event — a byte that is not the reviewed byte.
//
// `index.html` IS NOW PINNED WHOLE TOO, and the reason is measured, not
// argued. With only two REGIONS of it pinned — the handler body and the seam's
// import specifier line, together 2,270 of 69,373 bytes, 3.3% of the file —
// FIVE bypasses ran with every pin byte-identical and the full suite green,
// and a sixth — H4 — was recorded as one and was not: as first written it
// assigned to `profileForm`, which is a `const` at index.html:1085, so it threw
// `TypeError: Assignment to constant variable.` and could never have run. It is
// listed below in its CORRECTED, legal form, which decoys the initialiser and
// was then measured like the rest. Five measured, plus one corrected and
// measured — not six as originally claimed:
//
//   H1  `defineProperty` shim on the live control's `value`, so the UI still
//       shows the user's choice and only the stored value is lost;
//   H2  a second submit listener under a different spelling, calling
//       `stopImmediatePropagation()` so the pinned handler never runs;
//   H3  an inline `<script type="importmap">` remapping the pinned specifier,
//       so `ui/profile.js` stays byte-identical on disk and is NEVER LOADED;
//   H4  (CORRECTED) `profileForm`'s INITIALISER decoyed —
//       `location.protocol === 'file:' ? $('profile-form') : document.createElement('form')`
//       — so the pinned bytes run against a decoy and reach no user. Verified
//       in isolation: real node under `file:`, decoy under `https:`, no throw;
//   H5  a second `initProfileUI({…, genderSelect: {value: ''}})` from the
//       unpinned boot region, repointing the module's control at a dead stub;
//   H6  ONE of index.html's eighteen module specifiers swapped to a root shim
//       that re-exports `buildProfile` and deletes the field from the live,
//       UNFROZEN options object one statement before `saveProfile` — a MINUS
//       ONE BYTE edit at index.html line 1058.
//
// Every one of the six requires an index.html edit, so the whole-file pin moves
// for all six; that was measured rather than assumed, and an earlier record
// saying it "kills five of the six" without naming the survivor was wrong.
// H3 and H6 additionally need a companion file at the repo root; those are
// inert without their index.html half, and the root inventory below names them
// anyway.
//
// H6 is why the freeze claim is narrow: the freeze fences the object THIS
// harness builds and hands to ITS OWN STUBS. H6 mutates the production object,
// unfrozen, in the real consumer chain, which is out of frame here entirely.
//
// WHAT THESE PINS STILL DO NOT ESTABLISH — read this before quoting them.
// They pin two FILES. They do not pin the other runtime modules the page
// loads. Verified: inserting into `core/profile.js`'s `buildProfile`
//
//     if (typeof location !== 'undefined' && location.protocol !== 'file:' && opts)
//       { try { delete opts['g' + 'ender']; } catch (_) {} }
//
// leaves index.html AND ui/profile.js byte-identical, adds no root file, leaves
// every specifier unchanged, and runs 57 files / 2047 tests GREEN. Import
// reachability cannot see that — it is code inside an ALLOWED module. Closing
// it needs a deterministic raw-byte manifest of every runtime file the page
// reaches. That manifest IS built — see `runtimeManifest` above and the H7
// fixture below; this paragraph records why it exists.
//
// Byte pins are half of the guard, because a hash can be edited. The
// behavioural drives execute the handler body under both environments, and the
// read recording and the frozen option object catch classes a blind hash update
// would carry through.
//
// BYTES ARE UTF-8 BYTES. An earlier revision recorded `String.length`, which is
// UTF-16 code units — 2006 for a handler body that is 2017 bytes, because §6's
// comments contain `§` and `β`. The hashes were already over UTF-8 and did not
// move; the counts did.
/**
 * THE FRAMING, factored out so a counter-case can drive the production helper
 * directly rather than a copy of it.
 *
 * Each entry contributes:
 *
 *     pathByteLength \n  pathBytes \n  sourceByteLength \n  sourceBytes \n
 *
 * LENGTH-PREFIXED ON BOTH HALVES, and the path length is why. The retired
 * framing was `path \n length \n bytes \n`, which an audit proved NON-INJECTIVE:
 * LF is a legal byte in a POSIX and Git path, so a filename can contain the
 * very delimiters the reader depends on and shift the boundary. The verified
 * collision, both sides two files / seven source bytes, both names ending
 * `.js`, both sorting a→z:
 *
 *   A = [ 'core/a.js\n7\nq.js' → ''        , 'core/z.js'          → 'q.js\n0\n' ]
 *   B = [ 'core/a.js'          → 'q.js\n0\n', 'core/z.js\n7\nq.js' → ''         ]
 *
 * Both produced the identical 40-byte stream and SHA-256
 * `d54cffd56e0220483388e6930055d88ede0d25adcf36eeed8abbcf19f8186376`, so the
 * old claim that "no rename, reorder, split or merge can forge the digest" was
 * false. Declaring the PATH's byte length before the path removes the reader's
 * dependence on any delimiter: it consumes exactly that many bytes, whatever
 * they are. No path is forbidden, no character is banned — a deny-list is the
 * shape that keeps failing here, and this needs none.
 */
function frameManifest(entries) {
  const frames = [];
  let sourceBytes = 0;
  for (const [rel, bytes] of entries) {
    const pathBytes = Buffer.from(rel, 'utf8');
    sourceBytes += bytes.length;
    frames.push(
      Buffer.from(`${pathBytes.length}\n`, 'utf8'), pathBytes, Buffer.from('\n', 'utf8'),
      Buffer.from(`${bytes.length}\n`, 'utf8'), bytes, Buffer.from('\n', 'utf8'),
    );
  }
  return {
    files: entries.length,
    sourceBytes,
    sha256: createHash('sha256').update(Buffer.concat(frames)).digest('hex'),
  };
}

/**
 * A DETERMINISTIC RAW-BYTE MANIFEST over the complete bounded runtime-source
 * surface: every `.js`/`.mjs` under `core/`, `ui/` and `content/`, by sorted
 * relative path, framed by `frameManifest` above.
 *
 * WHY IT EXISTS. Two whole-FILE pins closed `index.html` and `ui/profile.js`,
 * and the next bypass moved next door. Verified: a `location.protocol` branch
 * inserted into `core/profile.js`'s `buildProfile` left both file pins
 * byte-identical, added no root file, changed no specifier and no script tag,
 * satisfied every reachability assertion here — and ran 57 files / 2047 tests
 * GREEN. Reachability says which files the page reaches; it never says what is
 * inside an allowed one.
 *
 * NO PARSER AND NO INFERRED GRAPH. This does not follow imports and does not
 * decide what is reachable. It ENUMERATES a fixed, bounded directory surface by
 * extension and hashes it — enumeration of a declared surface, which is a
 * different thing from enumerating what a page might expose. Deciding
 * reachability is what failed; this decides nothing.
 *
 * The walk RECURSES, so a new subdirectory is included rather than silently
 * skipped — all three directories are flat today, and that must not become an
 * assumption the manifest depends on.
 *
 * `overrides` exists only so a fixture can hash a hypothetical tree without
 * writing to disk. Production callers pass nothing.
 */
function runtimeManifest(overrides = {}) {
  const walk = rel => readdirSync(join(REPO_ROOT, rel), { withFileTypes: true })
    .flatMap(e => (e.isDirectory()
      ? walk(`${rel}/${e.name}`)
      : (/\.(js|mjs)$/.test(e.name) ? [`${rel}/${e.name}`] : [])));
  const rels = ['core', 'ui', 'content'].flatMap(walk).sort();
  return frameManifest(rels.map(rel => [
    rel,
    Object.prototype.hasOwnProperty.call(overrides, rel)
      ? Buffer.from(overrides[rel], 'utf8')
      : readFileSync(join(REPO_ROOT, rel)),
  ]));
}

const SOURCE_PINS = [
  // ── PRIMARY: whole files, raw bytes. These are the guard. ──
  {
    label: 'index.html — the whole host file, raw bytes',
    kind: 'primary',
    executed: 'partly — only the submit handler body is executed by this file',
    bytes: 69373,
    sha256: '71e97b80e68b6bc8c7d39649963ba795a438a384dc0f0e32e56951eeeedb1bd0',
    read: () => fingerprintBytes(readHtmlBytes()),
  },
  {
    label: 'ui/profile.js — the whole module, raw bytes',
    kind: 'primary',
    executed: 'partly — buildSubmitOpts, getGenderInput and initProfileUI are driven; '
      + 'resolveGenderSelect is NOT, because production boots {form, anchor} and the drives pass {genderSelect}',
    bytes: 17566,
    sha256: 'd6fba912fcb9edc146c0af3fd93203652b3e1acc533f39cbba11fe007996099e',
    read: () => fingerprintBytes(readProfileBytes()),
  },
  {
    // The surface the two file pins do NOT cover. `ui/profile.js` is inside it
    // as well — its own pin is retained because a manifest cannot say which
    // single file a fixture is about.
    label: 'core/ + ui/ + content/ — the runtime-source manifest, raw bytes',
    kind: 'primary',
    executed: 'no — this file drives only the submit handler, buildSubmitOpts, getGenderInput and initProfileUI',
    files: 40,
    sourceBytes: 529878,
    sha256: '560a9961e7bcea1b2279e45a67ec4d45e194b00f0914689a78e303c221dea5d5',
    read: () => runtimeManifest(),
  },
  // ── DIAGNOSTIC: regions. Redundant against the whole-file pins by
  // construction — any change inside them already moves the file hash. They are
  // retained because a file hash cannot say WHICH bytes matter, and these can.
  {
    label: 'index.html — DIAGNOSTIC: the submit handler body',
    kind: 'diagnostic',
    executed: true,
    bytes: 2017,
    sha256: '4043a0b48ff55ab73df7ca7fd05eaee1510469d96314fcf1f89e6aafac79715f',
    read: () => fingerprintText(functionBody(readHtml(), SUBMIT_SIG).body),
  },
  {
    label: "index.html — DIAGNOSTIC: the seam's import specifier line",
    kind: 'diagnostic',
    executed: false,
    bytes: 253,
    sha256: '2090e8053951fc5c309d2867a104dac3877ca8d257b6dd8dafb5f860add29335',
    read: () => fingerprintText(uniqueLine(readHtml(), "from './ui/profile.js';")),
  },
];

// The pin the RETIRED declaration-slice guard held for `getGenderInput`. It is
// not a guard any more; it is the foil in the alternate-export counter-case,
// which asserts it stays EQUAL while the whole-file pin moves.
const RETIRED_DECLARATION_PIN = {
  bytes: 143,
  sha256: '825a4df3ba71e9731f24edffa71a71e0ed77878346c66b58c40c2e57b56317fa',
};

/** The one line containing `marker`, whole. Throws unless there is exactly one. */
function uniqueLine(src, marker) {
  const hits = src.split('\n').filter(l => l.includes(marker));
  if (hits.length !== 1) throw new Error(`${hits.length} lines contain ${marker}, expected 1`);
  return hits[0];
}

/**
 * The exact bytes of a top-level declaration: from its literal signature to the
 * first line-start `}` after it. Two literal string searches, no parsing.
 * RETAINED ONLY for the alternate-export counter-case — it is the shape of the
 * retired guard, kept so the fixture can show that shape staying green.
 */
function declaration(src, signature) {
  const at = src.indexOf(signature);
  if (at === -1) throw new Error(`signature not found: ${signature}`);
  if (src.indexOf(signature, at + 1) !== -1) throw new Error(`signature is not unique: ${signature}`);
  const end = src.indexOf('\n}\n', at);
  if (end === -1) throw new Error(`no line-start close after: ${signature}`);
  return src.slice(at, end + 2);
}

const fingerprintBytes = buf => ({ bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') });
const fingerprintText = text => fingerprintBytes(Buffer.from(text, 'utf8'));

/** A pin's constant, by label prefix. Throws unless exactly one matches, so a
 *  renamed pin fails at import rather than degrading to a stale constant. */
function pinFor(label) {
  const hits = SOURCE_PINS.filter(p => p.label.startsWith(label));
  if (hits.length !== 1) throw new Error(`${hits.length} pins match "${label}", expected 1`);
  const pin = hits[0];
  // Two shapes: a file/region pin carries {bytes, sha256}; the manifest carries
  // {files, sourceBytes, sha256}. The shape is derived from the pin itself so a
  // mismatched comparison is impossible to write by accident.
  return pin.files === undefined
    ? { bytes: pin.bytes, sha256: pin.sha256 }
    : { files: pin.files, sourceBytes: pin.sourceBytes, sha256: pin.sha256 };
}
const HTML_PIN = pinFor('index.html — the whole host file');
const HANDLER_PIN = pinFor('index.html — DIAGNOSTIC: the submit handler body');
const PROFILE_PIN = pinFor('ui/profile.js — the whole module');
const htmlPrint = text => fingerprintText(text);

const handlerPrint = html => fingerprintText(functionBody(html, SUBMIT_SIG).body);
const profilePrint = src => fingerprintText(src);
const declarationPrint = src => fingerprintText(declaration(src, 'export function getGenderInput() {'));

// Every counter-case below reads its "clean" source through these, NOT through
// a bare read.
//
// WHY. A counter-case used to take the live file as its baseline, mutate a copy
// and assert the two differ. With the survivor ALREADY ON DISK both sides carry
// it, every clause still holds, and the fixture reports PASS while the shipped
// product is compromised — an audit demonstrated exactly that with the
// nested-shadow survivor, where the named test passed and only the generic pin
// test failed (1 of 32 red). The event-in-place fixture escaped by luck alone,
// because that survivor happens to be behaviourally visible; the nested-shadow
// one is invisible by construction, so nothing rescued it. These helpers make
// the baseline the REVIEWED CONSTANT, so a dirty tree fails the fixture first
// and by name.
//
// EVEN SO: a counter-case is a DEMONSTRATION against a clean tree — it shows
// which assertion a given mutation turns red. It is not a standing detector of
// that mutation. What detects a shipped survivor is the byte pin. A `catches:`
// name describes the demonstration, not a guarantee.
const NOT_CLEAN = 'baseline is not the reviewed source — this counter-case would compare a survivor against itself';
const cleanHtml = () => {
  // The WHOLE reviewed file, not just the handler region: a survivor can sit
  // anywhere in index.html — ALL SIX H-fixtures below sit outside the
  // handler body — and a region baseline would let those fixtures
  // compare a poisoned tree against itself.
  expect(fingerprintBytes(readHtmlBytes()), NOT_CLEAN).toEqual(HTML_PIN);
  return readHtml();
};
const cleanProfile = () => {
  const src = readProfile();
  expect(profilePrint(src), NOT_CLEAN).toEqual(PROFILE_PIN);
  return src;
};

describe('the submit seam — EXECUTED, not scanned', () => {
  for (const env of ENVIRONMENTS) {
    it(`forwards the optional field to buildProfile AND saveProfile [${env}]`, () => {
      const html = readHtml();
      const female = driveSubmit(html, { gender: 'female', env });
      const male = driveSubmit(html, { gender: 'male', env });
      const absent = driveSubmit(html, { gender: undefined, env });
      expect(female.threw, 'the handler threw').toBeNull();
      expect(female.rendered, 'the handler never reached showResult — a stub is missing and the try swallowed it').toBe(true);
      expect(female.build, 'buildProfile was never called').not.toBeNull();
      expect(female.save, 'saveProfile was never called').not.toBeNull();
      expect([female.build.gender, male.build.gender, absent.build.gender]).toEqual(['female', 'male', undefined]);
      expect([female.save.gender, male.save.gender, absent.save.gender]).toEqual(['female', 'male', undefined]);
      expect(female.build).toEqual({ time: '14:30', gender: 'female', city: 'Manama', cc: 'BH', tz: 'Asia/Bahrain', lat: 26.2286, lng: 50.586 });
      expect('gender' in absent.build, 'the absent case invented the key').toBe(false);
    });
  }

  // The CLASS, not one example. An audit closed `typeof window` and then
  // walked past `typeof document`: the probe forwarded under both declared
  // shapes and dropped the field in a real browser. These are the environment
  // signals a page exposes that a bare node process does not, each written the
  // way a maintainer would actually reach for it.
  //
  // These stay because they are the cases where the two environments DISAGREE,
  // which is a property no byte pin can express. They are not the closure of
  // the environment class — the source pins are, and they need no list.
  const ENV_PROBES = [
    ['typeof window', 'typeof window === "undefined"'],
    ['typeof document', 'typeof document === "undefined"'],
    ['typeof location', 'typeof location === "undefined"'],
    ['typeof self', 'typeof self === "undefined"'],
    // NOT `typeof navigator`: node defines it too (verified), so it is not a
    // node-vs-browser discriminator and cannot express this bypass. Its
    // IDENTITY still can — see the window.navigator case below.
    ['globalThis.document presence', '!globalThis.document'],
    ['globalThis.window presence', '!globalThis.window'],
    ['window identity vs globalThis', 'globalThis.window !== globalThis'],
    ['navigator identity via window', '!globalThis.window || globalThis.window.navigator !== globalThis.navigator'],
  ];

  for (const [label, probe] of ENV_PROBES) {
    it(`catches: a seam branching on ${label}, live only outside a browser`, () => {
      // Each of these FORWARDS under the node harness by construction, so the
      // uniform "forwards nothing" check cannot see them. What catches them is
      // the two environments DISAGREEING.
      const html = cleanHtml();
      const bad = html.replace(HOST_CALL, [
        '  let submitOpts;',
        `  if (${probe}) {`,
        HOST_CALL,
        '    submitOpts = opts;',
        '  } else {',
        `  ${FALLBACK.trim().replace('const opts =', 'submitOpts =')}`,
        '  }',
        '  const opts = submitOpts;',
      ].join('\n'));
      expect(bad, 'the mutation did not apply').not.toBe(html);

      // PREMISE: every static signal is unchanged — this is why it is invisible.
      expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned bytes changed').toBe(1);
      expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

      const inNode = driveSubmit(bad, { gender: 'female', env: 'node' });
      const inBrowser = driveSubmit(bad, { gender: 'female', env: 'browser' });
      expect(inNode.rendered && inBrowser.rendered,
        'a run did not complete — this would pass vacuously').toBe(true);
      expect(inNode.build.gender, 'premise broken: the node run should still forward').toBe('female');
      expect(inBrowser.build.gender, `the ${label} bypass went undetected`).toBeUndefined();
    });
  }

  it('the browser shape carries a page\'s identities, not just its names', () => {
    // Guards the guard. If these links are ever loosened, the probes above
    // start passing vacuously — which is exactly how the first version of this
    // environment let `typeof document` through.
    const seen = {};
    withEnvironment('browser', () => {
      seen.windowIsGlobal = globalThis.window === globalThis;
      seen.selfIsGlobal = globalThis.self === globalThis;
      seen.documentDefined = typeof document !== 'undefined';
      seen.locationDefined = typeof location !== 'undefined';
      seen.navigatorLinked = globalThis.window.navigator === globalThis.navigator;
      seen.documentViaWindow = globalThis.window.document === globalThis.document;
    });
    expect(seen).toEqual({
      windowIsGlobal: true, selfIsGlobal: true, documentDefined: true,
      locationDefined: true, navigatorLinked: true, documentViaWindow: true,
    });
    // …and the node shape must NOT carry them, or the two environments are
    // the same environment and every comparison above is vacuous.
    expect(typeof globalThis.window, 'the browser globals leaked out of the helper').toBe('undefined');
    expect(typeof globalThis.document, 'the browser globals leaked out of the helper').toBe('undefined');
  });

  // ── the source pins ────────────────────────────────────────────────
  for (const pin of SOURCE_PINS) {
    it(`the reviewed bytes are the shipped bytes: ${pin.label}`, () => {
      const primary = pin.kind === 'primary';
      expect(pin.read(),
        (primary
          ? 'PRIMARY GUARD. These are the whole reviewed file. Any difference lands here — a '
            + 'statement, a member path, an import.meta branch, a shadowed declaration, a '
            + 'live-binding swap, a swapped specifier, an added script tag, a comment, whitespace.'
          : 'DIAGNOSTIC, not the guard — the whole-file pin above already moves for anything in '
            + 'this region. It exists to name which bytes matter.')
        + `\nExecuted by this file: ${pin.executed}.`
        + '\nNOTE what a pin does NOT say: it says what this FILE contains, not that the page '
        + 'loads what is pinned. The manifest pin covers every .js/.mjs under core/, ui/ and\n'
        + 'content/; runtime surfaces outside that set and outside index.html — assets/, JSON, the\n'
        + 'hosting platform\'s own delivery — remain residual.'
        + '\nIf the change is intended: re-read the diff, confirm the behavioural cases below '
        + 'still pass under BOTH environments, and update this constant IN THE SAME COMMIT as '
        + 'the code change. Updating it on its own is how a bypass gets laundered.')
        .toEqual(pin.files === undefined
          ? { bytes: pin.bytes, sha256: pin.sha256 }
          : { files: pin.files, sourceBytes: pin.sourceBytes, sha256: pin.sha256 });
    });
  }

  it('the extractors are anchored, and text and bytes agree', () => {
    // Guards the pins. A missing or duplicated anchor throws rather than
    // silently reducing a pin to a stale constant nobody checks.
    expect(readHtml().split(SUBMIT_SIG).length - 1, 'the submit signature is not present exactly once').toBe(1);
    expect(() => uniqueLine(readHtml(), "from './ui/profile.js';")).not.toThrow();
    expect(() => declaration(readProfile(), 'export function getGenderInput() {')).not.toThrow();
    // The whole-file pin is taken over RAW BYTES while the counter-cases mutate
    // a decoded STRING. If those two ever disagreed, a mutant's fingerprint
    // would not be comparable to the pin.
    // BOTH files: the H-fixtures mutate index.html as a decoded STRING and
    // compare the result to a pin taken over RAW BYTES. If those two ever
    // disagreed, a mutant's fingerprint would not be comparable to the pin and
    // every H-fixture would be quietly meaningless.
    expect(fingerprintText(readProfile()), 'ui/profile.js: decoded text does not re-encode to the file\'s bytes')
      .toEqual(fingerprintBytes(readProfileBytes()));
    expect(fingerprintText(readHtml()), 'index.html: decoded text does not re-encode to the file\'s bytes')
      .toEqual(fingerprintBytes(readHtmlBytes()));
  });

  // ── what the executed handler actually touched ─────────────────────
  it('the handler reads exactly one first-hop property of its event, and the producer one of its control', () => {
    // The gap that killed the free-identifier surface: `e` was an allowed NAME,
    // so `e.target.ownerDocument` cost nothing, because a name scan cannot see
    // a member access at all. The first hop is recorded here because it was
    // READ at runtime, and no declaration anywhere can launder that.
    //
    // FIRST HOP ONLY, on purpose and by measurement — nested reads, symbols,
    // `in`, ownKeys-style enumeration, descriptors, writes and `delete` are all
    // silent here and are covered by the source pins instead. See the
    // strictAccess comment for the full measured list.
    for (const env of ENVIRONMENTS) {
      const seen = driveSubmit(readHtml(), { gender: 'female', env });
      expect(seen.eventReads, `the handler touched the event beyond preventDefault [${env}]`)
        .toEqual(['preventDefault']);
      expect(seen.controlReads, `the producer touched the control beyond value [${env}]`)
        .toEqual(['value']);
    }
  });

  it('the option object reaches its consumers unmutated', () => {
    // Built once, frozen, and still carrying exactly the keys it was built
    // with when both consumers have had it. One bypass kept the call, the
    // count, the inventory and the object identity, and deleted a key out of
    // that very object between production and both consumers.
    for (const env of ENVIRONMENTS) {
      const seen = driveSubmit(readHtml(), { gender: 'female', env });
      expect(seen.threw, `the drive threw [${env}]`).toBeNull();
      expect(seen.producedKeysAfter, `the produced object's keys changed during the handler [${env}]`)
        .toEqual(['time', 'gender', 'city', 'cc', 'tz', 'lat', 'lng']);
      expect(Object.isFrozen(seen.produced[0]), 'the harness did not fence the object').toBe(true);
    }
  });

  // ── coupling: the pinned call's object is what the consumers receive ──
  //
  // An audit kept the pinned HOST_CALL byte-for-byte and routed BOTH consumers
  // through a second, gender-free object built beside it. Every guard was
  // green. Presence of a call says nothing about what is delivered, so this
  // asserts IDENTITY, not shape.
  for (const env of ENVIRONMENTS) {
    it(`both consumers receive the exact object the pinned call produced [${env}]`, () => {
      const seen = driveSubmit(readHtml(), { gender: 'female', env });
      expect(seen.produced.length, 'the option object was built more than once').toBe(1);
      expect(seen.buildRef, 'buildProfile received a different object').toBe(seen.produced[0]);
      expect(seen.saveRef, 'saveProfile received a different object').toBe(seen.produced[0]);
      expect(seen.buildRef, 'the two consumers received different objects').toBe(seen.saveRef);
      expect(seen.buildRef.gender, 'the delivered object carries no gender').toBe('female');
    });
  }

  // ── counter-cases for every verified survivor ──────────────────────

  it('catches: the declaration kept byte-identical while the live export is swapped', () => {
    // THE ONE THAT RETIRED THE DECLARATION SLICES. `export function f(){}` is a
    // MUTABLE binding and ES module exports are LIVE, so appending an alternate
    // accessor and assigning it over the name replaces what every importer
    // receives while the declaration's own bytes never move. The identifiers
    // are written with Unicode escapes so the literal substring "gender" never
    // appears and the raw allowlist in tests/profile.test.js stays green — drop
    // the escapes and that test turns red, which is how load-bearing they are.
    //
    // WHICH ASSERTIONS GO RED: the `ui/profile.js` whole-file pin AND the
    // runtime-source manifest, which covers that file too. Not the region
    // pins, and nothing behavioural. It is
    // asserted here beside the retired declaration pin STAYING EQUAL, so the
    // fixture states the exact reason the guard was moved rather than implying
    // a broader one. Behaviour cannot see it either: this file imports the
    // module once, at load, from `file:` — so a `startsWith('http')` branch in
    // the swapped-in accessor is unreachable here. That blindness is asserted
    // below rather than assumed.
    const src = cleanProfile();
    const bad = src + [
      '',
      '',
      'function readControl() {',
      "  if (import.meta.url.startsWith('http')) return undefined;",
      '  const v = _g\\u0065nderSelect && _g\\u0065nderSelect.value;',
      "  return v === 'male' || v === 'female' ? v : undefined;",
      '}',
      'getG\\u0065nderInput = readControl;',
      '',
    ].join('\n');
    expect(bad, 'the mutation did not apply').not.toBe(src);

    // PREMISE 1: the escapes work — no appended line names the field, so the
    // raw allowlist that guards this corpus sees nothing new.
    expect(inventory(bad), 'premise broken: the raw gender inventory changed').toEqual(inventory(src));
    // PREMISE 2: the harness cannot execute the divergence.
    expect(import.meta.url.startsWith('file:'),
      'premise: this file imports the module from file:, so an http(s) branch cannot fire here')
      .toBe(true);

    // THE POINT: the retired guard stays green…
    expect(declarationPrint(bad), 'premise broken: the declaration slice moved, so this is not the bypass under test')
      .toEqual(RETIRED_DECLARATION_PIN);
    expect(declarationPrint(src), 'the clean declaration no longer matches the retired pin')
      .toEqual(RETIRED_DECLARATION_PIN);
    // …and the whole-file pin is what sees it.
    expect(profilePrint(bad), 'the whole-file pin did not move — the live export can be swapped unseen')
      .not.toEqual(PROFILE_PIN);
  });

  it('catches: the produced object mutated IN PLACE through an allowed root', () => {
    // Every signal an earlier guard checked survives this: the host call once,
    // the raw inventory byte-identical, the free-identifier surface unchanged
    // (`e` and `opts` were already on it; `constructor` and `keys` are member
    // paths, which a name scan discards by construction), one produced object,
    // both consumers holding that exact object. Under that suite it ran 57
    // files / 2029 tests GREEN, and a real-event-shaped drive rendered with
    // gender omitted.
    //
    // THREE assertions go red now, independently of each other:
    //   1. eventReads gains `target` — the first-hop recording sees the root
    //      member access that no name-based surface could.
    //   2. the drive throws a TypeError — the frozen option object refuses the
    //      delete, so the run never reaches showResult.
    //   3. the handler's source pin moves.
    //
    // ONLY 2 AND 3 GENERALISE. Assertion 1 depends on the read being spelled as
    // a first-hop string-keyed `get`: rewrite it as
    // `Object.getOwnPropertyDescriptor(e, 'target').value.ownerDocument` and it
    // returns the same value while recording nothing — verified, the mutation
    // still goes red 21 of 30 but THIS assertion stays green. Assertion 1 is
    // evidence about one spelling, not closure of the class.
    const html = cleanHtml();
    const bad = html.replace(HOST_CALL,
      `${HOST_CALL}\n  if (e.target && e.target.ownerDocument) delete opts[opts.constructor.keys(opts)[1]];`);
    expect(bad, 'the mutation did not apply').not.toBe(html);
    expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned call changed').toBe(1);
    expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

    for (const env of ENVIRONMENTS) {
      const seen = driveSubmit(bad, { gender: 'female', env });
      expect(seen.eventReads, `the event mutation read no unapproved first-hop member [${env}]`)
        .toEqual(['preventDefault', 'target']);
      expect(seen.threw, `the frozen option object accepted a delete [${env}]`).toBeInstanceOf(TypeError);
      expect(seen.rendered, `the mutant completed — the delete was a no-op [${env}]`).toBe(false);
      // Control: the real file does none of this, so the three assertions above
      // are discriminating rather than always-true.
      const good = driveSubmit(html, { gender: 'female', env });
      expect(good.eventReads).toEqual(['preventDefault']);
      expect(good.threw).toBeNull();
      expect(good.rendered).toBe(true);
    }
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(HANDLER_PIN);
  });

  it('catches: the producer branching on import.meta.url', () => {
    // `import` is a keyword and `.url`/`.startsWith` are member paths, so the
    // free-identifier surface stayed exactly `['_genderSelect']` and the whole
    // suite ran GREEN.
    //
    // Nothing BEHAVIOURAL in this file can see it, and that is asserted rather
    // than assumed: under vitest this module's own URL is `file:`, so the
    // branch cannot fire here, while the shipped module is fetched over
    // `http(s):` and it always would. The whole-file pin is what goes red.
    expect(import.meta.url.startsWith('file:'),
      'premise: the harness loads modules from file:, so an http(s) branch is invisible to execution here')
      .toBe(true);

    const src = cleanProfile();
    const bad = src.replace('export function getGenderInput() {',
      "export function getGenderInput() {\n  if (import.meta.url.startsWith('http')) return undefined;");
    expect(bad, 'the mutation did not apply').not.toBe(src);
    expect(inventory(bad), 'premise broken: the raw gender inventory changed').toEqual(inventory(src));
    expect(profilePrint(bad), 'the whole-file pin did not move').not.toEqual(PROFILE_PIN);
  });

  it('catches: a probe laundered by a declaration in a dead nested block', () => {
    // The survivor that showed the free-identifier policy was not merely
    // under-listed but structurally wrong. Its extractor gathered every
    // declaration into ONE body-wide locals set, so a dead
    // `if (false) { const Image = null; }` subtracted `Image` from a read that
    // happened earlier and outside that block. JavaScript does not shadow
    // backwards; the scan believed it did, and the suite ran GREEN.
    //
    // Behaviour is blind here, and the premise is evidenced below: neither
    // environment defines `Image`, so the delete never executes in this harness
    // and both drives still forward. The handler's source pin is the only thing
    // that sees it — and because THAT is the only evidence, this fixture takes
    // its baseline from the reviewed constant (`cleanHtml`) rather than from
    // the live file. With the survivor already on disk, the old shape compared
    // a poisoned baseline against itself and reported PASS.
    const html = cleanHtml();
    const bad = html.replace(HOST_CALL, [
      HOST_CALL,
      "  if (typeof Image !== 'undefined') delete opts[opts.constructor.keys(opts)[1]];",
      '  if (false) { const Image = null; }',
    ].join('\n'));
    expect(bad, 'the mutation did not apply').not.toBe(html);
    expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned call changed').toBe(1);
    expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

    expect(typeof Image, 'premise: node defines no Image').toBe('undefined');
    withEnvironment('browser', () => {
      expect(typeof Image, 'premise: the browser shape defines no Image either').toBe('undefined');
    });
    for (const env of ENVIRONMENTS) {
      const seen = driveSubmit(bad, { gender: 'female', env });
      // If this goes red, do NOT wave it off. Check first whether the survivor
      // is already on disk — `cleanHtml()` above is what makes that check
      // happen, and an earlier version of this fixture, lacking it, reported
      // PASS with this exact bypass shipped. Only on a provably clean tree does
      // a red here mean the harness gained the ability to execute the mutant.
      expect(seen.build.gender, `premise: behaviour is blind to this one [${env}]`).toBe('female');
    }
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(HANDLER_PIN);
  });

  it('catches: an environment probe on a global no deny-list contained', () => {
    // `history` and `HTMLElement` were outside BOTH the 7-name browser shim
    // and the 11-name raw ban. They are caught here with no list at all: the
    // probe is bytes in the handler that are not the reviewed bytes.
    const html = cleanHtml();
    for (const global of ['history', 'HTMLElement', 'queueMicrotask']) {
      const bad = html.replace(HOST_CALL, [
        '  let submitOpts;',
        `  if (typeof ${global} === "undefined") {`,
        HOST_CALL,
        '    submitOpts = opts;',
        '  } else {',
        `  ${FALLBACK.trim().replace('const opts =', 'submitOpts =')}`,
        '  }',
        '  const opts = submitOpts;',
      ].join('\n'));
      expect(bad, `the ${global} mutation did not apply`).not.toBe(html);
      expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));
      expect(handlerPrint(bad), `a ${global} probe did not move the handler source pin`)
        .not.toEqual(HANDLER_PIN);
    }
  });

  it('catches: the consumers routed through a second, gender-free object', () => {
    // The pinned call survives byte-for-byte; a lean object is built beside it
    // and BOTH consumers receive that instead. Byte pins over ONE LINE saw
    // nothing — which is why the pins here cover whole bodies and a whole
    // module, and why identity coupling is asserted behaviourally beside them.
    const html = cleanHtml();
    const bad = html
      .replace(HOST_CALL, `${HOST_CALL}\n${FALLBACK.replace('const opts', 'const leanOpts')}`)
      .replace('const profile = buildProfile(name, dob, opts);',
        'const profile = buildProfile(name, dob, leanOpts);')
      .replace('if (!saveProfile(name, dob, opts)) showPaidBanner(PROFILE_SAVE_STORAGE_MESSAGE);',
        'if (!saveProfile(name, dob, leanOpts)) showPaidBanner(PROFILE_SAVE_STORAGE_MESSAGE);');
    expect(bad, 'the mutation did not apply').not.toBe(html);
    expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned call changed').toBe(1);
    expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

    const seen = driveSubmit(bad, { gender: 'female' });
    expect(seen.rendered, 'the mutant did not run — this would pass vacuously').toBe(true);
    expect(seen.buildRef, 'the consumers still received the pinned object').not.toBe(seen.produced[0]);
    expect(seen.build.gender, 'the delivered object still carried the value').toBeUndefined();
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(HANDLER_PIN);
  });

  it('catches: the PRODUCER sabotaged, which a stubbed producer hid entirely', () => {
    // `if (typeof history !== "undefined") return undefined;` at the top of the
    // real getGenderInput left 246 tests green, because the driver injected a
    // fake in its place. The real one is driven now, and its module's bytes are
    // pinned — so the probe is caught even though neither environment defines
    // `history`.
    const src = cleanProfile();
    const bad = src.replace('export function getGenderInput() {',
      'export function getGenderInput() {\n  if (typeof history !== "undefined") return undefined;');
    expect(bad, 'the mutation did not apply').not.toBe(src);
    expect(profilePrint(bad), 'a sabotaged producer did not move the whole-file pin')
      .not.toEqual(PROFILE_PIN);
  });


  // ── H1–H6: the six bypasses that defeated REGION pins ──────────────
  //
  // Each was demonstrated live: full suite green, both region pins
  // byte-identical, `SUBMIT_SIG` occurring exactly once. Each is here
  // permanently, and each asserts the SAME two things — that the diagnostic
  // regions stay blind (which is why regions were not enough) and that the
  // whole-file pin moves (which is the guard doing its job). That pairing is
  // the intended reason; a fixture that only checked "something went red"
  // would not distinguish the new guard from the old one.
  //
  // H3 and H6 also need a companion file at the repo root. Those are inert
  // without their index.html half — both were verified to require it — and the
  // root inventory below names them regardless.
  const H_FIXTURES = [
    ['H1 — a defineProperty shim on the live control, so the UI still shows the choice',
      h => h.replace(BOOT_ANCHOR,
        "const _gc = profileForm.querySelector('#g\\u0065nder-input');\n"
        + "if (_gc && location.protocol !== 'file:') { Object.defineProperty(_gc, 'value', { get() { return ''; }, configurable: true }); }\n"
        + BOOT_ANCHOR)],
    ['H2 — a second submit listener under a different spelling, stopping propagation',
      h => h.replace(SUBMIT_SIG,
        'profileForm["addEventListener"]("submit", function (ev) { ev.stopImmediatePropagation(); });\n' + SUBMIT_SIG)],
    ['H3 — an inline importmap, so the pinned module is byte-identical and never loaded',
      h => h.replace('<script type="module">',
        '<script type="importmap">{"imports":{"./ui/profile.js":"./vendor-shim.js"}}</script>\n<script type="module">')],
    // `profileForm` is a CONST (index.html:1085), so assigning to it throws in a
    // module and is not a bypass at all. An audit caught that; the legal form
    // decoys the INITIALISER instead, which is what a real attacker would write.
    ['H4 — profileForm initialised to a live decoy, so the pinned bytes reach no user',
      h => h.replace("const profileForm = $('profile-form');",
        "const profileForm = location.protocol === 'file:' ? $('profile-form') : document.createElement('form');")],
    ['H5 — a second initProfileUI call repointing the control at a dead stub',
      h => h.replace(BOOT_ANCHOR,
        "if (location.protocol !== 'file:') { const _k = 'g' + 'enderSelect'; initProfileUI({ form: profileForm, [_k]: { value: '' } }, {}); }\n"
        + BOOT_ANCHOR)],
    // The −1 byte one. index.html line 1058, one occurrence; the shim deletes
    // the field from the live, UNFROZEN object one statement before saveProfile.
    // This is why the freeze claim is narrow: the freeze fences the object THIS
    // harness builds and hands to ITS OWN STUBS, and the real consumer chain is
    // not in frame at all.
    ['H6 — one module specifier swapped to a root shim that mutates the live object',
      h => h.replace("import { buildProfile } from './core/profile.js';",
        "import { buildProfile } from './vendor-core.js';")],
  ];

  for (const [name, mutate] of H_FIXTURES) {
    it(`catches: ${name}`, () => {
      const html = cleanHtml();
      const bad = mutate(html);
      expect(bad, 'the mutation did not apply — its anchor moved').not.toBe(html);

      // PREMISE — the region pins are BLIND to this. That is the finding.
      expect(handlerPrint(bad), `premise broken: ${name} moved the handler-body region`)
        .toEqual(HANDLER_PIN);
      expect(fingerprintText(uniqueLine(bad, "from './ui/profile.js';")),
        `premise broken: ${name} moved the pinned import specifier`)
        .toEqual(pinFor("index.html — DIAGNOSTIC: the seam's import specifier"));
      expect(bad.split(SUBMIT_SIG).length - 1, 'premise broken: the submit signature count changed').toBe(1);

      // THE ASSERTION — the whole-file pin is what sees it.
      expect(htmlPrint(bad), `${name} did not move the whole-file index.html pin`)
        .not.toEqual(HTML_PIN);
    });
  }


  it('catches: H7 — a protocol branch INSIDE an already-allowed module', () => {
    // The bypass that survived every guard before the manifest, and the reason
    // the manifest exists. Inserted into `core/profile.js`'s `buildProfile`, it
    // leaves BOTH whole-file pins byte-identical, adds no root file, changes no
    // specifier and no script tag — and ran 57 files / 2047 tests GREEN.
    // Reachability names the files the page reaches; it never says what is
    // inside an allowed one.
    //
    // WHICH ASSERTIONS GO RED, and the shape is the whole point: every pin and
    // every reachability check below is asserted to stay EQUAL, and only the
    // manifest is asserted to move. A fixture that merely showed "something
    // went red" could not tell the manifest apart from the guards it was added
    // to supplement.
    const REL = 'core/profile.js';
    const clean = readFileSync(join(REPO_ROOT, REL), 'utf-8');
    const SIG = 'export function buildProfile(name, dobIso, opts) {';
    expect(clean.split(SIG).length - 1, 'the H7 anchor is not present exactly once').toBe(1);
    const bad = clean.replace(SIG, SIG + '\n'
      + "  if (typeof location !== 'undefined' && location.protocol !== 'file:' && opts) "
      + "{ try { delete opts['g' + 'ender']; } catch (_) {} }");
    expect(bad, 'the mutation did not apply').not.toBe(clean);

    // PREMISE — everything that is NOT the manifest stays equal. This is the
    // finding: the whole prior guard set is blind to it.
    expect(fingerprintBytes(readHtmlBytes()), 'premise: index.html must be untouched').toEqual(HTML_PIN);
    expect(fingerprintBytes(readProfileBytes()), 'premise: ui/profile.js must be untouched').toEqual(PROFILE_PIN);
    expect((readHtml().match(/<script[^>]*>/g) || []).sort(),
      'premise: the script-tag set must be untouched')
      .toEqual(['<script type="application/ld+json">', '<script type="module">']);
    const h7specs = [...readHtml().matchAll(/from '([^']+)'/g)].map(m => m[1]).sort();
    expect(h7specs, 'premise: the exact specifier list must be untouched').toEqual(REVIEWED_SPECIFIERS);
    for (const spec of h7specs) {
      expect(existsSync(join(REPO_ROOT, spec)), `premise: ${spec} must still resolve`).toBe(true);
    }
    expect(readdirSync(REPO_ROOT).filter(f => f.endsWith('.js')).sort(),
      'premise: the root .js inventory must be untouched').toEqual(['vitest.config.js']);
    // …and the file it edits is inside no pinned FILE, only inside the manifest.
    expect(REL.startsWith('core/'), 'premise: H7 edits a module covered by no file pin').toBe(true);

    // THE ASSERTION — the manifest is the only thing that sees it.
    const MANIFEST_PIN = pinFor('core/ + ui/ + content/');
    expect(runtimeManifest(), 'the clean manifest no longer matches its pin').toEqual(MANIFEST_PIN);
    expect(runtimeManifest({ [REL]: bad }),
      'the runtime-source manifest did not move — an allowed module can be edited unseen')
      .not.toEqual(MANIFEST_PIN);
  });


  it('catches: two different trees framed to the same manifest digest', () => {
    // THE COLLISION THAT RETIRED THE FIRST FRAMING. It framed
    // `path \n length \n bytes \n`, and LF is a legal byte in a POSIX and Git
    // path — so a filename can carry the very delimiters the reader depends on
    // and move the boundary. Both sides below are two files, seven source
    // bytes, every name ending `.js`, sorted a→z.
    //
    // WHICH ASSERTION GOES RED, and why this is not a tautology: the collision
    // premises are asserted against a LOCAL COPY of the retired framing, so
    // they document the defect and cannot drift. The separation is asserted
    // through `frameManifest` ITSELF — the production helper the pins use — so
    // reverting the framing turns this test red for exactly its intended
    // reason rather than leaving a fixture that only tests its own copy.
    const A = [['core/a.js\n7\nq.js', Buffer.from('', 'utf8')],
               ['core/z.js', Buffer.from('q.js\n0\n', 'utf8')]];
    const B = [['core/a.js', Buffer.from('q.js\n0\n', 'utf8')],
               ['core/z.js\n7\nq.js', Buffer.from('', 'utf8')]];

    // PREMISE — the two trees really are different, and really are equal on
    // every summary the manifest reports besides the digest.
    expect(A.map(([r]) => r), 'premise: the two trees must differ').not.toEqual(B.map(([r]) => r));
    for (const t of [A, B]) {
      expect(t.every(([r]) => r.endsWith('.js')), 'premise: every name must end .js').toBe(true);
      expect([...t.map(([r]) => r)].sort(), 'premise: the entries must already be in sorted order')
        .toEqual(t.map(([r]) => r));
    }

    // PREMISE — the RETIRED framing collides. Local copy, kept only to pin the
    // defect; it is not used by anything else in this file.
    const retiredFraming = entries => {
      const frames = [];
      let sourceBytes = 0;
      for (const [rel, bytes] of entries) {
        sourceBytes += bytes.length;
        frames.push(Buffer.from(`${rel}\n${bytes.length}\n`, 'utf8'), bytes, Buffer.from('\n', 'utf8'));
      }
      const all = Buffer.concat(frames);
      return { files: entries.length, sourceBytes, streamBytes: all.length,
               sha256: createHash('sha256').update(all).digest('hex') };
    };
    const rA = retiredFraming(A);
    const rB = retiredFraming(B);
    expect(rA, 'premise broken: the retired framing no longer collides').toEqual(rB);
    expect(rA, 'premise broken: the recorded collision changed').toEqual({
      files: 2, sourceBytes: 7, streamBytes: 40,
      sha256: 'd54cffd56e0220483388e6930055d88ede0d25adcf36eeed8abbcf19f8186376',
    });

    // THE ASSERTION — the production framing separates them.
    expect(frameManifest(A), 'the manifest framing is not injective — two different trees forge one digest')
      .not.toEqual(frameManifest(B));
    // …and the summary fields alone would NOT have separated them, so the
    // digest is doing the work and not the counts beside it.
    expect(frameManifest(A).files).toBe(frameManifest(B).files);
    expect(frameManifest(A).sourceBytes).toBe(frameManifest(B).sourceBytes);
  });

  // ── secondary defenses: reachability, positive and exact ───────────
  //
  // Secondary on purpose. Every H-fixture above already moves the whole-file
  // pin, so none of these is what catches it. They exist for the companion
  // half of H3 and H6 — a file at the repo root that no pin names — and
  // because a specifier is cheap to check and expensive to miss.
  //
  // NOT a defense against H7-class changes: a mutation INSIDE an already-
  // allowed module (verified in `core/profile.js`) satisfies every assertion
  // here. Reachability says which files the page reaches, never what is in
  // them. That is stated in the residual, not implied away.

  it('index.html loads exactly the script tags it was reviewed with', () => {
    // Positive and exact — an importmap, or any new script tag, fails because
    // the set changed, not because "importmap" is on a list.
    const tags = (readHtml().match(/<script[^>]*>/g) || []).sort();
    expect(tags).toEqual(['<script type="application/ld+json">', '<script type="module">']);
  });

  it('every module specifier in index.html is reviewed and resolves to a real file', () => {
    const html = readHtml();
    const specs = [...html.matchAll(/from '([^']+)'/g)].map(m => m[1]).sort();
    expect(specs, 'index.html gained, lost or changed a module specifier').toEqual(REVIEWED_SPECIFIERS);
    // Scanned as `from '…'`, NOT as line-anchored imports: one of these
    // (`./ui/payments.js`) sits on the closing line of a multi-line import, and
    // a line-anchored scan misses it — which is exactly the sort of blind spot
    // a swapped specifier would hide in.
    for (const spec of specs) {
      expect(existsSync(join(REPO_ROOT, spec)), `${spec} does not exist on disk`).toBe(true);
    }
  });

  it('the repo ROOT carries exactly the .js files it was reviewed with', () => {
    // SCOPE, stated exactly: `.js` files in the repo root directory only. Not
    // subdirectories, not `.mjs`, not any other extension, not the rest of the
    // root's contents. H3 and H6 each need a new root file — inert without
    // their index.html half, but named here anyway.
    const rootJs = readdirSync(REPO_ROOT).filter(f => f.endsWith('.js')).sort();
    expect(rootJs, 'a .js file appeared in the repo root directory').toEqual(['vitest.config.js']);
  });

  it('behaves IDENTICALLY under node and browser globals', () => {
    // The bypass this closes: a handler branching on `typeof window` forwarded
    // the field under the harness and dropped it in a browser, with the raw
    // inventory byte-identical and every driver test green. Executing the real
    // bytes is necessary; executing them in only one environment is not enough.
    const html = readHtml();
    for (const gender of ['female', 'male', undefined]) {
      const inNode = driveSubmit(html, { gender, env: 'node' });
      const inBrowser = driveSubmit(html, { gender, env: 'browser' });
      expect(inBrowser.build, `browser run produced a different option object (${gender})`)
        .toEqual(inNode.build);
      expect(inBrowser.save, `browser run persisted a different object (${gender})`)
        .toEqual(inNode.save);
    }
  });

  const BYPASSES = [
    ['the whole seam DEAD inside if (false), beside a live gender-free fallback',
      h => h.replace(HOST_CALL, ['  if (false) {', HOST_CALL, '  }', FALLBACK].join('\n'))],
    ['the whole seam RELOCATED into an uncalled helper, beside a live fallback',
      h => h.replace(HOST_CALL, ['  function collectSubmitOpts() {', HOST_CALL, '    return opts;', '  }', FALLBACK].join('\n'))],
    ['the whole seam COMMENTED OUT, beside a live gender-free fallback',
      h => h.replace(HOST_CALL, ['  /*', HOST_CALL, '  */', FALLBACK].join('\n'))],
  ];

  for (const [name, mutate] of BYPASSES) {
    it(`catches: ${name}`, () => {
      const html = cleanHtml();
      const bad = mutate(html);
      expect(bad, 'the mutation did not apply — the host call moved').not.toBe(html);
      expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned bytes changed').toBe(1);
      expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));
      for (const env of ENVIRONMENTS) {
        const live = driveSubmit(bad, { gender: 'female', env });
        expect(live.rendered, `the mutant did not run to completion [${env}] — this would pass vacuously`).toBe(true);
        expect(live.build.gender, `a bypass forwarded no gender and went undetected [${env}]`).toBeUndefined();
        expect(live.save.gender, `a bypass persisted no gender and went undetected [${env}]`).toBeUndefined();
        expect(driveSubmit(html, { gender: 'female', env }).build.gender,
          `control: the real file must forward [${env}]`).toBe('female');
      }
      expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(HANDLER_PIN);
    });
  }
});
