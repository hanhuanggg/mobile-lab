import type { Category, Exercise, WorkoutPlan } from '../models/types';
import { uid } from '../logic/workout';
import { db } from './db';

const library: [Category, string[]][] = [
  ['胸', ['杠铃卧推', '上斜哑铃卧推', '坐姿推胸', '绳索夹胸', '俯卧撑', '哑铃飞鸟']],
  ['背', ['高位下拉', '坐姿划船', '单臂哑铃划船', '直臂下压', '引体向上', '杠铃划船']],
  ['腿', ['杠铃深蹲', '腿举', '腿屈伸', '腿弯举', '提踵', '罗马尼亚硬拉', '保加利亚分腿蹲']],
  ['肩', ['哑铃推举', '哑铃侧平举', '绳索面拉', '反向飞鸟']],
  ['手臂', ['绳索下压', '哑铃弯举', '锤式弯举', '仰卧臂屈伸']],
  ['核心', ['卷腹', '悬垂举腿', '绳索卷腹', '仰卧举腿']]
];
export async function initialize() {
  await db.transaction('rw', db.exercises, db.plans, db.settings, async () => {
    if ((await db.settings.get('app'))?.initialized) return;
    const exercises: Exercise[] = library.flatMap(([category, names]) => names.map(name => ({ id: uid(), name, category })));
    const specs: [string, string[], number[], number[]][] = [
      ['胸部训练', ['杠铃卧推', '上斜哑铃卧推', '坐姿推胸', '绳索夹胸', '绳索下压'], [4, 3, 3, 3, 3], [8, 10, 12, 12, 12]],
      ['背部训练', ['高位下拉', '坐姿划船', '单臂哑铃划船', '直臂下压', '哑铃弯举'], [4, 3, 3, 3, 3], [10, 12, 10, 12, 12]],
      ['腿部训练', ['杠铃深蹲', '腿举', '腿屈伸', '腿弯举', '提踵'], [4, 3, 3, 3, 4], [8, 12, 12, 12, 15]]
    ];
    const plans: WorkoutPlan[] = specs.map(([name, names, sets, reps], i) => ({ id: uid(), name, createdAt: Date.now() + i,
      exercises: names.map((n, j) => ({ id: uid(), exerciseId: exercises.find(e => e.name === n)!.id, sets: sets[j], reps: reps[j], weight: 0 })) }));
    await db.exercises.bulkPut(exercises);
    await db.plans.bulkPut(plans);
    await db.settings.put({ id: 'app', initialized: true, nextPlanId: plans[0].id, restSeconds: 90 });
  });
}
