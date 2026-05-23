import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const TOCPanel = () => {
  const {
    isMobile, showTOC, setShowTOC,
    document, marginLeft, marginRight, marginTop, marginBottom,
    pageSize, currentFont, currentColor,
    canvasElements, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);
  if (!showTOC) return null;
  return (
    <DraggablePanel title="İçindekiler" onClose={() => setShowTOC(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Büyük/kalın metin elementlerinden başlıklar algılanır.</p>
        {(() => {
          const headings = [];
          (document?.pages || []).forEach((page, pi) => {
            (page.elements || []).forEach(el => {
              if (el.type === 'text' && (el.bold || (el.fontSize || 16) >= 21)) {
                const text = (el.content || '').replace(/<[^>]*>/g, '').trim().slice(0, 60);
                if (text) headings.push({ text, page: pi + 1, level: (el.fontSize || 16) >= 29 ? 1 : (el.fontSize || 16) >= 21 ? 2 : 3 });
              }
            });
          });
          return headings.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--zet-text-muted)' }}>Başlık bulunamadı.</p>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {headings.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ paddingLeft: (h.level - 1) * 12 }}>
                    <span className="font-medium truncate flex-1" style={{ color: 'var(--zet-text)' }}>{h.text}</span>
                    <span className="flex-shrink-0 text-xs" style={{ color: 'var(--zet-text-muted)' }}>s.{h.page}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const lines = headings.map(h => `${'  '.repeat(h.level - 1)}${h.text}${'·'.repeat(Math.max(1, 40 - h.text.length - (h.level - 1) * 2))}${h.page}`).join('\n');
                const tocEl = { id: `toc_${Date.now()}`, type: 'text', x: marginLeft, y: marginTop, content: 'İÇİNDEKİLER\n' + lines, htmlContent: '<b>İÇİNDEKİLER</b><br>' + headings.map(h => `<span data-toc-page="${h.page}" style="padding-left:${(h.level-1)*12}px;display:block;cursor:pointer">${h.text} <span style="float:right;color:var(--zet-text-muted)">${h.page}</span></span>`).join(''), fontSize: 13, fontFamily: currentFont, color: currentColor, width: pageSize.width - marginLeft - marginRight, lineHeight: 1.6 };
                const updated = [...canvasElements, tocEl];
                setCanvasElements(updated);
                handleSaveHistory(updated);
                setShowTOC(false);
              }} className="zet-btn w-full text-xs">Canvas'a Ekle</button>
            </>
          );
        })()}
      </div>
    </DraggablePanel>
  );
};

export default TOCPanel;
