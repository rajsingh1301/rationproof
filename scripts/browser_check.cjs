/* Integration checks against a running local server. No external websites. */
const { chromium } = require(process.env.RATIONPROOF_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:8765';
(async () => {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', colorScheme: 'light' });
    page.setDefaultTimeout(10000);
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', request => requests.push(request.url()));
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(`${event.violatedDirective}: ${event.blockedURI}`));
    });
    await page.goto(origin);
    await page.getByText('No receipts in this record', { exact: true }).waitFor();
    assert.ok(!requests.some(url => url.includes('comparison-chart-')), 'chart must stay lazy');
    const sample = async name => {
      await page.getByRole('button', { name: 'Sample cases', exact: true }).click();
      await page.getByRole('button', { name, exact: true }).click();
      if (await page.getByRole('dialog', { name: 'Replace this record with a sample?' }).count()) {
        await page.getByRole('button', { name: 'Load sample', exact: true }).click();
      }
      await page.locator('#report').waitFor();
    };
    await sample('Load offsetting case');
    await page.getByText('Totals match. Individual receipts don’t.', { exact: true }).waitFor();
    assert.match(await page.locator('#report').innerText(), /2 receipt differences cancel to 0 kg/);
    assert.match(await page.locator('#report').innerText(), /Synthetic sample/);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#export-json').click();
    const exported = JSON.parse(fs.readFileSync(await (await downloadEvent).path(), 'utf8'));
    assert.equal(Number(exported.report.rows[0].difference_kg), 0);
    assert.equal(exported.report.rows[0].has_differences, true);
    assert.equal(exported.reviewed_inputs.demo, true);
    await page.screenshot({ path: path.join(root, 'artifacts', 'comparison.png'), fullPage: true });
    await page.getByRole('button', { name: 'Chart', exact: true }).click();
    await page.getByRole('dialog', { name: 'Recorded and received' }).waitFor();
    await page.locator('.recharts-wrapper').waitFor();
    await page.keyboard.press('Escape');
    await sample('Load balance case');
    await page.getByText('There is a balance to check', { exact: true }).waitFor();
    assert.match(await page.locator('#report').innerText(), /10 kg balance/);
    await sample('Load incomplete case');
    await page.getByText('More details needed', { exact: true }).waitFor();
    await sample('Load difference case');
    await page.getByText('A difference needs checking', { exact: true }).waitFor();
    // Editing invalidates both confirmation and a report; invalid numbers cannot submit.
    await page.locator('#received-0-0').fill('-2');
    assert.equal(await page.locator('#confirmed-0').getAttribute('aria-checked'), 'false');
    assert.equal(await page.locator('#report').count(), 0);
    await page.locator('#compare').click();
    await page.getByText('Use 0–10,000 kg with up to 3 decimal places.', { exact: true }).waitFor();
    await page.locator('#received-0-0').fill('25');
    await page.locator('#confirmed-0').check();
    await page.locator('#compare').click();
    await page.getByText('Your reviewed records agree', { exact: true }).waitFor();
    // A sample can be cancelled without destroying existing entries.
    await page.getByRole('button', { name: 'Sample cases', exact: true }).click();
    await page.getByRole('button', { name: 'Load incomplete case', exact: true }).click();
    await page.getByRole('button', { name: 'Keep my record', exact: true }).click();
    assert.equal(await page.locator('#received-0-0').inputValue(), '25');
    const clear = async () => {
      await page.getByRole('button', { name: 'Clear this record', exact: true }).click();
      await page.getByRole('button', { name: 'Clear monthly record', exact: true }).click();
      await page.getByText('No receipts in this record', { exact: true }).waitFor();
    };
    await clear();
    // Real text extraction API, not an OCR mock. Portal form must not submit the ledger.
    await page.getByRole('button', { name: 'Paste text', exact: true }).click();
    await page.getByLabel('Receipt text', { exact: true }).fill(fs.readFileSync(path.join(root, 'static', 'demo-receipt.txt'), 'utf8'));
    await page.getByRole('button', { name: 'Read receipt text', exact: true }).click();
    await page.locator('#rid-0').waitFor();
    assert.equal(await page.locator('#rid-0').inputValue(), 'DEMO-001');
    assert.equal(await page.locator('#issued-0-0').inputValue(), '25');
    assert.equal(await page.locator('#received-0-0').inputValue(), '');
    assert.equal(await page.locator('#confirmed-0').getAttribute('aria-checked'), 'false');
    assert.equal(await page.locator('#report').count(), 0);
    await page.locator('#month').fill('2026-11');
    await page.locator('#rice').fill('25');
    await page.locator('#received-0-0').fill('20');
    await page.locator('#confirmed-0').check();
    await page.locator('#month-complete').check();
    await page.locator('#compare').click();
    await page.getByText('A difference needs checking', { exact: true }).waitFor();
    await page.locator('#file').setInputFiles({ name: 'demo-receipt.txt', mimeType: 'text/plain', buffer: Buffer.from(fs.readFileSync(path.join(root, 'static', 'demo-receipt.txt'), 'utf8').trim()) });
    await page.getByText('This exact receipt is already in the monthly record.', { exact: true }).waitFor();
    assert.equal(await page.locator('.receipt-card').count(), 1);
    await page.getByRole('button', { name: 'Use dark theme', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('class'), 'dark');
    await page.screenshot({ path: path.join(root, 'artifacts', 'desktop-dark.png'), fullPage: true });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.getByRole('button', { name: 'Close navigation', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
    await page.screenshot({ path: path.join(root, 'artifacts', 'mobile.png'), fullPage: true });
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('#receipts').isVisible(), false);
    assert.equal(await page.locator('#report').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    assert.deepEqual(await page.evaluate(() => window.cspViolations), [], 'CSP blocked UI behavior');
    await page.reload();
    await page.getByText('No receipts in this record', { exact: true }).waitFor();
    assert.equal(await page.locator('.receipt-card').count(), 0);
    assert.deepEqual(errors, [], 'browser errors');
    // Optional REAL image test; never substitute text and call it working OCR.
    if (process.env.RATIONPROOF_CHECK_OCR === '1') {
      await page.locator('#file').setInputFiles(path.join(root, 'static', 'demo-receipt.png'));
      await page.locator('#rid-0').waitFor({ timeout: 65000 });
      assert.equal(await page.locator('#rid-0').inputValue(), 'DEMO-001');
      assert.equal(await page.locator('#issued-0-0').inputValue(), '25');
      console.log('Actual synthetic image OCR flow passed. This is not a real receipt accuracy evaluation.');
    }
    const restricted = await browser.newContext();
    await restricted.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Storage disabled', 'SecurityError'); }; });
    const restrictedPage = await restricted.newPage();
    await restrictedPage.goto(origin);
    await restrictedPage.getByText('No receipts in this record', { exact: true }).waitFor();
    await restricted.close();
    console.log('Browser checks passed: four real-API samples, review, validation, text extraction, duplicate upload, JSON, chart, dark mode, mobile, print, CSP, private reload, restricted storage.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
