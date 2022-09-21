import React, { useContext, useState } from 'react'

import {
  AppBar,
  Box,
  Chip,
  Fab,
  Grid,
  Link,
  Pagination,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'

import Carousel, { Modal, ModalGateway } from 'react-images'
import Gallery from 'react-photo-gallery'

import { host, images_per_page } from './env.js'
import UpscalingDialog from './UpscalingDialog.js'

const TagUpdaterContext = React.createContext()
const FilterTagsContext = React.createContext()

const useStylesUB = makeStyles((theme) => ({
  fab: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}))

function UpscalingButton(props) {
  const [dialog_open, set_open] = useState(false)

  const open_dialog = () => set_open(true)
  const close_dialog = () => set_open(false)

  const classes = useStylesUB()

  return (
    <>
      <Fab color="primary" onClick={open_dialog} className={classes.fab}>
        <SettingsOverscanIcon />
      </Fab>
      <UpscalingDialog
        img={props.img}
        open={dialog_open}
        on_confirm={props.on_confirm}
        on_close={close_dialog}
        key={props.img.iid}
      />
    </>
  )
}

function CaptionLink(props) {
  return (
    <Typography>
      <Link href={props.url} target="_blank" rel="noreferrer">
        {props.text}
      </Link>
    </Typography>
  )
}

const useStylesIC = makeStyles((theme) => ({
  chip: {
    marginRight: '0.5em',
    marginBottom: '0.3em',
  },
  caption: {
    position: 'absolute',
    left: theme.spacing(2),
    bottom: theme.spacing(2),
  },
}))

function ImageCaption(props) {
  const classes = useStylesIC()

  const update_tags = useContext(TagUpdaterContext)
  const tag_map = useContext(FilterTagsContext)

  const img = props.img
  const illust_url = 'https://www.pixiv.net/artworks/' + img.pid.toString(),
    author_url = 'https://www.pixiv.net/member.php?id=' + img.aid.toString()

  const apos = tag_map.get(img.author)
  return (
    <>
      <div className={classes.caption}>
        <Grid container>
          <Grid item>
            <Box pr={1}>
              <CaptionLink url={illust_url} text={img.title} />
            </Box>
          </Grid>
          <Grid item>
            <CaptionLink url={author_url} text={img.author} />
          </Grid>
        </Grid>
        <Box mt={0.5} mb={-1}>
          <Chip
            classes={{ root: classes.chip }}
            color={isNaN(apos) ? 'secondary' : 'primary'}
            label={img.author}
            onClick={() => {
              props.close_modal()
              update_tags(img.author, img.iid, apos)
            }}
          />
          {img.tags.map((tag) => {
            const pos = tag_map.get(tag)
            return (
              <Chip
                key={tag}
                classes={{ root: classes.chip }}
                color={isNaN(pos) ? 'info' : 'primary'}
                label={tag}
                onClick={() => {
                  props.close_modal()
                  update_tags(tag, img.iid, pos)
                }}
              />
            )
          })}
        </Box>
      </div>
      <UpscalingButton img={img} />
    </>
  )
}

function GalleryView(props) {
  const [index, set_index] = useState(-1)

  const close_modal = () => set_index(-1)

  return (
    <>
      <Gallery
        photos={props.images}
        onClick={(e, { index }) => set_index(index)}
      />
      <ModalGateway>
        {index >= 0 ? (
          <Modal onClose={close_modal}>
            <Carousel
              currentIndex={index >= 0 ? index : 0}
              views={props.views.map((img) => ({
                source: host + img.ori,
                caption: <ImageCaption img={img} close_modal={close_modal} />,
              }))}
            />
          </Modal>
        ) : null}
      </ModalGateway>
    </>
  )
}

const char_code_0 = '0'.charCodeAt(0)
const char_code_9 = '9'.charCodeAt(0)

function PaginationInput(props) {
  const [val, set_val] = useState(1)

  return (
    <TextField
      style={{
        width: 70,
        marginTop: 5,
      }}
      inputProps={{
        style: {
          fontSize: '100%',
        },
      }}
      type="text"
      size="small"
      margin="dense"
      onChange={(e) => {
        const nv = e.target.value
        if (nv === '') return set_val(0)

        for (let i = 0; i < nv.length; ++i) {
          const c = nv.charCodeAt(i)
          if (c < char_code_0 || c > char_code_9) return (e.target.value = val)
        }

        const x = parseInt(nv, 10)
        if ((x >= 1 && x <= props.tot) || (x > 0 && x < val)) return set_val(x)

        e.target.value = val
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && val >= 1 && val <= props.tot)
          props.switch(val - 1)
      }}
    />
  )
}

const useStylesGP = makeStyles((theme) => ({
  drawer: {
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    height: 38,
  } /* ,
    middle: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)'
    } */,
}))

const lg_drawer_min_width = 700

function GalleryPagination(props) {
  const [off, set_offset] = useState(props.default_offset)

  const tot = props.pages.length
  let images, views
  if (off < tot) {
    images = props.pages[off]
    views = props.modal_pages[off]
  } else images = views = []

  const lg = useMediaQuery(`(min-width:${lg_drawer_min_width}px)`)

  return (
    <>
      <Box my={3} width="100%">
        <GalleryView images={images} views={views} />
      </Box>
      <AppBar
        position="fixed"
        sx={{ top: 'auto', bottom: 0 }}
        className="page-bar"
        color="info"
      >
        <Toolbar variant="dense">
          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Pagination
              count={tot}
              page={off + 1}
              size="small"
              onChange={(_, v) => {
                window.scrollTo(0, 0)
                set_offset(v - 1)
              }}
              color="primary"
              siblingRange={lg ? 2 : 1}
              boundaryRange={lg ? 3 : 1}
            />
            <PaginationInput switch={set_offset} tot={tot} />
          </Grid>
        </Toolbar>
      </AppBar>
    </>
  )
}

function PvgGallery(props) {
  const pages = [],
    modal_pages = []
  let page = [],
    modal_page = [],
    offset = 0,
    ha = 0,
    hs = 0,
    cnt = 0

  const s = new Set(),
    sa = new Set()
  for (const img of props.images) {
    s.add(img.pid)
    sa.add(img.aid)

    ++cnt
    ha ^= img.pid + img.w + cnt + hs
    hs += img.pid + img.h + ((x) => (x >= 0 ? x : -2 * x))(cnt ^ ha)

    if (img.iid === props.locating_id) offset = pages.length

    page.push({
      src: host + img.thu,
      width: img.w,
      height: img.h,
    })
    modal_page.push(img)

    if (page.length >= images_per_page) {
      pages.push(page)
      modal_pages.push(modal_page)
      page = []
      modal_page = []
    }
  }
  if (page.length) {
    pages.push(page)
    modal_pages.push(modal_page)
  }

  return (
    <>
      <Box pt={8} mb={-2.5} pl={3.5}>
        <Typography display="inline" color="textSecondary" variant="body2">
          Found {props.images.length} images from {s.size} artworks by {sa.size}{' '}
          users
        </Typography>
      </Box>
      <GalleryPagination
        pages={pages}
        modal_pages={modal_pages}
        default_offset={offset}
        key={[ha, hs]}
      />
    </>
  )
}

export { PvgGallery, TagUpdaterContext, FilterTagsContext }
