// 8ball / tests / repo_shape.test.js
// Drift guard for the canonical repository-shape counts in CLAUDE.md.
//
// CLAUDE.md declares itself the canonical inventory for the core/ / ui/ /
// tests/ file counts ("8BALL.md / README.md defer here"), and its own text
// records that those numbers drifted unnoticed for ~1 month before the
// 2026-07-04 drift-sweep caught them — twice over the project's life. This
// converts that recurring manual re-verification into a pinned invariant: if
// a module or test file is added or removed without updating the CLAUDE.md
// count in the same change, this fails. No dependency, no new tooling — it
// reads the two files it compares.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const claudeMd = readFileSync(join(root, 'CLAUDE.md'), 'utf-8');

const countJs = (dir, suffix = '.js') =>
  readdirSync(join(root, dir)).filter((f) => f.endsWith(suffix)).length;

// Pull "N modules" / "N vitest files" out of the CLAUDE.md "Repository shape"
// block. The regexes anchor on the leading path token so they match only the
// inventory lines, not prose elsewhere in the file.
const stated = (re) => {
  const m = claudeMd.match(re);
  expect(m, `CLAUDE.md is missing the expected count line: ${re}`).not.toBeNull();
  return Number(m[1]);
};

describe('repository-shape counts (CLAUDE.md canonical inventory)', () => {
  it('core/ module count matches CLAUDE.md', () => {
    const claimed = stated(/core\/[^\n]*?(\d+)\s+modules/);
    expect(countJs('core')).toBe(claimed);
  });

  it('ui/ module count matches CLAUDE.md', () => {
    const claimed = stated(/ui\/[^\n]*?\((\d+)\s+modules/);
    expect(countJs('ui')).toBe(claimed);
  });

  it('tests/ vitest-file count matches CLAUDE.md', () => {
    const claimed = stated(/tests\/[^\n]*?(\d+)\s+vitest\s+files/);
    expect(countJs('tests', '.test.js')).toBe(claimed);
  });
});
