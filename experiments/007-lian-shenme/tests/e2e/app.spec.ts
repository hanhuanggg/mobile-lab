import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const path = '/experiments/007-lian-shenme/';
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: '底部导航' }).getByRole('button', { name, exact: true });
const start = (page: Page) => page.getByRole('button', { name: '开始训练', exact: true }).click();
async function end(page: Page) { await page.getByRole('button', { name: '结束训练', exact: true }).click(); await page.getByRole('button', { name: '保存并结束', exact: true }).click(); await expect(page.getByRole('heading', { name: '练完了，做得好。' })).toBeVisible(); }
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', e => messages.push(e.message));
  page.on('console', e => { if (e.type() === 'error') messages.push(e.text()); });
  await page.goto(path); await expect(page.getByRole('heading', { name: '今天，练什么？' })).toBeVisible();
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('real workout, rapid decimal editing, rest, refresh recovery, summary, rotation, history and inherited results', async ({ page }) => {
  await expect(page.locator('.rotation-day')).toHaveCount(3);
  await start(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const weight = page.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true });
  await weight.fill(''); await weight.pressSequentially('62.5'); await expect(weight).toHaveValue('62.5');
  await page.getByRole('textbox', { name: '杠铃卧推第1组次数', exact: true }).fill('8');
  await page.getByRole('button', { name: '完成杠铃卧推第1组', exact: true }).click();
  await expect(page.getByLabel('组间休息')).toBeVisible(); await page.getByRole('button', { name: '跳过', exact: true }).click();
  await page.getByRole('textbox', { name: '杠铃卧推第2组重量', exact: true }).fill('60');
  await page.getByRole('textbox', { name: '杠铃卧推第2组次数', exact: true }).fill('7');
  await page.getByRole('button', { name: '完成杠铃卧推第2组', exact: true }).click(); await page.getByRole('button', { name: '跳过', exact: true }).click();
  await page.getByRole('textbox', { name: '杠铃卧推第3组重量', exact: true }).fill('999');
  await page.locator('.workout-card').first().getByRole('button', { name: '添加一组' }).click();
  await expect(page.getByRole('textbox', { name: '杠铃卧推第5组重量', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '删除杠铃卧推第5组', exact: true }).click();
  await expect(page.locator('.save-status')).toHaveText('本地已就绪');
  await page.reload(); await expect(page.locator('.resume-card')).toContainText('2 组已完成');
  await page.locator('.resume-card').click(); await expect(weight).toHaveValue('62.5');
  await expect(page.getByRole('button', { name: '取消完成杠铃卧推第1组', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await end(page); await expect(page.locator('.session-stats')).toContainText('920'); await expect(page.locator('.session-set')).toHaveCount(2);
  await page.getByRole('button', { name: '完成，返回首页' }).click(); await expect(page.locator('.rotation-day.selected')).toContainText('背部训练');
  await nav(page, '历史').click(); await page.locator('.history-card').click(); await expect(page.locator('.session-stats')).toContainText('920');
  await page.getByRole('button', { name: '返回训练历史' }).click(); await nav(page, '今日').click();
  await page.locator('.rotation-day').filter({ hasText: '胸部训练' }).click(); await start(page);
  await expect(weight).toHaveValue('62.5'); await expect(page.getByRole('textbox', { name: '杠铃卧推第2组次数', exact: true })).toHaveValue('7');
  await expect(page.getByRole('button', { name: '完成杠铃卧推第1组', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('close and reopen page restores an unfinished workout and exposes all safe exit choices', async ({ page, context }) => {
  await start(page); await page.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true }).fill('42.5');
  await expect(page.locator('.save-status')).toHaveText('本地已就绪'); await page.close();
  const reopened = await context.newPage(); await reopened.goto(path); await reopened.locator('.resume-card').click();
  await expect(reopened.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true })).toHaveValue('42.5');
  await nav(reopened, '历史').click();
  for (const label of ['继续训练', '保存并结束', '放弃本次训练']) await expect(reopened.getByRole('dialog').getByRole('button', { name: label, exact: true })).toBeVisible();
  await reopened.getByRole('button', { name: '继续训练', exact: true }).click();
  await reopened.getByRole('button', { name: '结束训练', exact: true }).click();
  await reopened.getByRole('button', { name: '放弃本次训练', exact: true }).click(); await reopened.getByRole('button', { name: '确认放弃', exact: true }).click();
  await expect(reopened.getByRole('heading', { name: '今天，练什么？' })).toBeVisible();
  await reopened.reload(); await expect(reopened.locator('.resume-card')).toHaveCount(0);
});

test('create, search library, custom exercise, reorder, edit targets, persist and delete a plan', async ({ page }) => {
  await nav(page, '计划').click(); await page.getByRole('button', { name: '创建训练计划', exact: true }).first().click();
  await page.getByPlaceholder('例如：上肢力量').fill('我的全身'); await page.getByRole('button', { name: '添加动作', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索动作' }).fill('卧推'); await page.getByRole('button', { name: '杠铃卧推 胸部' }).click();
  await page.getByRole('textbox', { name: '1号动作目标组数' }).fill('2'); await page.getByRole('textbox', { name: '1号动作目标重量' }).fill('25.5');
  await page.getByRole('button', { name: '添加动作', exact: true }).click(); await page.getByRole('button', { name: '自定义动作', exact: true }).click();
  await page.getByPlaceholder('输入动作名称').fill('我的划船'); await page.getByRole('combobox').selectOption('背'); await page.getByRole('button', { name: '创建并添加' }).click();
  await page.getByRole('button', { name: '上移动作2' }).click(); await expect(page.locator('.edit-exercise').first()).toContainText('我的划船');
  await page.getByRole('button', { name: '保存计划', exact: true }).click(); await expect(page.locator('.plan-list-card')).toHaveCount(4);
  await page.reload(); await nav(page, '计划').click(); await page.locator('.plan-list-card').filter({ hasText: '我的全身' }).click();
  await expect(page.getByRole('textbox', { name: '2号动作目标重量' })).toHaveValue('25.5');
  await page.getByPlaceholder('例如：上肢力量').fill('全身训练修改'); await page.getByRole('button', { name: '保存计划', exact: true }).click();
  await page.locator('.plan-list-card').filter({ hasText: '全身训练修改' }).click(); await page.getByRole('button', { name: '删除训练计划', exact: true }).click();
  await page.getByRole('button', { name: '删除计划', exact: true }).click(); await expect(page.locator('.plan-list-card')).toHaveCount(3);
});

test('JSON export, validation, backup warning, import restoration and history delete confirmation', async ({ page }) => {
  await start(page); await page.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true }).fill('50');
  await page.getByRole('button', { name: '完成杠铃卧推第1组', exact: true }).click(); await end(page);
  await page.getByRole('button', { name: '完成，返回首页' }).click(); await page.getByRole('button', { name: '数据与设置', exact: true }).click();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: /导出全部数据/ }).click(); const download = await downloadPromise;
  const file = await download.path(); const content = await readFile(file!, 'utf8'); const backup = JSON.parse(content) as { sessions: unknown[] };
  expect(backup.sessions).toHaveLength(1);
  await page.getByRole('button', { name: '关闭弹窗' }).click(); await nav(page, '历史').click(); await page.locator('.history-card').click();
  await page.getByRole('button', { name: '删除训练记录' }).click(); await page.getByRole('button', { name: '取消', exact: true }).click(); await expect(page.locator('.session-set')).toHaveCount(1);
  await page.getByRole('button', { name: '删除训练记录' }).click(); await page.getByRole('button', { name: '删除记录', exact: true }).click(); await expect(page.locator('.history-card')).toHaveCount(0);
  await page.getByRole('button', { name: '数据与设置', exact: true }).click();
  const input = page.getByLabel('选择备份 JSON');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
  await expect(page.getByRole('alert')).toContainText('备份格式');
  await input.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(content) });
  await expect(page.getByRole('dialog')).toContainText('请先导出现有数据作为备份'); await page.getByRole('button', { name: '已备份，覆盖并导入', exact: true }).click();
  await expect(page.locator('.history-card')).toHaveCount(1); await page.reload(); await nav(page, '历史').click(); await expect(page.locator('.history-card')).toHaveCount(1);
});

test('mobile and desktop layouts, touch targets, scoped PWA and offline reload', async ({ page, context }) => {
  for (const width of [320, 360, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const smallButtons = await page.locator('button:visible').evaluateAll(elements => elements.filter(e => { const r = e.getBoundingClientRect(); return r.width < 43 || r.height < 43; }).map(e => e.textContent));
    expect(smallButtons).toEqual([]);
  }
  await page.setViewportSize({ width: 360, height: 800 }); await start(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true }).fill('22.5'); await expect(page.locator('.save-status')).toHaveText('本地已就绪');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const manifest = await page.request.get(`${path}manifest.webmanifest`); expect(manifest.status()).toBe(200); expect((await manifest.json() as { scope: string }).scope).toBe('./');
  await context.setOffline(true); await page.reload(); await expect(page.locator('.resume-card')).toBeVisible(); await page.locator('.resume-card').click();
  await expect(page.getByRole('textbox', { name: '杠铃卧推第1组重量', exact: true })).toHaveValue('22.5');
  await page.getByRole('button', { name: '完成杠铃卧推第1组', exact: true }).click(); await end(page);
  await expect(page.locator('.session-stats')).toContainText('180'); await context.setOffline(false);
});

test('empty-session error stays visible inside dialog, settings work and safe cancellation retains progress', async ({ page }) => {
  await page.getByRole('button', { name: '数据与设置', exact: true }).click();
  await page.getByRole('combobox', { name: '组间休息时长' }).selectOption('60');
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await start(page); await page.getByRole('button', { name: '结束训练', exact: true }).click();
  await page.getByRole('button', { name: '保存并结束', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('还没有完成的组');
  await page.getByRole('button', { name: '继续训练', exact: true }).click();
  await page.getByRole('button', { name: '完成杠铃卧推第1组', exact: true }).click();
  await expect(page.getByLabel('组间休息')).toContainText('01:00');
  await page.getByRole('button', { name: '结束训练', exact: true }).click();
  await page.getByRole('button', { name: '放弃本次训练', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '继续训练', exact: true }).click();
  await expect(page.getByRole('button', { name: '取消完成杠铃卧推第1组', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
