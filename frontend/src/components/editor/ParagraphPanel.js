import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

const ParagraphPanel = () => {
  const {
    isMobile, showParagraph, setShowParagraph,
    applyHeadingStyle, applyTextAlign, currentTextAlign,
    firstLineIndent, setFirstLineIndent,
    paragraphSpaceBefore, setParagraphSpaceBefore,
    paragraphSpaceAfter, setParagraphSpaceAfter,
    selectedElement, lastSelectedRef, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);
  if (!showParagraph) return null;
  return (
    <DraggablePanel title="Paragraf" onClose={() => setShowParagraph(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-3 w-56">
        {/* Heading styles */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Başlık Stili</p>
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={() => applyHeadingStyle(32, true)} className="p-2 rounded font-bold text-sm transition-colors hover:bg-white/10" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>H1</button>
            <button onClick={() => applyHeadingStyle(24, true)} className="p-2 rounded font-bold text-sm transition-colors hover:bg-white/10" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>H2</button>
            <button onClick={() => applyHeadingStyle(18, true)} className="p-2 rounded font-bold text-sm transition-colors hover:bg-white/10" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>H3</button>
            <button onClick={() => applyHeadingStyle(12, false)} className="p-2 rounded text-xs transition-colors hover:bg-white/10" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>Nor</button>
          </div>
        </div>
        {/* Alignment */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Hizalama</p>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => applyTextAlign('left')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'left' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'left' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignLeft className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
            <button onClick={() => applyTextAlign('center')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'center' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'center' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignCenter className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
            <button onClick={() => applyTextAlign('right')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'right' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'right' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignRight className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
            <button onClick={() => applyTextAlign('justify')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'justify' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'justify' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignJustify className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
          </div>
        </div>
        {/* First-line indent */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>İlk Satır Girintisi</p>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="120" value={firstLineIndent} onChange={e => {
              const v = Number(e.target.value);
              setFirstLineIndent(v);
              const target = selectedElement || lastSelectedRef.current;
              if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target ? { ...el, textIndent: v } : el); handleSaveHistory(u); return u; });
            }} className="flex-1 accent-blue-500" />
            <span className="text-xs w-10 text-right" style={{ color: 'var(--zet-text)' }}>{firstLineIndent}px</span>
          </div>
          <div className="flex gap-1 mt-1">
            {[0, 24, 36, 48].map(v => (
              <button key={v} onClick={() => {
                setFirstLineIndent(v);
                const target = selectedElement || lastSelectedRef.current;
                if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target ? { ...el, textIndent: v } : el); handleSaveHistory(u); return u; });
              }} className="flex-1 text-xs py-0.5 rounded" style={{ background: firstLineIndent === v ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>{v === 0 ? 'Yok' : `${v}px`}</button>
            ))}
          </div>
        </div>
        {/* Paragraph spacing */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>Paragraf Aralığı</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--zet-text-muted)' }}><span>Önce</span><span>{paragraphSpaceBefore}px</span></label>
              <input type="range" min="0" max="80" value={paragraphSpaceBefore} onChange={e => {
                const v = Number(e.target.value);
                setParagraphSpaceBefore(v);
                const target = selectedElement || lastSelectedRef.current;
                if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target ? { ...el, paragraphSpaceBefore: v } : el); handleSaveHistory(u); return u; });
              }} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs flex justify-between mb-1" style={{ color: 'var(--zet-text-muted)' }}><span>Sonra</span><span>{paragraphSpaceAfter}px</span></label>
              <input type="range" min="0" max="80" value={paragraphSpaceAfter} onChange={e => {
                const v = Number(e.target.value);
                setParagraphSpaceAfter(v);
                const target = selectedElement || lastSelectedRef.current;
                if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target ? { ...el, paragraphSpaceAfter: v } : el); handleSaveHistory(u); return u; });
              }} className="w-full accent-blue-500" />
            </div>
            <div className="flex gap-1">
              {[0, 6, 12, 18].map(v => (
                <button key={v} onClick={() => {
                  setParagraphSpaceBefore(v); setParagraphSpaceAfter(v);
                  const target = selectedElement || lastSelectedRef.current;
                  if (target) setCanvasElements(prev => { const u = prev.map(el => el.id === target ? { ...el, paragraphSpaceBefore: v, paragraphSpaceAfter: v } : el); handleSaveHistory(u); return u; });
                }} className="flex-1 text-xs py-0.5 rounded" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>{v === 0 ? 'Yok' : `${v}px`}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default ParagraphPanel;
