import { searchNearbyPlaces } from '@/lib/queries/nearbyPlaces'

function parseNumber(value: string | null): number | null {
  if (value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const lat = parseNumber(url.searchParams.get('lat'))
  const lng = parseNumber(url.searchParams.get('lng'))
  const radiusKm = parseNumber(url.searchParams.get('radiusKm')) ?? 3
  const limit = parseNumber(url.searchParams.get('limit')) ?? 20

  if (lat === null || lng === null) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const items = await searchNearbyPlaces({
    lat,
    lng,
    radiusKm,
    limit,
  })

  return Response.json({ items }, { status: 200 })
}
