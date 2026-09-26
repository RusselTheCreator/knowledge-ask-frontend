import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://knowledge-ask-api-v2-fixed.onrender.com';

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

test.describe('XLSX and Image File Tests', () => {
  test('should successfully upload XLSX file and show Ready status', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'XLSX Test User',
      email: `xlsx${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    // Register
    await page.getByText('Need an account? Register').click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    console.log('✓ User registered');

    // Upload XLSX file
    const xlsxPath = join(process.cwd(), 'uploads', 'sample-a_c202.xlsx');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles(xlsxPath);

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 20000 });

    console.log('✓ XLSX file uploaded');

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Verify file appears in file list with completed status
    await expect(page.getByText('sample-a_c202.xlsx')).toBeVisible({ timeout: 15000 });
    
    // Check for completed/ready status badge
    const completedBadge = page.locator('span').filter({ hasText: /^completed$/i });
    await expect(completedBadge).toBeVisible({ timeout: 10000 });

    console.log('✓ XLSX file shows completed status');

    // Verify chunk count is greater than 0
    const chunkText = page.locator('span').filter({ hasText: /\d+ chunks/ });
    await expect(chunkText).toBeVisible();
    const chunkContent = await chunkText.textContent();
    const chunkCount = parseInt(chunkContent?.match(/(\d+) chunks/)?.[1] || '0');
    expect(chunkCount).toBeGreaterThan(0);

    console.log(`✓ XLSX file has ${chunkCount} chunks`);

    // Cleanup
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    await expect(page.getByRole('heading', { name: 'sample-a_c202.xlsx' })).not.toBeVisible({ timeout: 10000 });

    console.log('✓ XLSX file deleted');
  });

  test('should upload PNG file and show clear error message', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'PNG Test User',
      email: `png${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    // Register
    await page.getByText('Need an account? Register').click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    console.log('✓ User registered');

    // Upload PNG file
    const pngPath = join(process.cwd(), 'uploads', 'womans-day-pamper_8ad3.png');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles(pngPath);

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 20000 });

    console.log('✓ PNG file uploaded');

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Verify file appears in file list
    await expect(page.getByText('womans-day-pamper_8ad3.png')).toBeVisible({ timeout: 15000 });
    
    // Check for failed/error status
    const failedBadge = page.locator('span').filter({ hasText: /^(failed|error)$/i });
    await expect(failedBadge).toBeVisible({ timeout: 10000 });

    console.log('✓ PNG file shows failed/error status');

    // Verify error message is displayed
    const errorMessage = page.locator('div').filter({ hasText: /OCR|not supported|image/i });
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    const errorText = await errorMessage.textContent();
    console.log(`✓ Error message displayed: ${errorText}`);

    // Verify chunk count is 0
    const chunkText = page.locator('span').filter({ hasText: /0 chunks/ });
    await expect(chunkText).toBeVisible();

    console.log('✓ PNG file has 0 chunks');

    // Cleanup
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    await expect(page.getByRole('heading', { name: 'womans-day-pamper_8ad3.png' })).not.toBeVisible({ timeout: 10000 });

    console.log('✓ PNG file deleted');
  });

  test('should upload CSV file and show Ready status', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'CSV Test User',
      email: `csv${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    // Register
    await page.getByText('Need an account? Register').click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    console.log('✓ User registered');

    // Upload CSV file
    const csvPath = join(process.cwd(), 'uploads', 'sample_bffb.csv');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles(csvPath);

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 20000 });

    console.log('✓ CSV file uploaded');

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Verify file appears in file list with completed status
    await expect(page.getByText('sample_bffb.csv')).toBeVisible({ timeout: 15000 });
    
    // Check for completed/ready status badge
    const completedBadge = page.locator('span').filter({ hasText: /^completed$/i });
    await expect(completedBadge).toBeVisible({ timeout: 10000 });

    console.log('✓ CSV file shows completed status');

    // Verify chunk count is greater than 0
    const chunkText = page.locator('span').filter({ hasText: /\d+ chunks/ });
    await expect(chunkText).toBeVisible();
    const chunkContent = await chunkText.textContent();
    const chunkCount = parseInt(chunkContent?.match(/(\d+) chunks/)?.[1] || '0');
    expect(chunkCount).toBeGreaterThan(0);

    console.log(`✓ CSV file has ${chunkCount} chunks`);

    // Cleanup
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    await expect(page.getByRole('heading', { name: 'sample_bffb.csv' })).not.toBeVisible({ timeout: 10000 });

    console.log('✓ CSV file deleted');
  });
});
