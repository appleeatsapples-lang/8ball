// 8ball / tests / share_surface.test.js
//
// v0.4.0 share-surface markup + privacy invariants (DOCTRINE §5.D v0.31
// / §6 / share brief §3). Mirrors the static-scan shape of
// tests/payments_markup.test.js: read index.html + ui/share.js as text
// and assert the surface shape and the §5.D invariants that a static
// scan can prove (no network surface, no paid-content read, no PII).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');
const shareJs = readFileSync(
  join(__dirname, '..', 'ui', 'share.js'),
  'utf-8'
);

describe('share-surface markup (DOCTRINE §5.D / §6)', () => {
  // The result-controls region: from the controls container open to the
  // disclaimer line that closes the button stack.
  const rcStart = html.indexOf('class="result-controls"');
  const controls = html.slice(
    rcStart,
    html.indexOf('class="disclaimer"', rcStart)
  );

  it('#share-btn lives inside .result-controls', () => {
    expect(controls).toMatch(/id="share-btn"/);
  });

  it('#share-btn is the third control, after shake-again and try-another', () => {
    const iShake = controls.indexOf('id="shake-again-btn"');
    const iTry = controls.indexOf('id="try-another-btn"');
    const iShare = controls.indexOf('id="share-btn"');
    expect(iShake).toBeGreaterThanOrEqual(0);
    expect(iTry).toBeGreaterThan(iShake);
    expect(iShare).toBeGreaterThan(iTry);
  });

  it('#share-btn label is "share" and type is button', () => {
    const m = html.match(/<button([^>]*id="share-btn"[^>]*)>([\s\S]*?)<\/button>/);
    expect(m, 'share-btn element not found').not.toBeNull();
    expect(m[1]).toMatch(/type="button"/);
    expect(m[2].trim()).toBe('share');
  });

  it('share-status confirmation node exists', () => {
    expect(html).toMatch(/id="share-status"/);
  });
});

describe('ui/share.js DI shape (DOCTRINE §6)', () => {
  it('exports initShareUI with (refs, hooks) arity', () => {
    expect(shareJs).toMatch(/export function initShareUI\s*\(\s*refs\s*,\s*hooks\s*\)/);
  });

  it('index.html boots the share surface via initShareUI', () => {
    expect(html).toMatch(/import\s*\{\s*initShareUI\s*\}\s*from\s*['"]\.\/ui\/share\.js['"]/);
    expect(html).toMatch(/initShareUI\(/);
  });
});

describe('share-surface privacy invariants (DOCTRINE §5.D / §5 / §7)', () => {
  // §5.D invariant (c): no network call of any kind. Belt-and-suspenders
  // with tests/privacy_scan.test.js (which scans ui/ too) — asserted here
  // explicitly so the share module carries its own guard.
  it('ui/share.js introduces no network surface (fetch / XHR / sendBeacon)', () => {
    expect(shareJs).not.toMatch(/fetch\s*\(/);
    expect(shareJs).not.toMatch(/XMLHttpRequest/);
    expect(shareJs).not.toMatch(/sendBeacon/);
  });

  // §5.D invariant (a): never the paid card-content layer. The image
  // builder must not read the unlocked name/type/habit/note slots.
  it('ui/share.js does not reference the paid card-content layer', () => {
    for (const token of [
      'card-name', 'card-type', 'card-habit', 'card-note',
      'cardName', 'cardType', 'cardHabit', 'cardNote',
    ]) {
      expect(shareJs, `share.js must not reference ${token}`).not.toContain(token);
    }
    // The cell-content property reads from the unlocked branch must not
    // appear in the share builder either.
    expect(shareJs).not.toMatch(/\.habit\b/);
    expect(shareJs).not.toMatch(/\.note\b/);
  });

  // §5.D invariant (a)/(b): never name or DOB; no per-result link or
  // query parameter encodes any profile field.
  it('ui/share.js carries no name/DOB profile read', () => {
    // No profile object is imported or read at all — the builder works
    // purely off the rendered free-symbol DOM nodes. Guard the property
    // reads that would pull PII (matches code, not prose: a comment may
    // legitimately mention "name or DOB" while describing the invariant).
    expect(shareJs).not.toMatch(/profile\.(name|dob|time|city|cc|lat|lng|tz)\b/);
    expect(shareJs).not.toMatch(/\.dob\b/);
    expect(shareJs).not.toMatch(/\.name\b/);
  });

  it('the shared URL is the bare production URL with no query string', () => {
    const m = shareJs.match(/SITE_URL\s*=\s*['"]([^'"]+)['"]/);
    expect(m, 'SITE_URL constant not found').not.toBeNull();
    expect(m[1]).toBe('https://the-eight-ball.netlify.app');
    expect(m[1]).not.toMatch(/[?&]/);
  });

  // §5.D invariant (c): no share counting / telemetry. The image render
  // path is on-device only — assert the on-device primitives are present
  // and no new dependency is pulled in.
  it('ui/share.js renders on-device (canvas/toBlob) and pulls no dependency', () => {
    expect(shareJs).toMatch(/toBlob/);
    expect(shareJs).toMatch(/createObjectURL/);
    // No imports at all — share.js is self-contained, so dependency
    // discipline (tests/dependency_discipline.test.js) is unaffected.
    expect(shareJs).not.toMatch(/^\s*import\s/m);
    expect(shareJs).not.toMatch(/require\s*\(/);
  });
});
