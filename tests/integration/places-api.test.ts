import { test, expect } from 'vitest'
import { GET } from '@/app/api/places/route'

test('filters places by district', async () => {
  const req = new Request('http://localhost/api/places?district=左營區')
  const res = await GET(req)
  expect(res.status).toBe(200)

  const payload = await res.json()
  expect(Array.isArray(payload.items)).toBe(true)
  expect(payload.items.every((item: { district: string }) => item.district === '左營區')).toBe(true)
})
