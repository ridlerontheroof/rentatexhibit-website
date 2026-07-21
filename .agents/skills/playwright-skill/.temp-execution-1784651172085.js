const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const apiCalls = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (/api-gateway\.realync\.com/.test(u)) {
      apiCalls.push(`${res.status()} ${res.request().method()} ${u}`);
    }
  });

  try {
    await page.goto('https://realync.com/dashboard', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);
    console.log('URL after load:', page.url());
    console.log('--- inputs on page ---');
    const inputs = await page.locator('input').all();
    for (const inp of inputs) {
      const t = await inp.getAttribute('type');
      const n = await inp.getAttribute('name');
      const p = await inp.getAttribute('placeholder');
      const id = await inp.getAttribute('id');
      console.log(`input type=${t} name=${n} id=${id} placeholder=${p}`);
    }
    await page.screenshot({ path: '/tmp/realync-1.png', fullPage: true });
    console.log('screenshot saved /tmp/realync-1.png');
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    console.log('--- api calls ---');
    console.log(apiCalls.join('\n'));
    await browser.close();
  }
})();
