import { Plus } from 'lucide-react';

export default function AddButton({ onClick, label = 'Add', className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl whitespace-nowrap shrink-0 ${className}`}
      style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
    >
      <Plus size={16} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}
