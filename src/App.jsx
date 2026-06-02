import { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { THEMES, FOLDER_COLORS } from './themes.js';
import { useNotes } from './hooks/useNotes.js';
import { useFolders } from './hooks/useFolders.js';
import { useTasks } from './hooks/useTasks.js';
import { useScore, scoreColor } from './hooks/useScore.js';
import {
  scheduleFullScreenAlarm,
  cancelFullScreenAlarms,
  buildOccurrences,
} from './hooks/useAlarmPlugin.js';
import NoteCard from './components/NoteCard.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import FoldersPanel from './components/FoldersPanel.jsx';
import CalendarPanel from './components/CalendarPanel.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import SearchBar from './components/SearchBar.jsx';
import TaskEditor from './components/TaskEditor.jsx';
import TodayScreen from './components/TodayScreen.jsx';
import StatsScreen from './components/StatsScreen.jsx';
import ListsPanel from './components/ListsPanel.jsx';
import WeeklyCalendar from './components/WeeklyCalendar.jsx';

const slideUp = {
  initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' },
  transition: { type: 'spring', stiffness: 350, damping: 35 },
};

const GRACE_MS = 2 * 60 * 60 * 1000;
const NOTIF_CHANNEL_ID = 'notpas_reminder';

// ── LocalNotifications channel (soft reminder, X dk önce) ─────────────────────
async function ensureReminderChannel() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: NOTIF_CHANNEL_ID,
      name: 'Notpas Hatırlatmalar',
      description: 'X dakika önce gelen bildirim',
      importance: 4,
      sound: 'default',
      vibration: true,
    });
  } catch { /* web */ }
}

function notifId(taskId, slot) {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) h = ((h << 5) - h + taskId.charCodeAt(i)) | 0;
  return (Math.abs(h) % 500000) * 200 + slot;
}

function pad(n) { return String(n).padStart(2, '0'); }

function nextWeekdayDate(h, m, targetJsDay) {
  const d = new Date();
  const cur = d.getDay();
  let diff = targetJsDay - cur;
  if (diff < 0) diff += 7;
  if (diff === 0 && (d.getHours() > h || (d.getHours() === h && d.getMinutes() >= m))) diff = 7;
  d.setDate(d.getDate() + diff);
  d.setHours(h, m, 0, 0);
  return d;
}

function buildNextDailyDate(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d;
}

// ── Two-layer notification scheduling ─────────────────────────────────────────
// Layer 1: LocalNotifications → soft reminder X min before alarm time
// Layer 2: AlarmPlugin → full-screen alarm at exact time
async function scheduleTaskNotifications(task) {
  const { id, reminder, reminderBefore = 15, repeat, dueDate, dueTime, dayTimes } = task;
  const type = repeat?.type || 'once';

  // Cancel previous soft reminders for this task
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const cancelIds = Array.from({ length: 200 }, (_, i) => ({ id: notifId(id, i) }));
    await LocalNotifications.cancel({ notifications: cancelIds }).catch(() => {});
  } catch { /* web */ }

  // Cancel previous full-screen alarms
  await cancelFullScreenAlarms(id);

  if (!dueTime && !dayTimes?.length && !dueDate) return;

  const softNotifs = [];
  let alarmSlot = 0;

  async function addPair(alarmAt, slotBase, label) {
    // Full-screen alarm at exact time
    await scheduleFullScreenAlarm(id, task.title, label, alarmAt.getTime(), alarmSlot++);

    // Soft reminder X min before
    if (reminder && reminderBefore > 0) {
      const remAt = new Date(alarmAt.getTime() - reminderBefore * 60_000);
      if (remAt > new Date()) {
        const minLabel = reminderBefore < 60
          ? `${reminderBefore} dakika`
          : reminderBefore < 1440
          ? `${reminderBefore / 60} saat`
          : '1 gün';
        softNotifs.push({
          id: notifId(id, slotBase),
          title: task.title,
          body: `${minLabel} içinde!`,
          channelId: NOTIF_CHANNEL_ID,
          schedule: { at: remAt, allowWhileIdle: true },
        });
      }
    }
  }

  if (type === 'timesPerDay' && dayTimes?.length) {
    let slot = 0;
    for (const timeStr of dayTimes) {
      const [h, m] = timeStr.split(':').map(Number);
      // Schedule next 14 days for each time
      const occurrences = buildOccurrences('daily', h, m, 14);
      for (const at of occurrences) {
        await addPair(at, slot * 20, `${timeStr} alarmı`);
        slot++;
      }
    }
  } else if (type === 'daily' && dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    const occurrences = buildOccurrences('daily', h, m, 14);
    for (let i = 0; i < occurrences.length; i++) {
      await addPair(occurrences[i], i * 2, 'Günlük alarm');
    }
  } else if (type === 'weekdays' && dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    const occurrences = buildOccurrences('weekdays', h, m, 14);
    for (let i = 0; i < occurrences.length; i++) {
      await addPair(occurrences[i], i * 2, 'Hafta içi alarm');
    }
  } else if (type === 'weekends' && dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    const occurrences = buildOccurrences('weekends', h, m, 14);
    for (let i = 0; i < occurrences.length; i++) {
      await addPair(occurrences[i], i * 2, 'Haftasonu alarm');
    }
  } else if (dueDate) {
    const timeStr = dueTime || '09:00';
    const [h, m] = timeStr.split(':').map(Number);
    const at = new Date(`${dueDate}T${pad(h)}:${pad(m)}:00`);
    if (at > new Date()) {
      await addPair(at, 0, 'Alarm vakti');
    }
  }

  if (softNotifs.length) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        await ensureReminderChannel();
        await LocalNotifications.schedule({ notifications: softNotifs });
      }
    } catch { /* web */ }
  }
}

async function cancelTaskNotifications(taskId) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const ids = Array.from({ length: 200 }, (_, i) => ({ id: notifId(taskId, i) }));
    await LocalNotifications.cancel({ notifications: ids }).catch(() => {});
  } catch { /* web */ }
  await cancelFullScreenAlarms(taskId);
}

// ── Back-button handler (Android) ─────────────────────────────────────────────
function useBackButton(screen, setScreen) {
  useEffect(() => {
    let cleanup = () => {};
    import('@capacitor/app').then(({ App }) => {
      const handler = App.addListener('backButton', () => {
        if (screen !== 'main') setScreen('main');
      });
      cleanup = () => handler.then(h => h.remove()).catch(() => {});
    }).catch(() => {});
    return () => cleanup();
  }, [screen, setScreen]);
}

export default function App() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('np_theme') || 'light');
  const theme = THEMES[themeId] || THEMES.light;

  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { folders, addFolder, deleteFolder } = useFolders();
  const { tasks, addTask, updateTask, deleteTask, completeTask, uncompleteTask, penalizeTask } = useTasks();
  const { score, streak, maxStreak, log, applyCompletion, applyPenalty, applyReversal, resetScore } = useScore();

  const [screen, setScreen] = useState('main');
  const [editingNote, setEditingNote] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [actionNoteId, setActionNoteId] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [listsOpen, setListsOpen] = useState(false);
  const [weekCalOpen, setWeekCalOpen] = useState(false);

  // ── Android back button ──────────────────────────────────────────────────
  useBackButton(screen, setScreen);

  useEffect(() => {
    let cleanup = () => {};
    import('@capacitor/app').then(({ App }) => {
      const h = App.addListener('backButton', () => {
        if (listsOpen) { setListsOpen(false); return; }
        if (weekCalOpen) { setWeekCalOpen(false); }
      });
      cleanup = () => h.then(r => r.remove()).catch(() => {});
    }).catch(() => {});
    return () => cleanup();
  }, [listsOpen, weekCalOpen]);

  // ── Init notification channel ────────────────────────────────────────────
  useEffect(() => { ensureReminderChannel(); }, []);

  // ── Penalty system ───────────────────────────────────────────────────────
  useEffect(() => {
    const now = Date.now();
    tasks.forEach(task => {
      if (task.completedAt || task.penalizedAt || !task.dueDate) return;
      const deadline = new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`).getTime();
      if (now > deadline + GRACE_MS) {
        applyPenalty(task);
        penalizeTask(task.id);
      }
    });
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search ───────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  function changeTheme(id) {
    setThemeId(id);
    localStorage.setItem('np_theme', id);
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  function openNewNote() {
    setFabOpen(false);
    const note = addNote();
    setEditingNote(note);
    setScreen('editor');
  }

  function openNote(note) {
    setEditingNote(note);
    setScreen('editor');
  }

  function saveNote({ title, body, color, images }) {
    if (editingNote) updateNote(editingNote.id, { title, body, color, images });
    setScreen('main');
    setEditingNote(null);
  }

  function handleDeleteNote() {
    if (editingNote) deleteNote(editingNote.id);
    setScreen('main');
    setEditingNote(null);
  }

  function handleDeleteFolder(folderId) {
    notes.filter(n => n.folderId === folderId).forEach(n => updateNote(n.id, { folderId: null }));
    deleteFolder(folderId);
    if (activeFolderId === folderId) setActiveFolderId(null);
  }

  function handleDragEnd({ noteId, direction }) {
    if (!direction) return;
    setActionNoteId(noteId);
    setScreen(direction === 'left' ? 'folders' : 'calendar');
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  function openNewTask() {
    setFabOpen(false);
    const t = addTask();
    setEditingTask(t);
    setScreen('taskEditor');
  }

  function openTask(task) {
    setEditingTask(task);
    setScreen('taskEditor');
  }

  async function saveTask(fields) {
    if (editingTask) {
      updateTask(editingTask.id, fields);
      await scheduleTaskNotifications({ ...editingTask, ...fields });
    }
    setScreen('main');
    setEditingTask(null);
  }

  async function handleDeleteTask() {
    if (editingTask) {
      await cancelTaskNotifications(editingTask.id);
      deleteTask(editingTask.id);
    }
    setScreen('main');
    setEditingTask(null);
  }

  function handleComplete(task) {
    if (task.completedAt) {
      if (task.pointsEarned) applyReversal(task.pointsEarned);
      uncompleteTask(task.id);
    } else {
      const earned = applyCompletion(task);
      completeTask(task.id, earned);
    }
  }

  // ── Swipe gesture ─────────────────────────────────────────────────────────
  const touchStart = useRef(null);

  function getScrollParent(el) {
    while (el && el !== document.documentElement) {
      const oy = window.getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 4) return el;
      el = el.parentElement;
    }
    return null;
  }

  function handleTouchStart(e) {
    if (screen !== 'main' || listsOpen || weekCalOpen) return;
    if (e.target.closest('[data-hscroll]')) return;
    const sp = getScrollParent(e.target);
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollTop: sp ? sp.scrollTop : 0,
      scrollMax: sp ? Math.max(0, sp.scrollHeight - sp.clientHeight) : 0,
    };
  }

  function handleTouchEnd(e) {
    if (screen !== 'main' || listsOpen || weekCalOpen || !touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const { scrollTop, scrollMax } = touchStart.current;
    touchStart.current = null;

    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    if (absDx > absDy * 1.5 && absDx > 70) {
      if (dx < 0 && activeTab === 'notes') setActiveTab('tasks');
      if (dx > 0 && activeTab === 'tasks') setActiveTab('notes');
      return;
    }

    if (absDy > absDx * 1.5 && absDy > 90) {
      const atTop    = scrollTop < 8;
      const atBottom = scrollMax < 8 || scrollTop >= scrollMax - 8;
      if (dy > 0 && atTop)    { setListsOpen(true);  return; }
      if (dy < 0 && atBottom) { setWeekCalOpen(true); return; }
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleNotes = activeFolderId === null
    ? notes.filter(n => !n.folderId)
    : notes.filter(n => n.folderId === activeFolderId);

  const activeFolder = folders.find(f => f.id === activeFolderId);
  const editingNoteLatest = editingNote ? (notes.find(n => n.id === editingNote.id) || editingNote) : null;
  const editingTaskLatest = editingTask ? (tasks.find(t => t.id === editingTask.id) || editingTask) : null;
  const actionNote = actionNoteId ? notes.find(n => n.id === actionNoteId) : null;
  const activeTasks = tasks.filter(t => !t.completedAt);
  const sc = scoreColor(score);

  return (
    <div
      style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        background: theme.bg, position: 'relative', overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        transition: 'background 0.25s',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `0.5px solid ${theme.border}`, background: theme.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeFolderId && (
              <button onClick={() => setActiveFolderId(null)} style={iconBtn(theme)}>←</button>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  {activeFolderId ? activeFolder?.name : 'notpas'}
                </h1>
                <button
                  onClick={() => setScreen('stats')}
                  style={{
                    fontSize: 12, fontWeight: 700, color: sc,
                    border: `1.5px solid ${sc}`, borderRadius: 8,
                    padding: '1px 6px', letterSpacing: '-0.2px',
                    transition: 'color 0.6s, border-color 0.6s',
                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{score > 0 ? '+' : ''}{score}</button>
                {streak > 1 && (
                  <span style={{ fontSize: 12, color: theme.textSecondary }}>🔥{streak}</span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: theme.textSecondary }}>
                {activeTab === 'notes' ? `${visibleNotes.length} not` : `${activeTasks.length} aktif görev`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {activeTab === 'notes' && (
              <button onClick={() => { setSearchOpen(s => !s); setSearchQuery(''); }} style={iconBtn(theme)}>⌕</button>
            )}
            {activeTab === 'tasks' && (
              <button onClick={() => setWeekCalOpen(true)} style={iconBtn(theme)}>▦</button>
            )}
            <button onClick={() => setScreen('settings')} style={iconBtn(theme)}>⚙</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', marginTop: 10 }}>
          {[{ id: 'notes', label: 'Notlar' }, { id: 'tasks', label: 'Alışkanlıklar' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '7px 0', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? theme.text : 'transparent'}`,
              color: activeTab === tab.id ? theme.text : theme.textSecondary,
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.15s, border-color 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && activeTab === 'notes' && (
          <SearchBar
            theme={theme}
            query={searchQuery}
            onChange={setSearchQuery}
            results={searchResults}
            folders={folders}
            onOpenNote={note => { setEditingNote(note); setScreen('editor'); }}
            onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
          />
        )}
      </AnimatePresence>

      {/* Folder tabs */}
      {activeTab === 'notes' && folders.length > 0 && !activeFolderId && (
        <div style={{ position: 'relative', borderBottom: `0.5px solid ${theme.border}`, background: theme.surface }}>
          <div data-hscroll="1" style={{
            display: 'flex', gap: 6, padding: '10px 14px 6px',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin', scrollbarColor: `${theme.border} transparent`,
          }}>
            {folders.map(f => {
              const color = f.color || FOLDER_COLORS[0];
              return (
                <button key={f.id} onClick={() => setActiveFolderId(f.id)} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 20,
                  border: `0.5px solid ${theme.border}`,
                  background: 'transparent', color: theme.textSecondary,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                  {f.name}
                  <span style={{ fontSize: 10, background: theme.border, borderRadius: 10, padding: '1px 5px' }}>
                    {notes.filter(n => n.folderId === f.id).length}
                  </span>
                </button>
              );
            })}
            <div style={{ width: 14, flexShrink: 0 }} />
          </div>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 32,
            background: `linear-gradient(to right, transparent, ${theme.surface})`,
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Notes list */}
      {activeTab === 'notes' && (
        <div style={{ padding: '14px 24px 100px' }}>
          {visibleNotes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>✦</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: theme.text, margin: '0 0 6px' }}>Henüz not yok</p>
              <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>Aşağıdaki + butonuna bas</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {visibleNotes.map(note => (
                <NoteCard
                  key={note.id} note={note} theme={theme}
                  folder={folders.find(f => f.id === note.folderId)}
                  onOpen={openNote} onDragEnd={handleDragEnd}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tasks list */}
      {activeTab === 'tasks' && (
        <TodayScreen
          tasks={tasks}
          theme={theme}
          onOpenTask={openTask}
          onComplete={handleComplete}
          onDelete={deleteTask}
        />
      )}

      {/* FAB */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed', bottom: 96,
              right: 'max(20px, calc(50vw - 195px))',
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
              zIndex: 19,
            }}
          >
            <button onClick={openNewNote} style={fabMenuItem(theme)}>📝 Yeni Not</button>
            <button onClick={openNewTask} style={fabMenuItem(theme)}>✓ Yeni Alışkanlık</button>
            <button onClick={() => { setFabOpen(false); setListsOpen(true); }} style={fabMenuItem(theme)}>📋 Listeler</button>
          </motion.div>
        )}
      </AnimatePresence>

      {fabOpen && (
        <div onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 18 }} />
      )}

      <button
        onClick={() => setFabOpen(o => !o)}
        aria-label="Ekle"
        style={{
          position: 'fixed', bottom: 28,
          right: 'max(20px, calc(50vw - 195px))',
          width: 54, height: 54, borderRadius: '50%',
          background: theme.fab, color: theme.fabText,
          border: 'none', cursor: 'pointer', fontSize: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.22)', zIndex: 20,
          transition: 'transform 0.2s',
          transform: fabOpen ? 'rotate(45deg)' : 'none',
        }}
      >+</button>

      {/* ── Overlays ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {screen === 'editor' && editingNoteLatest && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <NoteEditor note={editingNoteLatest} theme={theme} onSave={saveNote} onDelete={handleDeleteNote} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'taskEditor' && editingTaskLatest && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <TaskEditor task={editingTaskLatest} theme={theme} onSave={saveTask} onDelete={handleDeleteTask} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'folders' && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <FoldersPanel
              folders={folders} notes={notes} theme={theme}
              assignedFolderId={actionNote?.folderId || null}
              onAssign={folderId => updateNote(actionNoteId, { folderId })}
              onAddFolder={addFolder}
              onDeleteFolder={handleDeleteFolder}
              onClose={() => { setScreen('main'); setActionNoteId(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'calendar' && actionNote && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <CalendarPanel
              theme={theme} note={actionNote}
              onSave={({ dateStart, dateEnd }) => {
                updateNote(actionNoteId, { dateStart, dateEnd });
                setScreen('main');
                setActionNoteId(null);
              }}
              onClose={() => { setScreen('main'); setActionNoteId(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'settings' && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <SettingsScreen
              theme={theme} themeId={themeId}
              onThemeChange={changeTheme}
              onResetScore={resetScore}
              onClose={() => setScreen('main')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === 'stats' && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
            <StatsScreen
              theme={theme} tasks={tasks}
              score={score} streak={streak} maxStreak={maxStreak} log={log}
              onClose={() => setScreen('main')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {listsOpen && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 55 }}>
            <ListsPanel theme={theme} onClose={() => setListsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {weekCalOpen && (
          <motion.div {...slideUp} style={{ position: 'absolute', inset: 0, zIndex: 55 }}>
            <WeeklyCalendar
              theme={theme} tasks={tasks}
              onClose={() => setWeekCalOpen(false)}
              onOpenTask={task => { setEditingTask(task); setWeekCalOpen(false); setScreen('taskEditor'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function iconBtn(theme) {
  return {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 18, color: theme.textSecondary, padding: '6px',
    fontFamily: 'inherit', borderRadius: 8,
  };
}

function fabMenuItem(theme) {
  return {
    padding: '10px 18px', borderRadius: 20,
    background: theme.surface, border: `0.5px solid ${theme.border}`,
    color: theme.text, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
  };
}
