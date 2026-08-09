import { Box, Paper, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

// Fraction of the rail below which a band stops shrinking, so one page out of
// thousands stays visible and grabbable.
const MIN_BAND = 0.045

// A scrollbar whose scale is the whole result set. Positions are item indices
// supplied by the gallery, which alone knows where page boundaries landed on
// screen.
function ProgressRail(props) {
  const { total, loaded, measure, onSeek, header_offset } = props
  const [span, set_span] = useState([0, 0])
  const [cursor, set_cursor] = useState(null)
  const rail = useRef(null)

  useEffect(() => {
    let frame = 0
    const sample = () => {
      frame = 0
      set_span([
        measure(window.scrollY + header_offset),
        measure(window.scrollY + window.innerHeight),
      ])
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample)
    }
    sample()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [measure, header_offset])

  const index_at = (e) => {
    const r = rail.current.getBoundingClientRect()
    const t = (e.clientY - r.top) / r.height
    return Math.max(0, Math.min(total - 1, t * total))
  }

  const band = (from, to) => {
    const h = Math.max((to - from) / total, MIN_BAND)
    return {
      top: `${Math.min(from / total, 1 - h) * 100}%`,
      height: `${h * 100}%`,
    }
  }

  // A seek costs one page, so the drag scrolls live. One seek per frame is
  // enough for a pointer that reports faster than the display refreshes.
  const seek_frame = useRef(0)
  const seek_index = useRef(0)
  const seek_soon = (index) => {
    seek_index.current = index
    if (!seek_frame.current) {
      seek_frame.current = requestAnimationFrame(() => {
        seek_frame.current = 0
        onSeek(seek_index.current)
      })
    }
  }
  const release = () => {
    cancelAnimationFrame(seek_frame.current)
    seek_frame.current = 0
    set_cursor((c) => ({ ...c, held: false }))
  }
  // A refetch remounts the gallery, which can land mid-drag.
  useEffect(() => () => cancelAnimationFrame(seek_frame.current), [])

  return (
    <Box
      ref={rail}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        const index = index_at(e)
        set_cursor({ index, held: true })
        seek_soon(index)
      }}
      onPointerMove={(e) => {
        const index = index_at(e)
        const held = cursor?.held ?? false
        set_cursor({ index, held })
        if (held) seek_soon(index)
      }}
      onPointerUp={(e) => {
        release()
        onSeek(index_at(e))
      }}
      onPointerCancel={release}
      // Pointer capture keeps boundary events on the rail until release, so a
      // drag past its edge keeps the label.
      onPointerLeave={() => set_cursor(null)}
      sx={{
        position: 'fixed',
        right: 0,
        top: `${header_offset}px`,
        // clears the FloatingControls FAB
        bottom: 88,
        width: 40,
        zIndex: (t) => t.zIndex.speedDial,
        touchAction: 'none',
        cursor: 'pointer',
        opacity: cursor?.held ? 1 : 0.6,
        transition: 'opacity 150ms',
        '&:hover': { opacity: 1 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 12,
          borderRadius: 6,
          bgcolor: (t) => t.alpha(t.palette.text.primary, 0.14),
        }}
      >
        <Box
          style={band(loaded[0], loaded[1])}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            borderRadius: 6,
            bgcolor: (t) => t.alpha(t.palette.text.primary, 0.26),
          }}
        />
        <Box
          style={band(span[0], span[1])}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            borderRadius: 6,
            bgcolor: (t) => t.alpha(t.palette.primary.main, 0.85),
          }}
        />
      </Box>
      {cursor !== null && (
        <Paper
          elevation={6}
          style={{ top: `${(cursor.index / total) * 100}%` }}
          sx={{
            position: 'absolute',
            right: 20,
            transform: 'translateY(-50%)',
            px: 1,
            py: 0.5,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            bgcolor: (t) => t.alpha(t.palette.background.paper, 0.72),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="body2">
            {Math.round(cursor.index) + 1} / {total}
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default ProgressRail
