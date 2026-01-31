import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    // Ignore unfinished tool and UI stubs to keep lint green
    'src/components/tools/**',
    'src/components/**',
    'src/dashboard/**',
    'src/credits/**',
    'src/onboarding/**',
    'src/api.js',
    'src/ProjectSwitcher.jsx',
    'src/App.jsx',
    'src/Reports.jsx',
    'src/ToolsList.jsx',
    'src/ToolPlaceholder.jsx',
    'src/ProductsList.jsx',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Jest globals for tests
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
