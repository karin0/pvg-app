import React, { useContext, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Chip,
  Fade,
  FormControlLabel,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Link,
  Switch,
  Typography,
  useMediaQuery,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'

import Carousel, { Modal, ModalGateway } from 'react-images'
import InfiniteScroll from 'react-infinite-scroll-component'
import * as ReactDOM from 'react-dom'

import theme from './theme'
import { host, images_per_page } from './env.js'
import UpscalingDialog from './UpscalingDialog.js'
import { useStorage } from './util.js'

const TagUpdaterContext = React.createContext()
const FilterTagsContext = React.createContext()

const useStylesUB = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    top: theme.spacing(2),
    left: theme.spacing(2),
    color: 'rgba(255, 255, 255, 0.75)',
  },
}))

function UpscalingButton(props) {
  const [dialog_open, set_open] = useState(false)

  const open_dialog = () => set_open(true)
  const close_dialog = () => set_open(false)

  const classes = useStylesUB()

  return (
    <>
      <IconButton color="info" onClick={open_dialog} className={classes.fab}>
        <SettingsOverscanIcon />
      </IconButton>
      <UpscalingDialog
        img={props.img}
        dims={props.dims}
        open={dialog_open}
        on_confirm={props.on_confirm}
        on_close={close_dialog}
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
  const [real_dims, set_real_dims] = useState(undefined)

  const img = props.img
  // allow img.w and img.h to be predicted
  const dims = real_dims || [img.w, img.h]

  useEffect(() => {
    const a = document.querySelectorAll('img.react-images__view-image')
    for (const e of a) {
      if (e.src.includes(img.ori)) {
        const f = () => set_show(!show)
        e.addEventListener('click', f)
        if (!real_dims) {
          const dims = [e.naturalWidth, e.naturalHeight]
          if (dims[0] && dims[1]) set_real_dims(dims)
          else {
            const g = (ev) => {
              const e = ev.target
              const dims = [e.naturalWidth, e.naturalHeight]
              if (dims[0] && dims[1]) {
                set_real_dims(dims)
                e.removeEventListener('load', g)
              }
            }
            e.addEventListener('load', g)
            return () => {
              e.removeEventListener('click', f)
              e.removeEventListener('load', g)
            }
          }
        }
        return () => e.removeEventListener('click', f)
      }
    }
  }, [img, show, real_dims])

  const update_tags = useContext(TagUpdaterContext)
  const tag_map = useContext(FilterTagsContext)

  const illust_url = 'https://www.pixiv.net/artworks/' + img.pid.toString(),
    author_url = 'https://www.pixiv.net/member.php?id=' + img.aid.toString()

  const [btn_box, set_btn_box] = useState(null)
  useEffect(() => {
    const e = document.getElementsByClassName('react-images__header')
    if (e[0]) set_btn_box(e[0])
  }, [btn_box])

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
          <Grid container style={{ marginTop: 12 }}>
            <Grid item>
              <Chip
                classes={{ root: classes.chip }}
                label={img.pid}
                color="info"
                size="small"
              />
              <Chip
                classes={{ root: classes.chip }}
                label={img.date}
                color="info"
                size="small"
              />
            </Grid>
          </Grid>
        </div>
        {show &&
          btn_box &&
          ReactDOM.createPortal(
            <UpscalingButton img={img} dims={dims} />,
            btn_box
          )}
      </div>
    </Fade>
  )
}

const ShowTitleContext = React.createContext(false)

function CarouselModal(props) {
  const { index, setIndex, images } = props
  const onClose = () => setIndex(-1)
  return (
    <ModalGateway>
      {index >= 0 ? (
        <Modal onClose={onClose}>
          <Carousel
            currentIndex={index >= 0 ? index : 0}
            views={images.map((img) => ({
              source: host + img.ori,
              caption: <ImageCaption img={img} close_modal={onClose} />,
            }))}
          />
        </Modal>
      ) : null}
    </ModalGateway>
  )
}

const ModalCallbacksContext = React.createContext(undefined)

function GalleryView(props) {
  const md = useMediaQuery(theme.breakpoints.up('md'))

  const show_title = useContext(ShowTitleContext)
  const show_images = useContext(ModalCallbacksContext)

  const { images } = props

  return (
    <ImageList variant="masonry" cols={md ? 3 : 2} gap={md ? 4 : 2}>
      {images.map((img, i) => {
        const { pages } = img
        const multi_pages = pages && pages.length > 1
        return (
          <ImageListItem key={img.ori}>
            <img
              src={host + img.ori}
              loading="lazy"
              onClick={
                multi_pages
                  ? () => show_images(img.pages, 0)
                  : () => show_images(images, i)
              }
              alt={img.title}
              width={img.w}
              height={img.h}
            />
            {show_title ? (
              <ImageListItemBar
                title={img.title}
                subtitle={img.author}
                actionIcon={
                  multi_pages && (
                    <Chip
                      label={pages.length}
                      color="info"
                      style={{ marginRight: 8 }}
                      size="small"
                    />
                  )
                }
              />
            ) : (
              multi_pages && (
                <ImageListItemBar
                  actionIcon={
                    <Chip
                      label={pages.length}
                      color="info"
                      style={{
                        margin: '6px 8px 6px 0',
                      }}
                      size="small"
                    />
                  }
                />
              )
            )}
          </ImageListItem>
        )
      })}
    </ImageList>
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

  const [now_pages, set_now_pages] = useState([])
  const [now_index, set_now_index] = useState(-1)

  function show_images(images, index) {
    set_now_pages(images)
    set_now_index(index)
  }

  return (
    <>
      <ModalCallbacksContext.Provider value={show_images}>
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
      </ModalCallbacksContext.Provider>
      <CarouselModal
        index={now_index}
        setIndex={set_now_index}
        images={now_pages}
      />
    </>
  )
}

function GallerySwitch(props) {
  return (
    <FormControlLabel
      style={{ float: 'right' }}
      control={
        <Switch
          checked={props.checked}
          onChange={(e) => props.setChecked(e.target.checked)}
          size="small"
        />
      }
      label={props.label}
    />
  )
}

function PvgGallery(props) {
  const [resorted, set_resorted] = useStorage('resorted', false)
  const [reversed, set_reversed] = useStorage('reversed', false)
  const [expanded, set_expanded] = useStorage('expanded', false)
  const [show_title, set_show_title] = useStorage('show_title', false)

  const illusts = props.images
  const images = useMemo(() => {
    let imgs = illusts
    let sliced = false
    function as_slice() {
      if (!sliced) {
        sliced = true
        imgs = imgs.slice(0)
      }
      return imgs
    }
    if (resorted) imgs = as_slice().sort((a, b) => b.pid - a.pid)
    if (reversed) imgs = as_slice().reverse()
    if (expanded) imgs = imgs.flatMap((o) => o.pages)
    else
      imgs = imgs.map((o) => ({
        ...o.pages[0],
        pages: o.pages,
      }))
    return imgs
  }, [illusts, resorted, reversed, expanded])

  const real_page_num = useMemo(() => {
    return illusts.reduce((acc, o) => acc + o.pages.length, 0)
  }, [illusts])

  const pages = []
  let page = [],
    offset = 0,
    ha = 0,
    hs = 0,
    cnt = 0

  const sa = new Set()
  for (const img of images) {
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
    <Box pt={8} mb={-2.5}>
      <Grid container>
        <Grid item style={{ width: '100%' }} px={2}>
          <Typography display="inline" color="textSecondary" variant="body2">
            {real_page_num} pages from {illusts.length} illusts by {sa.size}{' '}
            users
          </Typography>
          <GallerySwitch
            label="Show Titles"
            checked={show_title}
            setChecked={set_show_title}
          />
          <GallerySwitch
            label="Expanded"
            checked={expanded}
            setChecked={set_expanded}
          />
          <GallerySwitch
            label="Reversed"
            checked={reversed}
            setChecked={set_reversed}
          />
          <GallerySwitch
            label="Sort by Date"
            checked={resorted}
            setChecked={set_resorted}
          />
        </Grid>
        <Grid item mt={-1}>
          <ShowTitleContext.Provider value={show_title}>
            <GalleryPagination
              pages={pages}
              default_offset={offset}
              key={[ha, hs]}
            />
          </ShowTitleContext.Provider>
        </Grid>
      </Grid>
    </Box>
  )
}

export { PvgGallery, TagUpdaterContext, FilterTagsContext }
