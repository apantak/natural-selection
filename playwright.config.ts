import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/natural-selection/',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/natural-selection/',
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
