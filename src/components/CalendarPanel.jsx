import { useState } from 'react';

const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function toISO(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function fmtLabel(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function CalendarPanel({ theme, note, onSave, onClose }) {
  const [start, setStart] = useState(note?.dateStart || null);
  const [end, setEnd] = useState(note?.dateEnd || null);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState(() => {
    const ref = note?.dateStart ? new Date(note.dateStart + 'T00:00:00') : today;
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });

  const { year, month } = view;
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function tapDay(iso) {
    if (!start || (start && end)) {
      setStart(iso); setEnd(null);
    } else if (iso === start) {
      setStart(null); setEnd(null);
    } else if (iso > start) {
      setEnd(iso);
    } else {
      setStart(iso); setEnd(null);
    }
  }

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  }
  function nextMonth() {
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  }

  const hasRange = !!(start && end && start !== end);
  const accent = theme.accent;

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`,
        background: theme.surface, flexShrink: 0,
      }}>
        <button onClick={onClose} style={ghostBtn(theme)}>← geri</button>
        <button
          onClick={() => onSave({ dateStart: start, dateEnd: end })}
          style={{
            background: accent, color: theme.bg, border: 'none',
            borderRadius: 8, padding: '6px 16px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Kaydet</button>
      </div>

      {/* Date summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '18px 20px', borderBottom: `0.5px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 3px', fontSize: 10.5, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Başlangıç</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: start ? accent : theme.textSecondary }}>{fmtLabel(start)}</p>
        </div>
        <div style={{ fontSize: 18, color: theme.border, padding: '0 12px' }}>→</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ margin: '0 0 3px', fontSize: 10.5, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Bitiş</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: end ? accent : theme.textSecondary }}>{fmtLabel(end)}</p>
        </div>
      </div>

      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 10px', flexShrink: 0,
      }}>
        <button onClick={prevMonth} style={navBtn(theme)}>‹</button>
        <span style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={navBtn(theme)}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 14px', flexShrink: 0 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: theme.textSecondary, fontWeight: 600, padding: '4px 0 8px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = toISO(year, month, d);
            const isStart = iso === start;
            const isEnd = iso === end;
            const isInRange = hasRange && iso > start && iso < end;
            const isToday = iso === todayISO;
            const isSelected = isStart || isEnd;

            // Range highlight strip (fills full cell width when in range)
            const stripBg = hasRange && isInRange
              ? `${accent}22`
              : hasRange && isStart
              ? `linear-gradient(90deg, transparent 50%, ${accent}22 50%)`
              : hasRange && isEnd
              ? `linear-gradient(90deg, ${accent}22 50%, transparent 50%)`
              : 'transparent';

            return (
              <div key={i} style={{ background: stripBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                <button
                  data-date={iso}
                  onClick={() => tapDay(iso)}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: isToday && !isSelected ? `1.5px solid ${accent}` : 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 14, fontWeight: isSelected || isToday ? 700 : 400,
                    background: isSelected ? accent : 'transparent',
                    color: isSelected ? theme.bg : isToday ? accent : theme.text,
                    transition: 'background 0.12s',
                    outline: 'none',
                    flexShrink: 0,
                  }}
                >{d}</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear */}
      {(start || end) && (
        <div style={{ padding: '12px 20px 28px', flexShrink: 0 }}>
          <button
            onClick={() => { setStart(null); setEnd(null); }}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              border: `0.5px solid ${theme.border}`, background: 'transparent',
              color: theme.textSecondary, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Tarihi temizle</button>
        </div>
      )}
    </div>
  );
}

function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
function navBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 26, color: theme.text, padding: '4px 12px', fontFamily: 'inherit', lineHeight: 1 };
}
