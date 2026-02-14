import { test, expect } from 'vitest'
import { PlacePublishSchema } from '@/lib/domain/place'

test('requires publish fields', () => {
  const parsed = PlacePublishSchema.safeParse({ name: '某某宮' })
  expect(parsed.success).toBe(false)
})
