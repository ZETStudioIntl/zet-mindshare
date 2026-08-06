const DB_NAME = 'zet_notes';
const STORE = 'notes';
const VERSION = 1;

let _db = null;
let _currentUserId = null;

export function setCurrentNoteUserId(uid) { _currentUserId = uid; }

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'note_id' });
        store.createIndex('updated_at', 'updated_at');
        store.createIndex('notebook_id', 'notebook_id');
        store.createIndex('_dirty', '_dirty');
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export async function saveNote(note) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      ...note,
      updated_at: note.updated_at || new Date().toISOString(),
      _dirty: note._dirty ?? false,
      _local_only: note._local_only ?? false,
      _deleted: note._deleted ?? false,
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getNote(noteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(noteId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllNotes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      let notes = req.result || [];
      if (_currentUserId) notes = notes.filter(n => n.user_id === _currentUserId);
      notes = notes
        .filter(n => !n._deleted)
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      resolve(notes);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteNote(noteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(noteId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function markNoteDeleted(noteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.get(noteId);
    req.onsuccess = () => {
      if (!req.result) { resolve(); return; }
      store.put({ ...req.result, _deleted: true, _dirty: true });
    };
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingNotes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const pending = (req.result || []).filter(n => n._dirty || n._local_only || n._deleted);
      resolve(pending);
    };
    req.onerror = () => reject(req.error);
  });
}

// Sunucudan gelen notlarla yerel DB'yi birleştir.
// Kural: yerel dirty ise local kazanır; değilse sunucu updated_at daha yeni ise sunucu kazanır.
export async function mergeServerNotes(serverNotes) {
  const db = await openDB();
  for (const sn of serverNotes) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.get(sn.note_id);
      req.onsuccess = () => {
        const local = req.result;
        if (!local) {
          store.put({ ...sn, _dirty: false, _local_only: false, _deleted: false });
        } else if (!local._dirty && !local._local_only && !local._deleted) {
          const serverNewer = new Date(sn.updated_at) > new Date(local.updated_at || 0);
          if (serverNewer) store.put({ ...sn, _dirty: false, _local_only: false, _deleted: false });
        }
        // local dirty ise dokunma — sync kuyruğunda
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
}

export function generateNoteId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Bekleyen değişiklikleri sunucuya gönderir.
// Döndürür: Map<tempId, serverNoteId> — ID değişen notlar için swap haritası
export async function processSyncQueue(apiFn) {
  const pending = await getPendingNotes();
  const idSwaps = new Map();
  for (const note of pending) {
    try {
      if (note._local_only && !note._deleted) {
        const { _dirty, _local_only, _deleted, ...payload } = note;
        const res = await apiFn('post', payload);
        if (res.note_id && res.note_id !== note.note_id) {
          await deleteNote(note.note_id);
          await saveNote({ ...note, ...res, _dirty: false, _local_only: false, _deleted: false });
          idSwaps.set(note.note_id, res.note_id);
        } else {
          await saveNote({ ...note, _dirty: false, _local_only: false, _deleted: false });
        }
      } else if (note._deleted && !note._local_only) {
        await apiFn('delete', note);
        await deleteNote(note.note_id);
      } else if (note._dirty && !note._local_only && !note._deleted) {
        const { _dirty, _local_only, _deleted, ...payload } = note;
        await apiFn('put', payload);
        await saveNote({ ...note, _dirty: false });
      }
    } catch {
      // offline veya hata — bir sonraki sync'te tekrar dener
    }
  }
  return idSwaps;
}
