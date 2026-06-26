// tests/lab_boundary.test.js — interrogation lab must not bleed into live surface

import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

describe('lab boundary — live surface isolation', () => {
  it('index.html does not link to /lab/', () => {
    const html = read('index.html');
    expect(html).not.toMatch(/\/lab\//);
    expect(html).not.toMatch(/interrogate\.html/);
  });

  it('index.html does not call interrogation function', () => {
    const html = read('index.html');
    expect(html).not.toMatch(/functions\/interrogate/);
  });

  it('ui/*.js does not reference lab/', () => {
    for (const f of ['ui/payments.js', 'ui/profile.js', 'ui/share.js', 'ui/tiers.js']) {
      const src = read(f);
      expect(src).not.toMatch(/\/lab\//);
      expect(src).not.toMatch(/interrogate/);
    }
  });

  it('core/*.js does not import lab/', () => {
    const coreFiles = [
      'core/profile.js', 'core/engine.js', 'core/birthcard.js',
      'core/rising.js', 'core/payments.js', 'core/calendar.js',
    ];
    for (const f of coreFiles) {
      expect(read(f)).not.toMatch(/\.\.\/lab\//);
    }
  });

  it('lab page is noindex', () => {
    const html = read('lab/interrogate.html');
    expect(html).toMatch(/noindex/i);
    expect(html).toMatch(/prototype/i);
  });

  it('lab files exist', () => {
    for (const f of [
      'lab/interrogate.html',
      'lab/interrogate.js',
      'lab/interrogate.css',
      'lab/derive-traces.js',
      'lab/interrogate-shared.js',
      'netlify/functions/interrogate.mjs',
    ]) {
      expect(() => statSync(join(ROOT, f))).not.toThrow();
    }
  });
});