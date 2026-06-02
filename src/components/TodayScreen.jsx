import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard.jsx';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function weekFromNow() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function SectionHeader({ label, theme }) {
  return (
    <p style={{
      margin: '18px 0 6px', fontSize: 11, fontWeight: 600,
      color: theme.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>{label}</p>
  );
}

export default function TodayScreen({ tasks, theme, onOpenTask, onComplete, onDelete }) {
  const today = todayISO();
  const nextWeek = weekFromNow();

  const { overdue, todayTasks, weekTasks, later, noDate, completed } = useMemo(() => {
    const active = tasks.filter(t => !t.completedAt);
    const isRecurring = t => t.repeat?.type !== 'once';
    return {
      overdue:    active.filter(t => t.dueDate && t.dueDate < today),
      todayTasks: active.filter(t => t.dueDate === today || (!t.dueDate && isRecurring(t))),
      weekTasks:  active.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= nextWeek),
      later:      active.filter(t => t.dueDate && t.dueDate > nextWeek),
      noDate:     active.filter(t => !t.dueDate && !isRecurring(t)),
      completed:  tasks.filter(t => t.completedAt)
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 30),
    };
  }, [tasks, today, nextWeek]);

  const totalActive = overdue.length + todayTasks.length + weekTasks.length + later.length + noDate.length;

  if (totalActive === 0 && completed.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ fontSize: 40, margin: '0 0 12px' }}>✦</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: theme.text, margin: '0 0 6px' }}>Görev yok</p>
        <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>Aşağıdaki + ile ekle</p>
      </div>
    );
  }

  const taskList = (group) => (
    <AnimatePresence>
      {group.map(t => (
        <TaskCard key={t.id} task={t} theme={theme} onOpen={onOpenTask} onComplete={onComplete} onDelete={onDelete} />
      ))}
    </AnimatePresence>
  );

  return (
    <div style={{ padding: '4px 16px 100px' }}>
      {overdue.length > 0 && (
        <>
          <SectionHeader label="⚠ Gecikmiş" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(overdue)}</div>
        </>
      )}
      {todayTasks.length > 0 && (
        <>
          <SectionHeader label="Bugün" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(todayTasks)}</div>
        </>
      )}
      {weekTasks.length > 0 && (
        <>
          <SectionHeader label="Bu Hafta" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(weekTasks)}</div>
        </>
      )}
      {later.length > 0 && (
        <>
          <SectionHeader label="Yakında" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(later)}</div>
        </>
      )}
      {noDate.length > 0 && (
        <>
          <SectionHeader label="Tarihlenmemiş" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(noDate)}</div>
        </>
      )}
      {completed.length > 0 && (
        <>
          <SectionHeader label="Tamamlananlar" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{taskList(completed)}</div>
        </>
      )}
    </div>
  );
}
