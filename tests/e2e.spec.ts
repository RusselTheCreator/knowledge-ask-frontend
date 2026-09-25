import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://knowledge-ask-api.onrender.com';

async function checkApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

test.describe('Knowledge Ask E2E Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Knowledge Ask' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('should toggle between login and register', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByText('Need an account? Register').click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
    
    await page.getByText('Have an account? Login').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('should show validation for empty login form', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.click();
    
    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
  });

  test('should complete full user journey: register → upload → ask → download', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      test.skip(true, 'API not available');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    await page.getByText('Need an account? Register').click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    const testFileContent = `# Test Document

This is a test document for E2E testing.

## Important Information

The answer to the test question is: Playwright is testing this application.

## More Content

This document contains valuable information for RAG-based question answering.
`;

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Click to upload').click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent),
    });

    await expect(page.getByText('Uploading...')).toBeVisible();
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2000);

    await expect(page.getByText('test-document.txt')).toBeVisible({ timeout: 10000 });

    const questionText = 'What is testing this application?';
    await page.fill('textarea[placeholder*="Ask a question"]', questionText);
    await page.getByRole('button', { name: 'Ask Question' }).click();

    await expect(page.getByText('Getting Answer...')).toBeVisible();
    await expect(page.getByText('Getting Answer...')).not.toBeVisible({ timeout: 30000 });

    await expect(page.getByText(questionText)).toBeVisible({ timeout: 5000 });
    
    const answerSection = page.locator('text=A:').first();
    await expect(answerSection).toBeVisible();

    const downloadButton = page.getByRole('button', { name: 'Download' }).first();
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('test-document.txt');

    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    await expect(page.getByText('test-document.txt')).not.toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      test.skip(true, 'API not available');
    }

    await page.goto('/');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 10000 });
  });

  test('should handle file upload errors gracefully', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      test.skip(true, 'API not available');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Upload Test User',
      email: `upload${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');
    await page.getByText('Need an account? Register').click();
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 10000 });

    const hugeContent = 'x'.repeat(15 * 1024 * 1024);
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Click to upload').click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'huge-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(hugeContent),
    });

    await expect(page.locator('text=/Upload failed|File size exceeds/')).toBeVisible({ timeout: 15000 });
  });
});
