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
    <main className="page-main">
      <h1 className="page-title">搜尋場所</h1>

      <div className="filter-row mt-lg">
        <div>
          <label className="filter-label" htmlFor="district">行政區</label>
          <select
            id="district"
            className="filter-select"
            value={district}
            onChange={(e) => { setDistrict(e.target.value); resetPage() }}
          >
            <option value="">全部</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="filter-label" htmlFor="religion">宗教類型</label>
          <select
            id="religion"
            className="filter-select"
            value={religionType}
            onChange={(e) => { setReligionType(e.target.value); resetPage() }}
          >
            <option value="">全部</option>
            {religionTypes.map((t) => (
              <option key={t} value={t}>{RELIGION_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="filter-label" htmlFor="keyword">關鍵字</label>
          <input
            id="keyword"
            className="filter-input"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); resetPage() }}
            placeholder="場所名稱、地址或主祀神明"
          />
        </div>
      </div>

      <p className="result-count">共 {filtered.length.toLocaleString()} 筆結果</p>

      <div className="place-list">
        {paged.map((place) => (
          <div key={place.id} className="place-card">
            <div className="place-card-name">
              <Link href={`/places/${place.slug}`}>{place.name}</Link>
            </div>
            <div className="place-card-meta">
              {place.district} · {RELIGION_LABELS[place.religion_type] ?? place.religion_type}
              {place.deity_name ? ` · ${place.deity_name}` : ''}
            </div>
            <div className="place-card-address">{place.address}</div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            上一頁
          </button>
          <span className="pagination-info">第 {page} / {totalPages} 頁</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
            下一頁
          </button>
        </div>
      )}
    </main>
  )
}
