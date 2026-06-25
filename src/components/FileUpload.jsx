import { useState, useRef } from 'react';
import { Upload, Trash2, FileText, Image, File, ExternalLink, AlertCircle } from 'lucide-react';
import { uploadFile, deleteFile, formatFileSize, fileCategory } from '../utils/storageUtils';

function AttachmentIcon({ type }) {
  const cat = fileCategory(type);
  if (cat === 'image') return <Image size={16} style={{ color: '#10b981' }} />;
  if (cat === 'pdf') return <FileText size={16} style={{ color: '#f43f5e' }} />;
  if (cat === 'doc') return <FileText size={16} style={{ color: '#6366f1' }} />;
  return <File size={16} style={{ color: 'var(--muted)' }} />;
}

function ProgressBar({ pct }) {
  return (
    <div style={{ height: '0.3125rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.75rem' }}>
      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent)', borderRadius: '9999px', transition: 'width 0.15s' }} />
    </div>
  );
}

/**
 * Reusable attachment manager.
 *
 * Props:
 *   storagePath   — Firebase Storage base path, e.g. "users/uid/bills/billId"
 *   attachments   — current array of {id,name,url,type,size,uploadedAt}
 *   onAdd         — called with the new attachment object after upload
 *   onRemove      — called with the attachment id after deletion
 *   accept        — file input accept string (default covers images, PDF, Word)
 */
export default function FileUpload({
  storagePath,
  attachments = [],
  onAdd,
  onRemove,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx',
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files?.length) return;
    const file = files[0];
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const att = await uploadFile(storagePath, file, setProgress);
      onAdd?.(att);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (att) => {
    setDeleting(att.id);
    try {
      await deleteFile(att.url);
      onRemove?.(att.id);
    } catch {
      // file may already be gone — still remove from list
      onRemove?.(att.id);
    } finally {
      setDeleting(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {/* existing attachments */}
      {attachments.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {attachments.map((att) => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.625rem 0.875rem' }}>
              <AttachmentIcon type={att.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--subtle)' }}>{formatFileSize(att.size)}{att.uploadedAt ? ` · ${new Date(att.uploadedAt).toLocaleDateString()}` : ''}</p>
              </div>
              <a href={att.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', flexShrink: 0 }}>
                <ExternalLink size={15} />
              </a>
              <button
                onClick={() => handleRemove(att)}
                disabled={deleting === att.id}
                style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', flexShrink: 0, opacity: deleting === att.id ? 0.5 : 1 }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '1rem',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          backgroundColor: dragOver ? 'var(--surface2)' : 'transparent',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <Upload size={22} style={{ color: uploading ? 'var(--muted)' : 'var(--accent-text)', margin: '0 auto 0.5rem', display: 'block' }} />
        {uploading ? (
          <>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: 600 }}>Uploading… {progress}%</p>
            <ProgressBar pct={progress} />
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
              {attachments.length === 0 ? 'Add attachment' : 'Add another'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Tap to browse or drag a file here · max 10 MB</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--subtle)', marginTop: '0.25rem' }}>PDF, images, Word docs</p>
          </>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem', backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid var(--danger)', borderRadius: '0.625rem', padding: '0.625rem 0.75rem' }}>
          <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
    </div>
  );
}
