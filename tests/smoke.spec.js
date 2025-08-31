import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SITE_URL = 'http://localhost:3000'; // Assuming local server for testing

test.describe('ResizedImage.com Smoke Tests', () => {
  test.beforeAll(async () => {
    // Create artifacts directory if it doesn't exist
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const artifactsDir = path.join(__dirname, '../artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir);
    }
  });

  test('should navigate to home and verify navigation links', async ({ page }) => {
    await page.goto(SITE_URL);
    await expect(page).toHaveTitle(/ResizedImage/);

    // Verify top navigation links
    await expect(page.getByRole('link', { name: 'Image Resizer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'PDF Tools' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'BG Remover' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go Pro' })).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: `./artifacts/smoke-${Date.now()}-home.png` });
  });

  test('should open editor modal on single image upload and verify controls', async ({ page }) => {
    await page.goto(SITE_URL);

    // Click single upload button
    await page.getByRole('button', { name: 'Select Image' }).click();

    // Upload a test image
    const fileInput = page.locator('#single-file-input');
    await fileInput.setInputFiles('test_image.png');

    // Verify editor modal is visible
    const editorModal = page.locator('#editor-modal');
    await expect(editorModal).toBeVisible();

    // Verify resize controls
    await expect(editorModal.getByRole('button', { name: 'By Size' })).toBeVisible();
    await expect(editorModal.getByRole('button', { name: 'As %' })).toBeVisible();
    await expect(editorModal.getByRole('button', { name: 'Social' })).toBeVisible();
    await expect(editorModal.locator('#width')).toBeVisible();
    await expect(editorModal.locator('#height')).toBeVisible();
    await expect(editorModal.locator('#lock-aspect')).toBeVisible();

    // Verify crop button
    await expect(editorModal.getByRole('button', { name: 'Crop Image' })).toBeVisible();

    // Verify export settings
    await expect(editorModal.getByText('Export Settings')).toBeVisible();
    await expect(editorModal.locator('#format')).toBeVisible();
    await expect(editorModal.locator('#target-size')).toBeVisible();
    await expect(editorModal.locator('#target-size-unit')).toBeVisible();
    await expect(editorModal.getByRole('button', { name: 'Export Image' })).toBeVisible();

    // Take screenshot
    await editorModal.screenshot({ path: `./artifacts/smoke-${Date.now()}-editor-modal.png` });

    // Close editor modal
    await editorModal.getByRole('button', { name: 'Close Editor' }).click();
    await expect(editorModal).toBeHidden();
  });

  test('should show error for batch upload for non-pro users', async ({ page }) => {
    await page.goto(SITE_URL);

    // Click batch upload button
    const batchUploadBtn = page.getByRole('button', { name: 'Select Multiple Images' });
    await batchUploadBtn.click();

    // Verify error toast is visible
    const errorToast = page.locator('#error-toast');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Unlock Pro to enable batch uploads!');

    // Take screenshot
    await page.screenshot({ path: `./artifacts/smoke-${Date.now()}-batch-error.png` });
  });

  test('should navigate to PDF Tools page (placeholder)', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.getByRole('link', { name: 'PDF Tools' }).click();
    await expect(page).toHaveURL(/.*\/pdf/);
    // Add assertions for PDF Tools page content once implemented
    await page.screenshot({ path: `./artifacts/smoke-${Date.now()}-pdf-tools.png` });
  });

  test('should navigate to BG Remover page (placeholder)', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.getByRole('link', { name: 'BG Remover' }).click();
    await expect(page).toHaveURL(/.*\/bg-remover/);
    // Add assertions for BG Remover page content once implemented
    await page.screenshot({ path: `./artifacts/smoke-${Date.now()}-bg-remover.png` });
  });
});