from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional


def _clean_text(value: str) -> str:
    value = value.strip().lower()
    return re.sub(r"\s+", "", value)


def record_key(record: Dict[str, Any]) -> str:
    return f"{_clean_text(str(record.get('name', '')))}|{_clean_text(str(record.get('address', '')))}"


def merge_record(gmap: Dict[str, Any], gov: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    gov = gov or {}
    score = 0.0

    gmap_name = str(gmap.get("name", "")).strip()
    gov_name = str(gov.get("name", "")).strip()
    if gmap_name and gov_name and gmap_name == gov_name:
        score += 0.5

    gmap_address = str(gmap.get("address", "")).strip()
    gov_address = str(gov.get("address", "")).strip()
    if gmap_address and gov_address and gmap_address == gov_address:
        score += 0.4

    if gmap.get("latitude") is not None and gmap.get("longitude") is not None:
        score += 0.1

    merged = {
        **gmap,
        **{k: v for k, v in gov.items() if v not in (None, "")},
        "source_confidence": min(score, 1.0),
        "publish_status": "published" if score >= 0.7 else "draft",
    }
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
    parser = argparse.ArgumentParser(description="Merge Google and government religion source files")
    parser.add_argument("--gmap", default="data/raw/outscraper_places.jsonl")
    parser.add_argument("--gov", default="data/raw/moi_places.jsonl")
    parser.add_argument("--city", default="")
    parser.add_argument("--out", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    gmap_path = Path(args.gmap)
    gov_path = Path(args.gov)

    gmap_rows: List[Dict[str, Any]] = list(read_jsonl(gmap_path)) if gmap_path.exists() else []
    gov_rows: List[Dict[str, Any]] = list(read_jsonl(gov_path)) if gov_path.exists() else []

    gov_index = {record_key(row): row for row in gov_rows}

    merged_rows: List[Dict[str, Any]] = []
    for gmap in gmap_rows:
        if args.city and args.city not in str(gmap.get("address", "")):
            continue

        gov = gov_index.get(record_key(gmap))
        merged_rows.append(merge_record(gmap, gov))

    write_jsonl(Path(args.out), merged_rows)
    print(f"wrote {len(merged_rows)} rows to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
