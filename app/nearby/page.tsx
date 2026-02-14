import NearbyMap from '@/components/places/NearbyMap'
import { searchNearbyPlaces } from '@/lib/queries/nearbyPlaces'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type NearbyPageProps = {
  searchParams: SearchParams
}

function getSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function toNumber(value: string, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default async function NearbyPage({ searchParams }: NearbyPageProps) {
  const params = await searchParams
  const latStr = getSingle(params.lat)
  const lngStr = getSingle(params.lng)
  const radiusKm = toNumber(getSingle(params.radiusKm), 3)

  const hasCoordinates = latStr !== '' && lngStr !== ''
  const lat = toNumber(latStr, 22.627)
  const lng = toNumber(lngStr, 120.301)

  const items = hasCoordinates
    ? await searchNearbyPlaces({ lat, lng, radiusKm, limit: 20 })
    : []

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>附近探索</h1>
      <form action="/nearby" method="get" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
        <label>
          緯度
          <input name="lat" defaultValue={latStr} placeholder="22.627" />
        </label>
        <label>
          經度
          <input name="lng" defaultValue={lngStr} placeholder="120.301" />
        </label>
        <label>
          半徑（公里）
          <input name="radiusKm" defaultValue={String(radiusKm)} />
        </label>
        <button type="submit">搜尋附近場所</button>
      </form>

      {hasCoordinates ? <NearbyMap items={items} /> : <p>請輸入座標以查看附近場所。</p>}
    </main>
  )
}
