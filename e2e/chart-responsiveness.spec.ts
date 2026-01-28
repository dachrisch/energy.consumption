import { test, expect } from '@playwright/test';

test.describe('Chart Responsiveness', () => {
  test('should not have horizontal overflow on small mobile screens', async ({ page }) => {
    test.slow();
    
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');

    // 2. Add a meter
    const uniqueMeterName = 'RESP-E2E-' + Date.now();
    await page.goto('/meters/add');
    await page.fill('input[placeholder*="Main Electricity"]', uniqueMeterName);
    await page.fill('input[placeholder="F012345"]', 'SN-' + Date.now());
    await page.selectOption('select', 'power');
    await page.click('button:has-text("Save Meter")');
    await expect(page).toHaveURL(/\/meters/);
    
    // 3. Add a reading
    const meterCard = page.locator('.card', { hasText: uniqueMeterName });
    await expect(meterCard).toBeVisible({ timeout: 10000 });
    await meterCard.locator('a:has-text("Add Reading")').click();
    await page.waitForURL('**/add-reading');
    await page.fill('input[type="number"]', '1234.56');
    await page.click('button:has-text("Save Reading")');
    await expect(page).toHaveURL(/\/meters\/[a-f0-9]+\/readings/);

    // 4. Go to Meter Detail
    await page.goto('/meters');
    await page.locator('.card', { hasText: uniqueMeterName }).locator('a[title="Meter Details"]').click();
    await expect(page).toHaveURL(/\/meters\/[a-f0-9]+/);

    // Set viewport to a small mobile size
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Log widths
    const widths = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const parent = canvas?.parentElement;
      const card = parent?.closest('.card');
      return {
        viewport: window.innerWidth,
        canvasWidthAttr: canvas?.getAttribute('width'),
        canvasOffsetWidth: canvas?.offsetWidth,
        parentOffsetWidth: parent?.offsetWidth,
        cardOffsetWidth: (card as HTMLElement)?.offsetWidth
      };
    });
    
    expect(widths.canvasOffsetWidth).toBeLessThanOrEqual(widths.viewport);
    expect(widths.cardOffsetWidth).toBeLessThanOrEqual(widths.viewport);
  });
});
