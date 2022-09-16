const host = (process.env['NODE_ENV'] === 'development') ?
  'http://127.0.0.1:5678/' : (
    window.location.protocol + '//' +
    window.location.hostname +
    (window.location.port ? ':' + window.location.port + '/' : '/')
  );

const images_per_page = 50;
const upscale_target = Math.max(window.screen.width * window.devicePixelRatio,
  window.screen.height * window.devicePixelRatio);

export { host, images_per_page, upscale_target };
