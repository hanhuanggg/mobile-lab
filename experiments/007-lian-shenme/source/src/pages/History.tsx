import { ArrowLeft, ArrowUpRight, Check, Clock3, Dumbbell, History as HistoryIcon, Trash2, Trophy } from 'lucide-react';
import type { WorkoutSession } from '../models/types';
import { duration, formatDate, formatNumber, stats } from '../logic/workout';
import { Empty } from '../components/ui';

export function History({ sessions, onSelect }: { sessions: WorkoutSession[]; onSelect: (s: WorkoutSession) => void }) {
  const groups = new Map<string, WorkoutSession[]>();
  for (const session of sessions) { const key = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(session.endedAt); groups.set(key, [...groups.get(key) ?? [], session]); }
  return <div className="page history-page"><header className="page-heading"><div><p className="eyebrow">ONE SESSION AT A TIME</p><h1>训练历史<span className="accent">.</span></h1><p className="subtitle">每一次坚持，都有迹可循。</p></div><span className="history-count"><b>{sessions.length}</b><small>次训练</small></span></header>
    {!sessions.length && <Empty icon={<HistoryIcon size={34} />} title="第一条记录，正在路上">完成一场训练，你的努力会被好好记住。</Empty>}
    {[...groups].map(([month, entries]) => <section key={month} className="history-month"><div className="section-line"><h2>{month}</h2><span className="muted small">{entries.length} 次训练</span></div>{entries.map(s => <button className="history-card" onClick={() => onSelect(s)} key={s.id}><span className="history-date"><b>{new Date(s.endedAt).getDate().toString().padStart(2, '0')}</b><small>{new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(s.endedAt)}</small></span><span className="history-card-main"><strong>{s.name}</strong><small><Clock3 size={12} />{duration(s.startedAt, s.endedAt)}<span>·</span>{stats(s).completed} 组<span>·</span>{formatNumber(stats(s).volume)} kg</small></span><ArrowUpRight size={20} /></button>)}</section>)}
  </div>;
}
export function SessionDetail({ session, summary, onBack, onDelete }: { session: WorkoutSession; summary: boolean; onBack: () => void; onDelete: () => void }) {
  const result = stats(session);
  return <div className="page detail-page"><div className="detail-top"><button className="icon-button" aria-label="返回" onClick={onBack}><ArrowLeft size={21} /></button><span className="overline">{summary ? 'SESSION COMPLETE' : 'TRAINING LOG'}</span>{!summary ? <button className="icon-button" aria-label="删除训练记录" onClick={onDelete}><Trash2 size={18} /></button> : <span className="local-badge"><Check size={14} />已保存</span>}</div>
    <header className={`detail-heading ${summary ? 'summary' : ''}`}>{summary && <span className="trophy"><Trophy size={30} /></span>}<p className="eyebrow">{summary ? '今天的努力，已记下。' : formatDate(session.endedAt)}</p><h1>{summary ? '练完了，做得好。' : session.name}</h1>{summary && <p className="subtitle">{session.name} · {formatDate(session.endedAt)}</p>}</header>
    <div className="session-stats"><div><Clock3 size={17} /><b>{duration(session.startedAt, session.endedAt)}</b><small>训练时长</small></div><div><Check size={17} /><b>{result.completed}<em>组</em></b><small>实际完成</small></div><div><Dumbbell size={17} /><b>{formatNumber(result.volume)}<em>kg</em></b><small>总训练容量</small></div></div>
    <div className="section-line"><h2>本次训练</h2><span className="muted small">{session.exercises.length} 个动作</span></div>
    <div className="session-exercises">{session.exercises.map((e, i) => <section className="session-exercise" key={e.id}><div className="session-exercise-title"><span className="exercise-number">{String(i + 1).padStart(2, '0')}</span><h2>{e.name}</h2><span className="muted small">{e.sets.length} 组</span></div>{e.sets.filter(s => s.completed).map((s, j) => <div className="session-set" key={s.id}><span>第 {j + 1} 组</span><b>{s.weight} <small>kg</small><i>×</i>{s.reps} <small>次</small></b><Check size={16} /></div>)}</section>)}</div>
    <p className="detail-note">容量 = 已完成组的重量 × 次数之和；0 kg 可记录自重训练。</p>
    <button className="button primary" onClick={onBack}>{summary ? '完成，返回首页' : '返回训练历史'}<ArrowUpRight size={18} /></button>
  </div>;
}
