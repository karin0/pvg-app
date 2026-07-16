import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

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
})
