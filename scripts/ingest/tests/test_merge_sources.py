"""Tests for three-source merge logic."""
from scripts.ingest.merge_sources import merge_record, record_key, name_key


class TestRecordKey:
    def test_creates_normalized_key(self):
        record = {"name": "龍皇宮", "address": "高雄市左營區..."}
        key = record_key(record)
        assert "龍皇宮" in key
        assert "|" in key

    def test_strips_whitespace(self):
        r1 = {"name": " 龍皇宮 ", "address": "高雄市"}
        r2 = {"name": "龍皇宮", "address": "高雄市"}
        assert record_key(r1) == record_key(r2)


class TestNameKey:
    def test_creates_name_only_key(self):
        record = {"name": "龍皇宮", "address": "some address"}
        key = name_key(record)
        assert "龍皇宮" in key
        assert "|" not in key


class TestMergeRecord:
    def test_two_source_confidence(self):
        """Original two-source merge still works."""
        merged = merge_record(
            gmap={"name": "龍皇宮", "address": "高雄市...", "latitude": 22.6, "longitude": 120.3},
            gov={"name": "龍皇宮", "address": "高雄市..."},
        )
        assert merged["source_confidence"] >= 0.8

    def test_three_source_confidence_higher(self):
        """Three-source match gets highest confidence."""
        merged = merge_record(
            gmap={"name": "龍皇宮", "address": "高雄市...", "latitude": 22.6, "longitude": 120.3},
            gov={"name": "龍皇宮", "address": "高雄市..."},
            moi_web={"name": "龍皇宮", "address": "高雄市...", "religion_type": "taoism"},
        )
        assert merged["source_confidence"] >= 0.9
        assert merged["publish_status"] == "published"

    def test_religion_type_from_moi_web(self):
        """religion_type should come from moi_web source."""
        merged = merge_record(
            gmap={"name": "龍皇宮", "address": "高雄市..."},
            moi_web={"name": "龍皇宮", "address": "高雄市...", "religion_type": "taoism"},
        )
        assert merged["religion_type"] == "taoism"

    def test_moi_web_only(self):
        """Records only in moi_web should still produce a record."""
        merged = merge_record(
            moi_web={
                "name": "某某教會",
                "address": "高雄市前金區...",
                "religion_type": "christianity",
                "phone": "07-1234567",
            },
        )
        assert merged["name"] == "某某教會"
        assert merged["religion_type"] == "christianity"
        assert merged["publish_status"] == "draft"

    def test_gmap_only_is_draft(self):
        """Google Maps only record (no gov/moi_web match) is draft."""
        merged = merge_record(
            gmap={"name": "某廟", "address": "高雄市...", "latitude": 22.6, "longitude": 120.3},
        )
        assert merged["publish_status"] == "draft"
        assert merged["source_confidence"] < 0.7

    def test_built_year_from_gov(self):
        """built_year comes from gov (open data) source."""
        merged = merge_record(
            gmap={"name": "龍皇宮", "address": "高雄市..."},
            gov={"name": "龍皇宮", "address": "高雄市...", "built_year": 1920},
            moi_web={"name": "龍皇宮", "address": "高雄市...", "religion_type": "taoism"},
        )
        assert merged["built_year"] == 1920

    def test_phone_priority(self):
        """Phone from gmap (first layer) takes precedence."""
        merged = merge_record(
            gmap={"name": "龍皇宮", "address": "高雄市...", "phone": "07-111"},
            moi_web={"name": "龍皇宮", "address": "高雄市...", "phone": "07-222"},
        )
        assert merged["phone"] == "07-111"

    def test_empty_sources(self):
        """All empty sources should not crash."""
        merged = merge_record()
        assert merged["name"] == ""
        assert merged["publish_status"] == "draft"
