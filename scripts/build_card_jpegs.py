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

Determinism (reproducible bytes across runs and machines):
  - fixed JPEG quality (90), optimize on, fixed 4:2:0 subsampling
  - sRGB RGB output, alpha flattened onto opaque white
  - all EXIF / ICC / metadata stripped (nothing passed to save())
  - Lanczos resampling

The source PNGs live in the operator's asset vault (~/8ball), NOT in this repo,
so this script is a build tool, not a CI step: it documents and reproduces the
conversion. Codes and their canonical source directories are resolved from the
vault at run time; the committed cards/manifest.json records the exact mapping
that produced the tracked JPEGs.

Usage:
  python3 scripts/build_card_jpegs.py            # vault at ~/8ball, write cards/
  VAULT=/path/to/8ball python3 scripts/build_card_jpegs.py
  python3 scripts/build_card_jpegs.py --check    # convert in memory, verify only
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
QUEUE = VAULT / "reach" / "ig_pipeline" / "queue.txt"

# Canonical source directories, in priority order (first match wins). The
# specimen block ships pre-rendered in the x_pipeline assets; the base catalog
# and the cross-combination cards live in the dated share-asset libraries.
SOURCE_DIRS = [
    VAULT / "reach" / "x_pipeline" / "assets",
    VAULT / "share_assets" / "index_library_2026-07-02",
    VAULT / "share_assets" / "concordance_2026-07-03" / "cards",
]


def read_queue_codes() -> list[str]:
    """Return catalog codes from the IG pipeline queue, in queue order.

    Skips blank and '#'-comment lines. This queue is the superset of the
    Threads queue, so covering it covers both pipelines.
    """
    codes: list[str] = []
    for line in QUEUE.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        codes.append(s)
    return codes


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
    for code in codes:
        src = sources[code]
        data = encode(render(src))
        if len(data) > MAX_BYTES:
            print(f"ERROR: {code}.jpg is {len(data)} bytes (> 8 MB cap)")
            return 3
        total += len(data)
        rel_src = os.path.relpath(src, VAULT)
        manifest.append({"code": code, "source": rel_src, "bytes": len(data)})
        if not check_only:
            (OUT_DIR / f"{code}.jpg").write_bytes(data)

    if not check_only:
        manifest_doc = {
            "note": (
                "Generated by scripts/build_card_jpegs.py. Codes byte-match "
                "reach/ig_pipeline/queue.txt (superset of the Threads queue). "
                "Every file is 1080x1350 JPEG, q90, sRGB, metadata stripped."
            ),
            "canvas": [CANVAS_W, CANVAS_H],
            "quality": JPEG_QUALITY,
            "count": len(manifest),
            "cards": manifest,
        }
        (OUT_DIR / "manifest.json").write_text(
            json.dumps(manifest_doc, indent=2) + "\n"
        )

    print(f"{'checked' if check_only else 'wrote'} {len(codes)} JPEGs, "
          f"{total / 1024 / 1024:.2f} MB total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
