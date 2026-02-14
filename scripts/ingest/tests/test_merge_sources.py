from scripts.ingest.merge_sources import merge_record


def test_merge_record_assigns_confidence():
    merged = merge_record({"name": "龍皇宮", "address": "高雄市..."}, {"name": "龍皇宮", "address": "高雄市..."})
    assert merged["source_confidence"] >= 0.8
