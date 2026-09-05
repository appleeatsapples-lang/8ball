import { defineConfig, configDefaults } from 'vitest/config';

// Exclude `.claude/` so Vitest never descends into CC worktrees under
// `.claude/worktrees/` and discovers duplicate copies of the test suite.
// `.claude/` is gitignored (CC tooling artifacts, not tracked content).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // Vitest's default per-test budget is 5000ms. This raises it, and the
    // reason is NOT the one test that used to be slow.
    //
    // The production sighting the pr238 audit chased was `pii_scan` and
    // `cards_hosting` — files whose slowest individual tests idled, at the
    // time of the sighting, at 111ms and 133ms — crossing 5000ms in one run: a ~40x stall neither lane could
    // induce. That is the case this budget exists for, and it is independent
    // of how fast any single test is. What the lanes DID reproduce on demand
    // (5/6 and 12/12 under CPU load) was a timeout of `tests/public.test.js`'s
    // voice-register sweep, which then idled at ~2.17s; that test now idles at
    // ~0.10s and the suite's slowest is ~0.4s, so those two figures no longer
    // transfer to anything and are recorded here as history rather than as
    // the justification (pr240 audit, Lane A LOW-2).
    //
    // 20s is a round number, not a derived one. It costs nothing on a green
    // run, and the class it prevents is a timeout that reads as a defect.
    testTimeout: 20000,
  },
});
