import { expect, test } from '@playwright/test';
import { E2E_USER, hasE2ECreds, signIn } from './helpers';

test.describe('request create', () => {
  test.skip(!hasE2ECreds(E2E_USER), 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set');

  test('user can submit a new event request', async ({ page }) => {
    await signIn(page, E2E_USER);
    await page.goto('/new-request');

    // The page autopopulates date/event id, so the buyer only has to set
    // the discriminating fields. We use accessible labels and avoid
    // brittle CSS selectors.
    await page.getByLabel(/requestor email/i).fill(E2E_USER.email);
    await page.getByLabel(/category/i).first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/subcategory/i).click();
    await page.getByRole('option').first().click();

    // Fill the first business group spend so validation passes.
    await page
      .getByLabel(/spend/i)
      .first()
      .fill('250000');

    await page.getByRole('button', { name: /save event/i }).first().click();

    // Successful submit navigates back to the console.
    await expect(page).toHaveURL(/\/(?!new-request).*/, { timeout: 10_000 });
  });
});
