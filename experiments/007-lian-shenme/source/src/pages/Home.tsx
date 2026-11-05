import { ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, Dumbbell, Layers3, Play, ShieldCheck } from 'lucide-react';
import type { ActiveWorkout, Exercise, WorkoutPlan, WorkoutSession } from '../models/types';
import { duration, formatDate, formatNumber, stats } from '../logic/workout';
import { Empty } from '../components/ui';

interface Props {
  plans: WorkoutPlan[]; exercises: Exercise[]; selectedId: string | null; latest?: WorkoutSession;
  active?: ActiveWorkout; onSelect: (id: string) => void; onStart: (id: string) => void;
  onPlans: () => void; onSession: (s: WorkoutSession) => void;
}
export function Home({ plans, exercises, selectedId, latest, active, onSelect, onStart, onPlans, onSession }: Props) {
  const plan = plans.find(p => p.id === selectedId) ?? plans[0];
  const index = plans.findIndex(p => p.id === plan?.id);
  const date = formatDate(Date.now());
  return <div className="page home-page">
    <header className="page-heading"><div><p className="eyebrow">{date}</p><h1>今天，练什么<span className="accent">？</span></h1><p className="subtitle">按自己的节奏，完成今天的训练。</p></div><span className="heading-symbol"><Dumbbell size={27} /></span></header>
    {active && <button className="resume-card" onClick={() => onStart(active.planId)}><span className="live-dot" /><span><strong>{active.name}正在进行</strong><small>{stats(active).completed} 组已完成 · 记录已保留</small></span><span className="resume-link">继续 <ArrowRight size={17} /></span></button>}
    {!plan ? <Empty icon={<Layers3 size={34} />} title="从一份计划开始">为自己安排几个喜欢的动作。<button className="button primary" onClick={onPlans}>创建训练计划 <ArrowRight size={18} /></button></Empty> : <>
      <div className="section-line"><h2>训练日轮换 <span className="tag">自由安排</span></h2><button className="text-button" onClick={onPlans}>管理计划 <ChevronRight size={15} /></button></div>
      <div className="rotation" aria-label="切换训练计划">{plans.map((p, i) => <button key={p.id} onClick={() => onSelect(p.id)} className={`rotation-day ${p.id === plan.id ? 'selected' : ''}`} aria-pressed={p.id === plan.id}><span>{String.fromCharCode(65 + i % 26)}</span><strong>{p.name}</strong>{p.id === plan.id && <Check size={16} />}</button>)}</div>
      <div className="home-grid"><section className="today-card">
        <div className="today-top"><span className="overline"><span className="live-dot" /> 今日训练</span><span className="card-index">DAY {String(index + 1).padStart(2, '0')}</span></div>
        <div className="hero-heading"><h2>{plan.name}</h2><span className="hero-letter" aria-hidden="true">{String.fromCharCode(65 + index % 26)}</span></div>
        <p className="hero-caption">准备好了，就从第一组开始。</p>
        <div className="hero-stats"><span><Dumbbell size={17} /><b>{plan.exercises.length}</b> 个动作</span><i /><span><Layers3 size={17} /><b>{plan.exercises.reduce((n, e) => n + e.sets, 0)}</b> 组训练</span></div>
        <div className="hero-rule" />
        <div className="hero-foot"><span>专注当下<br /><small>每一组，都算数。</small></span><span className="rep-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span></div>
        <button className="button primary start-button" onClick={() => onStart(plan.id)}><Play size={19} fill="currentColor" />{active ? '继续训练' : '开始训练'}<ArrowRight size={21} /></button>
        <span className="save-hint"><ShieldCheck size={13} /> 自动保存到本机，放心专注训练</span>
      </section>
      <section className="preview-card"><div className="section-line"><h2>动作预览</h2><span className="muted small">{String(plan.exercises.length).padStart(2, '0')} EXERCISES</span></div>
        {!plan.exercises.length && <p className="muted">计划还没有动作。前往「我的计划」添加。</p>}
        <div className="exercise-preview">{plan.exercises.map((p, i) => <div className="preview-row" key={p.id}><span className="exercise-number">{String(i + 1).padStart(2, '0')}</span><span className="preview-name"><strong>{exercises.find(e => e.id === p.exerciseId)?.name ?? '未知动作'}</strong><small>{exercises.find(e => e.id === p.exerciseId)?.category}部 · {p.weight ? `${p.weight} kg` : '按实际重量记录'}</small></span><span className="prescription"><b>{p.sets}</b><span> × </span><b>{p.reps}</b></span></div>)}</div>
        <p className="plan-note">示例计划可自由修改，请按自身情况调整。</p>
      </section></div>
    </>}
    <section className="recent-section"><div className="section-line"><h2>上一次，也算数</h2><span className="overline muted">LAST SESSION</span></div>
      {latest ? <button className="recent-card" onClick={() => onSession(latest)}><span className="recent-icon"><Check size={22} /></span><span className="recent-name"><strong>{latest.name}</strong><small>{formatDate(latest.endedAt)} · {stats(latest).completed} 组完成</small></span><span className="recent-volume"><b>{formatNumber(stats(latest).volume)} <small>kg</small></b><small><Clock3 size={12} />{duration(latest.startedAt, latest.endedAt)}</small></span><ArrowUpRight size={20} /></button>
        : <div className="recent-empty"><span className="recent-icon"><Clock3 size={21} /></span><div><strong>你的第一条记录，留给今天。</strong><p>完成训练后，会自动出现在这里。</p></div></div>}
    </section>
    <p className="home-footer"><span className="tiny-dot" /> 无需账号 · 数据只属于你</p>
  </div>;
}
