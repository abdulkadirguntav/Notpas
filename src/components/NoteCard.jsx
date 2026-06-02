import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, animate } from 'framer-motion';

const PANEL_WIDTH = 250;

export const NOTE_COLORS = [null, '#E05858', '#E0833A', '#C9A82C', '#4AAF68', '#4A8ABF', '#9B6AC4'];

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'bugün';
  if (diff === 1) return 'dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function NoteCard({ note, theme, folder, onOpen, onDragEnd }) {
  const x = useMotionValue(0);
  const images = note.images || [];
  const accent = note.color || null;

  const bind = useDrag(
    ({ active, movement: [mx], xy, last }) => {
      if (active) {
        x.set(Math.min(PANEL_WIDTH, Math.max(-PANEL_WIDTH, mx)));
      }
      if (last) {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        onDragEnd?.({ noteId: note.id, direction: mx < -40 ? 'left' : mx > 40 ? 'right' : null, pointerXY: xy });
      }
    },
    { axis: 'x', filterTaps: true, threshold: 25 }
  );

  const preview = note.body?.replace(/\n+/g, ' ').slice(0, 100) || '';
  const cardBg = accent ? hexAlpha(accent, 0.07) : theme.surface;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    >
      <motion.div
        {...bind()}
        style={{
          x,
          background: cardBg,
          border: `0.5px solid ${theme.border}`,
          borderLeft: accent ? `3px solid ${accent}` : `0.5px solid ${theme.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          touchAction: 'pan-y',
          userSelect: 'none',
          cursor: 'pointer',
          willChange: 'transform',
        }}
        whileDrag={{ boxShadow: '0 10px 36px rgba(0,0,0,0.18)' }}
        onClick={() => onOpen(note)}
      >
        {/* Image strip */}
        {images.length > 0 && (
          <div style={{ display: 'flex', height: images.length === 1 ? 130 : 90, overflow: 'hidden' }}>
            {images.slice(0, 3).map((img, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRight: i < Math.min(images.length, 3) - 1 ? `2px solid ${theme.bg}` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '12px 14px 11px' }}>
          {note.title ? (
            <p style={{
              margin: '0 0 5px', fontSize: 14, fontWeight: 700,
              color: theme.text, lineHeight: 1.35,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {note.title}
            </p>
          ) : null}
          {preview ? (
            <p style={{
              margin: '0 0 9px', fontSize: 12.5, color: theme.textSecondary,
              lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {preview}{note.body.length > 100 ? '…' : ''}
            </p>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, color: theme.textSecondary }}>{formatDate(note.updatedAt)}</span>
            {folder && <span style={{ fontSize: 10.5, color: accent || theme.textSecondary }}>· {folder.name}</span>}
            {note.dateStart && (
              <span style={{ fontSize: 10.5, color: theme.accent }}>
                · {note.dateStart}{note.dateEnd ? ` – ${note.dateEnd}` : ''}
              </span>
            )}
            {images.length > 0 && <span style={{ fontSize: 10.5, color: theme.textSecondary }}>· {images.length} görsel</span>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
