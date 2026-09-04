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
// green suite reports green is vitest's own per-test budget, which vitest
// defaults to 5000ms.
//
// The justification is the production sighting, not any one slow test: the
// pr238 audit recorded `pii_scan` and `cards_hosting` — whose slowest
// individual tests idle at 111ms and 133ms — crossing 5000ms in a single run,
// a ~40x stall neither lane could induce. The 5/6 and 12/12 contention
// reproductions those lanes ran were of a different test, one that idled at
// ~2.17s then and ~0.10s now, so they no longer support a general claim
// (pr240 audit, Lane A LOW-2). Both the 20000 budget and the 15000 floor
// below are round numbers rather than derived ones; what they buy is that a
// contended container reports a defect instead of a timeout.
//
// This imports the real config rather than scanning its text, so deleting or
// lowering the setting fails here.
describe('vitest per-test budget (the parallel-run timeout class)', () => {
  it('vitest.config.js raises testTimeout above vitest\'s 5000ms default', async () => {
    const config = (await import('../vitest.config.js')).default;
    const timeout = config?.test?.testTimeout;
    expect(
      timeout,
      `vitest.config.js sets no test.testTimeout, so the suite runs on vitest's\n` +
      `5000ms default, which CPU contention has been shown to cross.`
    ).toBeTypeOf('number');
    expect(
      timeout,
      `test.testTimeout = ${timeout}ms; a budget under 15000ms leaves too little\n` +
      `headroom for a contended container (see the note above this test).`
    ).toBeGreaterThanOrEqual(15000);
  });
});
