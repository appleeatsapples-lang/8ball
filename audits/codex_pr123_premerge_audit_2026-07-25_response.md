# Codex pre-merge audit — PR #123 (deploy ops-exclusion) — response

- **Date:** 2026-07-25 (verdict pasted back to orchestrator ~16:1x, filed 16:2x)
- **PR:** #123 — `claude/deploy-ops-exclusion` → `main` (head f8e5c48, base origin/main 7a9de2a)
- **Reviewer:** Codex, cold session. The `relay` CLI was unavailable locally, so the
  operator ran a fresh Codex auditor with no inherited conversation context against the
  staged packet (`~/8ball/audits/codex_pr123_premerge_audit_2026-07-25_PASTE.md`) and
  pasted the verdict back the same day. The auditor made no files, commits, pushes, or
  merges.
- **Verdict:** **MERGE WITH FIXES** — 1 Med finding. Fix staged; lands on operator
  word; merge additionally waits for deploy-preview re-verification of the fix.

## Findings and dispositions

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | Med | Delete list incomplete: `README.md` still deploys. Preview check `/README.md` → `200 text/markdown`, 10,913 bytes. It exposes the private authoring path, test/gate internals, agent/audit structure, and Netlify setup (`README.md:7,9-30,32-102`; `netlify.toml:10` omits it). | **FIX STAGED, pending operator word:** append `README.md` to the `[build]` command's `rm -rf` list. Re-verify on the refreshed preview: `curl -sI .../README.md` → `text/html` (SPA rewrite). This row flips to FIXED in the fix commit. |

## What Codex independently confirmed (its own commands, cold)

- Clean branch at f8e5c48 on base 7a9de2a; 2 commits / 2 files / +40 lines;
  `git diff --check` clean.
- Exact build-copy simulation (`git archive HEAD` + the PR's own `rm -rf` list):
  survivors are `.gitignore`, `LICENSE`, `README.md`, `assets/`, `cards/`, `content/`,
  `core/`, `index.html`, `netlify.toml`, `robots.txt`, `sitemap.xml`, `ui/` — every
  runtime root intact; no deleted path is browser-runtime referenced.
- `rm -rf` returns 0 on missing paths and nonzero on a real deletion failure — the
  build fails closed.
- The non-forced SPA rewrite preserves real crawler/asset files; `/netlify.toml`
  itself is host-filtered (`404`), not a surviving exposure.
- `npm test` → 38 files / 1369 passing. `/bin/bash audits/run_local_audit.sh` →
  clean (230 files).
- The in-PR L48 artifact exists, names PR #123, and satisfies the gate predicate.

## Pen notes (orchestrator lane)

- `LICENSE` + `.gitignore` also survive the build copy — inspected, benign (standard
  license text, ignore patterns); intentionally left served.
- L48 discipline holds: no merge until the F1 fix commit lands and the refreshed
  deploy preview re-verifies. One PR per operator word; squash convention.
