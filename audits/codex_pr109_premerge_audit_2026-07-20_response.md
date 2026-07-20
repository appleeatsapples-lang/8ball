# PR #109 cross-model audit — response (in-PR L48 artifact)

Dated 2026-07-20. Fresh Codex session via relay (codex CLI 0.144.6, model
`gpt-5.6-sol`, reasoning xhigh) on PR head `e67b444` vs base `ea0bda4`
(post-#108 main), deps seeded so the reviewer executed the suite itself.
Raw run: `~/ai-relay/runs/20260720-130443-relay-pr109-worktree/`.
Single-reviewer pass, reconciled by the Claude lane; the reconciliation
independently re-verified both findings against the helper source.

**VERDICT (Codex): SAFE TO MERGE — zero blockers.** Two non-blocking
findings, dispositioned below.

## Findings + dispositions

- **LOW-1 — `tests/helpers/voice-register.js` — the safelist is
  word-global, not term-keyed.** `voiceRegisterHits('restaurant',
  ['restaurant'])` returns `[]`: a custom term equal to (or contained by)
  a safelist word self-suppresses. **Disposition: DEFER as named
  micro-debt**, per the reviewer's own not-warranted-now remedy note:
  the shipped verb extension has zero overlap with the safelist
  (verified by the reviewer's cross-talk run), the divergence fails LOUD
  (a missed suppression is a false positive, never a silent
  false-green), and the remedy (term-keyed safelist entries + a
  collision sentinel) belongs with any future custom-terms consumer.
- **NIT-2 — helper header overstated "every voice-policy scan routes
  through voiceRegisterHits"** — the framing REs and `BANNED_PATTERNS`
  are voice-policy surfaces with their own regex semantics.
  **Disposition: ABSORBED in-PR at `594ec5e`** — the header now scopes
  the claim to the `BANNED_VOICE_REGISTER`-based scans, matching the
  consumer list beneath it.

## What the reviewer verified

- Suite **1317/1317 (37 files) executed by the reviewer**; old-vs-new
  scan parity confirmed: zero hits on all 14 provenance placards and 9
  atlas legend strings under both the previous inline `.includes()` and
  the routed matcher.
- The default-parameter change cannot alter the five existing
  `voiceRegisterHits` call sites; the parameterized-terms sentinel pins
  the new path (verbs fire, safelist holds under custom tables, verbs
  stay opt-in).
- `ea0bda4` confirmed as the single-parent #108 squash — the closure
  entry's STAGED→SHIPPED flip is factually accurate.
- Protected scope provably empty: no `core/`, `ui/`, `content/`,
  `index.html`, fixture, `repo_shape`, or DOCTRINE edits; `git diff
  --check` clean.
- The gitignored local PII corpus is intentionally absent from the
  isolated review worktree (the #98 precedent); that check stands on the
  implementer lane's clean runs of the same tree.

**Chain state:** the #104/#108 LOW-3 debt (provenance/atlas `.includes()`
forks) closes with this PR — every `BANNED_VOICE_REGISTER`-based scan now
routes through the one matcher. New named micro-debt: term-keyed safelist
(LOW-1 above). Merge remains its own word.
