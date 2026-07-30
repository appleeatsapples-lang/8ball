// 8ball / tests / dob_validation.test.js
//
// v0.3.0 fix B: future-DOB validation. The form's DOB input is
// clamped via HTML5 max= at boot (soft fence) and the submit handler
// enforces the real gate by comparing the ISO date string against
// today; on violation, an inline `field-error` surfaces and the input
// event handler hides it on next edit.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateBirthInput, todayIsoLocal } from '../ui/profile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('DOB validation markup (v0.3.0 fix B)', () => {
  it('dob-error element exists with id, class, and hidden attribute', () => {
    expect(html).toMatch(/<p\s+class="field-error"\s+id="dob-error"\s+hidden>/);
  });

  it('dob-error copy names the failure mode ("future")', () => {
    const m = html.match(/<p[^>]*id="dob-error"[^>]*>([\s\S]*?)<\/p>/);
    expect(m, 'dob-error subtree not found').not.toBeNull();
    expect(m[1]).toMatch(/future/i);
  });

  it('dob-error lives inside the DOB field block (adjacent to dob-input)', () => {
    // The error <p> must follow the DOB <input> inside the same .field
    // wrapper so it renders directly below the input without layout
    // surprises.
    const m = html.match(
      /<div class="field">\s*<label for="dob-input">[\s\S]*?<input id="dob-input"[\s\S]*?<p[^>]*id="dob-error"[\s\S]*?<\/div>/
    );
    expect(m, 'dob-error not adjacent to dob-input in the same .field').not.toBeNull();
  });

  it('field-error CSS class is defined alongside hint classes', () => {
    expect(html).toMatch(/\.field-error\s*\{/);
    expect(html).toMatch(/\.field-error\[hidden\]/);
  });
});

describe('DOB validation JS wiring (v0.3.0 fix B)', () => {
  it('dobInput.max set at boot to today via local-date helper', () => {
    expect(html).toMatch(/dobInput\.max\s*=\s*todayIsoLocal\(\s*\)/);
  });

  it('input event handler hides dob-error on edit', () => {
    expect(html).toMatch(
      /dobInput\.addEventListener\(\s*['"]input['"]\s*,\s*\(\s*\)\s*=>\s*\{\s*dobError\.hidden\s*=\s*true/
    );
  });

  // §1.J remediation (PR #187 F3): the future-date rule and the local-today
  // helper moved OUT of index.html into ui/profile.js, so the primary form and
  // the dyad's second-person form run ONE validator instead of two that drift.
  // These three pins moved with the logic and are behavioural now — a regex
  // over index.html could match while the rule behind it was wrong, and these
  // cannot.

  it('the submit path rejects a future DOB (ISO lexicographic, shared rule)', () => {
    const today = '2026-07-30';
    expect(validateBirthInput({ name: 'a', dob: '2026-07-31' }, today))
      .toEqual({ ok: false, field: 'dob', reason: 'future' });
    expect(validateBirthInput({ name: 'a', dob: '2027-01-01' }, today).reason).toBe('future');
    expect(validateBirthInput({ name: 'a', dob: '9999-12-31' }, today).reason).toBe('future');
    // Same day is valid — the boundary the UTC bug used to break.
    expect(validateBirthInput({ name: 'a', dob: today }, today).ok).toBe(true);
  });

  it('index.html routes its submit through the shared validator', () => {
    expect(html).toMatch(/validateBirthInput\(\s*\{\s*name:\s*nameInput\.value/);
    expect(html).toMatch(/dobInput\.max\s*=\s*todayIsoLocal\(\)/);
    // The retired inline forms must not return alongside it.
    expect(html).not.toMatch(/const\s+todayIso\s*=/);
    expect(html).not.toMatch(/function\s+todayIsoLocal/);
  });

  it('todayIsoLocal uses LOCAL date math, not UTC (step-12 codex hook 4 P2)', () => {
    // toISOString() returns the UTC calendar date; east of UTC, between local
    // midnight and UTC midnight, local today is one day ahead. Pinned by
    // behaviour against a fixed instant rather than by reading the source.
    const src = readFileSync(join(__dirname, '..', 'ui', 'profile.js'), 'utf-8');
    expect(src).toMatch(/getFullYear\(\)[\s\S]*?getMonth\(\)[\s\S]*?getDate\(\)/);
    expect(html).not.toMatch(/dobInput\.max\s*=\s*new Date\(\)\.toISOString/);

    // 2026-07-31T01:30 in a UTC+3 zone is still 2026-07-30 in UTC. The local
    // helper must say the 31st; toISOString would say the 30th and reject a
    // birth date of the 31st as "future".
    const local = new Date(2026, 6, 31, 1, 30, 0);
    expect(todayIsoLocal(local)).toBe('2026-07-31');
    expect(validateBirthInput({ name: 'a', dob: '2026-07-31' }, todayIsoLocal(local)).ok).toBe(true);
  });

  it('the shared rule also gates the name and the 1900 floor', () => {
    const today = '2026-07-30';
    expect(validateBirthInput({ name: '   ', dob: '1990-01-01' }, today))
      .toEqual({ ok: false, field: 'name', reason: 'name' });
    expect(validateBirthInput({ name: 'a', dob: '1899-12-31' }, today).reason).toBe('year');
    expect(validateBirthInput({ name: 'a', dob: '1900-01-01' }, today).ok).toBe(true);
    expect(validateBirthInput({ name: ' bramble ', dob: '1988-06-15' }, today))
      .toEqual({ ok: true, name: 'bramble', dob: '1988-06-15' });
  });

  it('submit handler surfaces dobError on future-DOB rejection', () => {
    // The error is shown inside the future-DOB branch — assert the
    // `dobError.hidden = false` write exists in the file.
    expect(html).toMatch(/dobError\.hidden\s*=\s*entry\.field\s*!==\s*'dob'/);
  });

  it('dobError DOM reference is declared near other field refs', () => {
    expect(html).toMatch(/const\s+dobError\s*=\s*\$\(\s*['"]dob-error['"]\s*\)/);
  });

  it('boot rehydration guards buildProfile so a corrupt stored DOB never crashes boot OR leaks its city', () => {
    // A hand-edited / impossible-date stored profile makes buildProfile throw
    // (the calc core rejects impossible dates). The boot rehydration must catch
    // it and reset BOTH storage and form state: populateRisingFields runs before
    // buildProfile throws and sets the module-level selectedCity from the bad
    // payload's birthplace, so the catch must clearProfile() AND resetFormDisplay()
    // (which nulls selectedCity) — otherwise the next submission silently inherits
    // the discarded city's tz/lat/lng (a wrong rising sign). Then fall through to
    // onboarding — never crash, never leak.
    expect(html).toMatch(
      /try\s*\{[\s\S]*?profileFromPayload\(existing\)[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?clearProfile\(\)[\s\S]*?resetFormDisplay\(\)/
    );
  });
});
