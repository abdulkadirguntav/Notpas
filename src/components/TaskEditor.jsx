import { useState } from 'react';
import { CATEGORIES } from '../hooks/useTasks.js';

const REPEAT_OPTIONS = [
  { value: 'once',        label: 'Bir kez' },
  { value: 'daily',       label: 'Her gün' },
  { value: 'weekdays',    label: 'Hafta içi' },
  { value: 'weekends',    label: 'Haftasonu' },
  { value: 'everyN',      label: 'Her N günde' },
  { value: 'timesPerDay', label: 'Günde N kez' },
];

const REMINDER_BEFORE_OPTIONS = [
  { value: 0,    label: 'Sadece alarm' },
  { value: 5,    label: '5 dk önce' },
  { value: 15,   label: '15 dk önce' },
  { value: 30,   label: '30 dk önce' },
  { value: 60,   label: '1 saat önce' },
  { value: 120,  label: '2 saat önce' },
  { value: 360,  label: '6 saat önce' },
  { value: 1440, label: '1 gün önce' },
];

function isOpenRepeat(type) {
  return ['daily', 'weekdays', 'weekends', 'timesPerDay'].includes(type);
}

export default function TaskEditor({ task, theme, onSave, onDelete }) {
  const [title, setTitle]               = useState(task?.title || '');
  const [category, setCategory]         = useState(task?.category || 'important');
  const [dueDate, setDueDate]           = useState(task?.dueDate || '');
  const [dueTime, setDueTime]           = useState(task?.dueTime || '');
  const [reminder, setReminder]         = useState(task?.reminder ?? true);
  const [reminderBefore, setReminderBefore] = useState(task?.reminderBefore ?? 15);
  const [repeat, setRepeat]             = useState(task?.repeat || { type: 'once' });
  const [dayTimes, setDayTimes]         = useState(() => {
    if (task?.dayTimes?.length) return task.dayTimes;
    return ['09:00'];
  });

  function handleSave() {
    if (!title.trim()) { onDelete?.(); return; }
    const openRepeat = isOpenRepeat(repeat.type);
    onSave({
      title: title.trim(),
      category,
      dueDate: openRepeat ? null : (dueDate || null),
      dueTime: repeat.type === 'timesPerDay' ? null : (dueTime || null),
      reminder,
      reminderBefore: reminder ? reminderBefore : 0,
      repeat,
      dayTimes: repeat.type === 'timesPerDay' ? dayTimes : [],
    });
  }

  function setRepeatType(type) {
    setRepeat({ type, n: 2, count: dayTimes.length || 1 });
  }

  function updateDayTime(idx, val) {
    setDayTimes(prev => prev.map((t, i) => i === idx ? val : t));
  }

  function addDayTime() {
    setDayTimes(prev => [...prev, '12:00']);
    setRepeat(r => ({ ...r, count: (r.count || 1) + 1 }));
  }

  function removeDayTime(idx) {
    if (dayTimes.length <= 1) return;
    setDayTimes(prev => prev.filter((_, i) => i !== idx));
    setRepeat(r => ({ ...r, count: Math.max(1, (r.count || 1) - 1) }));
  }

  const cat = CATEGORIES[category];
  const openRepeat = isOpenRepeat(repeat.type);
  const hasTime = repeat.type === 'timesPerDay'
    ? dayTimes.length > 0
    : !!dueTime || (repeat.type === 'once' && !!dueDate);

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`,
        background: theme.surface, flexShrink: 0,
      }}>
        <button onClick={handleSave} style={ghostBtn(theme)}>← kaydet</button>
        {task?.id && (
          <button onClick={() => onDelete()} style={{ ...ghostBtn(theme), color: '#E05858' }}>sil</button>
        )}
      </div>

      {/* Category accent bar */}
      <div style={{ height: 3, background: cat.color, flexShrink: 0 }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

        {/* Title */}
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Alışkanlık adı"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 20, fontWeight: 700, color: theme.text,
            fontFamily: 'inherit', width: '100%', padding: 0,
            marginBottom: 24, letterSpacing: '-0.3px',
          }}
        />

        {/* Category */}
        <label style={sectionLabel(theme)}>Kategori</label>
        <div style={{
          display: 'flex', gap: 8, marginBottom: 24,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          paddingBottom: 4, scrollbarWidth: 'none',
        }}>
          {Object.values(CATEGORIES).map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              flexShrink: 0,
              padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              border: `2px solid ${category === c.id ? c.color : theme.border}`,
              background: category === c.id ? `${c.color}18` : 'transparent',
              color: category === c.id ? c.color : theme.textSecondary,
              transition: 'all 0.12s',
            }}>{c.label} +{c.points}p</button>
          ))}
        </div>

        {/* Repeat */}
        <label style={sectionLabel(theme)}>Tekrar</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {REPEAT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setRepeatType(opt.value)} style={{
              padding: '6px 12px', borderRadius: 16, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12,
              border: `1.5px solid ${repeat.type === opt.value ? theme.text : theme.border}`,
              background: repeat.type === opt.value ? theme.surface : 'transparent',
              color: repeat.type === opt.value ? theme.text : theme.textSecondary,
            }}>{opt.label}</button>
          ))}
        </div>

        {repeat.type === 'everyN' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>Her</span>
            <input type="number" min={1} max={30} value={repeat.n || 2}
              onChange={e => setRepeat(r => ({ ...r, n: Number(e.target.value) }))}
              style={{ ...inputStyle(theme), width: 60, textAlign: 'center' }}
            />
            <span style={{ fontSize: 13, color: theme.textSecondary }}>günde bir</span>
          </div>
        )}

        {/* ── Zaman / Tarih bölümü ── */}

        {/* timesPerDay: birden fazla saat */}
        {repeat.type === 'timesPerDay' && (
          <div style={{ marginBottom: 24 }}>
            <label style={sectionLabel(theme)}>Alarm saatleri</label>
            {dayTimes.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  type="time"
                  value={t}
                  onChange={e => updateDayTime(idx, e.target.value)}
                  style={{ ...inputStyle(theme), flex: 1, maxWidth: 130 }}
                />
                {dayTimes.length > 1 && (
                  <button onClick={() => removeDayTime(idx)} style={{
                    background: 'transparent', border: `0.5px solid ${theme.border}`,
                    borderRadius: 8, color: '#E05858', fontSize: 18, width: 34, height: 34,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                )}
              </div>
            ))}
            <button onClick={addDayTime} style={{
              background: 'transparent', border: `0.5px solid ${theme.border}`,
              borderRadius: 10, padding: '7px 14px', fontSize: 13,
              color: theme.textSecondary, cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Saat ekle</button>
          </div>
        )}

        {/* once / everyN: tarih + saat */}
        {!openRepeat && (
          <div style={{ marginBottom: 24 }}>
            <label style={sectionLabel(theme)}>Tarih & Saat</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle(theme)}
              />
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                style={{ ...inputStyle(theme), maxWidth: 120 }}
              />
            </div>
          </div>
        )}

        {/* daily / weekdays / weekends: sadece saat */}
        {openRepeat && repeat.type !== 'timesPerDay' && (
          <div style={{ marginBottom: 24 }}>
            <label style={sectionLabel(theme)}>Alarm saati</label>
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              style={{ ...inputStyle(theme), maxWidth: 130 }}
            />
          </div>
        )}

        {/* ── Bildirim bölümü ── */}
        {hasTime && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ ...sectionLabel(theme), margin: 0 }}>Erken bildirim</label>
              <button onClick={() => setReminder(r => !r)} style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: reminder ? cat.color : theme.border,
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: reminder ? 20 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {reminder && (
              <>
                <p style={{ fontSize: 12, color: theme.textSecondary, margin: '0 0 10px' }}>
                  Tam alarm saatinden ne kadar önce bildirim gelsin?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {REMINDER_BEFORE_OPTIONS.filter(o => o.value > 0).map(opt => (
                    <button key={opt.value} onClick={() => setReminderBefore(opt.value)} style={{
                      padding: '6px 12px', borderRadius: 16, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 12,
                      border: `1.5px solid ${reminderBefore === opt.value ? cat.color : theme.border}`,
                      background: reminderBefore === opt.value ? `${cat.color}18` : 'transparent',
                      color: reminderBefore === opt.value ? cat.color : theme.textSecondary,
                    }}>{opt.label}</button>
                  ))}
                </div>
              </>
            )}
            {!reminder && (
              <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
                Kapalı — sadece tam saatinde alarm çalar.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
function sectionLabel(theme) {
  return { display: 'block', fontSize: 11, color: theme.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 };
}
function inputStyle(theme) {
  return {
    flex: 1, padding: '9px 12px', borderRadius: 10,
    border: `0.5px solid ${theme.border}`,
    background: theme.surface, color: theme.text,
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    colorScheme: 'light dark',
  };
}
