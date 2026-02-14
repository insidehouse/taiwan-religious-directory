import { getPublishedPlaces } from '@/lib/queries/searchPlaces'

type NearbyParams = {
  lat: number
  lng: number
  radiusKm: number
  limit: number
}

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

export async function searchNearbyPlaces({ lat, lng, radiusKm, limit }: NearbyParams) {
  const maxDistance = radiusKm * 1000

  return getPublishedPlaces()
    .map((place) => ({
      ...place,
      distanceM: haversineDistanceMeters(lat, lng, place.latitude, place.longitude),
    }))
    .filter((place) => place.distanceM <= maxDistance)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit)
}
