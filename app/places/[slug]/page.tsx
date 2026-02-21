import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublishedPlaceBySlug, getPublishedPlaces } from '@/lib/queries/searchPlaces'
import { toPlaceStructuredData } from '@/lib/seo/placeStructuredData'

const RELIGION_LABELS: Record<string, string> = {
  taoism: '道教',
  buddhism: '佛教',
  christianity: '基督教',
  catholicism: '天主教',
  islam: '伊斯蘭教',
  folk: '民間信仰',
  other: '其他',
}

type PlaceDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getPublishedPlaces().map((place) => ({ slug: place.slug }))
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const place = getPublishedPlaceBySlug(slug)

  if (!place) {
    return { title: '場所不存在 | 高雄宗教場所目錄' }
  }

  return {
    title: `${place.name} - ${place.district} | 高雄宗教場所目錄`,
    description: `${place.name} 位於 ${place.address}，宗教類型為 ${RELIGION_LABELS[place.religion_type] ?? place.religion_type}。`,
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
      <Link href="/places" style={{ color: '#0070f3', fontSize: '0.9rem' }}>
        ← 返回列表
      </Link>

      <h1 style={{ marginTop: '0.75rem' }}>{place.name}</h1>

      <dl style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
        <div>
          <dt style={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>地址</dt>
          <dd style={{ margin: 0 }}>{place.address}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>行政區</dt>
          <dd style={{ margin: 0 }}>{place.district}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>宗教類型</dt>
          <dd style={{ margin: 0 }}>{RELIGION_LABELS[place.religion_type] ?? place.religion_type}</dd>
        </div>
        {place.deity_name && (
          <div>
            <dt style={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>主祀神明</dt>
            <dd style={{ margin: 0 }}>{place.deity_name}</dd>
          </div>
        )}
        {place.phone && (
          <div>
            <dt style={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>電話</dt>
            <dd style={{ margin: 0 }}>{place.phone}</dd>
          </div>
        )}
      </dl>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  )
}
