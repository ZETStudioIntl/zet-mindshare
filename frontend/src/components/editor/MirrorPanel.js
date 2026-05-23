import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const MirrorPanel = () => {
  const {
    isMobile, showMirror, setShowMirror,
    selectedElement, mirrorElement, mirrorAngle, setMirrorAngle,
    setCanvasElements, canvasElements, handleSaveHistory, rotateElement,
  } = useContext(EditorStateContext);
  if (!showMirror) return null;
  return (
    <DraggablePanel title="Mirror / Rotate" onClose={() => setShowMirror(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-3">
        {!selectedElement ? (
          <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Select an element first</div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Mirror</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => mirrorElement('horizontal')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↔ Horizontal
                </button>
                <button onClick={() => mirrorElement('vertical')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↕ Vertical
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Döndür: {mirrorAngle}°</label>
              <input
                type="range" min="-180" max="180" value={mirrorAngle}
                onChange={e => {
                  const angle = Number(e.target.value);
                  setMirrorAngle(angle);
                  if (selectedElement) setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, rotation: angle } : el));
                }}
                onMouseUp={() => { if (selectedElement) handleSaveHistory(canvasElements); }}
                className="w-full accent-blue-500"
              />
              <div className="grid grid-cols-4 gap-1">
                <button onClick={() => { rotateElement(-90); setMirrorAngle(a => a - 90); }} className="zet-btn text-xs py-1">-90°</button>
                <button onClick={() => { rotateElement(-45); setMirrorAngle(a => a - 45); }} className="zet-btn text-xs py-1">-45°</button>
                <button onClick={() => { rotateElement(45); setMirrorAngle(a => a + 45); }} className="zet-btn text-xs py-1">+45°</button>
                <button onClick={() => { rotateElement(90); setMirrorAngle(a => a + 90); }} className="zet-btn text-xs py-1">+90°</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DraggablePanel>
  );
};

export default MirrorPanel;
