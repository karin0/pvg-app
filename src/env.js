const ensure_scheme = (s) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : window.location.protocol + '//' + s
const ensure_slash = (s) => (s.endsWith('/') ? s : s + '/')
const normalize = (s) => ensure_slash(ensure_scheme(s))

const port = import.meta.env.DEV ? 5678 : window.location.port
const origin_host = normalize(
  window.location.hostname + (port ? ':' + port : ''),
)

let host = localStorage.getItem('dev_host') || import.meta.env.VITE_API_HOST
host = host ? normalize(host) : origin_host

const hosts = (
  localStorage.getItem('dev_hosts') ??
  import.meta.env.VITE_API_HOSTS ??
  ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(normalize)

// Score sources the user picks from, `name=url` pairs: each url takes a POSTed
// array of illust ids and answers an object mapping some of them to scores.
const score_sources = (import.meta.env.VITE_SCORE_URLS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const i = s.indexOf('=')
    if (i < 0) throw new Error(`VITE_SCORE_URLS entry without a name: ${s}`)
    return { name: s.slice(0, i), url: ensure_scheme(s.slice(i + 1)) }
  })

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
)

export {
  host,
  hosts,
  images_per_page,
  origin_host,
  score_sources,
  upscale_target,
}
