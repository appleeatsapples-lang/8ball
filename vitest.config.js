import { defineConfig, configDefaults } from 'vitest/config';

// Exclude `.claude/` so Vitest never descends into CC worktrees under
// `.claude/worktrees/` and discovers duplicate copies of the test suite.
// `.claude/` is gitignored (CC tooling artifacts, not tracked content).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // Advisory coverage (P9, journal 2026-07-29). Activates only under
    // `npm run coverage` / --coverage; plain `npm test` is untouched.
    // Scope is the two executable-source trees — content/ is data,
    // index.html's inline module is measured by proxy via ui/boot.js and
    // the markup-contract scans, and tests/ measuring itself is noise.
    // DELIBERATELY no `thresholds` block: the report prints, nothing
    // fails on it. Flooring branch coverage once the numbers are stable
    // is an operator decision recorded in the journal entry, not a
    // default anyone should quietly flip on here.
    coverage: {
      include: ['core/**', 'ui/**'],
      reporter: ['text'],
    },
  },
});
