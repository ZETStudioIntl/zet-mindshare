import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const NumberedListPanel = () => {
  const {
    isMobile, showNumberedList, setShowNumberedList,
    currentNumberStyle, setCurrentNumberStyle, applyListFormat,
    selectedElement, lastSelectedRef, canvasElements, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);
  if (!showNumberedList) return null;
  return (
    <DraggablePanel title="Numaralı Liste" onClose={() => setShowNumberedList(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="w-52 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Numara stili seç</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { style: 'decimal',      label: '1.', desc: 'Sayı' },
            { style: 'lower-alpha',  label: 'a.', desc: 'Küçük' },
            { style: 'upper-alpha',  label: 'A.', desc: 'Büyük' },
            { style: 'lower-roman',  label: 'i.', desc: 'Roma k.' },
            { style: 'upper-roman',  label: 'I.', desc: 'Roma B.' },
            { style: 'decimal-leading-zero', label: '01.', desc: 'Sıfırlı' },
          ].map(({ style, label, desc }) => (
            <button key={style} onClick={() => {
              setCurrentNumberStyle(style);
              applyListFormat('ol', style);
              setShowNumberedList(false);
            }} className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${currentNumberStyle === style ? 'glow-sm' : 'hover:bg-white/10'}`}
              style={{ background: currentNumberStyle === style ? 'var(--zet-primary)' : 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
              <span className="text-sm font-mono leading-none">{label}</span>
              <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>{desc}</span>
            </button>
          ))}
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>TAB = alt liste &nbsp;·&nbsp; Shift+TAB = geri</p>
          <button onClick={() => {
            const target = selectedElement || lastSelectedRef.current;
            if (!target) return;
            const el = canvasElements.find(e => e.id === target);
            if (!el) return;
            const cleaned = (el.htmlContent || el.content || '').replace(/<\/?[uo]l[^>]*>/gi, '').replace(/<li[^>]*>/gi, '').replace(/<\/li>/gi, '\n').replace(/\n+/g, '\n').trim();
            setCanvasElements(prev => { const u = prev.map(e => e.id === target ? { ...e, htmlContent: cleaned, content: cleaned.replace(/<[^>]*>/g, '') } : e); handleSaveHistory(u); return u; });
            setShowNumberedList(false);
          }} className="zet-btn w-full text-xs py-1.5" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>Listeyi Kaldır</button>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default NumberedListPanel;
