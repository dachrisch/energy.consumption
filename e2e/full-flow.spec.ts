import { test, expect } from '@playwright/test';

test.describe('EnergyMonitor Core Flow', () => {
  test('should complete login, add meter, and log reading', async ({ page }) => {
    test.slow();
    
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    await expect(page).toHaveURL('/dashboard');
    
    // 2. Add Meter
    await page.click('a:has-text("Meters")');
    await expect(page).toHaveURL('/meters');

    const uniqueMeterName = 'E2E-' + Date.now();
    await page.click('a:has-text("Add Meter")');
    await expect(page).toHaveURL('/meters/add');
    
    await page.fill('input[placeholder*="Main Electricity"]', uniqueMeterName);
    await page.fill('input[placeholder="F012345"]', 'SN-' + Date.now());
    await page.selectOption('select', 'power');
    await page.click('button:has-text("Save Meter")');
    
    await expect(page).toHaveURL('/meters');
    const meterCard = page.locator('.card', { hasText: uniqueMeterName });
    await expect(meterCard).toBeVisible({ timeout: 10000 });

    // 3. Add Reading
    await meterCard.locator('a:has-text("Add Reading")').click();
    await page.waitForURL('**/add-reading');
    await expect(page.locator('h1')).toContainText('Add Reading');
    
    await page.fill('input[type="number"]', '1234.56');
    await page.click('button:has-text("Save Reading")');
    
    await page.waitForURL('**/readings');
    await expect(page.locator('h1')).toContainText('Reading History');

    // 4. Check Meter Details
    await page.click('a:has-text("Meters")'); // Navigate back to meters to find the card again
    await page.waitForURL('**/meters');
    await page.locator('.card', { hasText: uniqueMeterName }).locator('a[title="Meter Details"]').click();
    await page.waitForURL('**/meters/**');
    
    const detailHeading = page.locator('h1');
    await expect(detailHeading).toContainText(uniqueMeterName, { timeout: 20000 });
    await expect(page.locator('.text-3xl').first()).toBeVisible();
  });
});