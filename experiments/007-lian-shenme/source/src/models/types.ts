export const categories = ['胸', '背', '腿', '肩', '手臂', '核心'] as const;
export type Category = (typeof categories)[number];

export interface Exercise { id: string; name: string; category: Category }
export interface PlannedExercise {
  id: string; exerciseId: string; sets: number; reps: number; weight: number;
}
export interface WorkoutPlan {
  id: string; name: string; exercises: PlannedExercise[]; createdAt: number;
}
export interface PerformedSet {
  id: string; weight: number; reps: number; completed: boolean;
}
export interface SessionExercise {
  id: string; exerciseId: string; name: string; category: Category;
  previous: { weight: number; reps: number }[];
  sets: PerformedSet[];
}
export interface ActiveWorkout {
  id: 'current'; sessionId: string; planId: string; name: string;
  startedAt: number; updatedAt: number; restEndsAt: number | null;
  exercises: SessionExercise[];
}
export interface WorkoutSession {
  id: string; planId: string; name: string; startedAt: number; endedAt: number;
  exercises: SessionExercise[];
}
export interface AppSettings {
  id: 'app'; initialized: boolean; nextPlanId: string | null; restSeconds: number;
}
export interface Backup {
  format: 'lian-shenme'; version: 1; exportedAt: number;
  exercises: Exercise[]; plans: WorkoutPlan[]; sessions: WorkoutSession[];
  active: ActiveWorkout | null; settings: AppSettings;
}
