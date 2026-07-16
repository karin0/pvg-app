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

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio,
)

export { host, images_per_page, upscale_target }
