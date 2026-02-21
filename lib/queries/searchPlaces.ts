import type { PlacePublish } from '@/lib/domain/place'
import placesData from '@/data/processed/places.json'

const ALL_PLACES: PlacePublish[] = placesData as PlacePublish[]

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getPublishedPlaces(): PlacePublish[] {
  return ALL_PLACES.filter((place) => place.publish_status === 'published')
}

export function getPublishedPlaceBySlug(slug: string): PlacePublish | undefined {
  return getPublishedPlaces().find((place) => place.slug === slug)
}

export function getAllDistricts(): string[] {
  const districts = new Set(getPublishedPlaces().map((p) => p.district))
  return [...districts].sort()
}

export function getAllReligionTypes(): string[] {
  const types = new Set(getPublishedPlaces().map((p) => p.religion_type))
  return [...types].sort()
}

export function filterPlaces(options: {
  district?: string
  religionType?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const { district = '', religionType = '', keyword = '', page = 1, pageSize = 20 } = options

  let filtered = getPublishedPlaces()

  if (district) {
    filtered = filtered.filter((place) => place.district === district)
  }

  if (religionType) {
    filtered = filtered.filter((place) => place.religion_type === religionType)
  }

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase()
    filtered = filtered.filter((place) => {
      const haystack = `${place.name} ${place.address} ${place.deity_name ?? ''}`.toLowerCase()
      return haystack.includes(lowerKeyword)
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
