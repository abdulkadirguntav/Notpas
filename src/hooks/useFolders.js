import { useState, useEffect } from 'react';
import { FOLDER_COLORS } from '../themes.js';

export function useFolders() {
  const [folders, setFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('np_folders') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('np_folders', JSON.stringify(folders));
  }, [folders]);

  function addFolder(name, color) {
    const assignedColor = color || FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    const folder = { id: Date.now().toString(), name, color: assignedColor, createdAt: Date.now() };
    setFolders(prev => [...prev, folder]);
    return folder;
  }

  function deleteFolder(id) {
    setFolders(prev => prev.filter(f => f.id !== id));
  }

  return { folders, addFolder, deleteFolder };
}
