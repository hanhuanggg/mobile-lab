/* Real-time Chromium touch playthrough. Does not change the clock or game state.
   Requires Playwright; see ../README.md. Start the static server before running. */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const routeName = process.argv.includes('--flame') ? 'flame' : 'rocket';
const route = routeName === 'flame' ? [1, 0, 0, 0, 1, 0, 1, 1] : [0, 1, 1, 1, 0, 0, 0, 0];
const baseURL = process.env.GAME_URL || 'http://127.0.0.1:8000/experiments/001-zombie-run/';
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), `zombie-run-${routeName}-`));

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(() => {
      window.frameIntervals = [];
      let last;
      function sample(now) {
        if (last && !document.hidden && frameIntervals.length < 16000) frameIntervals.push(now - last);
        last = now; requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.goto(baseURL);
    // Validate compact portrait, larger portrait, and desktop fallbacks before the full run.
    for (const [width, height] of [[320, 568], [390, 844], [500, 900], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      const fits = await page.evaluate(() => {
        const button = document.getElementById('start').getBoundingClientRect();
        return document.documentElement.scrollWidth <= innerWidth && button.y >= 0 && button.bottom <= innerHeight;
      });
      assert.ok(fits, `layout overflow at ${width}×${height}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#start').tap();
    await page.locator('#pause').tap();
    const frozen = await page.evaluate(() => ZombieRun.snapshot().time);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => ZombieRun.snapshot().time), frozen, 'pause must freeze the run');
    await page.locator('#resume').tap();
    const cdp = await context.newCDPSession(page);
    let finger = false, fingerX = 195, lastSector = -1, snapshot;
    const started = Date.now();
    while (Date.now() - started < 245000) {
      snapshot = await page.evaluate(() => ZombieRun.snapshot());
      if (snapshot.state !== 'playing') break;
      let target = 210 + Math.sin(snapshot.time * .7) * 45;
      if (snapshot.gate) target = route[snapshot.choices.length] === 0 ? 100 : 320;
      else if (snapshot.danger && snapshot.danger.life > .4) target = snapshot.danger.x < 210 ? 335 : 85;
      else if (snapshot.boss) target = Math.max(80, Math.min(340, snapshot.boss.x));
      const delta = target - snapshot.x;
      if (Math.abs(delta) > 7) {
        if (!finger) {
          fingerX = 195;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fingerX, y: 690 }] });
          finger = true;
        }
        fingerX = Math.max(30, Math.min(360, fingerX + delta / 420 * 390 / 1.15));
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: fingerX, y: 690 }] });
        if (fingerX <= 30 || fingerX >= 360) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); finger = false;
        }
      }
      if (snapshot.choices.length !== lastSector) {
        lastSector = snapshot.choices.length;
        console.log(`sector ${lastSector}: ${snapshot.weapon} ATK ${snapshot.atk}, HP ${Math.ceil(snapshot.hp)}`);
        await page.screenshot({ path: path.join(artifacts, `sector-${lastSector}.png`) });
      }
      await page.waitForTimeout(140);
    }
    assert.equal(snapshot.state, 'victory', 'must actually defeat the boss');
    assert.equal(snapshot.boss.hp, 0);
    assert.equal(snapshot.choices.length, 8);
    assert.equal(snapshot.level, 9);
    assert.ok(snapshot.time >= 120 && snapshot.time <= 240, 'run should take 2–4 minutes');
    assert.ok(snapshot.kills > 400);
    assert.ok(snapshot.coins >= 500);
    await page.screenshot({ path: path.join(artifacts, 'victory.png') });
    for (const [width, height] of [[320, 568], [500, 900]]) {
      await page.setViewportSize({ width, height });
      assert.ok(await page.evaluate(() => {
        const r = document.getElementById('restart').getBoundingClientRect();
        const receipt = document.querySelector('.receipt');
        return r.y >= 0 && r.bottom <= innerHeight && receipt.scrollWidth <= receipt.clientWidth;
      }), 'result screen must fit');
    }
    const timing = await page.evaluate(() => {
      const samples = [...frameIntervals].sort((a, b) => a - b);
      return { frames: samples.length, p95ms: samples[Math.floor(samples.length * .95)], slowFrames: samples.filter(t => t > 25).length };
    });
    await page.locator('#restart').tap();
    const fresh = await page.evaluate(() => ZombieRun.snapshot());
    assert.equal(fresh.state, 'playing'); assert.equal(fresh.level, 1); assert.equal(fresh.coins, 0); assert.equal(fresh.hp, 100);
    assert.deepEqual(errors, [], 'no console errors, JS exceptions or failed resources');
    const report = { route: routeName, snapshot, timing, errors, restart: 'passed' };
    fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2)); console.log(`PASS · artifacts: ${artifacts}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
