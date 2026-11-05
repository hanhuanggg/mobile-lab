import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, X, Dumbbell } from 'lucide-react';

export function Brand() { return <div className="brand"><span className="brand-icon"><Dumbbell size={24} strokeWidth={2.3} /></span><span>练什么<span className="brand-sub">LESS FUSS. MORE REPS.</span></span></div>; }
export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{children}</p>{action}</div>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = original; };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-body"><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={21} /></button></div>{children}</div>
  </dialog>;
}
export function Confirm({ title, description, confirmLabel, onConfirm, onClose, danger = false }: { title: string; description: string; confirmLabel: string; onConfirm: () => void; onClose: () => void; danger?: boolean }) {
  return <Modal title={title} onClose={onClose}><p className="modal-description">{description}</p><div className="modal-actions"><button className={`button ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button><button className="button secondary" onClick={onClose}>取消</button></div></Modal>;
}
export function GalleryLink() { return <a className="gallery-link" href="../../">返回陈列馆 <ArrowUpRight size={14} /></a>; }
export function NumericInput({ value, onChange, label, integer = false, max = 2000 }: { value: number; onChange: (v: number) => void; label: string; integer?: boolean; max?: number }) {
  const [rawValue, setRawValue] = useState(value === 0 ? '' : String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setRawValue(value === 0 ? '' : String(value)); }, [value]);
  return <input className="number-input" aria-label={label} type="text" inputMode={integer ? 'numeric' : 'decimal'} autoComplete="off" value={rawValue} placeholder="0"
    onFocus={e => { focused.current = true; e.currentTarget.select(); }} onBlur={() => { focused.current = false; setRawValue(value === 0 ? '' : String(value)); }} onChange={e => {
      const raw = e.target.value;
      if (!(integer ? /^\d{0,3}$/ : /^\d{0,4}(\.\d{0,2})?$/).test(raw)) return;
      const next = raw === '' || raw === '.' ? 0 : Number(raw);
      if (Number.isFinite(next) && next <= max) { setRawValue(raw); onChange(next); }
    }} />;
}
