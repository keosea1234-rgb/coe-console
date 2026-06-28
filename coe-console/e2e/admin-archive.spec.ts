import { expect, test } from '@playwright/test';
import { E2E_ADMIN, hasE2ECreds, signIn } from './helpers';

test.describe('admin archive', () => {
  test.skip(!hasE2ECreds(E2E_ADMIN), 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set');

  test('admin can archive a request from the inbox', async ({ page }) => {
    await signIn(page, E2E_ADMIN);
    // The admin inbox lives on the main console. Find the first Archive button.
    const archiveButton = page.getByRole('button', { name: /^archive$/i }).first();
    const hasArchivable = await archiveButton.isVisible().catch(() => false);
    test.skip(!hasArchivable, 'No archivable requests in inbox for this test project');

    await archiveButton.click();
    // After archive the row leaves the Active filter; we just assert that the
    // button is no longer the same instance (was removed from the DOM).
    await expect(archiveButton).toHaveCount(0);
  });
});
