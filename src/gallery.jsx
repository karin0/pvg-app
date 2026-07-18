import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'
import {
  Box,
  Chip,
  Fade,
  FormControlLabel,
  IconButton,
  ImageListItemBar,
  Link,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import * as ReactDOM from 'react-dom'
import Carousel, { Modal, ModalGateway } from 'react-images'
import InfiniteScroll from 'react-infinite-scroll-component'

import { EnvContext } from './AppDrawer'
import { host, images_per_page } from './env'
import UpscalingDialog from './UpscalingDialog'
import { useStorage } from './util'

const TagUpdaterContext = React.createContext()
const FilterTagsContext = React.createContext()

function illust_url(img, env) {
  return (
    img.meta?.url ||
    (env?.illust_prefix || 'https://www.pixiv.net/artworks/') + img.pid
  )
}

// The hue tracks the value from red through to the theme's green (secondary
// #7ec897 sits at ~140°), translucent so the image underneath stays visible.
// Saturation dips toward the neutral midpoint so the yellow band reads as a
// muted olive rather than a loud pure yellow.
function ScoreChip(props) {
  const t = (Math.max(-7, Math.min(7, props.score)) + 7) / 14
  const hue = 8 + t * 132
  const sat = 40 + 30 * Math.abs(2 * t - 1)
  const { score } = props
  return (
    <Chip
      label={(score >= 0 ? '+' : '') + score.toFixed(2)}
      size="small"
      style={{
        ...props.style,
        backgroundColor: `hsla(${hue}, ${sat}%, 40%, 0.65)`,
        color: '#fff',
      }}
    />
  )
}

function UpscalingButton(props) {
  const [dialog_open, set_open] = useState(false)
  // measured on open, when the viewed image is surely loaded; retained after
  // close so the exit transition doesn't flash empty dimensions
  const [dims, set_dims] = useState(null)

  const open_dialog = () => {
    const el = Array.from(
      document.querySelectorAll('img.react-images__view-image'),
    ).find((e) => e.src.includes(props.img.ori))
    set_dims(
      el?.naturalWidth && el?.naturalHeight
        ? [el.naturalWidth, el.naturalHeight]
        : [props.img.w, props.img.h],
    )
    set_open(true)
  }
  const close_dialog = () => set_open(false)

  return (
    <>
      <IconButton
        color="info"
        onClick={open_dialog}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          color: 'rgba(255, 255, 255, 0.75)',
        }}
      >
        <SettingsOverscanIcon />
      </IconButton>
      <UpscalingDialog
        img={props.img}
        dims={dims || undefined}
        open={dialog_open}
        on_confirm={props.on_confirm}
        on_close={close_dialog}
      />
    </>
  )
}

// chip text with the backend's optional note as an opaque suffix
function chip_label(text, note) {
  return note ? (
    <>
      {text} <span style={{ opacity: 0.72 }}>{note}</span>
    </>
  ) : (
    text
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
function ImageCaption(props) {
  const [show, set_show] = useState(true)

  const img = props.img

  useEffect(() => {
    const a = document.querySelectorAll('img.react-images__view-image')
    for (const e of a) {
      if (e.src.includes(img.ori)) {
        const f = () => set_show(!show)
        e.addEventListener('click', f)
        return () => e.removeEventListener('click', f)
      }
    }
  }, [img, show])

  const update_tags = useContext(TagUpdaterContext)
  const tag_map = useContext(FilterTagsContext)
  const env = useContext(EnvContext)

  const author_prefix = env?.author_prefix || 'https://www.pixiv.net/users/'
  const author_url = author_prefix + img.aid.toString()

  const [btn_box, set_btn_box] = useState(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: captures react-images' header as a portal target; the self-dep binds it once the node mounts, and no mount callback exists for it
  useEffect(() => {
    const e = document.getElementsByClassName('react-images__header')
    if (e[0]) set_btn_box(e[0])
  }, [btn_box])

  const apos = tag_map.get(img.author)
  const notes = img.meta?.tag_notes
  const tag_chip = (tag, small) => {
    const pos = tag_map.get(tag)
    return (
      <Chip
        key={tag}
        size={small ? 'small' : undefined}
        style={{ marginRight: '0.5em', marginBottom: '0.3em' }}
        color={pos === undefined ? 'info' : 'primary'}
        label={chip_label(tag, notes?.[tag])}
        onClick={() => {
          props.close_modal()
          update_tags(tag, img.iid, pos)
        }}
      />
    )
  }
  const noted = notes ? img.tags.filter((t) => notes[t]) : []
  const plain = notes ? img.tags.filter((t) => !notes[t]) : img.tags
  return (
    <Fade in={show}>
      <div>
        <div
          style={{
            position: 'absolute',
            left: '16px',
            bottom: '16px',
            marginBottom: '-12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '4px',
            }}
          >
            <span style={{ paddingRight: '8px' }}>
              <CaptionLink
                url={illust_url(img, env)}
                text={img.title + ' - '}
              />
            </span>
            <CaptionLink url={author_url} text={img.author} />
            <Chip
              label={img.san}
              size="small"
              color="error"
              style={{
                marginLeft: '10px',
                marginRight: '0.5em',
                marginBottom: '0.3em',
              }}
            />
          </div>
          <div style={{ marginTop: '4px', marginBottom: '-8px' }}>
            <Chip
              style={{ marginRight: '0.5em', marginBottom: '0.3em' }}
              color={apos === undefined ? 'secondary' : 'primary'}
              label={chip_label(img.author, notes?.[img.author])}
              onClick={() => {
                props.close_modal()
                update_tags(img.author, img.iid, apos)
              }}
            />
            {plain.map((tag) => tag_chip(tag, false))}
          </div>
          {noted.length > 0 && (
            <div style={{ marginTop: '8px', marginBottom: '-8px' }}>
              {noted.map((tag) => tag_chip(tag, true))}
            </div>
          )}
          <div style={{ marginTop: '12px' }}>
            {img.meta?.score != null && (
              <ScoreChip
                score={img.meta.score}
                style={{ marginRight: '0.5em', marginBottom: '0.3em' }}
              />
            )}
            <Chip
              style={{ marginRight: '0.5em', marginBottom: '0.3em' }}
              label={img.pid}
              color="info"
              size="small"
            />
            <Chip
              style={{ marginRight: '0.5em', marginBottom: '0.3em' }}
              label={img.date}
              color="info"
              size="small"
            />
          </div>
        </div>
        {show &&
          btn_box &&
          ReactDOM.createPortal(<UpscalingButton img={img} />, btn_box)}
      </div>
    </Fade>
  )
}

const GalleryOptionsContext = React.createContext({
  show_title: false,
  goto_link: false,
})

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
              alt: img.title,
            }))}
          />
        </Modal>
      ) : null}
    </ModalGateway>
  )
}

const ModalCallbacksContext = React.createContext(undefined)

function GalleryView(props) {
  const theme = useTheme()
  const md = useMediaQuery(theme.breakpoints.up('md'))
  const cols = md ? 3 : 2
  const gap = md ? 4 : 2

  const { show_title, goto_link } = useContext(GalleryOptionsContext)
  const show_images = useContext(ModalCallbacksContext)
  const env = useContext(EnvContext)

  const { images } = props

  // Greedy shortest-column placement keeps vertical position in array order,
  // unlike CSS-columns masonry. Unknown dimensions count as square. Useful
  // for results ranked by score.
  const columns = useMemo(() => {
    const columns = Array.from({ length: cols }, () => [])
    const heights = new Array(cols).fill(0)
    images.forEach((img, i) => {
      const k = heights.indexOf(Math.min(...heights))
      columns[k].push(i)
      heights[k] += img.w && img.h ? img.h / img.w : 1
    })
    return columns
  }, [images, cols])

  return (
    <Box sx={{ display: 'flex', gap: `${gap}px` }}>
      {columns.map((column, k) => (
        <Box
          // biome-ignore lint/suspicious/noArrayIndexKey: masonry columns are positional buckets that never reorder, so the index is a stable key
          key={k}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            alignSelf: 'flex-start',
          }}
        >
          {column.map((i) => {
            const img = images[i]
            const { pages } = img
            const score = img.meta?.score
            // meta.pc indicates the illust's real page count where we got
            // fewer pages than exist. Paging behavior follows the pages
            // actually served.
            const pc = pages ? (img.meta?.pc ?? pages.length) : 0
            const image = (
              <img
                src={host + img.ori}
                loading="lazy"
                onClick={
                  goto_link
                    ? undefined
                    : pages && pages.length > 1
                      ? () => show_images(img.pages, 0)
                      : () => show_images(images, i)
                }
                alt={img.title}
                width={img.w}
                height={img.h}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            )
            // actionIcon flows its children inline, which wraps two chips
            // apart in a narrow column; the flex row pins them side by side.
            const icons = (score != null || pc > 1) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  m: '6px 8px 6px 0',
                }}
              >
                {score != null && <ScoreChip score={score} />}
                {pc > 1 && <Chip label={pc} color="info" size="small" />}
              </Box>
            )
            return (
              <Box key={img.ori} sx={{ position: 'relative' }}>
                {goto_link ? (
                  <a
                    href={illust_url(img, env)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {image}
                  </a>
                ) : (
                  image
                )}
                {(show_title || icons) && (
                  <ImageListItemBar
                    title={show_title ? img.title : undefined}
                    subtitle={show_title ? img.author : undefined}
                    actionIcon={icons || undefined}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
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
          style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}
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
  const env = useContext(EnvContext)
  // Backend-declared defaults apply only when the user never touched the
  // switch; useStorage persists nothing until the first toggle.
  const useSwitch = (key) =>
    useStorage(key, () => (env?.switch_defaults ?? []).includes(key))
  const [resorted, set_resorted] = useSwitch('resorted')
  const [reversed, set_reversed] = useSwitch('reversed')
  const [expanded, set_expanded] = useSwitch('expanded')
  const [show_title, set_show_title] = useSwitch('show_title')
  const [goto_link, set_goto_link] = useSwitch('goto_link')

  const illusts = props.images
  const images = useMemo(() => {
    let imgs = illusts
    if (resorted || reversed) {
      imgs = imgs.slice(0)
      if (resorted) imgs.sort((a, b) => b.pid - a.pid)
      if (reversed) imgs.reverse()
    }
    if (expanded) return imgs.flatMap((o) => o.pages)
    return imgs.map((o) => ({
      ...o.pages[0],
      pages: o.pages,
    }))
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
    <Box sx={{ pt: 8 }}>
      <Box sx={{ width: '100%', display: 'flow-root', px: 2 }}>
        <Typography
          sx={{ display: 'inline' }}
          color="textSecondary"
          variant="body2"
        >
          {real_page_num} pages from {illusts.length} illusts by {sa.size} users
        </Typography>
        <GallerySwitch
          label="Go to Link"
          checked={goto_link}
          setChecked={set_goto_link}
        />
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
      </Box>
      <Box sx={{ mt: 1 }}>
        <GalleryOptionsContext.Provider value={{ show_title, goto_link }}>
          <GalleryPagination
            pages={pages}
            default_offset={offset}
            key={[ha, hs]}
          />
        </GalleryOptionsContext.Provider>
      </Box>
    </Box>
  )
}

export { EnvContext, FilterTagsContext, PvgGallery, TagUpdaterContext }
