import { useState } from 'react';
import {
  Pin, PinOff, Pencil, Trash2, MoreVertical, NotebookPen,
  X, Bell, Link, LayoutDashboard, AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import AddButton from '../components/AddButton';
import { timeAgo, isReminderOverdue, isReminderSoon, formatDate } from '../utils/helpers';

function NoteForm({ initial = {}, onSave, onCancel, bills = [] }) {
  const [title, setTitle] = useState(initial.title || '');
  const [content, setContent] = useState(initial.content || '');
  const [reminderDate, setReminderDate] = useState(initial.reminderDate || '');
  const [linkedBillId, setLinkedBillId] = useState(initial.linkedBillId || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      reminderDate: reminderDate || null,
      linkedBillId: linkedBillId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Title <span className="text-slate-600">(optional)</span></label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. Call insurance, Tax reminder..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Note *</label>
        <textarea
          autoFocus
          rows={5}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
          placeholder="Write anything — reminders, account numbers, goals..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5"><Bell size={13} /> Reminder date <span className="text-slate-600">(optional)</span></label>
        <input
          type="date"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          value={reminderDate}
          onChange={(e) => setReminderDate(e.target.value)}
        />
      </div>
      {bills.length > 0 && (
        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5"><Link size={13} /> Link to bill <span className="text-slate-600">(optional)</span></label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            value={linkedBillId}
            onChange={(e) => setLinkedBillId(e.target.value)}
          >
            <option value="">— No linked bill —</option>
            {bills.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">Save Note</button>
      </div>
    </form>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin, onDashboardPin, linkedBillName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 200;
  const displayContent = isLong && !expanded ? note.content.slice(0, 200) + '…' : note.content;

  const overdue = isReminderOverdue(note.reminderDate);
  const soon = !overdue && isReminderSoon(note.reminderDate);

  const borderClass = note.pinnedToDashboard
    ? 'border-indigo-600/60'
    : note.pinned
    ? 'border-slate-600/70'
    : overdue
    ? 'border-red-900/50'
    : soon
    ? 'border-amber-900/40'
    : 'border-slate-700/50';

  return (
    <div className={`relative rounded-2xl border bg-slate-800/50 transition-all ${borderClass}`}>
      {note.pinnedToDashboard && (
        <div className="absolute top-3 right-10 text-indigo-400">
          <LayoutDashboard size={12} />
        </div>
      )}
      {note.pinned && !note.pinnedToDashboard && (
        <div className="absolute top-3 right-10 text-slate-500">
          <Pin size={12} />
        </div>
      )}
      <div className="p-4">
        {/* Reminder badge */}
        {note.reminderDate && (
          <div className={`flex items-center gap-1.5 text-xs mb-2 px-2.5 py-1.5 rounded-lg w-fit ${
            overdue ? 'bg-red-950/50 text-red-300 border border-red-900/40' :
            soon ? 'bg-amber-950/50 text-amber-300 border border-amber-900/40' :
            'bg-slate-700/50 text-slate-400 border border-slate-600/40'
          }`}>
            {overdue ? <AlertCircle size={11} /> : <Bell size={11} />}
            <span>{overdue ? 'Overdue: ' : soon ? 'Soon: ' : ''}{formatDate(note.reminderDate)}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            {note.title && <p className="font-semibold text-base text-white leading-tight mb-1.5">{note.title}</p>}
            <p
              className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words cursor-pointer"
              onClick={() => isLong && setExpanded(!expanded)}
            >
              {displayContent}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors">
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Linked bill */}
        {linkedBillName && (
          <div className="flex items-center gap-1.5 mt-2">
            <Link size={11} className="text-slate-500" />
            <span className="text-xs text-slate-500">Linked to: <span className="text-slate-400">{linkedBillName}</span></span>
          </div>
        )}

        <p className="text-xs text-slate-600 mt-2">{timeAgo(note.updatedAt)}</p>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-10 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
            <button onClick={() => { onDashboardPin(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <LayoutDashboard size={14} /> {note.pinnedToDashboard ? 'Remove from dashboard' : 'Pin to dashboard'}
            </button>
            <button onClick={() => { onPin(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              {note.pinned ? <PinOff size={14} /> : <Pin size={14} />} {note.pinned ? 'Unpin from top' : 'Pin to top'}
            </button>
            <button onClick={() => { onEdit(note); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Notes() {
  const { notes, bills, addNote, updateNote, deleteNote, toggleNotePin, toggleNoteDashboardPin } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [search, setSearch] = useState('');

  const recurringBills = bills.filter((b) => b.isRecurring);

  const filtered = notes
    .filter((n) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinnedToDashboard !== b.pinnedToDashboard) return a.pinnedToDashboard ? -1 : 1;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      // Reminders with upcoming dates bubble up
      if (a.reminderDate && !b.reminderDate) return -1;
      if (!a.reminderDate && b.reminderDate) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const getBillName = (id) => {
    const bill = bills.find((b) => b.id === id);
    return bill?.name || null;
  };

  return (
    <div className="pb-36">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Notes</h1>
          <AddButton onClick={() => setShowAdd(true)} label="Add Note" />
        </div>
        {notes.length > 2 && (
          <div className="relative mb-4">
            <input
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-3">
        {filtered.length === 0 && notes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <NotebookPen size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No notes yet.</p>
            <p className="text-sm mt-1 text-slate-600">Add reminders, budget goals,<br />and account details.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No notes match your search.</div>
        ) : (
          filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={setEditNote}
              onDelete={deleteNote}
              onPin={toggleNotePin}
              onDashboardPin={toggleNoteDashboardPin}
              linkedBillName={note.linkedBillId ? getBillName(note.linkedBillId) : null}
            />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="New Note" onClose={() => setShowAdd(false)}>
          <NoteForm
            onSave={(data) => { addNote(data); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
            bills={recurringBills}
          />
        </Modal>
      )}
      {editNote && (
        <Modal title="Edit Note" onClose={() => setEditNote(null)}>
          <NoteForm
            initial={editNote}
            onSave={(data) => { updateNote(editNote.id, data); setEditNote(null); }}
            onCancel={() => setEditNote(null)}
            bills={recurringBills}
          />
        </Modal>
      )}
    </div>
  );
}
