import React, { useContext, useEffect, useState } from 'react'

import {
  Box,
  Chip,
  Fab,
  Fade,
  Grid,
  ImageList,
  ImageListItem,
  Link,
  Typography,
  useMediaQuery,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'

import Carousel, { Modal, ModalGateway } from 'react-images'

import theme from './theme'
import { host, images_per_page } from './env.js'
import UpscalingDialog from './UpscalingDialog.js'
import InfiniteScroll from 'react-infinite-scroll-component'

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
    marginBottom: -12,
  },
}))

function ImageCaption(props) {
  const classes = useStylesIC()
  const [show, set_show] = useState(true)

  const img = props.img
  useEffect(() => {
    const a = document.querySelectorAll('img.react-images__view-image')
    for (const e of a) {
      if (e.src?.includes(img.ori)) {
        const f = () => set_show(!show)
        e.addEventListener('click', f)
        return () => e.removeEventListener('click', f)
      }
    }
  })

  const update_tags = useContext(TagUpdaterContext)
  const tag_map = useContext(FilterTagsContext)

  const illust_url = 'https://www.pixiv.net/artworks/' + img.pid.toString(),
    author_url = 'https://www.pixiv.net/member.php?id=' + img.aid.toString()

  const apos = tag_map.get(img.author)
  return (
    <Fade in={show}>
      <div>
        <div className={classes.caption}>
          <Grid container>
            <Grid item>
              <Box pr={1}>
                <CaptionLink url={illust_url} text={img.title + ' - '} />
              </Box>
            </Grid>
            <Grid item>
              <CaptionLink url={author_url} text={img.author} />
            </Grid>
            <Grid item>
              <Chip
                label={img.san}
                size="small"
                color="error"
                style={{ marginLeft: 10 }}
              />
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
          <Grid container style={{ marginTop: 8 }}>
            <Grid item>
              <Typography>{img.pid + ': ' + img.date}</Typography>
            </Grid>
          </Grid>
        </div>
        <UpscalingButton img={img} />
      </div>
    </Fade>
  )
}

function GalleryView(props) {
  const [index, set_index] = useState(-1)

  const close_modal = () => set_index(-1)
  const md = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <>
      <ImageList variant="masonry" cols={md ? 3 : 2} gap={md ? 8 : 2}>
        {props.images.map((img, i) => (
          <ImageListItem key={img.ori}>
            <img
              src={host + img.ori}
              loading="lazy"
              onClick={() => set_index(i)}
              alt={img.title}
              width={img.w}
              height={img.h}
            />
          </ImageListItem>
        ))}
      </ImageList>
      <ModalGateway>
        {index >= 0 ? (
          <Modal onClose={close_modal}>
            <Carousel
              currentIndex={index >= 0 ? index : 0}
              views={props.images.map((img) => ({
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

function GalleryPagination(props) {
  const [views, set_views] = useState([])
  const tot = props.pages.length
  const off = views.length
  const has_more = off < tot
  if (views.length === 0 && has_more) {
    set_views([<GalleryView key={0} images={props.pages[0]} />])
  }
  console.log('loaded', off)

  return (
    <Box my={3}>
      <InfiniteScroll
        dataLength={off}
        next={() => {
          set_views([
            ...views,
            <GalleryView key={off} images={props.pages[off]} />,
          ])
        }}
        hasMore={has_more}
        loader={
          <div className="loader" key={-1}>
            Loading ...
          </div>
        }
      >
        {views}
      </InfiniteScroll>
    </Box>
  )
}

function PvgGallery(props) {
  const pages = []
  let page = [],
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
    ha ^= img.pid + (img.w || 0) + cnt + hs
    hs += img.pid + (img.h || 0) + ((x) => (x >= 0 ? x : -2 * x))(cnt ^ ha)

    if (img.iid === props.locating_id) offset = pages.length

    page.push(img)

    if (page.length >= images_per_page) {
      pages.push(page)
      page = []
    }
  }
  if (page.length) {
    pages.push(page)
  }

  return (
    <>
      <Box pt={8} mb={-2.5} pl={3.5}>
        <Typography display="inline" color="textSecondary" variant="body2">
          Found {props.images.length} images from {s.size} artworks by {sa.size}{' '}
          users
        </Typography>
      </Box>
      <GalleryPagination pages={pages} default_offset={offset} key={[ha, hs]} />
    </>
  )
}

export { PvgGallery, TagUpdaterContext, FilterTagsContext }
