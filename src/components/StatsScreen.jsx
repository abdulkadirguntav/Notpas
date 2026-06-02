import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';
import { CATEGORIES } from '../hooks/useTasks.js';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function StatsScreen({ theme, tasks, score, streak, maxStreak, log, onClose }) {

  // ── Weekly chart data (last 7 days) ──────────────────────
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      const delta = log
        .filter(e => new Date(e.ts).toISOString().slice(0, 10) === iso)
        .reduce((s, e) => s + e.delta, 0);
      return {
        gun: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        puan: delta,
      };
    });
  }, [log]);

  // ── Category breakdown ────────────────────────────────────
  const today = todayISO();
  const catStats = useMemo(() => Object.values(CATEGORIES).map(cat => {
    const catTasks = tasks.filter(t => t.category === cat.id);
    const completed = catTasks.filter(t => t.completedAt).length;
    const missed = catTasks.filter(t => !t.completedAt && t.dueDate && t.dueDate < today).length;
    return { cat, completed, missed, total: catTasks.length };
  }), [tasks, today]);

  // ── Most productive day ───────────────────────────────────
  const bestDay = useMemo(() => {
    const counts = {};
    tasks.filter(t => t.completedAt).forEach(t => {
      const name = new Date(t.completedAt).toLocaleDateString('tr-TR', { weekday: 'long' });
      counts[name] = (counts[name] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [tasks]);

  const totalCompleted = tasks.filter(t => t.completedAt).length;
  const totalMissed = tasks.filter(t => !t.completedAt && t.dueDate && t.dueDate < today).length;

  const lineColor = score >= 0 ? '#4AAF68' : '#E05858';

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 16px',
        borderBottom: `0.5px solid ${theme.border}`, background: theme.surface, flexShrink: 0,
      }}>
        <button onClick={onClose} style={ghostBtn(theme)}>← geri</button>
        <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 700, color: theme.text }}>İstatistikler</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 40px' }}>

        {/* Weekly chart */}
        <p style={sectionLabel(theme)}>Bu Haftaki Puan Değişimi</p>
        <div style={{
          background: theme.surface, borderRadius: 14, padding: '16px 4px 8px',
          border: `0.5px solid ${theme.border}`, marginBottom: 16,
        }}>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="gun"
                tick={{ fontSize: 11, fill: theme.textSecondary, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <ReferenceLine y={0} stroke={theme.border} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  background: theme.surface, border: `0.5px solid ${theme.border}`,
                  borderRadius: 8, fontSize: 12, color: theme.text, fontFamily: 'inherit',
                }}
                formatter={v => [`${v > 0 ? '+' : ''}${v}p`, 'Puan']}
                labelStyle={{ color: theme.textSecondary }}
              />
              <Line
                type="monotone" dataKey="puan"
                stroke={lineColor} strokeWidth={2}
                dot={{ fill: lineColor, r: 3 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stat cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatCard theme={theme} label="Toplam Tamamlanan" value={totalCompleted} unit="görev" />
          <StatCard theme={theme} label="Kaçırılan" value={totalMissed} unit="görev" valueColor="#E05858" />
          <StatCard theme={theme} label="Mevcut Seri" value={streak} unit="gün" />
          <StatCard theme={theme} label="En Uzun Seri" value={maxStreak} unit="gün" />
        </div>

        {bestDay && (
          <div style={{
            background: theme.surface, borderRadius: 14, padding: '14px 16px',
            border: `0.5px solid ${theme.border}`, marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>En Üretken Gün</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}>
              {bestDay[0]}
              <span style={{ fontSize: 13, fontWeight: 400, color: theme.textSecondary, marginLeft: 8 }}>{bestDay[1]} görev</span>
            </p>
          </div>
        )}

        {/* Category breakdown */}
        <p style={sectionLabel(theme)}>Kategoriye Göre</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {catStats.map(({ cat, completed, missed, total }) => (
            <div key={cat.id} style={{
              background: theme.surface, borderRadius: 12, padding: '12px 14px',
              border: `0.5px solid ${theme.border}`,
              borderLeft: `3px solid ${cat.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{cat.label}</span>
                <span style={{ fontSize: 12, color: theme.textSecondary }}>{total} toplam</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 13, color: '#4AAF68' }}>✓ {completed} tamamlandı</span>
                {missed > 0 && <span style={{ fontSize: 13, color: '#E05858' }}>✗ {missed} kaçırıldı</span>}
              </div>
              {/* Progress bar */}
              {total > 0 && (
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: theme.border, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(completed / total) * 100}%`,
                    background: cat.color,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ theme, label, value, unit, valueColor }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: 14, padding: '14px',
      border: `0.5px solid ${theme.border}`,
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: valueColor || theme.text, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 12, fontWeight: 400, color: theme.textSecondary, marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  );
}

function sectionLabel(theme) {
  return { margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' };
}
function ghostBtn(theme) {
  return { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: theme.textSecondary, fontFamily: 'inherit', padding: '4px 0' };
}
