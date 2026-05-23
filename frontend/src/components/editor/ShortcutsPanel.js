import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';
import { TOOLS } from '../../lib/editorConstants';
import { Search } from 'lucide-react';

const ShortcutsPanel = () => {
  const {
    isMobile, showShortcuts, setShowShortcuts,
    shortcutSearch, setShortcutSearch, shortcuts,
    editingShortcut, setEditingShortcut, updateShortcut,
  } = useContext(EditorStateContext);
  if (!showShortcuts) return null;
  return (
    <DraggablePanel title="Keyboard Shortcuts" onClose={() => { setShowShortcuts(false); setShortcutSearch(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-80 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
          <input
            placeholder="Search tools..."
            value={shortcutSearch}
            onChange={(e) => setShortcutSearch(e.target.value)}
            className="zet-input pl-7 text-xs w-full"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {TOOLS.filter(tool => 
            !shortcutSearch || 
            tool.nameKey.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
            tool.id.toLowerCase().includes(shortcutSearch.toLowerCase())
          ).map(tool => {
            const currentKey = Object.keys(shortcuts).find(k => shortcuts[k] === tool.id);
            return (
              <div key={tool.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                <div className="flex items-center gap-2">
                  <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                  <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{tool.nameKey}</span>
                </div>
                {editingShortcut === tool.id ? (
                  <input autoFocus className="zet-input w-12 text-center text-xs font-mono" maxLength={1} onKeyDown={e => { if (e.key.length === 1) { updateShortcut(e.key); } else if (e.key === 'Escape') setEditingShortcut(null); }} onBlur={() => setEditingShortcut(null)} placeholder="?" />
                ) : (
                  <button onClick={() => setEditingShortcut(tool.id)} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--zet-bg-card)', color: currentKey ? 'var(--zet-primary)' : 'var(--zet-text-muted)' }}>{currentKey || '—'}</button>
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Click a key to edit. Press the new key to assign.</p>
          <p className="mt-1">Delete/Backspace: Delete selected element</p>
          <p>Escape: Deselect</p>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default ShortcutsPanel;
