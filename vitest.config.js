import { defineConfig, configDefaults } from 'vitest/config';

// Exclude `.claude/` so Vitest never descends into CC worktrees under
// `.claude/worktrees/` and discovers duplicate copies of the test suite.
// `.claude/` is gitignored (CC tooling artifacts, not tracked content).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // Vitest's default per-test budget is 5000ms. The suite's slowest test
    // (`tests/public.test.js`'s voice-register sweep) idles at ~2s — 40% of
    // that budget — so under CPU contention it crosses the line and the run
    // fails with a timeout that looks like a defect. Both pr238 audit lanes
    // reproduced this deterministically under load (5/6 and 12/12) and both
    // showed disk contention alone does NOT reproduce it, which corrects
    // this repo's earlier "heavy parallel file reading" reading of the same
    // symptom. 20s is 10x the slowest test and costs nothing when green.
    testTimeout: 20000,
  },
});
