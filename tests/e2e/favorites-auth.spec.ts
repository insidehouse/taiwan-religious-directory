import { test, expect } from '@playwright/test'

test('unauthenticated user is redirected to login on favorite', async ({ page }) => {
  await page.goto('/places/zuoying-fengshan-temple')
  await page.getByRole('button', { name: '收藏' }).click()
  await expect(page).toHaveURL(/\/login/)
})
