import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const FootnotePanel = () => {
  const {
    isMobile, showFootnote, setShowFootnote,
    selectedElement, lastSelectedRef, canvasElements, setCanvasElements, handleSaveHistory,
    pageSize, marginLeft, marginBottom, currentFont, currentColor,
  } = useContext(EditorStateContext);
  if (!showFootnote) return null;
  return (
    <DraggablePanel title="Dipnot" onClose={() => setShowFootnote(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Seçili metne dipnot numarası ekler ve sayfanın altına dipnot alanı oluşturur.</p>
        <textarea id="footnote-text" placeholder="Dipnot metni..." rows={3} className="zet-input text-xs w-full resize-none" />
        <button onClick={() => {
          const text = document.getElementById('footnote-text')?.value?.trim();
          if (!text) return;
          const target = selectedElement || lastSelectedRef.current;
          const footnoteNum = (canvasElements.filter(e => e.footnoteNum).length) + 1;
          if (target) {
            // Insert superscript marker into selected text element
            const el = canvasElements.find(e => e.id === target);
            if (el?.type === 'text') {
              const marker = `<sup data-footnote-id="${footnoteNum}" style="color:#4ca8ad;font-size:0.7em;cursor:pointer">[${footnoteNum}]</sup>`;
              const updated = canvasElements.map(e => e.id === target ? { ...e, htmlContent: (e.htmlContent || e.content || '') + marker, content: (e.content || '') + `[${footnoteNum}]` } : e);
              setCanvasElements(updated);
              handleSaveHistory(updated);
            }
          }
          // Add footnote element at page bottom
          const fnEl = { id: `fn_${Date.now()}`, type: 'text', x: marginLeft, y: pageSize.height - marginBottom - 40, content: `[${footnoteNum}] ${text}`, htmlContent: `<span style="color:#4ca8ad;font-size:0.8em">[${footnoteNum}]</span> <span style="font-size:0.85em">${text}</span>`, fontSize: 11, fontFamily: currentFont, color: currentColor, width: pageSize.width - marginLeft - marginRight, lineHeight: 1.4, footnoteNum };
          const updated2 = [...canvasElements, fnEl];
          setCanvasElements(updated2);
          handleSaveHistory(updated2);
          setShowFootnote(false);
        }} className="zet-btn w-full text-xs">Dipnot Ekle</button>
      </div>
    </DraggablePanel>
  );
};

export default FootnotePanel;
