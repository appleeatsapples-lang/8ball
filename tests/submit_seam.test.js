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

function withEnvironment(env, fn) {
  if (env === 'node') return fn();
  const hadWindow = 'window' in globalThis;
  const priorWindow = globalThis.window;
  // Enough of a browser to satisfy an environment probe. Deliberately NOT a
  // DOM: the point is that `typeof window` must not change the outcome.
  globalThis.window = globalThis.window || { document: {}, navigator: {} };
  try { return fn(); } finally {
    if (hadWindow) globalThis.window = priorWindow; else delete globalThis.window;
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

  it('catches: a seam branching on typeof window, live only outside a browser', () => {
    // This bypass FORWARDS under the node harness by construction, so the
    // uniform "forwards nothing" check does not apply to it. What catches it
    // is the two environments DISAGREEING — which is exactly the property the
    // single-environment driver could not see, and why it shipped green.
    const html = readHtml();
    const bad = html.replace(HOST_CALL, [
      '  let submitOpts;',
      '  if (typeof window === "undefined") {',
      HOST_CALL,
      '    submitOpts = opts;',
      '  } else {',
      `  ${FALLBACK.trim().replace('const opts =', 'submitOpts =')}`,
      '  }',
      '  const opts = submitOpts;',
    ].join('\n'));
    expect(bad, 'the mutation did not apply').not.toBe(html);

    // PREMISE: every static signal is unchanged — this is why it was invisible.
    expect(bad.split(HOST_CALL.trim()).length - 1, 'premise broken: the pinned bytes changed').toBe(1);
    expect(inventory(bad), 'premise broken: the raw inventory changed').toEqual(inventory(html));

    const inNode = driveSubmit(bad, { gender: 'female', env: 'node' });
    const inBrowser = driveSubmit(bad, { gender: 'female', env: 'browser' });
    expect(inNode.rendered && inBrowser.rendered, 'a run did not complete — this would pass vacuously').toBe(true);
    // The harness alone is fooled…
    expect(inNode.build.gender, 'premise broken: the node run should still forward').toBe('female');
    // …and the browser run is where the field is actually lost.
    expect(inBrowser.build.gender, 'the browser-environment bypass went undetected').toBeUndefined();
    expect(inBrowser.build, 'the two environments must disagree for this to be the catch')
      .not.toEqual(inNode.build);
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
