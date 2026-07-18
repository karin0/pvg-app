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

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
)

export { host, hosts, images_per_page, origin_host, upscale_target }
