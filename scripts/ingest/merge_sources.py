"""Merge Google Maps, MOI open data, and MOI website sources into unified records.

Three-source merge pipeline:
  1. Google Maps (Outscraper): lat/lng, phone, photos
  2. MOI open data API: deity_name, built_year
  3. MOI website scraper: religion_type, deity_name, district, phone

Usage:
    python -m scripts.ingest.merge_sources \
      --gmap data/raw/outscraper_places.jsonl \
      --gov data/raw/moi_places.jsonl \
      --moi-web data/raw/moi_web_places.jsonl \
      --city 高雄市 \
      --out data/processed/kaohsiung_places.jsonl
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional


def _clean_text(value: str) -> str:
    value = value.strip().lower()
    return re.sub(r"\s+", "", value)


def _clean_name(value: str) -> str:
    """Normalize name for matching: lowercase, strip whitespace."""
    return _clean_text(value)


def record_key(record: Dict[str, Any]) -> str:
    return f"{_clean_name(str(record.get('name', '')))}|{_clean_text(str(record.get('address', '')))}"


def name_key(record: Dict[str, Any]) -> str:
    """Secondary key using only name (for fuzzy matching when address differs)."""
    return _clean_name(str(record.get("name", "")))


def merge_record(
    gmap: Optional[Dict[str, Any]] = None,
    gov: Optional[Dict[str, Any]] = None,
    moi_web: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Merge up to three source records into one unified record.

    Priority: gmap (lat/lng, phone) > moi_web (religion_type) > gov (built_year)
    """
    gmap = gmap or {}
    gov = gov or {}
    moi_web = moi_web or {}

    score = 0.0

    # Name matching bonus
    names = [
        str(s.get("name", "")).strip()
        for s in (gmap, gov, moi_web)
        if s.get("name")
    ]
    unique_names = {_clean_name(n) for n in names if n}
    if len(unique_names) == 1 and len(names) >= 2:
        score += 0.5

    # Address matching bonus
    addresses = [
        str(s.get("address", "")).strip()
        for s in (gmap, gov, moi_web)
        if s.get("address")
    ]
    unique_addrs = {_clean_text(a) for a in addresses if a}
    if len(unique_addrs) == 1 and len(addresses) >= 2:
        score += 0.4

    # GPS bonus
    if gmap.get("latitude") is not None and gmap.get("longitude") is not None:
        score += 0.1

    # MOI web match bonus
    if moi_web:
        score += 0.15

    # Build merged record: start with gmap, overlay non-empty values from other sources
    merged: Dict[str, Any] = {}

    # Layer 1: gmap (base)
    for k, v in gmap.items():
        if v not in (None, ""):
            merged[k] = v

    # Layer 2: gov data (built_year, deity_name)
    for k, v in gov.items():
        if v not in (None, "") and k not in merged:
            merged[k] = v

    # Layer 3: moi_web (religion_type, district, deity_name, phone)
    for k, v in moi_web.items():
        if v not in (None, ""):
            # religion_type always comes from moi_web (highest authority)
            if k == "religion_type":
                merged[k] = v
            # Other fields: only fill if missing
            elif k not in merged:
                merged[k] = v

    # Ensure required fields have defaults
    if "name" not in merged:
        merged["name"] = (
            moi_web.get("name", "") or gov.get("name", "") or ""
        )
    if "address" not in merged:
        merged["address"] = (
            moi_web.get("address", "") or gov.get("address", "") or ""
        )

    merged["source_confidence"] = min(score, 1.0)
    merged["publish_status"] = "published" if score >= 0.7 else "draft"

    return merged


def read_jsonl(path: Path) -> Iterator[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge Google Maps, MOI open data, and MOI website sources"
    )
    parser.add_argument("--gmap", default="data/raw/outscraper_places.jsonl")
    parser.add_argument("--gov", default="data/raw/moi_places.jsonl")
    parser.add_argument("--moi-web", default="data/raw/moi_web_places.jsonl")
    parser.add_argument("--city", default="")
    parser.add_argument("--out", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    gmap_path = Path(args.gmap)
    gov_path = Path(args.gov)
    moi_web_path = Path(getattr(args, "moi_web"))

    gmap_rows: List[Dict[str, Any]] = (
        list(read_jsonl(gmap_path)) if gmap_path.exists() else []
    )
    gov_rows: List[Dict[str, Any]] = (
        list(read_jsonl(gov_path)) if gov_path.exists() else []
    )
    moi_web_rows: List[Dict[str, Any]] = (
        list(read_jsonl(moi_web_path)) if moi_web_path.exists() else []
    )

    # Build indices
    gov_index = {record_key(row): row for row in gov_rows}
    moi_web_index = {record_key(row): row for row in moi_web_rows}
    # Secondary index by name only (for fuzzy matching)
    moi_web_name_index = {name_key(row): row for row in moi_web_rows}

    seen_keys: set[str] = set()
    merged_rows: List[Dict[str, Any]] = []

    # Phase 1: Merge gmap records with matching gov and moi_web records
    for gmap in gmap_rows:
        if args.city and args.city not in str(gmap.get("address", "")):
            continue

        key = record_key(gmap)
        seen_keys.add(key)

        gov = gov_index.get(key)
        moi_web = moi_web_index.get(key)

        # Try name-only match if full key didn't match
        if moi_web is None:
            nkey = name_key(gmap)
            moi_web = moi_web_name_index.get(nkey)

        merged_rows.append(merge_record(gmap=gmap, gov=gov, moi_web=moi_web))

    # Phase 2: Add moi_web records not matched to any gmap record
    for moi_web_row in moi_web_rows:
        key = record_key(moi_web_row)
        if key in seen_keys:
            continue
        seen_keys.add(key)

        if args.city and args.city not in str(moi_web_row.get("address", "")):
            continue

        gov = gov_index.get(key)
        merged_rows.append(merge_record(gmap=None, gov=gov, moi_web=moi_web_row))

    write_jsonl(Path(args.out), merged_rows)

    # Summary
    religion_counts = Counter(r.get("religion_type", "unknown") for r in merged_rows)
    published = sum(1 for r in merged_rows if r.get("publish_status") == "published")

    print(f"Wrote {len(merged_rows)} rows to {args.out}")
    print(f"  Published: {published}, Draft: {len(merged_rows) - published}")
    print(f"  Sources: gmap={len(gmap_rows)}, gov={len(gov_rows)}, moi_web={len(moi_web_rows)}")
    if religion_counts:
        print(f"  Religion distribution: {dict(religion_counts.most_common())}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
