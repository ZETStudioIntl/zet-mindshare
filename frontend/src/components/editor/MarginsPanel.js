import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const MarginsPanel = () => {
  const {
    isMobile, showMargins, setShowMargins,
    marginTop, setMarginTop, marginBottom, setMarginBottom,
    marginLeft, setMarginLeft, marginRight, setMarginRight,
    pageSize, setCanvasElements, handleSaveHistory,
    setDocument, currentPage, setCurrentFont, setCurrentFontSize,
    screenplayMode, setScreenplayMode,
  } = useContext(EditorStateContext);
  if (!showMargins) return null;
  return (
    <DraggablePanel title="Kenar Boşlukları" onClose={() => setShowMargins(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-2">
        {[
          { label: 'Üst',  value: marginTop,    set: setMarginTop },
          { label: 'Alt',  value: marginBottom, set: setMarginBottom },
          { label: 'Sol',  value: marginLeft,   set: setMarginLeft },
          { label: 'Sağ',  value: marginRight,  set: setMarginRight },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>{label}</label>
              <span className="text-xs font-mono" style={{ color: 'var(--zet-primary)' }}>{value}px</span>
            </div>
            <input type="range" min="0" max="200" value={value} onChange={e => set(parseInt(e.target.value))} className="w-full accent-blue-500" />
          </div>
        ))}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Hazır Ayarlar</p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Normal',   t: 95,  b: 95,  l: 95,  r: 95 },
              { label: 'Dar',      t: 48,  b: 48,  l: 48,  r: 48 },
              { label: 'Geniş',   t: 189, b: 189, l: 189, r: 189 },
              { label: 'Senaryo', t: 95,  b: 95,  l: 144, r: 95 },
              { label: 'Akademik',t: 95,  b: 95,  l: 121, r: 95 },
              { label: 'Kitap',   t: 76,  b: 76,  l: 113, r: 95 },
            ].map(({ label, t, b, l, r }) => (
              <button key={label} onClick={() => {
                setMarginTop(t); setMarginBottom(b); setMarginLeft(l); setMarginRight(r);
                const w = pageSize.width - l - r;
                setCanvasElements(prev => prev.map(el => el.type === 'text' ? { ...el, x: l, width: w } : el));
                if (label === 'Senaryo') {
                  setCurrentFont('Courier Prime'); setCurrentFontSize(16);
                  setScreenplayMode(true);
                } else {
                  setScreenplayMode(false);
                }
              }} className="zet-btn text-xs py-1.5">{label}</button>
            ))}
          </div>
        </div>
        <button data-testid="margins-apply-all" onClick={() => {
          const w = pageSize.width - marginLeft - marginRight;
          setCanvasElements(prev => { const u = prev.map(el => el.type === 'text' ? { ...el, x: marginLeft, width: w } : el); handleSaveHistory(u); return u; });
          setDocument(prev => {
            if (!prev?.pages) return prev;
            return { ...prev, pages: prev.pages.map((page, idx) => idx === currentPage ? page : { ...page, elements: (page.elements || []).map(el => el.type === 'text' ? { ...el, x: marginLeft, width: w } : el) }) };
          });
        }} className="zet-btn w-full py-1.5 text-xs font-medium" style={{ background: 'var(--zet-primary)', color: '#fff' }}>Tümüne Uygula</button>
      </div>
    </DraggablePanel>
  );
};

export default MarginsPanel;
