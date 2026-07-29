#!/usr/bin/env python3
"""build_card_jpegs.py — deterministic PNG->JPEG card renderer for /cards hosting.

The IG + Threads auto-drip pipelines ingest images by PUBLIC URL (Meta fetches
the file; local paths are impossible). This script publishes every catalog card
as a JPEG under the site's static root at cards/{code}.jpg, so both pipelines'
CARD_URL_BASE can point at https://the-eight-ball.netlify.app/cards.

Shared IG + Threads output shape (verified by tests/cards_hosting.test.js):
  exactly 1080x1350 (4:5)  ·  <= 8 MB  ·  JPEG
This stays inside Threads' width limit and Instagram's supported portrait
aspect ratio. The raw 2:3 sources are outside that shared safe shape and are
NEVER published; each source is fit whole onto a white 1080x1350 canvas,
centered, with padding as needed. Card art is never cropped.

Determinism: for a given Pillow/libjpeg build the encode is byte-reproducible
across runs on the same environment —
  - fixed JPEG quality (90), optimize on, fixed 4:2:0 subsampling
  - sRGB RGB output, alpha flattened onto opaque white
  - all EXIF / ICC / metadata stripped (nothing passed to save())
  - Lanczos resampling
(A different libjpeg build can shift a few bytes; the tracked JPEGs are the
authoritative artifact, and --check verifies re-renders match them exactly.)

The source PNGs live in the operator's asset vault (~/8ball), NOT in this repo,
so this script is a build tool, not a CI step: it documents and reproduces the
conversion. Codes and their canonical source directories are resolved from the
vault at run time; the committed cards/manifest.json records the exact mapping
that produced the tracked JPEGs.

Usage:
  python3 scripts/build_card_jpegs.py            # vault at ~/8ball, write cards/
  VAULT=/path/to/8ball python3 scripts/build_card_jpegs.py
  python3 scripts/build_card_jpegs.py --check    # verify tracked cards/ match a
                                                 # fresh render, byte-for-byte
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from PIL import Image

# Shared safe output shape — must match tests/cards_hosting.test.js.
CANVAS_W = 1080
CANVAS_H = 1350
JPEG_QUALITY = 90
MAX_BYTES = 8 * 1024 * 1024
WHITE = (255, 255, 255)

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "cards"

VAULT = Path(os.environ.get("VAULT", str(Path.home() / "8ball")))

# Every autonomous surface queue, not just one. Until 2026-07-29 this read the
# IG queue alone, on the documented assumption that it was a superset of the
# others. The B-7 ruling made the four queues DISJOINT, which killed that
# assumption: covering IG now covers roughly a quarter of the corpus, and the
# surfaces whose codes went unrendered stall on "hosted JPEG not reachable"
# with no ledger row, retrying the same code every slot forever.
QUEUES = [
    VAULT / "reach" / "x_pipeline" / "queue.txt",
    VAULT / "reach" / "tiktok_pipeline" / "queue.txt",
    VAULT / "reach" / "ig_pipeline" / "queue.txt",
    VAULT / "reach" / "threads_pipeline" / "queue.txt",
]

# Canonical source directories, in priority order (first match wins). The
# specimen block ships pre-rendered in the x_pipeline assets; the base catalog
# and the cross-combination cards live in the dated share-asset libraries.
SOURCE_DIRS = [
    VAULT / "reach" / "x_pipeline" / "assets",
    VAULT / "share_assets" / "index_library_2026-07-02",
    VAULT / "share_assets" / "concordance_2026-07-03" / "cards",
]


def read_queue_codes() -> list[str]:
    """Return catalog codes across every surface queue, in queue order.

    Skips blank and '#'-comment lines, and de-duplicates while preserving first
    appearance. Reads all four queues because they are disjoint (B-7,
    2026-07-29): no single queue is a superset of the others any more, so
    rendering from one would silently leave three surfaces without images.
    """
    codes: list[str] = []
    seen: set[str] = set()
    lines: list[str] = []
    absent = [q for q in QUEUES if not q.is_file()]
    if absent:
        # Silently skipping a queue would emit a partial manifest and report
        # success, leaving that surface's codes unrendered — the exact silent
        # stall this change exists to close (Codex L48 P2, PR #136).
        raise SystemExit(
            "ERROR: surface queue(s) missing — refusing to render a partial "
            "manifest:\n" + "\n".join(f"  {q}" for q in absent)
        )
    for queue in QUEUES:
        lines.extend(queue.read_text().splitlines())
    for line in lines:
        s = line.strip()
        if not s or s.startswith("#") or s in seen:
            continue
        seen.add(s)
        codes.append(s)
    return codes


def extra_specimen_urls() -> dict[str, str]:
    """Codes the vault hosts itself → their public URL.

    These have no local PNG by design; image_url_for() prefers their
    publicUrl over cards/{code}.jpg. That preference is also the hazard: if a
    publicUrl is missing or malformed the pipeline falls back to
    cards/{code}.jpg, which this script deliberately does not render, so the
    surface stalls on an unreachable image forever with no ledger row and CI
    stays green. So an extra without a usable https URL is a hard error here,
    and the ones we do skip are recorded in the manifest for the test to pin
    (Codex L48 P1, PR #136).
    """
    manifest = VAULT / "reach" / "extra_specimens" / "manifest.json"
    if not manifest.is_file():
        return {}
    try:
        assets = json.loads(manifest.read_text()).get("assets", {})
    except (ValueError, TypeError):
        return {}
    urls: dict[str, str] = {}
    for code, meta in assets.items():
        url = meta.get("publicUrl") if isinstance(meta, dict) else None
        if isinstance(url, str) and url.startswith("https://"):
            urls[code] = url
    return urls


def resolve_sources() -> dict[str, Path]:
    """Map code -> source PNG path (first SOURCE_DIRS hit wins)."""
    found: dict[str, Path] = {}
    for d in SOURCE_DIRS:
        if not d.is_dir():
            continue
        for p in sorted(d.glob("*.png")):
            found.setdefault(p.stem, p)
    return found


def render(src: Path) -> Image.Image:
    """Fit a source PNG whole onto a centered white 1080x1350 RGB canvas."""
    im = Image.open(src)
    # Flatten any alpha onto opaque white so JPEG (no alpha) is faithful.
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, WHITE)
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")

    # Scale to fit within the canvas, preserving aspect ratio (never crop).
    scale = min(CANVAS_W / im.width, CANVAS_H / im.height)
    new_w = round(im.width * scale)
    new_h = round(im.height * scale)
    im = im.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), WHITE)
    canvas.paste(im, ((CANVAS_W - new_w) // 2, (CANVAS_H - new_h) // 2))
    return canvas


def encode(canvas: Image.Image) -> bytes:
    import io

    buf = io.BytesIO()
    # No exif=, no icc_profile= => metadata stripped. Fixed subsampling +
    # quality => reproducible bytes.
    canvas.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, subsampling="4:2:0")
    return buf.getvalue()


def main() -> int:
    check_only = "--check" in sys.argv[1:]

    codes = read_queue_codes()
    sources = resolve_sources()

    # Extras carry their own hosted publicUrl in the vault manifest, and the
    # pipelines prefer that URL over cards/{code}.jpg (image_url_for). They have
    # no local PNG here by design, so they are not this script's to render.
    extra_urls = extra_specimen_urls()
    external = [
        {"code": c, "url": extra_urls[c]} for c in codes if c in extra_urls
    ]
    codes = [c for c in codes if c not in extra_urls]

    missing = [c for c in codes if c not in sources]
    if missing:
        print("ERROR: no source PNG found for codes (list, do not improvise):")
        for c in missing:
            print(f"  {c}")
        return 2

    if not check_only:
        OUT_DIR.mkdir(exist_ok=True)

    manifest = []
    total = 0
    drift = []
    for code in codes:
        src = sources[code]
        data = encode(render(src))
        if len(data) > MAX_BYTES:
            print(f"ERROR: {code}.jpg is {len(data)} bytes (> 8 MB cap)")
            return 3
        total += len(data)
        rel_src = os.path.relpath(src, VAULT)
        manifest.append({"code": code, "source": rel_src, "bytes": len(data)})
        if check_only:
            # Verify the tracked artifact matches a fresh render, byte-for-byte.
            tracked = OUT_DIR / f"{code}.jpg"
            if not tracked.exists():
                drift.append(f"{code}: tracked file missing")
            elif tracked.read_bytes() != data:
                drift.append(f"{code}: tracked bytes != fresh render")
        else:
            (OUT_DIR / f"{code}.jpg").write_bytes(data)

    if check_only:
        # Also verify the committed manifest matches what we would emit now.
        try:
            tracked_manifest = json.loads((OUT_DIR / "manifest.json").read_text())
            tracked_cards = [
                {"code": c["code"], "source": c["source"], "bytes": c["bytes"]}
                for c in tracked_manifest.get("cards", [])
            ]
            if tracked_cards != manifest:
                drift.append("manifest.json: tracked entries != fresh render")
        except (OSError, ValueError, KeyError) as exc:
            drift.append(f"manifest.json: unreadable ({exc})")
        if drift:
            print("DRIFT — tracked cards/ do not match a fresh render:")
            for d in drift:
                print(f"  {d}")
            return 4
        print(f"checked {len(codes)} JPEGs, {total / 1024 / 1024:.2f} MB total — "
              f"all match tracked bytes")
        return 0

    # Write path only (check_only returned above).
    manifest_doc = {
        "note": (
            "Generated by scripts/build_card_jpegs.py. 'cards' byte-match the "
            "union of ALL FOUR reach surface queues, in queue order (the "
            "queues are disjoint as of 2026-07-29, so no single one is a "
            "superset). 'external' are queued codes hosted off-site by the "
            "vault's extra_specimens manifest and deliberately not rendered "
            "here; cards + external together cover every queued code. Every "
            "file is 1080x1350 JPEG, q90, sRGB, metadata stripped."
        ),
        "canvas": [CANVAS_W, CANVAS_H],
        "quality": JPEG_QUALITY,
        "count": len(manifest),
        "cards": manifest,
        "external_count": len(external),
        "external": external,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest_doc, indent=2) + "\n"
    )

    print(f"wrote {len(codes)} JPEGs, {total / 1024 / 1024:.2f} MB total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
