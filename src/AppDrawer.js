import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
} from '@mui/material'
import { host } from './env'
import RefreshIcon from '@mui/icons-material/Refresh'
import SecurityIcon from '@mui/icons-material/Security'
import SettingsIcon from '@mui/icons-material/Settings'
import React, { useEffect, useState } from 'react'
import SyncIcon from '@mui/icons-material/Sync'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'
import UpscalingDialog from './UpscalingDialog'
import UpdateIcon from '@mui/icons-material/Update'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import EcoIcon from '@mui/icons-material/HealthAndSafety'
import DoneIcon from '@mui/icons-material/Done'

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

function AppDrawer(props) {
  const { classes, open, setOpen, onRefresh, safe, toggleSafe } = props

  const [settings_open, set_settings_open] = useState(false)
  const [user, set_user] = useState(null)
  const [ver, set_ver] = useState('Unknown')

  const close_drawer = () => setOpen(false)

  let card_title, card_title_2, card_subtitle
  if (user) {
    if (user.nick) {
      card_title = user.nick
      card_subtitle = user.mail
      card_title_2 = user.nick === user.name ? null : '(' + user.name + ')'
    } else {
      card_title = user.name
      card_title_2 = null
      card_subtitle = ''
    }
  } else {
    card_title = 'Unknown'
    card_title_2 = null
    card_subtitle = ''
  }

  useEffect(() => {
    fetch(host + 'user', {
      crossDomain: true,
      method: 'GET',
    })
      .then((res) => res.json())
      .then((res) => {
        set_user(res)
      })

    fetch(host + 'ver', {
      crossDomain: true,
      method: 'GET',
    })
      .then((res) => res.json())
      .then((res) => set_ver(res.ver))
  }, [])

  return (
    <Drawer
      open={open}
      onClose={close_drawer}
      classes={{ paper: classes.drawer }}
    >
      <Card classes={{ root: classes.card }}>
        <Box mt={3} ml={2} mb={-0.5}>
          <Avatar src={host + 'avatar'} className={classes.avatar} />
        </Box>
        <CardHeader
          title={
            card_title_2 ? (
              <>
                <Box fontWeight="fontWeightBold" display="inline">
                  {card_title}
                </Box>
                <Box ml={1} display="inline">
                  {card_title_2}
                </Box>
              </>
            ) : (
              <Box fontWeight="fontWeightBold">{card_title}</Box>
            )
          }
          subheader={card_subtitle}
          classes={{
            title: classes.card_text,
            subheader: classes.card_text,
          }}
        />
      </Card>
      <div className={classes.list} role="presentation">
        <List className={classes.list}>
          <UpscalingItem />
          <ListItem button key="refresh" onClick={onRefresh}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText primary="Refresh" />
          </ListItem>
        </List>
        <Divider />
        <List className={classes.list}>
          {action_listitems.map(action_mapper(close_drawer))}
        </List>
        <Divider />
        <List className={classes.list}>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>{' '}
            <ListItemText primary="Safe Mode" />
            <ListItemSecondaryAction>
              <Switch edge="end" onChange={toggleSafe} checked={safe} />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <ListItem button key="options" onClick={() => set_settings_open(true)}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Options" />
        </ListItem>
        <Dialog
          open={settings_open}
          onClose={() => set_settings_open(false)}
          maxWidth="sm"
          fullWidth={true}
        >
          <DialogTitle>Options</DialogTitle>
          <DialogContent>
            <List style={{ width: '100%' }}>
              <FullUpdateItem on_confirm={close_drawer} />
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
                  {ver}
                </>
              }
            />
          </ListItem>
        </List>
      </div>
    </Drawer>
  )
}

export default AppDrawer
