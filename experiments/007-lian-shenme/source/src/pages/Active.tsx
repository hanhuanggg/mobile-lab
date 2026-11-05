import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, CircleCheck, Clock3, Plus, Timer, Trash2 } from 'lucide-react';
import type { ActiveWorkout, AppSettings, PerformedSet } from '../models/types';
import { duration, formatNumber, stats, uid } from '../logic/workout';
import { saveActive } from '../storage/service';
import { NumericInput } from '../components/ui';

export function Active({ workout, settings, onExit, onError, onSaved }: { workout: ActiveWorkout; settings: AppSettings; onExit: () => void; onError: (e: unknown) => void; onSaved: (saving: boolean) => void }) {
  const [draft, setDraft] = useState(workout);
  const current = useRef(workout);
  const [now, setNow] = useState(Date.now());
  const [saveFailed, setSaveFailed] = useState(false);
  const saveVersion = useRef(0);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  function update(next: ActiveWorkout) {
    const snapshot = { ...next, updatedAt: Date.now() };
    current.current = snapshot;
    setDraft(snapshot);
    onSaved(true);
    const version = ++saveVersion.current;
    void saveActive(snapshot).then(() => { if (version === saveVersion.current) { setSaveFailed(false); onSaved(false); } }).catch(e => { setSaveFailed(true); onSaved(false); onError(e); });
  }
  function changeSet(exerciseId: string, setId: string, patch: Partial<PerformedSet>) {
    update({ ...current.current, exercises: current.current.exercises.map(e => e.id !== exerciseId ? e : { ...e, sets: e.sets.map(s => s.id !== setId ? s : { ...s, ...patch }) }) });
  }
  function toggle(exerciseId: string, set: PerformedSet) {
    if (!set.completed && set.reps < 1) { onError(new Error('请先填写实际完成次数（至少 1 次）。')); return; }
    const timestamp = Date.now();
    setNow(timestamp);
    const next = { ...current.current, restEndsAt: !set.completed && settings.restSeconds ? timestamp + settings.restSeconds * 1000 : null,
      exercises: current.current.exercises.map(e => e.id !== exerciseId ? e : { ...e, sets: e.sets.map(s => s.id !== set.id ? s : { ...s, completed: !s.completed }) }) };
    update(next);
    if (!set.completed && navigator.vibrate) navigator.vibrate(20);
  }
  const progress = stats(draft);
  const rest = Math.max(0, Math.ceil(((draft.restEndsAt ?? 0) - now) / 1000));
  return <div className="page active-page">
    <div className="workout-top"><button className="icon-button back-button" onClick={onExit} aria-label="退出当前训练"><ArrowLeft size={21} /></button><span className="overline"><span className="live-dot" /> 训练进行中</span><button className="finish-button" onClick={onExit}>结束训练</button></div>
    <header className="active-heading"><h1>{draft.name}</h1><span><Clock3 size={17} /><b>{duration(draft.startedAt, now)}</b></span></header>
    <div className="progress-info"><span>已完成 <b>{progress.completed}</b><span className="muted"> / {progress.total} 组</span></span><span className="muted">{formatNumber(progress.volume)} kg <span className="small">训练容量</span></span></div>
    <div className="progress-track"><div style={{ width: `${progress.total ? progress.completed / progress.total * 100 : 0}%` }} /></div>
    <div className="training-tip"><CircleCheck size={15} />勾选一组，记录一次进步。重量与次数可直接修改。</div>
    {saveFailed && <button className="button danger" onClick={() => update(current.current)}>保存失败，点击重试</button>}
    <div className="workout-exercises">{draft.exercises.map((exercise, ei) => <section className="workout-card" key={exercise.id}>
      <div className="exercise-card-title"><span className="exercise-number">{String(ei + 1).padStart(2, '0')}</span><div><h2>{exercise.name}</h2><p>{exercise.previous.length ? `上次 ${exercise.previous.map(s => `${s.weight} kg × ${s.reps}`).join(' / ')}` : '首次训练 · 已填入计划目标'}</p></div><span className={`exercise-counter ${exercise.sets.every(s => s.completed) ? 'complete' : ''}`}>{exercise.sets.filter(s => s.completed).length}/{exercise.sets.length}</span></div>
      <div className="set-table"><div className="set-row table-label"><span>组</span><span>重量 <small>kg</small></span><span>次数</span><span>完成</span><span /></div>
        {exercise.sets.map((set, si) => <div className={`set-row ${set.completed ? 'set-done' : ''}`} key={set.id}>
          <span className="set-index">{si + 1}</span>
          <NumericInput value={set.weight} label={`${exercise.name}第${si + 1}组重量`} onChange={weight => changeSet(exercise.id, set.id, { weight })} />
          <NumericInput value={set.reps} integer max={999} label={`${exercise.name}第${si + 1}组次数`} onChange={reps => changeSet(exercise.id, set.id, { reps, ...(reps < 1 ? { completed: false } : {}) })} />
          <button className="check-set" aria-label={`${set.completed ? '取消完成' : '完成'}${exercise.name}第${si + 1}组`} aria-pressed={set.completed} onClick={() => toggle(exercise.id, set)}><Check size={20} /></button>
          <button className="delete-set icon-button" aria-label={`删除${exercise.name}第${si + 1}组`} disabled={exercise.sets.length <= 1} onClick={() => update({ ...current.current, exercises: current.current.exercises.map(e => e.id !== exercise.id ? e : { ...e, sets: e.sets.filter(s => s.id !== set.id) }) })}><Trash2 size={15} /></button>
        </div>)}
      </div>
      <button className="add-set" disabled={exercise.sets.length >= 30} onClick={() => update({ ...current.current, exercises: current.current.exercises.map(e => e.id !== exercise.id ? e : { ...e, sets: [...e.sets, { ...e.sets.at(-1)!, id: uid(), completed: false }] }) })}><Plus size={16} /> 添加一组</button>
    </section>)}</div>
    <button className="button primary" onClick={onExit}>完成本次训练 <ChevronRight size={20} /></button>
    {draft.restEndsAt !== null && <aside className="rest-timer" aria-label="组间休息"><span className="rest-icon"><Timer size={22} /></span><span><small>{rest > 0 ? '组间休息' : '休息结束，准备下一组'}</small><b aria-live="off">{Math.floor(rest / 60).toString().padStart(2, '0')}:{(rest % 60).toString().padStart(2, '0')}</b></span><button onClick={() => update({ ...current.current, restEndsAt: null })}>{rest > 0 ? '跳过' : '继续'}<ChevronRight size={16} /></button></aside>}
  </div>;
}
