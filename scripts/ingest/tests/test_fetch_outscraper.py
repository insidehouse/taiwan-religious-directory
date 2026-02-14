from scripts.ingest.fetch_outscraper import normalize_outscraper_row


def test_normalize_outscraper_row_has_required_keys():
    row = {"name": "某某宮", "full_address": "高雄市...", "lat": 22.6, "lng": 120.3}
    normalized = normalize_outscraper_row(row)
    assert normalized["name"] == "某某宮"
    assert normalized["latitude"] == 22.6
