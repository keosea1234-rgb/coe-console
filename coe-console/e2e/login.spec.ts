import { expect, test } from '@playwright/test';
import { E2E_USER, hasE2ECreds, signIn } from './helpers';

test.describe('login', () => {
  test.skip(!hasE2ECreds(E2E_USER), 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set');

  test('user can sign in and reach the console', async ({ page }) => {
    await signIn(page, E2E_USER);
    // Console is the default landing page. We rely on a stable header element
    // rather than dashboard numbers (which depend on seeded data).
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('invalid password keeps user on login with an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(E2E_USER.email);
    await page.getByLabel(/password/i).fill('definitely-not-the-password');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
