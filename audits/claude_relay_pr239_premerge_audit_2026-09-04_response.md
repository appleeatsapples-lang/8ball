# PR #239 pre-merge cross-model audit — reconciled response

**PR:** 8ball #239 — DOCTRINE v0.80: the PII scan reads the repository, not the
filesystem
**Base → head:** `abdb097` → `7219cae` at audit start; every finding lands in
the reconciliation commit carrying this artifact — no mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane clones and
port bands; both lanes worked from their own clones and left the working tree
untouched. Both were briefed to lead with the scope claim, the fail-closed
claim, and record accuracy — the last because this chain had been caught three
times in four PRs stating a claim slightly wider than the code.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 HIGH, 4 MED, 9 LOW; 31 mutants, 20 killed, 11 survivors |
| Lane B | MERGE WITH FIXES | 1 HIGH, 3 MED, 4 LOW; 10 mutants, 9 killed, 1 survivor (plus the author's 8 re-verified) |

**Reconciled outcome: MERGE WITH FIXES. The direction is right and the
selection is correct, but the PR shipped two HIGHs — one of them the fourth
consecutive over-claim in this chain, and this time inside the very change
whose subject is that leak class. All fixes landed. Final call remains with
the controller per §10/L48.**

## HIGH-1 (both lanes) — the change closed the half that never runs in CI and left the half that always does

The PR claimed "the other half of the pr236 finding, closed with it." It was
not closed.

- `check_local_pii` — the check the PR redacts — reads
  `audits/local_personal_data.txt`, which is gitignored and controller-local.
  Lane A confirmed against the repo's own `audits/automated/latest.json` that
  the check reports `skip` with `pattern_file_exists: False`. **It SKIPs on
  every CI run.** The redaction protects the local report only.
- `check_tests` runs `npm test`, is blocking, stores ~16 KB of output
  unredacted, and the product-audit job uploads that report with
  `if: always()`, `retention-days: 14`, **from a public repository**.
- When the public PII scan itself catches a leak, its own output carries the
  banned token. Lane B reproduced it end to end (a surname token planted in
  `core/math.js` → the token in the stored JSON and markdown). Lane A
  reproduced it independently with a different pattern and found the layer
  Lane B had not: **the token travels four times, and the test TITLE is one of
  them** — the patterns are the identity tokens, so the old title was
  `no match for <label>: <the regex, which is the token>`. I reproduced it a third time
  before fixing: six occurrences of a planted token across the stored report.
- One layer further in, and neither lane's finding but implied by both: three
  of the nine labels **were the sibling project's own name** (the
  cross-reference, domain and vocabulary labels), so those two tests
  announced a banned token in their titles whether they failed or not.

Fixed at the source rather than by redacting `check_tests`, which both lanes
preferred and which keeps every legitimate test-failure diagnostic:

- titles carry the **label only** (`scanTitle`);
- a failure reports **`file:line` positions only** (`formatHits`), with the
  message saying why;
- the three sibling-project labels are renamed off the token they guard;
- a test asserts **no label is matched by any banned pattern** — the general
  form, so the next label cannot reintroduce this;
- both are pinned behaviourally: a message built from a hit whose line carried
  a token does not carry it, and no title contains its own pattern source.

Re-measured after the fix on the same reproduction: **six occurrences → zero**,
with the report still naming the failing check, the file and the line.

## HIGH-2 (Lane A) — the scan could be neutered entirely with every test green

Three mutations of the assertion loop each left 17/17 passing:

| mutation | result |
|---|---|
| every file allow-listed | 17/17 green |
| the hit branch made unreachable | 17/17 green |
| assert on a literal `[]` instead of `hits` | 17/17 green |

The non-vacuity guard the PR added checks the FILE SET. Nothing checked that a
pattern was ever evaluated against it. The positive-fire sentinels prove the
REGEXES fire — a different claim, and the one that was already covered.

Fixed by extracting the loop into a pure `collectHits(pattern, allow, files)`
with positive controls over the REAL patterns and synthetic files: a leak is
found at the right line for every pattern; every line of a leak is reported;
an allow-listed path is skipped exactly and by `/`-anchored suffix while a
lookalike (`notpackage.json`) is not; and the live scan is driven over the real
set with a planted entry. No new token literal was needed — the sentinel sample
table moved to module scope and the controls read from it.

A further mutation stayed open after that fix and is closed separately:
**slicing the per-pattern loop stopped running eight of the nine scans and
stayed green** (Lane A M20). An aggregate test now runs every banned pattern
over the real set in one assertion, so coverage does not depend on that loop.

## MED-1 (both lanes) — the extension list was a skip list by another name

`TEXT_EXTS` had no `.py` and no `.mjs`, so six **tracked** source files were
read by the local layer and by neither the walk nor the new selection:
`audits/project_audit.py`, `audits/test_project_audit.py`,
`scripts/build_card_jpegs.py`, `scripts/extract_hko_fixture.py`,
`scripts/render_cards.mjs`, `audits/hko_compare.mjs` — **including the auditor
file this change edits.** Pre-existing, and exactly the hole this PR is about.
Both added, with no new hits. A test now names one load-bearing path per
scanned extension, so losing an extension fails there instead of silently.

## MED-2 (Lane A) — "the two layers now agree about what they audit" is false

They agree on the **selection**. They do not audit the same set:
`run_local_audit.sh` greps everything git lists (611 catalog JPEGs included);
this layer then narrows to `TEXT_EXTS`. Corrected in the clause, the footer,
the source comment and the journal.

## MED-3 (Lane A) — the deliberate-narrowing enumeration named one consequence of five

The clause named `content/cards.v*.js` and stopped. Lane A enumerated the rest,
each confirmed:

1. `content/cards.v*.js` — private deck variants.
2. **`audits/local_personal_data.txt`** — the controller's own pattern file and
   the most PII-dense file that can exist in this tree. The walk read it; this
   does not. A good narrowing, and the most consequential item in the set.
3. **The §9 sibling-project barrier trees** named in `.gitignore`, plus
   `**/PRIVATE/` and `**/_ARCHIVE/` — never in `SKIP_DIRS`, so the walk read them and the
   sibling-project pattern was a live second net over a misfiled tree. That net
   is gone. Nothing there can be committed while ignored, so the boundary holds
   by its usual mechanism, but a local warning is lost.
4. **A nested git repository** — `--others` lists it as a single directory
   entry, not its files, so its contents are invisible where the walk read
   them. The one place the "caught before it is committed" rationale does not
   reach.
5. **`.git/info/exclude` and `core.excludesFile`** — honoured by
   `--exclude-standard`, so scope is now partly set by files outside the
   repository that no reviewer sees.

All five are in the clause. Lane A's related LOW — that "a git selection needs
no maintenance because `.gitignore` answers this question" is true of the
`--cached` half only, since `--others` re-admits disk-dependence, which this
journal already recorded as scan-count variance on 2026-06-12 — is corrected in
the same place.

## MED-4 (both lanes) — the hit counter was off by one, and its own test hid it

The count swept in `run_local_audit.sh`'s own `LOCAL PII AUDIT: HITS FOUND`
banner, which contains a colon: one real hit reported as two, three as four.
The assurance fixture was a hand-written echo that omitted the banner and the
trailer — the exact lines that caused it — so it pinned the bug as correct, and
Lane A's mutant P9 (drop the colon condition entirely) survived for the same
reason.

Counting is now `file:lineno:` shaped, and the primary test drives the **real**
`audits/run_local_audit.sh` inside a throwaway git repo rather than an echo of
what it was believed to print. A second test pins that the banner and trailer
alone count as zero.

## LOW (Lane A) — probes written into the audited tree

Cleanup lived only in a `finally`. Lane A reproduced `audits/automated/`
directory residue **twice in 18 SIGKILL runs**, and proved via mutant M17 that
nothing guarded the cleanup at all. The root probe was worse in kind than in
frequency: `.pii_scan_scope_probe.md` was **not** gitignored and would be swept
up by `git add -A`. Lane A also cleared the collision question I had flagged:
`project_audit.py` creates `audits/automated/` at the top of `main()`, so
during an audit run the directory pre-exists and the recursive removal never
fires; checks run sequentially, so there is no in-process race.

Restructured on Lane A's suggested construction: the claim about **this**
repo's `.gitignore` is asserted through `git check-ignore` with no write at
all; the one file still written (`npm-debug.log`) is itself gitignored, so a
killed run leaves nothing committable; and every claim needing a file git would
otherwise track is made in a throwaway repository under the system temp
directory.

## LOW (both lanes) — three more survivors, all closed

- **`-z` was untested.** Dropping it *and* splitting on `\n` survived. Now
  pinned by a probe whose filename contains a newline, in the temp repo.
- **`readIfPresent` swallowing every error survived.** As root no `chmod`
  produces an EACCES, so the rethrow branch was unreachable from a test. The
  reader is now injectable and the branch is driven.
- **Merge-stage duplicates** (Lane A LOW-3). During an unresolved merge
  `--cached` emits a conflicted path once per stage, so the file was read and
  its hits reported three times, and the file count inflated. `repoFiles` now
  de-duplicates; the test builds a real conflict in the temp repo and asserts
  the path appears once.

## LOW — the non-vacuity guard was too loose to do its job

`> 100` against a real 285. Lane A truncated the set to its first 101 entries
and dropped every `.md` but `DOCTRINE.md` (which sorts early, so it survives
almost any prefix truncation) — both green. It is now an **exact** count
derived from a fresh selection, plus the per-extension coverage list, plus a
pin that binaries stay out (`isText` returning true for everything had survived
too).

## LOW — numbers and record

Both lanes re-derived the figures. Corrections landed:

- **The walk count.** Restated as measured on the reconciled head — 1114 files
  against git's 903 — with the composition named (208 reports, 3 bytecode, 2
  stray logs) and the drift stated: it was 1108 three audit runs earlier, and
  it moves whenever a tool writes under the repo root, which is the argument
  rather than a footnote. Lane A reconstructed the original arithmetic as
  sound; Lane B confirmed mechanism and magnitude but, correctly, not the exact
  figure, since its inputs no longer exist.
- **`~9,972 statSync calls` was files only.** The walk stats directory entries
  too; the honest figure is ~10,170. Corrected.
- **`~6.8 MB` mixed units** — 7,320,387 bytes is 6.98 MiB / 7.3 MB. Now stated
  in bytes.
- **"205 of them generated reports"** rounded up: it was reports, bytecode and
  logs. Corrected.
- **"unchanged since 2026-07-01"** — Lane A could not verify it (this repo's
  history begins 2026-07-29) and explicitly declined to file it as a finding.
  The claim is now anchored to the 2026-06-12 journal entry that does record
  the local scan's selection.
- **Fail-closed consequence stated.** Both lanes reproduced it: a checkout with
  no `.git`, or a tree git refuses on `safe.directory` ownership grounds,
  cannot run stage 3 at all and reports that rather than passing. Both lanes
  judged fail-closed correct here; a git worktree works. The clause now says so
  instead of leaving it to be discovered.
- Journal header now names PR #239; the duplicate `node:path` import is gone.

## Verified true — no finding

- **In a clean checkout the two selections are byte-identical.** Lane A:
  `ONLY-OLD = 0`, `ONLY-NEW = 0`, same file count, same character count.
  Nothing that should be scanned was lost in a clean tree.
- **No tracked file is missed.** `--cached` covers index-only and staged-new
  files; deleted-but-tracked files are listed and correctly skipped — an
  improvement, since the old `statSync` walk would have thrown. No symlinks or
  gitlinks are tracked. Spaces, quotes and newlines in names are handled.
- **The negated ignore rule works**: `content/cards.v1.full.js` is still
  scanned (§7 v0.22), while `content/cards.v2.js` is correctly excluded.
- **All nine patterns fire** when planted in a tracked source file, a tracked
  doc, a new untracked-not-ignored file, and a `content/` file; and correctly
  do not in a gitignored path (Lane B).
- **Fail-closed is real**: a module-level throw is not swallowed by vitest —
  `Failed Suites 1`, rc=1, `npm test` fails.
- **The PATH-clobbering test does not leak**: vitest runs each file in its own
  worker, the mutation is restored in `finally`, and no other test file shells
  out to git.
- **The redaction closes the `check_local_pii` channel completely**: `output`,
  `summary`, `evidence` and the whole serialized record are clean, and the
  notice is fixed text that does not vary with input.
- **CI is red only for the missing artifact.** Both lanes simulated the gates:
  the journal-touch gate passes; the `test` job's DOCTRINE-artifact leg and
  `l48-gate` fail solely because no `audits/*_pr239_*` file exists. Separately
  confirmed here that `product-audit` was **green** on `7219cae`, which means
  `npm test` — including the new git-based scan — ran and passed inside the
  GitHub Actions runner via that job's blocking `product.tests` check.
- Shape: `index.html` 659 lines; CLAUDE.md counts 14 core / 14 ui / 61 tests;
  no runtime dependency, no `fetch(`, no new localStorage key, no jsdom.

## Stated plainly — not reproduced

- Lane A could not reproduce root-probe residue under a real interrupt (18
  SIGKILL attempts); the mechanism is proven by a mutant, not by a kill. The
  probe is gone regardless.
- Lane A could not execute its old-walk-vs-git comparison directly against the
  working repository (sandbox classifier) and reconstructed it read-only.
- Neither lane could reproduce the exact original 1108 / 481 / 74 MB figures;
  their inputs no longer exist. Restated as measured today, with the drift
  named.
- No claim is made about how the hit counter handles a `Binary file … matches`
  line: Lane A planted a binary hit and the script emitted no line at all.

## Final state of the reconciled branch

- `tests/pii_scan.test.js` **12 → 30 tests**;
  `audits/test_project_audit.py` **115 → 121**.
- **21 reconciliation mutants: 19 killed, 2 named.** The two survivors are
  mutations of the test bodies themselves — slicing the per-pattern loop, and
  slicing the aggregate's own input. They are named rather than counted as
  kills: an all-negative assertion can always be narrowed by editing it, so the
  defence is that the production logic now lives in `collectHits` behind
  positive controls, and that slicing the loop loses no coverage because the
  aggregate still runs all nine patterns.
- Of the lanes' 12 combined survivors, every one is fixed above or named,
  except `cwd: process.cwd()` for `REPO_ROOT`, which is indistinguishable while
  the suite runs from the repo root.

**Merge remains the controller's word per §10 / L48. This artifact claims no
merge authority.**
