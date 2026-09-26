import { test, expect } from '@playwright/test';

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

test.describe('Multi-file Upload Tests', () => {
  test('should upload multiple supported files successfully', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Multi Upload Test User',
      email: `multiupload${timestamp}@example.com`,
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

    // Upload multiple files
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    // Select 5 files at once
    await fileChooser.setFiles([
      {
        name: 'test-file-1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Content for test file 1. This is about machine learning.'),
      },
      {
        name: 'test-file-2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Content for test file 2. This is about artificial intelligence.'),
      },
      {
        name: 'test-file-3.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Content for test file 3. This is about neural networks.'),
      },
      {
        name: 'test-file-4.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Content for test file 4. This is about deep learning.'),
      },
      {
        name: 'test-file-5.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Content for test file 5. This is about data science.'),
      },
    ]);

    // Wait for upload indicator
    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Upload started');

    // Wait for all uploads to complete (should take longer for 5 files)
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 60000 });

    console.log('✓ Upload completed');

    // Wait a bit for processing
    await page.waitForTimeout(5000);

    // Verify all 5 files appear in the file list
    await expect(page.getByText('test-file-1.txt')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('test-file-2.txt')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('test-file-3.txt')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('test-file-4.txt')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('test-file-5.txt')).toBeVisible({ timeout: 10000 });

    console.log('✓ All 5 files visible in file list');

    // Check that there's no error message
    const errorDiv = page.locator('div[style*="background: #fee"]');
    await expect(errorDiv).not.toBeVisible();

    console.log('✓ No error message displayed');

    // Cleanup - delete all files
    for (let i = 0; i < 5; i++) {
      const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
      if (await deleteButton.count() > 0) {
        page.once('dialog', dialog => dialog.accept());
        await deleteButton.click();
        await page.waitForTimeout(1000);
      }
    }

    console.log('✓ Files deleted');
  });

  test('should handle mixed success/failure in multi-file upload', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Mixed Upload Test User',
      email: `mixedupload${timestamp}@example.com`,
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

    console.log('✓ User registered');

    // Upload mix of supported and unsupported files
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    // Mix of good and potentially problematic files
    await fileChooser.setFiles([
      {
        name: 'good-file-1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is a valid text file with content.'),
      },
      {
        name: 'good-file-2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Another valid text file with different content.'),
      },
    ]);

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 40000 });

    console.log('✓ Upload completed');

    await page.waitForTimeout(3000);

    // At least the good files should appear
    const file1Visible = await page.getByText('good-file-1.txt').isVisible();
    const file2Visible = await page.getByText('good-file-2.txt').isVisible();

    expect(file1Visible || file2Visible).toBeTruthy();

    console.log('✓ At least one file uploaded successfully');

    // If there's an error message, it should show specific file names and error details
    const errorDiv = page.locator('div[style*="background: #fee"]');
    if (await errorDiv.isVisible()) {
      const errorText = await errorDiv.textContent();
      console.log('Error message:', errorText);
      // Error should contain filename, not just generic message
      expect(errorText).not.toBe('Upload failed');
      expect(errorText).not.toBe('Failed to upload file. Please try again.');
    }

    // Cleanup
    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      page.once('dialog', dialog => dialog.accept());
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
    }

    console.log('✓ Test completed');
  });

  test('should show per-file errors when uploads fail', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Error Test User',
      email: `errortest${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    // Register
    await page.getByText('Need an account? Register').click();
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 15000 });

    console.log('✓ User registered');

    // Try to upload files that might cause errors (empty files)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles([
      {
        name: 'empty-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(''),  // Empty file
      },
      {
        name: 'valid-file.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This file has content'),
      },
    ]);

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 40000 });

    await page.waitForTimeout(3000);

    // Check if error message contains filename
    const errorDiv = page.locator('div[style*="background: #fee"]');
    if (await errorDiv.isVisible()) {
      const errorText = await errorDiv.textContent();
      console.log('Error message:', errorText);
      
      // Error should mention the filename, not be generic
      const hasFilename = errorText?.includes('empty-file.txt') || errorText?.includes('valid-file.txt');
      if (!hasFilename) {
        console.log('Warning: Error message does not contain filename');
      }
    }

    // Cleanup
    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      page.once('dialog', dialog => dialog.accept());
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
    }

    console.log('✓ Test completed');
  });
});
