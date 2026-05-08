# 8ball journal

Append-only. Newest entry at the top. Same shape as SIRR's `journal.txt` so the muscle memory carries across.

=====
2026-05-08 · v0.1.4 in-flight — Phase-2D dispositions
=====

In-flight notes captured during the Phase-2D branch (`v0.1.4-phase2d-concern-dispositions`). Pre-merge artifact; chat authors the full v0.1.4 release entry post-merge and may supersede this block.

## §2 banned-voice-register — calibration fix landed

Initial substring scanner (commit 1cad9de) flagged three lines; review showed two false positives where the locked term `aura` matched inside `restaurant`:

- `taurus`: "someone who takes 20 minutes to leave a restaurant" — false positive, **restored**.
- `libra`: "unable to choose a restaurant or a stance" — false positive, **restored**.
- `lp33`: "tired in a way that sounds spiritual" — true positive (voice-register adoption), **cut stands**.

Scanner amended to start-anchored word-boundary regex (`\b<term>`, case-insensitive) — preserves inflections at end (`auras`, `manifesting`, `sacredness`, `channels`) while preventing leading-substring collisions inside unrelated English words. Locked word list unchanged.

Net pool changes vs `060cc0f` baseline: `taurus` 10→10, `libra` 10→10, `lp33` 6→5.

## §13 immutability hash check — deferred

§13 immutability hash check on `content/traits.v1.js` and `content/templates.v1.js` deferred to post-Phase-2F. Phase-2F retires both files in favor of `content/cards.v1.js`. Auditing files about to be retired is wasted work.

=====
End of 2026-05-08 · v0.1.4 in-flight notes.
=====

=====
2026-05-08 · v0.1.3 — Phase-2B doctrine consolidation shipped
=====

## What shipped

- **PR #2 squash-merged** as `708735d` on main. Three feature-branch HEADs collapsed into one commit (`b74ef70` Phase-2B substance + `875596b` corrective + `32c8995` corrective #2). Live at `https://the-eight-ball.netlify.app/` with HTTP 200 and `<title>8 ball</title>` confirmed.
- **§1, §2, §9 substance rewritten.** §1 reframed from surface-narration ("interior never named") to positive-shape product description (deck product tied to name+DOB; cards openly reference symbol systems). §2 second bullet drops "no mention of zodiac/numerology/astrology" sub-clause. §9 narrowed to SIRR-boundary code corollary, heading renamed "The SIRR boundary," wording amended to cite `DOCTRINE_ALLOW` allow-list as the actual enforcement.
- **§4 restructured for post-pivot content.** New bullets: no medical/diagnostic framing, cultural-symbol respect, universal floor. "Versioned, not edited" generalized from "trait pools and templates" to "shipped content batches." Heuristic line generalized to format-agnostic "if a line lands but you can't tell..." Voice-register bullet was authored, audited as cards-vs-existing-pool FAIL, then surgically removed in corrective #2 (Phase-2F will restore it with the cards-specific register decided at design time).
- **§4 carve-out cuts.** Six lines cut from existing pool: `templates.v1.js` lost "the chart agrees" / "the universe says" (§2 mystical) and "today diagnosis" / "symptoms detected" (§4 diagnostic); `traits.v1.js` lp11 lost "a mystic with anxiety" / "astral-projecting to avoid eye contact" (§2 mystical). `TEMPLATES_NO_QUESTION` 18→15, `TEMPLATES_MAYBE` 8→7, `lp11` 6→4. No replacements; Phase-2F authors the new content layer.
- **`audits/run_local_audit.sh` POSIX fix.** `mapfile` (bash 4+) replaced with `while IFS= read -r ... done` loop. Verified clean exit 0 under macOS bash 3.2.57. §8 and §11 enforcement surfaces now actually fire.
- **Inbound cleanup.** `README.md:5` trailing "(see DOCTRINE.md §9)" stripped; `8BALL.md:33` trailing "depth is the trick; the trick is hidden by design" stripped; `tests/pii_scan.test.js:69` comment updated to "SIRR boundary rule."
- **Tests:** 32/32 green at `708735d`. Local audit clean (21 files scanned).

## Cross-model audit

Five-audit Phase-2 sequence completed:

- Audit 1 at `2876385` — 1 PASS / 6 CONCERN / 6 FAIL (baseline; doctrine confirmed aspirational).
- Audit 2 at `3e6d71a` — 4 PASS / 6 CONCERN / 3 FAIL (Phase-2A patch; §4/§7/§11 closed).
- Audit 3 at `b74ef70` — 2 PASS / 5 CONCERN / 6 FAIL (Phase-2B substance; three regressions: §4/§8/§11. Doctrine ahead of code surfaced.)
- Audit 4 at `875596b` — 4 PASS / 7 CONCERN / 2 FAIL (corrective; §2/§8/§9/§11 closed; §4 still FAIL on cards-vs-existing-pool tension).
- Audit 5 at `32c8995` — **5 PASS / 7 CONCERN / 1 FAIL** (corrective #2; §4 closed via voice-register-bullet drop; merge gate cleared).

Cleanest baseline regression check vs `3e6d71a`: §2 IMPROVED, §9 IMPROVED, all others UNCHANGED. The remaining FAIL is §1 (doctrine says deck, engine ships roast) — known-tradeoff bound to Phase-2F. Closure condition: 2F engine flip.

## Lessons

**L16 — Doctrine ahead of code is the inverse failure of aspirational doctrine; both produce the same audit verdict.** L10 named "aspirational doctrine — rules whose enforcement doesn't exist" as the most expensive doctrinal debt. Phase-2B initially produced its mirror image: rules whose code-implementation doesn't exist *yet*. The verdict shape is identical (rule-says-X-but-code-does-Y), but the disposition differs: aspirational drift has no firing condition; doctrine-bound-to-queued-phase does. The §1 FAIL is the latter — bound to Phase-2F's engine flip. The §4 voice-register FAIL initially looked like the former and was surgically removed; what survived is the constraint-shaped substance that applies to any content layer.

**L17 — §-numbering preservation under substance rewrite is a doctrine virtue, not laziness.** The Phase-2B brief decision to keep §1/§2/§9 numbers and replace substance saved ~6 cross-reference edits across `8BALL.md`, internal `DOCTRINE.md` references, and `tests/pii_scan.test.js`. Numbering stability lets people hold §-numbers in muscle memory across sessions; substance is editable, numbers shouldn't be unless retiring entirely.

**L18 — Audit-binds-to-HEAD with dual-baseline delta lines is the structural fix for multi-cycle work.** Five audits in series, each binding to a specific HEAD, with verdicts compared both to the immediate prior (`b74ef70` was a regressed state) AND to the cleanest baseline (`3e6d71a`). The merge gate ("zero regressions vs cleanest baseline") gives a stable reference point even when the immediate-prior state is regressed. Without dual-baseline tracking, the b74ef70 → 875596b transition would have looked like "improvement" because b74ef70 was so bad — but vs `3e6d71a` it had a fresh §4 regression that needed closing. The discipline correctly identified and required closing the regression before merge.

## Open items / next session queue

1. ~~Phase-2A v0.1.2 patch~~ ✅ shipped at `f52345f`.
2. ~~Phase-2B doctrine consolidation~~ ✅ shipped at `708735d` (this entry).
3. **Phase-2C — §7 deploy-gate wiring.** Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle + GitHub required-check.
4. **Phase-2D — CONCERN dispositions** for §3 (no 33 fixture), §5 (no static gate against new storage/fetch), §8 (release ritual operator-only), §10 (lanes procedural not enforced), §12 (out-of-scope partial enforcement), §13 (Friday rule-kill not yet fired). Each gets enforcement-added or rule-amended-to-match-reality or rule-killed.
5. **Phase-2E — card system design.** Aesthetic concentration. Locked constraint: monochrome / grayscale, no color hues. Open question: strict two-tone vs grayscale-permitted (default grayscale-permitted). Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`.
6. **Phase-2F — card system implementation.** Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. Closes the §1 FAIL. CC lane.
7. **Cleanup: shadow Netlify project.** Two Netlify deploys connected to the repo (`the-eight-ball` ✓ canonical; `enchanting-bonbon-2b5064` ✗ shadow). 8BALL.md §2 says one. One-click delete in Netlify dashboard. Add to 2D dispositions.
8. ~~Bash-3.2 fix for `audits/run_local_audit.sh`~~ ✅ shipped this PR (`875596b`).
9. **Live-fire testing on the post-corrective pool.** Optional — likely retired by 2F's content-layer flip. Worth one round if the operator wants to see what survived the cuts.
10. **Branch cleanup.** `v0.1.3-phase2b-doctrine-consolidation` still on origin and local. Decision deferred to operator: keep as audit-trail or `git push origin --delete` (audits already preserve the three HEADs, so deletion is safe).

=====
End of 2026-05-08 · v0.1.3 entry.
=====

=====
2026-05-08 · v0.1.2 — §4/§7/§11 patch shipped
=====

## What shipped

- **PR #1 squash-merged** as `f52345f`. Single commit on `main` collapsing the prior agentic-tooling change (`58e5ffa`, never pushed to origin/main as a separate commit) with the Phase-2A patch (`3e6d71a`). Live at `https://the-eight-ball.netlify.app/` within ~70 seconds of merge per Netlify's `cache-status: fwd=miss` + `age: 0` on first post-merge fetch.
- **§4 — two violating trait lines cut** from `content/traits.v1.js`: a Sagittarius line invoking sexual-assault framing and an Ox line invoking mental-health-diagnostic framing. Both failed §4's literal "if you can't tell, it crosses" test; both lived in production between v0.1.0 and v0.1.2.
- **§4 safety-patch carve-out added.** Locked-decision #9 (immutable v1 pools) protects against silent flavor drift, NOT against doctrine-rule violations caught post-ship. Codex loophole-check confirmed the carve-out wording does not admit taste-cuts ("constrained to actual §4 violations and requires journal/diff doctrine notes").
- **§7 reality alignment.** Doctrine previously claimed CI gates the deploy; in fact Netlify auto-deploys on push to `main` while CI runs in parallel. §7 now describes that gap explicitly and queues required-check wiring for the first-traction milestone.
- **§11 PII regex tightened** from `[^a-z]{0,40}` to `.{0,40}` — JSON-shaped occurrences (label + alphabetic text + `YYYY-MM-DD`) now caught.
- **§11 narrower allow-list** (`LABELED_DOB_ALLOW`) for the labeled-DOB rule specifically: excludes `journal.md`, `8BALL.md`, `README.md`. Doctrine docs can NAME the leak class without REPRODUCING example shapes.
- **Journal v0.1.0 entry sanitized.** Bullet describing the labeled-DOB leak rewritten to describe the leak class without reproducing the label string or the date. Sanitization note added at the top of the v0.1.0 entry.
- **`audits/LOCAL_PII_AUDIT.md` placeholder-ized.** Illustrative DOB block now uses bracketed placeholders matching the convention already used for names and identifiers in the same block.
- **Test DOBs shifted.** `tests/profile.test.js` engine and banned-pattern tests now use `2000-01-01`. Codex confirmed `2000-01-01` produces a valid synthetic profile (Capricorn, Rabbit, LP4) and the changed tests still exercise their original engine/content code paths.
- **Tests:** 32/32 green at HEAD `3e6d71a` (pre-merge); same at `f52345f` post-merge.

## Cross-model audit

Codex re-audit of HEAD `3e6d71a` returned **4 PASS / 6 CONCERN / 3 FAIL**, deltas from prior `2876385` audit:

- §4 FAIL → PASS (RESOLVED)
- §7 FAIL → PASS (RESOLVED)
- §11 FAIL → PASS (RESOLVED)
- §1, §2, §9 FAILs unchanged (intentionally untouched in 2A; retiring in Phase-2B via product pivot)
- All CONCERNs unchanged
- Zero regressions

Full re-audit at `~/Desktop/8ball/audits/codex_reaudit_2A_2026-05-08.md`. Brief that produced it pinned to HEAD `3e6d71a` per the audits-bind-to-a-specific-HEAD principle locked at start of session.

## Lessons

**L13 — Audits bind to a specific HEAD.** The Codex audit at `2876385` remained valid for `58e5ffa` because `58e5ffa` didn't touch any audited path. The next HEAD (`3e6d71a`) DID, so a re-audit was structurally required. Verifying the equivalence (or non-equivalence) is a 2-second `git diff --stat` that protects against weeks of drift. Treat this as a default discipline before reusing any audit verdict past its pin.

**L14 — Office work is a real failure mode and the orchestrator is the right place to absorb it.** Three new operator-side defaults landed this session: (a) auto-pbcopy briefs to clipboard, (b) Claude saves tool outputs to disk while the operator only pastes content into chat, (c) Claude reformulates terse/typo'd operator directives into self-briefs before acting. Each one removed a friction point that previously generated drift. The principle generalizes: any procedural step the orchestrator can do via tools, the orchestrator should do.

**L15 — The two-audit cycle works exactly as designed.** First audit at `2876385` returned 6 FAILs, exposing aspirational doctrine. Patch authored, second audit at `3e6d71a` returned 3 FAILs, all in the cluster intentionally retired in the next phase. The structure correctly distinguished "tighten what fails" from "retire what doesn't fit," and gave a structural diff (verdicts changed vs. unchanged) as the merge gate, not operator vibes.

## Open items / next session queue

1. **Phase-2B** — doctrine consolidation. Retire §1/§2/§9 (the surface-narration cluster being dissolved by the roast→deck product pivot). Rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition). Revisit §10's "v1 immutable" rule under format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
2. **Phase-2C** — §7 deploy-gate wiring. Currently doctrine-correct ("not gated, acknowledged"); flip to actually-gated when traction warrants. One Netlify console toggle.
3. **Phase-2D** — CONCERN dispositions for §3, §5, §8, §10, §12, §13. Each gets enforcement-added or rule-amended-to-match-reality or rule-killed. Friday rule-kill review per §13 is the natural moment.
4. **Phase-2E** — card system design. Aesthetic concentration. **Locked constraint:** monochrome / grayscale, no color hues. Captured at `~/Desktop/8ball/sessions/phase_2e_aesthetic_constraints.md`. Open question still: strict two-tone vs. grayscale-permitted (default is grayscale-permitted unless operator says "strict").
5. **Phase-2F** — card system implementation. Engine + UI rewrite, content layer pivot. Retires `content/traits.v1.js` and `content/templates.v1.js`. Adds `content/cards.v1.js` + `assets/cards/`. CC lane.
6. **Bash-3.2 fix for `audits/run_local_audit.sh`.** Script uses `mapfile` (bash 4+); breaks on macOS default bash 3.2. Run-around: this session executed the audit logic inline via Desktop Commander, so the §8 ritual local-audit gate was effectively run against `3e6d71a` and returned 0 hits. Fix: rewrite the `mapfile` line to a POSIX `while read` loop. Single-file shell-script edit, chat-lane authority. Land in next housekeeping PR.
7. **`8BALL.md §10`** updated this session to reflect v0.1.2 SHIPPED state. Done as part of this entry's commit.

=====
End of 2026-05-08 · v0.1.2 entry.
=====

=====
2026-05-08 · doctrine audit triage + product pivot — Phase-2 scoped
=====

Not a version bump. No code shipped. State changes captured for provenance.

## What happened

First execution of §10 multi-model lanes. Two artifacts saved to `~/Desktop/8ball/audits/`:

- `codex_doctrine_audit_2026-05-08.md` — full Codex response. **1 PASS / 6 CONCERN / 6 FAIL** out of 13 numbered rules. Brief expected 9–11 PASS, 0–1 FAIL on first audit. We are dramatically off that mark. Per the brief's own acceptance criteria: *"If FAIL count is higher than 1, the doctrine was written aspirationally; tighten or kill the failing rules before adding more."*
- `chatgpt_v2_brief_meta_review_2026-05-08.md` — ChatGPT response. NOT what queue item #4 specified. ChatGPT returned brief-design meta-review instead of v2 trait pool draft. Likely cause: brief's step 5 ("paste traits.v1.js after the prompt") was skipped at relay time, leaving ChatGPT no source content to audit. Useful as brief feedback; not the artifact intended.

## Codex FAILs — disposition

**§1 / §2 / §9 (surface-narration cluster) → retire via product pivot.** Doctrine says the calculation interior must never be named in the product. README:5 explicitly names "sun sign, Chinese zodiac animal, and numerology life path" in the same sentence that links to §9. About modal in `index.html` says "loosely informed by the date you were born and a couple of derived numbers." The doctrine and the violation lived in the same paragraph — characteristic aspirational-rule shape. Pivot decision (see below) makes these rules obsolete rather than amends them.

**§4 → fix-now patch (v0.1.2) + safety-patch carve-out.** `content/traits.v1.js` `ox` array contains "someone whose stubborn is technically a personality disorder" — invokes mental-health framing as roast target. Adjacent finding (Codex pool-scan missed; orchestrator caught while verifying the §4 evidence): `sagittarius` array contains "someone whose honesty is technically assault" — uses sexual-assault framing as roast mechanic. Both fail the doctrine's literal "if you can't tell, it crosses" test. Both lines cut. Stress-tests locked-decision #9 (immutable v1 pools). Disposition: add a §4 safety-patch carve-out — *immutability protects against silent flavor drift, not against doctrine-rule violations caught post-ship.*

**§7 (CI doesn't actually block deploy) → fix-now or amend-doctrine.** Doctrine claims CI green is required to deploy. Reality: Netlify publishes `.` on every push to main with no GitHub Actions status check. Either configure Netlify GitHub-Actions-required-check (operator setting; no code change), or soften §7 to "CI is green before merge to main; deploy auto-runs on main." Pick one.

**§11 (PII rule) → fix-now (both halves), v0.1.2.** Two issues: (a) the v0.1.0 entry below in this same journal describes the leak by quoting the labeled-DOB shape it removed, and the PII scanner allow-lists `journal.md`, so the leak survives in tracked content under the scanner's nose; (b) the labeled-DOB regex only catches label-before-date shapes with no alphabetic text between them, missing JSON-shaped occurrences. Fixes: rewrite the v0.1.0 entry to describe the leak class without reproducing the shape, tighten the regex, narrow the `journal.md` allow-list.

## Codex CONCERNs — logged

- **§3:** master numbers 11 and 22 in fixtures, 33 missing. Regression dropping 33 preservation would pass current gate. → add 33 fixture in next refresh.
- **§5:** no automated gate against new localStorage keys, fetch() calls, or analytics injections. → add static scan for forbidden API surfaces.
- **§8:** release ritual is operator vigilance only, no hard pre-merge gate. → known structural property; defer until friction shows real cost.
- **§10:** lanes documented, no automated enforcement that doctrine amendments pass through Codex. → consider PR template requiring lane-tag.
- **§12:** out-of-scope items have no automated gate. → static scan covers some (fetch presence); full coverage requires PR-level review discipline.
- **§13:** Friday rule-kill review has not fired (rule was created today). → first review scheduled at first Friday post-creation.

Per brief acceptance criteria: CONCERNs that recur in next audit escalate to FAIL.

## Product pivot: roast → designed deck

Triggered by §1/§2/§9 cluster being structurally unfixable as written. Operator decision: shake → truth tied to (name, DOB) lands as a card from a **fixed designed deck**. Declarative-observational voice, strengths-and-weaknesses framing, explicitly materialistic-aesthetic in essence by design. Roast voice retires. The trick is no longer hidden; the calculation IS the product.

This dissolves §1/§2/§9 cleanly (nothing left to deny) and transforms §4 (the violating prose lines die when format changes; §4 needs a successor for card content). §7 and §11 are independent of the pivot and still need fixing.

Pivot is decided, not implemented. Implementation is Phase-2.

## Phase-2 scope

Brief's own rule binds: when FAIL > 1, tighten or kill failing rules before adding more. So:

- **2A. v0.1.2 patch.** §4 safety-patch carve-out + cut both violating trait lines + §11 PII regex tightening + journal v0.1.0 rewrite + journal allow-list narrow. Multi-file → CC lane.
- **2B. Doctrine consolidation.** Retire §1/§2/§9; rewrite §4 for card content (no medical/diagnostic framing; cultural-symbol respect if cards draw from any tradition); revisit §10's "v1 immutable" rule given format pivot. Codex re-audit before merge. Target: 9+ PASS, FAIL ≤ 1.
- **2C. §7 deploy-gate alignment.** Wire Netlify required-check, or amend doctrine. Operator decision.
- **2D. Rule-without-enforcement CONCERNs (§5, §8, §10, §12).** Each gets one of: enforcement surface added, rule amended to match reality, or rule killed. Friday rule-kill review per §13 is the natural moment.
- **2E. Card system design.** Schema, sample cards, full deck. Where "aesthetic and taste" lives. Independent of doctrine work; can run parallel.
- **2F. Card system implementation.** Engine + UI rewrite. Retire `content/traits.v1.js` and `content/templates.v1.js`. Add `content/cards.v1.js` + `assets/cards/`. Fixtures update. CC lane.

ChatGPT v2 trait expansion is **paused indefinitely** — pivot retires trait pools.

## Tooling provisioned this session

- `CLAUDE.md` at repo root — CC entry point, lane discipline, command list, don't-do rules. CC v2.1.42 verified (predates auto-memory v2.1.59+; static-CLAUDE.md path matches project's append-only discipline anyway).
- `AGENTS.md` at repo root — cross-tool role-routing gate (the open-standard format auto-read by Codex / Cursor / Aider / Windsurf / Zed). Tells any agentic tool that lands here to identify role per §10 before modifying anything.
- Both untracked, pending clean commit alongside this journal entry.

No `.claude/` or `.codex/` subdirectories scaffolded. Per Anthropic and OpenAI docs, "small and stable, add modular config when friction shows real cost." Not adding empty config files preemptively.

## Lessons

**L10 — A doctrine that fails its own first adversarial audit at FAIL=6 is honest but unfit-for-purpose.** §10 lanes did exactly what they were built to do: a different model with a different bias profile read the doctrine literally and found drift the authoring instance could not see. The lesson is not that the doctrine is broken. The lesson is that aspirational rules masquerading as enforced rules are the most expensive kind of doctrinal debt — cheap to write, hard to retire, structurally invisible until something forces a literal read.

**L11 — Lane-relay completeness is the soft failure mode.** The ChatGPT v2-traits brief failed-soft because a paste step was skipped at relay. The model defaulted to brief-critique rather than refusing or asking for the missing input. The lane existed; the relay didn't carry. Brief should be amended to require source-content paste before any output, or relay step should include a checklist confirming all paste-targets are filled before send.

**L12 — Live-fire of the discipline beats hypothetical critique of it.** While provisioning `CLAUDE.md` this session, the PII scanner caught a home-directory file path that contains operator first name as a word. The right move was visible immediately: fix the new file rather than widen the allow-list — exactly the drift pattern Codex flagged in §11. Same scanner, same allow-list, same drift surface, fired on a fresh case and resolved correctly. The discipline working in real time on a real artifact is worth more than ten audits of how the discipline *should* work.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo~~ ✅
2. ~~Pick + reserve subdomain~~ ✅
3. ~~Hex-overflow fix~~ ✅
4. ~~Codex doctrine audit~~ ✅ done; triaged in this entry.
5. **ChatGPT v2 trait audit — PAUSED INDEFINITELY** (pivot retires trait pools).
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: bootstrap-table update in personal preferences file (carried from v0.1.1 queue).
8. **Phase-2A: v0.1.2 patch** — §4 carve-out + violating trait lines cut + §11 PII fixes + journal v0.1.0 rewrite. Single PR. CC lane.
9. **Phase-2B: doctrine consolidation** — retire §1/§2/§9; rewrite §4 for card content; revisit §10 immutability rule under pivot. Codex re-audit before merge.
10. **Phase-2C: §7 deploy-gate alignment** — wire Netlify required-check, or amend doctrine.
11. **Phase-2D: rule-without-enforcement CONCERNs** — enforcement, amend, or kill for §5, §8, §10, §12.
12. **Phase-2E: card system design** — schema, sample cards, full deck. Aesthetic concentration.
13. **Phase-2F: card system implementation** — engine + UI rewrite, content layer pivot.
14. Codex re-audit on consolidated doctrine. Target FAIL ≤ 1.
15. Question classifier rework — independent, can run anytime (likely retired by pivot).
16. Brief amendment: require source-content paste verification at send-time (or kill if pivot retires the whole brief).
17. Candidate fifth lane: Grok. Provisioned on operator's machine. Role TBD post-pivot — possible cold-reading-sniff auditor for card content. Provision when card content exists for it to review.

=====
End of 2026-05-08 · doctrine audit triage entry.
=====

=====
2026-05-08 · v0.1.1 — hex-overflow fix + multi-model lanes activated
=====

## What shipped

- **Hex-window overflow fix.** Live screenshots from the operator showed long answers clipping the hexagonal display (top, sides, bottom — "PLOT TWIST" cut off, "...HEN YO DECIDED" cut off). Two-layer fix:
  - Engine: `generateAnswer()` now soft-caps at 120 chars. Re-rolls up to 12 times to find a fitting candidate; returns a length-clean fallback if 12 fail.
  - UI: dynamic font-size scaling on `.answer` based on text length (default / `size-medium` for 60+ / `size-small` for 90+). Default size lowered slightly to give a baseline buffer.
- **Test added** for the soft cap: 1000 generations must produce <5% over-cap. Currently passing comfortably.
- **Multi-model lanes activated** — first real handoff briefs written and saved to `~/Desktop/8ball/audits/`:
  - `chatgpt_brief_v2_traits.md` — paste-ready prompt for ChatGPT to (a) audit v1 trait pool against §4, (b) flag flavor-repeats, (c) propose ~168 v2 expansion phrases.
  - `codex_brief_doctrine_audit.md` — paste-ready prompt for Codex to audit DOCTRINE.md §1–§13 against the actual code, with PASS/CONCERN/FAIL verdicts per rule and 9 named scrutiny points.
- **Tests:** 32/32 green.

## Lessons

**L8 (new) — The doctrine that documents lanes but doesn't activate them is doctrine that doesn't fire.** v0.1.0 documented §10 lanes. v0.1.1 actually used them. Documenting without activating is exactly the recursion-fires-through-orchestrator failure mode §13 names.

**L9 (new) — Live screenshots beat synthetic test cases.** The hex-overflow bug was invisible in unit tests because no test checked rendered visual integrity. Operator's real-use screenshots surfaced it in one minute. Add to release checklist: shake live URL N times before declaring v.x done.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. ~~Hex-overflow fix~~ ✅ v0.1.1 ships in this commit.
4. Operator: paste `~/Desktop/8ball/audits/chatgpt_brief_v2_traits.md` into ChatGPT.app. Save response back to `~/Desktop/8ball/audits/chatgpt_v2_trait_review_<date>.md`.
5. Operator: paste `~/Desktop/8ball/audits/codex_brief_doctrine_audit.md` into Codex.app. Save response back to `~/Desktop/8ball/audits/codex_doctrine_audit_<date>.md`.
6. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
7. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
8. Trait pool v2 — incorporate ChatGPT review per item 4.
9. Doctrine fix-ups — incorporate Codex audit per item 5.
10. Question classifier rework.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1.0 build session — PII leak found mid-build, patched, discipline added pre-ship
=====
> **Sanitization note (v0.1.2):** the "What shipped" bullet describing the labeled-DOB leak was rewritten to describe the leak class without reproducing the label or the date. Original draft preserved no useful information beyond the shape it claimed to fix. See journal entry for v0.1.2.

## What shipped

- **Critical:** v0.1.0 fixture leak fixed. `tests/fixtures.json` contained a calculation fixture whose label tied the operator's first name to a real-shape DOB — a labeled-DOB leak in a public repo. The same leak shape appeared in this journal's prior draft. Fix: synthetic DOB shifted by 12 years (preserves Chinese zodiac animal and life path mod-9 distribution while breaking the real-DOB anchor); all operator-name labels removed from fixtures and journal.
- **Public PII scanner** at `tests/pii_scan.test.js` — 9 cases covering operator-name leakage, SIRR cross-references, GitHub-username leakage, labeled-DOB shapes. Doctrine and config files allow-listed (their job is naming the boundary).
- **Local PII audit infrastructure** at `audits/LOCAL_PII_AUDIT.md` + `audits/run_local_audit.sh`. Operator's personal-data file is gitignored; script greps tracked content against the patterns.
- **Release checklist** at `audits/RELEASE_CHECKLIST.md` — operational form of DOCTRINE.md §8 gates.
- **DOCTRINE.md v0.2** — added §10 multi-model lane system (mirrors SIRR §7 at smaller scale), §11 PII rule with fixture-DOB sub-rule, §13 refresh discipline + Friday rule-kill review.
- **8BALL.md** — canonical AI-session-bootstrap context. Mirrors `~/dev/SIRR/SIRR.md` shape.
- **`~/Desktop/8ball/`** folder structure with `sessions/` and `audits/` subdirs, mirroring `~/Desktop/SIRR/`. v0.1.1 session distillate filed.
- **`.gitignore`** updated to exclude `audits/local_personal_data.txt`.
- **CI workflow** unchanged but the new tests run automatically as part of `npm test`.
- **Tests:** 31/31 green (22 calc + engine + content; 9 PII scan).

## Lessons

**L1 — The PII gate that doesn't exist before push doesn't exist.** Build the gate the same release as the surface it protects.

**L4 — Files are canon, memory is not** (carried from SIRR L4). This Claude started the session without reading `~/MUHAB.md`. Operator caught it. Process discipline is the only counter.

**L5 — Solo authority IS the failure mode.** Same instance wrote the doctrine, the code, the tests, the fixtures. The labeled-DOB leak slipped through because of single-author blindness. §10 lanes codify the structural fix.

**L7 — The recursion fires through the orchestrator too.** Watch for tooling that feels rigorous but doesn't fire. Friday rule-kill review is the structural counter.

Full session distillate: `~/Desktop/8ball/sessions/session_distillate_2026-05-08.md`.

## Open items / next session queue

1. ~~Connect Netlify to GitHub repo for auto-deploy~~ ✅ done 2026-05-08 16:17. Live at `https://the-eight-ball.netlify.app`.
2. ~~Pick + reserve subdomain~~ ✅ reserved `the-eight-ball`.
3. Operator: create `audits/local_personal_data.txt` per `audits/LOCAL_PII_AUDIT.md`.
4. Operator: add `8ball` row to `~/MUHAB.md` §6 bootstrap table (operator-personal file).
5. Trait pool v2 — ChatGPT lane drafts; doctrine §4 review gates.
6. Question classifier rework.
7. First cross-model audit dry-run (Codex on a doctrine change).
8. Live-fire testing post-deploy.

=====
End of 2026-05-08 · v0.1.1 entry.
=====

=====
2026-05-08 · v0.1 — repo bootstrapped, calc contract locked
=====

## What shipped

- Repo restructured from single-folder `8ball-app/` to layered `8ball/` with `core/`, `content/`, `tests/`, `.github/workflows/`.
- Calculation core extracted to `core/profile.js`. Pure functions, no DOM. Re-importable in tests.
- Response engine extracted to `core/engine.js`. Tokens documented inline.
- Trait pools and templates split into versioned files: `content/traits.v1.js` and `content/templates.v1.js`. Immutable once shipped — v2 = new file.
- `index.html` slimmed to UI + boot, ES module imports.
- `tests/fixtures.json` — 12 calculation fixtures + 4 name-number fixtures, every value hand-verified against the algorithm. All DOBs synthetic per §11.
- `tests/profile.test.js` — 22 cases across calculation contract, engine token-leakage, recent-buffer dedup coverage (>80 unique strings in 500 calls), question classifier, banned-pattern content scan.
- `DOCTRINE.md` written. 10 sections. The §3 calculation contract and §4 content rules are the load-bearing parts.
- `.gitignore` includes explicit `**/SIRR/`, `**/PRIVATE/`, `**/_ARCHIVE/` barriers so cross-pollination from SIRR is impossible by accident.
- `LICENSE` MIT.
- `package.json` — vitest only; no build step, no framework.

## Decisions locked

| # | Decision | Locked value |
|---|---|---|
| 1 | Repo visibility | Public on GitHub from day 1 |
| 2 | Domain | netlify.app subdomain only until traction |
| 3 | Product name | `8 ball` (lowercase, space; folder & repo `8ball`) |
| 4 | License | MIT |
| 5 | Stack | Static + ES modules; no build step |
| 6 | Persistence | localStorage only — name + DOB; nothing else, ever |
| 7 | Telemetry | None. Permanently. |
| 8 | Calc version | v1 — Pythagorean LP w/ master 11/22/33 preserved; tropical sun; Feb 4 CNY approximation |

## Errata caught during build

Initial `tests/fixtures.json` had hand-calc errors on 6/12 cases. All caught by running the algorithm against the fixtures before locking. Lesson: never lock fixtures from memory — generate them from the algorithm, then hand-verify the algorithm itself against an external source. The fix took 10 minutes; finding it after a bad release would have taken weeks.

## Open items / next session queue

1. **`git init` + push to GitHub.** Repo URL TBD pending availability of preferred name.
2. **Wire Netlify to GitHub.** Currently the v0 deployment (if any) was drag-and-drop from the old `8ball-app/` folder. Reconnect to `8ball` repo, deploy on push to main.
3. **Rename existing Netlify subdomain** if a v0 deployment exists. Target name: `8ball.netlify.app` or `the-eight-ball.netlify.app` depending on availability.
4. **Trait pool expansion (v2).** Current pool is the seed. Doubling each axis pool will materially reduce flavor-repetition complaints.
5. **Question classifier rework.** Regex-grade dumb in v1. v2: distinguish regret vs choice vs future vs identity.
6. **iOS wrap.** Capacitor or PWA install prompt. Only after web shows pulse — don't pre-build.
7. **Live-fire testing.** Open the deployed URL. Shake 30 times with real DOB. Note any flavor-repeats or weak lines for v1.1.

## Lessons (the ones not in code)

**L1 — Test gate works.** The fixtures-vs-algorithm mismatch was caught by writing tests before believing my own arithmetic. Process did its job.

**L2 — Doctrine before content.** `DOCTRINE.md §4` was written before `traits.v1.js` was reviewed. Re-reading the §4 rules surfaced one borderline phrase that was cut. Doctrine first means content review has a yardstick, not a vibe.

**L3 — Mirroring SIRR's process is cheap and load-bearing.** The journal-shape, doctrine-doc, fixture-locked tests are SIRR-shaped. Reusing the shape means we don't re-derive process discipline every session.

=====
End of 2026-05-08 entry.
=====
