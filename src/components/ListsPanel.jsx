import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLists } from '../hooks/useLists.js';

// ── Shared style helpers ──────────────────────────────────────────────────────
function ghostBtn(theme) {
  return {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 14, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0',
  };
}
function sectionLabel(theme) {
  return {
    display: 'block', fontSize: 11, color: theme.textSecondary,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, marginTop: 14,
  };
}
function inputSt(theme) {
  return {
    width: '100%', padding: '10px 12px', borderRadius: 10, marginBottom: 2,
    border: `0.5px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };
}
function chipBtn(theme, active) {
  return {
    padding: '5px 12px', borderRadius: 12, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12,
    border: `1.5px solid ${active ? theme.text : theme.border}`,
    background: active ? theme.text : 'transparent',
    color: active ? theme.bg : theme.textSecondary,
  };
}
function saveBtn(theme, disabled) {
  return {
    width: '100%', padding: '13px', borderRadius: 12, marginTop: 12,
    background: disabled ? theme.border : theme.text,
    color: disabled ? theme.textSecondary : theme.bg,
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
  };
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function FieldToggle({ theme, label, enabled, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '11px 0', background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 14, color: theme.text }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: enabled ? theme.text : theme.border,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: enabled ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
    </button>
  );
}

// ── List Creator Modal ────────────────────────────────────────────────────────
function ListCreator({ theme, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [fields, setFields] = useState({
    status: { enabled: false, options: ['Bekliyor', 'Devam ediyor', 'Bitti'] },
    rating: { enabled: false, type: 'star' },
    date: { enabled: false },
    note: { enabled: false },
  });
  const [statusInput, setStatusInput] = useState('');

  function toggleField(f) {
    setFields(p => ({ ...p, [f]: { ...p[f], enabled: !p[f].enabled } }));
  }

  function addStatusOpt() {
    if (!statusInput.trim()) return;
    setFields(p => ({ ...p, status: { ...p.status, options: [...p.status.options, statusInput.trim()] } }));
    setStatusInput('');
  }

  function removeStatusOpt(idx) {
    setFields(p => ({ ...p, status: { ...p.status, options: p.status.options.filter((_, i) => i !== idx) } }));
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, background: theme.surface, borderRadius: '18px 18px 0 0', padding: '20px 20px 40px' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto 20px' }} />

        {step === 1 ? (
          <>
            <p style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: theme.text }}>Yeni Liste</p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Liste adı"
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
              style={inputSt(theme)}
            />
            <button disabled={!name.trim()} onClick={() => setStep(2)} style={saveBtn(theme, !name.trim())}>
              Devam →
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: theme.text }}>"{name}" alanları</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: theme.textSecondary }}>Başlık her zaman var. Ek alanlar:</p>

            {/* Status */}
            <FieldToggle theme={theme} label="Durum" enabled={fields.status.enabled} onToggle={() => toggleField('status')} />
            {fields.status.enabled && (
              <div style={{ paddingLeft: 16, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {fields.status.options.map((opt, i) => (
                    <span key={i} style={{
                      fontSize: 12, padding: '4px 8px', borderRadius: 10,
                      background: theme.bg, border: `0.5px solid ${theme.border}`,
                      color: theme.text, display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {opt}
                      <button onClick={() => removeStatusOpt(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={statusInput}
                    onChange={e => setStatusInput(e.target.value)}
                    placeholder="Seçenek ekle"
                    onKeyDown={e => { if (e.key === 'Enter') addStatusOpt(); }}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `0.5px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={addStatusOpt} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: theme.text, color: theme.bg, cursor: 'pointer', fontSize: 13 }}>+</button>
                </div>
              </div>
            )}

            {/* Rating */}
            <FieldToggle theme={theme} label="Puan (1–5)" enabled={fields.rating.enabled} onToggle={() => toggleField('rating')} />
            {fields.rating.enabled && (
              <div style={{ paddingLeft: 16, marginBottom: 8, display: 'flex', gap: 6 }}>
                {[['star', '⭐ Yıldız'], ['number', '# Sayı']].map(([v, l]) => (
                  <button key={v} onClick={() => setFields(p => ({ ...p, rating: { ...p.rating, type: v } }))} style={chipBtn(theme, fields.rating.type === v)}>{l}</button>
                ))}
              </div>
            )}

            <FieldToggle theme={theme} label="Tarih" enabled={fields.date.enabled} onToggle={() => toggleField('date')} />
            <FieldToggle theme={theme} label="Not" enabled={fields.note.enabled} onToggle={() => toggleField('note')} />

            <button onClick={() => onSave({ name: name.trim(), fields })} style={saveBtn(theme, false)}>
              Liste Oluştur
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Row Editor Modal ──────────────────────────────────────────────────────────
function RowEditor({ theme, list, row, onSave, onClose }) {
  const [title, setTitle] = useState(row?.title || '');
  const [status, setStatus] = useState(row?.status || null);
  const [rating, setRating] = useState(row?.rating ?? null);
  const [date, setDate] = useState(row?.date || '');
  const [note, setNote] = useState(row?.note || '');
  const f = list.fields;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, background: theme.surface, borderRadius: '18px 18px 0 0', padding: '20px 20px 44px', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto 20px' }} />
        <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: theme.text }}>{row?.id ? 'Düzenle' : 'Yeni Satır'}</p>

        <label style={sectionLabel(theme)}>Başlık</label>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} style={inputSt(theme)} />

        {f.status?.enabled && (
          <>
            <label style={sectionLabel(theme)}>Durum</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {f.status.options.map(opt => (
                <button key={opt} onClick={() => setStatus(opt === status ? null : opt)} style={chipBtn(theme, status === opt)}>{opt}</button>
              ))}
            </div>
          </>
        )}

        {f.rating?.enabled && (
          <>
            <label style={sectionLabel(theme)}>Puan</label>
            {f.rating.type === 'star' ? (
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n === rating ? null : n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, padding: 2, color: rating >= n ? '#F5A623' : theme.border }}>★</button>
                ))}
              </div>
            ) : (
              <input type="number" min={0} max={100} value={rating ?? ''} onChange={e => setRating(e.target.value ? Number(e.target.value) : null)} style={{ ...inputSt(theme), width: 90 }} />
            )}
          </>
        )}

        {f.date?.enabled && (
          <>
            <label style={sectionLabel(theme)}>Tarih</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputSt(theme), colorScheme: 'light dark' }} />
          </>
        )}

        {f.note?.enabled && (
          <>
            <label style={sectionLabel(theme)}>Not</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inputSt(theme), resize: 'none' }} />
          </>
        )}

        <button disabled={!title.trim()} onClick={() => { if (title.trim()) onSave({ title: title.trim(), status, rating, date: date || null, note }); }} style={saveBtn(theme, !title.trim())}>
          Kaydet
        </button>
      </motion.div>
    </div>
  );
}

// ── List Detail ───────────────────────────────────────────────────────────────
function ListDetail({ theme, list, onBack, onAddRow, onUpdateRow, onDeleteRow }) {
  const [editingRow, setEditingRow] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [swipedRowId, setSwipedRowId] = useState(null);
  const rowSwipeStart = useRef(null);
  const f = list.fields;

  let rows = [...list.rows];
  if (filterStatus) rows = rows.filter(r => r.status === filterStatus);
  if (sortBy === 'date_asc') rows.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
  if (sortBy === 'date_desc') rows.sort((a, b) => (a.date || '') > (b.date || '') ? -1 : 1);
  if (sortBy === 'rating_asc') rows.sort((a, b) => (a.rating ?? -1) - (b.rating ?? -1));
  if (sortBy === 'rating_desc') rows.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));

  function onRowTouchStart(e, id) {
    rowSwipeStart.current = { x: e.touches[0].clientX, id };
  }
  function onRowTouchEnd(e, id) {
    if (!rowSwipeStart.current || rowSwipeStart.current.id !== id) return;
    const dx = e.changedTouches[0].clientX - rowSwipeStart.current.x;
    rowSwipeStart.current = null;
    if (dx < -55) setSwipedRowId(id);
    else if (dx > 20) setSwipedRowId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onBack} style={ghostBtn(theme)}>← geri</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{list.name}</span>
        <button onClick={() => setShowFilter(v => !v)} style={{ ...ghostBtn(theme), color: showFilter ? theme.text : theme.textSecondary }}>Filtre</button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', background: theme.surface, borderBottom: `0.5px solid ${theme.border}` }}
          >
            <div style={{ padding: '10px 16px 14px' }}>
              {f.status?.enabled && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: theme.textSecondary, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duruma göre</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <button onClick={() => setFilterStatus(null)} style={chipBtn(theme, filterStatus === null)}>Tümü</button>
                    {f.status.options.map(opt => (
                      <button key={opt} onClick={() => setFilterStatus(opt === filterStatus ? null : opt)} style={chipBtn(theme, filterStatus === opt)}>{opt}</button>
                    ))}
                  </div>
                </div>
              )}
              {f.date?.enabled && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: theme.textSecondary, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tarihe göre sırala</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSortBy(s => s === 'date_asc' ? null : 'date_asc')} style={chipBtn(theme, sortBy === 'date_asc')}>Eskiden yeniye</button>
                    <button onClick={() => setSortBy(s => s === 'date_desc' ? null : 'date_desc')} style={chipBtn(theme, sortBy === 'date_desc')}>Yeniden eskiye</button>
                  </div>
                </div>
              )}
              {f.rating?.enabled && (
                <div>
                  <p style={{ fontSize: 11, color: theme.textSecondary, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Puana göre sırala</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSortBy(s => s === 'rating_asc' ? null : 'rating_asc')} style={chipBtn(theme, sortBy === 'rating_asc')}>Düşük → Yüksek</button>
                    <button onClick={() => setSortBy(s => s === 'rating_desc' ? null : 'rating_desc')} style={chipBtn(theme, sortBy === 'rating_desc')}>Yüksek → Düşük</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 100px' }}>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>📋</p>
            <p style={{ fontSize: 15, color: theme.textSecondary }}>Henüz satır yok</p>
          </div>
        )}

        {rows.map(row => (
          <div key={row.id} style={{ position: 'relative', overflow: 'hidden', marginBottom: 8, borderRadius: 12 }}>
            {/* Delete behind */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 76,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#E05858', borderRadius: '0 12px 12px 0',
            }}>
              <button onClick={() => { onDeleteRow(list.id, row.id); setSwipedRowId(null); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sil</button>
            </div>

            <motion.div
              animate={{ x: swipedRowId === row.id ? -76 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              onTouchStart={e => onRowTouchStart(e, row.id)}
              onTouchEnd={e => onRowTouchEnd(e, row.id)}
              onClick={() => { if (swipedRowId === row.id) { setSwipedRowId(null); return; } setEditingRow(row); }}
              style={{
                background: theme.surface, borderRadius: 12, padding: '12px 14px',
                border: `0.5px solid ${theme.border}`, cursor: 'pointer', position: 'relative',
              }}
            >
              <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 500, color: theme.text }}>{row.title}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {row.status && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: theme.bg, border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>{row.status}</span>
                )}
                {row.rating != null && (
                  <span style={{ fontSize: 12, color: '#F5A623' }}>
                    {f.rating?.type === 'star' ? '★'.repeat(row.rating) : `${row.rating}p`}
                  </span>
                )}
                {row.date && (
                  <span style={{ fontSize: 11, color: theme.textSecondary }}>
                    📅 {new Date(row.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {row.note && <span style={{ fontSize: 11, color: theme.textSecondary }}>📝</span>}
              </div>
            </motion.div>
          </div>
        ))}

        <button
          onClick={() => setAddingRow(true)}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, marginTop: 4,
            border: `1px dashed ${theme.border}`, background: 'transparent',
            color: theme.textSecondary, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >+ Yeni satır ekle</button>
      </div>

      <AnimatePresence>
        {(editingRow || addingRow) && (
          <RowEditor
            theme={theme} list={list} row={editingRow}
            onSave={data => {
              if (editingRow) onUpdateRow(list.id, editingRow.id, data);
              else onAddRow(list.id, data);
              setEditingRow(null); setAddingRow(false);
            }}
            onClose={() => { setEditingRow(null); setAddingRow(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Lists Panel (Home) ────────────────────────────────────────────────────────
export default function ListsPanel({ theme, onClose }) {
  const { lists, addList, deleteList, addRow, updateRow, deleteRow } = useLists();
  const [detailId, setDetailId] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [longPressId, setLongPressId] = useState(null);
  const lpTimer = useRef(null);

  const detailList = detailId ? lists.find(l => l.id === detailId) : null;

  function lpStart(id) { lpTimer.current = setTimeout(() => setLongPressId(id), 480); }
  function lpEnd() { clearTimeout(lpTimer.current); }

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence mode="wait">
        {!detailList ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`, background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={onClose} style={ghostBtn(theme)}>↓ kapat</button>
              <span style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>Listeler</span>
              <button onClick={() => setShowCreator(true)} style={{ ...ghostBtn(theme), fontSize: 24, lineHeight: 1 }}>+</button>
            </div>

            {/* List cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {lists.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <p style={{ fontSize: 40, margin: '0 0 12px' }}>📋</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: theme.text, margin: '0 0 6px' }}>Henüz liste yok</p>
                  <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>+ ile yeni liste oluştur</p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lists.map(list => (
                  <div key={list.id} style={{ position: 'relative' }}>
                    <div
                      onTouchStart={() => lpStart(list.id)}
                      onTouchEnd={lpEnd}
                      onTouchMove={lpEnd}
                      onClick={() => setDetailId(list.id)}
                      style={{ background: theme.surface, borderRadius: 14, padding: '14px 16px', border: `0.5px solid ${theme.border}`, cursor: 'pointer' }}
                    >
                      <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: theme.text }}>{list.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary }}>
                        {list.rows.length} satır · {new Date(list.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </p>
                      {/* Active fields summary */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {list.fields.status?.enabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>Durum</span>}
                        {list.fields.rating?.enabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>Puan</span>}
                        {list.fields.date?.enabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>Tarih</span>}
                        {list.fields.note?.enabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>Not</span>}
                      </div>
                    </div>

                    {/* Long press overlay */}
                    <AnimatePresence>
                      {longPressId === list.id && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
                          onClick={() => setLongPressId(null)}
                        >
                          <button onClick={e => { e.stopPropagation(); deleteList(list.id); setLongPressId(null); }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#E05858', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Sil</button>
                          <button onClick={e => { e.stopPropagation(); setLongPressId(null); }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', color: '#333', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`detail-${detailId}`}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <ListDetail
              theme={theme} list={detailList}
              onBack={() => setDetailId(null)}
              onAddRow={addRow} onUpdateRow={updateRow} onDeleteRow={deleteRow}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreator && (
          <ListCreator
            theme={theme}
            onSave={data => { addList(data); setShowCreator(false); }}
            onClose={() => setShowCreator(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
