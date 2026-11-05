import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronRight, Dumbbell, Layers3, Plus, Search, Trash2 } from 'lucide-react';
import { categories, type Category, type Exercise, type WorkoutPlan } from '../models/types';
import { uid } from '../logic/workout';
import { Confirm, Empty, Modal, NumericInput } from '../components/ui';
import { deletePlan, savePlan } from '../storage/service';
import { db } from '../storage/db';

interface Props { plans: WorkoutPlan[]; exercises: Exercise[]; notify: (message: string) => void; onError: (e: unknown) => void }
export function Plans({ plans, exercises, notify, onError }: Props) {
  const [draft, setDraft] = useState<WorkoutPlan | null>(null);
  const [pick, setPick] = useState(false);
  const [remove, setRemove] = useState<WorkoutPlan | null>(null);
  const [leave, setLeave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  function edit(plan?: WorkoutPlan) { setDraft(plan ? structuredClone(plan) : { id: uid(), name: '', exercises: [], createdAt: Date.now() }); setChanged(false); }
  function update(next: WorkoutPlan) { setDraft(next); setChanged(true); }
  async function save() {
    if (!draft) return;
    setBusy(true);
    try { await savePlan(draft); setDraft(null); notify('训练计划已保存'); } catch (e) { onError(e); } finally { setBusy(false); }
  }
  function move(index: number, step: number) {
    if (!draft) return;
    const next = [...draft.exercises];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    update({ ...draft, exercises: next });
  }
  return <div className="page plans-page">
    {!draft ? <><header className="page-heading"><div><p className="eyebrow">YOUR OWN ROUTINE</p><h1>我的计划<span className="accent">.</span></h1><p className="subtitle">训练日依次轮换，不被星期几限制。</p></div><button className="icon-button outlined" onClick={() => edit()} aria-label="创建训练计划"><Plus size={23} /></button></header>
      <div className="plan-list">{plans.map((plan, i) => <button className="plan-list-card" key={plan.id} onClick={() => edit(plan)}><span className="plan-letter">{String.fromCharCode(65 + i % 26)}</span><span><strong>{plan.name}</strong><small>{plan.exercises.length} 个动作 · {plan.exercises.reduce((n, e) => n + e.sets, 0)} 组训练</small></span><ChevronRight size={20} /></button>)}</div>
      {!plans.length && <Empty icon={<Layers3 size={32} />} title="还没有训练计划">创建自己的第一份训练安排。</Empty>}
      <button className="button secondary dashed" onClick={() => edit()}><Plus size={19} />创建训练计划</button>
      <div className="quiet-note"><Dumbbell size={18} /><p>计划是起点，身体的反馈更重要。<br /><span>示例仅用于展示，可按个人情况自由调整。</span></p></div>
    </> : <>
      <div className="editor-heading"><button className="icon-button" aria-label="返回我的计划" onClick={() => changed ? setLeave(true) : setDraft(null)}><ArrowLeft size={21} /></button><h1>编辑训练计划</h1><button className="text-button accent" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存'}</button></div>
      <label className="field-label">计划名称<input className="text-input plan-name-input" placeholder="例如：上肢力量" maxLength={40} value={draft.name} onChange={e => update({ ...draft, name: e.target.value })} /></label>
      <div className="section-line"><h2>训练动作 <span className="tag">{draft.exercises.length}</span></h2><span className="muted small">按顺序训练</span></div>
      <div className="editor-exercises">{draft.exercises.map((p, i) => <section className="edit-exercise" key={p.id}><div className="edit-exercise-title"><span className="exercise-number">{String(i + 1).padStart(2, '0')}</span><h2>{exercises.find(e => e.id === p.exerciseId)?.name}</h2><button className="icon-button" disabled={i === 0} aria-label={`上移动作${i + 1}`} onClick={() => move(i, -1)}><ArrowUp size={17} /></button><button className="icon-button" disabled={i === draft.exercises.length - 1} aria-label={`下移动作${i + 1}`} onClick={() => move(i, 1)}><ArrowDown size={17} /></button><button className="icon-button" aria-label={`删除动作${i + 1}`} onClick={() => update({ ...draft, exercises: draft.exercises.filter(e => e.id !== p.id) })}><Trash2 size={17} /></button></div>
        <div className="target-inputs">{(['sets', 'reps', 'weight'] as const).map(key => <label key={key}><span>{key === 'sets' ? '组数' : key === 'reps' ? '次数 / 组' : '重量 / kg'}</span><NumericInput label={`${i + 1}号动作${key === 'sets' ? '目标组数' : key === 'reps' ? '目标次数' : '目标重量'}`} value={p[key]} integer={key !== 'weight'} max={key === 'weight' ? 2000 : key === 'sets' ? 30 : 999} onChange={value => update({ ...draft, exercises: draft.exercises.map(e => e.id === p.id ? { ...e, [key]: value } : e) })} /></label>)}</div>
      </section>)}</div>
      <button className="button secondary dashed" disabled={draft.exercises.length >= 100} onClick={() => setPick(true)}><Plus size={19} />添加动作</button>
      <button className="button primary" disabled={busy} onClick={() => void save()}>保存计划 <ArrowRight size={18} /></button>
      {plans.some(p => p.id === draft.id) && <button className="button danger-quiet" onClick={() => setRemove(draft)}><Trash2 size={17} />删除训练计划</button>}
    </>}
    {pick && draft && <ExercisePicker exercises={exercises} onClose={() => setPick(false)} onError={onError} onPick={exercise => { update({ ...draft, exercises: [...draft.exercises, { id: uid(), exerciseId: exercise.id, sets: 3, reps: 10, weight: 0 }] }); setPick(false); }} />}
    {leave && <Confirm title="离开编辑？" description="当前修改尚未保存。" confirmLabel="放弃修改" danger onClose={() => setLeave(false)} onConfirm={() => { setLeave(false); setDraft(null); }} />}
    {remove && <Confirm title={`删除「${remove.name}」？`} description="已保存的训练历史和进行中的训练仍会保留。" confirmLabel="删除计划" danger onClose={() => setRemove(null)} onConfirm={() => { void deletePlan(remove.id).then(() => { setRemove(null); setDraft(null); notify('计划已删除'); }).catch(onError); }} />}
  </div>;
}
function ExercisePicker({ exercises, onPick, onClose, onError }: { exercises: Exercise[]; onPick: (e: Exercise) => void; onClose: () => void; onError: (e: unknown) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('胸');
  const [busy, setBusy] = useState(false);
  const filtered = exercises.filter(e => (category === '全部' || e.category === category) && e.name.includes(query.trim()));
  async function create() {
    if (!name.trim()) { onError(new Error('请输入自定义动作名称。')); return; }
    setBusy(true);
    try {
      const existing = exercises.find(e => e.name === name.trim() && e.category === customCategory);
      const exercise = existing ?? { id: uid(), name: name.trim(), category: customCategory };
      if (!existing) await db.exercises.put(exercise);
      onPick(exercise);
    } catch (e) { onError(e); } finally { setBusy(false); }
  }
  return <Modal title="添加训练动作" onClose={onClose} wide>
    {!custom ? <><label className="search-field"><Search size={18} /><input aria-label="搜索动作" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索动作名称" /></label><div className="category-tabs">{(['全部', ...categories] as const).map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="library-list">{filtered.map(e => <button key={e.id} onClick={() => onPick(e)}><span className="library-icon"><Dumbbell size={19} /></span><span>{e.name}<small>{e.category}部</small></span><Plus size={19} /></button>)}{!filtered.length && <p className="muted">没有找到这个动作，可以在下方自定义。</p>}</div><button className="button secondary" onClick={() => { setName(query); setCustom(true); }}><Plus size={18} />自定义动作</button></>
    : <><label className="field-label">动作名称<input className="text-input" maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="输入动作名称" /></label><label className="field-label">肌群分类<select className="text-input" value={customCategory} onChange={e => setCustomCategory(e.target.value as Category)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><button className="button primary" disabled={busy} onClick={() => void create()}>创建并添加</button><button className="button secondary" onClick={() => setCustom(false)}>返回动作库</button></>}
  </Modal>;
}
