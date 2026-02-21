'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import placesData from '@/data/processed/places.json'
import type { PlacePublish } from '@/lib/domain/place'

const ALL_PLACES: PlacePublish[] = placesData as PlacePublish[]

const RELIGION_LABELS: Record<string, string> = {
  taoism: '道教',
  buddhism: '佛教',
  christianity: '基督教',
  catholicism: '天主教',
  islam: '伊斯蘭教',
  folk: '民間信仰',
  other: '其他',
}

const PAGE_SIZE = 30

export default function PlacesPage() {
  const [district, setDistrict] = useState('')
  const [religionType, setReligionType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const districts = useMemo(() => {
    const set = new Set(ALL_PLACES.map((p) => p.district))
    return [...set].sort()
  }, [])

  const religionTypes = useMemo(() => {
    const set = new Set(ALL_PLACES.map((p) => p.religion_type))
    return [...set].sort()
  }, [])

  const filtered = useMemo(() => {
    let result = ALL_PLACES

    if (district) {
      result = result.filter((p) => p.district === district)
    }

    if (religionType) {
      result = result.filter((p) => p.religion_type === religionType)
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      result = result.filter((p) => {
        const haystack = `${p.name} ${p.address} ${p.deity_name ?? ''}`.toLowerCase()
        return haystack.includes(lowerKeyword)
      })
    }

    return result
  }, [district, religionType, keyword])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>高雄宗教場所搜尋</h1>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
        <label>
          行政區
          <select
            value={district}
            onChange={(e) => { setDistrict(e.target.value); resetPage() }}
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
          >
            <option value="">全部</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          宗教類型
          <select
            value={religionType}
            onChange={(e) => { setReligionType(e.target.value); resetPage() }}
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
          >
            <option value="">全部</option>
            {religionTypes.map((t) => (
              <option key={t} value={t}>{RELIGION_LABELS[t] ?? t}</option>
            ))}
          </select>
        </label>

        <label>
          關鍵字
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); resetPage() }}
            placeholder="搜尋場所名稱、地址或主祀神明"
            style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
          />
        </label>
      </div>

      <p>共 {filtered.length} 筆結果</p>

      <ul style={{ display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none' }}>
        {paged.map((place) => (
          <li key={place.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              <Link href={`/places/${place.slug}`}>{place.name}</Link>
            </h2>
            <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
              {place.district} ・ {RELIGION_LABELS[place.religion_type] ?? place.religion_type}
              {place.deity_name ? ` ・ ${place.deity_name}` : ''}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{place.address}</p>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            上一頁
          </button>
          <span>第 {page} / {totalPages} 頁</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
            下一頁
          </button>
        </div>
      )}
    </main>
  )
}
