import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import FavoriteButton from '@/components/places/FavoriteButton'
import { getPublishedPlaceBySlug, getPublishedPlaces } from '@/lib/queries/searchPlaces'
import { toPlaceStructuredData } from '@/lib/seo/placeStructuredData'

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kaohsiung-religious-directory.example'
}

export async function generateStaticParams() {
  return getPublishedPlaces().map((place) => ({ slug: place.slug }))
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const place = getPublishedPlaceBySlug(slug)

  if (!place) {
    return {
      title: '場所不存在 | 高雄宗教場所目錄',
    }
  }

  return {
    title: `${place.name} - ${place.district} | 高雄宗教場所目錄`,
    description: `${place.name} 位於 ${place.address}，宗教類型為 ${place.religion_type}。`,
    alternates: {
      canonical: `${baseUrl()}/places/${place.slug}`,
    },
  }
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
