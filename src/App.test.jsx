import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { host } from './env'

// useStorage suffixes each key with the API host.
const SNAPSHOT = `snapshot:${host}`

// The backend is the network boundary: `/env` and `/select` answer from this
// state, and every `/select` body is recorded.
let backend

function item(pid) {
  // Square pages make the masonry place item i in column i % cols.
  return [pid, `t${pid}`, 1, 'a', [], [[1, 1, 'img', `${pid}.jpg`]], '', 1]
}

beforeEach(() => {
  backend = { env: { switch_defaults: ['frozen'] }, pids: [], selects: [] }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (url.endsWith('env')) return Response.json(backend.env)
    backend.selects.push(JSON.parse(init.body))
    return Response.json({ items: backend.pids.map(item) })
  })
})

// A reload: the App mounts afresh over the same localStorage.
async function load() {
  const view = render(<App />)
  const selects = backend.selects.length
  await waitFor(() => expect(backend.selects.length).toBe(selects + 1))
  await waitFor(() => expect(screen.queryByText('Loading..')).toBeNull())
  return view
}

// Reads the gallery back in array order by interleaving its columns.
function gallery_order() {
  const columns = []
  for (const img of document.querySelectorAll('img')) {
    const column = img.parentElement.parentElement
    let c = columns.find((x) => x.el === column)
    if (!c) {
      c = { el: column, pids: [] }
      columns.push(c)
    }
    c.pids.push(Number(img.alt.slice(1)))
  }
  const order = []
  const n = columns.length
  const total = columns.reduce((a, c) => a + c.pids.length, 0)
  for (let i = 0; i < total; ++i)
    order.push(columns[i % n].pids[Math.floor(i / n)])
  return order
}

function caption() {
  fireEvent.click(screen.getByLabelText('controls'))
  return screen.getByText(/pages from/).textContent
}

async function settle() {
  await act(async () => {})
}

describe('Freeze Order', () => {
  it('holds the first result order and membership across reloads', async () => {
    backend.pids = [1, 2, 3]
    let view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([1, 2, 3]))
    view.unmount()

    backend.pids = [4, 3, 2, 1]
    view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([1, 2, 3]))
    expect(caption()).not.toMatch(/missing/)
    view.unmount()
  })

  it('leaves an empty result unpinned', async () => {
    let view = await load()
    expect(localStorage.getItem(SNAPSHOT)).toBeNull()
    view.unmount()

    backend.pids = [5, 6]
    view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([5, 6]))
    view.unmount()

    backend.pids = [7, 6, 5]
    view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([5, 6]))
    view.unmount()
  })

  it('counts pinned illusts a result no longer contains', async () => {
    backend.pids = [1, 2, 3]
    let view = await load()
    view.unmount()

    backend.pids = [3, 1]
    view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([1, 3]))
    expect(caption()).toMatch(/, 1 missing$/)
    view.unmount()
  })

  it('follows the backend order while off', async () => {
    backend.env = {}
    backend.pids = [1, 2]
    let view = await load()
    view.unmount()

    backend.pids = [2, 1]
    view = await load()
    await waitFor(() => expect(gallery_order()).toEqual([2, 1]))
    view.unmount()
  })

  it('asks before a filter change discards the order', async () => {
    backend.env = { switch_defaults: ['frozen'], filter_defaults: ['$above:1'] }
    backend.pids = [1, 2]
    await load()
    await waitFor(() => expect(gallery_order()).toEqual([1, 2]))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    // Clicking a filter chip toggles it into ban_filters.
    fireEvent.click(screen.getByText('$above:1'))
    await settle()
    expect(confirm).toHaveBeenCalledOnce()
    expect(backend.selects.length).toBe(1)

    confirm.mockReturnValue(true)
    backend.pids = [2, 1]
    fireEvent.click(screen.getByText('$above:1'))
    await waitFor(() => expect(backend.selects.length).toBe(2))
    expect(backend.selects[1]).toEqual({
      filters: [],
      ban_filters: ['$above:1'],
    })
    await waitFor(() => expect(gallery_order()).toEqual([2, 1]))
  })

  it('asks before turning off discards the order', async () => {
    backend.pids = [1, 2]
    await load()
    await waitFor(() => expect(gallery_order()).toEqual([1, 2]))
    fireEvent.click(screen.getByLabelText('controls'))
    const toggle = screen.getByLabelText('Freeze Order')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    fireEvent.click(toggle)
    expect(confirm).toHaveBeenCalledOnce()
    expect(toggle.checked).toBe(true)
    expect(localStorage.getItem(SNAPSHOT)).not.toBeNull()

    confirm.mockReturnValue(true)
    fireEvent.click(toggle)
    expect(toggle.checked).toBe(false)
    expect(localStorage.getItem(SNAPSHOT)).toBe('null')
  })

  it('pins without asking while no order is stored', async () => {
    backend.env = { switch_defaults: ['frozen'], filter_defaults: ['$above:1'] }
    await load()
    const confirm = vi.spyOn(window, 'confirm')
    fireEvent.click(screen.getByText('$above:1'))
    await waitFor(() => expect(backend.selects.length).toBe(2))
    expect(confirm).not.toHaveBeenCalled()
  })
})

describe('Refresh', () => {
  it('re-runs the query', async () => {
    backend.pids = [1, 2]
    await load()
    backend.pids = [3, 1, 2]
    fireEvent.click(screen.getByTestId('MenuIcon'))
    fireEvent.click(await screen.findByText('Refresh'))
    await waitFor(() => expect(backend.selects.length).toBe(2))
    // Frozen by the default switch, so the new illust stays out.
    await waitFor(() => expect(gallery_order()).toEqual([1, 2]))
  })
})
