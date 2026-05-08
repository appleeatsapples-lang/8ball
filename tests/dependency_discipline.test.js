// 8ball / tests / dependency_discipline.test.js
// Dependency discipline (DOCTRINE.md §12 + §6).
// 8ball is a static site with no build step. The package.json should
// stay close to empty: no runtime dependencies, no build script, and
// a strictly bounded devDependencies count.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8'));

// Bounded headroom over the current count (1 → vitest). New dev deps
// require a doctrine note in journal.md and re-tightening this threshold
// or making the cost explicit.
const DEV_DEP_THRESHOLD = 5;

describe('dependency discipline (DOCTRINE.md §12, §6)', () => {
  it('package.json has no runtime dependencies', () => {
    const deps = pkg.dependencies || {};
    expect(
      Object.keys(deps),
      `Runtime dependencies present: ${JSON.stringify(deps)}.\n` +
      `8ball is static + ES modules per §6; runtime deps are out of scope per §12.`
    ).toEqual([]);
  });

  it('package.json has no build script', () => {
    const build = pkg.scripts && pkg.scripts.build;
    const isNoOp = !build || /^echo /.test(build);
    expect(
      isNoOp,
      `package.json.scripts.build is "${build}" — non-no-op build script present.\n` +
      `8ball has no build step per §6; adding one needs a doctrine amendment.`
    ).toBe(true);
  });

  it(`devDependencies count is at most ${DEV_DEP_THRESHOLD}`, () => {
    const dev = pkg.devDependencies || {};
    const count = Object.keys(dev).length;
    expect(
      count,
      `devDependencies count = ${count}; threshold = ${DEV_DEP_THRESHOLD}.\n` +
      `Listed: ${Object.keys(dev).join(', ')}.\n` +
      `Adding dev deps that push past the threshold needs a doctrine note ` +
      `(DOCTRINE.md §12 — minimal tooling) and a threshold re-evaluation.`
    ).toBeLessThanOrEqual(DEV_DEP_THRESHOLD);
  });
});
