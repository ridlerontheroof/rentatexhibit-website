const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.rentatexhibit.com/schedule-showing?unit=2407', { waitUntil: 'networkidle' });
  await page.getByLabel(/first name/i).pressSequentially('Agent', { delay: 80 });
  await page.getByLabel(/last name/i).pressSequentially('Verification Test', { delay: 80 });
  await page.getByLabel(/email/i).pressSequentially('exhibit@highlandptrs.com', { delay: 50 });
  await page.getByLabel(/phone/i).pressSequentially('3125550000', { delay: 60 });
  await page.waitForTimeout(4000);
  await page.getByRole('button', { name: /view available times/i }).first().click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/tmp/step2.png', fullPage: false });
  // scroll to slots area
  const headings = await page.locator('h1,h2,h3,legend,button').allTextContents();
  console.log('HEADINGS:', JSON.stringify(headings.slice(0, 60)));
  const body = await page.locator('main').innerText();
  console.log('MAIN TEXT START >>>');
  console.log(body.slice(0, 3000));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
