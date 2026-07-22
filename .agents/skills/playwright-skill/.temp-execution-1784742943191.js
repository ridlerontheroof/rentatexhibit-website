const { chromium } = require('playwright');
const TARGET_URL = 'http://127.0.0.1:80/available-units/0807';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const btn = page.getByRole('button', { name: /floor plan/i });
  await btn.waitFor({ timeout: 15000 });
  await btn.click();
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/plan-modal.png' });
  console.log('✅ Modal opened; dialog present');
  // close via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const stillOpen = await page.locator('[role="dialog"]').count();
  console.log('Dialog count after Escape:', stillOpen);
  console.log('URL still:', page.url());
  await browser.close();
})();
