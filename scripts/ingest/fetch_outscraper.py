from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, Iterable, List

import requests


OUTSCRAPER_ENDPOINT = "https://api.app.outscraper.com/maps/search-v3"


def normalize_outscraper_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "name": row.get("name", "").strip(),
        "address": row.get("full_address", "").strip(),
        "latitude": float(row["lat"]),
        "longitude": float(row["lng"]),
        "phone": row.get("phone", ""),
        "source_primary": "outscraper",
    }


def fetch_outscraper_rows(query: str, *, api_key: str, limit: int = 1000) -> List[Dict[str, Any]]:
    response = requests.get(
        OUTSCRAPER_ENDPOINT,
        params={"query": query, "limit": limit},
        headers={"X-API-KEY": api_key},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    rows: Iterable[Dict[str, Any]] = payload[0].get("results", []) if isinstance(payload, list) and payload else []
    return [normalize_outscraper_row(row) for row in rows]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch Kaohsiung religious places from Outscraper")
    parser.add_argument("--query", required=True, help="Search query, e.g. 高雄市 寺廟")
    parser.add_argument("--out", required=True, help="Output JSONL path")
    parser.add_argument("--limit", type=int, default=1000)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.getenv("OUTSCRAPER_API_KEY", "")
    if not api_key:
        raise SystemExit("OUTSCRAPER_API_KEY is required")

    rows = fetch_outscraper_rows(args.query, api_key=api_key, limit=args.limit)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"wrote {len(rows)} rows to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
