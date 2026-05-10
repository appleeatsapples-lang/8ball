// 8ball / tests / age_gate.test.js
// 18+ acknowledgment gate enforcement (DOCTRINE.md §4.A).
// Verifies the markup shape of the age-gate modal in index.html.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('age-gate modal (DOCTRINE.md §4.A)', () => {
  it('age-gate modal element exists', () => {
    expect(html).toMatch(/id="age-gate-modal"/);
  });

  it('confirm button is present with id', () => {
    expect(html).toMatch(/id="age-gate-confirm"/);
  });

  it('modal copy mentions 18+ or adults', () => {
    const m = html.match(/id="age-gate-modal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    expect(m, 'age-gate-modal subtree not found').not.toBeNull();
    const subtree = m[0];
    expect(subtree).toMatch(/18|adult/i);
  });

  it('localStorage key reference is the canonical age-ack key', () => {
    expect(html).toMatch(/eight_ball_age_ack_v1/);
  });

  it('about-modal discloses the age gate', () => {
    const m = html.match(/id="about-modal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    expect(m, 'about-modal subtree not found').not.toBeNull();
    const aboutSubtree = m[0];
    expect(aboutSubtree).toMatch(/18|adult|age/i);
  });
});
