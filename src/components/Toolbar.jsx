import { motion } from 'framer-motion';

const ITEMS = [
  { label: 'B', format: 'bold', style: { fontWeight: 800 } },
  { label: 'İ', format: 'italic', style: { fontStyle: 'italic' } },
  { label: '—', format: 'dash', style: {} },
  { label: '☐', format: 'checkbox', style: { fontSize: 16 } },
];

export default function Toolbar({ theme, onFormat, bottomOffset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.14 }}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: 'max(0px, calc(50vw - 215px))',
        right: 'max(0px, calc(50vw - 215px))',
        background: theme.surface,
        borderTop: `0.5px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        gap: 4,
        zIndex: 80,
      }}
    >
      {ITEMS.map(({ label, format, style }) => (
        <button
          key={format}
          onPointerDown={e => { e.preventDefault(); onFormat(format); }}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: `0.5px solid ${theme.border}`,
            background: 'transparent',
            color: theme.text,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            ...style,
          }}
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}
