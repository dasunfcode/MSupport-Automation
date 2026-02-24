import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,

  // Run tests sequentially
  fullyParallel: false,
  workers: 1,

  use: {
    headless: false, // set true for CI/CD
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project – runs OTP login ONCE
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Main project – uses saved login state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth.json',
      },
      dependencies: ['setup'],
    },
  ],
});