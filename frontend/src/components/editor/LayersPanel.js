import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

const LayersPanel = () => {
  const {
    isMobile, showLayers, setShowLayers,
    canvasElements, setCanvasElements, selectedElement, setSelectedElement,
    history, toggleLayerVisibility, toggleLayerLock,
    moveLayerUp, moveLayerDown, deleteElement,
  } = useContext(EditorStateContext);
  if (!showLayers) return null;
  return (
    <DraggablePanel title="Layers" onClose={() => setShowLayers(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-64 space-y-1 max-h-80 overflow-y-auto">
        {[...canvasElements].reverse().map((el, i) => (
          <div key={el.id} data-testid={`layer-item-${el.id}`}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', el.id); e.currentTarget.style.opacity = '0.4'; }}
            onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderTop = '2px solid #4ca8ad'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderTop = 'none'; }}
            onDrop={(e) => {
              e.preventDefault(); e.currentTarget.style.borderTop = 'none';
              const dragId = e.dataTransfer.getData('text/plain');
              if (dragId === el.id) return;
              const updated = [...canvasElements];
              const fromIdx = updated.findIndex(x => x.id === dragId);
              const toIdx = updated.findIndex(x => x.id === el.id);
              if (fromIdx === -1 || toIdx === -1) return;
              const [moved] = updated.splice(fromIdx, 1);
              updated.splice(toIdx, 0, moved);
              setCanvasElements(updated); history.push(updated);
            }}
            className={`flex items-center justify-between p-2 rounded text-xs cursor-grab active:cursor-grabbing ${selectedElement === el.id ? 'ring-1 ring-blue-500' : ''}`} style={{ background: 'var(--zet-bg)' }} onClick={() => setSelectedElement(el.id)}>
            <div className="flex items-center gap-2 truncate flex-1">
              <span className="w-4 text-center" style={{ color: 'var(--zet-text-muted)' }}>{canvasElements.length - i}</span>
              <span className="truncate" style={{ color: el.hidden ? 'var(--zet-text-muted)' : 'var(--zet-text)' }}>{el.type === 'text' ? (el.content?.slice(0, 20) || 'Text') : el.type === 'table' ? 'Table' : el.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.hidden ? 'Show' : 'Hide'}>{el.hidden ? <EyeOff className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /> : <Eye className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.locked ? 'Unlock' : 'Lock'}>{el.locked ? <Lock className="h-3 w-3" style={{ color: 'var(--zet-primary)' }} /> : <Unlock className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerUp(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Up"><ChevronUp className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerDown(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Down"><ChevronDown className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1 rounded hover:bg-red-500/20" title="Delete"><Trash2 className="h-3 w-3" style={{ color: '#f87171' }} /></button>
            </div>
          </div>
        ))}
        {canvasElements.length === 0 && <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>No layers</div>}
      </div>
    </DraggablePanel>
  );
};

export default LayersPanel;
