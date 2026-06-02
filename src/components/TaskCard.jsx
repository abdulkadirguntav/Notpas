import { motion, useMotionValue, animate } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { CATEGORIES } from '../hooks/useTasks.js';

function formatDue(dueDate, dueTime) {
  if (!dueDate) return null;
  const d = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T00:00'));
  const now = new Date();
  const diff = d - now;
  const dayMs = 86400000;
  if (diff < 0) return { label: 'gecikti', late: true };
  if (diff < dayMs) return { label: dueTime ? dueTime : 'bugün', late: false };
  if (diff < 2 * dayMs) return { label: 'yarın', late: false };
  return { label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), late: false };
}

export default function TaskCard({ task, theme, onOpen, onComplete, onDelete }) {
  const x = useMotionValue(0);
  const cat = CATEGORIES[task.category] || CATEGORIES.important;
  const done = !!task.completedAt;
  const due = formatDue(task.dueDate, task.dueTime);

  const bind = useDrag(
    ({ active, movement: [mx], last }) => {
      if (active) x.set(Math.max(-120, Math.min(0, mx)));
      if (last) {
        if (mx < -80) { onDelete(task.id); }
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    { axis: 'x', filterTaps: true, threshold: 20 }
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: done ? 0.55 : 1, scale: 1 }}
      exit={{ opacity: 0, x: -60, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}
    >
      {/* Delete hint behind card */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        background: '#E05858', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 18,
      }}>🗑</div>

      <motion.div
        {...bind()}
        style={{ x, touchAction: 'pan-y', userSelect: 'none', cursor: 'pointer' }}
        onClick={() => onOpen(task)}
      >
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '11px 14px',
          background: theme.taskSurface || theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderLeft: `3px solid ${cat.color}`,
          borderRadius: 12,
        }}>
          {/* Checkbox — stopPropagation on both pointer and click so card doesn't open */}
          <button
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onComplete(task); }}
            onClick={e => e.stopPropagation()}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 0,
              border: `2px solid ${done ? cat.color : theme.border}`,
              background: done ? cat.color : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14,
              // Larger invisible tap area
              padding: 0, margin: '-3px 0',
            }}
          >{done ? '✓' : ''}</button>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: theme.text,
              textDecoration: done ? 'line-through' : 'none', lineHeight: 1.35,
            }}>{task.title || 'İsimsiz görev'}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10.5, fontWeight: 600, color: cat.color,
                background: `${cat.color}18`, borderRadius: 6, padding: '1px 6px',
              }}>{cat.label}</span>
              <span style={{ fontSize: 10.5, color: theme.textSecondary }}>+{cat.points}p</span>
              {due && (
                <span style={{ fontSize: 10.5, color: due.late ? '#E05858' : theme.textSecondary }}>
                  · {due.label}
                </span>
              )}
              {task.repeat?.type !== 'once' && (
                <span style={{ fontSize: 10.5, color: theme.textSecondary }}>· ↻</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
