'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: process.env.AURA_E2E_URL || 'http://127.0.0.1:5173',
    channel: 'chrome',
    headless: true,
  },
});