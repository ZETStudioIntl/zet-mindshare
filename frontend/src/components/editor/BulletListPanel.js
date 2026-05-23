import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const BulletListPanel = () => {
  const {
    isMobile, showBulletList, setShowBulletList,
    currentBulletStyle, setCurrentBulletStyle, applyListFormat,
    selectedElement, lastSelectedRef, canvasElements, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);
  if (!showBulletList) return null;
  return (
    <DraggablePanel title="Madde İşaretli Liste" onClose={() => setShowBulletList(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="w-52 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Liste stili seç</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { style: 'disc',   label: '●', desc: 'Dolu' },
            { style: 'circle', label: '○', desc: 'Boş' },
            { style: 'square', label: '▪', desc: 'Kare' },
            { style: 'disclosure-closed', label: '›', desc: 'Ok' },
            { style: 'none',   label: '—', desc: 'Tire' },
          ].map(({ style, label, desc }) => (
            <button key={style} onClick={() => {
              setCurrentBulletStyle(style);
              applyListFormat('ul', style);
              setShowBulletList(false);
            }} className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${currentBulletStyle === style ? 'glow-sm' : 'hover:bg-white/10'}`}
              style={{ background: currentBulletStyle === style ? 'var(--zet-primary)' : 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}>
              <span className="text-base leading-none">{label}</span>
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
            setShowBulletList(false);
          }} className="zet-btn w-full text-xs py-1.5" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>Listeyi Kaldır</button>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default BulletListPanel;
