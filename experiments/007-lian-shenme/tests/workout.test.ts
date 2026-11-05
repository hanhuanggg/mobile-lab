import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, WorkoutDB } from '../source/src/storage/db';
import { initialize } from '../source/src/storage/seed';
import { discardWorkout, exportBackup, finishWorkout, importBackup, saveActive, savePlan, startWorkout } from '../source/src/storage/service';
import { createWorkout, stats, uid } from '../source/src/logic/workout';
import { parseBackup } from '../source/src/storage/backup';

beforeEach(async () => { await db.transaction('rw', db.tables, async () => { for (const t of db.tables) await t.clear(); }); await initialize(); });
describe('local workout lifecycle', () => {
  it('generates stable UUIDs on LAN HTTP previews without crypto.randomUUID', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues });
    try { const first = uid(); expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); expect(uid()).not.toBe(first); }
    finally { vi.unstubAllGlobals(); }
  });
  it('initializes only once and does not recreate deleted plans', async () => {
    await db.plans.clear(); await initialize(); expect(await db.plans.count()).toBe(0); expect(await db.exercises.count()).toBeGreaterThan(15);
  });
  it('persists every set edit and restores through a separate database connection', async () => {
    const plan = (await db.plans.toArray())[0]; const active = await startWorkout(plan.id);
    active.exercises[0].sets[0] = { ...active.exercises[0].sets[0], weight: 62.5, reps: 8, completed: true };
    active.restEndsAt = Date.now() + 90000;
    await saveActive(active);
    const reopened = new WorkoutDB();
    try { expect(await reopened.active.get('current')).toEqual(active); } finally { reopened.close(); }
  });
  it('serializes rapid edits and refuses to recreate a discarded workout', async () => {
    const a = await startWorkout((await db.plans.toArray())[0].id);
    const b = structuredClone(a); b.exercises[0].sets[0].weight = 30;
    const c = structuredClone(a); c.exercises[0].sets[0].weight = 40;
    await Promise.all([saveActive(b), saveActive(c)]);
    expect((await db.active.get('current'))?.exercises[0].sets[0].weight).toBe(40);
    await discardWorkout(); await saveActive(c); expect(await db.active.count()).toBe(0);
  });
  it('permits only one active session even with simultaneous starts', async () => {
    const plans = await db.plans.toArray(); const [a, b] = await Promise.all([startWorkout(plans[0].id), startWorkout(plans[1].id)]);
    expect(a.sessionId).toBe(b.sessionId); expect(await db.active.count()).toBe(1);
  });
  it('counts only completed sets, snapshots history, rotates and inherits actual results by stable ID', async () => {
    const plans = await db.plans.orderBy('createdAt').toArray(); const plan = plans[0];
    const a = await startWorkout(plan.id); const e = a.exercises[0];
    e.sets[0] = { ...e.sets[0], weight: 62.5, reps: 8, completed: true };
    e.sets[1] = { ...e.sets[1], weight: 60, reps: 7, completed: true };
    e.sets[2] = { ...e.sets[2], weight: 999, reps: 100, completed: false };
    await saveActive(a); const session = await finishWorkout();
    expect(stats(session)).toEqual({ completed: 2, total: 2, volume: 920 });
    expect(session.endedAt).toBeGreaterThanOrEqual(session.startedAt); expect(await db.active.count()).toBe(0);
    expect((await db.settings.get('app'))?.nextPlanId).toBe(plans[1].id);
    await savePlan({ ...plan, name: '新计划名' });
    await db.exercises.update(e.exerciseId, { name: '动作已改名' });
    expect((await db.sessions.get(session.id))?.name).toBe('胸部训练');
    expect((await db.sessions.get(session.id))?.exercises[0].name).toBe('杠铃卧推');
    const next = await startWorkout(plan.id);
    expect(next.exercises[0].sets.slice(0, 2).map(s => [s.weight, s.reps])).toEqual([[62.5, 8], [60, 7]]);
    expect(next.exercises[0].sets.every(s => !s.completed)).toBe(true);
    const library = await db.exercises.toArray();
    const elsewhere = createWorkout({ ...plan, id: 'different-plan' }, library, [session]);
    expect(elsewhere.exercises[0].sets[0].weight).toBe(62.5);
  });
  it('does not save a session with no completed sets', async () => {
    await startWorkout((await db.plans.toArray())[0].id); await expect(finishWorkout()).rejects.toThrow('还没有完成');
    expect(await db.active.count()).toBe(1); expect(await db.sessions.count()).toBe(0);
  });
  it('exports and atomically restores all data including an active workout', async () => {
    const a = await startWorkout((await db.plans.toArray())[0].id); a.exercises[0].sets[0].weight = 33.5; await saveActive(a);
    const backup = parseBackup(JSON.stringify(await exportBackup()));
    await expect(importBackup(backup)).rejects.toThrow('请先结束');
    await discardWorkout(); await db.plans.clear(); await importBackup(backup);
    expect(await db.plans.count()).toBe(3); expect((await db.active.get('current'))?.exercises[0].sets[0].weight).toBe(33.5);
  });
  it('deletes a mistaken history record persistently', async () => {
    const a = await startWorkout((await db.plans.toArray())[0].id); a.exercises[0].sets[0].completed = true; await saveActive(a);
    const s = await finishWorkout(); await db.sessions.delete(s.id); const reopened = new WorkoutDB();
    try { expect(await reopened.sessions.count()).toBe(0); } finally { reopened.close(); }
  });
});
describe('backup validation', () => {
  it('rejects invalid versions, references, duplicate IDs, invalid numbers, malformed snapshots without changing records', async () => {
    const valid = await exportBackup();
    const variants = [
      { ...valid, version: 9 },
      { ...valid, exercises: [...valid.exercises, valid.exercises[0]] },
      { ...valid, plans: [{ ...valid.plans[0], exercises: [{ ...valid.plans[0].exercises[0], exerciseId: 'missing' }] }] },
      { ...valid, plans: [{ ...valid.plans[0], exercises: [{ ...valid.plans[0].exercises[0], weight: -1 }] }] },
      { ...valid, active: { id: 'current' } },
      { ...valid, sessions: [{ id: 'incomplete-history' }] },
      { ...valid, settings: { ...valid.settings, restSeconds: 15 } }
    ];
    for (const v of variants) expect(() => parseBackup(JSON.stringify(v))).toThrow('备份格式');
    expect(() => parseBackup('{')).toThrow('无法解析');
    expect(await db.plans.count()).toBe(3);
  });
});
