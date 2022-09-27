import React, { useState } from 'react'
import makeStyles from '@mui/styles/makeStyles'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { host, upscale_target } from './env.js'

const useStyles = makeStyles((theme) => ({
  btn: {
    bottom: '6px',
    position: 'relative',
    marginBottom: '-8px',
  },
}))

const noise_levels = [
  ['0', 'None'],
  ['1', 'Low'],
  ['2', 'Medium'],
  ['3', 'High'],
  ['4', 'Highest'],
]

export default function UpscalingDialog(props) {
  const classes = useStyles()

  const {img} = props
  const default_noise_level =
    img &&
    (img.fn.substring(img.fn.length - 4) === '.jpg' ||
      img.fn.substring(img.fn.length - 5) === '.jpeg')
      ? '1'
      : '0'

  const dims = props.dims || [0, 0]

  const [file, set_file] = useState()
  const [old_wh, set_old_wh_0] = useState([...dims])
  const [old_w, old_h] = old_wh

  let default_ratio = '2.00'
  if (old_w) {
    let r = 2,
      x = Math.min(old_w, old_h) * 2
    while (x <= upscale_target) {
      r *= 2
      x *= 2
    }
    default_ratio = r.toFixed(2)
  }

  const [ratio, set_ratio_0] = useState(default_ratio)

  function set_ratio(v, s) {
    if (s > 0) {
      const m = parseInt(100000 / s)
      if (v > m) v = m.toString()
    }
    set_ratio_0(v)
  }

  function set_old_wh(wh) {
    set_old_wh_0(wh)
    set_ratio(ratio, Math.max(wh[0], wh[1]))
  }

  return (
    <Dialog open={props.open} onClose={props.on_close} maxWidth="sm">
      <form
        action={host + 'upscale'}
        method="POST"
        target="_blank"
        //encType="multipart/form-data"
      >
        <DialogTitle>Upscaling</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            {img ? (
              <>
                <Typography>
                  {`${img.title} - ${img.ind} (${img.fn}, ${dims[0]} x ${dims[1]})`}
                </Typography>
                <input
                  name="pid"
                  value={img.pid}
                  style={{ display: 'none' }}
                  readOnly
                />
                <input
                  name="ind"
                  value={img.ind}
                  style={{ display: 'none' }}
                  readOnly
                />
              </>
            ) : (
              <Grid container spacing={2}>
                {file ? (
                  <Grid item>
                    <Typography
                      align="center"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      {`${file.name} (${old_w} x ${old_h})`}
                    </Typography>
                  </Grid>
                ) : null}
                <Grid item className={classes.btn}>
                  <Button variant="contained" component="label">
                    Upload
                    <input
                      name="file"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files.length) {
                          const fp = e.target.files[0]
                          set_file(fp)

                          const im = new Image()
                          im.src = window.URL.createObjectURL(fp)

                          im.onload = () => {
                            set_old_wh([im.width, im.height])
                            window.URL.revokeObjectURL(im.src)
                          }
                        }
                      }}
                    />
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
          <FormControl component="fieldset" variant="outlined">
            <FormLabel component="legend" style={{ fontSize: '1em' }}>
              Noise Reduction
            </FormLabel>
            <RadioGroup name="noise-level" defaultValue={default_noise_level}>
              <Grid container>
                {noise_levels.map((opt) => (
                  <Grid item key={opt[0]}>
                    <FormControlLabel
                      value={opt[0]}
                      label={opt[1]}
                      control={<Radio />}
                    />
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>
          <Box mt={1}>
            <TextField
              name="ratio"
              margin="dense"
              label="Scale Ratio"
              type="number"
              value={ratio}
              inputProps={{ step: 0.01 }}
              onChange={(e) =>
                set_ratio(e.target.value, Math.max(old_w, old_h))
              }
              fullWidth
            />
          </Box>
          <Box mt={1}>
            <Grid container justifyContent="space-between">
              <Grid item>
                <TextField
                  margin="dense"
                  label="Target Width"
                  value={old_w ? Math.round(old_w * ratio) : 'N/A'}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item>
                <TextField
                  margin="dense"
                  label="Target Height"
                  value={old_h ? Math.round(old_h * ratio) : 'N/A'}
                  disabled
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.on_close} color="primary">
            Cancel
          </Button>
          <Button color="primary" type="submit">
            Convert
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
