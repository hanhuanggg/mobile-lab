import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowRight, Check, Dumbbell, History as HistoryIcon, House, Layers3, LoaderCircle, Settings2, ShieldCheck, WifiOff, X } from 'lucide-react';
import type { WorkoutSession } from './models/types';
import { db } from './storage/db';
import { initialize } from './storage/seed';
import { discardWorkout, finishWorkout, startWorkout } from './storage/service';
import { stats } from './logic/workout';
import { Brand, Confirm, Empty, GalleryLink, Modal } from './components/ui';
import { DataSettings } from './components/DataSettings';
import { Home } from './pages/Home';
import { Active } from './pages/Active';
import { Plans } from './pages/Plans';
import { History, SessionDetail } from './pages/History';

type Tab = 'today' | 'workout' | 'plans' | 'history';
interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const tabs = [{ id: 'today', title: '今日训练', short: '今日', icon: House }, { id: 'workout', title: '训练记录', short: '训练', icon: Dumbbell }, { id: 'plans', title: '我的计划', short: '计划', icon: Layers3 }, { id: 'history', title: '训练历史', short: '历史', icon: HistoryIcon }] as const;
export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [fatal, setFatal] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab>('today');
  const [detail, setDetail] = useState<{ session: WorkoutSession; summary: boolean } | null>(null);
  const [deleteSession, setDeleteSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const data = useLiveQuery(async () => {
    const [plans, exercises, sessions, active, settings] = await Promise.all([db.plans.orderBy('createdAt').toArray(), db.exercises.toArray(), db.sessions.orderBy('endedAt').reverse().toArray(), db.active.get('current'), db.settings.get('app')]);
    return { plans, exercises, sessions, active, settings };
  }, []);
  function notify(text: string) { setToast({ text, error: false }); }
  function onError(error: unknown) { const text = error instanceof Error ? error.message : '操作失败，请重试。'; setToast({ text: /quota/i.test(text) ? '本机存储空间不足。请导出备份并释放空间后重试。' : text, error: true }); }
  useEffect(() => { void initialize().catch(e => setFatal(e instanceof Error ? e.message : '无法打开本地数据库')); }, []);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), toast.error ? 8000 : 3500); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab, detail?.session.id, detail?.summary]);
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const captureInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e as InstallPrompt); };
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline); window.addEventListener('beforeinstallprompt', captureInstall);
    return () => { window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline); window.removeEventListener('beforeinstallprompt', captureInstall); };
  }, []);
  useEffect(() => { const guard = (e: BeforeUnloadEvent) => { if (saving) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [saving]);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ onRegisterError: () => notify('离线缓存暂不可用，训练数据仍会保存在本机') });
  function navigate(next: Tab) {
    if (next === tab && !detail) return;
    if (data?.active && tab === 'workout' && next !== 'workout') { setPendingTab(next); setExitOpen(true); return; }
    setDetail(null); setTab(next); window.scrollTo(0, 0);
  }
  async function start(id: string) {
    if (busy) return;
    setBusy(true);
    try { await startWorkout(id); setTab('workout'); setDetail(null); window.scrollTo(0, 0); } catch (e) { onError(e); } finally { setBusy(false); }
  }
  async function finish() {
    if (busy) return;
    setBusy(true);
    try { const session = await finishWorkout(); setSaving(false); setExitOpen(false); setDetail({ session, summary: true }); setTab('today'); window.scrollTo(0, 0); notify('训练已保存，辛苦了'); } catch (e) { onError(e); } finally { setBusy(false); }
  }
  async function discard() {
    setBusy(true);
    try { await discardWorkout(); setSaving(false); setDiscardConfirm(false); setExitOpen(false); setTab(pendingTab); notify('本次训练已放弃'); } catch (e) { onError(e); } finally { setBusy(false); }
  }
  function install() { if (!installPrompt) { setSettingsOpen(false); setInstallHelp(true); return; } void installPrompt.prompt().then(() => installPrompt.userChoice).then(result => { if (result.outcome === 'accepted') notify('已添加到主屏幕'); setInstallPrompt(null); }).catch(onError); }
  if (fatal) return <main className="fatal"><Dumbbell size={40} /><h1>暂时无法读取本地数据</h1><p>{fatal}</p><p>请使用支持 IndexedDB 的浏览器，并允许本站保存数据。</p><button className="button primary" onClick={() => location.reload()}>重新打开</button></main>;
  if (!data?.settings) return <main className="loading"><Brand /><LoaderCircle className="spinner" size={24} /><p>正在准备你的训练…</p></main>;
  const { plans, exercises, sessions, active, settings } = data;
  return <div className="app-shell"><aside className="sidebar"><Brand /><p className="sidebar-caption">把专注，留给训练。</p><nav aria-label="主导航">{tabs.map(t => <button key={t.id} onClick={() => navigate(t.id)} className={tab === t.id && !detail ? 'selected' : ''}><t.icon size={21} strokeWidth={1.8} /><span>{t.title}</span>{t.id === 'workout' && active && <span className="tiny-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="local-info"><ShieldCheck size={18} /><span>本地保存<small>无需登录 · 数据归你</small></span></div><GalleryLink /></div></aside>
    <div className="workspace"><header className="app-topbar"><div className="mobile-brand"><Brand /></div><span className="desktop-breadcrumb">我的训练空间 <span>/</span> {detail ? '训练详情' : tabs.find(t => t.id === tab)?.title}</span><div className="topbar-actions"><span className="save-status">{!online ? <WifiOff size={13} /> : <span className="tiny-dot" />}{saving ? '保存中' : !online ? '离线模式' : '本地已就绪'}</span><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="数据与设置"><Settings2 size={19} /></button></div></header>
    <main id="main-content">{needRefresh && <div className="update-notice"><span>{active ? '新版本已就绪，结束训练后可更新。' : '新版本已就绪。'}</span>{!active && <button onClick={() => void updateServiceWorker(true)}>更新</button>}</div>}
      {detail ? <SessionDetail session={detail.session} summary={detail.summary} onBack={() => { setTab(detail.summary ? 'today' : 'history'); setDetail(null); window.scrollTo(0, 0); }} onDelete={() => setDeleteSession(true)} />
        : tab === 'today' ? <Home plans={plans} exercises={exercises} selectedId={settings.nextPlanId} latest={sessions[0]} active={active} onSelect={id => { void db.settings.update('app', { nextPlanId: id }).catch(onError); }} onStart={id => void start(id)} onPlans={() => navigate('plans')} onSession={session => { setDetail({ session, summary: false }); setTab('history'); window.scrollTo(0, 0); }} />
          : tab === 'workout' ? active ? <Active key={active.sessionId} workout={active} settings={settings} onExit={() => { setPendingTab('today'); setExitOpen(true); }} onError={onError} onSaved={setSaving} /> : <div className="page"><header className="page-heading"><div><p className="eyebrow">READY WHEN YOU ARE</p><h1>开始你的训练<span className="accent">.</span></h1></div></header><Empty icon={<Dumbbell size={36} />} title="现在，就从第一组开始">选择今天的训练计划，自动带入上次的重量和次数。<button className="button primary" onClick={() => navigate('today')}>查看今日训练 <ArrowRight size={18} /></button></Empty></div>
            : tab === 'plans' ? <Plans plans={plans} exercises={exercises} notify={notify} onError={onError} /> : <History sessions={sessions} onSelect={session => { setDetail({ session, summary: false }); window.scrollTo(0, 0); }} />}
      <div className="mobile-gallery"><GalleryLink /></div>
    </main></div>
    <nav className="bottom-nav" aria-label="底部导航">{tabs.map(t => <button key={t.id} className={tab === t.id && !detail ? 'selected' : ''} onClick={() => navigate(t.id)}><span><t.icon size={22} strokeWidth={1.8} />{t.id === 'workout' && active && <i />}</span><small>{t.short}</small></button>)}</nav>
    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    {settingsOpen && <DataSettings settings={settings} hasActive={!!active} onClose={() => setSettingsOpen(false)} notify={notify} onError={onError} onInstall={install} />}
    {exitOpen && active && !discardConfirm && <Modal title="结束这次训练？" onClose={() => setExitOpen(false)}><p className="modal-description">已完成 {stats(active).completed} / {stats(active).total} 组。仅保存你已勾选的组，未完成的组不计入容量。</p><div className="modal-actions"><button className="button primary" disabled={busy} onClick={() => { setExitOpen(false); setTab('workout'); }}>继续训练</button><button className="button secondary" disabled={busy} onClick={() => void finish()}>{busy ? '保存中…' : '保存并结束'}</button><button className="button danger-quiet" disabled={busy} onClick={() => setDiscardConfirm(true)}>放弃本次训练</button></div></Modal>}
    {discardConfirm && <Confirm title="放弃本次训练？" description="这次训练的所有组将被删除，且不会进入历史记录。" confirmLabel="确认放弃" danger onClose={() => setDiscardConfirm(false)} onConfirm={() => { if (!busy) void discard(); }} />}
    {deleteSession && detail && <Confirm title="删除这条训练记录？" description="删除后无法恢复。计划和其他训练记录不受影响。" confirmLabel="删除记录" danger onClose={() => setDeleteSession(false)} onConfirm={() => { void db.sessions.delete(detail.session.id).then(() => { setDeleteSession(false); setDetail(null); setTab('history'); notify('训练记录已删除'); }).catch(onError); }} />}
    {installHelp && <Modal title="安装「练什么」" onClose={() => setInstallHelp(false)}><p className="modal-description">iPhone / iPad：使用 Safari 打开，点击分享按钮，再选择「添加到主屏幕」。</p><p className="modal-description">Android / 桌面：在 Chrome 或 Edge 的菜单中选择「安装应用」或「添加到主屏幕」。需要 HTTPS，首次联网打开后即可缓存离线资源。</p><button className="button primary" onClick={() => setInstallHelp(false)}>知道了</button></Modal>}
  </div>;
}
function InfoIcon() { return <span className="error-icon">!</span>; }
function Toast({ message, onClose }: { message: { text: string; error: boolean }; onClose: () => void }) {
  const [target, setTarget] = useState<Element>(document.body);
  useEffect(() => {
    const sync = () => setTarget(document.querySelector('dialog[open] .modal-body') ?? document.body);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);
  return createPortal(<div className={`toast ${message.error ? 'error' : ''}`} role={message.error ? 'alert' : 'status'}>{message.error ? <InfoIcon /> : <Check size={18} />}<span>{message.text}</span><button aria-label="关闭提示" onClick={onClose}><X size={16} /></button></div>, target);
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Never reset persistent data on a UI error. */ }
  render() { return this.state.failed ? <main className="fatal"><h1>页面遇到了问题</h1><p>本地训练记录仍会保留，请重新打开。</p><button className="button primary" onClick={() => location.reload()}>重新打开</button></main> : this.props.children; }
}
