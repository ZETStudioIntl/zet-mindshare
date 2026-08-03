const DB_NAME = 'zet_history';
const UNDO_STORE = 'undo_stacks';   // key: `${docId}_${pageIndex}`
const VERSIONS_STORE = 'doc_versions'; // key: docId → array of snapshots
const DB_VERSION = 1;
const MAX_VERSIONS = 20;
const MAX_UNDO_PERSIST = 20;        // bellekte 50, disk'te 20
const VERSION_INTERVAL_MS = 5 * 60 * 1000; // en fazla 5dk'da bir versiyon

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(UNDO_STORE)) db.createObjectStore(UNDO_STORE);
      if (!db.objectStoreNames.contains(VERSIONS_STORE)) db.createObjectStore(VERSIONS_STORE);
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// === UNDO STACK ===

export async function saveUndoStack(docId, pageIndex, serializeData) {
  if (!docId) return;
  const { stack, index } = serializeData;
  const trimmed = stack.slice(-MAX_UNDO_PERSIST); // son MAX_UNDO_PERSIST durumu tut
  const adjustedIndex = Math.min(index, trimmed.length - 1);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UNDO_STORE, 'readwrite');
    tx.objectStore(UNDO_STORE).put({ stack: trimmed, index: adjustedIndex }, `${docId}_${pageIndex}`);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadUndoStack(docId, pageIndex) {
  if (!docId) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UNDO_STORE, 'readonly');
    const req = tx.objectStore(UNDO_STORE).get(`${docId}_${pageIndex}`);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// === VERSION HISTORY ===

export async function saveDocVersion(docId, title, pages, settings) {
  if (!docId) return;
  const lsKey = `zet_last_version_${docId}`;
  const lastSaved = Number(localStorage.getItem(lsKey) || 0);
  if (Date.now() - lastSaved < VERSION_INTERVAL_MS) return; // çok yakın zamanda kaydedildi

  const db = await openDB();
  const existing = await getDocVersions(docId);
  const snapshot = { title, pages, settings, saved_at: new Date().toISOString() };
  const updated = [snapshot, ...existing].slice(0, MAX_VERSIONS);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(VERSIONS_STORE, 'readwrite');
    tx.objectStore(VERSIONS_STORE).put(updated, docId);
    tx.oncomplete = () => {
      localStorage.setItem(lsKey, String(Date.now()));
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDocVersions(docId) {
  if (!docId) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VERSIONS_STORE, 'readonly');
    const req = tx.objectStore(VERSIONS_STORE).get(docId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getDocVersion(docId, index) {
  const versions = await getDocVersions(docId);
  return versions[index] || null;
}
