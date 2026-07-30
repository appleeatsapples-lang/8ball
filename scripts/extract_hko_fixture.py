#!/usr/bin/env python3
"""Extract a compact JSON fixture from Hong Kong Observatory text calendars.

One-off, portable extraction tool. Reads the HKO "Gregorian-Lunar Calendar
Conversion Table" text files (T<year>e.txt, ISO-8859-1 encoded, one per
year) from an arbitrary --input-dir, parses out the 12 solar-term boundary
dates and the Lunar New Year's Day for each year in range, and emits a
single JSON fixture that audits/hko_compare.mjs can compare core/calendar.js
against without needing the original HKO source files to be vendored into
this repo.

Usage:
    python3 scripts/extract_hko_fixture.py --input-dir /path/to/hko-calendar
    python3 scripts/extract_hko_fixture.py --input-dir /path/to/hko-calendar \
        --output audits/fixtures/hko_calendar_authority_1901_2100.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

YEAR_START = 1901
YEAR_END = 2100

# The 12 solar-term names, in month-animal index order 0-11. These exact
# literal strings are matched as substrings against each daily row's
# "Solar terms" column, mirroring compare_hko_calendar.mjs.
TERM_ORDER = [
    "Spring Commences",
    "Insects Waken",
    "Bright & Clear",
    "Summer Commences",
    "Corn on Ear",
    "Moderate Heat",
    "Autumn Commences",
    "White Dew",
    "Cold Dew",
    "Winter Commences",
    "Heavy Snow",
    "Moderate Cold",
]

GREGORIAN_DATE_RE = re.compile(r"^(\d{4})/(\d{1,2})/(\d{1,2})\b")
LUNAR_NEW_YEAR_RE = re.compile(r"\b1st Lunar month\b", re.IGNORECASE)
LINE_SPLIT_RE = re.compile(r"\r\n|\r|\n")


def date_at_start(line: str):
    """Return [month, day] parsed from the leading Gregorian date, or None."""
    match = GREGORIAN_DATE_RE.match(line)
    if not match:
        return None
    return [int(match.group(2)), int(match.group(3))]


def parse_year_text(text: str):
    """Parse one year's HKO calendar text into (terms dict, lunar_new_year)."""
    terms_found = {}
    lunar_new_year = None

    for line in LINE_SPLIT_RE.split(text):
        date = date_at_start(line)
        if date is None:
            continue
        for term in TERM_ORDER:
            if term in line:
                terms_found[term] = date
        if LUNAR_NEW_YEAR_RE.search(line):
            lunar_new_year = date

    return terms_found, lunar_new_year


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Extract a JSON fixture of HKO solar-term and lunar-new-year "
            "dates from cached HKO T<year>e.txt calendar text files."
        )
    )
    parser.add_argument(
        "--input-dir",
        required=True,
        type=Path,
        help="Directory containing T<year>e.txt files (e.g. T1901e.txt .. T2100e.txt)",
    )
    parser.add_argument(
        "--output",
        default="audits/fixtures/hko_calendar_authority_1901_2100.json",
        type=Path,
        help=(
            "Output JSON path. If relative, resolved against this repo's "
            "root (not the current working directory). "
            "Default: audits/fixtures/hko_calendar_authority_1901_2100.json"
        ),
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    output_path = args.output
    if not output_path.is_absolute():
        output_path = (repo_root / output_path).resolve()

    input_dir = args.input_dir

    years: dict[str, dict] = {}
    source_sha256: dict[str, str] = {}
    incomplete_years: list[int] = []
    missing_years: list[int] = []
    processed_years: list[int] = []

    for year in range(YEAR_START, YEAR_END + 1):
        source_path = input_dir / f"T{year}e.txt"
        if not source_path.is_file():
            missing_years.append(year)
            incomplete_years.append(year)
            continue

        raw_bytes = source_path.read_bytes()
        source_sha256[str(year)] = hashlib.sha256(raw_bytes).hexdigest()
        text = raw_bytes.decode("latin1")

        terms_found, lunar_new_year = parse_year_text(text)
        complete = len(terms_found) == len(TERM_ORDER) and lunar_new_year is not None

        years[str(year)] = {
            "terms": {term: terms_found[term] for term in TERM_ORDER if term in terms_found},
            "lunar_new_year": lunar_new_year,
            "complete": complete,
        }

        processed_years.append(year)
        if not complete:
            incomplete_years.append(year)

    fixture = {
        "schema_version": 1,
        "source": {
            "name": "Hong Kong Observatory — Gregorian-Lunar Calendar Conversion Table",
            "url_pattern": "https://www.hko.gov.hk/en/gts/time/calendar/text/files/T{year}e.txt",
            "retrieved_at": "2026-07-29",
            "range": [YEAR_START, YEAR_END],
            "extraction_script": "scripts/extract_hko_fixture.py",
            "extraction_script_version": 1,
            "term_order": TERM_ORDER,
        },
        "source_sha256": source_sha256,
        "years": years,
        "incomplete_years": incomplete_years,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(fixture, f, indent=2, sort_keys=False)
        f.write("\n")

    print(f"Years processed (file found & parsed): {len(processed_years)}")
    print(f"Years missing (source file not found): {len(missing_years)}")
    if missing_years:
        print(f"  missing: {missing_years}")
    print(f"Years incomplete (missing terms/lunar-new-year, includes missing files): {len(incomplete_years)}")
    if incomplete_years:
        print(f"  incomplete: {incomplete_years}")
    print(f"Fixture written to: {output_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
