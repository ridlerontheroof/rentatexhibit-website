const { chromium } = require('playwright');
const playwrightBrowsers = require('child_process');
(async () => {
  // find nix chromium
  const { execSync } = require('child_process');
  let exe;
  try { exe = execSync("ls -d ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome 2>/dev/null | head -1").toString().trim(); } catch {}
  const browser = await chromium.launch({ headless: true, executablePath: '/nix/store/71577rskzyhch3axhdqx7faygc2xyn4v-playwright-browsers-1.55.0-with-cjk/chromium-1187/chrome-linux/chrome' });
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await page.goto('https://search.google.com/test/rich-results?url=' + encodeURIComponent('https://www.rentatexhibit.com/floor-plans'), { waitUntil: 'domcontentloaded', timeout: 60000 });
  // wait up to 120s for results
  const deadline = Date.now() + 150000;
  let text = '';
  while (Date.now() < deadline) {
    await page.waitForTimeout(5000);
    text = await page.evaluate(() => document.body.innerText);
    if (/FAQ/i.test(text) && /(valid|detected|item)/i.test(text)) break;
    if (/can'?t (be )?test|not available|sign in|unusual traffic|captcha/i.test(text)) break;
  }
  await page.screenshot({ path: '/tmp/rrt.png', fullPage: false });
  console.log('---PAGE TEXT START---');
  console.log(text.slice(0, 3000));
  console.log('---PAGE TEXT END---');
  await browser.close();
})();