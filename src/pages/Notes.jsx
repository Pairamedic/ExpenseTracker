import { useState } from 'react';
import { Plus, Pin, PinOff, Pencil, Trash2, MoreVertical, NotebookPen, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NoteForm({ initial = {}, onSave, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [content, setContent] = useState(initial.content || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Title (optional)</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Savings goal, Tax notes..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Note *</label>
        <textarea
          autoFocus
          rows={7}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          placeholder="Write anything — budget goals, reminders, account numbers, loan details..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save Note
        </button>
      </div>
    </form>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 180;
  const displayContent = isLong && !expanded ? note.content.slice(0, 180) + '…' : note.content;

  return (
    <div className={`relative bg-slate-800/60 rounded-2xl border transition-all ${note.pinned ? 'border-indigo-700/60' : 'border-slate-700/50'}`}>
      {note.pinned && (
        <div className="absolute top-3 right-10 text-indigo-400">
          <Pin size={13} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            {note.title ? (
              <p className="font-semibold text-white leading-tight mb-1">{note.title}</p>
            ) : null}
            <p
              className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words"
              onClick={() => isLong && setExpanded(!expanded)}
            >
              {displayContent}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex-shrink-0 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-2">{timeAgo(note.updatedAt)}</p>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-10 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[150px]">
            <button onClick={() => { onPin(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              {note.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              {note.pinned ? 'Unpin' : 'Pin to top'}
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
  const { notes, addNote, updateNote, deleteNote, toggleNotePin } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = notes
    .filter((n) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return n.title?.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Add
          </button>
        </div>

        {notes.length > 3 && (
          <div className="relative mb-4">
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-5 space-y-3">
        {filtered.length === 0 && notes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <NotebookPen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notes yet.</p>
            <p className="text-xs mt-1 text-slate-600">Tap Add to jot down budget goals,<br />account details, reminders, and more.</p>
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
            />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="New Note" onClose={() => setShowAdd(false)}>
          <NoteForm
            onSave={(data) => { addNote(data); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editNote && (
        <Modal title="Edit Note" onClose={() => setEditNote(null)}>
          <NoteForm
            initial={editNote}
            onSave={(data) => { updateNote(editNote.id, data); setEditNote(null); }}
            onCancel={() => setEditNote(null)}
          />
        </Modal>
      )}
    </div>
  );
}
