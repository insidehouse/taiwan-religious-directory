"""Scrape MOI religion website for religious organizations by city.

Usage:
    python -m scripts.ingest.fetch_moi_web --city 高雄市 --out data/raw/moi_web_places.jsonl
    python -m scripts.ingest.fetch_moi_web --city 高雄市 --out data/raw/moi_web_places.jsonl --max-pages 1  # test run
"""
from __future__ import annotations

import argparse
import json
import logging
import time
from collections import Counter
from pathlib import Path
from typing import Optional

import requests

from .models import MoiWebNormalized, MoiWebRecord
from .parse_moi_html import parse_results_table, parse_total_count, parse_total_pages
from .religion_map import COUNTRY_CODES, map_religion_type

logger = logging.getLogger(__name__)

MOI_SEARCH_URL = "https://religion.moi.gov.tw/Religion/FoundationTemple"

_DEFAULT_FORM_DATA: dict[str, str] = {
    "Name": "",
    "NameAdv": "",
    "ReligionType": "",
    "Country": "",
    "Area": "",
    "God": "",
    "RegisterType": "",
    "UniformNum": "",
    "RT": "false",
    "RL": "false",
    "RLT": "false",
    "RLC": "false",
    "RLF": "false",
    "RN": "false",
    "RNT": "false",
    "RNC": "false",
    "RNF": "false",
    "RG": "false",
    "Property_1": "false",
    "Property_2": "false",
    "Property_3": "false",
    "IsProperty": "",
    "Page": "1",
    "Searched": "{ value = yes }",
    "PageSize": "100",
}

_HEADERS: dict[str, str] = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://religion.moi.gov.tw",
    "Referer": "https://religion.moi.gov.tw/Religion/FoundationTemple",
}


def _build_form_data(country_code: str, page: int, page_size: int) -> dict[str, str]:
    return {
        **_DEFAULT_FORM_DATA,
        "Country": country_code,
        "Page": str(page),
        "PageSize": str(page_size),
    }


def fetch_page(
    session: requests.Session,
    country_code: str,
    page: int,
    page_size: int = 100,
    max_retries: int = 3,
    delay: float = 2.0,
) -> str:
    """Fetch a single page of search results. Returns raw HTML."""
    form_data = _build_form_data(country_code, page, page_size)

    for attempt in range(max_retries):
        try:
            response = session.post(
                f"{MOI_SEARCH_URL}?ci=1",
                data=form_data,
                headers=_HEADERS,
                timeout=30,
            )
            response.raise_for_status()
            response.encoding = "utf-8"
            return response.text
        except requests.RequestException as err:
            logger.warning("Page %d attempt %d/%d failed: %s", page, attempt + 1, max_retries, err)
            if attempt < max_retries - 1:
                time.sleep(delay * (attempt + 1))
            else:
                raise

    return ""  # unreachable


def normalize_record(record: MoiWebRecord) -> MoiWebNormalized:
    """Convert a raw scraped record to normalized form."""
    return MoiWebNormalized(
        name=record.name,
        religion_type=map_religion_type(record.religion_raw),
        deity_name=record.deity_name,
        district=record.district,
        address=record.address,
        phone=record.phone,
        source_primary="moi_web",
    )


def scrape_city(
    city: str,
    page_size: int = 100,
    delay_between_pages: float = 2.0,
    max_pages: Optional[int] = None,
) -> list[MoiWebNormalized]:
    """Scrape all religious organizations for a given city.

    Args:
        city: City name in Chinese, e.g. '高雄市'
        page_size: Results per page (20, 50, or 100)
        delay_between_pages: Seconds to wait between requests
        max_pages: Limit pages for testing (None = all)

    Returns:
        List of normalized records
    """
    country_code = COUNTRY_CODES.get(city)
    if country_code is None:
        raise ValueError(f"Unknown city: {city}. Available: {list(COUNTRY_CODES.keys())}")

    session = requests.Session()

    # Initialize session with a GET request
    session.get(
        f"{MOI_SEARCH_URL}?ci=1",
        headers={k: v for k, v in _HEADERS.items() if k != "Content-Type"},
        timeout=30,
    )

    # First POST to get total count
    logger.info("Fetching page 1 for %s (code=%s)...", city, country_code)
    first_html = fetch_page(session, country_code, page=1, page_size=page_size)

    total_records = parse_total_count(first_html)
    total_pages = parse_total_pages(first_html)
    logger.info("Found %d records across %d pages", total_records, total_pages)

    if max_pages is not None:
        total_pages = min(total_pages, max_pages)
        logger.info("Limited to %d pages by --max-pages", total_pages)

    # Parse first page
    all_raw: list[MoiWebRecord] = parse_results_table(first_html)
    logger.info("Page 1: parsed %d records", len(all_raw))

    # Fetch remaining pages
    for page_num in range(2, total_pages + 1):
        time.sleep(delay_between_pages)
        logger.info("Fetching page %d/%d...", page_num, total_pages)

        html = fetch_page(session, country_code, page=page_num, page_size=page_size)
        page_records = parse_results_table(html)
        all_raw.extend(page_records)
        logger.info("Page %d: %d records (total: %d)", page_num, len(page_records), len(all_raw))

    logger.info("Scraping complete: %d raw records from %s", len(all_raw), city)
    return [normalize_record(r) for r in all_raw]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape MOI religion website")
    parser.add_argument("--city", default="高雄市", help="City to scrape (default: 高雄市)")
    parser.add_argument("--out", required=True, help="Output JSONL path")
    parser.add_argument("--page-size", type=int, default=100, choices=[20, 50, 100])
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between pages in seconds")
    parser.add_argument("--max-pages", type=int, default=None, help="Limit pages for testing")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    records = scrape_city(
        city=args.city,
        page_size=args.page_size,
        delay_between_pages=args.delay,
        max_pages=args.max_pages,
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record.model_dump(), ensure_ascii=False) + "\n")

    # Print summary
    religion_counts = Counter(r.religion_type for r in records)
    district_counts = Counter(r.district for r in records)

    print(f"\nWrote {len(records)} records to {out_path}")
    print(f"\nReligion distribution:")
    for rtype, count in religion_counts.most_common():
        print(f"  {rtype}: {count}")
    print(f"\nTop 10 districts:")
    for district, count in district_counts.most_common(10):
        print(f"  {district}: {count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
