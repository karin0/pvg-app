import React, { useEffect, useMemo, useState } from 'react'
import './index.css'

import 'typeface-roboto'

import {
  AppBar,
  Chip,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  TextField,
  Toolbar,
  useScrollTrigger,
} from '@mui/material'

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import withStyles from '@mui/styles/withStyles'
// import { darkWhite, lightWhite } from '@mui/material/colors';
import Autocomplete from '@mui/material/Autocomplete'

import MenuIcon from '@mui/icons-material/Menu'

import ListboxComponent from './Listbox.js'
import { FilterTagsContext, PvgGallery, TagUpdaterContext } from './gallery.js'
import { host } from './env.js'
import theme from './theme.js'

import img_bg from './bg.png'
import AppDrawer from './AppDrawer'

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

const styles = (theme) => ({
  list: {
    width: 270,
    backgroundColor: theme.palette.background.paper,
  },

  menu_button: {
    marginRight: theme.spacing(2),
  },
  main: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: theme.spacing(4),
  },
  box: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(3),
    },
  },
  chip: {
    background: '#e3f2fd',
    color: '#1976d2',
  },
  chip_banned: {
    background: '#e57373',
  },
  clear_indicator: {
    color: 'white',
  },
  input: {
    color: 'white',
  },
  input_root: {
    borderColor: 'white',
  },
  avatar: {
    width: theme.spacing(9),
    height: theme.spacing(9),
    boxShadow:
      'rgba(0, 0, 0, 0.2) 0px 3px 3px -2px, rgba(0, 0, 0, 0.14) 0px 3px 4px 0px, rgba(0, 0, 0, 0.12) 0px 1px 8px 0px',
  },
  card: {
    // background: 'linear-gradient(90deg, rgba(53,95,146,1) 11%, rgba(41,148,234,1) 83%)',
    backgroundImage: `url(${img_bg})`,
    backgroundSize: 'cover',
    borderRadius: '0px',
  },
  card_text: {
    color: 'white',
    fontSize: '110%',
  },
})

const reg_bad = new RegExp(
  decodeURIComponent(
    atob(
      'Ui0xJTdDJUU4JUFBJTk4JUUzJTgxJUEzJUUzJTgxJUE2JTdDJUUzJTgzJTkxJUUzJTgzJUIzJUUzJTgzJTg0JTdDJUU4JUJDJUFBJUUzJTgzJTgxJUUzJTgzJUE5JTdDJUU1JUI3JUE4JUU0JUI5JUIzJTdDJUUzJTgxJUEzJUUzJTgxJUIxJUUzJTgxJTg0JTdDJUU0JUJBJThCJUU1JUJFJThDJTdDJUU0JUJBJThCJUU1JTg5JThEJTdDJUU5JUFEJTg1JUU2JTgzJTkxJTdDJUU4JUIwJUI3JUU5JTk2JTkzJTdDJUU2JUE1JUI1JUU0JUI4JThBJUUzJTgxJUFFJUU0JUI5JUIzJTdDJUU5JTlDJUIyJUU1JTg3JUJBJTdDJUU1JUIwJUJCJUU3JUE1JTlFJTdDJUUzJTgyJUFBJUUzJTgzJThBJUUzJTgzJThCJTdDJUU1JThEJThBJUU4JUEzJUI4JTdDJUUzJTgyJUI3JUUzJTgzJUJDJUUzJTgzJTg0JTdDJUU1JUE0JUFBJUUzJTgyJTgyJUUzJTgyJTgyJTdDJUU4JUEzJUI4JUU4JUI2JUIzJTdDJUU0JUI4JThCJUU3JTlEJTgwJTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUUzJTgxJTgyJUUzJTgxJTkyJTdDJUUzJTgxJTk5JUUzJTgxJTk4JTdDJUUzJTgxJUI3JUUzJTgxJUFCJUUzJTgxJUJFJUUzJTgyJTkzJTdDJUUzJTgxJUIxJUUzJTgyJTkzJUUzJTgxJUE0JTdDJUUzJTgxJThBJUUzJTgxJUI4JUUzJTgxJTlEJTdDJUU0JUI4JUFEJUU1JTg3JUJBJUUzJTgxJTk3JTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUU0JUI4JThBJUUzJTgxJTkyJTdDJUU2JThBJUIxJUUzJTgxJThEJUU2JTlFJTk1JTdDJUU3JUI3JThBJUU3JUI4JTlCJTdDJUU2JThCJTk4JUU2JTlEJTlG'
    )
  )
)

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
    compare_fallback(b[1], a[1], () => compare(a[0], b[0]))
  )
}

function App(props) {
  const [error, set_error] = useState(null)
  const [loaded, set_loaded] = useState(false)
  const [resp, set_resp] = useState([])
  const [tags_curr, set_tags_curr] = useState([])
  const [tags_curr_map, set_tags_curr_map] = useState(null)
  const [tags_banned, set_tags_banned] = useState([])
  const [locating_id, set_locating_id] = useState(-1)
  const [drawer_open, set_drawer_open] = useState(false)
  const [safe, set_safe] = useState(!!+localStorage.getItem('safe') || false)

  const images = useMemo(() => {
    const imgs = resp
    if (safe)
      return imgs.filter((img) => {
        if (img.san !== 2) return false
        for (const tag of img.tags) if (reg_bad.test(tag)) return false
        return true
      })
    return imgs.slice(0)
  }, [resp, safe])

  const tags = useMemo(() => {
    return get_tag_list(images)
  }, [images])

  function update() {
    // console.log('update with', this.state.tags_curr, this.state.locating_id);
    const tags = tags_curr // reliable, for update is used as callback from setState
    const tag_map = new Map()
    for (let i = 0; i < tags.length; ++i) tag_map.set(tags[i], i)

    const filters = []
    const ban_filters = []
    for (const tag of tags_curr) {
      if (tags_banned.includes(tag)) ban_filters.push(tag)
      else filters.push(tag)
    }
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
          const resp = res.items.map((illust) => {
            const [pid, title, aid, author, tags, raw_pages, date, san] = illust
            const pages = raw_pages.map((page, ind) => {
              const [w, h, pre, fn] = page
              const nav = `/${pid}/${ind}`
              // FIXME: w & h here may be referred by Upscale window. Can we calculate them later?
              return {
                pid,
                ind,
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
            }
          })
          set_loaded(true)
          set_error(null)
          set_resp(resp)
          set_tags_curr_map(tag_map)
        },
        (error) => {
          set_loaded(true)
          set_error(error)
          set_resp([])
          set_tags_curr_map(tag_map)
        }
      )
  }

  const set_tags = (tags) => {
    const s = new Set()
    const tags_curr = tags.filter((tag) => {
      if (s.has(tag)) return false
      s.add(tag)
      return true
    })
    set_tags_curr(tags_curr)
    set_locating_id(-1)
  }

  const toggle_tag = (tag, id, pos) => {
    if (isNaN(pos)) set_tags_curr(tags_curr.concat([tag]))
    else {
      const tags = tags_curr.slice(0)
      tags.splice(pos, 1)
      set_tags_curr(tags)
      const p = tags_banned.indexOf(tag)
      if (p >= 0) {
        set_tags_banned(tags_banned.filter((t) => t !== tag))
      }
    }
    set_locating_id(id)
  }

  const open_drawer = () => set_drawer_open(true)
  const close_drawer = () => set_drawer_open(false)

  const refresh = () => {
    set_locating_id(-1)
    close_drawer()
  }

  const toggle_safe = () => {
    localStorage.setItem('safe', safe ? '0' : '1')
    set_locating_id(-1)
    set_safe(!safe)
  }

  useEffect(update, [tags_curr, tags_banned, locating_id])

  const { classes } = props

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HideOnScroll>
          <AppBar position="fixed">
            <Toolbar variant="dense">
              <IconButton
                edge="start"
                className={classes.menu_button}
                color="inherit"
                onClick={open_drawer}
                size="large"
              >
                <MenuIcon />
              </IconButton>
              <div className={classes.box}>
                <Autocomplete
                  multiple
                  freeSolo
                  autoSelect
                  size="small"
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  options={tags}
                  ListboxComponent={ListboxComponent}
                  getOptionLabel={(o) => o[0]}
                  renderOption={(props, tag) => {
                    return (
                      <li {...props} style={{ height: 10 }}>
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
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const banned = tags_banned.includes(option)
                      return (
                        <Chip
                          sx={{ userSelect: 'text', zIndex: 7 }}
                          classes={{
                            root: banned ? classes.chip_banned : classes.chip,
                          }}
                          variant={banned ? 'filled' : 'outlined'}
                          color={banned ? 'error' : 'primary'}
                          label={option}
                          onClick={() => {
                            const p = tags_banned.indexOf(option)
                            const a = tags_banned.slice(0)
                            if (p >= 0) {
                              a.splice(p, 1)
                            } else {
                              a.push(option)
                            }
                            set_tags_banned(a)
                          }}
                          {...getTagProps({ index })}
                        />
                      )
                    })
                  }
                  renderInput={(params) => (
                    <TextField fullWidth color="primary" {...params} />
                  )}
                  onChange={(e, value) => {
                    set_tags(
                      value.map((t) => (typeof t === 'string' ? t : t[0]))
                    )
                  }}
                  value={tags_curr}
                  classes={{
                    clearIndicator: classes.clear_indicator,
                    inputRoot: classes.input_root,
                    input: classes.input,
                  }}
                />
              </div>
            </Toolbar>
          </AppBar>
        </HideOnScroll>
        <AppDrawer
          classes={classes}
          open={drawer_open}
          setOpen={set_drawer_open}
          onRefresh={refresh}
          safe={safe}
          toggleSafe={toggle_safe}
        />
        <Container className={classes.main} maxWidth="lg">
          {loaded ? (
            error ? (
              'Error'
            ) : (
              <TagUpdaterContext.Provider value={toggle_tag}>
                <FilterTagsContext.Provider value={tags_curr_map}>
                  <PvgGallery images={images} locating_id={locating_id} />
                </FilterTagsContext.Provider>
              </TagUpdaterContext.Provider>
            )
          ) : (
            'Loading..'
          )}
        </Container>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export default withStyles(styles)(App)
