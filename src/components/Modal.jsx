import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    /* z-[70] — above the z-50 nav */
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet — no fixed height, let content scroll, leave room for iOS chrome */}
      <div
        className="relative w-full max-w-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          maxHeight: 'calc(100svh - env(safe-area-inset-top, 44px) - 16px)',
        }}
      >
        {/* sticky header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'var(--muted)', backgroundColor: 'var(--surface2)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* scrollable content — padding-bottom clears iOS bottom bar */}
        <div
          className="overflow-y-auto flex-1 px-5 py-5"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
