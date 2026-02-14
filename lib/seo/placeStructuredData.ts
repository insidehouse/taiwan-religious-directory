type PlaceInput = {
  name: string
  address: string
  latitude: number
  longitude: number
}

export function toPlaceStructuredData(place: PlaceInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PlaceOfWorship',
    name: place.name,
    address: place.address,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.latitude,
      longitude: place.longitude,
    },
  }
}
