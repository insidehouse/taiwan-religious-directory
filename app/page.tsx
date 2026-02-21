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
    <main className="page-main">
      <h1 className="page-title">高雄宗教場所目錄</h1>
      <p className="page-desc">
        收錄高雄市 {districts.length} 個行政區、共 {places.length.toLocaleString()} 間宗教場所的公開資料。
      </p>

      <div className="gap-row mt-lg">
        <Link href="/places" className="btn-primary">搜尋場所</Link>
        <Link href="/nearby" className="btn-ghost">附近探索</Link>
      </div>

      <section className="mt-xl">
        <h2 className="section-title">宗教類型分布</h2>
        <div className="stat-grid">
          {[...religionCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <span key={type} className="stat-chip">
                {RELIGION_LABELS[type] ?? type}
                <span className="stat-chip-count">{count.toLocaleString()}</span>
              </span>
            ))}
        </div>
      </section>

      <section className="mt-xl">
        <h2 className="section-title">行政區</h2>
        <div className="district-grid">
          {districts.map((d) => (
            <Link key={d} href={`/places?district=${encodeURIComponent(d)}`} className="district-link">
              {d}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
