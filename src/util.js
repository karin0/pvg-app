import { useCallback, useState } from 'react'

import { host } from './env'

function useSharedStorage(key, def, map_initial_value) {
  const [v, set_v] = useState(() => {
    const v = localStorage.getItem(key)
    if (v === null) return typeof def === 'function' ? def() : def
    let r = JSON.parse(v)
    if (map_initial_value) {
      r = map_initial_value(r)
      localStorage.setItem(key, JSON.stringify(r))
    }
    return r
  })
  const set = useCallback(
    (n) => {
      set_v((prev) => {
        const next = typeof n === 'function' ? n(prev) : n
        if (next !== prev) localStorage.setItem(key, JSON.stringify(next))
        return next
      })
    },
    [key],
  )
  return [v, set]
}

const useStorage = (key, def) => useSharedStorage(`${key}:${host}`, def)

// A drag that selects text inside a clickable element still ends in a click on
// it. A click that leaves a selection behind was a selection, so it is dropped.
function unless_selecting(f) {
  return (e) => {
    if (window.getSelection().isCollapsed) f(e)
  }
}

export { unless_selecting, useSharedStorage, useStorage }
