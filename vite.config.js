import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const gitDescribe = execSync('git describe --tags --always --dirty', {
  encoding: 'utf8',
}).trim()

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'git-describe-html',
      transformIndexHtml: (html) => html.replace('%GIT_DESCRIBE%', gitDescribe),
    },
  ],
  base: '/s/',
  define: {
    __GIT_DESCRIBE__: JSON.stringify(gitDescribe),
  },
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 1024,
  },
})
