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

function driveSubmit(html, { gender, city = CITY, time = '14:30' } = {}) {
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
  new Function(...names, `"use strict";\n${body}`)(...names.map(k => deps[k]));
  return seen;
}

describe('the submit seam — EXECUTED, not scanned', () => {
  it('forwards the optional field to buildProfile AND saveProfile', () => {
    const html = readHtml();
    const female = driveSubmit(html, { gender: 'female' });
    const male = driveSubmit(html, { gender: 'male' });
    const absent = driveSubmit(html, { gender: undefined });
    expect(female.rendered, 'the handler never reached showResult — a stub is missing and the try swallowed it').toBe(true);
    expect(female.build, 'buildProfile was never called').not.toBeNull();
    expect(female.save, 'saveProfile was never called').not.toBeNull();
    expect([female.build.gender, male.build.gender, absent.build.gender]).toEqual(['female', 'male', undefined]);
    expect([female.save.gender, male.save.gender, absent.save.gender]).toEqual(['female', 'male', undefined]);
    expect(female.build).toEqual({ time: '14:30', gender: 'female', city: 'Manama', cc: 'BH', tz: 'Asia/Bahrain', lat: 26.2286, lng: 50.586 });
    expect('gender' in absent.build, 'the absent case invented the key').toBe(false);
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
      const live = driveSubmit(bad, { gender: 'female' });
      expect(live.rendered, 'the mutant did not run to completion — this would pass vacuously').toBe(true);
      expect(live.build.gender, 'a bypass forwarded no gender and went undetected').toBeUndefined();
      expect(live.save.gender, 'a bypass persisted no gender and went undetected').toBeUndefined();
      expect(driveSubmit(html, { gender: 'female' }).build.gender, 'control: the real file must forward').toBe('female');
    });
  }
});
