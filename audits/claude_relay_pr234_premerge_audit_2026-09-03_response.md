# PR #234 pre-merge cross-model audit — reconciled response

**PR:** 8ball #234 — DOCTRINE v0.75: the cards and the og image
regenerated in-repo — the sheet's two depictions can no longer drift
**Base → head:** `05f52b1` → `0832e7b` at audit start; every finding
lands in the reconciliation commit carrying this artifact — no
mid-audit push.
**Process:** DOCTRINE §10 / L48 two-lane adversarial review; per-lane
subdirectories and port bands; both lanes worked from archives/clones
and left the working tree untouched (verified `git status` clean).
Both lanes rendered specimens through their own Chromium driver and
parsed all 331 tracked JPEGs and the og PNG with independent (not
test-trusted) readers.

## Lane verdicts

| Lane | Verdict | Findings |
|---|---|---|
| Lane A | MERGE WITH FIXES | 2 HIGH, 6 MED, 12 LOW/observations; 23 mutants, 16 killed |
| Lane B | MERGE WITH FIXES | 1 HIGH (shared), 2 MED, 3 LOW; 11 mutants, 10 killed |

**Reconciled outcome: MERGE WITH FIXES — the product claim held on
both drives in full (every one of the 331 specimens lands where its
code says, resolves every compartment, carries no name or date; the
og image is achromatic, nine rows, free-era copy; the 280 concordance
and index cards byte-identical; `cards_hosting`'s queue untouched).
The fixes were one real bug in the python side's write path, one
missing tie between the hosted files and a fresh render, and record
precision. All landed. Final call remains with the controller per L48
(no advance authorization covered this pass).**

## The product claims, cleared by driving

- Every specimen JPEG is 1080×1350, q90, ≤ 8 MB, carries no EXIF /
  ICC / COM segment (both lanes walked the segments independently);
  the manifest's byte counts match the files; count 611 and order
  unchanged.
- The og PNG is 1200×630 and every pixel has r == g == b (both lanes
  decoded the PNG independently); it shows the MOON row and no
  sealed hatches; its copy names no price or rung.
- Re-rendering a specimen on the same Chromium build reproduces the
  tracked bytes (Lane A, five codes; Lane B, three codes).
- No `ui/`, `core/` or `index.html` file is touched; `package.json` is
  untouched; the script imports node builtins and the repo only, and
  `--driver` is the only way to a browser.

## Findings and dispositions

**H1 (both, HIGH) — `scripts/build_card_jpegs.py` regrouped the
manifest on write.** The write path emitted its own families first
and appended the carried specimen entries, so the next vault run would
have reordered `cards/manifest.json` against the queue that
`tests/cards_hosting.test.js` pins exactly; its `--check` compared an
unordered subset and would not have noticed. Fixed: one pass over the
queue in queue order (carried entries in place, others rendered), and
`--check` compares the whole ordered manifest against the tracked
one. The script needs Pillow and cannot run here; the edit is
parse-checked and read twice.

**H2 (Lane A, HIGH) — nothing tied the hosted artifacts to a fresh
render.** A registry or template change would have left the tracked
JPEGs stale with every test green. Fixed: `tests/render_cards.test.js`
pins a sha256 digest over the exact HTML of all 331 specimens in
manifest order and over the og HTML, with the re-run instruction in
the test; both digests were computed on the render that produced the
tracked files. A one-pixel template change fails the pin (verified).

**M1 (Lane A) — the manifest note had two owners.** The python side
rewrote it; the JS side rewrote it differently. Now `MANIFEST_NOTE` in
`scripts/render_cards.mjs` is the single owner, the python side carries
the tracked note and `padding_rgb` through unchanged, and the test
pins `manifest.note` to the constant.

**M2 (Lane A) — two stale DOCTRINE sentences.** The v0.72 amendment
and its supersession record both said the two families were "QUEUED
for regeneration (sources off-repo)". Closed with dated markers per
L17 (no words edited in place); the footer records v0.75 and the
changelog carries the line. This makes the PR DOCTRINE-touching, so
this artifact is the mandatory two-lane record.

**M3 (Lane A) — the og art was pinned by three substrings.** Now the
test asserts the og HTML contains `buildCardSVGFromSnapshot`'s own
output over the same snapshot, byte for byte; the stub mutant dies.

**M4 (Lane A) — the domain was tested against itself.** Now pinned to
the literal and to index.html's canonical link and `og:url`.

**M5 (Lane A) — `fs.globSync` sits above the Node 20.19 floor.** Now
`readdirSync` over the browsers directory with an existence check and
a named error.

**M6 (Lane A) — the syllable alphabet was private, so the name test
could not tell a syllable name from a real one.** The three tables are
exported and every name (all 331, plus fifty fresh draws) must
decompose into them; the real-name mutant dies.

**Lane B M1/M2 — the city bound was a no-op against the data as far
as the test could see, and the input test sampled 40 codes.** The
test now checks all 331, asserts `loadCities()`'s length and bound
directly, and proves the raw table reaches past the bound; every
specimen's city must come from the table.

**L1–L12 (Lane A) and Lane B LOWs.** The stripper is an allowlist
(JFIF and the non-application segments survive; every other APPn and
COM is dropped; APP13/APP14 added to the test). `--only` rejects a
bare or `--`-prefixed list and reports unknown codes with exit code 2.
`JPEG_QUALITY` and `CANVAS` are pinned against the manifest.
`rowTitleFor` derives the pair titles from `ROW_TITLES` (one literal
remains: the unresolved-rising grammar, never hit by a specimen).
`_from_roman` / `is_specimen_code` bounded to 1–144. The luma pass's
alpha handling is stated in its comment. The determinism/font clause
is in the script header (the template's first family is DejaVu Sans
Mono; a host without it renders differently). `CARD_DRIVER` is
documented beside `--driver`. `audits/RELEASE_CHECKLIST.md` gains the
re-render step. Visual notes from both drives: the frame was heavier
than the shell's base rule (now 1px in the shell's warm grey), the
pairs wobbled under `space-evenly` (now centred with a fixed gap),
the stack left dead space at the foot (bottom inset 150 → 120); the
set was re-rendered after the template settled.

**Recorded, not fixed:** `product.ci_doctrine_gate` in
`audits/project_audit.py` failed once on Lane A's clone and passed on
re-run there and on every run here — sighting logged, no change made.
During the mutant sweep here a `git checkout` of the renderer reverted
the uncommitted fix batch; it was replayed from the session record and
the digest pin proved the replay byte-identical to what had been
rendered — recorded because it is exactly the failure the pin exists
to catch.

## Reconciled verification (post-fix head)

- Suite 61 files / 2066 tests green; product audit PASS, 0 blocking.
- Mutation re-run against the new pins: the site literal, a row-title
  literal, the stripper keeping APP13, the og art replaced by a stub,
  the city bound widened, the name alphabet widened, a one-pixel
  template change — all killed.
- `cards_hosting`, `monochrome_assets`, `reach_surface` pass on the
  re-rendered files; a specimen and the og were viewed.
- Gates: `l48-gate` was red by design until this artifact; this file
  satisfies it; journal-touch passes (DOCTRINE + journal + audits/).

qualifier: recorded, not certified. Merge authority remains the controller's.
