import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { host } from './env'

// env.js reads the build variables when App imports it.
vi.hoisted(() => vi.stubEnv('VITE_SCORE_URLS', 'image=http://scores/image'))

// useStorage suffixes each key with the API host.
const SNAPSHOT = `snapshot:${host}`

// The backend is the network boundary: `/env`, `/select`, the score source and
// its details answer from this state, and every `/select` and score request
// body is recorded.
let backend

function item(pid) {
  // Square pages make the masonry place item i in column i % cols.
  return [pid, `t${pid}`, 1, 'a', ['tag'], [[1, 1, 'img', `${pid}.jpg`]], '', 1]
}

beforeEach(() => {
  backend = {
    env: { switch_defaults: ['frozen'] },
    pids: [],
    selects: [],
    scores: {},
    score_asks: [],
    details: {},
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (url.endsWith('env')) return Response.json(backend.env)
    if (url.startsWith('http://scores/image/')) {
      const body = backend.details[url.slice(url.lastIndexOf('/') + 1)]
      return body ? Response.json(body) : new Response(null, { status: 404 })
    }
    if (url === 'http://scores/image') {
      backend.score_asks.push(JSON.parse(init.body))
      return Response.json(backend.scores)
    }
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

describe('Viewer', () => {
  const viewer = () => document.querySelector('.react-images__view-image')

  it('opens from the title bar under Go to Link', async () => {
    localStorage.setItem(`show_title:${host}`, 'true')
    localStorage.setItem(`goto_link:${host}`, 'true')
    backend.pids = [1]
    await load()
    expect(screen.getByAltText('t1').closest('a')).not.toBeNull()

    fireEvent.click(screen.getByText('t1'))
    await waitFor(() => expect(viewer()).not.toBeNull())
  })

  it('lets the text of a filter chip be selected', async () => {
    backend.env = { filter_defaults: ['$above:1'] }
    await load()
    const chip = screen.getByText('$above:1')

    // fireEvent returns false when a handler cancelled the default action.
    expect(fireEvent.mouseDown(chip)).toBe(true)
    window.getSelection().selectAllChildren(chip)
    fireEvent.click(chip)
    await settle()
    expect(window.getSelection().toString()).toBe('$above:1')
    expect(backend.selects.length).toBe(1)
  })

  it('keeps the viewer closed when title text was selected', async () => {
    localStorage.setItem(`show_title:${host}`, 'true')
    backend.pids = [1]
    await load()

    const title = screen.getByText('t1')
    window.getSelection().selectAllChildren(title)
    fireEvent.click(title)
    await settle()
    expect(viewer()).toBeNull()
  })

  it('keeps a chip whose text was selected from filtering', async () => {
    backend.env = {}
    backend.pids = [1]
    await load()
    fireEvent.click(screen.getByAltText('t1'))
    await waitFor(() => expect(viewer()).not.toBeNull())

    const chip = screen.getByText('tag')
    window.getSelection().selectAllChildren(chip)
    fireEvent.click(chip)
    await settle()
    expect(viewer()).not.toBeNull()
    expect(backend.selects.length).toBe(1)

    window.getSelection().removeAllRanges()
    fireEvent.click(chip)
    await waitFor(() => expect(backend.selects.length).toBe(2))
    expect(backend.selects[1].filters).toEqual(['tag'])
  })
})

describe('Scores', () => {
  const pick = () => localStorage.setItem(`score_source:${host}`, '"image"')
  const toggle = (label) => {
    fireEvent.click(screen.getByLabelText('controls'))
    return screen.queryByLabelText(label)
  }

  it("shows the picked source's scores in the backend order", async () => {
    pick()
    backend.pids = [1, 2, 3]
    backend.scores = { 1: 0.5, 3: 2 }
    await load()
    await waitFor(() => expect(screen.getByText('+2.00')).not.toBeNull())
    expect(screen.getByText('+0.50')).not.toBeNull()
    expect(backend.score_asks).toEqual([[1, 2, 3]])
    expect(gallery_order()).toEqual([1, 2, 3])
  })

  it('sorts by score with unscored illusts at the tail', async () => {
    pick()
    localStorage.setItem(`score_sorted:${host}`, 'true')
    backend.pids = [1, 2, 3, 4]
    backend.scores = { 2: -1, 3: 2 }
    await load()
    await waitFor(() => expect(gallery_order()).toEqual([3, 2, 1, 4]))
  })

  it('hides Sort by Score until a source is picked', async () => {
    await load()
    expect(toggle('Sort by Score')).toBeNull()
    expect(backend.score_asks).toEqual([])
  })

  it('lets Sort by Date win and disables the other sort', async () => {
    pick()
    localStorage.setItem(`score_sorted:${host}`, 'true')
    localStorage.setItem(`resorted:${host}`, 'true')
    backend.pids = [1, 2, 3]
    backend.scores = { 1: 2, 3: -1 }
    await load()
    await waitFor(() => expect(backend.score_asks.length).toBe(1))
    await settle()
    expect(gallery_order()).toEqual([3, 2, 1])
    expect(toggle('Sort by Score').disabled).toBe(true)

    fireEvent.click(screen.getByLabelText('Sort by Date'))
    await waitFor(() => expect(gallery_order()).toEqual([1, 3, 2]))
    expect(screen.getByLabelText('Sort by Date').disabled).toBe(true)
    expect(screen.getByLabelText('Sort by Score').disabled).toBe(false)
  })

  it("merges the score source's detail into the viewed illust", async () => {
    pick()
    // Freeze Order off, so a filter change needs no confirmation.
    backend.env = {}
    backend.pids = [1, 2]
    backend.scores = { 1: 0.5 }
    backend.details = {
      1: {
        tags: ['tag', 'sky'],
        meta: { score: 3, tag_notes: { sky: '0.62 (+0.10)', a: '(+1.00)' } },
      },
    }
    await load()
    fireEvent.click(screen.getByAltText('t1'))
    await waitFor(() => expect(screen.getByText('0.62 (+0.10)')).not.toBeNull())
    expect(screen.getByText('sky')).not.toBeNull()
    expect(screen.getByText('(+1.00)')).not.toBeNull()
    expect(screen.getAllByText('tag').length).toBe(1)
    expect(screen.getByText('+3.00')).not.toBeNull()

    fireEvent.click(screen.getByText('sky'))
    fireEvent.click(screen.getByText('tag'))
    await waitFor(() => expect(backend.selects.length).toBe(2))
    expect(backend.selects[1].filters).toEqual(['tag'])
  })
})
