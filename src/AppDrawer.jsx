import ArchiveIcon from '@mui/icons-material/Archive'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import DnsIcon from '@mui/icons-material/Dns'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import RefreshIcon from '@mui/icons-material/Refresh'
import SecurityIcon from '@mui/icons-material/Security'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'
import SyncIcon from '@mui/icons-material/Sync'
import UpdateIcon from '@mui/icons-material/Update'
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
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Switch,
} from '@mui/material'
import React, { useContext, useState } from 'react'

import img_bg from './bg.png'
import { host, hosts } from './env'
import UpscalingDialog from './UpscalingDialog'

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
      <ListItemButton key="update" onClick={open_dialog}>
        <ListItemIcon>
          <SyncIcon />
        </ListItemIcon>
        <ListItemText primary="Full Update" />
      </ListItemButton>
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
      <ListItemButton key="upscaling" onClick={open_dialog}>
        <ListItemIcon>
          <SettingsOverscanIcon />
        </ListItemIcon>
        <ListItemText primary="Upscaling" />
      </ListItemButton>
      <UpscalingDialog open={dialog_open} on_close={close_dialog} />
    </>
  )
}

function EndpointItem() {
  if (!hosts.length) return null

  // Show the live host even when it isn't configured, so the Select never
  // holds an out-of-range value and the operator can always see where it hits.
  const options = hosts.includes(host) ? hosts : [host, ...hosts]

  const switch_host = (e) => {
    localStorage.setItem('dev_host', e.target.value)
    window.location.reload()
  }

  return (
    <ListItem key="endpoint">
      <ListItemIcon>
        <DnsIcon />
      </ListItemIcon>
      <ListItemText primary="Endpoint" />
      <Select
        value={host}
        onChange={switch_host}
        size="small"
        sx={{ minWidth: 160, maxWidth: 320 }}
      >
        {options.map((h) => (
          <MenuItem key={h} value={h}>
            {h}
          </MenuItem>
        ))}
      </Select>
    </ListItem>
  )
}

const action_mapper =
  (cb) =>
  ([label, Icon, act]) => (
    <ListItemButton
      key={act}
      component="a"
      href={host + 'action/' + act}
      target="_blank"
      onClick={cb}
    >
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  )
const action_listitems = [
  ['Incremental Update', UpdateIcon, 'qupd'],
  ['Download All', CloudDownloadIcon, 'download'],
  ['Archive Orphan Files', ArchiveIcon, 'orphan'],
  ['Do all 3 above', DoneAllIcon, 'qudo'],
]

const EnvContext = React.createContext()

function AppDrawer(props) {
  const { open, setOpen, onRefresh, safe, toggleSafe } = props

  const [settings_open, set_settings_open] = useState(false)

  const env = useContext(EnvContext)
  const user = env?.user
  const ver = env?.ver

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

  return (
    <Drawer
      open={open}
      onClose={close_drawer}
      sx={{ '& .MuiDrawer-paper': { width: 270, bgcolor: 'background.paper' } }}
    >
      <Card
        sx={{
          backgroundImage: `url(${img_bg})`,
          backgroundSize: 'cover',
          borderRadius: '0px',
        }}
      >
        <Box sx={{ mt: 3, ml: 2, mb: -0.5 }}>
          <Avatar
            src={host + 'avatar'}
            sx={{
              width: 72,
              height: 72,
              boxShadow:
                'rgba(0, 0, 0, 0.2) 0px 3px 3px -2px, rgba(0, 0, 0, 0.14) 0px 3px 4px 0px, rgba(0, 0, 0, 0.12) 0px 1px 8px 0px',
            }}
          />
        </Box>
        <CardHeader
          title={
            card_title_2 ? (
              <>
                <Box sx={{ fontWeight: 'fontWeightBold', display: 'inline' }}>
                  {card_title}
                </Box>
                <Box sx={{ ml: 1, display: 'inline' }}>{card_title_2}</Box>
              </>
            ) : (
              <Box sx={{ fontWeight: 'fontWeightBold' }}>{card_title}</Box>
            )
          }
          subheader={card_subtitle}
          slotProps={{
            title: { sx: { color: 'white', fontSize: '110%' } },
            subheader: { sx: { color: 'white', fontSize: '110%' } },
          }}
        />
      </Card>
      <Box sx={{ width: 270, bgcolor: 'background.paper' }} role="presentation">
        <List sx={{ width: 270, bgcolor: 'background.paper' }}>
          <UpscalingItem />
          <ListItemButton key="refresh" onClick={onRefresh}>
            <ListItemIcon>
              <RefreshIcon />
            </ListItemIcon>
            <ListItemText primary="Refresh" />
          </ListItemButton>
        </List>
        <Divider />
        <List sx={{ width: 270, bgcolor: 'background.paper' }}>
          {action_listitems.map(action_mapper(close_drawer))}
        </List>
        <Divider />
        <List sx={{ width: 270, bgcolor: 'background.paper' }}>
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
        <ListItemButton key="options" onClick={() => set_settings_open(true)}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Options" />
        </ListItemButton>
        <Dialog
          open={settings_open}
          onClose={() => set_settings_open(false)}
          maxWidth="sm"
          fullWidth={true}
        >
          <DialogTitle>Options</DialogTitle>
          <DialogContent>
            <List style={{ width: '100%' }}>
              <EndpointItem />
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
                    href="https://github.com/karin0/pvg-rs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    pvg-rs
                  </Link>
                  {' ' + ver}
                  <br />
                  <Link
                    href="https://github.com/karin0/pvg-app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    pvg-app
                  </Link>
                  {' ' + __GIT_DESCRIBE__}
                </>
              }
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )
}

export default AppDrawer
export { EnvContext }
