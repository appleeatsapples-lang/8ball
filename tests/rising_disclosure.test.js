// 8ball / tests / rising_disclosure.test.js
//
// v0.5.1 — rising-sign inputs (birth time + birthplace) must be DISCOVERABLE
// on the entry form. Real users were sending back sun-only cards because the
// inputs sat in a COLLAPSED <details> whose summary read as a skippable
// add-on. v0.5.1 ships the #rising-fields disclosure OPEN by default and
// reframes the <summary> to a benefit cue that stays honest about optionality.
//
// These assertions LOCK that decision so a future edit can't silently
// re-collapse it through EITHER path:
//   - markup     → the <details open> in index.html
//   - reset path → resetFormDisplay() in ui/profile.js (try-another / forget
//                  return to the entry form, so they must keep it open)
//
// Source-string invariants, matching the house pattern in
// labels_reveal.test.js / payments_markup.test.js (no jsdom in this repo).
// Presentation-only: name + dob stay the only required fields (no `required`
// is added to time/city here), so BEGIN is never gated on rising inputs.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const profileJs = readFileSync(join(__dirname, '..', 'ui', 'profile.js'), 'utf-8');

describe('rising-fields disclosure (v0.5.1)', () => {
  // Single source-of-truth match for the disclosure opening tag, so the
  // open-attribute assertions below all pin the SAME element.
  const risingTag = html.match(/<details[^>]*id="rising-fields"[^>]*>/);

  it('#rising-fields disclosure element is present', () => {
    expect(risingTag, '#rising-fields <details> not found').not.toBeNull();
  });

  it('stays a <details> (collapsible escape hatch preserved, not a plain div)', () => {
    expect(risingTag[0]).toMatch(/^<details/);
  });

  it('ships OPEN by default so birth time + birthplace are visible on first load', () => {
    expect(risingTag[0]).toMatch(/\bopen\b/);
  });

  // The <summary> reframe: leads with the concrete inputs + states the
  // benefit, and stays honest about optionality. Anchored to the
  // rising-fields tag so it cannot accidentally match the feedback <summary>.
  const summary = html.match(/id="rising-fields"[^>]*>\s*<summary>([^<]*)<\/summary>/);

  it('summary names birth time, frames the rising-sign benefit, keeps "(optional)"', () => {
    expect(summary, 'rising-fields <summary> not found').not.toBeNull();
    const text = summary[1];
    expect(text, 'summary should name the birth-time input').toMatch(/birth time/i);
    expect(text, 'summary should frame the rising-sign benefit').toMatch(/rising sign/i);
    expect(text, 'summary must stay honest about optionality').toMatch(/\(optional\)/i);
  });

  it('summary no longer reads as the bare skippable add-on', () => {
    expect(summary[1].trim()).not.toBe('add rising sign (optional)');
  });

  // Reset-path lock: resetFormDisplay() returns the user to the entry form
  // (try-another / forget), so it must KEEP the disclosure open. Without this,
  // the first reset would strip the default-open state for the rest of the
  // session — silently undoing the markup change.
  it('resetFormDisplay keeps #rising-fields open (does not re-collapse on reset)', () => {
    const m = profileJs.match(
      /export function resetFormDisplay\([^)]*\)\s*\{([\s\S]*?)\n\}/
    );
    expect(m, 'resetFormDisplay body not found').not.toBeNull();
    expect(m[1]).toMatch(/risingFields\.setAttribute\(\s*['"]open['"]/);
    expect(m[1]).not.toMatch(/risingFields\.removeAttribute\(\s*['"]open['"]/);
  });

  it('no code path in ui/profile.js collapses the rising disclosure', () => {
    expect(profileJs).not.toMatch(/removeAttribute\(\s*['"]open['"]/);
  });
});
