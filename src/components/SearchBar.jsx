import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlighted({ text, query }) {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(255,200,0,0.35)', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
      : p
  );
}

export default function SearchBar({ theme, query, onChange, results, folders, onOpenNote, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}
      style={{ background: theme.surface, borderBottom: `0.5px solid ${theme.border}` }}
    >
      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, fontSize: 14, color: theme.textSecondary, pointerEvents: 'none' }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => onChange(e.target.value)}
            placeholder="Notlarda ara…"
            style={{
              width: '100%', padding: '9px 32px 9px 30px',
              borderRadius: 10, border: `0.5px solid ${theme.border}`,
              background: theme.bg, color: theme.text,
              fontSize: 15, outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button onClick={() => onChange('')} style={{ position: 'absolute', right: 8, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: theme.textSecondary, lineHeight: 1, padding: 2 }}>
              ×
            </button>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0', flexShrink: 0 }}>
          iptal
        </button>
      </div>

      {/* Results */}
      {query.length > 0 && (
        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '0 16px 14px' }}>
          {results.length === 0 ? (
            <p style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', padding: '20px 0', margin: 0 }}>
              Sonuç bulunamadı
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(note => {
                const folder = folders.find(f => f.id === note.folderId);
                const preview = note.body?.replace(/\n+/g, ' ').slice(0, 70) || '';
                return (
                  <div
                    key={note.id}
                    onClick={() => { onOpenNote(note); onClose(); }}
                    style={{
                      padding: '11px 14px', borderRadius: 10,
                      border: `0.5px solid ${theme.border}`,
                      background: theme.bg, cursor: 'pointer',
                      borderLeft: folder ? `3px solid ${folder.color}` : `0.5px solid ${theme.border}`,
                    }}
                  >
                    {note.title && (
                      <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: theme.text }}>
                        <Highlighted text={note.title} query={query} />
                      </p>
                    )}
                    {preview && (
                      <p style={{ margin: 0, fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.45 }}>
                        <Highlighted text={preview} query={query} />
                      </p>
                    )}
                    {folder && (
                      <span style={{ fontSize: 11, color: folder.color, marginTop: 5, display: 'inline-block', fontWeight: 500 }}>
                        {folder.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
