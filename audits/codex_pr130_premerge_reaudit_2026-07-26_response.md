Verdict: MERGE WITH FIXES

| # | Severity | finding | evidence |
|---|---|---|---|
| R1 | Low | The code and operating-law fixes pass, but the same current journal entry still contains two pre-fix snapshots stated in present tense: it says About “deliberately still discloses all three rungs,” and reports the pre-#129 suite total `1438`, despite the correction below and the merged suite now passing `1444`. Because `journal.md` is canonical state, reconcile those two paragraphs in place as initial-state → corrected-state history and record this re-audit. No product/runtime/test behavior change is required. | `journal.md:64-84` versus `journal.md:112-159`; independent `npm test` at `36cc2ae`: 41 files / 1444 tests pass; live preview About contains the current `$3 once` offer and does not contain “one, two, or three dollars.” |

All original Medium findings are closed:

- F1: live About and its tests now present one current `$3 once` choice while honoring existing lower-rung ownership.
- F2: PR/base/brief/response/fix-cycle/merge-forward state is recorded.
- F3: the approved Reddit exception is narrowly reconciled with the existing link/new-sub hold; operator-only publishing remains intact.
- F4: the static UI’s non-self-reverting behavior and the 2026-08-08 renew-or-restore owner gate are explicit.
- F5 remains the expressly non-blocking, protected-perimeter documentation carry.

Independent re-audit at `36cc2ae7330cf2a8db885ce23ce57f60b9fea611` against `origin/main@437a1016d5c59aca75abb87ccb97761b727510e7`:

```text
git diff --check origin/main...HEAD
[no output; exit 0]

git diff --quiet origin/main...HEAD -- core ui content tests/fixtures.json
exit 0

git diff --quiet origin/main...HEAD -- tests/privacy_scan.test.js tests/pii_scan.test.js
exit 0

npm test
Test Files  41 passed (41)
Tests       1444 passed (1444)

wc -l index.html
1465

local PII equivalent using operator pattern file
LOCAL PII AUDIT: clean (249 files scanned using operator pattern file)

GitHub PR #130
OPEN; MERGEABLE; CLEAN
base=437a1016d5c59aca75abb87ccb97761b727510e7
head=36cc2ae7330cf2a8db885ce23ce57f60b9fea611
ci/test=SUCCESS; ci/l48-gate=SUCCESS; Netlify header/redirect/deploy-preview=SUCCESS
```

Live updated Netlify preview:

- About contains `the current offer is the complete sheet for three dollars, once`.
- About does not contain `one, two, or three dollars`.
- Paywall has exactly one CTA, `xjpvp`, titled `complete 8ball · $3 once`.
- Visitor’s own written-entry nodes are empty below t3.
- Fixed specimen entry is populated and both the specimen and paywall are outside `#card-face`.
- Cold mechanism and result-rail offer render as specified.

After R1’s journal-only correction is pushed, verify the new head contains no other delta, re-run `git diff --check`, `npm test`, and GitHub checks, then the audit can close as `Verdict: MERGE`.
