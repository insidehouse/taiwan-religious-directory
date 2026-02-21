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

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`
}

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
    <main className="page-main">
      <h1 className="page-title">附近探索</h1>
      <p className="page-desc">使用目前位置或輸入座標，找出附近的宗教場所。</p>

      <div className="mt-lg">
        <button className="locate-btn" onClick={handleLocateMe} disabled={locating}>
          {locating ? '定位中...' : '使用目前位置'}
        </button>

        <div className="coord-grid">
          <div>
            <label className="filter-label" htmlFor="lat">緯度</label>
            <input id="lat" className="filter-input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="22.627" />
          </div>
          <div>
            <label className="filter-label" htmlFor="lng">經度</label>
            <input id="lng" className="filter-input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="120.301" />
          </div>
          <div>
            <label className="filter-label" htmlFor="radius">半徑（公里）</label>
            <input id="radius" className="filter-input" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
          </div>
        </div>

        <button className="search-btn" onClick={handleSearch}>搜尋附近場所</button>
      </div>

      {searched && results.length === 0 && (
        <p className="result-count mt-lg">附近沒有找到場所，試試增加搜尋半徑。</p>
      )}

      {results.length > 0 && (
        <section className="mt-xl">
          <h2 className="section-title">找到 {results.length} 間場所</h2>
          <div className="nearby-list">
            {results.map((place) => (
              <div key={place.id} className="nearby-card">
                <div className="nearby-card-name">
                  <Link href={`/places/${place.slug}`}>{place.name}</Link>
                </div>
                <div className="place-card-meta">
                  {place.district} · <span className="nearby-distance">{formatDistance(place.distanceM)}</span>
                </div>
                <div className="place-card-address">{place.address}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
