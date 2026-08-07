// 8ball / tests / submit_seam.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
const readProfile = () => readFileSync(PROFILE_PATH, 'utf-8');
const readProfileBytes = () => readFileSync(PROFILE_PATH);
const CITY = { name: 'Manama', countryCode: 'BH', tz: 'Asia/Bahrain', lat: 26.2286, lng: 50.586 };
const HOST_CALL =
  '  const opts = buildSubmitOpts({ time: timeInput.value, gender: getGenderInput(), city: selectedCity });';
const FALLBACK = '  const opts = buildSubmitOpts({ time: timeInput.value, city: selectedCity });';
const inventory = h => h.split('\n').map(l => l.trim()).filter(l => /gender/i.test(l));

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

// ── SOURCE PINS — the primary guard, and it enumerates nothing ──────
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
// `index.html` keeps two pins rather than one, because it is the product's
// entire single-file host and pinning all of it would red on every unrelated
// edit: the submit handler body (the same extraction the driver EXECUTES) and
// the seam's import specifier line. What that leaves open on the index.html
// side is in the residual, not glossed.
//
// Byte pins are half of the guard, because a hash can be edited. The
// behavioural drives execute these same bytes under both environments, and the
// read recording and the frozen option object catch classes a blind hash update
// would carry through.
//
// WHAT THESE PINS DO NOT ESTABLISH — read this before quoting them anywhere.
// They constrain what the pinned regions CONTAIN. They do not establish that
// those regions are the only code the value passes through, and they do not
// establish which FILE the page actually loads. All of the following were
// demonstrated with every pin byte-identical and the full suite green:
//
//   · one of index.html's SEVENTEEN import lines swapped to a root shim that
//     re-exports `buildProfile` and deletes the field from the live, UNFROZEN
//     options object one statement before `saveProfile` — so the freeze closes
//     in-place mutation BY THE PINNED HANDLER BODY, and nothing more;
//   · an inline `<script type="importmap">` remapping the pinned specifier, so
//     `ui/profile.js` stays byte-identical on disk and the page never runs it;
//   · a second `initProfileUI({…, genderSelect: {value: ''}})` call from the
//     unpinned boot region, repointing the module's control at a dead stub;
//   · `profileForm` rebound, a second listener under a different spelling, and
//     a `defineProperty` shim on the live control's `value`.
//
// The two index.html pins cover 2,270 of 69,373 bytes — 3.3% of the file, and
// 1 of its 17 import lines. `ui/profile.js` is covered whole. Everything else
// is residual, and it is enumerated rather than implied.
//
// BYTES ARE UTF-8 BYTES. An earlier revision recorded `String.length`, which is
// UTF-16 code units — 2006 for a handler body that is 2017 bytes, because §6's
// comments contain `§` and `β`. The hashes were already over UTF-8 and did not
// move; the counts did.
const SOURCE_PINS = [
  {
    label: 'index.html — the submit handler body (the bytes this file EXECUTES)',
    bytes: 2017,
    sha256: '4043a0b48ff55ab73df7ca7fd05eaee1510469d96314fcf1f89e6aafac79715f',
    read: () => fingerprintText(functionBody(readHtml(), SUBMIT_SIG).body),
  },
  {
    // The binding, not just the bodies. The drives INJECT `buildSubmitOpts` and
    // `getGenderInput` as dependencies, so index.html's own import statement is
    // executed by nothing here — and a specifier pointing at a different module
    // would leave every other pin intact while the page ran other code.
    label: "index.html — the seam's import specifier",
    bytes: 253,
    sha256: '2090e8053951fc5c309d2867a104dac3877ca8d257b6dd8dafb5f860add29335',
    read: () => fingerprintText(uniqueLine(readHtml(), "from './ui/profile.js';")),
  },
  {
    // WHOLE FILE, raw bytes. Everything the value passes through on the module
    // side lives here — `buildSubmitOpts`, `getGenderInput`, `initProfileUI`,
    // `resolveGenderSelect` — and so does every line that could replace any of
    // them. `resolveGenderSelect` is on the PRODUCTION path but is not executed
    // by any drive: index.html boots with `{ form, anchor }` and it builds the
    // control, while the drives pass `{ genderSelect }` and take its first-line
    // early return. §12 forbids a DOM harness, so these bytes and the manual
    // browser pass are its whole cover, and the residual says so.
    label: 'ui/profile.js — the whole module, raw bytes',
    bytes: 17566,
    sha256: 'd6fba912fcb9edc146c0af3fd93203652b3e1acc533f39cbba11fe007996099e',
    read: () => fingerprintBytes(readProfileBytes()),
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
  return { bytes: hits[0].bytes, sha256: hits[0].sha256 };
}
const HANDLER_PIN = pinFor('index.html — the submit handler body');
const PROFILE_PIN = pinFor('ui/profile.js — the whole module');

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
  const html = readHtml();
  expect(handlerPrint(html), NOT_CLEAN).toEqual(HANDLER_PIN);
  return html;
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
      expect(pin.read(),
        'These exact bytes are what the behavioural tests in this file execute and what a '
        + 'cross-model audit read. Any difference — a statement, a member path, an import.meta '
        + 'branch, a shadowed declaration, a live-binding swap, a comment, whitespace — lands here.\n'
        + 'If the change is intended: re-read the diff, confirm the behavioural cases below '
        + 'still pass under BOTH environments, and update this constant IN THE SAME COMMIT as '
        + 'the code change. Updating it on its own is how a bypass gets laundered — the read '
        + 'recording, the frozen option object and the identity coupling below exist because '
        + 'a hash can be edited and behaviour cannot.')
        .toEqual({ bytes: pin.bytes, sha256: pin.sha256 });
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
    expect(fingerprintText(readProfile()), 'decoded text does not re-encode to the file\'s bytes')
      .toEqual(fingerprintBytes(readProfileBytes()));
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
    // WHICH ASSERTION GOES RED: the whole-file pin, and only that. It is
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
