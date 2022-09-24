import React, { Component } from 'react'
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

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      loaded: false,
      resp: [],
      tags_curr: [],
      tags_curr_map: null,
      locating_id: -1,
      drawer_open: false,
      safe: !!+localStorage.getItem('safe') || false,
      resort: false,
    }
  }

  get_unsorted_images = () => {
    const imgs = this.state.resp
    if (this.state.safe)
      return imgs.filter((img) => {
        if (img.san !== 2) return false
        for (const tag of img.tags) if (reg_bad.test(tag)) return false
        return true
      })
    return imgs.slice(0)
  }

  get_images = () => {
    const imgs = this.get_unsorted_images()
    if (this.state.resort)
      imgs.sort((a, b) =>
        compare_fallback(b.pid, a.pid, () => compare(a.ind, b.ind))
      )
    return imgs
  }

  get_tags = () => {
    return get_tag_list(this.get_unsorted_images())
  }

  update = () => {
    // console.log('update with', this.state.tags_curr, this.state.locating_id);
    const tags = this.state.tags_curr // reliable, for update is used as callback from setState
    const tag_map = new Map()
    for (let i = 0; i < tags.length; ++i) tag_map.set(tags[i], i)
    fetch(host + 'select', {
      crossDomain: true,
      method: 'POST',
      body: JSON.stringify({
        filters: this.state.tags_curr,
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then((res) => res.json())
      .then(
        (res) => {
          const resp = res.items.flatMap((illust) => {
            const [pid, title, aid, author, tags, pages, date, san] = illust
            return pages.map((page, ind) => {
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
          })
          this.setState(
            {
              loaded: true,
              error: null,
              resp,
              tags_curr_map: tag_map,
            },
            this.set_images
          )
        },
        (error) => {
          this.setState({
            loaded: true,
            error: error,
            resp: [],
            tags_curr_map: tag_map,
          })
        }
      )
  }

  set_tags = (tags) => {
    // console.log('sets', tags);
    const s = new Set()
    const tags_curr = tags.filter((tag) => {
      if (s.has(tag)) return false
      s.add(tag)
      return true
    })
    this.setState(
      {
        tags_curr,
        locating_id: -1,
      },
      this.update
    )
  }

  toggle_tag = (tag, id, pos) => {
    // console.log('add', tag);
    this.setState((state) => {
      if (isNaN(pos))
        return {
          tags_curr: state.tags_curr.concat([tag]),
          locating_id: id,
        }
      else {
        const tags = state.tags_curr.slice(0)
        tags.splice(pos, 1)
        return {
          tags_curr: tags,
          locating_id: id,
        }
      }
    }, this.update)
  }

  open_drawer = () => this.setState({ drawer_open: true })
  close_drawer = () => this.setState({ drawer_open: false })

  refresh = () => {
    this.setState(
      {
        locating_id: -1,
      },
      this.update
    )
    this.close_drawer()
  }

  toggle_safe = () =>
    this.setState((state) => {
      localStorage.setItem('safe', state.safe ? '0' : '1')
      return {
        locating_id: -1,
        safe: !state.safe,
      }
    })

  toggle_resort = () =>
    this.setState((state) => ({
      locating_id: -1,
      resort: !state.resort,
    }))

  componentDidMount() {
    this.update()
  }

  render() {
    const { classes } = this.props

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
                  onClick={this.open_drawer}
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
                    options={this.get_tags()}
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
                      value.map((option, index) => (
                        <Chip
                          classes={{ root: classes.chip }}
                          variant="outlined"
                          color="primary"
                          label={option}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField fullWidth color="primary" {...params} />
                    )}
                    onChange={(e, value) => {
                      this.set_tags(
                        value.map((t) => (typeof t === 'string' ? t : t[0]))
                      )
                    }}
                    value={this.state.tags_curr}
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
            open={this.state.drawer_open}
            setOpen={(v) => this.setState({ drawer_open: v })}
            onRefresh={this.refresh}
            safe={this.state.safe}
            toggleSate={this.toggle_safe}
            resort={this.state.resort}
            toggleResort={this.toggle_resort}
          />
          <Container className={classes.main} maxWidth="lg">
            {this.state.loaded ? (
              this.state.error ? (
                'Error'
              ) : (
                <TagUpdaterContext.Provider value={this.toggle_tag}>
                  <FilterTagsContext.Provider value={this.state.tags_curr_map}>
                    <PvgGallery
                      images={this.get_images()}
                      locating_id={this.state.locating_id}
                    />
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
}

export default withStyles(styles)(App)
