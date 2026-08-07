// 8ball / tests / submit_seam.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { functionBody } from './helpers/js-lex.js';
// The REAL producer, not a stub of it — see the driver comment below.
import { buildSubmitOpts, getGenderInput, initProfileUI } from '../ui/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMIT_SIG = "profileForm.addEventListener('submit', e => {";
const readHtml = () => readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const readProfile = () => readFileSync(join(__dirname, '..', 'ui', 'profile.js'), 'utf-8');
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
// This list is NOT load-bearing any more and must never be grown to chase a
// bypass. Two finite lists died that way (a seven-name shim and an eleven-name
// ban, both walked past by `history` and `HTMLElement`), and the free-identifier
// policy that replaced them died too — see the SOURCE PINS section. What closes
// the "runs differently outside a browser" class now is the byte pin, which
// enumerates nothing. These globals exist so the behavioural drives below run
// in a page-shaped environment, not so the list can be completed.
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

// ── strict-access refs: a POSITIVE policy over member PATHS, at runtime ──
//
// The retired free-identifier policy pinned the NAMES a scope may reference,
// and an audit walked through the gap between a name and a path: `e` was on the
// allowed list, so `e.target.ownerDocument` referenced nothing new. Property
// accesses were excluded from the surface by construction, which is what made
// every allowed root a free doorway.
//
// These proxies close that at runtime instead of lexically. Each records every
// property actually READ, and the tests pin the read set exactly: the handler
// may read `preventDefault` on its event and nothing else; the producer may
// read `value` on its control and nothing else. A new member path fails because
// it was read, not because it was foreseen — and unlike a name scan, a proxy
// cannot be laundered by where a declaration sits.
//
// Symbol-keyed reads are not recorded (vitest's own inspection uses them); they
// are covered by the SOURCE PINS below, which see every byte regardless of key.
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

function driveSubmit(html, { gender, city = CITY, time = '14:30', env = 'node', profileSrc = null } = {}) {
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
    // exactly how the last bypass removed the value while every byte, count and
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
    // test. `profileSrc` is unused by the driver and exists only so callers can
    // document which producer bytes a case is about.
    try {
      new Function(...names, `"use strict";\n${body}`)(...names.map(k => deps[k]));
    } catch (err) { seen.threw = err; }
  });
  seen.producedKeysAfter = seen.produced.length ? Object.keys(seen.produced[0]) : null;
  seen.controlReads = [...controlReads].sort();
  seen.eventReads = [...eventReads].sort();
  void profileSrc;
  return seen;
}

// ── SOURCE PINS — the primary guard, and it enumerates nothing ──────
//
// WHAT THIS REPLACED, AND WHY. Seven rounds tried to guarantee "no bypass can
// hide on the value path" by ANALYSING the source: byte pins over one line,
// then a browser-globals shim of seven names, then a raw ban of eleven, then a
// positive free-identifier surface built on the hand lexer. Each was defeated
// by something it had not modelled, and the last one by three things at once:
//
//   1. MEMBER PATHS ON AN ALLOWED ROOT. `e` was on the surface, so
//      `if (e.target && e.target.ownerDocument) delete opts[opts.constructor
//      .keys(opts)[1]];` referenced nothing new — property accesses are
//      excluded from a free-identifier scan by construction, and `Object` was
//      reached through `opts.constructor`. Host call intact once, raw
//      inventory byte-identical, one produced object, both consumers holding
//      that exact object — and gender deleted out of it in place. Full suite
//      57 files / 2029 tests GREEN.
//   2. `import.meta`. `if (import.meta.url.startsWith('http')) return
//      undefined;` at the top of the real producer: `import` is a keyword and
//      every member name is discarded, so the surface stayed exactly
//      `['_genderSelect']`. Vitest sees `file:`; the shipped module sees
//      `http(s):`. Full suite GREEN.
//   3. FLAT-SCOPE LAUNDERING. The extractor collects every declaration into one
//      body-wide locals set with no notion of scope, so
//      `if (typeof Image !== 'undefined') delete …;` followed by a dead
//      `if (false) { const Image = null; }` subtracts `Image` globally. The
//      nested declaration does not shadow the earlier read in JavaScript; the
//      scan believed it did. Full suite GREEN.
//
// The lesson is not "the lexer needs another rule". `tests/helpers/js-lex.js`
// said from the day it was written that it is SECONDARY, not primary, and that
// a hand lexer cannot carry an absolute claim; making it primary is what
// failed. A scope-aware parser would fix the third defect and not the first
// two, and this repo adds no persistent dependency to find out.
//
// So the absolute claim now rests on EXACT BYTES. Every function the selected
// value passes through is small and bounded, so each one's exact source is
// pinned by length and SHA-256. This enumerates no globals, models no scopes
// and parses nothing: a member path, an `import.meta`, a shadowed declaration,
// a runtime-built key and a whitespace change are all caught identically,
// because each is a byte that is not the reviewed byte. It also fails closed on
// the extractor itself — if the lexer ever mis-locates the handler body, the
// pinned length and hash change and this goes red.
//
// What a byte pin CANNOT do is tell you what the bytes mean, and a pin updated
// without thought launders anything. That is why it is only half of the guard:
// the behavioural drives below execute these same bytes under both
// environments, and the runtime access policy and the frozen option object
// catch the classes a hash update would carry through.
const SOURCE_PINS = [
  {
    label: 'index.html — the submit handler body (the bytes this file EXECUTES)',
    bytes: 2006,
    sha256: '4043a0b48ff55ab73df7ca7fd05eaee1510469d96314fcf1f89e6aafac79715f',
    read: () => functionBody(readHtml(), SUBMIT_SIG).body,
  },
  {
    label: 'ui/profile.js — buildSubmitOpts (builds the option object)',
    bytes: 309,
    sha256: 'bb747277c9a031aa052cfc0f8d2de662a98920f3edc52793f04c36c63b478621',
    read: () => declaration(readProfile(), 'export function buildSubmitOpts({ time, gender, city } = {}) {'),
  },
  {
    label: 'ui/profile.js — getGenderInput (reads the live control)',
    bytes: 143,
    sha256: '825a4df3ba71e9731f24edffa71a71e0ed77878346c66b58c40c2e57b56317fa',
    read: () => declaration(readProfile(), 'export function getGenderInput() {'),
  },
  {
    label: 'ui/profile.js — initProfileUI (binds the control the producer reads)',
    bytes: 131,
    sha256: 'd1922a3802a7204876f5c7bc7c7151c6296b12db68b50a6e1c765a4618763184',
    read: () => declaration(readProfile(), 'export function initProfileUI(refs, hooks) {'),
  },
  {
    // The binding, not just the bodies. The drives INJECT `buildSubmitOpts` and
    // `getGenderInput` as dependencies, so index.html's own import statement is
    // executed by nothing here — and a specifier pointing at a different module
    // would leave every body pin above intact while the page ran other code
    // entirely. One line, so it is pinned like one.
    label: "index.html — the seam's import specifier",
    bytes: 253,
    sha256: '2090e8053951fc5c309d2867a104dac3877ca8d257b6dd8dafb5f860add29335',
    read: () => uniqueLine(readHtml(), "from './ui/profile.js';"),
  },
  {
    // On the path in PRODUCTION but NOT executed here: index.html boots with
    // `{ form, anchor }`, so this builds the control; the drives above pass
    // `{ genderSelect }` and take its first-line early return. That gap is real
    // and is stated in the residual — this pin and the manual browser pass are
    // its whole cover, because §12 forbids a DOM harness.
    label: 'ui/profile.js — resolveGenderSelect (builds the control in production)',
    bytes: 1135,
    sha256: 'c0b60dee542e40311bd99b1ad5e634115adb9d33c0af0ef85f8f129739a2ffa0',
    read: () => declaration(readProfile(), 'function resolveGenderSelect(refs) {'),
  },
];

/**
 * The exact bytes of a top-level declaration: from its literal signature to the
 * first line-start `}` after it. Two literal string searches, no parsing — the
 * point of the pins is that nothing between the file and the hash can be fooled.
 * The signature must be unique, and a mis-location can only SHORTEN the slice,
 * which changes the hash. Fail-closed in both directions.
 */
/** The one line containing `marker`, whole. Throws unless there is exactly one. */
function uniqueLine(src, marker) {
  const hits = src.split('\n').filter(l => l.includes(marker));
  if (hits.length !== 1) throw new Error(`${hits.length} lines contain ${marker}, expected 1`);
  return hits[0];
}

function declaration(src, signature) {
  const at = src.indexOf(signature);
  if (at === -1) throw new Error(`signature not found: ${signature}`);
  if (src.indexOf(signature, at + 1) !== -1) throw new Error(`signature is not unique: ${signature}`);
  const end = src.indexOf('\n}\n', at);
  if (end === -1) throw new Error(`no line-start close after: ${signature}`);
  return src.slice(at, end + 2);
}

const fingerprint = text => ({ bytes: text.length, sha256: createHash('sha256').update(text, 'utf8').digest('hex') });

// The pin as the counter-cases apply it: same extraction, against supplied source.
const handlerPrint = html => fingerprint(functionBody(html, SUBMIT_SIG).body);
const producerPrint = src => fingerprint(declaration(src, 'export function getGenderInput() {'));

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
      const html = readHtml();
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
      expect(fingerprint(pin.read()),
        'These exact bytes are what the behavioural tests in this file execute and what a '
        + 'cross-model audit read. Any difference — a statement, a member path, an import.meta '
        + 'branch, a shadowed declaration, a comment, whitespace — lands here.\n'
        + 'If the change is intended: re-read the diff, confirm the behavioural cases below '
        + 'still pass under BOTH environments, and update this constant IN THE SAME COMMIT as '
        + 'the code change. Updating it on its own is how a bypass gets laundered — the runtime '
        + 'access policy, the frozen option object and the identity coupling below exist because '
        + 'a hash can be edited and behaviour cannot.')
        .toEqual({ bytes: pin.bytes, sha256: pin.sha256 });
    });
  }

  it('the extractor is anchored — a pinned signature is present and unique', () => {
    // Guards the pins. `declaration` throws on a missing or duplicated
    // signature, so a rename cannot silently reduce a pin to a stale constant
    // nobody checks; and a truncated slice can only change the hash.
    const src = readProfile();
    for (const sig of [
      'export function buildSubmitOpts({ time, gender, city } = {}) {',
      'export function getGenderInput() {',
      'export function initProfileUI(refs, hooks) {',
      'function resolveGenderSelect(refs) {',
    ]) {
      expect(src.split(sig).length - 1, `${sig} is not present exactly once`).toBe(1);
      expect(declaration(src, sig).endsWith('\n}'), `${sig} did not slice to a line-start close`).toBe(true);
    }
    expect(readHtml().split(SUBMIT_SIG).length - 1, 'the submit signature is not present exactly once').toBe(1);
  });

  // ── the runtime access policy: member PATHS, not names ─────────────
  it('the handler reads exactly one property of its event, and the producer one of its control', () => {
    // The gap the previous guard left: `e` was an allowed NAME, so
    // `e.target.ownerDocument` cost nothing. Here the event and the control are
    // proxies and the read sets are pinned exactly. A new path fails because it
    // was read at runtime — no list of forbidden members exists to be outrun,
    // and no declaration anywhere can launder it.
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
    // with when both consumers have had it. The last bypass kept the call, the
    // count, the inventory and the object identity, and deleted a key out of
    // that very object between the two.
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

  // ── counter-cases for the three bypasses that got past the surface policy ──

  it('catches: the produced object mutated IN PLACE through an allowed root', () => {
    // The verified P1. Every signal the previous guard checked survives: the
    // host call once, the raw inventory byte-identical, the free-identifier
    // surface unchanged (`e` and `opts` were already on it; `constructor` and
    // `keys` are member paths, which a name scan discards by construction), one
    // produced object, both consumers holding that exact object. Under the old
    // suite this ran 57 files / 2029 tests GREEN, and a real-event-shaped drive
    // rendered with gender omitted.
    //
    // THREE assertions go red now, and they are independent of each other:
    //   1. eventReads gains `target` — the runtime access policy sees the path
    //      that no name-based surface could.
    //   2. the drive throws a TypeError — the frozen option object refuses the
    //      delete, so the run never reaches showResult.
    //   3. the handler's source pin changes — the bytes are not the reviewed
    //      bytes.
    // 1 and 2 are what a blind hash update cannot launder; 3 is what catches
    // the same class when it hides behind an environment the harness lacks.
    const html = readHtml();
    const bad = html.replace(HOST_CALL,
      `${HOST_CALL}\n  if (e.target && e.target.ownerDocument) delete opts[opts.constructor.keys(opts)[1]];`);
    expect(bad, 'the mutation did not apply').not.toBe(html);
    expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned call changed').toBe(1);
    expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

    for (const env of ENVIRONMENTS) {
      const seen = driveSubmit(bad, { gender: 'female', env });
      expect(seen.eventReads, `the event mutation read no unapproved member path [${env}]`)
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
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(handlerPrint(html));
  });

  it('catches: the producer branching on import.meta.url', () => {
    // The second verified P1. `import` is a keyword and `.url`/`.startsWith`
    // are member paths, so the free-identifier surface stayed exactly
    // `['_genderSelect']` and the whole suite ran GREEN.
    //
    // Nothing BEHAVIOURAL in this file can see it, and that is asserted rather
    // than assumed: under vitest this module's own URL is `file:`, so the
    // branch cannot fire here, while the shipped module is fetched over
    // `http(s):` and it always would. The producer's source pin is what goes
    // red — the whole reason the absolute claim was moved onto bytes.
    expect(import.meta.url.startsWith('file:'),
      'premise: the harness loads modules from file:, so an http(s) branch is invisible to execution here')
      .toBe(true);

    const src = readProfile();
    const bad = src.replace('export function getGenderInput() {',
      "export function getGenderInput() {\n  if (import.meta.url.startsWith('http')) return undefined;");
    expect(bad, 'the mutation did not apply').not.toBe(src);
    expect(inventory(bad), 'premise broken: the raw gender inventory changed').toEqual(inventory(src));

    expect(producerPrint(bad), 'the producer source pin did not move').not.toEqual(producerPrint(src));
    expect(producerPrint(src), 'the real producer no longer matches its pin')
      .toEqual({ bytes: 143, sha256: '825a4df3ba71e9731f24edffa71a71e0ed77878346c66b58c40c2e57b56317fa' });
  });

  it('catches: a probe laundered by a declaration in a dead nested block', () => {
    // The third verified survivor, and the one that showed the retired policy
    // was not merely under-listed but structurally wrong. Its extractor gathers
    // every declaration into ONE body-wide locals set, so a dead
    // `if (false) { const Image = null; }` subtracts `Image` from a read that
    // happened earlier and outside that block. JavaScript does not shadow
    // backwards; the scan believed it did, and the suite ran GREEN.
    //
    // Behaviour is blind here too, and the premise is evidenced below: neither
    // environment defines `Image`, so the delete never executes in this harness
    // and both drives still forward. The handler's source pin is the only thing
    // that sees it — which is the honest statement, not a claim that the class
    // of scope-laundered probes is closed by analysis. It is closed by bytes.
    const html = readHtml();
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
      // If this ever goes red, the harness gained the ability to execute this
      // mutant — good news, not a broken test. Re-read the note above.
      expect(seen.build.gender, `premise: behaviour is blind to this one [${env}]`).toBe('female');
    }
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(handlerPrint(html));
  });

  it('catches: an environment probe on a global no deny-list contained', () => {
    // `history` and `HTMLElement` were outside BOTH the 7-name browser shim
    // and the 11-name raw ban. They are caught here with no list at all: the
    // probe is bytes in the handler that are not the reviewed bytes.
    const html = readHtml();
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
        .not.toEqual(handlerPrint(html));
    }
  });

  it('catches: the consumers routed through a second, gender-free object', () => {
    // The pinned call survives byte-for-byte; a lean object is built beside it
    // and BOTH consumers receive that instead. Byte pins over ONE LINE saw
    // nothing — which is why the pins here cover whole bodies, and why identity
    // coupling is asserted behaviourally beside them.
    const html = readHtml();
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
    expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(handlerPrint(html));
  });

  it('catches: the PRODUCER sabotaged, which a stubbed producer hid entirely', () => {
    // `if (typeof history !== "undefined") return undefined;` at the top of the
    // real getGenderInput left 246 tests green, because the driver injected a
    // fake in its place. The real one is driven now, and its bytes are pinned —
    // so the probe is caught even though neither environment defines `history`.
    const src = readProfile();
    const bad = src.replace('export function getGenderInput() {',
      'export function getGenderInput() {\n  if (typeof history !== "undefined") return undefined;');
    expect(bad, 'the mutation did not apply').not.toBe(src);
    expect(producerPrint(bad), 'a sabotaged producer did not move its source pin')
      .not.toEqual(producerPrint(src));
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
      const html = readHtml();
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
      expect(handlerPrint(bad), 'the handler source pin did not move').not.toEqual(handlerPrint(html));
    });
  }
});
