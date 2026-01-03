// Playwright E2E test: checks every tool UI and main feature
const { test, expect } = require('@playwright/test');



// Import the static toolMeta.json file for all tool IDs and names
const tools = require('./toolMeta.json');

test.describe('Aura Tools E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:10000');
  });

  for (const tool of tools) {
    test(`Tool UI loads and main feature works: ${tool.name}`, async ({ page }) => {
      // Open sidebar and click tool
      await page.click(`.sidebar-label:text-is("${tool.name}")`);
      // Wait for tool UI to load
      await expect(page.locator('h2')).toHaveText(new RegExp(tool.name, 'i'));
      // Try main input (if present)
      const input = page.locator('input[type="text"]');
      if (await input.count()) {
        await input.first().fill('test query');
      }
      const button = page.locator('button', { hasText: /run|generate|query|schedule|start|submit|report|go|search/i });
      if (await button.count()) {
        await button.first().click();
        // Wait for result or error
        await page.waitForTimeout(1200);
        const result = page.locator('pre, .result, .output, .report-result');
        expect(await result.count() > 0).toBeTruthy();
      }
    });
  }
});
