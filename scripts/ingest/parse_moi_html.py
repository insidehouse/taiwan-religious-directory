"""Parse MOI religion website HTML search results into structured records.

The search results page at religion.moi.gov.tw contains two tables:
  - Table 0: Desktop layout (inside #pg02_data), correct column order
  - Table 1: Mobile/responsive layout, different column order

We only parse Table 0 (desktop). Columns:
  0: 團體名稱     (Name)
  1: 主管機關     (Supervising authority) — skipped
  2: 行政區       (Admin area, e.g. '高雄市旗津區')
  3: 地址         (Address — has Google Maps <a> with full address in title)
  4: 電話         (Phone)
  5: 負責人       (Responsible person)
  6: 教別/主祀神祇 (Religion/Deity, e.g. '道教/玄天上帝')
  7: 登記別       (Registration type)
  8: 統一編號     (Unified number — often empty)
  9: 其他         (Icons — skipped)
 10: 最後更新日期  (Last updated, e.g. '2025/02/17')
"""
from __future__ import annotations

import re
from urllib.parse import unquote

from bs4 import BeautifulSoup

from .models import MoiWebRecord
from .religion_map import extract_district, parse_religion_deity


def parse_total_count(html: str) -> int:
    """Extract total record count from '共82頁，1635筆資料'."""
    match = re.search(r"共\d+頁，(\d+)筆資料", html)
    return int(match.group(1)) if match else 0


def parse_total_pages(html: str) -> int:
    """Extract total page count from '共82頁，1635筆資料'."""
    match = re.search(r"共(\d+)頁，\d+筆資料", html)
    return int(match.group(1)) if match else 0


def _extract_full_address(addr_cell) -> str:
    """Get full address from the Google Maps link in the address cell.

    The link title contains e.g.:
      '高雄市旗津區中洲里中洲巷52號 位置顯示於google地圖[另開新視窗]'
    """
    link = addr_cell.find("a")
    if link is None:
        return addr_cell.get_text(strip=True)

    title = link.get("title", "")
    if title:
        # Strip the suffix
        suffix_idx = title.find(" 位置顯示")
        if suffix_idx > 0:
            return title[:suffix_idx].strip()
        return title.strip()

    # Fallback: decode the URL query parameter
    href = link.get("href", "")
    q_match = re.search(r"[?&]q=([^&]+)", href)
    if q_match:
        return unquote(q_match.group(1))

    return addr_cell.get_text(strip=True)


def parse_results_table(html: str) -> list[MoiWebRecord]:
    """Parse the desktop results table into a list of MoiWebRecord."""
    soup = BeautifulSoup(html, "html.parser")

    # Find the desktop table inside #pg02_data
    data_div = soup.find("div", id="pg02_data")
    if data_div is None:
        return []

    table = data_div.find("table")
    if table is None:
        return []

    records: list[MoiWebRecord] = []
    rows = table.find_all("tr")

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 11:
            continue

        name = cells[0].get_text(strip=True)
        admin_area = cells[2].get_text(strip=True)
        full_address = _extract_full_address(cells[3])
        phone = cells[4].get_text(strip=True)
        responsible = cells[5].get_text(strip=True)
        religion_deity_raw = cells[6].get_text(strip=True)
        registration = cells[7].get_text(strip=True)
        unified = cells[8].get_text(strip=True)
        last_updated = cells[10].get_text(strip=True)

        religion_raw, deity = parse_religion_deity(religion_deity_raw)
        district = extract_district(admin_area)

        records.append(MoiWebRecord(
            name=name,
            religion_raw=religion_raw,
            deity_name=deity,
            district=district,
            address=full_address,
            phone=phone,
            responsible_person=responsible,
            registration_type=registration,
            unified_number=unified,
            last_updated=last_updated,
        ))

    return records
