import type { ActiveWorkout, Backup, WorkoutPlan } from '../models/types';
import { createWorkout, finishSnapshot, stats } from '../logic/workout';
import { db } from './db';

let pendingSave: Promise<void> = Promise.resolve();
export function saveActive(active: ActiveWorkout): Promise<void> {
  const snapshot = structuredClone(active);
  const operation = pendingSave.catch(() => undefined).then(() => db.transaction('rw', db.active, async () => {
    const current = await db.active.get('current');
    if (current?.sessionId === snapshot.sessionId) await db.active.put(snapshot);
  }));
  pendingSave = operation;
  return operation;
}
export async function flushSaves() { await pendingSave; }
export async function startWorkout(planId: string) {
  return db.transaction('rw', db.active, db.plans, db.sessions, db.exercises, async () => {
    const current = await db.active.get('current');
    if (current) return current;
    const plan = await db.plans.get(planId);
    if (!plan?.exercises.length) throw new Error('请先为计划添加动作。');
    const active = createWorkout(plan, await db.exercises.toArray(), await db.sessions.toArray());
    await db.active.put(active);
    return active;
  });
}
export async function finishWorkout() {
  await flushSaves();
  return db.transaction('rw', db.active, db.sessions, db.settings, db.plans, async () => {
    const active = await db.active.get('current');
    if (!active) throw new Error('没有进行中的训练。');
    if (!stats(active).completed) throw new Error('还没有完成的组。请继续训练，或放弃本次训练。');
    const session = finishSnapshot(active);
    await db.sessions.put(session);
    await db.active.delete('current');
    const plans = await db.plans.orderBy('createdAt').toArray();
    const next = plans[(plans.findIndex(p => p.id === active.planId) + 1) % plans.length];
    await db.settings.update('app', { nextPlanId: next?.id ?? null });
    return session;
  });
}
export async function discardWorkout() { await pendingSave.catch(() => undefined); await db.active.delete('current'); }
export async function savePlan(plan: WorkoutPlan) {
  if (!plan.name.trim() || plan.name.length > 40) throw new Error('计划名称需为 1–40 个字。');
  if (plan.exercises.some(e => !Number.isInteger(e.sets) || e.sets < 1 || e.sets > 30 || !Number.isInteger(e.reps) || e.reps < 1 || e.reps > 999 || !Number.isFinite(e.weight) || e.weight < 0 || e.weight > 2000)) throw new Error('请检查目标：组数 1–30，次数 1–999，重量 0–2000 kg。');
  await db.transaction('rw', db.plans, db.settings, async () => {
    await db.plans.put({ ...plan, name: plan.name.trim() });
    const settings = await db.settings.get('app');
    if (!settings?.nextPlanId) await db.settings.update('app', { nextPlanId: plan.id });
  });
}
export async function deletePlan(id: string) {
  await db.transaction('rw', db.plans, db.settings, async () => {
    await db.plans.delete(id);
    if ((await db.settings.get('app'))?.nextPlanId === id) await db.settings.update('app', { nextPlanId: (await db.plans.orderBy('createdAt').first())?.id ?? null });
  });
}
export async function exportBackup(): Promise<Backup> {
  await flushSaves();
  return db.transaction('r', db.tables, async () => ({ format: 'lian-shenme', version: 1, exportedAt: Date.now(),
    exercises: await db.exercises.toArray(), plans: await db.plans.toArray(), sessions: await db.sessions.toArray(),
    active: await db.active.get('current') ?? null, settings: (await db.settings.get('app'))! }));
}
export async function importBackup(backup: Backup) {
  await flushSaves();
  await db.transaction('rw', db.tables, async () => {
    if (await db.active.get('current')) throw new Error('请先结束或放弃当前训练，再导入数据。');
    for (const table of db.tables) await table.clear();
    await db.exercises.bulkPut(backup.exercises);
    await db.plans.bulkPut(backup.plans);
    await db.sessions.bulkPut(backup.sessions);
    if (backup.active) await db.active.put(backup.active);
    await db.settings.put(backup.settings);
  });
}
