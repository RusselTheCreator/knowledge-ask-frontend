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

test.describe('Live API Contract Tests (v2-fixed)', () => {
  test('should display distinct questions with proper Q text in history', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Contract Test User',
      email: `contract${timestamp}@example.com`,
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

    // Upload test document
    const testFileContent = `# Test Document

This is about artificial intelligence and machine learning.

AI was first conceptualized in 1956 at Dartmouth.

Machine learning became popular in the 2000s.
`;

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('div').filter({ hasText: /^Click to upload or drag and drop/ }).first().click();
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'ai-test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testFileContent),
    });

    await expect(page.getByText('Uploading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uploading...')).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByText('ai-test.txt')).toBeVisible({ timeout: 15000 });

    console.log('✓ File uploaded');

    // Ask first question
    const question1 = 'When was AI first conceptualized?';
    await page.fill('textarea[placeholder*="Ask a question"]', question1);
    await page.getByRole('button', { name: 'Ask Question' }).click();

    await expect(page.getByText('Getting Answer...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Getting Answer...')).not.toBeVisible({ timeout: 45000 });

    console.log('✓ First question answered');

    // Verify first question appears in history
    await expect(page.getByText(question1)).toBeVisible({ timeout: 10000 });

    // Ask second question (DIFFERENT from first)
    const question2 = 'When did machine learning become popular?';
    await page.fill('textarea[placeholder*="Ask a question"]', question2);
    await page.getByRole('button', { name: 'Ask Question' }).click();

    await expect(page.getByText('Getting Answer...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Getting Answer...')).not.toBeVisible({ timeout: 45000 });

    console.log('✓ Second question answered');

    // CRITICAL: Both questions should be visible and DISTINCT in history
    await expect(page.getByText(question1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(question2)).toBeVisible({ timeout: 10000 });

    // Verify we have at least 2 "Q:" labels (one for each question)
    const questionLabels = await page.locator('strong:has-text("Q:")').count();
    expect(questionLabels).toBeGreaterThanOrEqual(2);

    console.log('✓ Both questions visible and distinct in history');

    // Verify sources have proper data (not NaN or empty)
    const sourceSections = page.locator('div').filter({ hasText: /^Sources:/ });
    if (await sourceSections.count() > 0) {
      // Check for match percentages - should be numbers, not NaN
      const matchTexts = await page.locator('span:has-text("match")').allTextContents();
      for (const matchText of matchTexts) {
        expect(matchText).toMatch(/\d+%\s*match/);
        expect(matchText).not.toContain('NaN');
      }

      // Check that source text is not empty
      const sourceTexts = await page.locator('div[style*="fontStyle: italic"]').allTextContents();
      for (const sourceText of sourceTexts) {
        expect(sourceText.trim()).not.toBe('');
      }

      console.log('✓ Sources have valid data (no NaN, no empty text)');
    }

    // Verify timestamps are valid (not "Invalid Date")
    const timestamps = await page.locator('p').filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|AM|PM/ }).allTextContents();
    expect(timestamps.length).toBeGreaterThanOrEqual(2);
    for (const timestamp of timestamps) {
      expect(timestamp).not.toContain('Invalid Date');
    }

    console.log('✓ Timestamps are valid');

    // Test history survives page reload
    await page.reload();
    await expect(page.getByText(question1)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(question2)).toBeVisible({ timeout: 10000 });

    console.log('✓ History survives page reload');

    // Cleanup
    const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    await expect(page.getByText('ai-test.txt')).not.toBeVisible({ timeout: 10000 });

    console.log('✓ File deleted');
    console.log('\n✅ LIVE API CONTRACT TEST COMPLETE - All assertions passed!');
  });

  test('should handle empty history gracefully', async ({ page }) => {
    const apiAvailable = await checkApiAvailable();
    if (!apiAvailable) {
      throw new Error('Live API is not available - tests must pass against Live');
    }

    const timestamp = Date.now();
    const testUser = {
      name: 'Empty History User',
      email: `empty${timestamp}@example.com`,
      password: 'TestPassword123!',
    };

    await page.goto('/');

    // Register new user (no history yet)
    await page.getByText('Need an account? Register').click();
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 15000 });

    // Should show empty history message
    await expect(page.getByText(/No questions asked yet/i)).toBeVisible({ timeout: 5000 });

    console.log('✓ Empty history displayed correctly');
  });
});
