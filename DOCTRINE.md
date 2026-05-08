# 8ball — DOCTRINE.md

> One page. Read every release. Edit only deliberately.

This document is the constitution of `8ball`. The codebase obeys it. PRs that contradict it require an explicit doctrine amendment in the same change.

## §1. What this is

A fixed designed deck that knows you. Enter your name and date of birth once. Shake or ask. The product returns a card from the deck, selected by a calculation tied to (name, DOB).

The voice is declarative-observational, framed in strengths and weaknesses. Cards openly reference the symbol systems they draw from — sun sign, Chinese zodiac animal, numerology life path — and name them as such.

## §2. What this is NOT

- Not a horoscope app. Not a numerology calculator. Not a guidance product.
- Not a "spiritual" product. The voice is declarative-observational and materialistic, not mystical or guidance-oriented.
- Not a SIRR product. Never references SIRR. Never imports from SIRR. The two repos are siblings, not parent/child. (See §9.)
- Not a logged-in product. No accounts, no signup, no "save your reading."
- Not an analytics product. No tracking, no telemetry, no third-party scripts beyond Google Fonts.
- Not a payments product. No paywall, no premium tier, no in-app purchase. Revisit only with a real reason.

## §3. The calculation contract

`core/profile.js` is the calculation core. The contract for any change to it:

1. Add or update fixtures in `tests/fixtures.json` reflecting the intended new behavior.
2. Update the algorithm.
3. Run `npm test`. All cases must pass.
4. Bump the calc-version note at the bottom of this file.

Algorithm versions documented:

- **calc v1** (initial) — Pythagorean life path with master numbers 11/22/33 preserved at the final reduce. Western tropical sun signs at standard cusps. Chinese zodiac with Feb 4 cutoff approximation (lunar tables = future work).

If a fixture changes silently, the test gate catches it. If a test changes silently, code review catches it. If both change in the same commit without a doctrine note, the reviewer rejects.

## §4. Content rules — copy & traits

- **No slurs.** Banned-pattern check runs in `tests/profile.test.js`.
- **No medical/diagnostic framing.** Cards do not adopt clinical or diagnostic vocabulary, including ironic adoption (e.g., "diagnosis," "syndrome," "disorder").
- **Cultural-symbol respect.** If the deck draws from any tradition (tarot, I Ching, runes, zodiac, etc.), cards respect that tradition's lineage. No syncretic flattening, no caricature of source traditions.
- **No targeting minors.** Copy assumes adult user. UI does not pander to children.
- **No real-person targets.** No "you're like [public figure]" lines.
- **Universal floor.** Cards should land equally on a person who picked their own DOB.
- **Versioned, not edited.** Shipped content batches are immutable. New release = new file (e.g. `traits.v2.js`, `cards.v2.js`). Diff lives in `journal.md`.

If a line lands but you can't tell whether it crosses any of the above, it crosses. Cut it.

**Safety-patch carve-out.** Locked-decision #9 (immutable v1 pools) protects against silent flavor drift. It does NOT protect a doctrine-rule violation caught post-ship. If a shipped trait, template, or card line violates §4, it is cut in a patch release; the journal records the cut and the diff carries the doctrine note. Immutability is for taste discipline, not error preservation.

## §5. Privacy primitive

The product persists exactly two pieces of user data, in `localStorage` only, on the user's own device:

- `name` (string)
- `dob` (ISO date YYYY-MM-DD)

Nothing else. No derived profile is stored — it's recomputed on each load. No analytics. No remote endpoints. No third-party scripts beyond the Google Fonts CSS.

If a future feature requires storing or transmitting more, that feature requires a doctrine amendment to §5 and a privacy-policy update before merge.

## §6. Architecture

- Single repo, public on GitHub.
- Static site. Deployed on Netlify free tier from `main` branch.
- ES modules in the browser. No build step.
- Three-folder source layout: `core/` (logic), `content/` (data), `tests/` (gates). Plus `index.html` and config.
- The single-file rule: `index.html` may not exceed 1500 lines. If it would, split into `ui/*.js` modules. Not before.

## §7. CI gate

`.github/workflows/ci.yml` runs on every push and PR to main. The gate has these stages:

1. **Calculation contract** — `tests/profile.test.js` calc cases must pass.
2. **Engine integrity** — token-leakage and recent-buffer dedup tests must pass.
3. **Content scan** — banned-pattern subset of test suite must pass.
4. **PII scan** — `tests/pii_scan.test.js` must pass. (Operator name leakage, SIRR cross-reference leakage, labeled-DOB leakage.)
5. **Single-file rule** — `index.html` ≤ 1500 lines.

Netlify is configured to auto-deploy on push to `main`. CI runs in parallel on the same push. Failed CI does not currently block the auto-deploy itself — this gap is acknowledged and acceptable while traffic is operator-only. Wiring a Netlify required-check on the GitHub Actions status is queued for the first traction milestone (see `journal.md`); at that point, this paragraph gets re-tightened to "a failed gate blocks the deploy."

## §8. Release ritual

Every release, however small:

1. PR opened with a one-line summary.
2. CI green (all 5 stages above).
3. **Operator runs local PII audit.** See `audits/LOCAL_PII_AUDIT.md`. The public CI cannot see the operator's personal data — the local audit closes that gap. Skipping the local audit is the failure mode, so it's a checklist item, not a vibe.
4. Reviewer (you) reads the diff. Asks: any new line cross §4? Any new path cross §5?
5. **Cross-model audit on doctrine or content changes.** See §10. Solo authority IS the failure mode. Doctrine and content changes go through ChatGPT or Codex before merge. Mechanical edits do not.
6. Merge.
7. Append to `journal.md` with the `===== YYYY-MM-DD · Title =====` shape: what shipped, what was rejected, what's deferred.
8. Confirm Netlify auto-deployed. Open the live URL. Shake it. If the roast lands, ship the next one.

## §9. The SIRR boundary

Tracked content of this repo MAY NOT contain the string "SIRR" (case-sensitive) or any SIRR-domain vocabulary (`sirr.studio`, `abjad`, `hebrew_gematria`, etc.) outside the boundary-naming files allow-listed in `tests/pii_scan.test.js` (`DOCTRINE_ALLOW`). SIRR is a sibling project, not a parent or child of `8ball`; the two repos share no code and no imports. Enforced by `tests/pii_scan.test.js`.

## §10. Multi-model lane system

**The author-judge problem is real.** A single instance writing AND reviewing its own work has a structural blind spot. SIRR's session L4 named this directly: "Solo authority on doctrine IS the failure mode."

For 8ball at its current scale, the lanes are:

| Role | Tool | Read access | Write access |
|---|---|---|---|
| Orchestrator, brief composer, doctrine drafter | **Claude (chat)** | Everywhere in `~/dev/8ball/` and `~/Desktop/8ball/` | Pragmatic for fast initial work; routes through CC for production-grade edits |
| Engine work, filesystem, git ops, audit-script execution | **Claude Code (CC)** — CLI tool installed at `/usr/local/bin/claude` | Repo + `~/Desktop/8ball/` | Repo + `~/Desktop/8ball/` |
| Content-batch review (trait pool diffs, template diffs) | **ChatGPT** — Mac desktop app, manual paste-and-relay | Pasted briefs only | Returns flagged-line lists only |
| Adversarial pre-merge auditor (doctrine changes, release-gate passes) | **Codex** — Mac desktop app, manual paste-and-relay | Pasted briefs only | Returns verdicts only |
| Editorial approver, merge gate, deploy authorization | **Operator** | Everywhere | Everywhere |

**Lane discipline:**

- This Claude (chat) does NOT autonomously override §4 or §5. Borderline content gets flagged for ChatGPT review before merge.
- Doctrine amendments go through Codex review before merge. Mechanical edits do not.
- All filesystem and git operations are routed through CC for any change touching ≥3 files or modifying core/. Single-file documentation tweaks may stay in chat.
- The operator is always the final approver. No model auto-merges.

For SIRR-specific lane discipline, see `~/dev/SIRR/SIRR.md` §7.

## §11. PII rule

The repo is public. Personal data of the operator, family, friends, or any other identifiable person is NEVER tracked content.

Specifically forbidden in any tracked file:

- The operator's full name in association with personal data (DOB, address, ID numbers).
- Test fixtures using real-person DOBs labeled to a real person.
- Any string matching combination patterns: `(operator-name) + (YYYY-MM-DD)` within 40 characters.
- SIRR cross-references outside of explicit boundary-naming doctrine.

The `tests/pii_scan.test.js` enforces a public-banned subset. The local audit at `audits/LOCAL_PII_AUDIT.md` closes the gap for personal data the public CI cannot know about.

**Fixture DOB rule (sub-rule of §11):** Fixture DOBs are chosen for the calc path they exercise, not anchored to any real person. If a calc path accidentally hits a real-person DOB, the fixture date is shifted by 12 years (preserves Chinese zodiac animal and life path mod-9 distribution while breaking real-DOB anchor) and the calc path is re-verified.

## §12. Out of scope, permanently

- Account systems
- Email capture
- Push notifications
- AI-generated trait phrases at runtime (latency, cost, repeatability all break)
- Multi-language until v2 of the trait pool exists in any language
- Astrology charts, planetary aspects, anything beyond sun sign
- Daily/weekly horoscopes ("today's reading")
- Sharing/social-card export until a privacy review explicitly clears it
- Anything touching the SIRR engine, codebase, or vocabulary

## §13. Refresh discipline

This file is **maintained by hand**, not generated. Update it when:

- A locked rule is added under any §-number
- A canonical path changes
- A doctrine version locks (note the version)
- A blocker is resolved or added
- A new tool/relay is automated (kill the old manual entry)

**Friday rule-kill review:** every locked rule that hasn't fired in 30 days → archive. Doctrine that doesn't breathe accumulates cost without producing safety. 15 min/week.

If you find yourself adding more locked rules than you're killing on Fridays, that's the recursion firing through the orchestrator. Stop drafting and ship something.

---

**calc version:** v1 (Pythagorean LP w/ 11/22/33 masters · tropical sun · CNY Feb 4 cutoff)
**content version:** v1 (~115 sun + ~85 animal + ~70 LP traits · 39 templates)
**doctrine version:** 2026-05-08 · v0.2 (added §10 lanes, §11 PII rule, §13 refresh discipline; renumbered out-of-scope to §12)
