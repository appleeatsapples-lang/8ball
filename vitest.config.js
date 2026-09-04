import { defineConfig, configDefaults } from 'vitest/config';

// Exclude `.claude/` so Vitest never descends into CC worktrees under
// `.claude/worktrees/` and discovers duplicate copies of the test suite.
// `.claude/` is gitignored (CC tooling artifacts, not tracked content).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // Vitest's default per-test budget is 5000ms. Both pr238 audit lanes
    // reproduced timeouts under CPU contention deterministically (5/6 and
    // 12/12) and both showed disk contention alone does NOT reproduce them,
    // which corrects this repo's earlier "heavy parallel file reading"
    // reading of the same symptom.
    //
    // At the time, one test — `tests/public.test.js`'s voice-register sweep —
    // idled at ~2.17s, 43% of the default budget, and was the obvious
    // casualty. That test now idles at ~0.10s (the 2026-09-04 sweep pass: it was
    // making 198,333 expect() calls for 136ms of real work), and the suite's
    // slowest test is ~0.48s. So this budget is no longer headroom over ONE known-slow test;
    // it is headroom over scheduler contention generally, which is what the
    // lanes' evidence was actually about. Cheap either way: it costs nothing
    // on a green run, and the class it prevents is a timeout that reads as a
    // defect.
    testTimeout: 20000,
  },
});
