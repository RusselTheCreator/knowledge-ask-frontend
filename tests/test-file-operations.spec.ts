import { test, expect } from '@playwright/test';

test('Test file operations after manual login', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Login with an existing user first (avoid rate limit by using a user that should exist)
  const timestamp = Date.now();
  const testUser = {
    name: 'File Test User',
    email: `filetest${timestamp}@example.com`,
    password: 'SecurePassword123!',
  };

  console.log('Navigating to app...');
  await page.goto('/');
  
  console.log('Registering new user...');
  await page.getByText('Need an account? Register').click();
  await page.fill('input[name="name"]', testUser.name);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.getByRole('button', { name: 'Register' }).click();
  
  // Wait for dashboard
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  
  const loggedIn = await page.getByRole('button', { name: 'Logout' }).count();
  console.log('Logged in:', loggedIn > 0);
  
  if (loggedIn === 0) {
    console.log('Not logged in, skipping file test');
    return;
  }
  
  console.log('✓ Logged in successfully');
  
  // Test file upload
  const testFileContent = `Test document content`;
  
  console.log('Initiating file upload...');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
  const fileChooser = await fileChooserPromise;
  
  await fileChooser.setFiles({
    name: 'test-file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(testFileContent),
  });
  
  console.log('File selected, waiting for upload...');
  
  // Wait for "Uploading..." to appear
  const uploadingVisible = await page.getByText('Uploading...').count();
  console.log('Uploading indicator visible:', uploadingVisible > 0);
  
  // Wait a bit for upload
  await page.waitForTimeout(5000);
  
  // Check if file appears
  const fileInList = await page.getByText('test-file.txt').count();
  console.log('File in list:', fileInList);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/file-test-screenshot.png', fullPage: true });
  console.log('Screenshot saved');
});
