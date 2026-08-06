import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',

  /* Global timeout per test */
  timeout: 60 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Run tests sequentially */
  fullyParallel: false,
  workers: 1,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  use: {
    baseURL: process.env.BASE_URL,

    headless: false, // change to true in CI
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    /**
     * Auth setup project
     * Runs once to generate auth.json
     */
    {
      name: 'setup',
      testMatch: /login\.setup\.ts/,
    },

    /**
     * Asset logs tests — must run before the rest of the suite
     * so cache/storage cleanup happens against a known baseline.
     */
    {
      name: 'assetlogs',
      testMatch: /assetlogs\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: process.env.AUTH_JSON_PATH || 'auth.json',
      },
      dependencies: ['setup'],
    },

    /**
     * Main test project
     * Uses stored auth state
     */
    {
      name: 'chromium',
      testIgnore: [/assetlogs\.test\.ts/, /servicecase\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: process.env.AUTH_JSON_PATH || 'auth.json',
      },
      dependencies: ['setup', 'assetlogs'],
    },

    /**
     * Public Create Service Case form (qa.form.msupport.am/ticket-form).
     * Requires no authentication, so it runs standalone with no dependencies
     * and no stored auth state.
     */
    {
      name: 'serviceform',
      testMatch: /servicecase\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Folder for artifacts */
  outputDir: 'test-results',
});