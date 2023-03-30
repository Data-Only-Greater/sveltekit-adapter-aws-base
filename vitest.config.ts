import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      all: true,
      exclude: [
        '!tests/mock/lambda',
        'tests/mock',
        'tests',
        'lambda',
        '*.config.*',
      ],
    },
  },
})
