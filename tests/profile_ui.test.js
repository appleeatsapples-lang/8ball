// 8ball / tests / profile_ui.test.js
// ui/profile.js persistence + form behavior at the local-data boundary.
//
// Vitest runs in the node environment, so this suite injects the small DOM
// and localStorage surfaces the module owns. The tests execute the real
// helpers instead of source-matching their implementation.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearProfile,
  initProfileUI,
  loadSavedProfile,
  optsFromPayload,
  populateRisingFields,
  resetFormDisplay,
  saveProfile,
} from '../ui/profile.js';
import { makeEl } from './helpers/dom.js';

const PROFILE_KEY = 'eight_ball_profile_v1';
const originalDocument = globalThis.document;
const originalLocalStorage = globalThis.localStorage;

function installStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn(key => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => { store.set(key, String(value)); }),
    removeItem: vi.fn(key => { store.delete(key); }),
    snapshot: () => Object.fromEntries(store),
  };
  globalThis.localStorage = storage;
  return storage;
}

function makeRefs() {
  const refs = {
    result: makeEl('result'),
    onboarding: makeEl('onboarding'),
    nameInput: makeEl('nameInput'),
    dobInput: makeEl('dobInput'),
    timeInput: makeEl('timeInput'),
    cityInput: makeEl('cityInput'),
    citySuggestions: makeEl('citySuggestions'),
    polarMessage: makeEl('polarMessage'),
    legacyHint: makeEl('legacyHint'),
    risingFields: makeEl('risingFields'),
  };
  refs.onboarding.classList.add('hidden');
  for (const key of ['nameInput', 'dobInput', 'timeInput', 'cityInput']) {
    refs[key].value = 'stale';
  }
  refs.citySuggestions.innerHTML = 'stale';
  refs.polarMessage.hidden = false;
  refs.legacyHint.hidden = false;
  return refs;
}

beforeEach(() => {
  globalThis.document = { activeElement: null };
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

describe('ui/profile.js persistence boundary', () => {
  it('round-trips the allow-listed profile fields and drops unknown fields', () => {
    const storage = installStorage();

    // Every persisted field carries a VALID value here — lat gates saved-city
    // rehydration and country carries the legacy payload shape, so both must
    // survive the round-trip (PR #89 audit MED: lat was only tested as NaN,
    // which let a valid-lat/country persistence regression stay green).
    saveProfile('Profile Specimen', '1990-01-01', {
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      country: 'Saudi Arabia',
      tz: 'Asia/Riyadh',
      lat: 26.2361,
      lng: 50.114,
      unexpected: 'must not persist',
    });

    const payload = JSON.parse(storage.snapshot()[PROFILE_KEY]);
    expect(payload).toEqual({
      name: 'Profile Specimen',
      dob: '1990-01-01',
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      country: 'Saudi Arabia',
      tz: 'Asia/Riyadh',
      lat: 26.2361,
      lng: 50.114,
    });
    expect(loadSavedProfile()).toEqual(payload);
  });

  it('drops invalid numeric coordinates while keeping the valid fields', () => {
    const storage = installStorage();

    saveProfile('Profile Specimen', '1990-01-01', {
      city: 'Dhahran',
      lat: Number.NaN,
      lng: 'not-a-number',
    });

    const payload = JSON.parse(storage.snapshot()[PROFILE_KEY]);
    expect(payload).toEqual({
      name: 'Profile Specimen',
      dob: '1990-01-01',
      city: 'Dhahran',
    });
  });

  it.each([
    ['an empty store', null],
    ['malformed JSON', '{not-json'],
    ['a payload without a name', JSON.stringify({ dob: '1990-01-01' })],
    ['a payload without a DOB', JSON.stringify({ name: 'Profile Specimen' })],
  ])('rejects %s', (_label, raw) => {
    installStorage(raw === null ? {} : { [PROFILE_KEY]: raw });
    expect(loadSavedProfile()).toBeNull();
  });

  it('degrades safely when storage reads and writes are denied', () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    };

    expect(loadSavedProfile()).toBeNull();
    expect(() => saveProfile('Profile Specimen', '1990-01-01')).not.toThrow();
    expect(() => clearProfile()).not.toThrow();
  });

  it('clearProfile removes only the profile key', () => {
    const storage = installStorage({
      [PROFILE_KEY]: JSON.stringify({ name: 'Profile Specimen', dob: '1990-01-01' }),
      unrelated: 'preserve',
    });

    clearProfile();

    expect(storage.snapshot()).toEqual({ unrelated: 'preserve' });
    expect(storage.removeItem).toHaveBeenCalledOnce();
    expect(storage.removeItem).toHaveBeenCalledWith(PROFILE_KEY);
  });

  it('optsFromPayload forwards only calculation inputs with valid primitive types', () => {
    expect(optsFromPayload({
      time: '03:31',
      tz: 'Asia/Riyadh',
      country: 'SA',
      lat: 26.2886,
      lng: 50.114,
      city: 'Dhahran',
      cc: 'SA',
      name: 'Profile Specimen',
      dob: '1990-01-01',
    })).toEqual({
      time: '03:31',
      tz: 'Asia/Riyadh',
      country: 'SA',
      lat: 26.2886,
      lng: 50.114,
    });

    expect(optsFromPayload({ lat: '26.2886', lng: null, tz: null })).toEqual({});
  });
});

describe('ui/profile.js form behavior', () => {
  it('rehydrates a saved city through the canonical label and selected-city hook', () => {
    const refs = makeRefs();
    const selected = [];
    initProfileUI(refs, { setSelectedCity: city => selected.push(city) });

    populateRisingFields({
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      tz: 'Asia/Riyadh',
      lat: 26.2886,
      lng: 50.114,
    });

    expect(refs.timeInput.value).toBe('03:31');
    expect(refs.cityInput.value).toBe('Dhahran, Saudi Arabia');
    expect(refs.legacyHint.hidden).toBe(true);
    expect(refs.polarMessage.hidden).toBe(true);
    expect(refs.risingFields.attrs.open).toBe('');
    expect(selected).toEqual([
      null,
      {
        name: 'Dhahran',
        country: 'Saudi Arabia',
        countryCode: 'SA',
        lat: 26.2886,
        lng: 50.114,
        tz: 'Asia/Riyadh',
        pop: 0,
      },
    ]);
  });

  it('surfaces polar and legacy saved-profile states without stale city data', () => {
    const polarRefs = makeRefs();
    initProfileUI(polarRefs, {});
    populateRisingFields({
      city: 'Longyearbyen', cc: 'NO', tz: 'Arctic/Longyearbyen',
      lat: 78.22, lng: 15.64,
    });
    expect(polarRefs.cityInput.value).toBe('Longyearbyen, Norway');
    expect(polarRefs.polarMessage.hidden).toBe(false);

    const legacyRefs = makeRefs();
    const selected = [];
    initProfileUI(legacyRefs, { setSelectedCity: city => selected.push(city) });
    populateRisingFields({ time: '14:00', country: 'DE', lat: 52.5244, lng: 13.4105 });
    expect(legacyRefs.cityInput.value).toBe('');
    expect(legacyRefs.legacyHint.hidden).toBe(false);
    expect(legacyRefs.polarMessage.hidden).toBe(true);
    expect(legacyRefs.risingFields.attrs.open).toBe('');
    expect(selected).toEqual([null]);
  });

  it('reset clears only form state, resets host state, keeps rising open, and focuses name', () => {
    const storage = installStorage({
      [PROFILE_KEY]: JSON.stringify({ name: 'Profile Specimen', dob: '1990-01-01' }),
    });
    const refs = makeRefs();
    const selected = [];
    const currentProfiles = [];
    initProfileUI(refs, {
      setSelectedCity: city => selected.push(city),
      setCurrentProfile: profile => currentProfiles.push(profile),
    });

    resetFormDisplay();

    expect(refs.result.classList.contains('hidden')).toBe(true);
    expect(refs.onboarding.classList.contains('hidden')).toBe(false);
    expect(refs.onboarding.classList.contains('reveal')).toBe(true);
    expect(refs.nameInput.value).toBe('');
    expect(refs.dobInput.value).toBe('');
    expect(refs.timeInput.value).toBe('');
    expect(refs.cityInput.value).toBe('');
    expect(refs.citySuggestions.innerHTML).toBe('');
    expect(refs.polarMessage.hidden).toBe(true);
    expect(refs.legacyHint.hidden).toBe(true);
    expect(refs.risingFields.attrs.open).toBe('');
    expect(selected).toEqual([null]);
    expect(currentProfiles).toEqual([null]);
    expect(globalThis.document.activeElement).toBe(refs.nameInput);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
