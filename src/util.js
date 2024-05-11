import { useState } from 'react'

function useStorage(key, def, map_initial_value) {
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
  return [
    v,
    (n) => {
      localStorage.setItem(key, JSON.stringify(n))
      set_v(n)
    },
  ]
}

export { useStorage }
