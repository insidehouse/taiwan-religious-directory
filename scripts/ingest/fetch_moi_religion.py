from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

import requests


MOI_OPEN_DATA_URL = "https://data.moi.gov.tw/MoiOD/System/DownloadFile.aspx?DATA=F472A9CC-E557-4D0A-ABF8-CE9F27A0A2C7"


def normalize_moi_row(row: Dict[str, Any]) -> Dict[str, Any]:
    name = str(row.get("寺廟名稱") or row.get("name") or "").strip()
    address = str(row.get("地址") or row.get("address") or "").strip()
    deity = str(row.get("主祀神祇") or row.get("deity_name") or "").strip()
    built_year = row.get("建立年代") or row.get("built_year")
    built_year_int = None
    if built_year is not None:
        matched = re.search(r"\d{3,4}", str(built_year))
        if matched:
            built_year_int = int(matched.group(0))

    return {
        "name": name,
        "address": address,
        "deity_name": deity,
        "built_year": built_year_int,
        "source_primary": "moi",
    }


def fetch_moi_rows(url: str = MOI_OPEN_DATA_URL) -> List[Dict[str, Any]]:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    payload = response.json()

    if isinstance(payload, dict):
        rows: Iterable[Dict[str, Any]] = payload.get("result", {}).get("records", [])
    elif isinstance(payload, list):
        rows = payload
    else:
        rows = []

    return [normalize_moi_row(row) for row in rows]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch MOI religion data")
    parser.add_argument("--out", required=True, help="Output JSONL path")
    parser.add_argument("--city", default="", help="Optional city filter")
    parser.add_argument("--url", default=MOI_OPEN_DATA_URL)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = fetch_moi_rows(args.url)

    if args.city:
        rows = [row for row in rows if args.city in row.get("address", "")]

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"wrote {len(rows)} rows to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
