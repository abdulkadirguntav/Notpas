import { registerPlugin } from '@capacitor/core';

// Native AlarmPlugin wrapper — schedules full-screen alarm activities via AlarmManager.
// Falls back gracefully on web/browser.
const AlarmPlugin = registerPlugin('AlarmPlugin', {
  web: {
    schedule: async () => {},
    cancel: async () => {},
  },
});

function hashId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deterministic numeric Android alarm ID from (taskId, slot)
function alarmIntId(taskId, slot) {
  return (hashId(taskId) % 1000000) * 200 + slot;
}

export async function scheduleFullScreenAlarm(taskId, title, body, atMs, slot = 0) {
  if (atMs <= Date.now()) return;
  try {
    await AlarmPlugin.schedule({
      alarmId: alarmIntId(taskId, slot),
      title,
      body,
      atMs,
    });
  } catch { /* browser / permission denied */ }
}

export async function cancelFullScreenAlarms(taskId, maxSlots = 200) {
  for (let i = 0; i < maxSlots; i++) {
    try { await AlarmPlugin.cancel({ alarmId: alarmIntId(taskId, i) }); } catch { break; }
  }
}

// Build an array of future Date objects for a repeating schedule (next `days` days).
// Used to compute slots for scheduleFullScreenAlarm.
export function buildOccurrences(repeatType, h, m, days = 14) {
  const results = [];
  const now = Date.now();
  for (let d = 0; d < days; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    if (dt.getTime() <= now) continue;
    const jsDay = dt.getDay(); // 0=Sun … 6=Sat
    if (repeatType === 'daily') {
      results.push(dt);
    } else if (repeatType === 'weekdays' && jsDay >= 1 && jsDay <= 5) {
      results.push(dt);
    } else if (repeatType === 'weekends' && (jsDay === 0 || jsDay === 6)) {
      results.push(dt);
    }
  }
  return results;
}
