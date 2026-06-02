import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from './useTasks.js';

const GRACE_MS = 2 * 60 * 60 * 1000; // 2 hours

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('np_score') || 'null');
    return s || { score: 0, streak: 0, maxStreak: 0, lastCompletedDay: null, log: [] };
  } catch {
    return { score: 0, streak: 0, maxStreak: 0, lastCompletedDay: null, log: [] };
  }
}

function saveState(s) {
  localStorage.setItem('np_score', JSON.stringify(s));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Smooth HSL transition: blue(0) → green(positive) → red(negative)
// Reaches full green/red at ±300 points, interpolates linearly between
export function scoreColor(score) {
  const MAX = 300;
  if (score >= 0) {
    const t = Math.min(score / MAX, 1);
    const hue = Math.round(220 - t * 100); // 220 (blue) → 120 (green)
    return `hsl(${hue}, ${Math.round(60 + t * 15)}%, ${Math.round(50 - t * 8)}%)`;
  }
  const t = Math.min(Math.abs(score) / MAX, 1);
  const hue = Math.round(220 - t * 220); // 220 (blue) → 0 (red)
  return `hsl(${hue}, ${Math.round(60 + t * 15)}%, ${Math.round(50 - t * 8)}%)`;
}

export function useScore() {
  const [state, setState] = useState(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const applyCompletion = useCallback((task) => {
    const cat = CATEGORIES[task.category] || CATEGORIES.important;
    const now = Date.now();
    const isLate = task.dueDate && task.dueTime
      ? now > new Date(`${task.dueDate}T${task.dueTime}`).getTime() + GRACE_MS
      : false;
    const earned = isLate ? Math.floor(cat.points / 2) : cat.points;
    const today = todayISO();

    setState(prev => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = prev.lastCompletedDay === yesterday || prev.lastCompletedDay === today
        ? (prev.lastCompletedDay === today ? prev.streak : prev.streak + 1)
        : 1;
      return {
        ...prev,
        score: prev.score + earned,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak || 0, newStreak),
        lastCompletedDay: today,
        log: [{ taskId: task.id, delta: earned, ts: now }, ...prev.log].slice(0, 500),
      };
    });

    return earned;
  }, []);

  const applyPenalty = useCallback((task) => {
    const cat = CATEGORIES[task.category] || CATEGORIES.important;
    setState(prev => ({
      ...prev,
      score: prev.score - cat.penalty,
      log: [{ taskId: task.id, delta: -cat.penalty, ts: Date.now() }, ...prev.log].slice(0, 200),
    }));
  }, []);

  const applyReversal = useCallback((points) => {
    setState(prev => ({ ...prev, score: prev.score - points }));
  }, []);

  const resetScore = useCallback(() => {
    setState({ score: 0, streak: 0, maxStreak: 0, lastCompletedDay: null, log: [] });
  }, []);

  return {
    score: state.score,
    streak: state.streak,
    maxStreak: state.maxStreak || 0,
    log: state.log || [],
    applyCompletion, applyPenalty, applyReversal, resetScore,
  };
}
