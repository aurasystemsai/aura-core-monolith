const { test, expect } = require('@playwright/test');

const APP_URL = process.env.AURA_E2E_URL || 'http://127.0.0.1:5173';

async function openAllTools(page) {
  await page.getByRole('button', { name: /^All Tools/ }).click();
  await expect(page.getByRole('heading', { name: 'All Tools' })).toBeVisible();
}

test.describe('AURA console navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    await continueButton.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    if (await continueButton.isVisible().catch(() => false)) await continueButton.click();
  });

  test('search, category filter, empty state, and clear filters work', async ({ page }) => {
    await openAllTools(page);
    const search = page.getByRole('textbox', { name: 'Search tools...' });

    await expect(page.getByText(/\d+ powerful modules to grow your business/)).toBeVisible();
    await search.fill('Data Enrichment Suite');
    await expect(page.getByRole('heading', { name: 'Data Enrichment Suite' })).toBeVisible();
    await page.getByRole('button', { name: 'Personalization & Revenue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Data Enrichment Suite' })).toBeVisible();

    await search.fill('no-such-tool-xyz');
    await expect(page.getByText('No tools found')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
    await expect(page.getByText(/\d+ powerful modules to grow your business/)).toBeVisible();
  });

  test('an accessible catalog card opens its matching tool route', async ({ page }) => {
    await openAllTools(page);
    await page.getByRole('textbox', { name: 'Search tools...' }).fill('Entity & Topic Explorer');
    const card = page.locator('.tool-card').filter({
      has: page.getByRole('heading', { name: 'Entity & Topic Explorer', exact: true }),
    });
    await expect(card).toHaveCount(1);
    await card.click();
    await expect(page.getByRole('heading', { name: 'Entity & Topic Explorer' })).toBeVisible();

    const main = page.locator('main');
    let previousContent = await main.innerText();
    await page.getByRole('button', { name: 'Topics', exact: true }).click();
    await expect.poll(() => main.innerText()).not.toBe(previousContent);
    previousContent = await main.innerText();
    await page.getByRole('button', { name: 'Knowledge Graph', exact: true }).click();
    await expect.poll(() => main.innerText()).not.toBe(previousContent);
  });

  test('Starter plan gates Growth tools to Settings', async ({ page }) => {
    await openAllTools(page);
    await page.getByRole('textbox', { name: 'Search tools...' }).fill('Blog SEO Engine');
    const lockedCard = page.locator('.tool-card').filter({
      has: page.getByRole('heading', { name: 'Blog SEO Engine', exact: true }),
    });
    await expect(lockedCard.getByText('Growth Plan')).toBeVisible();
    await lockedCard.click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('Suite view opens and Browse All Tools returns to the catalog', async ({ page }) => {
    await openAllTools(page);
    await page.getByRole('button', { name: 'Open Suite View', exact: true }).click();
    await expect(page.getByRole('banner').getByText('Suite', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Browse All Tools', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'All Tools' })).toBeVisible();
  });

  test('sidebar search opens tools and collapse controls toggle', async ({ page }) => {
    const sidebarSearch = page.getByRole('textbox', { name: 'Search tools' });
    await sidebarSearch.fill('Entity & Topic Explorer');
    await expect(page.getByRole('button', { name: 'Entity & Topic Explorer', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Entity & Topic Explorer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Entity & Topic Explorer' })).toBeVisible();
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  });

  test('Loyalty uses the dark theme and creates a program from its dialog', async ({ page }) => {
    test.setTimeout(60000);
    const programs = [];
    let createRequests = 0;

    await page.route('**/api/billing/credits', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, plan: 'enterprise', credits: -1 }),
    }));
    await page.route('**/api/loyalty-referral/**', async route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      let body = { ok: true };

      if (pathname.endsWith('/programs') && request.method() === 'GET') {
        body = { programs, total: programs.length };
      } else if (pathname.endsWith('/programs') && request.method() === 'POST') {
        createRequests += 1;
        const program = { id: 'program-e2e', status: 'active', ...request.postDataJSON() };
        programs.push(program);
        body = { success: true, program };
      } else if (pathname.endsWith('/referrals')) {
        body = { referrals: [] };
      } else if (pathname.endsWith('/members')) {
        body = { members: [] };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.reload();
    await expect(page.getByText('Enterprise', { exact: true }).first()).toBeVisible();
    await openAllTools(page);
    await page.getByRole('textbox', { name: 'Search tools...' }).fill('Loyalty & Referral Programs');
    await page.getByRole('heading', { name: 'Loyalty & Referral Programs', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Loyalty & Referral Programs' }))
      .toBeVisible({ timeout: 25000 });

    await expect.poll(() => page.locator('main .MuiCard-root').first().evaluate(
      element => getComputedStyle(element).backgroundColor
    )).toBe('rgb(24, 24, 27)');

    await page.getByRole('button', { name: 'Create Program' }).click();
    await page.getByRole('textbox', { name: 'Program name' }).fill('E2E Rewards Program');
    await page.getByLabel('Program type').click();
    await page.getByRole('option', { name: 'Tiered' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText('E2E Rewards Program', { exact: true })).toBeVisible();
    expect(createRequests).toBe(1);
    expect(programs[0]).toMatchObject({ name: 'E2E Rewards Program', type: 'tiered' });
  });
});
