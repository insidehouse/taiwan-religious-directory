import Link from 'next/link'
import { getPublishedPlaces, getAllDistricts } from '@/lib/queries/searchPlaces'

const RELIGION_LABELS: Record<string, string> = {
  taoism: '道教',
  buddhism: '佛教',
  christianity: '基督教',
  catholicism: '天主教',
  islam: '伊斯蘭教',
  folk: '民間信仰',
  other: '其他',
}

export default function HomePage() {
  const places = getPublishedPlaces()
  const districts = getAllDistricts()

  const religionCounts = new Map<string, number>()
  for (const p of places) {
    religionCounts.set(p.religion_type, (religionCounts.get(p.religion_type) ?? 0) + 1)
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>高雄宗教場所目錄</h1>
      <p style={{ color: '#666', marginTop: '0.5rem' }}>
        收錄高雄市 {districts.length} 個行政區、共 {places.length} 間宗教場所的公開資料。
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <Link
          href="/places"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#0070f3',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          搜尋場所
        </Link>
        <Link
          href="/nearby"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            border: '1px solid #ddd',
            borderRadius: 8,
          }}
        >
          附近探索
        </Link>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2>宗教類型分布</h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {[...religionCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <li
                key={type}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: '#f5f5f5',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                }}
              >
                {RELIGION_LABELS[type] ?? type} {count}
              </li>
            ))}
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>行政區</h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {districts.map((d) => (
            <Link
              key={d}
              href={`/places?district=${encodeURIComponent(d)}`}
              style={{
                padding: '0.3rem 0.6rem',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: '0.85rem',
              }}
            >
              {d}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
