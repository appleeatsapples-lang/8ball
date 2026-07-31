# Codex preflight audit response — REACH-X-OFFER-01

**Audit time:** 2026-07-31 00:53–00:55 +03
**Packet:** `~/8ball/sessions/packet_offer_x_sprint_2026-07-31.md`
**Brief:** `audits/codex_x_offer_preflight_2026-07-31_brief.md`
**Overall verdict:** **STOP**
**Authority note:** This verdict is a gate only. It is not authority to publish, merge, deploy, edit a third-party listing, or spend. The X tap remains operator-only A2.

## Executive finding

The reach experiment, channel route, daily-cap mechanism, and current ledgers are operationally ready. The post itself is not truth-ready.

Two P1 blockers independently require STOP:

1. The locked image advertises master-number outputs that the shipped calculator and doctrine currently reject.
2. Neither allowed caption is fully compliant with current doctrine and the sprint law.

During this audit the operator explicitly directed: **“keep master number actually”** and then confirmed **“master numbers sell so keep them.”** This is now a locked product and commercial decision: preserve `11`, `22`, and `33`; do not reduce them or remove them from the creative as the repair. The current mismatch still has to be resolved deliberately across the calculation contract, meanings, tests, doctrine, and deployed surface before this creative can truthfully run.

### Post-audit control update — 2026-07-31 01:52 +03

After the audit, the operator changed the owned-surface posting regime from 12/day to **3/day on all four surfaces**. Board revision `2026-07-31a` is the current authority. The audit-time `1/12` observation below remains historical evidence; a fresh preflight must use the current X cap of 3 and verify the installed three-slot schedule. A hand-posted offer still consumes one shared X ledger row, so it must be included within—not added on top of—the three daily posts.

## Worktree state

### Start

- Branch: `main...origin/main [ahead 1]`
- HEAD: `b9991dee537e6809a01a520aa9194fffcb31fde2`
- Existing untracked paths: `_to_delete/`, `audits/automated/`
- Tracked unstaged diff: none
- Staged diff: none

### End

- Branch and HEAD unchanged.
- No tracked or staged file changed.
- Existing untracked paths remain.
- This response file is the only audit-created path.

## Criterion-by-criterion result

### 1. Gate class

**Status:** VERIFIED
**Severity:** PASS

The packet is an attention-generation and measurement experiment under the active REACH freeze, not product work. It requests one operator-tapped X post, a ledger row, and T0/T+24/T+72 observations. It does not require or imply a repository code change (`packet:30–32`, `:69–87`; `~/8ball/APPROACH.md:181–195`, `:228–237`).

The operator's audit-time decision to keep master numbers is separate product work. It expands the required repair before this packet can run, but does not retroactively reclassify the experiment.

### 2. Prior blockers from 2026-07-30

**Status:** VERIFIED
**Severity:** PASS

- `journal.md:5–6` points forward to `next_strategic_read: 2026-08-13` and `next_analytics_read: 2026-08-06`.
- The reads exist and are file-backed:
  - `~/8ball/reach/strategic_read_2026-07-30.md`
  - `~/8ball/reach/analytics_read_2026-07-20_pasteback.md`
  - `~/8ball/reach/k1_scorecard_read_2026-07-27.md` §7
- The strategic read identifies attention, not product, as the binding constraint and records K1 CLOSED FAIL (`strategic_read_2026-07-30.md:4–11`).
- The former v0.61 footer contradiction is closed in the active record:
  - corrected clause: `DOCTRINE.md:143`
  - append-only footer correction: `DOCTRINE.md:621`
  - audit trail: `audits/mechanical_footer_correction_v061_2026-07-30.md:7–23`
- The current brief exists at the required `audits/` path.

### 3. Live preflight at audit time

**Status:** PARTLY VERIFIED; one current-state blocker
**Severity:** P1

Operational checks at 2026-07-31 00:53 +03:

- X ledger rows dated 2026-07-31: **1/12**
- X offer rows dated 2026-07-31: **0**
- `~/8ball/reach/x_pipeline/HOLD`: absent
- `~/8ball/reach/x_pipeline/n_per_day.txt:1`: `12`
- `PENDING` rows in the X ledger: none
- Required original asset exists: `content/8ball-specimen-cxx.png`, 960×1440
- Locked asset exists: `content/8ball-specimen-cxx_clean.png`, 1080×1350, SHA-256 `2359b01145c4c871579cd5e0ee87c533b87aa6872815ebf5f6b5903937876469`
- `/x` returned HTTP 200.
- `https://theeightball.gumroad.com/l/xjpvp` returned HTTP 200 and publicly described `$3 once`.

#### P1-A — creative contradicts the shipped calculation contract

OCR and visual inspection of the locked image show:

```text
LIFE · NAME · SOUL
4 9 11
PERSONALITY · BIRTHDAY · MATURITY
7 22 4
```

The shipped engine says the opposite:

- `core/profile.js:151–157`: active numerology is strict `1..9`; `11/22/33` are not retained.
- `tests/profile.test.js:195–201`: soul-urge totals `11` and `22` must render as `2` and `4`.
- `tests/profile.test.js:310–316`: birthdays `11` and `22` must render as `2` and `4`.
- `DOCTRINE.md:55`: `11 → 2`, `22 → 4`, `33 → 6`.

The image is therefore stale relative to the deployed product. Because the operator has now chosen to keep master numbers, the correct repair is not to erase `11` and `22` from this image. The correct repair is to restore master-number preservation product-wide, ship it through the ordinary implementation and audit gates, and then regenerate or revalidate the image against the shipped calculation.

#### Gumroad listing state — VERIFIED CLOSED; no external write required

The initial unauthenticated HTTP check at 2026-07-31 00:54 +03 established only that the two direct pages returned `200` and displayed their names/prices. It did not establish buyability.

An authenticated dashboard and direct-page recheck at 2026-07-31 01:44 +03 established the authoritative state:

- `xjpvp`, **8 ball — private**, `$3`: **Published**; untouched.
- `neysyv`, **8 ball — comparative**, `$6`: **Unpublished**; its direct page says **“This product is not currently for sale.”**
- `rzqezp`, **8 ball — public**, `$9`: **Unpublished**; its direct page says **“This product is not currently for sale.”**

This satisfies the operational record in `~/8ball/reach/REACH_CONTROL.md:4973–4980`: the `$3` single/full offer is live, while the `$6` comparative and retired `$9` public products are not for sale. Their direct pages remain visible as unavailable residue, but neither exposes a purchase control. No archive, deletion, or other external mutation was necessary or performed.

One documentation truth cleanup remains non-blocking: `DOCTRINE.md:137` says the t5 product “does not exist,” while an unpublished Gumroad listing does exist. The accurate statement is that t5 is commercially unavailable, the listing is unpublished, `T5_PRODUCT_URL` is empty, and no fulfillment path is live. That wording should be superseded in the next doctrine-touching implementation cycle; it is not a listing-state blocker.

### 4. Slot arithmetic

**Status:** VERIFIED
**Severity:** PASS

`~/8ball/reach/x_pipeline/post_x.py:159–172`:

- derives the local date;
- reads the cap;
- counts every ledger row whose date equals today;
- exits cleanly when `len(today_rows) >= cap`.

At audit time, this meant a hand-posted offer consumed one of 12 daily rows. The operator subsequently reduced the current cap to 3/day under board revision `2026-07-31a`. The same mechanism applies: the pipeline self-skips once the shared X ledger reaches 3, so an offer is one of the three rather than a fourth post.

This remains conditional on the offer row being written immediately and before the next slot, exactly as the packet says.

### 5. Single-variable design

**Status:** NOT VERIFIED
**Severity:** P2

The packet labels the treatment “one causal variable,” but leaves two execution choices open:

- caption: primary or alternate (`packet:37–57`)
- tag: none or `#astrology` (`packet:34`)

That is not one locked treatment. A one-post experiment cannot estimate these variants separately. Lock one caption and lock tags to none before re-audit.

The image also prints the bare root URL `the-eight-ball.netlify.app`, while the caption uses the measured `/x` path. This creates a second route signal and a plausible unattributed manual-entry path. Remove the image footer or change it to the same `/x` path before claiming clean channel attribution.

### 6. Copy versus doctrine

**Status:** FAILED
**Severity:** P1

Passes shared by both captions:

- English
- explicitly labeled `14-day sales sprint`
- product name `8ball`
- one clickable first-party `/x` URL in the caption
- no Gumroad URL in the caption
- no prediction, therapeutic, diagnostic, or guidance claim
- `$3` complete single-sheet offer matches the live site's current public presentation

Failures:

1. **Primary caption lacks a direct CTA.** `APPROACH.md:190` requires one direct CTA. A bare URL is a destination, not an action phrase. The packet later records “one CTA” (`packet:104`) that the primary copy does not contain.
2. **Primary “unlocks everything” is overbroad.** Current doctrine has a separate t5 second-sheet/relation entitlement (`DOCTRINE.md:129–141`). The truthful scope is the complete **single-person sheet**, not everything in the product.
3. **Alternate “no second tier” is false.** Current doctrine contains t1/t2/t3/t5. The `$6` comparative listing is unpublished and not for sale, but the product architecture still has multiple tiers.
4. **Alternate violates the packet's own ban.** `packet:35` forbids “tiers/rungs/stages” language; `packet:54` says “no second tier.”
5. **Actual creative contains a second path string.** The locked image displays the bare production root while the caption displays `/x`.

A compliant replacement, subject to product alignment and operator taste, is:

```text
14-day sales sprint · 8ball

Birth date in. One deterministic specimen sheet out — not a random draw.

Five coordinates are free; $3 once unlocks the complete single-person sheet, permanently.

Try it → https://the-eight-ball.netlify.app/x
```

### 7. Measurement readiness

**Status:** VERIFIED with one required operator/verifier gate still open
**Severity:** PASS for infrastructure; UNVERIFIED for dashboard baseline

- `netlify.toml:39–47` contains exact non-forced 200 rewrites for `/r` and `/x`; the remaining channel routes are present above the SPA catch-all.
- `tests/channel_routes.test.js` exists.
- Audit run: `npm test -- tests/channel_routes.test.js` → **1 file passed, 6 tests passed**.
- Live `/x` returned HTTP 200 at audit time.
- Doctrine explicitly forbids client-side event tracking and permits passive first-party host logs (`DOCTRINE.md:197`, `:313–323`). The absence of a client pixel/event is not a defect.
- Authenticated Gumroad product status is VERIFIED as described above. Authenticated Netlify measurement values and the tap-time dashboard baseline remain **UNVERIFIED from this seat**.
- T0 has not yet been captured. That is expected during preflight, but remains a hard tap-time precondition.

The bare root URL printed in the image should still be removed or changed to `/x`; otherwise manual-entry traffic can bypass the measured route.

### 8. No concurrent offer

**Status:** VERIFIED at 2026-07-31 00:53 +03
**Severity:** PASS

Today's rows across X, TikTok, Instagram, and Threads were catalog identifiers only. A cross-ledger search found no `offer`, `sprint`, `sale`, `buy`, `unlock`, or `$3` row dated 2026-07-31. Reddit has no current-day offer row. The X ledger itself has zero offer rows today.

This is a time-sensitive pass and must be rechecked at tap time.

## Required repairs before a fresh preflight

1. **Restore `11`, `22`, and `33` preservation as a real product rule.** This is the chosen commercial behavior, not an optional creative treatment. At minimum it requires a separate implementation brief covering `DOCTRINE.md`/journal, `core/profile.js`, calculation fixtures and direct tests, active numerology meanings, tier/null-domain guards, bracket/facet behavior, and the dyad/Concordance validations that currently reject retired master values. Ship and deploy through the ordinary gates.
2. **Regenerate or revalidate the locked asset against the shipped master-number implementation.** Preserve the specimen's `11` and `22`; verify that the live calculator produces them for the same inputs before publishing.
3. **Lock one caption and no tag.** Use a direct CTA and scope `$3` to the complete single-person sheet.
4. **Remove the bare root URL from the image or make it the exact `/x` path.**
5. **Supersede the t5 existence sentence during the next doctrine-touching implementation cycle.** Record the verified truth: the `$6` listing exists but is unpublished and not for sale; `T5_PRODUCT_URL` remains empty and no fulfillment path is live.
6. **Run a fresh Codex preflight.** Recheck ledger count, zero offer rows, HOLD, PENDING, cap, live price/listings, final image, final copy, and all surface ledgers.
7. **After GO only:** verifier/operator captures T0; operator taps once; the pen seat immediately logs the permalink; 72-hour quiet window begins.

## Final verdict

**STOP. Do not publish REACH-X-OFFER-01 from the current packet or with the current creative.**

The stop can be cleared, but not by treating `11`, `22`, or `33` as cosmetic. The operator has chosen to keep master numbers because they are part of the sellable product proposition. The live product must now implement that same rule.
