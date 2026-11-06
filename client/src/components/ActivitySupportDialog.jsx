import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ActivitySupportDialog({ open, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return createPortal(<dialog ref={dialog} id="activity-support" aria-labelledby="activity-support-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    style={{ position: 'fixed', inset: 0, margin: 'auto', height: 'fit-content', maxHeight: '90dvh' }}
    className="w-[calc(100%_-_2rem)] max-w-3xl rounded-2xl p-0 border border-[#343b54] bg-[#1e2439] text-white shadow-2xl backdrop:bg-black/70 overflow-hidden">
    <div className="flex flex-col" style={{ maxHeight: '90dvh' }} onClick={event => event.stopPropagation()}>
      <header className="flex shrink-0 justify-between items-center gap-4 border-b border-[#343b54] px-5 py-4 sm:px-6">
        <h2 id="activity-support-title" className="font-bold text-lg">Una ayuda para avanzar</h2>
        <button type="button" autoFocus onClick={onClose} aria-label="Cerrar ayuda" className="rounded-lg px-3 py-2 hover:bg-[#343b54] focus-visible:outline-2 focus-visible:outline-purple-400">✕</button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
    </div>
  </dialog>, document.body);
}
