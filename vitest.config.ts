/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    cache: {
      dir: './node_modules/.vitest',
    },
    pool: 'forks',
    open: false,
    ui: false,
  },
})
