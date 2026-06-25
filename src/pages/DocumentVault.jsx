import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Image, File, ExternalLink, Search, Receipt, TrendingUp, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { fileCategory, formatFileSize } from '../utils/storageUtils';

function FileIcon({ type, size = 16 }) {
  const cat = fileCategory(type);
  if (cat === 'image') return <Image size={size} style={{ color: '#10b981' }} />;
  if (cat === 'pdf') return <FileText size={size} style={{ color: '#f43f5e' }} />;
  if (cat === 'doc') return <FileText size={size} style={{ color: '#6366f1' }} />;
  return <File size={size} style={{ color: 'var(--muted)' }} />;
}

function Section({ icon: Icon, title, color, items }) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={14} style={{ color }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--subtle)', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>{items.length}</span>
        </div>
        {open ? <ChevronUp size={15} style={{ color: 'var(--subtle)' }} /> : <ChevronDown size={15} style={{ color: 'var(--subtle)' }} />}
      </button>

      {open && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={item.att.id + i}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', backgroundColor: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileIcon type={item.att.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.att.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--subtle)' }}>
                  <span style={{ color }}>{item.source}</span>
                  <span>·</span>
                  <span>{formatFileSize(item.att.size)}</span>
                  {item.att.uploadedAt && <>
                    <span>·</span>
                    <span>{new Date(item.att.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </>}
                </div>
              </div>
              <a href={item.att.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-text)', display: 'flex', padding: '0.375rem', flexShrink: 0 }}>
                <ExternalLink size={16} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentVault() {
  const { bills, income, purchases } = useApp();
  const [query, setQuery] = useState('');

  const q = query.toLowerCase();

  const billDocs = useMemo(() => bills.flatMap((b) =>
    (b.attachments || []).map((att) => ({ att, source: b.name }))
  ), [bills]);

  const incomeDocs = useMemo(() => income.flatMap((i) =>
    (i.attachments || []).map((att) => ({ att, source: i.source || i.name }))
  ), [income]);

  const purchaseDocs = useMemo(() => purchases.flatMap((p) =>
    (p.attachments || []).map((att) => ({ att, source: p.merchant }))
  ), [purchases]);

  const filter = (items) => q
    ? items.filter((i) => i.att.name.toLowerCase().includes(q) || i.source.toLowerCase().includes(q))
    : items;

  const totalCount = billDocs.length + incomeDocs.length + purchaseDocs.length;

  return (
    <div className="app-page">
      <div className="app-header">
        <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>Documents</h1>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', fontSize: '0.9375rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>
        {totalCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <File size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>No documents yet</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)' }}>Tap the paperclip on any bill or income source to upload receipts, W-2s, and paystubs.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginBottom: '1rem' }}>{totalCount} file{totalCount !== 1 ? 's' : ''} across all categories</p>
            <Section icon={Receipt} title="Bill Receipts" color="#6366f1" items={filter(billDocs)} />
            <Section icon={TrendingUp} title="Income Documents" color="#10b981" items={filter(incomeDocs)} />
            <Section icon={ShoppingBag} title="Purchase Receipts" color="#f59e0b" items={filter(purchaseDocs)} />
          </>
        )}
      </div>
    </div>
  );
}
