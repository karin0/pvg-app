const port =
  process.env['NODE_ENV'] === 'development' ? 5678 : window.location.port
const host =
  window.location.protocol +
  '//' +
  window.location.hostname +
  (port ? ':' + port + '/' : '/')

const images_per_page = 50
const upscale_target = Math.max(
  window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio
)

export { host, images_per_page, upscale_target }
