import { test, expect } from 'vitest'
import { GET } from '@/app/api/nearby/route'

test('returns places within radius', async () => {
  const req = new Request('http://localhost/api/nearby?lat=22.62&lng=120.30&radiusKm=3')
  const res = await GET(req)
  expect(res.status).toBe(200)

  const payload = await res.json()
  expect(Array.isArray(payload.items)).toBe(true)
})
