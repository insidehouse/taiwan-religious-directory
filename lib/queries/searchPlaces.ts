import type { PlacePublish } from '@/lib/domain/place'

const MOCK_PLACES: PlacePublish[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'zuoying-fengshan-temple',
    name: '鳳山宮',
    religion_type: 'taoism',
    district: '左營區',
    address: '高雄市左營區明德路 1 號',
    latitude: 22.682,
    longitude: 120.295,
    source_primary: 'outscraper',
    source_confidence: 0.9,
    updated_at: '2026-02-14T00:00:00.000Z',
    publish_status: 'published',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'gushan-longde-temple',
    name: '龍德寺',
    religion_type: 'buddhism',
    district: '鼓山區',
    address: '高雄市鼓山區鼓山二路 88 號',
    latitude: 22.627,
    longitude: 120.276,
    source_primary: 'moi',
    source_confidence: 0.85,
    updated_at: '2026-02-14T00:00:00.000Z',
    publish_status: 'published',
  },
]

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function searchPlaces(params: URLSearchParams) {
  const district = params.get('district')?.trim() ?? ''
  const religionType = params.get('religion_type')?.trim() ?? ''
  const keyword = params.get('keyword')?.trim().toLowerCase() ?? ''
  const page = parsePositiveInt(params.get('page'), 1)
  const pageSize = parsePositiveInt(params.get('pageSize'), 20)

  let filtered = MOCK_PLACES.filter((place) => place.publish_status === 'published')

  if (district) {
    filtered = filtered.filter((place) => place.district === district)
  }

  if (religionType) {
    filtered = filtered.filter((place) => place.religion_type === religionType)
  }

  if (keyword) {
    filtered = filtered.filter((place) => {
      const haystack = `${place.name} ${place.address}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    items: filtered.slice(start, end),
    total,
    page,
    pageSize,
  }
}
