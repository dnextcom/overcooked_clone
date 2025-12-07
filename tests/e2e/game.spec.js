import { test, expect } from '@playwright/test';

test.describe('Overcooked Clone Game', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the game page with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Overcooked Clone/);
    });

    test('should display initial UI elements', async ({ page }) => {
        const score = page.locator('#score');
        const timer = page.locator('#timer');

        await expect(score).toBeVisible();
        await expect(score).toHaveText(/Score: 0/);

        await expect(timer).toBeVisible();
        await expect(timer).toHaveText(/Time: 2:00/);
    });

    test('should spawn orders over time', async ({ page }) => {
        // Orders spawn every 8 seconds. We verify the container is empty initially
        const ordersContainer = page.locator('#orders-container');
        // It might trigger immediately if timer starts at 0, but let's check basic assumption
        // Actually OrderManager starts spawnTimer at 0 and increments. 
        // update(dt) -> spawnTimer += dt. if spawnTimer >= spawnInterval (8).
        // So it should take 8 seconds.

        // Check initially close to empty or wait for it to be empty if verify load speed
        // But since it's canvas based for game, we rely on DOM UI.

        // Wait for an order card to appear. Timeout is default 30s.
        const orderCard = page.locator('.order-card').first();
        await expect(orderCard).toBeVisible({ timeout: 15000 });
    });
});
