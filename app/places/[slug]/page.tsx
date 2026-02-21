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
    <main className="page-main">
      <Link href="/places" className="back-link">← 返回列表</Link>

      <h1 className="page-title mt-md">{place.name}</h1>

      <dl className="detail-grid">
        <div className="detail-item">
          <dt className="detail-label">地址</dt>
          <dd className="detail-value">{place.address}</dd>
        </div>
        <div className="detail-item">
          <dt className="detail-label">行政區</dt>
          <dd className="detail-value">{place.district}</dd>
        </div>
        <div className="detail-item">
          <dt className="detail-label">宗教類型</dt>
          <dd className="detail-value">{RELIGION_LABELS[place.religion_type] ?? place.religion_type}</dd>
        </div>
        {place.deity_name && (
          <div className="detail-item">
            <dt className="detail-label">主祀神明</dt>
            <dd className="detail-value">{place.deity_name}</dd>
          </div>
        )}
        {place.phone && (
          <div className="detail-item">
            <dt className="detail-label">電話</dt>
            <dd className="detail-value">{place.phone}</dd>
          </div>
        )}
      </dl>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  )
}
