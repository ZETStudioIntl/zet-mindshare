import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const IndentPanel = () => {
  const {
    isMobile, showIndent, setShowIndent,
    indentLeft, setIndentLeft, indentRight, setIndentRight,
    indentTop, setIndentTop, indentBottom, setIndentBottom,
    selectedElement, lastSelectedRef, setCanvasElements, handleSaveHistory,
    setDocument, currentPage,
  } = useContext(EditorStateContext);
  if (!showIndent) return null;
  return (
    <DraggablePanel title="Girinti" onClose={() => setShowIndent(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-2">
        {[
          { label: 'Sol', value: indentLeft, set: setIndentLeft, key: 'paddingLeft' },
          { label: 'Sağ', value: indentRight, set: setIndentRight, key: 'paddingRight' },
          { label: 'Üst', value: indentTop, set: setIndentTop, key: 'paddingTop' },
          { label: 'Alt', value: indentBottom, set: setIndentBottom, key: 'paddingBottom' },
        ].map(({ label, value, set, key }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{label}</label>
              <span className="text-xs font-mono" style={{ color: 'var(--zet-primary)' }}>{value}px</span>
            </div>
            <input type="range" min="0" max="120" value={value} onChange={e => {
              const v = parseInt(e.target.value);
              set(v);
              const target = selectedElement || lastSelectedRef.current;
              if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target && el.type === 'text' ? { ...el, [key]: v } : el); handleSaveHistory(u); return u; });
            }} className="w-full accent-blue-500" />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button onClick={() => {
            setIndentLeft(0); setIndentRight(0); setIndentTop(0); setIndentBottom(0);
            const target = selectedElement || lastSelectedRef.current;
            if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target && el.type === 'text' ? { ...el, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } : el); handleSaveHistory(u); return u; });
          }} className="zet-btn flex-1 py-1.5 text-xs">Sıfırla</button>
          <button data-testid="indent-apply-all" onClick={() => {
            setCanvasElements(prev => { const u = prev.map(el => el.type === 'text' ? { ...el, paddingLeft: indentLeft, paddingRight: indentRight, paddingTop: indentTop, paddingBottom: indentBottom } : el); handleSaveHistory(u); return u; });
            setDocument(prev => {
              if (!prev?.pages) return prev;
              return { ...prev, pages: prev.pages.map((page, idx) => idx === currentPage ? page : { ...page, elements: (page.elements || []).map(el => el.type === 'text' ? { ...el, paddingLeft: indentLeft, paddingRight: indentRight, paddingTop: indentTop, paddingBottom: indentBottom } : el) }) };
            });
          }} className="zet-btn flex-1 py-1.5 text-xs" style={{ background: 'var(--zet-primary)', color: '#fff' }}>Tümüne</button>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default IndentPanel;
