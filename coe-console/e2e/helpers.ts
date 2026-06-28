import { expect, type Page } from '@playwright/test';

export interface E2EUser {
  email: string;
  password: string;
}

export const E2E_USER: E2EUser = {
  email: process.env.E2E_USER_EMAIL ?? '',
  password: process.env.E2E_USER_PASSWORD ?? '',
};

export const E2E_ADMIN: E2EUser = {
  email: process.env.E2E_ADMIN_EMAIL ?? '',
  password: process.env.E2E_ADMIN_PASSWORD ?? '',
};

export function hasE2ECreds(user: E2EUser): boolean {
  return !!user.email && !!user.password;
}

export async function signIn(page: Page, user: E2EUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // After login the router lands on the console. Wait for any post-login element.
  await expect(page).toHaveURL(/\/(?!login).*/, { timeout: 15_000 });
}
