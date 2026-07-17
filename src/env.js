let host = localStorage.getItem('dev_host')
if (!host) {
  host = import.meta.env.VITE_API_HOST
  if (!host) {
    const port = import.meta.env.DEV ? 5678 : window.location.port
    host =
      window.location.protocol +
      '//' +
      window.location.hostname +
      (port ? ':' + port + '/' : '/')
  }
}

// Endpoints the switcher hops between; the active one is whichever equals
// `host`. Selecting one writes `dev_host` and reloads, so `host` re-resolves.
// `dev_hosts` overrides the baked list the same way `dev_host` overrides the
// baked host, so a browser can retune the list without a rebuild.
const hosts = (
  localStorage.getItem('dev_hosts') ??
  import.meta.env.VITE_API_HOSTS ??
  ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
)

export { host, hosts, images_per_page, upscale_target }
