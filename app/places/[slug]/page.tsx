import { notFound } from 'next/navigation'
import FavoriteButton from '@/components/places/FavoriteButton'
import { getPublishedPlaceBySlug, getPublishedPlaces } from '@/lib/queries/searchPlaces'
import { toPlaceStructuredData } from '@/lib/seo/placeStructuredData'

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getPublishedPlaces().map((place) => ({ slug: place.slug }))
}

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { slug } = await params
  const place = getPublishedPlaceBySlug(slug)

  if (!place) {
    notFound()
  }

  const structuredData = toPlaceStructuredData({
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>{place.name}</h1>
      <p>{place.address}</p>
      <p>{place.district}</p>
      <p>宗教類型：{place.religion_type}</p>
      <FavoriteButton placeId={place.id} currentPath={`/places/${place.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  )
}
