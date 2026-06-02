import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NOTE_COLORS } from './NoteCard.jsx';
import Toolbar from './Toolbar.jsx';

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1000;
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.src = url;
  });
}

export default function NoteEditor({ note, theme, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody] = useState(note?.body || '');
  const [color, setColor] = useState(note?.color || null);
  const [images, setImages] = useState(note?.images || []);
  const [loading, setLoading] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!note?.title) bodyRef.current?.focus();
  }, []);

  // Keyboard height detection via visualViewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function update() {
      const h = window.innerHeight - vv.height - vv.offsetTop;
      setKbHeight(Math.max(0, Math.round(h)));
    }
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const kbOpen = kbHeight > 50;

  function handleSave() {
    if (!title.trim() && !body.trim() && images.length === 0) { onDelete?.(); return; }
    onSave({ title: title.trim(), body: body.trim(), color, images });
  }

  async function handleFiles(fileList) {
    if (!fileList?.length) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(Array.from(fileList).map(compressImage));
      setImages(prev => [...prev, ...compressed]);
    } finally {
      setLoading(false);
    }
  }

  function applyFormat(format) {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const selected = body.slice(s, e);
    let newBody = body;
    let newS = s, newE = e;

    if (format === 'bold') {
      newBody = body.slice(0, s) + `**${selected}**` + body.slice(e);
      newS = s + 2; newE = e + 2;
    } else if (format === 'italic') {
      newBody = body.slice(0, s) + `*${selected}*` + body.slice(e);
      newS = s + 1; newE = e + 1;
    } else if (format === 'dash') {
      newBody = body.slice(0, s) + '—' + body.slice(e);
      newS = newE = s + 1;
    } else if (format === 'checkbox') {
      // Insert at start of current line
      const lineStart = body.lastIndexOf('\n', s - 1) + 1;
      newBody = body.slice(0, lineStart) + '[ ] ' + body.slice(lineStart);
      newS = newE = s + 4;
    }

    setBody(newBody);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newS, newE);
    });
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>

      {/* Header — hides when keyboard is open */}
      {!kbOpen && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`,
          background: theme.surface, flexShrink: 0,
        }}>
          <button onClick={handleSave} style={ghostBtn(theme)}>← kaydet</button>
          {note?.id && (
            <button onClick={() => onDelete()} style={{ ...ghostBtn(theme), color: '#c0392b' }}>sil</button>
          )}
        </div>
      )}

      {/* Color accent strip */}
      {color && <div style={{ height: 3, background: color, flexShrink: 0 }} />}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: kbOpen ? '12px 16px 0' : '18px 16px 0' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Başlık"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: kbOpen ? 18 : 22, fontWeight: 700, color: theme.text,
              fontFamily: 'inherit', width: '100%', padding: 0,
              marginBottom: 12, letterSpacing: '-0.3px',
              transition: 'font-size 0.15s',
            }}
          />
          <div style={{ height: '0.5px', background: theme.border, marginBottom: 14 }} />
          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Notunu buraya yaz…"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: theme.text, lineHeight: 1.75,
              fontFamily: 'inherit', resize: 'none', padding: 0,
              width: '100%', minHeight: 180,
              // Extra bottom padding when keyboard is open so content doesn't hide behind toolbar
              paddingBottom: kbOpen ? kbHeight + 50 : 0,
            }}
            rows={10}
          />
        </div>

        {/* Attached images */}
        {images.length > 0 && (
          <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `0.5px solid ${theme.border}` }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        {loading && <p style={{ padding: '12px 16px 0', fontSize: 13, color: theme.textSecondary, margin: 0 }}>Görsel sıkıştırılıyor…</p>}
        <div style={{ minHeight: 20 }} />
      </div>

      {/* Bottom toolbar — hidden when keyboard is open (replaced by floating toolbar) */}
      {!kbOpen && (
        <div style={{ padding: '12px 16px 20px', borderTop: `0.5px solid ${theme.border}`, flexShrink: 0 }}>
          {/* Color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: theme.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Renk</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {NOTE_COLORS.map((c, i) => (
                <button key={i} onClick={() => setColor(c)} style={{
                  width: 24, height: 24, borderRadius: '50%', padding: 0, cursor: 'pointer',
                  background: c || `${theme.textSecondary}55`,
                  border: color === c ? `2.5px solid ${theme.text}` : `2px solid transparent`,
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.1s, border-color 0.15s', outline: 'none',
                }} />
              ))}
            </div>
          </div>
          {/* Image buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => cameraRef.current?.click()} style={toolBtn(theme)}>📷 Kamera</button>
            <button onClick={() => galleryRef.current?.click()} style={toolBtn(theme)}>🖼 Galeri</button>
          </div>
        </div>
      )}

      {/* Floating toolbar above keyboard */}
      <AnimatePresence>
        {kbOpen && (
          <Toolbar theme={theme} onFormat={applyFormat} bottomOffset={kbHeight} />
        )}
      </AnimatePresence>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
function toolBtn(theme) {
  return { flex: 1, padding: '11px', borderRadius: 12, border: `0.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' };
}
