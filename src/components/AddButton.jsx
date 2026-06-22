import { Plus } from 'lucide-react';

export default function AddButton({ onClick, label = 'Add', className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-950/40 transition-colors whitespace-nowrap shrink-0 ${className}`}
    >
      <Plus size={16} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}
