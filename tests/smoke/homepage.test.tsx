import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'
import { test, expect } from 'vitest'

test('shows product title', () => {
  render(<HomePage />)
  expect(screen.getByText('高雄宗教場所目錄')).toBeInTheDocument()
})
