import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

// Approximate center coordinates for Kaohsiung districts
const DISTRICT_COORDS = {
  '旗津區': { lat: 22.613, lng: 120.265 },
  '梓官區': { lat: 22.759, lng: 120.263 },
  '甲仙區': { lat: 23.084, lng: 120.591 },
  '路竹區': { lat: 22.857, lng: 120.263 },
  '左營區': { lat: 22.682, lng: 120.295 },
  '鼓山區': { lat: 22.655, lng: 120.271 },
  '三民區': { lat: 22.651, lng: 120.324 },
  '前鎮區': { lat: 22.608, lng: 120.329 },
  '苓雅區': { lat: 22.624, lng: 120.318 },
  '新興區': { lat: 22.633, lng: 120.308 },
  '鹽埕區': { lat: 22.625, lng: 120.286 },
  '楠梓區': { lat: 22.728, lng: 120.326 },
  '小港區': { lat: 22.564, lng: 120.346 },
  '鳳山區': { lat: 22.627, lng: 120.357 },
  '大寮區': { lat: 22.574, lng: 120.398 },
  '林園區': { lat: 22.504, lng: 120.395 },
  '仁武區': { lat: 22.701, lng: 120.350 },
  '大社區': { lat: 22.730, lng: 120.351 },
  '岡山區': { lat: 22.796, lng: 120.296 },
  '橋頭區': { lat: 22.757, lng: 120.306 },
  '燕巢區': { lat: 22.793, lng: 120.362 },
  '田寮區': { lat: 22.869, lng: 120.360 },
  '阿蓮區': { lat: 22.882, lng: 120.327 },
  '茄萣區': { lat: 22.905, lng: 120.224 },
  '湖內區': { lat: 22.891, lng: 120.239 },
  '永安區': { lat: 22.819, lng: 120.228 },
  '彌陀區': { lat: 22.789, lng: 120.247 },
  '旗山區': { lat: 22.888, lng: 120.483 },
  '美濃區': { lat: 22.898, lng: 120.542 },
  '六龜區': { lat: 23.003, lng: 120.633 },
  '杉林區': { lat: 23.044, lng: 120.539 },
  '內門區': { lat: 22.944, lng: 120.462 },
  '茂林區': { lat: 22.891, lng: 120.661 },
  '桃源區': { lat: 23.159, lng: 120.756 },
  '那瑪夏區': { lat: 23.272, lng: 120.710 },
  '前金區': { lat: 22.630, lng: 120.296 },
  '大樹區': { lat: 22.732, lng: 120.426 },
}

const DEFAULT_COORD = { lat: 22.627, lng: 120.301 }

const lines = readFileSync('data/raw/moi_web_places.jsonl', 'utf-8')
  .trim()
  .split('\n')

let nextId = 1

const places = lines.map((line) => {
  const raw = JSON.parse(line)
  const coords = DISTRICT_COORDS[raw.district] ?? DEFAULT_COORD
  const slug = String(nextId++)

  return {
    id: randomUUID(),
    slug,
    name: raw.name,
    religion_type: raw.religion_type,
    district: raw.district,
    address: raw.address,
    latitude: coords.lat,
    longitude: coords.lng,
    source_primary: raw.source_primary,
    source_confidence: 0.8,
    updated_at: '2026-02-22T00:00:00.000Z',
    publish_status: 'published',
    deity_name: raw.deity_name ?? null,
    phone: raw.phone ?? null,
  }
})

writeFileSync(
  'data/processed/places.json',
  JSON.stringify(places, null, 2),
  'utf-8'
)

console.log(`Converted ${places.length} places`)

// Show district distribution
const districtCounts = new Map()
for (const p of places) {
  districtCounts.set(p.district, (districtCounts.get(p.district) ?? 0) + 1)
}
const sorted = [...districtCounts.entries()].sort((a, b) => b[1] - a[1])
console.log('\nTop 10 districts:')
for (const [d, c] of sorted.slice(0, 10)) {
  console.log(`  ${d}: ${c}`)
}
