import { useState, useMemo } from 'react';
import {
  ShoppingCart, Plus, X, MoreVertical, Pencil, Trash2,
  Archive, ArchiveRestore, MessageSquare, CheckSquare, Square, Store, Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

function ListForm({ initial = {}, onSave, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [store, setStore] = useState(initial.store || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), store: store.trim() || null });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="app-label">List Name *</label>
        <input className="app-input" placeholder="e.g. Weekly Groceries, Target Run…" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </div>
      <div>
        <label className="app-label">Store <span style={{ color: 'var(--subtle)' }}>(optional)</span></label>
        <input className="app-input" placeholder="e.g. Walmart, Costco, Target…" value={store} onChange={(e) => setStore(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
        <button type="button" onClick={onCancel} className="app-btn-secondary" style={{ flex: 1 }}>Cancel</button>
        <button type="submit" className="app-btn-primary" style={{ flex: 1 }}>Save</button>
      </div>
    </form>
  );
}

function ItemForm({ initial = {}, onSave, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [qty, setQty] = useState(initial.qty || '');
  const [price, setPrice] = useState(initial.price != null ? String(initial.price) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      qty: qty.trim() || null,
      price: price !== '' ? parseFloat(price) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="app-label">Item *</label>
        <input className="app-input" placeholder="e.g. Milk, Chicken breast…" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <label className="app-label">Quantity <span style={{ color: 'var(--subtle)' }}>(optional)</span></label>
          <input className="app-input" placeholder="e.g. 2, 3 lbs, 1 pkg" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="app-label">Price <span style={{ color: 'var(--subtle)' }}>(optional)</span></label>
          <input className="app-input" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
        <button type="button" onClick={onCancel} className="app-btn-secondary" style={{ flex: 1 }}>Cancel</button>
        <button type="submit" className="app-btn-primary" style={{ flex: 1 }}>Save Item</button>
      </div>
    </form>
  );
}

function ExportModal({ list, items, onClose }) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const lines = [`🛒 ${list.name}`];
    if (list.store) lines.push(list.store);
    lines.push('');

    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);

    const fmt = (item, done) => {
      let line = (done ? '✓ ' : '☐ ') + item.name;
      if (item.qty) line += ` (${item.qty})`;
      if (item.price != null) line += ` - $${Number(item.price).toFixed(2)}`;
      return line;
    };

    unchecked.forEach((i) => lines.push(fmt(i, false)));
    if (unchecked.length > 0 && checked.length > 0) lines.push('');
    checked.forEach((i) => lines.push(fmt(i, true)));

    const priced = items.filter((i) => i.price != null);
    if (priced.length > 0) {
      const total = priced.reduce((sum, i) => sum + (i.price ?? 0), 0);
      lines.push('');
      lines.push(`Est. total: $${total.toFixed(2)}`);
    }
    return lines.join('\n');
  }, [list, items]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--border)' }}>
        <pre style={{ fontFamily: 'inherit', fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{text}</pre>
      </div>
      <button
        onClick={handleCopy}
        className="app-btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
      >
        {copied ? <Check size={16} /> : <MessageSquare size={16} />}
        {copied ? 'Copied!' : 'Copy for Text Message'}
      </button>
      <button onClick={onClose} className="app-btn-secondary">Close</button>
    </div>
  );
}

const MENU_BTN = {
  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
  padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)',
  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
};

function ShoppingListCard({
  list, listItems,
  onEditList, onDeleteList, onArchiveList,
  onAddItem, onDeleteItem, onToggleItem, onEditItem, onExport,
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState('');

  const checkedCount = listItems.filter((i) => i.checked).length;
  const priced = listItems.filter((i) => i.price != null);
  const total = priced.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const progress = listItems.length > 0 ? checkedCount / listItems.length : 0;

  const handleQuickAdd = (e) => {
    e?.preventDefault();
    const trimmed = quickAdd.trim();
    if (!trimmed) return;
    onAddItem({ listId: list.id, name: trimmed, qty: null, price: null, checked: false });
    setQuickAdd('');
  };

  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShoppingCart size={14} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
              <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>{list.name}</span>
            </div>
            {list.store && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <Store size={11} style={{ color: 'var(--subtle)' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--subtle)' }}>{list.store}</span>
              </div>
            )}
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <span>{listItems.length === 0 ? 'No items' : `${checkedCount}/${listItems.length} done`}</span>
              {priced.length > 0 && <span>Est. ${total.toFixed(2)}</span>}
            </div>
            {listItems.length > 0 && (
              <div style={{ marginTop: '0.5rem', height: '3px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress * 100}%`,
                  backgroundColor: progress === 1 ? 'var(--positive)' : 'var(--accent)',
                  borderRadius: '2px', transition: 'width 0.3s ease',
                }} />
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            style={{ flexShrink: 0, padding: '0.375rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {listItems.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--subtle)', fontSize: '0.875rem' }}>
              No items yet — add one below.
            </div>
          ) : (
            listItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6875rem 1rem', borderBottom: '1px solid var(--border)',
                  opacity: item.checked ? 0.5 : 1,
                }}
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  style={{ flexShrink: 0, color: item.checked ? 'var(--positive)' : 'var(--border)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', display: 'flex' }}
                >
                  {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onEditItem(item)}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9375rem', color: 'var(--text)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                      {item.name}
                    </span>
                    {item.qty && <span style={{ fontSize: '0.8125rem', color: 'var(--subtle)' }}>({item.qty})</span>}
                  </div>
                  {item.price != null && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--accent-text)' }}>${Number(item.price).toFixed(2)}</span>
                  )}
                </div>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  style={{ flexShrink: 0, color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', display: 'flex' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {/* Quick-add row */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              className="app-input"
              style={{ flex: 1 }}
              placeholder="Add item…"
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button
              onClick={handleQuickAdd}
              disabled={!quickAdd.trim()}
              style={{
                flexShrink: 0, padding: '0 1rem', borderRadius: '0.75rem', height: '2.75rem',
                backgroundColor: quickAdd.trim() ? 'var(--accent)' : 'var(--surface2)',
                color: quickAdd.trim() ? '#fff' : 'var(--subtle)',
                border: 'none', cursor: quickAdd.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                fontWeight: '600', fontSize: '0.875rem',
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Share button */}
          {listItems.length > 0 && (
            <div style={{ padding: '0 1rem 0.875rem' }}>
              <button
                onClick={() => onExport(list)}
                style={{
                  width: '100%', padding: '0.625rem', borderRadius: '0.75rem',
                  backgroundColor: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--muted)', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
                }}
              >
                <MessageSquare size={14} /> Share as text message
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'absolute', right: '0.75rem', top: '3rem', zIndex: 50,
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', overflow: 'hidden', minWidth: '11rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <button onClick={() => { onExport(list); setMenuOpen(false); }} style={MENU_BTN}>
              <MessageSquare size={14} /> Share as text
            </button>
            <button onClick={() => { onEditList(list); setMenuOpen(false); }} style={MENU_BTN}>
              <Pencil size={14} /> Edit list
            </button>
            <button onClick={() => { onArchiveList(list.id); setMenuOpen(false); }} style={MENU_BTN}>
              {list.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {list.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button onClick={() => { onDeleteList(list.id); setMenuOpen(false); }} style={{ ...MENU_BTN, color: 'var(--danger)' }}>
              <Trash2 size={14} /> Delete list
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ShoppingLists() {
  const {
    shoppingLists, addShoppingList, updateShoppingList, deleteShoppingList,
    shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem,
  } = useApp();

  const [search, setSearch] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  const [editList, setEditList] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [exportList, setExportList] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(() => shoppingLists.filter((l) => !l.archived), [shoppingLists]);
  const archived = useMemo(() => shoppingLists.filter((l) => l.archived), [shoppingLists]);

  const filteredActive = useMemo(() => {
    if (!search) return active;
    const q = search.toLowerCase();
    return active.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      l.store?.toLowerCase().includes(q) ||
      shoppingItems.some((i) => i.listId === l.id && i.name.toLowerCase().includes(q))
    );
  }, [active, search, shoppingItems]);

  const filteredArchived = useMemo(() => {
    if (!search) return archived;
    const q = search.toLowerCase();
    return archived.filter((l) => l.name.toLowerCase().includes(q) || l.store?.toLowerCase().includes(q));
  }, [archived, search]);

  const exportItems = exportList ? shoppingItems.filter((i) => i.listId === exportList.id) : [];

  const cardProps = (list) => ({
    list,
    listItems: shoppingItems.filter((i) => i.listId === list.id),
    onEditList: setEditList,
    onDeleteList: deleteShoppingList,
    onArchiveList: (id) => updateShoppingList(id, { archived: !shoppingLists.find((l) => l.id === id)?.archived }),
    onAddItem: addShoppingItem,
    onDeleteItem: deleteShoppingItem,
    onToggleItem: toggleShoppingItem,
    onEditItem: setEditItem,
    onExport: setExportList,
  });

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Lists</h1>
          <button
            onClick={() => setShowNewList(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}
          >
            <Plus size={16} /> New List
          </button>
        </div>

        {shoppingLists.length > 1 && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              className="app-input"
              placeholder="Search lists and items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '0 1rem' }}>
        {shoppingLists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
            <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>No lists yet</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Create a grocery or shopping list to get started.</p>
            <button onClick={() => setShowNewList(true)} className="app-btn-primary" style={{ maxWidth: '14rem', margin: '0 auto' }}>
              <Plus size={18} /> New List
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredActive.length === 0 && search ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.9375rem' }}>No lists match "{search}".</p>
            ) : (
              filteredActive.map((list) => <ShoppingListCard key={list.id} {...cardProps(list)} />)
            )}

            {archived.length > 0 && (
              <div style={{ marginTop: '0.25rem' }}>
                <button
                  onClick={() => setShowArchived((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
                >
                  <Archive size={13} />
                  {archived.length} archived {archived.length === 1 ? 'list' : 'lists'}
                  <span style={{ fontSize: '0.7rem' }}>{showArchived ? '▲' : '▼'}</span>
                </button>
                {showArchived && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', opacity: 0.7 }}>
                    {filteredArchived.map((list) => <ShoppingListCard key={list.id} {...cardProps(list)} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showNewList && (
        <Modal title="New List" onClose={() => setShowNewList(false)}>
          <ListForm
            onSave={(data) => { addShoppingList(data); setShowNewList(false); }}
            onCancel={() => setShowNewList(false)}
          />
        </Modal>
      )}
      {editList && (
        <Modal title="Edit List" onClose={() => setEditList(null)}>
          <ListForm
            initial={editList}
            onSave={(data) => { updateShoppingList(editList.id, data); setEditList(null); }}
            onCancel={() => setEditList(null)}
          />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Item" onClose={() => setEditItem(null)}>
          <ItemForm
            initial={editItem}
            onSave={(data) => { updateShoppingItem(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
      {exportList && (
        <Modal title="Share List" onClose={() => setExportList(null)}>
          <ExportModal
            list={exportList}
            items={exportItems}
            onClose={() => setExportList(null)}
          />
        </Modal>
      )}
    </div>
  );
}
