// 8ball / tests / feedback_surface.test.js
// §5.B form-shape invariants (DOCTRINE.md §5.B).
// Verifies the feedback form exists, has only the allowed fields, and
// does NOT include any localStorage profile data fields.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

// Banned field names — these are the localStorage profile keys per §5.
// If any of them appears as a form input name, the feedback surface
// has leaked profile data into the submission. §5.B violation.
const BANNED_FIELD_NAMES = ['name', 'dob', 'time', 'country', 'lat', 'lng'];

// Allowed field names in the feedback form. Anything else is unverified.
const ALLOWED_FIELD_NAMES = new Set(['form-name', 'bot-field', 'message', 'contact']);

function feedbackForm() {
  const startIdx = HTML.search(/<form[^>]+name="feedback"/);
  expect(startIdx).toBeGreaterThan(-1);
  const openEndIdx = HTML.indexOf('>', startIdx);
  expect(openEndIdx).toBeGreaterThan(startIdx);
  const endIdx = HTML.indexOf('</form>', openEndIdx);
  expect(endIdx).toBeGreaterThan(openEndIdx);
  return {
    tag: HTML.slice(startIdx, openEndIdx + 1),
    body: HTML.slice(openEndIdx + 1, endIdx)
  };
}

describe('feedback surface (DOCTRINE.md §5.B)', () => {
  it('feedback form is present as native same-origin Netlify POST', () => {
    const { tag } = feedbackForm();
    expect(tag).toMatch(/name="feedback"/);
    expect(tag).toMatch(/data-netlify="true"/);
    expect(tag).toMatch(/method="POST"/i);
    // action="/?sent=1" replaces Netlify's branded thanks page with a 303
    // redirect to the homepage; ?sent=1 is the existing banner-JS signal
    // (see index.html, "feedback sent-state"). Same-origin invariant
    // preserved (§5.B "single named endpoint").
    expect(tag).toMatch(/\saction="\/\?sent=1"/);
  });

  it('sent-banner detection is an exact URLSearchParams check, not a substring test', () => {
    // Regression pin for the 07-17 audit L10 fix: `location.search.includes('sent=1')`
    // also matched crafted queries like `?notsent=1`, showing the thanks banner
    // without a submission. The exact-param form must not regress.
    expect(HTML).toMatch(/new URLSearchParams\(window\.location\.search\)\.get\('sent'\) === '1'/);
    expect(HTML).not.toMatch(/location\.search\.includes\(/);
  });

  it('feedback form does not include profile-data field names', () => {
    const { body } = feedbackForm();
    const offenders = [];
    for (const banned of BANNED_FIELD_NAMES) {
      // Match name="<banned>" exactly to avoid false positives like name="form-name".
      const re = new RegExp(`name="${banned}"`, 'g');
      if (re.test(body)) offenders.push(banned);
    }
    expect(offenders, `Feedback form leaks profile-data field(s): ${offenders.join(', ')}`).toEqual([]);
  });

  it('feedback form fields are all allow-listed', () => {
    const { body } = feedbackForm();
    const fieldNameRe = /name="([^"]+)"/g;
    const offenders = [];
    let m;
    while ((m = fieldNameRe.exec(body)) !== null) {
      const fname = m[1];
      if (!ALLOWED_FIELD_NAMES.has(fname)) offenders.push(fname);
    }
    expect(offenders, `Unallowed field(s) in feedback form: ${offenders.join(', ')}`).toEqual([]);
  });

  it('feedback form exposes only message plus optional contact as user-authored fields', () => {
    const { body } = feedbackForm();
    expect(body).toMatch(/<textarea[^>]+name="message"[^>]+required/);
    expect(body).toMatch(/<input[^>]+type="text"[^>]+name="contact"/);
  });

  it('feedback form has honeypot for bot detection', () => {
    const { tag, body } = feedbackForm();
    expect(tag).toMatch(/netlify-honeypot="bot-field"/);
    expect(body).toMatch(/name="bot-field"/);
  });

  it('about-modal discloses the feedback surface', () => {
    // The about-modal copy must mention "feedback" so users know the surface exists.
    const aboutMatch = HTML.match(/<div[^>]*id="about-modal"[\s\S]+?<\/div>\s*<\/div>/);
    expect(aboutMatch).not.toBeNull();
    expect(aboutMatch[0]).toMatch(/feedback/i);
    expect(aboutMatch[0]).toMatch(/only when you press send/i);
  });
});
