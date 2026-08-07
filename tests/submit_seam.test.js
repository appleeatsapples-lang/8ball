// 8ball / tests / submit_seam.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { functionBody } from './helpers/js-lex.js';
import { buildSubmitOpts } from '../ui/profile.js';

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
  const { body } = functionBody(html, SUBMIT_SIG);
  const seen = { build: null, save: null, rendered: false, threw: null };
  const deps = {
    e: { preventDefault() {} },
    buildSubmitOpts,
    validateBirthInput: ({ name, dob }) => ({ name: name.trim(), dob }),
    applyBirthInputValidationState: () => true,
    birthValidationRefs: {},
    nameInput: { value: 'Profile Specimen' }, dobInput: { value: '1990-06-15' },
    timeInput: { value: time },
    getGenderInput: () => gender,
    selectedCity: city,
    loadSavedProfile: () => null, isNewPair: () => true, nextShakeState: () => ({ action: 'render' }),
    buildProfile: (n, d, o) => { seen.build = { ...o }; return { lifePath: 7, name: n }; },
    saveProfile: (n, d, o) => { seen.save = { ...o }; return true; },
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

  // A bounded RAW guard over the ~38-line handler: it may not name an
  // environment-sensitive global at all. Runtime-built indirection
  // (`globalThis["docu"+"ment"]`) stays honestly open — no static check closes
  // that — but the spelled class cannot reach the handler unnoticed.
  it('the submit handler names NO environment-sensitive global', () => {
    const { body } = functionBody(readHtml(), SUBMIT_SIG);
    const named = ['window', 'document', 'location', 'navigator', 'self',
      'globalThis', 'process', 'top', 'parent', 'frames', 'screen']
      .filter(g => new RegExp(`\\b${g}\\b`).test(body));
    expect(named,
      'the submit handler reached for an environment global — the option object '
      + 'must not depend on where it runs').toEqual([]);
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
