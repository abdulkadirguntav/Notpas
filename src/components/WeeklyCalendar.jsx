import { useState, useMemo } from 'react';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday first
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export default function WeeklyCalendar({ theme, tasks, onClose, onOpenTask }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => toISO(new Date()));
  const todayStr = toISO(new Date());

  const weekDays = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    })
  ), [weekStart]);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [tasks]);

  const selectedTasks = tasksByDate[selectedDay] || [];

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d);
  }

  const weekLabel = () => {
    const s = weekDays[0], e = weekDays[6];
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()}–${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]}`;
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `0.5px solid ${theme.border}`,
        background: theme.surface, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onClose} style={ghostBtn(theme)}>↓ kapat</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>Takvim</span>
        <button
          onClick={() => { setWeekStart(getWeekStart(new Date())); setSelectedDay(todayStr); }}
          style={ghostBtn(theme)}
        >Bugün</button>
      </div>

      {/* Week strip */}
      <div style={{
        padding: '12px 16px', background: theme.surface,
        borderBottom: `0.5px solid ${theme.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevWeek} style={navBtn(theme)}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{weekLabel()}</span>
          <button onClick={nextWeek} style={navBtn(theme)}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {weekDays.map((day, i) => {
            const iso = toISO(day);
            const isToday = iso === todayStr;
            const isSel = iso === selectedDay;
            const cnt = (tasksByDate[iso] || []).filter(t => !t.completedAt).length;
            const doneHere = (tasksByDate[iso] || []).filter(t => t.completedAt).length;

            return (
              <button key={iso} onClick={() => setSelectedDay(iso)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '7px 2px', borderRadius: 10, cursor: 'pointer',
                background: isSel ? theme.text : isToday ? `${theme.text}18` : 'transparent',
                border: 'none', fontFamily: 'inherit', transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: 9, color: isSel ? theme.bg : theme.textSecondary, letterSpacing: '0.03em' }}>
                  {DAY_NAMES[i]}
                </span>
                <span style={{ fontSize: 15, fontWeight: isToday || isSel ? 700 : 400, color: isSel ? theme.bg : theme.text }}>
                  {day.getDate()}
                </span>
                {/* dot: active tasks */}
                <div style={{ height: 5, display: 'flex', gap: 2, alignItems: 'center' }}>
                  {cnt > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? theme.bg : '#E0833A' }} />}
                  {doneHere > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? `${theme.bg}88` : '#27ae60' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks for selected day */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {new Date(selectedDay + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {selectedTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>📅</p>
            <p style={{ fontSize: 14, color: theme.textSecondary }}>Bu gün için alışkanlık yok</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedTasks.map(task => {
              const done = !!task.completedAt;
              return (
                <button key={task.id} onClick={() => onOpenTask(task)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: theme.surface, borderRadius: 12, padding: '12px 14px',
                  border: `0.5px solid ${theme.border}`, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', width: '100%',
                  opacity: done ? 0.65 : 1,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: done ? '#27ae60' : '#E0833A',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: 14, fontWeight: 500, color: theme.text,
                      textDecoration: done ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{task.title}</p>
                    {task.dueTime && (
                      <p style={{ margin: 0, fontSize: 12, color: theme.textSecondary }}>{task.dueTime}</p>
                    )}
                  </div>
                  {done && <span style={{ fontSize: 11, color: '#27ae60', flexShrink: 0 }}>✓ bitti</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
function navBtn(theme) {
  return { background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 20, color: theme.text, padding: '2px 12px', fontFamily: 'inherit' };
}
