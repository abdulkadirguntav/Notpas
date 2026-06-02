import { useState, useEffect } from 'react';

export const CATEGORIES = {
  urgent:    { id: 'urgent',    label: 'Acil',       color: '#E05858', points: 50,  penalty: 100 },
  important: { id: 'important', label: 'Önemli',     color: '#E0833A', points: 25,  penalty: 50  },
  trivial:   { id: 'trivial',   label: 'Tırı vırı',  color: '#4A8ABF', points: 10,  penalty: 20  },
};

// repeat: { type: 'once'|'daily'|'weekdays'|'everyN'|'timesPerDay', n?: number, count?: number }
function newTask(fields) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: '',
    category: 'important',
    repeat: { type: 'once' },
    dueDate: null,
    dueTime: null,
    reminder: false,
    completedAt: null,
    penalizedAt: null,
    pointsEarned: 0,
    createdAt: Date.now(),
    ...fields,
  };
}

function load() {
  try { return JSON.parse(localStorage.getItem('np_tasks') || '[]'); } catch { return []; }
}
function save(tasks) {
  localStorage.setItem('np_tasks', JSON.stringify(tasks));
}

export function useTasks() {
  const [tasks, setTasks] = useState(load);

  useEffect(() => { save(tasks); }, [tasks]);

  function addTask(fields = {}) {
    const t = newTask(fields);
    setTasks(prev => [t, ...prev]);
    return t;
  }

  function updateTask(id, changes) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function completeTask(id, pointsEarned = 0) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completedAt: Date.now(), pointsEarned } : t
    ));
  }

  function uncompleteTask(id) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completedAt: null, pointsEarned: 0 } : t
    ));
  }

  function penalizeTask(id) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, penalizedAt: Date.now() } : t
    ));
  }

  return { tasks, addTask, updateTask, deleteTask, completeTask, uncompleteTask, penalizeTask };
}
