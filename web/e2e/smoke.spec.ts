import { expect, test } from '@playwright/test';

test('start page renders its heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'So What?' })).toBeVisible();
});
