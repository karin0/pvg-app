import TuneIcon from '@mui/icons-material/Tune'
import {
  Box,
  ClickAwayListener,
  Collapse,
  Fab,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'

import { host, hosts, origin_host } from './env'

function EndpointSelect(props) {
  if (!hosts.length) return null

  const options = []
  for (const h of [origin_host, ...hosts, host]) {
    if (!options.includes(h)) options.push(h)
  }

  const switch_host = (e) => {
    localStorage.setItem('dev_host', e.target.value)
    window.location.reload()
  }

  return (
    <Select
      value={host}
      onChange={switch_host}
      onOpen={() => props.onMenuToggle(true)}
      onClose={() => props.onMenuToggle(false)}
      MenuProps={{ disableScrollLock: true }}
      size="small"
      fullWidth
      sx={{ mt: 1 }}
    >
      {options.map((h) => (
        <MenuItem key={h} value={h}>
          {h}
        </MenuItem>
      ))}
    </Select>
  )
}

// menu_open keeps the panel up while the portaled Select menu is open.
function FloatingControls(props) {
  const { switches, caption } = props
  const [open, set_open] = useState(false)
  const [menu_open, set_menu_open] = useState(false)
  const root_ref = useRef(null)

  const close = () => {
    if (!menu_open) set_open(false)
  }

  const on_menu_toggle = (next) => {
    set_menu_open(next)
    if (!next && root_ref.current && !root_ref.current.matches(':hover')) {
      set_open(false)
    }
  }

  return (
    <ClickAwayListener onClickAway={close}>
      <Box
        ref={root_ref}
        onMouseEnter={() => set_open(true)}
        onMouseLeave={close}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: (theme) => theme.zIndex.speedDial,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <Collapse in={open} unmountOnExit>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              width: 230,
              maxWidth: '80vw',
              bgcolor: (t) => t.alpha(t.palette.background.paper, 0.72),
              backdropFilter: 'blur(10px)',
            }}
          >
            {caption && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {caption}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {switches.map((s) => (
                <FormControlLabel
                  key={s.label}
                  labelPlacement="start"
                  sx={{
                    ml: 0,
                    mr: 0,
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={s.checked}
                      onChange={(e) => s.setChecked(e.target.checked)}
                    />
                  }
                  label={s.label}
                />
              ))}
            </Box>
            <EndpointSelect onMenuToggle={on_menu_toggle} />
          </Paper>
        </Collapse>
        <Fab
          color="primary"
          size="medium"
          aria-label="controls"
          onClick={() => set_open((o) => !o)}
          sx={{
            bgcolor: (t) => t.alpha(t.palette.primary.main, 0.72),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: (t) => t.alpha(t.palette.primary.main, 0.85),
            },
          }}
        >
          <TuneIcon />
        </Fab>
      </Box>
    </ClickAwayListener>
  )
}

export default FloatingControls
