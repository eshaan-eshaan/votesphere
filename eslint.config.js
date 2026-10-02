import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `motion` is used as <motion.div>, which core no-unused-vars cannot see.
      'no-unused-vars': ['error', { varsIgnorePattern: '^(motion|[A-Z_])' }],
    },
  },
  {
    // The backend is CommonJS running on Node, not browser code.
    files: ['server/**/*.js', 'eslint.config.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_|^next$' }],
    },
  },
  {
    // ES-module config files keep module syntax.
    files: ['eslint.config.js', 'vite.config.js'],
    languageOptions: { sourceType: 'module' },
  },
  {
    // Context modules export a provider and its hook together by design.
    files: ['src/context/**', 'src/components/*Context.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
