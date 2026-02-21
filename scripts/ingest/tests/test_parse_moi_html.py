"""Tests for parse_moi_html module using real HTML fixture."""
from pathlib import Path

from scripts.ingest.parse_moi_html import (
    parse_results_table,
    parse_total_count,
    parse_total_pages,
)
from scripts.ingest.religion_map import VALID_RELIGION_TYPES, map_religion_type

FIXTURE_DIR = Path(__file__).parent / "fixtures"
FIXTURE_FILE = FIXTURE_DIR / "moi_results_page1.html"


def _load_fixture() -> str:
    return FIXTURE_FILE.read_text(encoding="utf-8")


class TestParseTotalCount:
    def test_extracts_count(self):
        html = _load_fixture()
        count = parse_total_count(html)
        assert count >= 1600, f"Expected >= 1600 records for Kaohsiung, got {count}"

    def test_no_match_returns_zero(self):
        assert parse_total_count("<html></html>") == 0


class TestParseTotalPages:
    def test_extracts_pages(self):
        html = _load_fixture()
        pages = parse_total_pages(html)
        assert pages >= 80, f"Expected >= 80 pages, got {pages}"

    def test_no_match_returns_zero(self):
        assert parse_total_pages("<html></html>") == 0


class TestParseResultsTable:
    def test_extracts_records(self):
        html = _load_fixture()
        records = parse_results_table(html)
        assert len(records) == 20, f"Expected 20 records (PageSize=20), got {len(records)}"

    def test_first_record_has_name(self):
        records = parse_results_table(_load_fixture())
        assert records[0].name, "First record should have a name"

    def test_all_records_have_required_fields(self):
        records = parse_results_table(_load_fixture())
        for i, r in enumerate(records):
            assert r.name, f"Record {i} missing name"
            assert r.religion_raw, f"Record {i} ({r.name}) missing religion_raw"
            assert r.district, f"Record {i} ({r.name}) missing district"
            assert r.address, f"Record {i} ({r.name}) missing address"

    def test_religion_raw_is_mappable(self):
        records = parse_results_table(_load_fixture())
        for r in records:
            mapped = map_religion_type(r.religion_raw)
            assert mapped in VALID_RELIGION_TYPES, (
                f"'{r.religion_raw}' from '{r.name}' maps to invalid '{mapped}'"
            )

    def test_address_contains_city(self):
        records = parse_results_table(_load_fixture())
        for r in records:
            assert "高雄市" in r.address, (
                f"Record '{r.name}' address '{r.address}' missing city prefix"
            )

    def test_known_first_record(self):
        """Verify against manually inspected data."""
        records = parse_results_table(_load_fixture())
        first = records[0]
        assert first.name == "勸善社志德堂"
        assert first.religion_raw == "其他"
        assert first.deity_name == "關聖帝君與觀音菩薩"
        assert first.district == "旗津區"
        assert "旗津區" in first.address
        assert first.phone == "07-5711433"
        assert first.registration_type == "正式登記"

    def test_second_record_taoism(self):
        records = parse_results_table(_load_fixture())
        second = records[1]
        assert second.name == "茄苳坑北極宮"
        assert second.religion_raw == "道教"
        assert second.deity_name == "玄天上帝"

    def test_empty_html_returns_empty(self):
        assert parse_results_table("<html></html>") == []

    def test_no_data_div_returns_empty(self):
        assert parse_results_table("<div>no table here</div>") == []
