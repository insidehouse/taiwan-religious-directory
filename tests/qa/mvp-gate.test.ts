import { test, expect } from 'vitest'
import { evaluateMvpGate } from '@/scripts/qa/verify_mvp_gate'

test('fails if published places are below 2000', async () => {
  const result = await evaluateMvpGate({ publishedPlaces: 1800, requiredCoverage: 0.95 })
  expect(result.pass).toBe(false)
})
