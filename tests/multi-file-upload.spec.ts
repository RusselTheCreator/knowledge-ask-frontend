import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://knowledge-ask-api-v2-fixed.onrender.com';

test.describe('Multi-file Upload Tests', () => {
  test('should support selecting and uploading multiple files', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: 'Multi Upload User',
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

    // Prepare multiple test files
    const file1Content = `# Document 1
This is the first test document.
It contains information about React.`;

    const file2Content = `# Document 2
This is the second test document.
It contains information about TypeScript.`;

    const file3Content = `# Document 3
This is the third test document.
It contains information about Vite.`;

    // Upload multiple files at once
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles([
      {
        name: 'react-doc.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(file1Content),
      },
      {
        name: 'typescript-doc.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(file2Content),
      },
      {
        name: 'vite-doc.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(file3Content),
      },
    ]);

    console.log('✓ Multiple files selected');

    // Wait for upload indicator
    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    
    // Verify progress indicator shows (may be too fast to catch specific file names)
    const hasProgressText = await page.locator('p:has-text("Uploading")').count();
    expect(hasProgressText).toBeGreaterThan(0);

    // Wait for upload to complete (may take longer for multiple files)
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 60000 });

    console.log('✓ Multiple files upload completed');

    // Verify all three files appear in the file list
    await expect(page.getByText('react-doc.txt')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('typescript-doc.txt')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('vite-doc.txt')).toBeVisible({ timeout: 30000 });

    console.log('✓ All files visible in file list');

    // Cleanup - delete files
    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    const deleteCount = await deleteButtons.count();
    
    for (let i = 0; i < Math.min(3, deleteCount); i++) {
      page.once('dialog', dialog => dialog.accept());
      await deleteButtons.first().click();
      await page.waitForTimeout(1000); // Brief wait between deletions
    }

    console.log('✓ Files cleaned up');
    console.log('\n✅ MULTI-FILE UPLOAD TEST COMPLETE');
  });

  test('should display "Multiple files supported" text in upload area', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: 'UI Check User',
      email: `uicheck${timestamp}@example.com`,
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

    // Verify multi-file support text is visible
    await expect(page.getByText(/Multiple files supported/i)).toBeVisible();

    console.log('✓ Multi-file support text is displayed');
  });
});
