import Dexie, { type EntityTable } from 'dexie';
import type { ActiveWorkout, AppSettings, Exercise, WorkoutPlan, WorkoutSession } from '../models/types';

export class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  plans!: EntityTable<WorkoutPlan, 'id'>;
  sessions!: EntityTable<WorkoutSession, 'id'>;
  active!: EntityTable<ActiveWorkout, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  constructor(name = 'lian-shenme-v1') {
    super(name);
    this.version(1).stores({ exercises: 'id, category', plans: 'id, createdAt', sessions: 'id, endedAt', active: 'id', settings: 'id' });
  }
}
export const db = new WorkoutDB();
