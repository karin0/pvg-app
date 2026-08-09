import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import SettingsOverscanIcon from '@mui/icons-material/SettingsOverscan'
import {
  Box,
  Chip,
  Fade,
  IconButton,
  ImageListItemBar,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as ReactDOM from 'react-dom'
import Carousel, { Modal, ModalGateway } from 'react-images'

import { EnvContext } from './AppDrawer'
import { host, images_per_page } from './env'
import ProgressRail from './ProgressRail'
import UpscalingDialog from './UpscalingDialog'

const TagUpdaterContext = React.createContext()
const FilterTagsContext = React.createContext()
// `{states: Map(pid -> {state: 'pending' | 'done' | 'error', message}),
// add(pid)}`, or null when `/env` names no bookmark endpoint.
const BookmarkContext = React.createContext(null)

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

// Only a posted-and-accepted bookmark fills the heart. A rejected one turns it
// amber and keeps the outline, with the backend's message on hover and in the
// snackbar; the click stays live, and reposting an illust is harmless.
const HEART_COLOR = { done: 'error.main', error: 'warning.main' }

function BookmarkButton(props) {
  const bookmarks = useContext(BookmarkContext)
  if (!bookmarks) return null

  const { pid } = props
  const status = bookmarks.states.get(pid)
  const state = status?.state
  return (
    <IconButton
      size="small"
      title={status?.message}
      disabled={state === 'pending'}
      onClick={() => bookmarks.add(pid)}
      sx={{
        p: '4px',
        color: HEART_COLOR[state] ?? 'rgba(255, 255, 255, 0.85)',
      }}
    >
      {state === 'done' ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
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

// The pagination re-creates an element for every mounted page on each range
// change. PvgGallery holds each `images` array identity stable, so this memo
// turns those into bailouts.
const GalleryView = React.memo(function GalleryView(props) {
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
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  // Pages the backend gave no dimensions for reserve the
                  // square that the column packing already assumed for them.
                  // The `auto` keyword lets the real ratio take the box once
                  // the image decodes.
                  aspectRatio: img.w && img.h ? undefined : 'auto 1 / 1',
                }}
              />
            )
            // A bookmark covers the whole illust, so the heart rides the first
            // page alone; Expanded lays out every page as its own tile. Reading
            // `/env` rather than the bookmark context keeps a state change from
            // re-rendering this memoized component.
            const heart = env?.bookmark_url && img.ind === 0
            // actionIcon flows its children inline, which wraps two chips
            // apart in a narrow column; the flex row pins them side by side.
            // The heart sits at its right end, the tile's bottom-right corner.
            const icons = (score != null || pc > 1 || heart) && (
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
                {heart && <BookmarkButton pid={img.pid} />}
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
})

// Height of the fixed AppBar (its dense Toolbar is 48px) plus a gap. Content
// starts at this line and scroll targets park on it, so seeking to the first
// item lands at the top of the document.
const HEADER_OFFSET = 64

function doc_top(el) {
  return el.getBoundingClientRect().top + window.scrollY
}

function viewport_top(el) {
  return el.getBoundingClientRect().top
}

// How far outside the viewport a sentinel starts loading its next page.
const PREFETCH_MARGIN = '600px'

// Renders a contiguous page range [start, end), grown a page at a time from
// either end by whichever sentinel comes into view. Seeking re-anchors the
// range on the target page, so a jump costs one page no matter how far it goes
// and the pages behind it come back by scrolling up.
function GalleryPagination(props) {
  const { pages, initial_index } = props
  const page_els = useRef(new Map())
  const pending = useRef(initial_index || null)
  // Viewport position a page held before a prepend pushed it down. Viewport
  // coordinates make the correction a no-op wherever the browser's own scroll
  // anchoring already did the work.
  const anchor = useRef(null)
  const top_edge = useRef(null)
  const bottom_edge = useRef(null)

  const total = useMemo(() => pages.reduce((a, p) => a + p.length, 0), [pages])

  const first = Math.floor(initial_index / images_per_page)
  const [range, set_range] = useState([
    first,
    Math.min(first + 1, pages.length),
  ])
  const [start, end] = range
  const range_ref = useRef(range)

  const [now_pages, set_now_pages] = useState([])
  const [now_index, set_now_index] = useState(-1)

  // One identity for the component's lifetime, so a range change leaves every
  // mounted GalleryView's memo intact.
  const show_images = useCallback((images, index) => {
    set_now_pages(images)
    set_now_index(index)
  }, [])

  // Item index of the page-relative fraction at document coordinate y. Within a
  // page the mapping is linear, so its resolution is one page; masonry columns
  // make anything finer meaningless anyway.
  //
  // The range comes from a ref written in the layout effect below, so a scroll
  // event landing between a commit and the next passive effect still reads the
  // pages that are mounted.
  const measure = useCallback(
    (y) => {
      const [start, end] = range_ref.current
      let lo = start
      let hi = end - 1
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (doc_top(page_els.current.get(mid)) <= y) lo = mid
        else hi = mid - 1
      }
      const el = page_els.current.get(lo)
      const frac = Math.max(0, Math.min(1, (y - doc_top(el)) / el.offsetHeight))
      return Math.max(
        start * images_per_page,
        Math.min(total - 1, lo * images_per_page + frac * pages[lo].length),
      )
    },
    [pages, total],
  )

  // Returns the requested position. The browser clamps it to the document when
  // too little is mounted below.
  const scroll_to = (index) => {
    const p = Math.floor(index / images_per_page)
    const el = page_els.current.get(p)
    const frac = (index - p * images_per_page) / pages[p].length
    const y = doc_top(el) + frac * el.offsetHeight - HEADER_OFFSET
    window.scrollTo(0, y)
    return y
  }

  // A seek into the tail of a page can ask for a position past the document's
  // current height. The request stands until the sentinel below has appended
  // enough for it to land.
  const settle = () => {
    const index = pending.current
    if (index === null) return
    const y = scroll_to(index)
    if (window.scrollY >= y - 1 || end >= pages.length) pending.current = null
  }

  const seek = (index) => {
    const p = Math.floor(index / images_per_page)
    pending.current = index
    if (p >= start && p < end) settle()
    else set_range([p, p + 1])
  }

  const has_top = start > 0
  const has_bottom = end < pages.length

  // The range comes from the ref. An observation can reach a callback whose
  // effect React has committed past but has yet to tear down, and by then the
  // page it would anchor on is unmounted.
  // biome-ignore lint/correctness/useExhaustiveDependencies: has_top and has_bottom gate whether each sentinel node exists, so the observer is rebuilt when either flips even though the callback reads neither
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (e.target === top_edge.current) {
            const el = page_els.current.get(range_ref.current[0])
            anchor.current = { el, top: viewport_top(el) }
            set_range(([s, x]) => [Math.max(0, s - 1), x])
          } else {
            set_range(([s, x]) => [s, Math.min(x + 1, pages.length)])
          }
        }
      },
      { rootMargin: PREFETCH_MARGIN },
    )
    if (top_edge.current) observer.observe(top_edge.current)
    if (bottom_edge.current) observer.observe(bottom_edge.current)
    return () => observer.disconnect()
  }, [has_top, has_bottom, pages.length])

  useLayoutEffect(() => {
    range_ref.current = range
    const a = anchor.current
    if (a !== null) {
      anchor.current = null
      // A seek can supersede the prepend this measurement belonged to and
      // unmount the page it anchored on.
      if (a.el.isConnected) {
        window.scrollBy(0, viewport_top(a.el) - a.top)
      }
    }
    settle()
  })

  return (
    <>
      <ModalCallbacksContext.Provider value={show_images}>
        <Box>
          {has_top && (
            <div className="loader" ref={top_edge}>
              Loading ...
            </div>
          )}
          <Box
            sx={{ display: 'flex', flexDirection: 'column', rowGap: '16px' }}
          >
            {pages.slice(start, end).map((images, k) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: start + k is the absolute page number, which identifies the chunk no matter where the range begins
                key={start + k}
                ref={(el) => {
                  if (el) page_els.current.set(start + k, el)
                  else page_els.current.delete(start + k)
                }}
              >
                <GalleryView images={images} />
              </div>
            ))}
          </Box>
          {has_bottom && (
            <div className="loader" ref={bottom_edge}>
              Loading ...
            </div>
          )}
        </Box>
      </ModalCallbacksContext.Provider>
      {total > images_per_page && now_index < 0 && (
        <ProgressRail
          total={total}
          loaded={[
            start * images_per_page,
            Math.min(total, end * images_per_page),
          ]}
          measure={measure}
          onSeek={seek}
          header_offset={HEADER_OFFSET}
        />
      )}
      <CarouselModal
        index={now_index}
        setIndex={set_now_index}
        images={now_pages}
      />
    </>
  )
}

// Each author takes the position of their first work in the incoming order, so
// a backend that ranks the stream keeps deciding where every author lands.
function group_by_author(illusts) {
  const groups = new Map()
  for (const img of illusts) {
    const g = groups.get(img.aid)
    if (g) g.push(img)
    else groups.set(img.aid, [img])
  }
  return Array.from(groups.values()).flat()
}

function PvgGallery(props) {
  const {
    resorted,
    reversed,
    grouped,
    expanded,
    show_title,
    goto_link,
    locating_id,
  } = props

  const illusts = props.images
  const images = useMemo(() => {
    let imgs = illusts
    if (resorted || reversed) {
      imgs = imgs.slice(0)
      if (resorted) imgs.sort((a, b) => b.pid - a.pid)
      if (reversed) imgs.reverse()
    }
    if (grouped) imgs = group_by_author(imgs)
    if (expanded) return imgs.flatMap((o) => o.pages)
    return imgs.map((o) => ({
      ...o.pages[0],
      pages: o.pages,
    }))
  }, [illusts, resorted, reversed, grouped, expanded])

  // The page array identity must survive re-renders: GalleryPagination hands
  // each chunk straight to a memoized GalleryView.
  const layout = useMemo(() => {
    const pages = []
    let page = [],
      initial_index = 0,
      ha = 0,
      hs = 0,
      cnt = 0

    for (const img of images) {
      ++cnt
      ha ^= img.pid + (img.w || 0) + cnt + hs
      hs += img.pid + (img.h || 0) + ((x) => (x >= 0 ? x : -2 * x))(cnt ^ ha)

      if (img.iid === locating_id) initial_index = cnt - 1

      page.push(img)

      if (page.length >= images_per_page) {
        pages.push(page)
        page = []
      }
    }
    if (page.length) {
      pages.push(page)
    }

    return { pages, initial_index, key: `${ha},${hs},${initial_index}` }
  }, [images, locating_id])

  const options = useMemo(
    () => ({ show_title, goto_link }),
    [show_title, goto_link],
  )

  return (
    <Box sx={{ pt: `${HEADER_OFFSET}px` }}>
      <GalleryOptionsContext.Provider value={options}>
        <GalleryPagination
          pages={layout.pages}
          initial_index={layout.initial_index}
          key={layout.key}
        />
      </GalleryOptionsContext.Provider>
    </Box>
  )
}

export {
  BookmarkContext,
  EnvContext,
  FilterTagsContext,
  PvgGallery,
  TagUpdaterContext,
}
