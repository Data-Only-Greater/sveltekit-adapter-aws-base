import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      all: true,
      exclude: [
        '*.config.*',
        'dist',
        'lambda',
        'tests',
        'tests/mock',
        '!tests/mock/lambda',
      ],
    },
  },
})
