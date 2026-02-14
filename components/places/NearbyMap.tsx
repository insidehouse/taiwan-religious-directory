type NearbyItem = {
  id: string
  slug: string
  name: string
  district: string
  address: string
  distanceM: number
}

type NearbyMapProps = {
  items: NearbyItem[]
}

export default function NearbyMap({ items }: NearbyMapProps) {
  return (
    <section>
      <h2>附近場所</h2>
      <p>地圖模式（MVP 先用列表替代，下一階段接 Leaflet）。</p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
        {items.map((place) => (
          <li key={place.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <strong>{place.name}</strong>
            <p style={{ margin: '0.25rem 0' }}>{place.district}</p>
            <p style={{ margin: '0.25rem 0' }}>{place.address}</p>
            <p style={{ margin: '0.25rem 0' }}>距離 {Math.round(place.distanceM)} 公尺</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
