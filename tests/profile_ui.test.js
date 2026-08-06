// 8ball / tests / profile_ui.test.js
// ui/profile.js persistence + form behavior at the local-data boundary.
//
// Vitest runs in the node environment, so this suite injects the small DOM
// and localStorage surfaces the module owns. The tests execute the real
// helpers instead of source-matching their implementation.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GENDER_NOTE,
  clearProfile,
  getGenderInput,
  initProfileUI,
  loadSavedProfile,
  optsFromPayload,
  populateRisingFields,
  resetFormDisplay,
  saveProfile,
  setGenderInput,
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
    // handed in directly so the module skips DOM creation (§6 DI shape)
    genderSelect: { value: '' },
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
    // country holds the v0.2.1 country/zone CODE, not the display name —
    // the legacy <select> stored opt.value = c.code (f3666cb:index.html:571;
    // PR #90 audit MED flipped this fixture from 'Saudi Arabia' to 'SA').
    expect(saveProfile('Profile Specimen', '1990-01-01', {
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      country: 'SA',
      tz: 'Asia/Riyadh',
      lat: 26.2361,
      lng: 50.114,
      gender: 'female',
      unexpected: 'must not persist',
    })).toBe(true);

    const payload = JSON.parse(storage.snapshot()[PROFILE_KEY]);
    expect(payload).toEqual({
      name: 'Profile Specimen',
      dob: '1990-01-01',
      time: '03:31',
      city: 'Dhahran',
      cc: 'SA',
      country: 'SA',
      tz: 'Asia/Riyadh',
      lat: 26.2361,
      lng: 50.114,
      gender: 'female',
    });
    expect(loadSavedProfile()).toEqual(payload);
  });

  it('drops invalid numeric coordinates while keeping the valid fields', () => {
    const storage = installStorage();

    saveProfile('Profile Specimen', '1990-01-01', {
      city: 'Dhahran',
      lat: Number.NaN,
      lng: 'not-a-number',
      // §5 amendment: off-vocabulary gender is dropped at the write seam,
      // never stored — same posture as the invalid coordinates above.
      gender: 'other',
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
    expect(saveProfile('Profile Specimen', '1990-01-01')).toBe(false);
    expect(clearProfile()).toBe(false);
  });

  it('reports a silent no-op profile write so a paid return stays retryable', () => {
    const storage = installStorage();
    storage.setItem = vi.fn();
    expect(saveProfile('Profile Specimen', '1990-01-01')).toBe(false);
    expect(storage.snapshot()).not.toHaveProperty(PROFILE_KEY);
  });

  it('clearProfile removes only the profile key', () => {
    const storage = installStorage({
      [PROFILE_KEY]: JSON.stringify({ name: 'Profile Specimen', dob: '1990-01-01' }),
      unrelated: 'preserve',
    });

    expect(clearProfile()).toBe(true);

    expect(storage.snapshot()).toEqual({ unrelated: 'preserve' });
    expect(storage.removeItem).toHaveBeenCalledOnce();
    expect(storage.removeItem).toHaveBeenCalledWith(PROFILE_KEY);
  });

  it('reports a silent no-op profile deletion so device erase stays retryable', () => {
    const storage = installStorage({
      [PROFILE_KEY]: JSON.stringify({ name: 'Profile Specimen', dob: '1990-01-01' }),
    });
    storage.removeItem = vi.fn();
    expect(clearProfile()).toBe(false);
    expect(storage.snapshot()).toHaveProperty(PROFILE_KEY);
  });

  it('optsFromPayload forwards only calculation inputs with valid primitive types', () => {
    expect(optsFromPayload({
      time: '03:31',
      tz: 'Asia/Riyadh',
      country: 'SA',
      lat: 26.2886,
      lng: 50.114,
      // gender is still forwarded as a stored input even though no surface
      // reads it since §1.D v0.67 deleted the kua block — the field was
      // retained on operator word, and dropping it here would silently
      // discard a value the user supplied and the archive round-trips.
      gender: 'female',
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
      gender: 'female',
    });

    expect(optsFromPayload({ lat: '26.2886', lng: null, tz: null, gender: 'x' })).toEqual({});
  });

  it('rehydrates and clears the gender control directly (the module owns it since §1.D v0.67)', () => {
    // The control used to live in ui/kua.js and was driven through a
    // setGender hook; ui/profile.js owns the node now that the kua block
    // is deleted, so the round-trip is asserted on the real select.
    const refs = makeRefs();
    initProfileUI(refs, {});
    populateRisingFields({ gender: 'female' });
    expect(getGenderInput()).toBe('female');
    resetFormDisplay();
    expect(getGenderInput()).toBeUndefined();
    expect(refs.genderSelect.value).toBe('');
  });

  it('holds the strict two-token vocabulary in both directions', () => {
    const refs = makeRefs();
    initProfileUI(refs, {});
    setGenderInput('male');
    expect(getGenderInput()).toBe('male');
    setGenderInput('anything-else');
    expect(getGenderInput()).toBeUndefined();
    expect(refs.genderSelect.value).toBe('');
    refs.genderSelect.value = 'female';
    expect(getGenderInput()).toBe('female');
  });

  // ── the branch every other test in this file skips ──────────────
  //
  // makeRefs() hands `genderSelect` in directly, so resolveGenderSelect
  // returns it on the first line and the DOM-CREATION path — the one that
  // actually runs in the browser, because index.html passes `form` +
  // `anchor` and no `genderSelect` — was exercised by nothing. The control
  // could have been deleted outright and this suite would have stayed
  // green. A pre-merge lane caught that; these two tests close it.
  it('builds the control itself when the host passes a form instead of a node', () => {
    const created = [];
    const form = {
      children: [],
      querySelector: () => null,
      appendChild(node) { this.children.push(node); return node; },
      insertBefore(node) { this.children.push(node); return node; },
    };
    // Minimal document: enough to build a field wrapper and read it back.
    globalThis.document = {
      activeElement: null,
      createElement(tag) {
        const el = {
          tag, className: '', innerHTML: '',
          querySelector(sel) {
            // The module asks the wrapper for its own select by id.
            return sel === '#gender-input' && this.innerHTML.includes('id="gender-input"')
              ? { value: '', _ownerHtml: this.innerHTML }
              : null;
          },
        };
        created.push(el);
        return el;
      },
    };

    initProfileUI({ form }, {});

    // A field wrapper was created and attached to the form.
    expect(created).toHaveLength(1);
    expect(form.children).toHaveLength(1);
    expect(created[0].className).toContain('gender-field');

    const html = created[0].innerHTML;
    // The control itself, with the strict vocabulary and empty as default.
    expect(html).toContain('<label for="gender-input">gender (optional)</label>');
    expect(html).toContain('<option value="">—</option>');
    expect(html).toContain('<option value="male">male</option>');
    expect(html).toContain('<option value="female">female</option>');
    // And it really is wired — the module resolved a usable select.
    setGenderInput('female');
    expect(getGenderInput()).toBe('female');
  });

  it('states the truth about the field at the point of entry, wired for assistive tech', () => {
    // §1.D v0.67 deleted the field's only consumer and kept the field. A
    // form that asks for a demographic and says nothing makes the person
    // guess what it is for. All three facts are asserted separately so a
    // partial rewrite cannot quietly drop one — and the third is the one
    // the deletion made necessary.
    const created = [];
    const form = {
      children: [],
      querySelector: () => null,
      appendChild(n) { this.children.push(n); return n; },
      insertBefore(n) { this.children.push(n); return n; },
    };
    globalThis.document = {
      activeElement: null,
      createElement(tag) {
        const el = { tag, className: '', innerHTML: '', querySelector: () => ({ value: '' }) };
        created.push(el);
        return el;
      },
    };
    initProfileUI({ form }, {});
    const html = created[0].innerHTML;

    expect(html).toContain(GENDER_NOTE);
    expect(GENDER_NOTE).toMatch(/optional/);              // it need not be answered
    expect(GENDER_NOTE).toMatch(/stored on this device/); // it does not leave
    expect(GENDER_NOTE).toMatch(/does not affect your reading/); // it drives nothing

    // The note is bound to the control, not merely adjacent to it, so it is
    // announced with the field rather than skipped.
    expect(html).toContain('aria-describedby="gender-note"');
    expect(html).toContain('id="gender-note"');

    // No claim beyond the current fact: the copy must not promise anything
    // about future use, and must not assert a guarantee the code does not
    // enforce (§5 — the field has no purpose on record, which §1.D v0.67
    // deliberately leaves open rather than inventing one).
    expect(GENDER_NOTE).not.toMatch(/never|always|anonym|encrypt|private|secure|guarantee/i);
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
