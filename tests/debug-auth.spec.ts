import { test, expect } from '@playwright/test';

test('Debug: Register and auto-login flow', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const timestamp = Date.now();
  const testUser = {
    name: 'Debug User',
    email: `debug${timestamp}@example.com`,
    password: 'SecurePassword123!',
  };

  console.log('Navigating to staging...');
  await page.goto('/');
  
  console.log('Clicking register...');
  await page.getByText('Need an account? Register').click();
  await page.waitForTimeout(1000);
  
  console.log('Filling form...');
  await page.fill('input[name="name"]', testUser.name);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  
  console.log('Submitting registration...');
  await page.getByRole('button', { name: 'Register' }).click();
  
  // Wait and check what happens
  await page.waitForTimeout(5000);
  
  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check if we see error message
  const errorVisible = await page.locator('text=/error|Error|failed|Failed/i').count();
  console.log('Error messages found:', errorVisible);
  
  if (errorVisible > 0) {
    const errorText = await page.locator('text=/error|Error|failed|Failed/i').first().textContent();
    console.log('Error text:', errorText);
  }
  
  // Check if logged in
  const logoutButton = await page.getByRole('button', { name: 'Logout' }).count();
  console.log('Logout button found:', logoutButton);
  
  const userName = await page.getByText(testUser.name).count();
  console.log('User name found:', userName);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved to test-results/debug-screenshot.png');
});
