import { test, expect } from '@playwright/test'

test('user can filter by district on places page', async ({ page }) => {
  await page.goto('/places')
  await page.selectOption('[name="district"]', '左營區')

  const cards = page.locator('ul li')
  await expect(cards).toHaveCount(1)
  await expect(cards.first().locator('p').first()).toHaveText('左營區')
})
