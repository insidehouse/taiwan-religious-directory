'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import placesData from '@/data/processed/places.json'
import type { PlacePublish } from '@/lib/domain/place'

const ALL_PLACES: PlacePublish[] = placesData as PlacePublish[]

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

type NearbyResult = PlacePublish & { distanceM: number }

export default function NearbyPage() {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radiusKm, setRadiusKm] = useState('3')
  const [results, setResults] = useState<NearbyResult[]>([])
  const [searched, setSearched] = useState(false)
  const [locating, setLocating] = useState(false)

  const search = useCallback((latitude: number, longitude: number, radius: number) => {
    const maxDistance = radius * 1000
    const nearby = ALL_PLACES
      .map((place) => ({
        ...place,
        distanceM: haversineDistanceMeters(latitude, longitude, place.latitude, place.longitude),
      }))
      .filter((place) => place.distanceM <= maxDistance)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 20)

    setResults(nearby)
    setSearched(true)
  }, [])

  const handleSearch = () => {
    const latitude = Number(lat)
    const longitude = Number(lng)
    const radius = Number(radiusKm) || 3

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    search(latitude, longitude, radius)
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude.toFixed(6)
        const newLng = pos.coords.longitude.toFixed(6)
        setLat(newLat)
        setLng(newLng)
        setLocating(false)
        search(Number(newLat), Number(newLng), Number(radiusKm) || 3)
      },
      () => {
        setLocating(false)
      }
    )
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      <h1>附近探索</h1>

      <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={handleLocateMe}
          disabled={locating}
          style={{
            padding: '0.6rem 1rem',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {locating ? '定位中...' : '使用目前位置'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <label>
            緯度
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="22.627"
              style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
            />
          </label>
          <label>
            經度
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="120.301"
              style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
            />
          </label>
          <label>
            半徑（公里）
            <input
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
            />
          </label>
        </div>

        <button onClick={handleSearch} style={{ padding: '0.5rem', cursor: 'pointer' }}>
          搜尋附近場所
        </button>
      </div>

      {searched && results.length === 0 && (
        <p>附近沒有找到場所，試試增加搜尋半徑。</p>
      )}

      {results.length > 0 && (
        <section>
          <h2>找到 {results.length} 間場所</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
            {results.map((place) => (
              <li key={place.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>
                  <Link href={`/places/${place.slug}`}>{place.name}</Link>
                </h3>
                <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {place.district} ・ 距離 {place.distanceM < 1000
                    ? `${Math.round(place.distanceM)} 公尺`
                    : `${(place.distanceM / 1000).toFixed(1)} 公里`}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{place.address}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
