# Codex pre-merge audit — PR #116 (host 97 catalog card JPEGs at /cards)

- **Date:** 2026-07-22
- **PR:** #116 — `claude/card-jpeg-hosting` → `main`
- **Reviewer:** Codex (gpt-5.6-sol, xhigh) via `relay --models codex --base origin/main`
- **Run:** `~/ai-relay/runs/20260722-050037-8ball/responses/codex.md`
- **Verdict:** **MERGE WITH FIXES** → all four fixes applied (see dispositions) → re-verified green.

## What Codex independently confirmed (ran its own commands)

Codex executed `npm test` and a byte-parity/metadata probe inside the repo:

- `npm test` → **38 files, 1369 tests passing**.
- Fresh re-render vs tracked JPEGs → `same_runtime_byte_mismatches: []` (byte-identical).
- Source shapes/modes: `89× (1920,2880) RGB` + `8× (960,1440) RGBA`; `tagged_sources: []` (no EXIF/ICC on outputs).
- Exact 97-code queue match; all decode as metadata-free RGB **1080×1350**.
- 2:3 fit yields **900×1350** art with **90px** white side padding, **no crop**.
- Static-only change; **CLAUDE.md 37→38 count correct**.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | High | Test asserted only 97 *unique* codes, not the exact queue codes; an off-queue swap would stay green and 404 at fetch time. | **FIXED** — `tests/cards_hosting.test.js` now pins `EXPECTED_CODES` (canonical queue superset, in order) and asserts `manifest.cards.map(code)` deep-equals it. A swapped/off-queue code now fails CI. Update protocol documented in the file header (content_shape / repo_shape pin discipline). |
| 2 | Med | `jpegSize()` trusted the first SOF without validating segment structure; an ~11-byte fake could claim 1080×1350 yet not decode. | **FIXED** — parser now also requires a Start-Of-Scan (0xFFDA) segment and an End-Of-Image (0xFFD9) terminator, and validates every segment length in-bounds; truncated/incomplete files fail. |
| 3 | Med | "Reproducible bytes across machines" overclaimed (Pillow/libjpeg unpinned); `--check` never compared to tracked output. | **FIXED** — docstring softened to "byte-reproducible for a given Pillow/libjpeg build; tracked JPEGs are authoritative." `--check` now re-renders and compares **byte-for-byte** against every tracked `cards/*.jpg` AND against `manifest.json`, exiting non-zero on any drift. Verified: `checked 97 JPEGs … all match tracked bytes`. |
| 4 | Low | Tests ignored manifest `bytes` and did not reject EXIF/ICC/COM markers. | **FIXED** — test now asserts on-disk size == manifest `bytes` (byte-parity) and rejects APP1 (EXIF), APP2 (ICC), and COM (0xFFFE) markers per file. |

## Implementer re-verification after fixes (recorded runs)

```
$ python3 scripts/build_card_jpegs.py --check
checked 97 JPEGs, 6.94 MB total — all match tracked bytes   (exit 0)

$ npm test
Test Files  38 passed (38)
Tests  1369 passed (1369)

$ bash audits/run_local_audit.sh
LOCAL PII AUDIT: clean (226 files scanned)
```

- Acceptance (live deploy preview): `curl -sI https://deploy-preview-116--the-eight-ball.netlify.app/cards/t00_the-fool.jpg` → `200 image/jpeg` (SPA rewrite does not shadow static files).
- Coverage: 97/97 queue codes; 0 missing sources (63 index_library, 26 concordance/cards, 8 x_pipeline specimens). Total added ≈ 6.94 MB, each ≤ 8 MB.

## Posture

No app UI/routes, no tracking, no backend, no new runtime/test deps (DOCTRINE §5). Static files only; new tool `scripts/build_card_jpegs.py` is a build-time asset generator, not shipped code.

**L48 sighting:** Codex verdict recorded above; all findings resolved in-PR before merge. Awaiting operator merge word.
