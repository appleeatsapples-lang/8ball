// Saved Readings MVP — browser-local persistence contract + host wiring.
// The archive stores reconstruction inputs and local metadata only; loading a
// saved entry routes back through the existing profile/render pipeline.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  READINGS_KEY,
  MAX_READING_TITLE,
  addSavedReading,
  clearAllSavedReadings,
  compactReadingProfile,
  deleteSavedReading,
  loadSavedReadings,
  renameSavedReading,
} from '../ui/readings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const readingsJs = readFileSync(join(__dirname, '..', 'ui', 'readings.js'), 'utf-8');

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    snapshot: () => Object.fromEntries(values),
  };
}

const mkProfile = (label, date, extras = {}) => ({ name: label, dob: date, ...extras });

describe('Saved Readings persistence', () => {
  it('saves and loads only reconstruction inputs, newest first', () => {
    const storage = makeStorage();
    addSavedReading(mkProfile('First specimen', '1990-01-01', {
      time: '03:31', city: 'Dhahran', cc: 'SA', tz: 'Asia/Riyadh',
      lat: 26.2886, lng: 50.114, unexpected: 'drop', sunSign: 'drop',
    }), { storage, now: '2026-07-18T08:00:00.000Z' });
    addSavedReading(mkProfile('Second specimen', '1991-02-02'), {
      storage, now: '2026-07-18T09:00:00.000Z',
    });

    const loaded = loadSavedReadings(storage);
    expect(loaded.status).toBe('ok');
    expect(loaded.readings.map(reading => reading.title)).toEqual([
      'Second specimen', 'First specimen',
    ]);
    expect(loaded.readings[1].profile).toEqual({
      name: 'First specimen', dob: '1990-01-01', time: '03:31',
      city: 'Dhahran', cc: 'SA', tz: 'Asia/Riyadh', lat: 26.2886, lng: 50.114,
    });
    expect(loaded.readings[1].profile).not.toHaveProperty('sunSign');
    expect(loaded.readings[1].profile).not.toHaveProperty('unexpected');
    const persisted = JSON.parse(storage.snapshot()[READINGS_KEY]);
    expect(Object.keys(persisted[0]).sort()).toEqual(['id', 'profile', 'savedAt', 'title']);
    expect(Object.keys(persisted[1].profile).sort()).toEqual([
      'cc', 'city', 'dob', 'lat', 'lng', 'name', 'time', 'tz',
    ]);
  });

  it('deduplicates an exact input profile after reload', () => {
    const storage = makeStorage();
    const profile = mkProfile('One specimen', '1992-03-03');
    const first = addSavedReading(profile, { storage, now: '2026-07-18T08:00:00.000Z' });
    const second = addSavedReading(profile, { storage, now: '2026-07-18T09:00:00.000Z' });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.reading.id).toBe(first.reading.id);
    expect(loadSavedReadings(storage).readings).toHaveLength(1);
  });

  it('renames without changing profile inputs or saved date', () => {
    const storage = makeStorage();
    const saved = addSavedReading(mkProfile('Initial label', '1993-04-04'), {
      storage, now: '2026-07-18T08:00:00.000Z',
    }).reading;

    const renamed = renameSavedReading(saved.id, '  Field note  ', { storage });
    expect(renamed.ok).toBe(true);
    expect(renamed.reading).toEqual({ ...saved, title: 'Field note' });
    expect(loadSavedReadings(storage).readings[0].profile).toEqual(saved.profile);
  });

  it('rejects blank titles and bounds long titles', () => {
    const storage = makeStorage();
    const saved = addSavedReading(mkProfile('Initial label', '1994-05-05'), {
      storage, now: '2026-07-18T08:00:00.000Z',
    }).reading;

    expect(renameSavedReading(saved.id, '   ', { storage }).status).toBe('invalid');
    const long = renameSavedReading(saved.id, 'x'.repeat(MAX_READING_TITLE + 20), { storage });
    expect(long.reading.title).toHaveLength(MAX_READING_TITLE);
  });

  it('deletes one entry without disturbing the others', () => {
    const storage = makeStorage();
    const first = addSavedReading(mkProfile('First', '1995-06-06'), {
      storage, now: '2026-07-18T08:00:00.000Z',
    }).reading;
    const second = addSavedReading(mkProfile('Second', '1996-07-07'), {
      storage, now: '2026-07-18T09:00:00.000Z',
    }).reading;

    const deleted = deleteSavedReading(second.id, { storage });
    expect(deleted.ok).toBe(true);
    expect(loadSavedReadings(storage).readings).toEqual([first]);
  });

  it('clears the archive key and preserves unrelated local data', () => {
    const storage = makeStorage({ unrelated: 'keep' });
    addSavedReading(mkProfile('Stored', '1997-08-08'), {
      storage, now: '2026-07-18T08:00:00.000Z',
    });

    expect(clearAllSavedReadings(storage)).toMatchObject({ ok: true, readings: [] });
    expect(storage.snapshot()).toEqual({ unrelated: 'keep' });
  });

  it('reports corrupt and partially valid archives without throwing', () => {
    const corrupt = makeStorage({ [READINGS_KEY]: '{bad-json' });
    expect(loadSavedReadings(corrupt)).toEqual({ status: 'corrupt', readings: [] });
    expect(addSavedReading(mkProfile('Blocked', '1998-09-09'), { storage: corrupt }).status).toBe('corrupt');

    const valid = addSavedReading(mkProfile('Valid', '1999-10-10'), {
      storage: makeStorage(), now: '2026-07-18T08:00:00.000Z',
    }).reading;
    const partial = makeStorage({ [READINGS_KEY]: JSON.stringify([valid, { nope: true }]) });
    expect(loadSavedReadings(partial)).toEqual({ status: 'partial', readings: [valid] });
    expect(addSavedReading(mkProfile('Do not overwrite', '2000-11-11'), { storage: partial }).status).toBe('partial');
    expect(renameSavedReading(valid.id, 'Do not overwrite', { storage: partial }).status).toBe('partial');
    expect(deleteSavedReading(valid.id, { storage: partial }).status).toBe('partial');
    expect(JSON.parse(partial.snapshot()[READINGS_KEY])).toHaveLength(2);
    expect(clearAllSavedReadings(corrupt).ok).toBe(true);
    expect(loadSavedReadings(corrupt)).toEqual({ status: 'ok', readings: [] });
  });

  it('degrades safely when storage is unavailable', () => {
    const denied = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    };
    expect(loadSavedReadings(denied)).toEqual({ status: 'unavailable', readings: [] });
    expect(addSavedReading(mkProfile('Denied', '2000-11-11'), { storage: denied }).status).toBe('unavailable');
    expect(clearAllSavedReadings(denied).status).toBe('unavailable');

    const quotaBlocked = {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('quota'); },
    };
    expect(addSavedReading(mkProfile('Full', '2001-12-12'), { storage: quotaBlocked }).status).toBe('unavailable');
    expect(clearAllSavedReadings(quotaBlocked).status).toBe('unavailable');
  });

  it('validates the minimum profile shape before persistence', () => {
    expect(compactReadingProfile(null)).toBeNull();
    expect(compactReadingProfile({ name: '', dob: '2001-12-12' })).toBeNull();
    expect(compactReadingProfile({ name: 'No date', dob: 'not-a-date' })).toBeNull();
  });
});

describe('Saved Readings host and privacy wiring', () => {
  it('boots the controller and exposes save plus previous-readings actions', () => {
    expect(html).toMatch(/import\s*\{[^}]*initReadingsUI[^}]*\}\s*from\s*['"]\.\/ui\/readings\.js['"]/);
    expect(html).toMatch(/id="save-reading-btn"/);
    expect(html).toMatch(/id="readings-btn"[^>]*>previous readings</);
    expect(html).toMatch(/initReadingsUI\s*\(/);
    expect(html).toMatch(/previous readings lets you reopen, rename, delete, or clear that browser-only archive/);
    expect(html).toMatch(/current profile and every saved reading from local storage/);
    expect(readingsJs).toMatch(/saved in this browser only\. no account, sync, or remote copy/);
    expect(readingsJs).toMatch(/select exactly two saved readings/);
    expect(readingsJs).toMatch(/compare selected/);
  });

  it('revisits through profileFromPayload and showResult without a core import in the controller', () => {
    expect(html).toMatch(/openReading:\s*reading\s*=>[\s\S]*profileFromPayload\(payload\)[\s\S]*showResult/);
    expect(readingsJs).not.toMatch(/from\s*['"]\.\.\/core\//);
    expect(readingsJs).not.toMatch(/fetch\s*\(|XMLHttpRequest|sendBeacon/);
  });

  it('re-anchors the t3 written-entry position on archive open exactly like a submit', () => {
    // SR-M2 pin: prev is captured BEFORE saveProfile overwrites the stored
    // profile, and the t3 facet index re-anchors via the same
    // isNewPair-driven reset the form-submit path uses, before showResult.
    // A different saved pair must not inherit the prior pair's rotation.
    expect(html).toMatch(
      /openReading:\s*reading\s*=>[\s\S]*const prev = loadSavedProfile\(\);[\s\S]*saveProfile\(payload\.name, payload\.dob, payload\)[\s\S]*if \(tier === 't3'\) ensureFacetIndex\(profile\.lifePath, \{ reset: isNewPair\(payload, prev\) \}\);[\s\S]*showResult/
    );
  });

  it('archive open is a pure rehydrate — no payment state machine, counters read-only', () => {
    // P3-3 (post-spree audit): greps alone can be loosened; this extracts the
    // openReading body and forbids every debit/write path. showResult must
    // receive getCredits()/getTriesUsed() as display passthrough only.
    const match = html.match(/openReading:\s*reading\s*=>\s*\{([\s\S]*?)\n\s*\},/);
    expect(match, 'openReading hook body not found in index.html').toBeTruthy();
    const body = match[1];
    for (const banned of [
      'nextShakeState', 'consumeFacetShake', 'applyPaidReturn',
      'setCredits', 'setTriesUsed', 'openPaywall', 'setPendingProfile',
      'clearPendingProfile',
    ]) {
      expect(body, `openReading must not call ${banned}`).not.toMatch(new RegExp(banned));
    }
    expect(body).toMatch(/credits:\s*getCredits\(\)/);
    expect(body).toMatch(/triesUsed:\s*getTriesUsed\(\)/);
    // Facet re-anchor is allowed (SR-M2) but is not a credit/try debit.
    expect(body).toMatch(/ensureFacetIndex/);
  });

  it('archive storage ops never mutate tries/credits/tier/facet payment keys', () => {
    // Behavioral twin to the host-body pin: exercise the readings module
    // against a shared storage that already holds paid state; after
    // save/load/rename/delete/clear the payment keys must be byte-identical.
    const paymentSnap = {
      eight_ball_tries_used_v1: '2',
      eight_ball_credits_v1: '3',
      eight_ball_tier_v1: 't3',
      eight_ball_facet_index_v1: '1',
    };
    const storage = makeStorage({ ...paymentSnap });
    const first = addSavedReading(mkProfile('Archive A', '1990-01-01'), {
      storage, now: '2026-07-18T10:00:00.000Z',
    });
    expect(first.status).toBe('ok');
    addSavedReading(mkProfile('Archive B', '1991-02-02'), {
      storage, now: '2026-07-18T11:00:00.000Z',
    });
    const loaded = loadSavedReadings(storage);
    expect(loaded.status).toBe('ok');
    expect(loaded.readings.length).toBe(2);
    renameSavedReading(loaded.readings[0].id, 'Renamed B', { storage });
    deleteSavedReading(loaded.readings[1].id, { storage });
    clearAllSavedReadings(storage);
    for (const [key, value] of Object.entries(paymentSnap)) {
      expect(storage.getItem(key), key).toBe(value);
    }
    // Readings key gone; payment keys still exactly as seeded.
    expect(storage.getItem(READINGS_KEY)).toBeNull();
  });

  it('injects an accessible confirmation dialog and responsive list styles', () => {
    expect(readingsJs).toMatch(/role="dialog" aria-modal="true"/);
    expect(readingsJs).toMatch(/trapTab\(confirmModal\)/);
    expect(readingsJs).toMatch(/activeId = null;\s*updateSaveButton\(\);\s*setSaveStatus\(''\)/);
    expect(readingsJs).toMatch(/@media \(min-width: 720px\)/);
    expect(readingsJs).toMatch(/min-height: 44px/);
    expect(readingsJs).toMatch(/\.saved-readings-screen button, #readings-confirm-modal \.btn/);
    expect(readingsJs).toMatch(/\.saved-readings-screen \[hidden\][^}]*display: none/);
  });
});
