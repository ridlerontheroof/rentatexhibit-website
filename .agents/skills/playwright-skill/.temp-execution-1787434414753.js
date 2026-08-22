const { chromium } = require('playwright');
const CHROME_BIN = process.env.CHROME_BIN;
const TARGETS = [
  'https://www.rentatexhibit.com/__csp-act-ev-1787426902',
  'https://www.rentatexhibit.com/',
  'https://www.rentatexhibit.com/?utm_knock=a',
];
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME_BIN });
  const results = [];
  for (const target of TARGETS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const events = [];
    page.on('console', msg => events.push({ kind: 'console', type: msg.type(), text: msg.text() }));
    page.on('pageerror', error => events.push({ kind: 'pageerror', text: String(error) }));
    page.on('requestfailed', request => events.push({ kind: 'requestfailed', url: request.url(), failure: request.failure()?.errorText ?? '' }));
    const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    results.push({
      target,
      finalUrl: page.url(),
      status: response?.status(),
      title: await page.title(),
      cspEvents: events.filter(event => /content security policy|violat(?:e|ion)|csp-act-ev|\.invalid\/client\.js/i.test(event.text ?? event.url ?? '')),
      consoleErrors: events.filter(event => event.kind === 'console' && event.type === 'error'),
    });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
