import Link from 'next/link'

type PlaceItem = {
  id: string
  slug: string
  name: string
  district: string
  address: string
  religion_type: string
}

type PlaceListProps = {
  items: PlaceItem[]
  total: number
}

export default function PlaceList({ items, total }: PlaceListProps) {
  return (
    <section>
      <p>共 {total} 筆</p>
      <ul style={{ display: 'grid', gap: '1rem', padding: 0, listStyle: 'none' }}>
        {items.map((place) => (
          <li key={place.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>
              <Link href={`/places/${place.slug}`}>{place.name}</Link>
            </h2>
            <p style={{ margin: '0.35rem 0' }}>{place.district}</p>
            <p style={{ margin: 0 }}>{place.address}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
