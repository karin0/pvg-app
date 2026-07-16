import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, __GIT_DESCRIBE__: 'readonly' },
    },
    rules: {
      // gallery.jsx syncs with react-images' DOM (image dimensions, header
      // element) which exposes no subscription API; measurement effects there
      // legitimately set state synchronously.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]
