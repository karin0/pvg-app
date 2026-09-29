import { useEffect, useMemo, useReducer, useState } from 'react'
import './index.css'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import MenuIcon from '@mui/icons-material/Menu'
import {
  Alert,
  AppBar,
  Box,
  Chip,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  Snackbar,
  TextField,
  Toolbar,
  useScrollTrigger,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'

import AppDrawer from './AppDrawer'
import { host } from './env'
import FloatingControls from './FloatingControls'
import {
  BookmarkContext,
  EnvContext,
  FilterTagsContext,
  PvgGallery,
  TagUpdaterContext,
} from './gallery'
import ListboxComponent from './Listbox'
import { getTheme } from './theme'
import { useSharedStorage, useStorage } from './util'

function compare(a, b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function compare_fallback(a, b, fallback) {
  if (a < b) return -1
  if (a > b) return 1
  return fallback()
}

function HideOnScroll(props) {
  const { children, window } = props
  const trigger = useScrollTrigger({ target: window ? window() : undefined })

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  )
}

const reg_bad = new RegExp(
  decodeURIComponent(
    atob(
      'Ui0xJTdDJUU4JUFBJTk4JUUzJTgxJUEzJUUzJTgxJUE2JTdDJUUzJTgzJTkxJUUzJTgzJUIzJUUzJTgzJTg0JTdDJUU4JUJDJUFBJUUzJTgzJTgxJUUzJTgzJUE5JTdDJUU1JUI3JUE4JUU0JUI5JUIzJTdDJUUzJTgxJUEzJUUzJTgxJUIxJUUzJTgxJTg0JTdDJUU0JUJBJThCJUU1JUJFJThDJTdDJUU0JUJBJThCJUU1JTg5JThEJTdDJUU5JUFEJTg1JUU2JTgzJTkxJTdDJUU4JUIwJUI3JUU5JTk2JTkzJTdDJUU2JUE1JUI1JUU0JUI4JThBJUUzJTgxJUFFJUU0JUI5JUIzJTdDJUU5JTlDJUIyJUU1JTg3JUJBJTdDJUU1JUIwJUJCJUU3JUE1JTlFJTdDJUUzJTgyJUFBJUUzJTgzJThBJUUzJTgzJThCJTdDJUU1JThEJThBJUU4JUEzJUI4JTdDJUUzJTgyJUI3JUUzJTgzJUJDJUUzJTgzJTg0JTdDJUU1JUE0JUFBJUUzJTgyJTgyJUUzJTgyJTgyJTdDJUU4JUEzJUI4JUU4JUI2JUIzJTdDJUU0JUI4JThCJUU3JTlEJTgwJTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUUzJTgxJTgyJUUzJTgxJTkyJTdDJUUzJTgxJTk5JUUzJTgxJTk4JTdDJUUzJTgxJUI3JUUzJTgxJUFCJUUzJTgxJUJFJUUzJTgyJTkzJTdDJUUzJTgxJUIxJUUzJTgyJTkzJUUzJTgxJUE0JTdDJUUzJTgxJThBJUUzJTgxJUI4JUUzJTgxJTlEJTdDJUU0JUI4JUFEJUU1JTg3JUJBJUUzJTgxJTk3JTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUU0JUI4JThBJUUzJTgxJTkyJTdDJUU2JThBJUIxJUUzJTgxJThEJUU2JTlFJTk1JTdDJUU3JUI3JThBJUU3JUI4JTlCJTdDJUU2JThCJTk4JUU2JTlEJTlG',
    ),
  ),
)

const BOOKMARK_DONE = { state: 'done' }

function get_tag_list(imgs) {
  const s = new Map()
  let last_pid
  for (const img of imgs) {
    const { pid } = img
    if (pid === last_pid) continue
    last_pid = pid

    for (const tag of img.tags) {
      const c = s.get(tag)
      s.set(tag, c ? c + 1 : 1)
    }
    const tag = img.author
    const c = s.get(tag)
    s.set(tag, c ? c + 1 : 1)
  }
  return Array.from(s[Symbol.iterator]()).sort((a, b) =>
    compare_fallback(b[1], a[1], () => compare(a[0], b[0])),
  )
}

function App() {
  const [dark, set_dark] = useSharedStorage('dark_mode', false)
  const current_theme = useMemo(() => getTheme(dark ? 'dark' : 'light'), [dark])

  const [env, set_env] = useState(null)
  const [error, set_error] = useState(null)
  const [loaded, set_loaded] = useState(false)
  // The backend's latest result, tagged with the filters it answers.
  const [result, set_result] = useState(null)
  const [tags_curr, set_tags_curr] = useStorage('tags_curr', [])
  const [tags_banned, set_tags_banned] = useStorage('tags_banned', [])
  const [locating_id, set_locating_id] = useState(-1)
  const [refreshes, refresh_query] = useReducer((n) => n + 1, 0)
  const [drawer_open, set_drawer_open] = useState(false)
  const [safe, set_safe] = useSharedStorage('safe', false, (v) => {
    if (!v && window.location.search.includes('safe=1')) return true
    return v
  })

  // A switch the user never touched against this backend (stored value null)
  // follows the default it declares, which may arrive after mount; deriving the
  // effective value each render lets a late `env` apply without freezing a
  // stale default.
  const useSwitch = (key) => {
    const [v, set_v] = useStorage(key, null)
    return [v ?? (env?.switch_defaults ?? []).includes(key), set_v]
  }
  const [resorted, set_resorted] = useSwitch('resorted')
  const [reversed, set_reversed] = useSwitch('reversed')
  const [grouped, set_grouped] = useSwitch('grouped')
  const [expanded, set_expanded] = useSwitch('expanded')
  const [show_title, set_show_title] = useSwitch('show_title')
  const [goto_link, set_goto_link] = useSwitch('goto_link')
  const [frozen, set_frozen] = useSwitch('frozen')

  // Freeze Order pins the membership and order of the first non-empty result
  // for the current filters, so a round read across reloads keeps its
  // positions while the item data stays fresh. An empty result stays unpinned,
  // since pinning it would hide every later arrival.
  const [snapshot, set_snapshot] = useStorage('snapshot', null)
  useEffect(() => {
    if (frozen && result?.items.length && result.key !== snapshot?.key)
      set_snapshot({ key: result.key, pids: result.items.map((o) => o.pid) })
  }, [frozen, result, snapshot, set_snapshot])

  const confirm_discard = () =>
    !(frozen && snapshot) ||
    window.confirm('This discards the frozen order. Continue?')

  const tags_curr_map = new Map()
  for (let i = 0; i < tags_curr.length; ++i) tags_curr_map.set(tags_curr[i], i)

  // Bookmarking goes to whichever backend `/env` names, one illust per POST. A
  // success outlives the page, since `/select` carries no bookmark status and a
  // round can span days; a pending or failed click belongs to this session. A
  // rejection carries the reason the source platform gave (a rate limit, an
  // expired token), which the failing heart and the snackbar both show.
  const [bookmarked, set_bookmarked] = useStorage('bookmarked', [])
  const [bookmark_tried, set_bookmark_tried] = useState(() => new Map())
  const [bookmark_failure, set_bookmark_failure] = useState(null)
  const bookmark_url = env?.bookmark_url
  const bookmark_ctx = useMemo(() => {
    if (!bookmark_url) return null
    const states = new Map(bookmark_tried)
    for (const pid of bookmarked) states.set(pid, BOOKMARK_DONE)
    const fail = (pid, message) => {
      console.error('bookmark', pid, message)
      set_bookmark_tried((m) =>
        new Map(m).set(pid, { state: 'error', message }),
      )
      set_bookmark_failure({ pid, message })
    }
    const add = (pid) => {
      set_bookmark_tried((m) => new Map(m).set(pid, { state: 'pending' }))
      fetch(bookmark_url, {
        method: 'POST',
        body: JSON.stringify({ id: pid }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        // A pending heart is disabled, so a request that never settles would
        // leave the illust unbookmarkable for the rest of the session.
        signal: AbortSignal.timeout(30000),
      }).then(
        async (res) => {
          if (res.ok) {
            set_bookmarked((a) => (a.includes(pid) ? a : a.concat([pid])))
            set_bookmark_tried((m) => {
              const n = new Map(m)
              n.delete(pid)
              return n
            })
          } else {
            const body = (await res.text()).trim()
            fail(pid, body || `HTTP ${res.status}`)
          }
        },
        (error) => fail(pid, error.message),
      )
    }
    return { states, add }
  }, [bookmark_url, bookmarked, bookmark_tried, set_bookmarked])

  const [resp, missing] = useMemo(() => {
    if (!result) return [[], 0]
    if (!(frozen && snapshot?.key === result.key)) return [result.items, 0]
    const by_pid = new Map(result.items.map((o) => [o.pid, o]))
    const kept = []
    for (const pid of snapshot.pids) {
      const o = by_pid.get(pid)
      if (o) kept.push(o)
    }
    return [kept, snapshot.pids.length - kept.length]
  }, [result, frozen, snapshot])

  const images = useMemo(() => {
    const imgs = resp
    if (safe)
      return imgs.filter((img) => {
        if (img.san !== 1) return false
        for (const tag of img.tags) if (reg_bad.test(tag)) return false
        return true
      })
    return imgs.slice(0)
  }, [resp, safe])

  const tags = useMemo(() => {
    return get_tag_list(images)
  }, [images])

  const stats = useMemo(() => {
    const pages = images.reduce((acc, o) => acc + o.pages.length, 0)
    const users = new Set(images.map((o) => o.aid)).size
    return (
      <>
        {`${pages} pages from ${images.length} illusts by ${users} users`}
        {missing > 0 && (
          <Box component="span" sx={{ color: 'error.main' }}>
            {`, ${missing} missing`}
          </Box>
        )}
      </>
    )
  }, [images, missing])

  const gallery_switches = [
    { label: 'Sort by Date', checked: resorted, setChecked: set_resorted },
    { label: 'Reversed', checked: reversed, setChecked: set_reversed },
    { label: 'Group by User', checked: grouped, setChecked: set_grouped },
    { label: 'Expanded', checked: expanded, setChecked: set_expanded },
    { label: 'Show Titles', checked: show_title, setChecked: set_show_title },
    { label: 'Go to Link', checked: goto_link, setChecked: set_goto_link },
    {
      label: 'Freeze Order',
      checked: frozen,
      setChecked: (on) => {
        if (on) set_frozen(true)
        else if (confirm_discard()) {
          set_snapshot(null)
          set_frozen(false)
        }
      },
    },
  ]

  function update() {
    // console.log('update with', this.state.tags_curr, this.state.locating_id);
    const filters = []
    const ban_filters = []
    for (const tag of tags_curr) {
      if (tags_banned.includes(tag)) ban_filters.push(tag)
      else filters.push(tag)
    }
    const key = JSON.stringify([filters, ban_filters])
    console.debug('update', filters, ban_filters)
    fetch(host + 'select', {
      crossDomain: true,
      method: 'POST',
      body: JSON.stringify({
        filters,
        ban_filters,
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then((res) => res.json())
      .then(
        (res) => {
          console.debug('update response', res?.items?.length)
          const resp = res.items.map((illust) => {
            const [
              pid,
              title,
              aid,
              author,
              tags,
              raw_pages,
              date,
              san,
              ...rest
            ] = illust
            const meta = rest.length ? rest[rest.length - 1] : undefined
            const pages = raw_pages.map((page, ind) => {
              const [w, h, pre, fn] = page
              const nav = `/${pid}/${ind}`
              // w & h are the upscale dialog's fallback when the on-screen
              // image isn't measurable at open time
              return {
                pid,
                ind,
                // the illust's served page count, carried by each of its pages
                // so a page standing on its own still knows it
                pc: raw_pages.length,
                title,
                author,
                aid,
                tags,
                w: w || undefined,
                h: h || undefined,
                fn,
                iid: pid * 200 + ind,
                ori: 'img' + nav,
                thu: pre + nav,
                date,
                san,
                meta,
              }
            })
            return {
              pid,
              title,
              author,
              aid,
              tags,
              pages,
              date,
              san,
              meta,
            }
          })
          set_loaded(true)
          set_error(null)
          set_result({ key, items: resp })
          // A heart can only be shown for an illust the backend still returns.
          const alive = new Set(resp.map((o) => o.pid))
          set_bookmarked((a) => {
            const kept = a.filter((pid) => alive.has(pid))
            return kept.length === a.length ? a : kept
          })
        },
        (error) => {
          set_loaded(true)
          set_error(error)
          set_result(null)
        },
      )
  }

  const set_tags = (tags) => {
    if (!confirm_discard()) return
    const s = new Set()
    const tags_curr = tags.filter((tag) => {
      if (s.has(tag)) return false
      s.add(tag)
      return true
    })
    console.debug('set_tags', tags, tags_curr)
    set_tags_curr(tags_curr)
    set_tags_banned(tags_banned.filter((t) => s.has(t)))
    set_locating_id(-1)
  }

  const toggle_tag = (tag, id, pos) => {
    if (!confirm_discard()) return
    console.debug('toggle_tag', tag, id, pos, tags_curr, tags_banned)
    if (pos === undefined) set_tags_curr(tags_curr.concat([tag]))
    else {
      const tags = tags_curr.slice(0)
      tags.splice(pos, 1)
      set_tags_curr(tags)
      const p = tags_banned.indexOf(tag)
      if (p >= 0) {
        console.debug('removing from banned', p, tag)
        set_tags_banned(tags_banned.filter((t) => t !== tag))
      }
    }
    set_locating_id(id)
  }

  const open_drawer = () => set_drawer_open(true)
  const close_drawer = () => set_drawer_open(false)

  const refresh = () => {
    set_locating_id(-1)
    refresh_query()
    close_drawer()
  }

  const toggle_safe = () => {
    set_locating_id(-1)
    set_safe(!safe)
  }

  // The first query waits for `env`, which may still add the backend's
  // suggested filters to it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: locating_id and refreshes gate the refetch - re-locate and Refresh re-run the query by changing them
  useEffect(() => {
    if (env) update()
  }, [env, tags_curr, tags_banned, locating_id, refreshes])

  useEffect(() => {
    fetch(host + 'env', {
      crossDomain: true,
      method: 'GET',
    })
      .then((res) => res.json())
      .then(
        (res) => {
          console.log('env:', res)
          // A backend may suggest filters for a client holding none of its own.
          if (res.filter_defaults?.length) {
            set_tags_curr((curr) => (curr.length ? curr : res.filter_defaults))
          }
          set_env(res)
        },
        (error) => {
          set_loaded(true)
          set_error(error)
        },
      )
  }, [set_tags_curr])

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={current_theme}>
        <CssBaseline />
        <HideOnScroll>
          <AppBar position="fixed">
            <Toolbar variant="dense">
              <IconButton
                edge="start"
                sx={{ marginRight: 2 }}
                color="inherit"
                onClick={open_drawer}
                size="large"
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ width: '100%', '& > * + *': { marginTop: 3 } }}>
                <Autocomplete
                  multiple
                  freeSolo
                  autoSelect
                  size="small"
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  options={tags}
                  slotProps={{ listbox: { component: ListboxComponent } }}
                  getOptionLabel={(o) => o[0]}
                  renderOption={(props, tag) => {
                    // row box comes from Listbox's react-window itemSize
                    return (
                      <li {...props}>
                        {tag[0]}
                        <Chip
                          label={tag[1]}
                          size="small"
                          style={{
                            marginLeft: '1em',
                          }}
                        />
                      </li>
                    )
                  }}
                  renderValue={(value, getItemProps) =>
                    value.map((option, index) => {
                      const banned = tags_banned.includes(option)
                      return (
                        // biome-ignore lint/correctness/useJsxKeyInIterable: getItemProps supplies the key via spread
                        <Chip
                          sx={{
                            userSelect: 'text',
                            zIndex: 7,
                            ...(banned
                              ? { bgcolor: '#e57373', color: 'inherit' }
                              : {
                                  bgcolor: dark ? '#1e293b' : '#e3f2fd',
                                  color: dark ? '#90caf9' : '#1976d2',
                                }),
                          }}
                          variant={banned ? 'filled' : 'outlined'}
                          color={banned ? 'error' : 'primary'}
                          label={option}
                          onClick={() => {
                            if (!confirm_discard()) return
                            const p = tags_banned.indexOf(option)
                            const a = tags_banned.slice(0)
                            if (p >= 0) {
                              a.splice(p, 1)
                            } else {
                              a.push(option)
                            }
                            set_tags_banned(a)
                          }}
                          {...getItemProps({ index })}
                        />
                      )
                    })
                  }
                  renderInput={(params) => (
                    <TextField fullWidth color="primary" {...params} />
                  )}
                  onChange={(_, value) => {
                    set_tags(
                      value.map((t) => (typeof t === 'string' ? t : t[0])),
                    )
                  }}
                  value={tags_curr}
                  sx={{
                    '& .MuiAutocomplete-clearIndicator': { color: 'white' },
                    '& .MuiInputBase-input': { color: 'white' },
                  }}
                />
              </Box>
            </Toolbar>
          </AppBar>
        </HideOnScroll>
        <EnvContext.Provider value={env}>
          <AppDrawer
            open={drawer_open}
            setOpen={set_drawer_open}
            onRefresh={refresh}
            safe={safe}
            toggleSafe={toggle_safe}
            dark={dark}
            toggleDark={set_dark}
          />
          <Container
            sx={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 4 }}
            maxWidth="lg"
          >
            {error ? (
              'Error'
            ) : loaded && env ? (
              // env carries the illust/author URL prefixes the gallery links
              // use; gating on it avoids a first paint with the Pixiv fallbacks.
              <BookmarkContext.Provider value={bookmark_ctx}>
                <TagUpdaterContext.Provider value={toggle_tag}>
                  <FilterTagsContext.Provider value={tags_curr_map}>
                    <PvgGallery
                      images={images}
                      locating_id={locating_id}
                      resorted={resorted}
                      reversed={reversed}
                      grouped={grouped}
                      expanded={expanded}
                      show_title={show_title}
                      goto_link={goto_link}
                    />
                  </FilterTagsContext.Provider>
                </TagUpdaterContext.Provider>
              </BookmarkContext.Provider>
            ) : (
              'Loading..'
            )}
          </Container>
        </EnvContext.Provider>
        <FloatingControls
          switches={gallery_switches}
          caption={loaded && env ? stats : null}
        />
        <Snackbar
          open={bookmark_failure !== null}
          autoHideDuration={15000}
          onClose={() => set_bookmark_failure(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => set_bookmark_failure(null)}
            sx={{ maxWidth: 520, wordBreak: 'break-word' }}
          >
            {bookmark_failure &&
              `Bookmarking ${bookmark_failure.pid} failed: ${bookmark_failure.message}`}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default App
