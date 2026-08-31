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

// Journal structural integrity. Three times on 2026-08-31 alone, an entry
// prepended to journal.md by string-replacing the previous heading DELETED
// that heading, orphaning a shipped entry's body inside the new entry (twice
// caught only by cross-model audit lanes — pr221 P1-2, pr223 P1-1). The
// journal is append-only and its headings are the log's anchors, so this
// converts the recurring review catch into a pinned invariant: every entry
// body opens with `**What happened.**`, and no `## ` section may contain two
// of them — a second one means a heading was eaten. The guard reads the real
// file, so it fails in the same change that corrupts it.
describe('journal structural integrity (the eaten-heading class)', () => {
  it('no journal section carries two entry bodies', () => {
    const journal = readFileSync(join(root, 'journal.md'), 'utf-8');
    const sections = journal.split(/\n## /);
    expect(sections.length).toBeGreaterThan(100); // non-vacuous: the log is real
    const offenders = sections
      // Line-anchored: an entry body OPENS a line with the marker; a prose
      // mention of the literal (as this guard's own journal entry makes)
      // sits mid-sentence and must not count.
      .map((body, i) => ({ i, hits: (body.match(/^\*\*What happened\.\*\*/gm) || []).length, head: body.slice(0, 60) }))
      .filter(s => s.hits > 1);
    expect(offenders, `a heading was deleted above the second "What happened." in: ${JSON.stringify(offenders)}`)
      .toEqual([]);
  });
});
