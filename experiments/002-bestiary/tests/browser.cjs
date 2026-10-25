'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(project, 'content.js'), 'utf8'), sandbox);
const book = sandbox.window.BESTIARY;
const fields = ['name', 'plate', 'appearance', 'anatomy', 'ecology', 'power', 'fear', 'evolution', 'weakness', 'record', 'source', 'role'];
assert.equal(book.beasts.length, 14);
assert.equal(new Set(book.beasts.map(b => b.id)).size, 14);
for (let tier = 1; tier <= 7; tier++) assert.equal(book.beasts.filter(b => b.tier === tier).length, 2);
for (const beast of book.beasts) {
  for (const field of fields) assert.ok(beast[field]?.trim(), `${beast.name} missing ${field}`);
  assert.ok(fs.statSync(path.join(project, beast.image)).size > 10000, 'real plate must exist');
  assert.ok(fs.readFileSync(path.join(project, 'BOOK.md'), 'utf8').includes(beast.power), 'text edition must match canonical content');
}
const base = process.env.BOOK_URL || 'http://127.0.0.1:8000/experiments/002-bestiary/';
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'bestiary-check-'));
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
 try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
  const page = await context.newPage();
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (!r.url().startsWith(new URL(base).origin) && !r.url().startsWith('data:')) external.push(r.url()); });
  await page.goto(base);
  await page.locator('.cover-beast').evaluate(img => img.decode());
  await page.screenshot({ path: path.join(artifacts, 'cover-390.png') });
  for (const [width, height] of [[320, 568], [390, 844], [500, 900], [1280, 900]]) {
   await page.setViewportSize({ width, height });
   await page.goto(base);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `cover overflow at ${width}`);
   for (const beast of book.beasts) {
    await page.goto(base + '#' + beast.id);
    await page.waitForFunction(name => document.querySelector('#reader-title')?.textContent === name, beast.name);
    assert.equal(await page.locator('.entry-section').count(), 9);
    assert.ok(await page.locator('.plate img').evaluate(async img => { await img.decode(); return img.naturalWidth >= 1000; }));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `entry overflow at ${width}: ${beast.name}`);
    if (width === 390 && ['fulijing', 'heyin'].includes(beast.id)) await page.screenshot({ path: path.join(artifacts, `${beast.id}-390.png`) });
   }
   console.log(`PASS ${width}×${height}: all 14 complete illustrated entries`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '#fulijing');
  await page.locator('.entry-index summary').click();
  await page.locator('.entry-index a[href="#fulijing~weakness"]').click();
  assert.equal(new URL(page.url()).hash, '#fulijing~weakness');
  assert.ok(await page.locator('#weakness').evaluate(e => Math.abs(e.getBoundingClientRect().top) < 90));
  await page.locator('.page-turner a').last().click();
  await page.waitForFunction(() => document.querySelector('#reader-title').textContent === '缝骨虻');
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('#reader-title').textContent === '伏砾獍');
  await page.locator('#share').click();
  await page.waitForFunction(() => document.querySelector('#share-dialog').open);
  assert.ok((await page.locator('#share-url').inputValue()).endsWith('#fulijing'));
  await page.locator('#share-dialog button').click();
  await page.locator('.reader-tools a').click();
  await page.locator('#search').fill('伤谱');
  assert.equal(await page.locator('.specimen-link').count(), 1);
  assert.equal(await page.locator('.specimen-name').textContent(), '缀伤蚕');
  await page.locator('#search').fill('');
  await page.locator('#tier-filter').selectOption('7');
  assert.equal(await page.locator('.specimen-link').count(), 2);
  await page.locator('#search').fill('不存在的名字xyz');
  assert.ok(await page.locator('#empty').isVisible());
  await page.locator('#search').fill('');
  await page.locator('#tier-filter').selectOption('0');
  await page.goto(base + '#heyin');
  await page.goto(base);
  assert.ok((await page.locator('#continue-reading').getAttribute('href')).endsWith('#heyin'));
  // Storage denial must not block static reading.
  const denied = await browser.newContext();
  await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
  const q = await denied.newPage(); q.on('pageerror', e => errors.push(e.message));
  await q.goto(base + '#shihuiming');
  assert.equal(await q.locator('#reader-title').textContent(), '食讳螟');
  await denied.close();
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ entries: 14, tiers: 7, widths: [320, 390, 500, 1280], errors, external, navigation: 'passed', search: 'passed', storageDenied: 'passed' }, null, 2));
  console.log(`PASS links, sections, search, tier filter, share, history, resume, blocked storage; zero errors and zero external requests. Artifacts: ${artifacts}`);
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
