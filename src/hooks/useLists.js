import { useState, useEffect } from 'react';

function load() {
  try { return JSON.parse(localStorage.getItem('np_lists') || '[]'); } catch { return []; }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useLists() {
  const [lists, setLists] = useState(load);
  useEffect(() => { localStorage.setItem('np_lists', JSON.stringify(lists)); }, [lists]);

  function addList(data) {
    const list = { id: newId(), rows: [], createdAt: Date.now(), ...data };
    setLists(p => [list, ...p]);
    return list;
  }

  function updateList(id, changes) {
    setLists(p => p.map(l => l.id === id ? { ...l, ...changes } : l));
  }

  function deleteList(id) {
    setLists(p => p.filter(l => l.id !== id));
  }

  function addRow(listId, data = {}) {
    const row = {
      id: newId(), title: '', status: null, rating: null,
      date: null, note: '', createdAt: Date.now(), ...data,
    };
    setLists(p => p.map(l => l.id === listId ? { ...l, rows: [...l.rows, row] } : l));
    return row;
  }

  function updateRow(listId, rowId, changes) {
    setLists(p => p.map(l =>
      l.id === listId
        ? { ...l, rows: l.rows.map(r => r.id === rowId ? { ...r, ...changes } : r) }
        : l
    ));
  }

  function deleteRow(listId, rowId) {
    setLists(p => p.map(l =>
      l.id === listId ? { ...l, rows: l.rows.filter(r => r.id !== rowId) } : l
    ));
  }

  return { lists, addList, updateList, deleteList, addRow, updateRow, deleteRow };
}
