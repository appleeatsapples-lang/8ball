# PR-A — Deploy ops-exclusion (deep-clean F1) — 2026-07-25

**Lane:** Claude chat (orchestrator, DC shell) · **Word:** operator "ALL" on the
deep-clean packet (`8ball_deepclean_packet_2026-07-25.md`), collapsing the F1
decision gate to option (b).

## Finding
`netlify.toml` published the whole repo (`publish = "."`) and the SPA rewrite
is non-forced, so Netlify serves real files first. The full ops layer was
world-fetchable on the product domain: `journal.md` (~660KB session journal,
vault paths, ship-gate state), `DOCTRINE.md`, `CLAUDE.md`, `AGENTS.md`,
`8BALL.md`, all of `agents/`, all of `audits/` (incl. `LOCAL_PII_AUDIT.md`),
`tests/`, `scripts/`, `package.json`. Marginal exposure beyond the public
GitHub repo, but it hands the multi-agent playbook to anyone who guesses
`/journal.md` and undercuts the privacy-posture story.

## Fix
Netlify build `command` deletes the ops layer (plus `node_modules`, which
`npm install` would otherwise create once any build command exists) from the
build copy before publish. Repo untouched; L48 CI gate unaffected —
`audits/` stays tracked, it just stops being deployed.

## Post-deploy verification (operator or next session)
- `curl -sI https://the-eight-ball.netlify.app/journal.md` → must rewrite to
  index.html (HTML content-type), not serve markdown.
- Same for `/DOCTRINE.md`, `/audits/RELEASE_CHECKLIST.md`, `/agents/orchestrator.md`.
- `/cards/manifest.json`, `/assets/cities.json`, `/robots.txt`,
  `/sitemap.xml` must still serve.

## L48
Cross-model verdict pending pre-merge (Codex relay via operator). This file
satisfies the audits-artifact gate; it is not a self-certification.
