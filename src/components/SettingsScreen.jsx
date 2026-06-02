import { useRef, useState } from 'react';
import { THEMES } from '../themes.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';

async function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes:   JSON.parse(localStorage.getItem('np_notes')   || '[]'),
    tasks:   JSON.parse(localStorage.getItem('np_tasks')   || '[]'),
    folders: JSON.parse(localStorage.getItem('np_folders') || '[]'),
    score:   JSON.parse(localStorage.getItem('np_score')   || 'null'),
    theme:   localStorage.getItem('np_theme') || 'light',
  };
  const json = JSON.stringify(data, null, 2);
  const fileName = `notpas-yedek-${new Date().toISOString().slice(0, 10)}.json`;

  try {
    // Try Capacitor Filesystem (Android native) first
    await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Documents,
      encoding: 'utf8',
    });
    await Toast.show({ text: `Kaydedildi: Belgeler/${fileName}`, duration: 'long' });
  } catch {
    // Fallback for browser / web preview
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      await Toast.show({ text: 'Yedekleme başarısız oldu.', duration: 'long' });
    }
  }
}

export default function SettingsScreen({ theme, themeId, onThemeChange, onResetScore, onClose }) {
  const importRef = useRef(null);
  const [importConfirm, setImportConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.notes && !parsed.tasks) { alert('Geçersiz yedek dosyası.'); return; }
        setImportConfirm(parsed);
      } catch {
        alert('Dosya okunamadı.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    const data = importConfirm;
    localStorage.setItem('np_notes',   JSON.stringify(data.notes   || []));
    localStorage.setItem('np_tasks',   JSON.stringify(data.tasks   || []));
    localStorage.setItem('np_folders', JSON.stringify(data.folders || []));
    if (data.score) localStorage.setItem('np_score', JSON.stringify(data.score));
    if (data.theme) localStorage.setItem('np_theme', data.theme);
    window.location.reload();
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`, background: theme.surface }}>
        <button onClick={onClose} style={ghostBtn(theme)}>← geri</button>
        <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 600, color: theme.text }}>Ayarlar</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>

        {/* Theme */}
        <SectionLabel theme={theme}>Tema</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {Object.values(THEMES).map(t => (
            <button key={t.id} onClick={() => onThemeChange(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 10,
              border: themeId === t.id ? `1.5px solid ${theme.accent}` : `0.5px solid ${theme.border}`,
              background: t.bg, cursor: 'pointer', transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[t.bg, t.surface, t.text, t.accent].map((c, i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '0.5px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <span style={{ fontSize: 14, color: t.text, fontFamily: 'inherit' }}>{t.name}</span>
              {themeId === t.id && <span style={{ marginLeft: 'auto', fontSize: 14, color: t.accent }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Backup */}
        <SectionLabel theme={theme}>Veri Yedekleme</SectionLabel>
        <p style={{ fontSize: 12, color: theme.textSecondary, margin: '-4px 0 12px', lineHeight: 1.5 }}>
          Yedek dosyası telefondaki Belgeler klasörüne kaydedilir.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          <button onClick={exportData} style={actionBtn(theme)}>
            <span>↓</span> Verilerimi Yedekle
          </button>
          <button onClick={() => importRef.current?.click()} style={actionBtn(theme)}>
            <span>↑</span> Yedek Yükle
          </button>
          <input ref={importRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />
        </div>

        {/* Score reset */}
        <SectionLabel theme={theme}>Puan</SectionLabel>
        <div style={{ marginBottom: 28 }}>
          {resetConfirm ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { onResetScore(); setResetConfirm(false); }} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                background: '#E05858', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Evet, Sıfırla</button>
              <button onClick={() => setResetConfirm(false)} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                border: `0.5px solid ${theme.border}`,
                background: 'transparent', color: theme.textSecondary,
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>İptal</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ ...actionBtn(theme), color: '#E05858', borderColor: '#E0585840' }}>
              Puanı Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* Import confirm overlay */}
      {importConfirm && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            background: theme.surface, borderRadius: 16, padding: '24px 20px',
            border: `0.5px solid ${theme.border}`, width: '100%',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: theme.text }}>Yedek Yükle</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: theme.textSecondary, lineHeight: 1.5 }}>
              Mevcut verilerinin üzerine yazılacak. Bu işlem geri alınamaz. Devam etmek istiyor musun?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmImport} style={{
                flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                background: theme.accent, color: theme.bg, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Devam Et</button>
              <button onClick={() => setImportConfirm(null)} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                border: `0.5px solid ${theme.border}`,
                background: 'transparent', color: theme.textSecondary,
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ theme, children }) {
  return (
    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}
function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
function actionBtn(theme) {
  return {
    width: '100%', padding: '13px 16px', borderRadius: 10,
    border: `0.5px solid ${theme.border}`,
    background: theme.surface, color: theme.text,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center',
  };
}
