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

// Toolchain configuration is part of the same discipline: the suite runs on a
// vendored vitest and nothing else, so the only knob that decides whether a
// green suite reports green is vitest's own per-test budget. Vitest defaults
// that budget to 5000ms; this repo's slowest test (`tests/public.test.js`'s
// voice-register sweep) idles at ~2s, 40% of it, and both pr238 audit lanes
// showed that CPU contention pushes it over the line deterministically
// (5/6 and 12/12 reproductions) while disk contention alone does not. The
// raised budget in vitest.config.js is therefore load-bearing — without it
// the suite fails under a busy container and the failure reads as a defect.
// This imports the real config rather than scanning its text, so deleting or
// lowering the setting fails here.
describe('vitest per-test budget (the parallel-run timeout class)', () => {
  it('vitest.config.js raises testTimeout well above the slowest test', async () => {
    const config = (await import('../vitest.config.js')).default;
    const timeout = config?.test?.testTimeout;
    expect(
      timeout,
      `vitest.config.js sets no test.testTimeout, so the suite runs on vitest's\n` +
      `5000ms default. The slowest test idles ~2s and times out under CPU load.`
    ).toBeTypeOf('number');
    expect(
      timeout,
      `test.testTimeout = ${timeout}ms. The slowest test idles ~2000ms; a budget\n` +
      `under 15000ms leaves too little headroom for a contended container.`
    ).toBeGreaterThanOrEqual(15000);
  });
});
