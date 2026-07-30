# Cross-model pre-merge audit — PR #180

**PR:** #180 — feat(cards): host B-10 batch 3 — 243 extended specimens, 368 → 611 JPEGs
**Branch:** `feat/cards-b10-batch3-243` @ `d6544bc` (forked from `main` @ `1840afa`, 17 behind at audit time)
**Base reviewed against:** `main` @ `219ea96` (post-#186)
**Date:** 2026-07-30
**Auditor:** `relay --base origin/main --models "codex grok" --reconciler claude`, run
`~/ai-relay/runs/20260730-172024-wt180/`. Two independent vendors — Codex (OpenAI)
and Grok (xAI) — reviewed in a dedicated detached worktree **with current `main`
merged in**, so the reviewed diff is exactly what #180 adds to today's `main`.
Reconciliation: `RECONCILIATION.md` in the same run dir.
Brief of record: `~/8ball/audits/codex_pr180_cards_b10_batch3_2026-07-30.md`.

## Verdict

**MERGE WITH FIXES** — one P3 fix applied in-branch (below); the one P1 raised is
**valid but not this PR's regression** and is dispositioned as a separate item.
Merge remains the operator's word.

Vendor verdicts: **Codex MERGE WITH FIXES** · **Grok SAFE TO MERGE** ·
**reconciler MERGE WITH FIXES (trivial), "none are merge-blocking"**. The two
vendors converged on the same two findings and split only on the severity of the
first. That split is resolved below with evidence rather than by preferring a
vendor — and the reconciler, which ran independently of the implementer lane and
of this file, reached the same adjudication on the same evidence. It also recorded
"no hallucinated findings from either side — both are grounded in the actual diff."

**Note on how this artifact was assembled.** The implementer lane read the two
vendor responses and dispositioned them *before* `RECONCILIATION.md` was written
(17:28 vs 17:29). The reconciler's independent agreement is therefore genuine
corroboration, not a source this file is restating — which matters, because
otherwise the lane proposing the merge would be the sole adjudicator of the one
finding it declined to treat as blocking.

## Why this artifact exists

`l48-gate` was **failing** on #180 for a missing
`audits/*_pr180_premerge_audit_*_response.md` while `test` was green — the one
backlog item owed an L48 artifact outright, sitting since 2026-07-29. This is a
genuine two-vendor adversarial pass, not a renamed self-note (§5.5). Neither
reviewer is same-lineage with the authoring lane.

## What was reviewed

243 new card JPEGs under `cards/`, the regenerated `cards/manifest.json`
(368 → 611 entries), the rewritten `tests/cards_hosting.test.js`, and one
`CLAUDE.md` inventory line. 246 files, +1325/−61.

## Findings and disposition

### F1 — external URLs are not actually pinned · Codex **P1**, Grok **P3 residual** → **ACCEPTED as valid, NOT blocking for #180; filed forward**

`tests/cards_hosting.test.js:237-244` pins the ten off-site codes **exactly**
(`expect(external.map(e => e.code)).toEqual([...EXPECTED_EXTERNAL])`) but checks
each URL only for shape:

```js
expect(typeof url, `${code}: url must be a string`).toBe('string');
expect(url.startsWith('https://'), `${code}: url must be https`).toBe(true);
```

So a typo'd, rotated, 404 or wrong-card URL stays green, `image_url_for()` serves
a dead CDN link, and the surface stalls on that slot with no ledger row. The
defect is real and both vendors found it independently. `--check` also never
re-compares the `external` block.

**Why it does not block #180, established by executed evidence, not judgment:**
#180 does not touch this surface at all.

- `git diff origin/main...origin/feat/cards-b10-batch3-243 -- tests/cards_hosting.test.js`
  filtered for `startsWith` / `EXPECTED_EXTERNAL` / `external` returns **nothing** —
  the assertion and the pinned external list are byte-untouched.
- The manifest's `external` block is **byte-identical** across the two refs:
  `sha256(external)` = `2a15cbab8f81699b…` on both `origin/main` and the PR head,
  `external_count` = 10 on both.

The gap is inherited from the #136-era design (Grok classes it "same class as #136
P1 residual"), and #180 neither introduces nor widens it. Blocking this PR on it
would hold 243 lawful card renders hostage to a pre-existing condition on a
different code path. **Disposition: valid finding, wrong PR.** It wants its own
change — pin full `{code, url}` objects in `EXPECTED_EXTERNAL` and have
`build_card_jpegs.py --check` assert `external` and `external_count` equality —
and it is recorded here so it cannot be lost by being declined.

**Reconciler's independent adjudication of the same split** (`RECONCILIATION.md` §2):
"grok is right to deprioritize it for *this* PR… I verified the
`startsWith('https://')` check is byte-identical to what's already on `origin/main`
— this PR adds zero lines to that block. It's real technical debt… but it's not
something this diff introduces or worsens, so it shouldn't gate *this* merge."
Arrived at separately, from the same byte-identity evidence.

**Codex's residual point is retained and is the sharper version of it:** the test
pins an in-repo snapshot of queues that live *outside* the repo, so green CI
cannot prove those queues haven't gained a code. Internal manifest consistency can
still conceal an effectively unhosted queued card. That is a standing limit of
this guard, worth stating in the record rather than fixing here.

### F2 — stale count in the test's own comment · both vendors **P3** → **FIXED in-branch**

`tests/cards_hosting.test.js:41-42` still read "covers all **298** queued codes,
not just the **288** rendered ones". Post-batch the true totals are **621 = 611
rendered + 10 external**. Verified by direct inspection, not taken on the
reviewers' word. A next editor treating 298 as the corpus size would
under-update the pins while CI stayed green on a wrong mental model — the exact
failure mode this comment block exists to prevent.

Fixed in this branch: the numbers now read 611 / 10 / 621.

**Codex was factually wrong on half of its own F2.** It cited `CLAUDE.md:138` as
stale alongside the test comment; that line is not stale — #180's own diff *is* the
`368 → 611` bump. The reconciler ruled the same way and named it plainly
(`RECONCILIATION.md` §2: "grok is factually correct, codex is wrong on this point…
line 138 was already bumped 368 → 611 *in this PR*"). Recorded because an L48
artifact that launders a reviewer's error into the record is worse than no artifact:
a later lane would go looking for a stale `CLAUDE.md` line that does not exist.

### F3 — inventory scope · Grok **P3** → **CONFIRMED clean, no action**

`CLAUDE.md:138` is the only tracked doc carrying a live card count.
Independently re-derived: `git grep` for `368` across tracked `*.md` / `*.js` /
`*.json` (excluding the manifest) returns only `assets/cities.json`, a hex SHA
inside `audits/fixtures/hko_calendar_authority_1901_2100.json`, and a historical
audit response — no second live inventory. `8BALL.md` and `README.md` carry no
card count. Historical journal and audit numbers (97 / 288 / 368) are
release-log and immutable evidence, not stale inventory.

## What both vendors agreed on, and the implementer lane confirmed separately

**No coverage was traded for green.** The executable assertions are identical
before and after: 1 `describe`, 4 `it`, 11 `expect` on both sides; the ordered
exact pin `expect(codes).toEqual([...EXPECTED_CODES])` survives untouched. The
only executable change is the uniqueness literal `368 → 611`
(`tests/cards_hosting.test.js:232`) and the +243 entries in the `EXPECTED_CODES`
data list. The pin is **strengthened** — 243 more codes are now held to exact
order and identity.

**The bookkeeping is test-enforced, not prose:** `count` ↔ `cards.length`,
`external_count` ↔ `external.length`, ordered bijection with disk, set size 611,
union size 621, and "no local JPEG exists for an external code" are all
asserted at lines 229–247.

**No leak.** No PII, operator handle, sibling-project vocabulary, product name or
link in the new codes, filenames, manifest fields or sources; Codex also ran an
OCR sweep over the 243 new JPEGs and found none. The year suffixes in
`spec_extended_*-YYYY` codes are specimen identifiers, not a labeled DOB. External
host remains `assets.postpeer.dev`.

**No doctrine surface touched:** no runtime dependency, no `fetch()`, no
analytics, no new `localStorage` key; `index.html` untouched at 1491 lines.

## State verified by the implementer lane (executed, this session)

| Check | Result |
|---|---|
| All 611 JPEGs 1080×1350, ≤8 MB | 611/611 exact, 53–100 KB, 51 MB total, 0 off-spec |
| Manifest ↔ disk | 611 unique codes, exact bijection, 0 manifest-only, 0 disk-only |
| `external` disjointness | 0 overlap with `cards`, 0 overlap with disk |
| Manifest `bytes` ↔ disk | 0 mismatches |
| PNG sources resolve | 611/611 on the operator machine |
| Suite, with current `main` merged | **48 files / 1657 tests green** |
| `product-audit` (never ran on this PR's own CI) | **PASS** — 12 pass / 0 fail / 1 warn / 1 skip, 0 blocking, exit 0 |
| Auditor assurance suite | 93 tests OK |
| `index.html` | 1491 / 1500 |

`scripts/build_card_jpegs.py --check` could **not** be run: Pillow is not
installed under any `python3` on this machine, so byte-level re-render equality is
**unverified** here. Stated as a gap rather than papered over. The 1080×1350 /
byte-size / bijection properties above were verified directly from the JPEG SOF
headers without Pillow.

The `warn` is a dirty working tree (this audit worktree's own `node_modules`
symlink) and the `skip` is the gitignored operator-local PII fixture — both
environment artifacts, neither a defect in #180.

## Merge preconditions (none of them satisfied by this artifact alone)

1. **Rebase.** The PR is `CONFLICTING / DIRTY`, 17 commits behind `main`. Exactly
   one conflict: the `CLAUDE.md` repo-shape block, where #186 rewrote the
   `scripts/` and `.github/` lines while #180 edits the `cards/` line. Resolution
   is mechanical — take `main`'s `scripts/` + `.github/` lines and #180's `cards/`
   611 line. Verified locally: after that resolution the tree is green as tabled
   above.
2. **Operator merge word.** A clean L48 disposition is not a merge word (§10).

## Honest limits of this audit

- No live-fire pass: this change ships no UI, so there is nothing to render. The
  deploy preview on the PR (`deploy-preview-180`) is green and Codex/Grok both
  note the prod SPA returns 200 HTML for a *missing* card, which makes a bare
  `HEAD` probe a false positive — reachability of the 243 new files on the
  deployed site is therefore **not** proven by this artifact.
- `--check` re-render equality unverified (no Pillow), as stated above.
- Codex's context was compacted mid-run; its findings were re-derived against the
  file by the implementer lane before being accepted here, and both accepted
  findings were confirmed by direct inspection rather than trusted. One of its two
  findings was half wrong (F2 above), which is the reason for that policy.
- The reconciler is **Claude**, i.e. same lineage as the implementer lane. It
  adjudicates between two non-Claude vendors and corroborates their reads, but it is
  **not** the source of cross-model independence here — Codex and Grok are. Stated so
  the artifact cannot later be read as claiming more independence than it has.
- The reconciler's own process note is correct and now satisfied: at review time this
  artifact "wasn't found in the diff" because it did not exist yet. It does now, and
  the PR still needs a push before `l48-gate` can see it.
