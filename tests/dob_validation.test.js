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

  it('dobError DOM reference is declared near other field refs', () => {
    expect(html).toMatch(/const\s+dobError\s*=\s*\$\(\s*['"]dob-error['"]\s*\)/);
  });
});
