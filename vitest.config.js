import { defineConfig, configDefaults } from 'vitest/config';

// Exclude `.claude/` so Vitest never descends into CC worktrees under
// `.claude/worktrees/` and discovers duplicate copies of the test suite.
// `.claude/` is gitignored (CC tooling artifacts, not tracked content).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // cities.test.js loops all 53k dataset entries with per-entry
    // assertions — legitimately >5s under vitest 4's default budget.
    testTimeout: 15_000,
  },
});
