// 8ball / tests / submit_seam.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { freeIdentifiers, functionBody } from './helpers/js-lex.js';
// The REAL producer, not a stub of it — see the driver comment below.
import { buildSubmitOpts, getGenderInput, initProfileUI } from '../ui/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUBMIT_SIG = "profileForm.addEventListener('submit', e => {";
const readHtml = () => readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
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

function driveSubmit(html, { gender, city = CITY, time = '14:30', env = 'node' } = {}) {
  // Wire the real producer to a real control carrying the value under test.
  initProfileUI({ genderSelect: { value: gender === undefined ? '' : gender } }, {});
  const { body } = functionBody(html, SUBMIT_SIG);
  const seen = { build: null, save: null, rendered: false, threw: null, produced: [], buildRef: null, saveRef: null };
  const deps = {
    e: { preventDefault() {} },
    buildSubmitOpts: (...args) => { const o = buildSubmitOpts(...args); seen.produced.push(o); return o; },
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
    new Function(...names, `"use strict";\n${body}`)(...names.map(k => deps[k]));
  });
  return seen;
}

describe('the submit seam — EXECUTED, not scanned', () => {
  for (const env of ENVIRONMENTS) {
    it(`forwards the optional field to buildProfile AND saveProfile [${env}]`, () => {
      const html = readHtml();
      const female = driveSubmit(html, { gender: 'female', env });
      const male = driveSubmit(html, { gender: 'male', env });
      const absent = driveSubmit(html, { gender: undefined, env });
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

  // ── the POSITIVE policy: what these scopes may reference at all ──
  //
  // Two finite deny-lists died here first: a browser-globals shim listing
  // seven names and a raw ban listing eleven, both walked past by `history`
  // and `HTMLElement`. Enumerating what a page exposes is not a finite job.
  //
  // So these pin the DEPENDENCY SURFACE instead. Every identifier the scope
  // references without declaring is listed; anything new fails, whether it is
  // `history`, `HTMLElement`, `queueMicrotask` or a global invented next year.
  // `history` fails not because it is forbidden but because it is NEW.
  const HANDLER_FREE = [
    'PROFILE_SAVE_STORAGE_MESSAGE', '_', 'applyBirthInputValidationState', 'arrive',
    'birthValidationRefs', 'buildProfile', 'buildSubmitOpts', 'city', 'coordsForTier',
    'dobInput', 'e', 'ensureFacetIndex', 'gender', 'getGenderInput', 'getRenderTier',
    'isNewPair', 'loadSavedProfile', 'nameInput', 'nextShakeState', 'readingsUI',
    'reset', 'saveProfile', 'selectedCity', 'showPaidBanner', 'showResult', 'time',
    'timeInput', 'validateBirthInput',
  ];
  // The PRODUCER too — sabotaging it was a separate live bypass, and a scope
  // that may reference only its own module-local binding cannot probe anything.
  const PRODUCER_FREE = ['_genderSelect'];

  it('the submit handler references nothing outside its declared surface', () => {
    expect(freeIdentifiers(functionBody(readHtml(), SUBMIT_SIG).body),
      'the handler gained a dependency. If it is a legitimate module binding, add '
      + 'it here deliberately; if it is an environment global, that is the bug.')
      .toEqual(HANDLER_FREE);
  });

  it('the producer references nothing outside its declared surface', () => {
    const src = readFileSync(join(__dirname, '..', 'ui', 'profile.js'), 'utf-8');
    expect(freeIdentifiers(functionBody(src, 'export function getGenderInput() {').body),
      'getGenderInput gained a dependency — the value must not depend on where it runs')
      .toEqual(PRODUCER_FREE);
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

  // ── counter-cases for the two bypasses that got past finite lists ──

  it('catches: an environment probe on a global no deny-list contained', () => {
    // `history` and `HTMLElement` were outside BOTH the 7-name browser shim
    // and the 11-name raw ban. The positive policy needs neither: they fail
    // because they are new to the surface, not because they are listed.
    for (const global of ['history', 'HTMLElement', 'queueMicrotask']) {
      const bad = readHtml().replace(HOST_CALL, [
        '  let submitOpts;',
        `  if (typeof ${global} === "undefined") {`,
        HOST_CALL,
        '    submitOpts = opts;',
        '  } else {',
        `  ${FALLBACK.trim().replace('const opts =', 'submitOpts =')}`,
        '  }',
        '  const opts = submitOpts;',
      ].join('\n'));
      expect(bad, `the ${global} mutation did not apply`).not.toBe(readHtml());
      expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(readHtml()));
      expect(freeIdentifiers(functionBody(bad, SUBMIT_SIG).body),
        `a ${global} probe did not register on the dependency surface`)
        .toContain(global);
    }
  });

  it('catches: the consumers routed through a second, gender-free object', () => {
    // The pinned call survives byte-for-byte; a lean object is built beside it
    // and BOTH consumers receive that instead. Byte pins see nothing.
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
  });

  it('catches: the PRODUCER sabotaged, which a stubbed producer hid entirely', () => {
    // `if (typeof history !== "undefined") return undefined;` at the top of the
    // real getGenderInput left 246 tests green, because the driver injected a
    // fake in its place. Now the real one is driven, and its dependency surface
    // is pinned — so the probe registers even though neither environment here
    // defines `history`.
    const src = readFileSync(join(__dirname, '..', 'ui', 'profile.js'), 'utf-8');
    const bad = src.replace('export function getGenderInput() {',
      'export function getGenderInput() {\n  if (typeof history !== "undefined") return undefined;');
    expect(bad, 'the mutation did not apply').not.toBe(src);
    expect(freeIdentifiers(functionBody(bad, 'export function getGenderInput() {').body),
      'a sabotaged producer did not register on its dependency surface')
      .toEqual(['_genderSelect', 'history']);
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
    });
  }
});
