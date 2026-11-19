import { beforeEach, describe, expect, it, vi } from 'vitest'

// env.js resolves everything once at import, so each case imports it afresh.
async function load(vars, picked) {
  vi.resetModules()
  vi.unstubAllEnvs()
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v)
  if (picked) localStorage.setItem('backend', picked)
  return import('./env')
}

// The dev server expects the API on the page's host at :5678.
const origin = `${window.location.protocol}//${window.location.hostname}:5678/`

beforeEach(() => vi.unstubAllEnvs())

describe('backends', () => {
  it('resolves relative URLs against the API origin', async () => {
    const env = await load({
      VITE_API_HOSTS: 'main=/, side=/side,far=http://x:1/a',
      VITE_SCORE_URLS: 'image=/side/scores/image',
    })
    expect(env.backends).toEqual([
      { name: 'main', url: origin },
      { name: 'side', url: `${origin}side/` },
      { name: 'far', url: 'http://x:1/a/' },
    ])
    expect(env.score_sources).toEqual([
      { name: 'image', url: `${origin}side/scores/image` },
    ])
  })

  it('serves the picked backend, or the first one', async () => {
    const vars = { VITE_API_HOSTS: 'main=/,side=/side/' }
    expect((await load(vars, 'side')).host).toBe(`${origin}side/`)
    expect((await load(vars, 'gone')).backend.name).toBe('main')
  })

  it('falls back to the API origin alone', async () => {
    const env = await load({})
    expect(env.backends).toEqual([{ name: 'origin', url: origin }])
  })

  it('rejects an entry without a name', async () => {
    await expect(load({ VITE_API_HOSTS: '/side/' })).rejects.toThrow(
      'VITE_API_HOSTS entry without a name: /side/',
    )
  })
})
