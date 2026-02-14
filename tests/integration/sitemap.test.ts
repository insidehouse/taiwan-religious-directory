import { test, expect } from 'vitest'
import sitemap from '@/app/sitemap'

test('sitemap includes published place URLs', async () => {
  const entries = await sitemap()
  const urls = entries.map((entry) => entry.url)

  expect(urls.some((url) => url.includes('/places/zuoying-fengshan-temple'))).toBe(true)
})
