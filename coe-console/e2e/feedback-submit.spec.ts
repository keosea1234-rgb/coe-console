import { expect, test } from '@playwright/test';

// Feedback submission is exercised through the standalone /feedback/:eventId
// route triggered by an emailed survey link. E2E_FEEDBACK_TOKEN is retained for
// seeded test projects that model signed survey links.
//
// Skipped unless the test project has at least one feedback-requested event
// AND the test harness exposes its id via E2E_FEEDBACK_EVENT_ID + token.

test.describe('feedback submit', () => {
  const eventId = process.env.E2E_FEEDBACK_EVENT_ID;
  const token = process.env.E2E_FEEDBACK_TOKEN;
  test.skip(!eventId || !token, 'E2E_FEEDBACK_EVENT_ID / E2E_FEEDBACK_TOKEN not set');

  test('buyer can submit NPS feedback', async ({ page }) => {
    await page.goto(`/feedback/${encodeURIComponent(eventId)}?token=${encodeURIComponent(token)}`);
    await page.getByLabel(/tool/i).first().fill('9');
    await page.getByLabel(/support/i).first().fill('10');
    await page.getByLabel(/comment/i).fill('Smooth process.');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByRole('status')).toBeVisible();
  });
});
