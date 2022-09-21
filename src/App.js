import React, { Component, useState } from 'react'

import 'typeface-roboto'

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Slide,
  Switch,
  TextField,
  Toolbar,
  useScrollTrigger,
} from '@mui/material'

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import withStyles from '@mui/styles/withStyles'
// import { darkWhite, lightWhite } from '@mui/material/colors';
import Autocomplete from '@mui/material/Autocomplete'

import MenuIcon from '@mui/icons-material/Menu'
import UpdateIcon from '@mui/icons-material/Update'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import EcoIcon from '@mui/icons-material/HealthAndSafety'
import DoneIcon from '@mui/icons-material/Done'
import SyncIcon from '@mui/icons-material/Sync'
import RefreshIcon from '@mui/icons-material/Refresh'
import SecurityIcon from '@mui/icons-material/Security'
import DateRangeIcon from '@mui/icons-material/DateRange'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'

import ListboxComponent from './Listbox.js'
import { FilterTagsContext, PvgGallery, TagUpdaterContext } from './gallery.js'
import UpscalingDialog from './UpscalingDialog.js'
import { host } from './env.js'
import theme from './theme.js'

import img_bg from './bg.png'

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

function FullUpdateItem(props) {
  const [dialog_open, set_open] = useState(false)

  const open_dialog = () => set_open(true)
  const close_dialog = () => set_open(false)

  const confirm = () => {
    window.open(host + 'action/update')
    set_open(false)
    props.on_confirm()
  }

  return (
    <>
      <ListItem button key="update" onClick={open_dialog}>
        <ListItemIcon>
          <SyncIcon />
        </ListItemIcon>
        <ListItemText primary="Full Update" />
      </ListItem>
      <Dialog open={dialog_open} onClose={close_dialog}>
        <DialogTitle>Warning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The operation may take a long time if excessive number of illusts
            are bookmarked. An incremental update is suggested in most cases.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={confirm}
            variant="contained"
            color="secondary"
            disableElevation
          >
            Continue
          </Button>
          <Button onClick={close_dialog} color="primary" autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function UpscalingItem() {
  const [dialog_open, set_open] = useState(false)

  const open_dialog = () => set_open(true)
  const close_dialog = () => set_open(false)

  return (
    <>
      <ListItem button key="upscaling" onClick={open_dialog}>
        <ListItemIcon>
          <SettingsOverscanIcon />
        </ListItemIcon>
        <ListItemText primary="Upscaling" />
      </ListItem>
      <UpscalingDialog open={dialog_open} on_close={close_dialog} />
    </>
  )
}

const action_mapper = (cb) => (x) =>
  (
    <ListItem
      button
      key={x[2]}
      component="a"
      href={host + 'action/' + x[2]}
      target="_blank"
      onClick={cb}
    >
      <ListItemIcon>{x[1]}</ListItemIcon>
      <ListItemText primary={x[0]} />
    </ListItem>
  )
const action_listitems = [
  ['Incremental Update', <UpdateIcon />, 'qupd'],
  ['Download All', <CloudDownloadIcon />, 'download'],
  ['Greendam', <EcoIcon />, 'greendam'],
  ['QUDG', <DoneIcon />, 'qudg'],
]

const reg_bad = new RegExp(
  decodeURIComponent(
    atob(
      'Ui0xJTdDJUU4JUFBJTk4JUUzJTgxJUEzJUUzJTgxJUE2JTdDJUUzJTgzJTkxJUUzJTgzJUIzJUUzJTgzJTg0JTdDJUU4JUJDJUFBJUUzJTgzJTgxJUUzJTgzJUE5JTdDJUU1JUI3JUE4JUU0JUI5JUIzJTdDJUUzJTgxJUEzJUUzJTgxJUIxJUUzJTgxJTg0JTdDJUU0JUJBJThCJUU1JUJFJThDJTdDJUU0JUJBJThCJUU1JTg5JThEJTdDJUU5JUFEJTg1JUU2JTgzJTkxJTdDJUU4JUIwJUI3JUU5JTk2JTkzJTdDJUU2JUE1JUI1JUU0JUI4JThBJUUzJTgxJUFFJUU0JUI5JUIzJTdDJUU5JTlDJUIyJUU1JTg3JUJBJTdDJUU1JUIwJUJCJUU3JUE1JTlFJTdDJUUzJTgyJUFBJUUzJTgzJThBJUUzJTgzJThCJTdDJUU1JThEJThBJUU4JUEzJUI4JTdDJUUzJTgyJUI3JUUzJTgzJUJDJUUzJTgzJTg0JTdDJUU1JUE0JUFBJUUzJTgyJTgyJUUzJTgyJTgyJTdDJUU4JUEzJUI4JUU4JUI2JUIzJTdDJUU0JUI4JThCJUU3JTlEJTgwJTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUUzJTgxJTgyJUUzJTgxJTkyJTdDJUUzJTgxJTk5JUUzJTgxJTk4JTdDJUUzJTgxJUI3JUUzJTgxJUFCJUUzJTgxJUJFJUUzJTgyJTkzJTdDJUUzJTgxJUIxJUUzJTgyJTkzJUUzJTgxJUE0JTdDJUUzJTgxJThBJUUzJTgxJUI4JUUzJTgxJTlEJTdDJUU0JUI4JUFEJUU1JTg3JUJBJUUzJTgxJTk3JTdDJUUzJTgxJTlGJUUzJTgxJThGJUUzJTgxJTk3JUU0JUI4JThBJUUzJTgxJTkyJTdDJUU2JThBJUIxJUUzJTgxJThEJUU2JTlFJTk1JTdDJUU3JUI3JThBJUU3JUI4JTlCJTdDJUU2JThCJTk4JUU2JTlEJTlG'
    )
  )
)

function get_tag_list(imgs) {
  const s = new Map()
  for (const img of imgs) {
    for (const tag of img.tags) {
      const c = s.get(tag)
      s.set(tag, c ? c + 1 : 1)
    }
    const tag = img.author
    const c = s.get(tag)
    s.set(tag, c ? c + 1 : 1)
  }
  return Array.from(s[Symbol.iterator]())
    .sort((a, b) => compare_fallback(b[1], a[1], () => compare(a[0], b[0])))
    .map((a) => a[0])
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      loaded: false,
      resp: [],
      resp_safe: [],
      resp_tag_list: [],
      resp_tag_list_safe: [],
      images: [],
      tags_list: [],
      tags_curr: [],
      tags_curr_map: null,
      locating_id: -1,
      drawer_open: false,
      card_title: 'Unknown',
      card_title_2: null,
      card_subtitle: '',
      ver: 'Unknown',
      safe: !!+localStorage.getItem('safe') || false,
      resort: false,
      settings_open: false,
    }
  }

  set_images = () =>
    this.setState((state) => {
      let imgs = state.safe ? state.resp_safe : state.resp
      if (this.state.resort)
        imgs = imgs
          .slice(0)
          .sort((a, b) =>
            compare_fallback(b.pid, a.pid, () => compare(a.ind, b.ind))
          )
      return {
        images: imgs,
        tags_list: state.safe ? state.resp_tag_list_safe : state.resp_tag_list,
      }
    })

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
            const [pid, title, aid, author, tags, pages] = illust
            return pages
              .map((page, ind) => {
                const [w, h, pre, fn] = page
                const nav = `/${pid}/${ind}`
                return {
                  pid,
                  ind,
                  title,
                  author,
                  aid,
                  tags,
                  w,
                  h,
                  fn,
                  iid: pid * 200 + ind,
                  ori: 'img' + nav,
                  thu: pre + nav,
                }
              })
              .filter((o) => o.w && o.h)
          })
          const resp_safe = resp.filter((img) => {
            for (const tag of img.tags) if (reg_bad.test(tag)) return false
            return true
          })
          this.setState(
            {
              loaded: true,
              error: null,
              resp,
              resp_safe,
              tags_curr_map: tag_map,
              resp_tag_list: get_tag_list(resp),
              resp_tag_list_safe: get_tag_list(resp_safe),
            },
            this.set_images
          )
        },
        (error) => {
          this.setState({
            loaded: true,
            error: error,
            resp: [],
            resp_safe: [],
            resp_tag_list: [],
            resp_tag_list_safe: [],
            images: [],
            tags_list: [],
            tags_curr_map: tag_map,
          })
        }
      )
  }

  set_tags = (tags) => {
    // console.log('sets', tags);
    this.setState(
      {
        tags_curr: tags,
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
    }, this.set_images)

  toggle_resort = () =>
    this.setState(
      (state) => ({
        locating_id: -1,
        resort: !state.resort,
      }),
      this.set_images
    )

  open_settings = () => this.setState({ settings_open: true })
  close_settings = () => this.setState({ settings_open: false })

  componentDidMount() {
    Promise.all([
      new Promise((resolve) =>
        fetch(host + 'user', {
          crossDomain: true,
          method: 'GET',
        })
          .then((res) => res.json())
          .then(
            (res) => {
              if (res.nick) {
                const sta = {
                  card_title: res.nick,
                  card_subtitle: res.mail,
                  card_title_2:
                    res.nick === res.name ? null : '(' + res.name + ')',
                }
                this.setState(sta, resolve)
              } else
                this.setState(
                  {
                    card_title: res.name,
                    card_title_2: null,
                    card_subtitle: '',
                  },
                  resolve
                )
            },
            (error) => {
              this.setState(
                {
                  card_title: 'Unknown',
                  card_title_2: null,
                  card_subtitle: '',
                },
                resolve
              )
            }
          )
      ),
      new Promise((resolve) =>
        fetch(host + 'ver', {
          crossDomain: true,
          method: 'GET',
        })
          .then((res) => res.json())
          .then(
            (res) => this.setState({ ver: res.ver }, resolve),
            (error) => this.setState({ ver: 'Unknown' }, resolve)
          )
      ),
    ]).then(this.update)
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
                    options={this.state.tags_list}
                    ListboxComponent={ListboxComponent}
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
                    onChange={(e, value) => this.set_tags(value)}
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
          <Drawer
            open={this.state.drawer_open}
            onClose={this.close_drawer}
            classes={{ paper: classes.drawer }}
          >
            <Card classes={{ root: classes.card }}>
              <Box mt={3} ml={2} mb={-0.5}>
                <Avatar src={host + 'avatar'} className={classes.avatar} />
              </Box>
              <CardHeader
                title={
                  this.state.card_title_2 ? (
                    <>
                      <Box fontWeight="fontWeightBold" display="inline">
                        {this.state.card_title}
                      </Box>
                      <Box ml={1} display="inline">
                        {this.state.card_title_2}
                      </Box>
                    </>
                  ) : (
                    <Box fontWeight="fontWeightBold">
                      {this.state.card_title}
                    </Box>
                  )
                }
                subheader={this.state.card_subtitle}
                classes={{
                  title: classes.card_text,
                  subheader: classes.card_text,
                }}
              />
            </Card>
            <div className={classes.list} role="presentation">
              <List className={classes.list}>
                <UpscalingItem />
                <ListItem button key="refresh" onClick={this.refresh}>
                  <ListItemIcon>
                    <RefreshIcon />
                  </ListItemIcon>
                  <ListItemText primary="Refresh" />
                </ListItem>
              </List>
              <Divider />
              <List className={classes.list}>
                {action_listitems.map(action_mapper(this.close_drawer))}
              </List>
              <Divider />
              <List className={classes.list}>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>{' '}
                  <ListItemText primary="Safe Mode" />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      onChange={this.toggle_safe}
                      checked={this.state.safe}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              <ListItem button key="options" onClick={this.open_settings}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Options" />
              </ListItem>
              <Dialog
                open={this.state.settings_open}
                onClose={this.close_settings}
                maxWidth="sm"
                fullWidth={true}
              >
                <DialogTitle>Options</DialogTitle>
                <DialogContent>
                  <List style={{ width: '100%' }}>
                    <ListItem>
                      <ListItemIcon>
                        <DateRangeIcon />
                      </ListItemIcon>
                      <ListItemText primary="Sort by Dates" />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          onChange={this.toggle_resort}
                          checked={this.state.resort}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <FullUpdateItem on_confirm={this.close_drawer} />
                  </List>
                </DialogContent>
              </Dialog>
              <Divider />
              <List>
                <ListItem key="info">
                  <ListItemText
                    primary={
                      <>
                        <Link
                          href="https://github.com/karin0/pvg"
                          target="_blank"
                          rel="noreferrer"
                        >
                          pvg-ng
                        </Link>
                        <br />
                        {this.state.ver}
                      </>
                    }
                  />
                </ListItem>
              </List>
            </div>
          </Drawer>
          <Container className={classes.main} maxWidth="lg">
            {this.state.loaded ? (
              this.state.error ? (
                'Error'
              ) : (
                <TagUpdaterContext.Provider value={this.toggle_tag}>
                  <FilterTagsContext.Provider value={this.state.tags_curr_map}>
                    <PvgGallery
                      images={this.state.images}
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
