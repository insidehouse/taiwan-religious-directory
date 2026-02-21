"""Religion type mapping from MOI website labels to application enum values."""
from __future__ import annotations


VALID_RELIGION_TYPES = frozenset({
    "taoism", "buddhism", "christianity", "catholicism",
    "islam", "folk", "other",
})

MOI_RELIGION_MAP: dict[str, str] = {
    # Direct mappings
    "道教": "taoism",
    "佛教": "buddhism",
    "基督教": "christianity",
    "天主教": "catholicism",
    "伊斯蘭教": "islam",
    # Folk / syncretic religions
    "一貫道": "folk",
    "天道": "folk",
    "先天救教": "folk",
    "彌勒大道": "folk",
    # Other organized religions
    "統一教": "other",
    "摩門教": "other",
    "理教": "other",
    "軒轅教": "other",
    "天帝教": "other",
    "天德聖教": "other",
    "天理教": "other",
    "巴哈伊教": "other",
    "真光教團": "other",
    "山達基": "other",
    "東正教": "other",
    "猶太教": "other",
    "三一(夏)教": "other",
    "其他": "other",
}

COUNTRY_CODES: dict[str, str] = {
    "臺北市": "B", "基隆市": "L", "新北市": "1", "宜蘭縣": "E",
    "新竹市": "J", "新竹縣": "3", "桃園市": "2", "苗栗縣": "4",
    "臺中市": "C", "彰化縣": "6", "南投縣": "T", "嘉義市": "G",
    "嘉義縣": "8", "雲林縣": "7", "臺南市": "N", "高雄市": "K",
    "澎湖縣": "F", "屏東縣": "P", "臺東縣": "D", "花蓮縣": "H",
    "金門縣": "M", "連江縣": "X",
}

CITY_PREFIXES = (
    "高雄市", "臺北市", "臺中市", "臺南市", "新北市",
    "桃園市", "基隆市", "新竹市", "嘉義市",
)


def map_religion_type(raw_religion: str) -> str:
    """Map a MOI religion label to the application enum value."""
    return MOI_RELIGION_MAP.get(raw_religion, "other")


def parse_religion_deity(combined: str) -> tuple[str, str]:
    """Parse combined religion/deity string.

    Examples:
        '道教/天上聖母'           -> ('道教', '天上聖母')
        '其他(儒教)/關聖帝君'     -> ('其他', '關聖帝君')
        '佛教'                   -> ('佛教', '')
    """
    if "/" not in combined:
        return (combined.strip(), "")
    parts = combined.split("/", 1)
    religion_raw = parts[0].strip()
    deity = parts[1].strip()
    # Remove parenthetical sub-type: '其他(儒教)' -> '其他'
    paren_idx = religion_raw.find("(")
    if paren_idx > 0:
        religion_raw = religion_raw[:paren_idx]
    return (religion_raw, deity)


def extract_district(admin_area: str) -> str:
    """Extract district from admin area string.

    Example: '高雄市旗津區' -> '旗津區'
    """
    for prefix in CITY_PREFIXES:
        if admin_area.startswith(prefix):
            return admin_area[len(prefix):]
    return admin_area
