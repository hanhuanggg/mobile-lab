import { useRef, useState } from 'react';
import { Check, Download, HardDrive, Info, ShieldCheck, Smartphone, Upload } from 'lucide-react';
import type { AppSettings, Backup } from '../models/types';
import { db } from '../storage/db';
import { exportBackup, importBackup } from '../storage/service';
import { downloadBackup, parseBackup } from '../storage/backup';
import { Modal } from './ui';

export function DataSettings({ settings, hasActive, onClose, notify, onError, onInstall }: { settings: AppSettings; hasActive: boolean; onClose: () => void; notify: (message: string) => void; onError: (e: unknown) => void; onInstall: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<Backup | null>(null);
  const [busy, setBusy] = useState(false);
  async function backup() {
    try { downloadBackup(await exportBackup()); notify('备份已导出，请妥善保存 JSON 文件'); } catch (e) { onError(e); }
  }
  async function read(file?: File) {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('备份文件不能超过 20 MB。');
      setCandidate(parseBackup(await file.text()));
    } catch (e) { onError(e); }
    if (fileRef.current) fileRef.current.value = '';
  }
  async function restore() {
    if (!candidate) return;
    setBusy(true);
    try { await importBackup(candidate); notify('数据已导入'); onClose(); } catch (e) { onError(e); } finally { setBusy(false); }
  }
  return <Modal title={candidate ? '确认导入备份' : '数据与设置'} onClose={onClose}>
    {candidate ? <><div className="import-warning"><Info size={22} /><p>导入将覆盖本机的所有计划和训练记录。<strong>请先导出现有数据作为备份。</strong></p></div><div className="backup-summary"><span>{candidate.plans.length} 份计划</span><span>{candidate.sessions.length} 条记录</span>{candidate.active && <span>含未完成训练</span>}</div><button className="button secondary" onClick={() => void backup()}><Download size={18} />先导出现有数据</button><button className="button primary" disabled={busy} onClick={() => void restore()}>{busy ? '导入中…' : '已备份，覆盖并导入'}</button><button className="button secondary" disabled={busy} onClick={() => setCandidate(null)}>取消导入</button></>
      : <><div className="privacy-card"><ShieldCheck size={23} /><div><strong>你的数据，只在你的设备里。</strong><p>无需账号，不上传任何训练记录。</p></div></div>
      <label className="setting-row"><span><strong>组间休息</strong><small>完成一组后，自动开始倒计时</small></span><select aria-label="组间休息时长" value={settings.restSeconds} onChange={e => { void db.settings.update('app', { restSeconds: Number(e.target.value) }).then(() => notify('休息时长已更新')).catch(onError); }}><option value={0}>关闭</option><option value={60}>60 秒</option><option value={90}>90 秒</option><option value={120}>120 秒</option></select></label>
      <div className="section-line"><h3>数据备份</h3><span className="tag">JSON</span></div><button className="settings-action" onClick={() => void backup()}><Download size={20} /><span><strong>导出全部数据</strong><small>包含计划、历史与进行中的训练</small></span><Check size={16} /></button><button className="settings-action" disabled={hasActive} onClick={() => fileRef.current?.click()}><Upload size={20} /><span><strong>导入备份文件</strong><small>{hasActive ? '请先结束当前训练，再导入备份' : '校验格式后，确认覆盖本机数据'}</small></span></button><input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label="选择备份 JSON" onChange={e => void read(e.target.files?.[0])} />
      <p className="settings-note">建议定期导出备份。清理浏览器数据或更换设备会影响本机记录；不同浏览器、域名的数据相互独立。</p>
      <button className="settings-action" onClick={onInstall}><Smartphone size={20} /><span><strong>安装到主屏幕</strong><small>像 App 一样打开，支持离线训练</small></span></button>
      <button className="settings-action" onClick={() => { if (!navigator.storage?.persist) { notify('当前浏览器不支持申请持久存储，请定期导出备份'); return; } void navigator.storage.persist().then(granted => notify(granted ? '已获得持久存储权限' : '浏览器暂未授予权限，请定期导出备份')).catch(onError); }}><HardDrive size={20} /><span><strong>申请持久存储</strong><small>降低浏览器自动清理数据的概率</small></span></button>
      <p className="app-version">练什么 v1.0 · 少一点操作，多一组专注。</p></>}
  </Modal>;
}
