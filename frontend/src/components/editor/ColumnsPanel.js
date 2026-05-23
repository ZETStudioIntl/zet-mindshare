import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const ColumnsPanel = () => {
  const {
    isMobile, showColumns, setShowColumns,
    columnCount, setColumnCount, columnGap, setColumnGap,
    pageSize, marginLeft, marginRight, marginTop,
    canvasElements, setCanvasElements, handleSaveHistory, setSelectedElement,
    currentFontSize, currentFont, currentColor, currentLineHeight,
  } = useContext(EditorStateContext);
  if (!showColumns) return null;
  return (
    <DraggablePanel title="Sütun Düzeni" onClose={() => setShowColumns(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-56 space-y-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sütun Aralığı: {columnGap}px</label>
          <input type="range" min="10" max="80" value={columnGap} onChange={e => setColumnGap(parseInt(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => {
              setColumnCount(n);
              if (n === 1) { setShowColumns(false); return; }
              const availW = pageSize.width - marginLeft - marginRight;
              const colW = Math.round((availW - (n - 1) * columnGap) / n);
              const cols = Array.from({ length: n }, (_, i) => ({
                id: `col_${Date.now()}_${i}`, type: 'text',
                x: marginLeft + i * (colW + columnGap),
                y: marginTop, content: '', htmlContent: '',
                fontSize: currentFontSize, fontFamily: currentFont, color: currentColor,
                width: colW, lineHeight: currentLineHeight, textAlign: 'left',
              }));
              const updated = [...canvasElements, ...cols];
              setCanvasElements(updated);
              handleSaveHistory(updated);
              setSelectedElement(cols[0].id);
              setShowColumns(false);
            }}
              className="zet-btn py-2.5 text-sm font-semibold"
              style={{ background: columnCount === n ? 'var(--zet-primary)' : 'var(--zet-bg)', color: columnCount === n ? '#fff' : 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
          Sütun genişliği: ~{Math.round((pageSize.width - marginLeft - marginRight - (columnCount - 1) * columnGap) / Math.max(columnCount, 1))}px
        </p>
      </div>
    </DraggablePanel>
  );
};

export default ColumnsPanel;
