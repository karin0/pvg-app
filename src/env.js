const port = import.meta.env.DEV ? 5678 : window.location.port
// Relative backend and score source URLs resolve against the API origin.
const origin = `${window.location.protocol}//${window.location.hostname}${port ? ':' + port : ''}/`

// Both VITE_API_HOSTS and VITE_SCORE_URLS are comma-separated `name=url` pairs.
function parse_pairs(variable, value) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf('=')
      if (i < 0) throw new Error(`${variable} entry without a name: ${s}`)
      return { name: s.slice(0, i), url: new URL(s.slice(i + 1), origin).href }
    })
}

// The settings of a backend are stored under its name, so they outlive a move
// of its URL.
const listed = parse_pairs(
  'VITE_API_HOSTS',
  import.meta.env.VITE_API_HOSTS,
).map(({ name, url }) => ({
  name,
  url: url.endsWith('/') ? url : url + '/',
}))
const backends = listed.length ? listed : [{ name: 'origin', url: origin }]
const backend =
  backends.find((b) => b.name === localStorage.getItem('backend')) ??
  backends[0]
const host = backend.url

// Score sources the user picks from: each url takes a POSTed array of illust
// ids and answers an object mapping some of them to scores.
const score_sources = parse_pairs(
  'VITE_SCORE_URLS',
  import.meta.env.VITE_SCORE_URLS,
)

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
)

export {
  backend,
  backends,
  host,
  images_per_page,
  score_sources,
  upscale_target,
}
