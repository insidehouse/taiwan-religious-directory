import { test, expect } from 'vitest'
import { toPlaceStructuredData } from '@/lib/seo/placeStructuredData'

test('generates PlaceOfWorship schema', () => {
  const jsonld = toPlaceStructuredData({
    name: '龍山寺',
    address: '高雄市...',
    latitude: 22.6,
    longitude: 120.3,
  })

  expect(jsonld['@type']).toBe('PlaceOfWorship')
})
