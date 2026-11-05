import { categories, type Backup } from '../models/types';

const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 80): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const number = (v: unknown, min = 0, max = 2_000): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min = 0, max = 999) => number(v, min, max) && Number.isInteger(v);
const date = (v: unknown) => number(v, 1, 8_640_000_000_000_000);
const category = (v: unknown) => categories.some(c => c === v);
function array(v: unknown, check: (item: unknown) => boolean, max = 10000): v is unknown[] {
  return Array.isArray(v) && v.length <= max && v.every(check);
}
function unique(v: unknown[]) {
  const ids = v.map(e => record(e) ? e.id : undefined);
  return ids.every(id => text(id, 100)) && new Set(ids).size === ids.length;
}
function sets(v: unknown, completedOnly = false) {
  return array(v, s => record(s) && text(s.id, 100) && number(s.weight) && integer(s.reps, 0) && typeof s.completed === 'boolean'
    && (!s.completed || (s.reps as number) > 0) && (!completedOnly || s.completed), 1000) && unique(v);
}
function sessionExercises(v: unknown, completedOnly = false) {
  return array(v, e => record(e) && text(e.id, 100) && text(e.exerciseId, 100) && text(e.name, 60) && category(e.category)
    && sets(e.sets, completedOnly) && array(e.previous, p => record(p) && number(p.weight) && integer(p.reps, 1), 1000), 100) && unique(v);
}
export function parseBackup(raw: string): Backup {
  if (raw.length > 20 * 1024 * 1024) throw new Error('备份文件不能超过 20 MB。');
  let v: unknown;
  try { v = JSON.parse(raw); } catch { throw new Error('无法解析 JSON，请选择有效的备份文件。'); }
  const fail = () => { throw new Error('备份格式不正确：请导入「练什么」v1 导出的完整 JSON 文件。'); };
  if (!record(v) || v.format !== 'lian-shenme' || v.version !== 1 || !date(v.exportedAt)) return fail();
  if (!array(v.exercises, e => record(e) && text(e.id, 100) && text(e.name, 60) && category(e.category)) || !unique(v.exercises)) return fail();
  const exerciseIds = new Set(v.exercises.map(e => (e as Record<string, unknown>).id));
  if (!array(v.plans, p => record(p) && text(p.id, 100) && text(p.name, 40) && date(p.createdAt) && array(p.exercises,
    e => record(e) && text(e.id, 100) && exerciseIds.has(e.exerciseId) && integer(e.sets, 1, 30) && integer(e.reps, 1) && number(e.weight), 100) && unique(p.exercises), 100) || !unique(v.plans)) return fail();
  if (!array(v.sessions, s => record(s) && text(s.id, 100) && text(s.planId, 100) && text(s.name, 40) && date(s.startedAt) && date(s.endedAt)
    && (s.endedAt as number) >= (s.startedAt as number) && sessionExercises(s.exercises, true) && (s.exercises as unknown[]).length > 0) || !unique(v.sessions)) return fail();
  if (v.active !== null) {
    const a = v.active;
    if (!record(a) || a.id !== 'current' || !text(a.sessionId, 100) || !text(a.planId, 100) || !text(a.name, 40) || !date(a.startedAt)
      || !date(a.updatedAt) || !(a.restEndsAt === null || date(a.restEndsAt)) || !sessionExercises(a.exercises) || !(a.exercises as unknown[]).length
      || v.sessions.some(s => record(s) && s.id === a.sessionId)) return fail();
  }
  const s = v.settings;
  if (!record(s) || s.id !== 'app' || s.initialized !== true || ![0, 60, 90, 120].includes(s.restSeconds as number)
    || !(s.nextPlanId === null || v.plans.some(p => record(p) && p.id === s.nextPlanId))) return fail();
  return v as unknown as Backup;
}
export function downloadBackup(backup: Backup) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `练什么-备份-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
