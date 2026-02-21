"""Tests for religion_map module."""
from scripts.ingest.religion_map import (
    MOI_RELIGION_MAP,
    VALID_RELIGION_TYPES,
    extract_district,
    map_religion_type,
    parse_religion_deity,
)


# All religion types listed on the MOI website dropdown
MOI_WEBSITE_RELIGION_TYPES = [
    "其他", "統一教", "摩門教", "天道", "佛教", "道教",
    "一貫道", "理教", "軒轅教", "天帝教", "天德聖教",
    "彌勒大道", "先天救教", "天主教", "基督教", "伊斯蘭教",
    "天理教", "巴哈伊教", "真光教團", "山達基", "東正教",
    "猶太教", "三一(夏)教",
]


class TestMapReligionType:
    def test_all_moi_types_have_mapping(self):
        for rt in MOI_WEBSITE_RELIGION_TYPES:
            result = map_religion_type(rt)
            assert result in VALID_RELIGION_TYPES, f"'{rt}' mapped to invalid '{result}'"

    def test_all_mapped_values_are_valid(self):
        for mapped in MOI_RELIGION_MAP.values():
            assert mapped in VALID_RELIGION_TYPES

    def test_direct_mappings(self):
        assert map_religion_type("道教") == "taoism"
        assert map_religion_type("佛教") == "buddhism"
        assert map_religion_type("基督教") == "christianity"
        assert map_religion_type("天主教") == "catholicism"
        assert map_religion_type("伊斯蘭教") == "islam"

    def test_folk_mappings(self):
        assert map_religion_type("一貫道") == "folk"
        assert map_religion_type("天道") == "folk"

    def test_unknown_defaults_to_other(self):
        assert map_religion_type("未知的宗教") == "other"


class TestParseReligionDeity:
    def test_standard_format(self):
        religion, deity = parse_religion_deity("道教/天上聖母")
        assert religion == "道教"
        assert deity == "天上聖母"

    def test_with_parenthetical(self):
        religion, deity = parse_religion_deity("其他(儒教)/關聖帝君與觀音菩薩")
        assert religion == "其他"
        assert deity == "關聖帝君與觀音菩薩"

    def test_religion_only(self):
        religion, deity = parse_religion_deity("佛教")
        assert religion == "佛教"
        assert deity == ""

    def test_empty_deity(self):
        religion, deity = parse_religion_deity("道教/")
        assert religion == "道教"
        assert deity == ""

    def test_multiple_slashes_in_deity(self):
        religion, deity = parse_religion_deity("佛教/釋迦牟尼佛/觀世音菩薩")
        assert religion == "佛教"
        assert deity == "釋迦牟尼佛/觀世音菩薩"


class TestExtractDistrict:
    def test_kaohsiung(self):
        assert extract_district("高雄市旗津區") == "旗津區"

    def test_taipei(self):
        assert extract_district("臺北市大安區") == "大安區"

    def test_no_city_prefix(self):
        assert extract_district("旗津區") == "旗津區"

    def test_empty(self):
        assert extract_district("") == ""
