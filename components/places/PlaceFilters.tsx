'use client'

import { useRef } from 'react'

type PlaceFiltersProps = {
  district: string
  keyword: string
  religionType: string
}

const DISTRICT_OPTIONS = ['左營區', '鼓山區']
const RELIGION_OPTIONS = [
  { value: 'taoism', label: '道教' },
  { value: 'buddhism', label: '佛教' },
]

export default function PlaceFilters({ district, keyword, religionType }: PlaceFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const submitForm = () => {
    formRef.current?.requestSubmit()
  }

  return (
    <form
      ref={formRef}
      action="/places"
      method="get"
      style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}
    >
      <label>
        行政區
        <select name="district" defaultValue={district} onChange={submitForm}>
          <option value="">全部</option>
          {DISTRICT_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label>
        宗教類型
        <select name="religion_type" defaultValue={religionType} onChange={submitForm}>
          <option value="">全部</option>
          {RELIGION_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        關鍵字
        <input name="keyword" defaultValue={keyword} placeholder="搜尋場所名稱或地址" />
      </label>

      <button type="submit">套用篩選</button>
    </form>
  )
}
