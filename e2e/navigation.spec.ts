import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show bottom nav on mobile and hide on desktop', async ({ page }) => {
    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const bottomNav = page.locator('.btm-nav');
    await expect(bottomNav).toBeVisible();

    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(bottomNav).not.toBeVisible();
  });

  test('should have correct links and active states in bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const bottomNav = page.locator('.btm-nav');
    
    // Check for "Dashboard"
    const dashboardLink = bottomNav.locator('a:has-text("Dashboard")');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    
    // Check for "Meters"
    const metersLink = bottomNav.locator('a:has-text("Meters")');
    await expect(metersLink).toBeVisible();
    await expect(metersLink).toHaveAttribute('href', '/meters');
    
    // Check for "Add Reading" (expected to FAIL initially as it's currently "Add" linking to "/meters/add")
    const addReadingLink = bottomNav.locator('a:has-text("Add Reading")');
    await expect(addReadingLink).toBeVisible();
    await expect(addReadingLink).toHaveAttribute('href', '/add-reading');
    
    // Contracts should be REMOVED according to spec
    const contractsLink = bottomNav.locator('a:has-text("Contracts")');
    await expect(contractsLink).not.toBeVisible();
  });
});

test.describe('Desktop Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show appbar links on desktop and hide on mobile', async ({ page }) => {
    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopMenu = page.locator('.navbar-center');
    await expect(desktopMenu).toBeVisible();

    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(desktopMenu).not.toBeVisible();
  });
});
