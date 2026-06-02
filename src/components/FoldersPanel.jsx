import { useState } from 'react';
import { FOLDER_COLORS } from '../themes.js';

export default function FoldersPanel({ folders, notes, theme, assignedFolderId, onAssign, onAddFolder, onDeleteFolder, onClose }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function handleAdd() {
    if (!newName.trim()) return;
    onAddFolder(newName.trim(), newColor);
    setNewName('');
    setNewColor(FOLDER_COLORS[0]);
    setAdding(false);
  }

  function handleFolderTap(folderId) {
    onAssign(folderId === assignedFolderId ? null : folderId);
    onClose();
  }

  function handleDelete(e, folderId) {
    e.stopPropagation();
    if (confirmDeleteId === folderId) {
      onDeleteFolder(folderId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(folderId);
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`,
        background: theme.surface, flexShrink: 0,
      }}>
        <button onClick={onClose} style={ghostBtn(theme)}>← geri</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Klasörler</span>
        <div style={{ width: 48 }} />
      </div>

      {/* Folder list */}
      <div style={{ flex: 1, overflowY: 'auto' }} onClick={() => setConfirmDeleteId(null)}>
        {folders.length === 0 && !adding && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 15, color: theme.textSecondary, margin: 0 }}>Henüz klasör yok</p>
          </div>
        )}

        {folders.map(f => {
          const count = notes.filter(n => n.folderId === f.id).length;
          const isAssigned = f.id === assignedFolderId;
          const isConfirming = f.id === confirmDeleteId;
          const color = f.color || FOLDER_COLORS[0];

          return (
            <div
              key={f.id}
              onClick={() => { if (!isConfirming) handleFolderTap(f.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: `0.5px solid ${theme.border}`,
                cursor: 'pointer',
                background: isConfirming ? '#E0585814' : isAssigned ? `${color}14` : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />

              <span style={{ flex: 1, fontSize: 15, color: theme.text, fontWeight: isAssigned ? 700 : 400 }}>
                {f.name}
              </span>

              <span style={{ fontSize: 13, color: theme.textSecondary }}>{count}</span>
              {isAssigned && <span style={{ fontSize: 13, color: color, fontWeight: 700 }}>✓</span>}

              {/* Delete button / confirm */}
              {isConfirming ? (
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button onClick={e => { e.stopPropagation(); handleDelete(e, f.id); }} style={{
                    padding: '4px 10px', borderRadius: 8, border: 'none',
                    background: '#E05858', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Sil</button>
                  <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{
                    padding: '4px 10px', borderRadius: 8, border: `0.5px solid ${theme.border}`,
                    background: 'transparent', color: theme.textSecondary,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  }}>İptal</button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(f.id); }}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: theme.textSecondary, fontSize: 16, padding: '2px 4px', lineHeight: 1,
                    opacity: 0.5,
                  }}
                >×</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add folder */}
      <div style={{ padding: '14px 16px 28px', borderTop: `0.5px solid ${theme.border}`, flexShrink: 0 }}>
        {adding ? (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {FOLDER_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c,
                  border: newColor === c ? `2.5px solid ${theme.text}` : '2.5px solid transparent',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                  transform: newColor === c ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 0.12s, border-color 0.12s', outline: 'none',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{ width: 4, borderRadius: 2, background: newColor, flexShrink: 0 }} />
              <input
                autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                placeholder="Klasör adı"
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10,
                  border: `0.5px solid ${theme.border}`,
                  background: theme.surface, color: theme.text,
                  fontSize: 15, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button onClick={handleAdd} style={{
                padding: '11px 16px', borderRadius: 10,
                background: newColor, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0,
              }}>Ekle</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            border: `0.5px solid ${theme.border}`,
            background: 'transparent', color: theme.textSecondary,
            fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>+ Yeni Klasör</button>
        )}
      </div>
    </div>
  );
}

function ghostBtn(theme) {
  return {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0',
  };
}
