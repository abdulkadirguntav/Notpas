import { useState, useEffect } from 'react';

export function useNotes() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('np_notes') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('np_notes', JSON.stringify(notes));
  }, [notes]);

  function addNote({ title = '', body = '', folderId = null, dateStart = null } = {}) {
    const note = { id: Date.now().toString(), title, body, folderId, dateStart, createdAt: Date.now(), updatedAt: Date.now() };
    setNotes(prev => [note, ...prev]);
    return note;
  }

  function updateNote(id, changes) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n));
  }

  function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  return { notes, addNote, updateNote, deleteNote };
}
