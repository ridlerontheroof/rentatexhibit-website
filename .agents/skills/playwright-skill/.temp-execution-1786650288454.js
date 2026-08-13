const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/nix/store/0n9rl5l9syy808xi9bk4f6dhnfrvhkww-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome' });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const seen = [];
  page.on('request', (req) => {
    const u = req.url();
    if (!u.includes('/g/collect')) return;
    const lines = (req.postData() || '').split('\n').filter(Boolean);
    const base = new URL(u).searchParams.get('en');
    for (const l of (lines.length ? lines : (base ? ['en='+base] : []))) {
      const p = new URLSearchParams(l); const en = p.get('en');
      if (en) { seen.push(en); console.log('  [collect]', en, p.get('ep.unit_number')||'', p.get('ep.floor_plan')||'', p.get('ep.matched')||''); }
    }
  });
  await page.goto('https://www.rentatexhibit.com/available-units', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);
  const facade = page.locator('[data-embed-url]').first();
  await facade.scrollIntoViewIfNeeded();
  const b = facade.locator('button').first(); try { await b.click({ timeout: 10000 }); } catch { await facade.click({ timeout: 10000 }); }
  await page.waitForSelector('iframe[src*="sightmap"]', { timeout: 30000 });
  await page.waitForTimeout(12000);
  const frame = page.frames().find(f => f.url().includes('sightmap'));
  await frame.locator('text=/^1 APT$/').first().click({ timeout: 15000 });
  console.log('floor with 1 APT selected');
  await page.waitForTimeout(6000);
  // Click the highlighted unit (0208 on floor 2) — coordinates from prior screenshot, scaled 1024->1440
  const s = 1440/1024;
  const pts = [[778,455],[790,455],[765,450],[793,505],[787,550]].map(([x,y]) => [x*s, y*s]);
  for (const [x,y] of pts) {
    await page.mouse.click(x, y);
    console.log('  clicked', Math.round(x), Math.round(y));
    await page.waitForTimeout(3000);
    if (seen.includes('sightmap_unit_selected')) break;
  }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/tmp/sightmap-unit.png' });
  console.log('RESULT unit_selected:', seen.filter(e=>e==='sightmap_unit_selected').length, 'apply_click:', seen.filter(e=>e==='sightmap_apply_click').length);
  console.log('all:', JSON.stringify(seen));
  await browser.close();
})();
