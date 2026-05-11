// 8ball / tests / numerology_display.test.js
//
// v0.3.0 fix A: the numerology triplet on the result card renders as
// space-separated coordinates ("3 8 3"), never concatenated ("383").
// CiC verifier flagged the concatenated form as cognitively reading
// like a single three-digit number rather than the three independent
// numerology coordinates. Lock the always-spaced shape.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf-8');

describe('numerology display (v0.3.0 fix A)', () => {
  // Extract the formatNumbers function body so we assert on JUST that
  // function, not stray uses of .join(' ') / .join('') elsewhere in the
  // file.
  function formatNumbersBody() {
    const m = html.match(/function formatNumbers\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    if (!m) throw new Error('formatNumbers function not found in index.html');
    return m[1];
  }

  it('formatNumbers exists in index.html', () => {
    expect(html).toMatch(/function formatNumbers\(/);
  });

  it("formatNumbers uses .join(' ') — space-separated", () => {
    expect(formatNumbersBody()).toMatch(/\.join\(\s*['"]\s['"]\s*\)/);
  });

  it("formatNumbers does NOT use .join('') — never concatenated", () => {
    expect(formatNumbersBody()).not.toMatch(/\.join\(\s*['"]['"]\s*\)/);
  });

  it('formatNumbers references all three numerology coordinates', () => {
    const body = formatNumbersBody();
    expect(body).toMatch(/profile\.lifePath/);
    expect(body).toMatch(/profile\.nameNumber/);
    expect(body).toMatch(/profile\.soulUrge/);
  });

  it('no hasMaster-branched display logic remains in formatNumbers', () => {
    // The pre-fix-A body branched on `nums.some(n => n > 9)` to pick
    // between space-join and concat-join. Both branches retired —
    // assert the branch is gone so we never silently revert.
    expect(formatNumbersBody()).not.toMatch(/hasMaster/);
    expect(formatNumbersBody()).not.toMatch(/n\s*>\s*9/);
  });
});
