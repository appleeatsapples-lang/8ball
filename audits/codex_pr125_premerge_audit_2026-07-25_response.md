# Codex pre-merge audit — PR #125 (countries centroid strip) — response

- **Date:** 2026-07-25 (verdict pasted back to orchestrator ~16:1x, filed 16:2x)
- **PR:** #125 — `claude/countries-centroid-strip` → `main` (head 7b0e664, base =
  merge-base 7a9de2a)
- **Reviewer:** Codex, cold session. `relay` unavailable locally; the operator ran a
  fresh no-context Codex auditor against the staged packet
  (`~/8ball/audits/codex_pr125_premerge_audit_2026-07-25_PASTE.md`) and pasted the
  verdict back same-day. The auditor made no files, commits, pushes, or merges.
- **Verdict:** **MERGE** — zero findings. Every packet claim independently reproduced.

## Findings

None. (Zero-finding verdict accepted because the checks below actually ran.)

## What Codex independently confirmed (its own commands, cold)

- No shipped code reads `defaultLat`/`defaultLng`, literally or dynamically; no
  production module imports `COUNTRIES` or `getCountryByCode` — production imports
  only `getCountryTimeZoneByCode`.
- Country centroids were never a missing-city-coordinate fallback; missing
  coordinates leave rising unresolved. `core/rising.js`, `core/cities.js`,
  `ui/citysearch.js`, `core/profile.js`, `index.html` are byte-identical
  base↔branch.
- Fixture reconstruction vs `origin/main:core/countries.js`: 276 base rows / 276
  branch rows / 276 fixture entries; 552/552 centroid numbers exact; zero
  missing/extra/malformed/reordered entries; order-and-code parity true; timezone
  map exact.
- The rewired tests exercise real calculations with hard-coded expected values —
  no fixture-vs-itself tautology introduced.
- Byte claim exact: 48,410 → 37,618 bytes (−10,792).
- Suite: branch 1370/1370 (38 files); an independently exported base tree runs
  1369/1369. Local PII audit clean (231 files).
- Boundary reading concurred: `core/countries.js` is calculation-support data, not
  an immutable versioned `content/` batch — in-place edit lawful.
- The in-PR L48 artifact names PR #125.

## Pen notes (orchestrator lane)

Merge-ready as-is; awaiting the operator's explicit merge word (squash convention).
Expected post-merge suite 1370/1370. Once #126 (and its staged fix tests) also
land, the combined expectation is 40 files / 1438+ tests.
