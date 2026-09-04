// 8ball / tests / pii_scan.test.js
// Public-repo PII audit. Runs as part of `npm test`.
// Scans the repository for patterns that indicate accidental personal-info
// leakage. Two layers: this public scan + the controller's local scan
// (audits/LOCAL_PII_AUDIT.md, gitignored data file) before push.
//
// SCOPE (v0.80). "The repository" means what git says it is:
//   git ls-files --cached --others --exclude-standard
// tracked content PLUS untracked-but-not-ignored files, so a half-built leak
// is still caught before it is committed. This is the SAME selection
// audits/run_local_audit.sh has always used — the two layers of one audit now
// agree about what they are auditing.
//
// It used to be a filesystem walk with a hand-maintained SKIP_DIRS list, and
// the gap between "what we publish" and "what happens to be on this disk" bit
// three times: `.claude/` had to be added to SKIP_DIRS after a local settings
// file leaked the controller's handle into this scan; the PR #190 cycle found
// the scan's file count inflated by generated report output; and the pr236
// audit found the sharper one — `audits/project_audit.py` stored every check's
// full subprocess output, the local-PII check shells out to a script that
// PRINTS the controller's own patterns and matching lines on a hit, and this
// walk then read those reports out of `audits/automated/`, a directory the
// repository does not carry. Both lanes said not to leave it a third time.
// A skip list has to be extended for each new source of untracked bulk; a git
// selection needs no maintenance, because .gitignore is already the file that
// answers this question — for the --cached half. --others deliberately
// re-admits some disk-dependence, and this repo already recorded the
// consequence on 2026-06-12: the scan count varies with untracked content
// (pr239 audit, Lane A LOW-8). Measured on this change's own head, in this
// container: the walk saw 1114 files where git lists 903 — the difference
// being 208 generated product-audit reports, 3 Python bytecode files and 2
// stray server logs. That number moves whenever a tool writes under the repo
// root, which is itself the argument.

import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Skip the audit doc itself + this test file (their job is to list the patterns).
const SKIP_FILES = new Set(['LOCAL_PII_AUDIT.md', 'pii_scan.test.js']);

// "Doctrine files" — files whose job is explicitly to document the boundary.
// These can reference operator-name and SIRR-domain vocabulary because
// they're describing the rule, not violating it.
//
// As of DOCTRINE v0.24 (agents/ codification), the agents/*.md role docs are
// part of the doctrine surface — they're operational extensions of §10. They
// can reference MUHAB.md (operator-preferences source) and SIRR.md (sibling
// project boundary reference) for the same reason DOCTRINE.md can.
const DOCTRINE_ALLOW = new Set([
  'DOCTRINE.md',
  '8BALL.md',
  'journal.md',
  'README.md',
  'audits/RELEASE_CHECKLIST.md',
  'audits/LOCAL_PII_AUDIT.md',
  'agents/AGENTS.md',
  'agents/PLATFORMS.md',
  'agents/orchestrator.md',
  'agents/implementer.md',
  'agents/auditor.md',
  'agents/verifier.md',
  'agents/inspector.md',
  'agents/controller.md'
]);

// Config files that legitimately carry repo metadata (operator GitHub username).
const CONFIG_ALLOW = new Set([
  'package.json',
  'package-lock.json',
  'LICENSE'
]);

// Narrower allow-list for the labeled-DOB rule specifically.
// Doctrine docs need to NAME this leak class; they do not need to REPRODUCE
// example shapes inline. journal.md, 8BALL.md, and README.md are excluded
// here even though they're in DOCTRINE_ALLOW for other rules.
const LABELED_DOB_ALLOW = new Set([
  'DOCTRINE.md',
  'audits/LOCAL_PII_AUDIT.md',
  'audits/RELEASE_CHECKLIST.md'
]);

// The repository, as git defines it. FAIL-CLOSED per §7: if git cannot answer,
// this throws and the scan fails — it never silently falls back to walking the
// filesystem, which is the behaviour this function replaced.
function repoFiles(root = REPO_ROOT) {
  let out;
  try {
    out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    throw new Error(
      `pii scan could not enumerate the repository (git ls-files failed: ${err.message}).\n` +
      `This scan is fail-closed: it does not fall back to a filesystem walk, because the ` +
      `walk is what let generated, untracked report output into the scan's read set.`
    );
  }
  // De-duplicated: during an unresolved merge `--cached` emits each
  // conflicted path ONCE PER STAGE, so the file would be read and scanned
  // three times, its hits reported three times, and the file count inflated
  // (pr239 audit, Lane A LOW-3).
  return [...new Set(out.split('\0').filter(Boolean))];
}

// Banned tokens for normal (non-doctrine, non-config) tracked content.
const BANNED = [
  // Operator identity. LICENSE has the full name; doctrine files reference
  // the MUHAB.md companion path. Anywhere else = leak.
  { pattern: /\bmuhab\b/i, label: 'operator first name', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /\bmuhabakif\b/i, label: 'operator handle', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /\bakif\b/i, label: 'operator surname', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },
  { pattern: /appleeatsapples/i, label: 'GitHub username', allow: [...DOCTRINE_ALLOW, ...CONFIG_ALLOW] },

  // SIRR cross-references — DOCTRINE.md §9 SIRR boundary rule.
  // Labels renamed off the sibling project's own name in v0.80's
  // reconciliation. A label is printed in the test title and in the failure
  // message, both of which are captured into audit reports — and three of
  // these labels WERE the banned token, so the two sibling-boundary tests put
  // it in front of the same channel this change exists to close. The label is
  // for a human; it does not need to be the thing it guards.
  { pattern: /\bSIRR\b/, label: 'sibling-project cross-reference', allow: [...DOCTRINE_ALLOW, '.gitignore'] },
  { pattern: /\bsirr\.studio\b/i, label: 'sibling-project domain', allow: [...DOCTRINE_ALLOW] },
  { pattern: /\babjad\b/i, label: 'sibling-project vocabulary', allow: [...DOCTRINE_ALLOW] },
  { pattern: /hebrew_gematria/i, label: 'sibling-project vocabulary', allow: [...DOCTRINE_ALLOW] },

  // Labeled-DOB leak shape: a tag like "Muhab"/"operator"/"owner" within 40
  // characters of a YYYY-MM-DD. This catches the exact failure mode that
  // shipped in v0.1.0 — a fixture labeled "(canonical Muhab test)" with a
  // real-shape DOB. Doctrine files don't need this exception because they
  // shouldn't be embedding labeled DOBs either.
  {
    // Tightened from [^a-z] to . — the original missed JSON-shaped occurrences
    // where alphabetic text sits between the label and the date (e.g.
    // `Muhab test)" with \`dob: "YYYY-MM-DD`). Same 40-char window keeps it
    // line-local and prevents false positives across distant tokens.
    // L53 #4 fix: leading \b added + bare `me` dropped. `me\b` had no left
    // boundary, so it matched the trailing "me" of ordinary words (e.g.
    // "same day ... 2026-06-25" in journal.md) — a self-label "me" is not a
    // real operator-DOB tag, and the named tokens already cover the leak
    // shape. Word-bounding the group also stops e.g. "owner" matching inside
    // "downer". No true-positive coverage lost (the v0.1.0 leak was tagged
    // "Muhab", still caught by \bmuhab\b).
    pattern: /\b(muhab|akif|operator|owner|founder)\b.{0,40}\d{4}-\d{2}-\d{2}/i,
    label: 'labeled-DOB leak',
    allow: [...LABELED_DOB_ALLOW]
  }
];

// `.py` and `.mjs` were missing until v0.80's reconciliation: six TRACKED
// source files — `audits/project_audit.py`, `audits/test_project_audit.py`,
// `scripts/build_card_jpegs.py`, `scripts/extract_hko_fixture.py`,
// `scripts/render_cards.mjs`, `audits/hko_compare.mjs` — were invisible to
// this scan, including the two files the v0.80 change itself edits (pr239
// audit, Lane B MED-2). Extension gaps are the same class of hole as the
// walk's skip list: a list that has to be extended by whoever notices.
const TEXT_EXTS = ['.js', '.mjs', '.json', '.html', '.md', '.toml', '.yml', '.yaml', '.css', '.txt', '.xml', '.gitignore', '.sh', '.py'];
function isText(file) {
  if (TEXT_EXTS.some(ext => file.endsWith(ext))) return true;
  if (file.endsWith('LICENSE')) return true;
  if (file.endsWith('.gitignore')) return true;
  return false;
}

// One sample per banned pattern, hoisted to module scope so the positive
// controls below can drive the REAL patterns without this file gaining any
// new token literal. Driven off BANNED, so a newly-added pattern with no
// sample here fails loudly rather than being silently skipped.
const SAMPLES = [
  ['operator first name', 'muhab'],
  ['operator handle', 'muhabakif'],
  ['operator surname', 'akif'],
  ['GitHub username', 'appleeatsapples'],
  ['sibling-project cross-reference', 'SIRR'],
  ['sibling-project domain', 'sirr.studio'],
  ['sibling-project vocabulary', 'abjad'],
  ['sibling-project vocabulary', 'hebrew_gematria'],
];
// Two patterns share the 'sibling-project vocabulary' label, so a sample is
// found by the PATTERN it must fire, not by the label alone.
const sampleFor = ({ pattern, label }) =>
  (SAMPLES.find(([l, tok]) => l === label && pattern.test(tok)) || [])[1];

// Read the scannable set ONCE and test every pattern against it. It used to be
// one full walk per BANNED entry — nine walks, nine reads of every text file,
// no caching (pr236 audit, Lane B). The set is built at module load, so the
// scope probes below add and remove their files without disturbing it.
// A file git listed can vanish between the listing and the read — the product
// auditor writes `audits/automated/` while the suite runs, and until v0.80
// that directory was IN this read set, so an ENOENT here failed the suite as
// an fs ERROR rather than an assertion (pr238 audit, Lane A). A file that is
// not there is not published, so it is skipped; anything other than "gone" is
// still a real error and still throws.
// `read` is injected so the rethrow branch can be driven: as root, no
// chmod produces an EACCES, so without this the discrimination between
// "gone" and "broken" was code no test could reach — and a mutant that
// swallowed EVERY error survived (pr239 audit, Lane B LOW-1).
function readIfPresent(rel, read = readFileSync) {
  try {
    return read(join(REPO_ROOT, rel), 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') return null;
    throw err;
  }
}

const SCANNED = (() => {
  const out = [];
  for (const rel of repoFiles()) {
    if (SKIP_FILES.has(basename(rel))) continue;
    if (!isText(rel)) continue;
    const content = readIfPresent(rel);
    if (content !== null) out.push([rel, content]);
  }
  return out;
})();

// This scan's OWN OUTPUT is a leak channel, and it was one until v0.80's
// reconciliation (pr239 audit, Lane B HIGH-1, reproduced here four times over
// in a single failure). `audits/project_audit.py` runs `npm test` as a
// blocking check and stores its full output in a report that is written to
// disk and uploaded as a CI build artifact — so on a real hit, the banned
// TOKEN travelled: in the test's title (the patterns ARE identity tokens), in
// vitest's FAIL header, in the assertion message, and in its diff. Redacting
// the local-PII check's output was only ever half of it, and the half that is
// dormant in CI at that: its pattern file is gitignored, so that check SKIPS
// on every CI run while this one runs on every push.
//
// So: the title names the LABEL only, and a failure reports POSITIONS only.
// `file:line` is what a reader acts on; the matched text is one `sed -n` away
// on the machine that already has the file.
const scanTitle = label => `no match for ${label}`;

// The scan's actual work, extracted so it can be driven with known input.
// Three mutations of the old inline loop — every file allow-listed, the hit
// branch made unreachable, and asserting on a literal `[]` — each neutered
// the scan completely and left all 17 tests green (pr239 audit, Lane A
// HIGH-1). Nothing proved a pattern was ever evaluated against the file set;
// the sentinels below prove the REGEXES fire, which is a different claim.
function collectHits(pattern, allow, files) {
  const hits = [];
  for (const [rel, content] of files) {
    if (allow.some(a => rel === a || rel.endsWith('/' + a))) continue;
    if (!pattern.test(content)) continue;
    for (const [i, line] of content.split('\n').entries()) {
      if (pattern.test(line)) hits.push(`${rel}:${i + 1}`);
    }
  }
  return hits;
}
const formatHits = (label, hits) =>
  `Banned pattern (${label}) found at ${hits.length} position(s):\n${hits.join('\n')}\n` +
  `(positions only — this message is captured into audit reports and CI artifacts, ` +
  `so it must not carry the matched text; open the file:line to read it.)`;

describe('public-repo PII scan', () => {
  // Non-vacuity. Every assertion below is all-negative, so an empty or
  // degenerate file set greens the entire scan while auditing nothing — the
  // failure mode a fail-closed selection exists to prevent, and one that a
  // silent fallback would have produced quietly.
  it('has a real repository to scan, and covers every kind of file in it', () => {
    // EXACT, not a floor. `> 100` against a real 279 let two mutants through:
    // truncating SCANNED to its first 101 entries, and dropping every `.md`
    // but DOCTRINE.md (which sorts early, so it survives almost any prefix
    // truncation). A change that silently dropped most of the repository from
    // the scan would have passed (pr239 audit, Lane A MED-1).
    const expected = repoFiles().filter(r => !SKIP_FILES.has(basename(r)) && isText(r)).length;
    expect(SCANNED.length).toBe(expected);
    expect(SCANNED.length).toBeGreaterThan(100);
    // A count is not coverage: dropping `.js` from TEXT_EXTS silently stops
    // scanning all of core/, ui/ and content/ — including the deck §7 v0.22
    // requires be scanned — and 172 other files keep the count over any
    // threshold, so the whole suite stayed green (pr239 audit, Lane B MED-3,
    // its sharpest surviving mutant). One load-bearing path per scanned
    // extension, so losing an extension fails HERE rather than silently.
    const scanned = new Set(SCANNED.map(([rel]) => rel));
    for (const rel of [
      'DOCTRINE.md',                  // .md
      'index.html',                   // .html
      'core/engine.js',               // .js  — the engine
      'content/cards.v1.full.js',     // .js  — the deck (§7 v0.22)
      'ui/shell.css',                 // .css
      'package.json',                 // .json
      'audits/project_audit.py',      // .py  — added in this same change
      'scripts/render_cards.mjs',     // .mjs — added in this same change
      'audits/run_local_audit.sh',    // .sh
      '.gitignore',                   // extensionless special case
    ]) {
      expect(scanned, `${rel} is not being scanned`).toContain(rel);
    }
    // …and binaries stay out: `isText` returning true for everything survived
    // every other assertion (pr239 audit, Lane A M9), and would have the scan
    // decoding 611 JPEGs as UTF-8 on every run.
    expect(SCANNED.filter(([rel]) => /\.(jpg|png|ico)$/.test(rel))).toEqual([]);
  });

  it('carries every banned pattern, not a prefix of them', () => {
    // `BANNED.slice(0, 1)` — eight of the nine patterns deleted — shrank the
    // suite from 17 tests to 9 and stayed green, because the tests ARE the
    // list (pr239 audit, Lane A M20). Nothing outside the list pinned it.
    expect(BANNED).toHaveLength(9);
    expect(BANNED.map(b => b.label)).toEqual([
      'operator first name',
      'operator handle',
      'operator surname',
      'GitHub username',
      'sibling-project cross-reference',
      'sibling-project domain',
      'sibling-project vocabulary',
      'sibling-project vocabulary',
      'labeled-DOB leak',
    ]);
  });

  // The per-pattern tests below are one `it` each for legibility, but the
  // COVERAGE guarantee does not depend on that loop: slicing it silently
  // stopped running eight of the nine scans and left the suite green
  // (pr239 audit, Lane A M20). This single assertion runs every banned
  // pattern over the real set, so the loop is presentation, not protection.
  it('every banned pattern is run against the real file set', () => {
    expect(BANNED).toHaveLength(9);
    const offenders = BANNED
      .map(({ pattern, allow, label }) => [label, collectHits(pattern, allow, SCANNED)])
      .filter(([, hits]) => hits.length > 0)
      .map(([label, hits]) => `${label}: ${hits.join(', ')}`);
    expect(offenders).toEqual([]);
  });

  for (const { pattern, label, allow } of BANNED) {
    it(scanTitle(label), () => {
      const hits = collectHits(pattern, allow, SCANNED);
      expect(hits, formatHits(label, hits)).toEqual([]);
    });
  }
});

// Positive controls over the scan itself, not over the regexes. Synthetic
// in-memory files, the REAL banned patterns, and tokens taken from the
// module-scope SAMPLES table so this block adds no token literal of its own.
describe('public-repo PII scan — the scan really scans', () => {
  const withToken = entry => `a line with ${sampleFor(entry)} in it`;

  it('a leak in a non-allow-listed file is found, at the right line', () => {
    for (const entry of BANNED) {
      const { pattern, label } = entry;
      if (label === 'labeled-DOB leak') continue; // no single-token sample
      const files = [['core/clean.js', 'nothing here\n'],
                     ['core/leaky.js', `first\n${withToken(entry)}\nthird\n`]];
      expect(collectHits(pattern, [], files), `${label} was not found`)
        .toEqual(['core/leaky.js:2']);
    }
  });

  it('every line of a leak is reported, not just the first', () => {
    const entry = BANNED.find(b => b.label === 'GitHub username');
    const files = [['a.md', `${withToken(entry)}\nclean\n${withToken(entry)}\n`]];
    expect(collectHits(entry.pattern, [], files)).toEqual(['a.md:1', 'a.md:3']);
  });

  it('an allow-listed path is skipped — exactly, and by suffix', () => {
    const entry = BANNED.find(b => b.label === 'GitHub username');
    const { pattern } = entry;
    const files = [['package.json', withToken(entry)],
                   ['nested/dir/package.json', withToken(entry)],
                   // a lookalike: endsWith('package.json') is true of this,
                   // which is why the suffix match must be '/'-anchored
                   ['notpackage.json', withToken(entry)]];
    expect(collectHits(pattern, ['package.json'], files)).toEqual(['notpackage.json:1']);
    // and with no allow-list every one of them is a hit — so the emptiness
    // above is the allow-list working, not the scan failing to look
    expect(collectHits(pattern, [], files)).toHaveLength(3);
  });

  it('the live scan is wired to this function over the real file set', () => {
    // plant a synthetic leak into a COPY of the scanned set and confirm the
    // same call the tests above make finds it — the wiring, not the loop
    const entry = BANNED.find(b => b.label === 'operator surname');
    const { pattern, allow } = entry;
    const planted = SCANNED.concat([['core/planted.js', withToken(entry)]]);
    expect(collectHits(pattern, allow, SCANNED)).toEqual([]);
    expect(collectHits(pattern, allow, planted)).toEqual(['core/planted.js:1']);
  });
});

// The output discipline above is itself a claim, so it is tested. Both halves
// are pinned against a synthetic token, because the real ones cannot be
// written into an assertion in a file this scan reads.
describe('public-repo PII scan — its own output carries no token', () => {
  const TOKEN = 'zzsentinelzz-not-a-real-token';

  it('a failure message reports positions, never the matched text', () => {
    const msg = formatHits('operator first name', [`core/math.js:48`, `README.md:3`]);
    expect(msg).toContain('core/math.js:48');
    expect(msg).toContain('2 position(s)');
    expect(msg).not.toContain(TOKEN);
    // …and the same message built from a hit whose LINE carried a token would
    // still not carry it, because the line never enters the message at all
    expect(formatHits('x', [`core/math.js:48  // ${TOKEN}`])).toContain(TOKEN);
    expect(formatHits('x', ['core/math.js:48'])).not.toContain(TOKEN);
  });

  it('no scan title carries its own pattern source', () => {
    for (const { pattern, label } of BANNED) {
      const title = scanTitle(label);
      expect(title, `title for ${label} leaks its pattern`).not.toContain(pattern.source);
      expect(title).toContain(label);
    }
  });
});

// The scope itself is a claim, so it is tested rather than described. Both
// halves matter and they pull in opposite directions: ignored output must be
// OUT (that is the whole change), and an untracked file that is not ignored
// must be IN (or the scan stops catching a leak in the minutes before it is
// committed — the window run_local_audit.sh was widened to cover in 2026-07-01).
describe('public-repo PII scan — scope', () => {
  // Probes used to be written into the audited tree, including a NON-ignored
  // file at the repo root that `git add -A` would sweep up if a run were
  // killed before its `finally` (pr239 audit, Lane A LOW-1, which reproduced
  // directory residue twice in 18 SIGKILL runs). Now: the claim about THIS
  // repo's .gitignore is asserted without writing anything, the one file that
  // is written is itself ignored so it cannot be committed by accident, and
  // every claim that needs a file git would otherwise track is made in a
  // throwaway repository under the system temp directory.

  it('this repo ignores the generated report directory the walk used to read', () => {
    // no write at all — ask git directly. rc 0 = ignored, 1 = not.
    const ignored = path => {
      try {
        execFileSync('git', ['check-ignore', '-q', '--no-index', path], { cwd: REPO_ROOT });
        return true;
      } catch { return false; }
    };
    expect(ignored('audits/automated/product_audit_20260101_000000.json')).toBe(true);
    expect(ignored('audits/local_personal_data.txt')).toBe(true);
    // non-vacuous: a real scanned file is NOT ignored
    expect(ignored('DOCTRINE.md')).toBe(false);
  });

  it('an ignored file sitting on disk is out of scope', () => {
    // `npm-debug.log*` is gitignored and needs no directory, so a killed run
    // leaves nothing committable behind
    const rel = 'npm-debug.log';
    const full = join(REPO_ROOT, rel);
    writeFileSync(full, 'pii scan scope probe\n');
    try {
      expect(existsSync(full), 'the probe must be on disk for this to mean anything').toBe(true);
      expect(repoFiles()).not.toContain(rel);
    } finally {
      rmSync(full, { force: true });
    }
  });

  // The remaining scope claims need files git would otherwise TRACK, so they
  // are made against a throwaway repository rather than this one.
  function tempRepo(body) {
    const dir = mkdtempSync(join(tmpdir(), 'pii-scope-'));
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf-8' });
    try {
      git('init', '-q');
      git('config', 'user.email', 'scope-probe@example.invalid');
      git('config', 'user.name', 'scope probe');
      body(dir, git);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it('still includes an untracked file that is not ignored', () => {
    tempRepo((dir) => {
      writeFileSync(join(dir, '.gitignore'), 'ignored.md\n');
      writeFileSync(join(dir, 'kept.md'), 'half-built leak would live here\n');
      writeFileSync(join(dir, 'ignored.md'), 'not our business\n');
      const files = repoFiles(dir);
      expect(files).toContain('kept.md');
      expect(files).not.toContain('ignored.md');
    });
  });

  // `-z` exists for filenames a newline would split. Nothing in this repo has
  // one, so dropping it AND splitting on '\n' passed every other test
  // (pr239 audit, Lane B LOW-2 / Lane A M6b).
  it('reads NUL-delimited output, so a filename cannot be split apart', () => {
    tempRepo((dir) => {
      const name = 'probe with a\nnewline.md';
      writeFileSync(join(dir, name), 'x\n');
      const files = repoFiles(dir);
      expect(files).toContain(name);
      expect(files).not.toContain('probe with a');
      expect(files).not.toContain('newline.md');
    });
  });

  it('lists a conflicted path once, not once per merge stage', () => {
    tempRepo((dir, git) => {
      writeFileSync(join(dir, 'both.md'), 'base\n');
      git('add', '-A'); git('commit', '-qm', 'base');
      const first = git('rev-parse', 'HEAD').trim();
      writeFileSync(join(dir, 'both.md'), 'ours\n');
      git('commit', '-qam', 'ours');
      git('checkout', '-q', '-b', 'theirs', first);
      writeFileSync(join(dir, 'both.md'), 'theirs\n');
      git('commit', '-qam', 'theirs');
      try { git('merge', '--no-edit', '-'); } catch { /* the conflict is the point */ }
      // three index stages for one path — git lists it three times
      expect(git('ls-files', '--cached').split('\n').filter(l => l === 'both.md').length)
        .toBeGreaterThan(1);
      const files = repoFiles(dir);
      expect(files.filter(f => f === 'both.md')).toHaveLength(1);
      expect(new Set(files).size).toBe(files.length);
    });
  });

  // The fail-closed claim is a claim, so it is exercised. Without this, a
  // future "helpful" fallback to the filesystem walk would restore the exact
  // behaviour v0.80 removed and every assertion above would stay green.
  it('fails closed when git cannot answer — no filesystem fallback', () => {
    const realPath = process.env.PATH;
    process.env.PATH = join(REPO_ROOT, 'no', 'such', 'bin');
    try {
      expect(() => repoFiles()).toThrow(/could not enumerate the repository/);
    } finally {
      process.env.PATH = realPath;
    }
    // and the real selection still works once git is back
    expect(repoFiles().length).toBeGreaterThan(100);
  });

  it('skips a listed file that has vanished or is a directory', () => {
    expect(readIfPresent('audits/automated/definitely-not-here')).toBeNull();
    expect(readIfPresent('audits')).toBeNull();
    // …and still returns real content, so the null above is the branch and
    // not a function that always yields nothing
    expect(readIfPresent('DOCTRINE.md')).toContain('§7');
  });

  it('rethrows a read failure that is not "gone" — an unreadable file is not an absent one', () => {
    const boom = () => { const e = new Error('permission denied'); e.code = 'EACCES'; throw e; };
    expect(() => readIfPresent('DOCTRINE.md', boom)).toThrow(/permission denied/);
    // and the two tolerated codes still yield null through the same path
    for (const code of ['ENOENT', 'EISDIR']) {
      const gone = () => { const e = new Error(code); e.code = code; throw e; };
      expect(readIfPresent('DOCTRINE.md', gone)).toBeNull();
    }
  });
});

// Guard the guard: the scan above is all-negative (asserts zero hits), so a
// broken regex would read green while silently no longer catching the leak it
// exists for. These positive-fire sentinels pin that each banned pattern STILL
// matches the shape it guards. (This file is in SKIP_FILES, so the scan does
// not scan these example strings.)
describe('public-repo PII scan — positive-fires sentinels', () => {
  const labeledDob = BANNED.find(b => b.label === 'labeled-DOB leak').pattern;

  it('labeled-DOB regex fires on the v0.1.0 leak shape it was written for', () => {
    expect(labeledDob.test('fixture (canonical Muhab test)" with dob: "1990-01-15')).toBe(true);
    expect(labeledDob.test('owner DOB 1988-03-22')).toBe(true);
    expect(labeledDob.test('founder — 2001-12-31')).toBe(true);
  });

  it('labeled-DOB regex does NOT fire on the retired false positives', () => {
    // bare `me` self-label (dropped in L53 #4) and `owner` inside `downer`
    // must stay unmatched.
    expect(labeledDob.test('same day ... 2026-06-25')).toBe(false);
    expect(labeledDob.test('downer 2026-06-25')).toBe(false);
  });

  it('every banned pattern except labeled-DOB fires on a sample of its own leak token', () => {
    // Driven off BANNED (and the module-scope SAMPLES table) so a newly-added
    // pattern with no sample fails loudly instead of being silently skipped —
    // covers the two sibling-vocabulary patterns that share one label too.
    for (const { pattern, label } of BANNED) {
      if (label === 'labeled-DOB leak') continue; // its own positive-fire tests are above
      const covered = sampleFor({ pattern, label }) !== undefined;
      // label only — this message reaches the same reports the scan's own does
      expect(covered, `no positive-fire sample matches ${label}`).toBe(true);
    }
  });

  it('no label is itself a banned token — labels are printed, patterns are not', () => {
    // Three labels used to BE the sibling project's name, so the two boundary
    // tests announced it in their own titles (pr239 audit, Lane A HIGH-2's
    // channel, one layer further in). This is the general form of that fix.
    for (const { label } of BANNED) {
      for (const { pattern, label: guard } of BANNED) {
        expect(pattern.test(label), `label "${label}" is matched by the ${guard} pattern`).toBe(false);
      }
    }
    // non-vacuous: the same check over the SAMPLES tokens must find matches
    expect(BANNED.some(({ pattern }) => SAMPLES.some(([, tok]) => pattern.test(tok)))).toBe(true);
  });
});
