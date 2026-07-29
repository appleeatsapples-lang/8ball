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

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
// The boot sequence moved to ui/boot.js in the §6 split; the rehydration
// guard below reads it there. tests/boot.test.js carries the behavioral
// half — this stays as the shape pin it always was.
const bootJs = readFileSync(join(__dirname, '..', 'ui', 'boot.js'), 'utf-8');
const calendarJs = readFileSync(join(__dirname, '..', 'core', 'calendar.js'), 'utf-8');

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

  it('dobInput.min fences the other end at the calc core floor', () => {
    expect(html).toMatch(/dobInput\.min\s*=\s*'1900-01-01'/);
  });

  it("the min literal tracks core/calendar.js's RANGE_MIN", () => {
    // index.html cannot import the constant — RANGE_MIN is module-private
    // in core/calendar.js — so the two are pinned in sync here instead.
    // Raise the calc floor without moving the fence and this fails.
    const rangeMin = calendarJs.match(/const RANGE_MIN\s*=\s*(\d{4})/)?.[1];
    expect(rangeMin, 'RANGE_MIN not found in core/calendar.js').toBeTruthy();
    const min = html.match(/dobInput\.min\s*=\s*'(\d{4})-\d{2}-\d{2}'/)?.[1];
    expect(min).toBe(rangeMin);
  });

  it('input event handler hides dob-error on edit', () => {
    expect(html).toMatch(
      /dobInput\.addEventListener\(\s*['"]input['"]\s*,\s*\(\s*\)\s*=>\s*\{\s*dobError\.hidden\s*=\s*true/
    );
  });

  it('submit handler compares dob against today (ISO lexicographic)', () => {
    // The check shape: `if (dob > todayIso) { dobError.hidden = false; return; }`
    expect(html).toMatch(/const\s+todayIso\s*=\s*todayIsoLocal\(\s*\)/);
    expect(html).toMatch(/if\s*\(\s*dob\s*>\s*todayIso\s*\)/);
  });

  it('todayIsoLocal helper uses local-date math, not UTC (step-12 codex hook 4 P2)', () => {
    // toISOString() returns UTC calendar date; in positive-UTC tzs
    // (KSA UTC+3) the user's local today is one day ahead of UTC
    // between local-midnight and UTC-midnight. The helper composes
    // the ISO string from local-tz accessors (getFullYear, getMonth,
    // getDate), avoiding the off-by-one.
    expect(html).toMatch(
      /function\s+todayIsoLocal\s*\(\s*\)\s*\{[\s\S]*?getFullYear\(\s*\)[\s\S]*?getMonth\(\s*\)[\s\S]*?getDate\(\s*\)[\s\S]*?\}/
    );
    // Both DOB-validation call sites must use the helper, not the
    // retired UTC pattern.
    expect(html).not.toMatch(/dobInput\.max\s*=\s*new Date\(\)\.toISOString/);
    expect(html).not.toMatch(/const\s+todayIso\s*=\s*new Date\(\)\.toISOString/);
  });

  it('submit handler surfaces dobError on future-DOB rejection', () => {
    // The error is shown inside the future-DOB branch — assert the
    // `dobError.hidden = false` write exists in the file.
    expect(html).toMatch(/dobError\.hidden\s*=\s*false/);
  });

  // DOB rejection has two layers, and it is worth being precise about which
  // one users actually hit, because it is not the one this file mostly pins.
  //
  //   1. Native. #profile-form carries no `novalidate` and #dob-input is
  //      `required type="date"`, so min=/max= make an out-of-range value
  //      fail rangeUnderflow/rangeOverflow. The browser then blocks the
  //      submit event outright and shows its own bubble. Verified in
  //      Chromium: 1889-05-05 reports "Value must be 01/01/1900 or later."
  //      and the submit listener never fires. This is the layer that fixed
  //      the dead-end — before min= existed, validationMessage was empty,
  //      no error appeared, and the click did nothing at all.
  //
  //   2. JS. The branches below run only when native validation does not
  //      intercept — a programmatic submit, or a browser that degrades
  //      type="date" to a text box. Verified reachable and correct in
  //      Chromium by dispatching submit directly: the inline field-error
  //      shows "must be 1900 or later." and the result stays hidden.
  //
  // The pre-existing future-DOB branch has exactly the same status, which
  // is why this one is written to match it rather than replace it.
  it('the below-1900 branch surfaces an error instead of returning bare', () => {
    // The regression this closes: the branch used to be
    //   dobError.hidden = true;
    //   const [y] = dob.split('-').map(Number);
    //   if (isNaN(y) || y < 1900) return;
    // — a silent swallow one line after hiding the error, so the form
    // looked like it had accepted the submit and then did nothing.
    const m = html.match(
      /if\s*\(\s*isNaN\(y\)\s*\|\|\s*y\s*<\s*1900\s*\)\s*\{([\s\S]*?)\}/
    );
    expect(m, 'below-1900 branch not found').not.toBeNull();
    expect(m[1]).toMatch(/dobError\.hidden\s*=\s*false/);
    expect(m[1]).toMatch(/dobError\.textContent\s*=/);
    // and it must not be the bare `return` it was
    expect(html).not.toMatch(/if\s*\(\s*isNaN\(y\)\s*\|\|\s*y\s*<\s*1900\s*\)\s*return\s*;/);
  });

  it('both rejection branches set their own message before showing it', () => {
    // One element, two failure modes — so neither branch may inherit the
    // other's text. The markup default covers the first paint only.
    const future = html.match(/if\s*\(\s*dob\s*>\s*todayIso\s*\)\s*\{([\s\S]*?)\}/);
    expect(future, 'future-DOB branch not found').not.toBeNull();
    expect(future[1]).toMatch(/dobError\.textContent\s*=\s*["'].*future.*["']/i);

    const early = html.match(/if\s*\(\s*isNaN\(y\)\s*\|\|\s*y\s*<\s*1900\s*\)\s*\{([\s\S]*?)\}/);
    expect(early[1]).toMatch(/dobError\.textContent\s*=\s*'must be 1900 or later\.'/);
  });

  it('a valid DOB still clears a previously shown error', () => {
    // `dobError.hidden = true` moved below the second guard so the new
    // branch can surface its own message; it must still run on the path
    // that falls through both.
    const handler = html.match(
      /const todayIso = todayIsoLocal\(\);([\s\S]*?)const time = timeInput\.value/
    );
    expect(handler, 'submit validation block not found').not.toBeNull();
    const afterGuards = handler[1].slice(handler[1].lastIndexOf('}'));
    expect(afterGuards).toMatch(/dobError\.hidden\s*=\s*true/);
  });

  it('the new copy stays in the §2 clinical register', () => {
    // Same shape as the existing "can't be a future date." — lowercase,
    // terse, states the constraint and nothing else.
    expect(html).toMatch(/'must be 1900 or later\.'/);
    expect(html).not.toMatch(/must be 1900 or later[^.']*!/);
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
    expect(bootJs).toMatch(
      /try\s*\{[\s\S]*?profileFromPayload\(existing\)[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?clearProfile\(\)[\s\S]*?resetFormDisplay\(\)/
    );
  });
});
