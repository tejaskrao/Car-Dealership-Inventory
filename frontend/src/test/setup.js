import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount rendered components and clear storage between tests so they stay independent.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
