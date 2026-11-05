import type { ActiveWorkout, Exercise, SessionExercise, WorkoutPlan, WorkoutSession } from '../models/types';

export function uid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Local phone previews over a LAN IP have getRandomValues, but not randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function stats(workout: { exercises: SessionExercise[] }) {
  const sets = workout.exercises.flatMap(e => e.sets).filter(s => s.completed);
  return { completed: sets.length, total: workout.exercises.reduce((n, e) => n + e.sets.length, 0),
    volume: Math.round(sets.reduce((n, s) => n + s.weight * s.reps, 0) * 100) / 100 };
}
export function createWorkout(plan: WorkoutPlan, library: Exercise[], history: WorkoutSession[], now = Date.now()): ActiveWorkout {
  const sorted = [...history].sort((a, b) => b.endedAt - a.endedAt);
  return {
    id: 'current', sessionId: uid(), planId: plan.id, name: plan.name,
    startedAt: now, updatedAt: now, restEndsAt: null,
    exercises: plan.exercises.map(p => {
      const exercise = library.find(e => e.id === p.exerciseId);
      if (!exercise) throw new Error('计划中的动作不存在，请重新编辑计划。');
      const previous = sorted.flatMap(s => s.exercises.filter(e => e.exerciseId === p.exerciseId))
        .find(e => e.sets.some(s => s.completed))?.sets.filter(s => s.completed).map(({ weight, reps }) => ({ weight, reps })) ?? [];
      return { id: p.id, exerciseId: exercise.id, name: exercise.name, category: exercise.category, previous,
        sets: Array.from({ length: p.sets }, (_, i) => ({ id: uid(), weight: previous[i]?.weight ?? previous.at(-1)?.weight ?? p.weight,
          reps: previous[i]?.reps ?? previous.at(-1)?.reps ?? p.reps, completed: false })) };
    })
  };
}
export function finishSnapshot(active: ActiveWorkout, now = Date.now()): WorkoutSession {
  return { id: active.sessionId, planId: active.planId, name: active.name, startedAt: active.startedAt,
    endedAt: Math.max(active.startedAt, now),
    exercises: structuredClone(active.exercises).map(e => ({ ...e, sets: e.sets.filter(s => s.completed) })).filter(e => e.sets.length > 0) };
}
export function duration(start: number, end: number) {
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
export const formatNumber = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
export const formatDate = (time: number) => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(time);
