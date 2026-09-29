import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom implements neither; the gallery's infinite scroll and scroll
// restoration only need them to exist.
globalThis.IntersectionObserver = class {
  observe() {}
  disconnect() {}
}
window.scrollTo = () => {}
window.scrollBy = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
