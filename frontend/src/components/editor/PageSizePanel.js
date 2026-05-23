import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { PAGE_SIZES } from '../../lib/editorConstants';

const PageSizePanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showPageSize, setShowPageSize,
    pageSizeScope, setPageSizeScope, pageSize, setPageSize,
    setCanvasElements, setDocument, currentPage,
    customWidth, setCustomWidth, customHeight, setCustomHeight,
  } = useContext(EditorStateContext);
  if (!showPageSize) return null;
  return (
    <DraggablePanel title={t('pageSize')} onClose={() => setShowPageSize(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 200 }}>
      <div className="space-y-2 w-52">
        {/* Scope selector */}
        <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--zet-border)' }}>
          <button onClick={() => setPageSizeScope('current')} className="flex-1 py-1.5 text-xs transition-colors" style={{ background: pageSizeScope === 'current' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: pageSizeScope === 'current' ? '#fff' : 'var(--zet-text-muted)' }}>
            Yalnızca bu sayfa
          </button>
          <button onClick={() => setPageSizeScope('all')} className="flex-1 py-1.5 text-xs transition-colors" style={{ background: pageSizeScope === 'all' ? 'var(--zet-primary)' : 'var(--zet-bg)', color: pageSizeScope === 'all' ? '#fff' : 'var(--zet-text-muted)' }}>
            Tüm sayfalar
          </button>
        </div>
        {PAGE_SIZES.map(s => <button key={s.name} onClick={() => {
          const oldW = pageSize.width, oldH = pageSize.height;
          const sx = s.width / oldW, sy = s.height / oldH;
          setPageSize(s);
          const scaleEls = els => els.map(el => ({ ...el, x: el.x * sx, y: el.y * sy, ...(el.width != null ? { width: el.width * sx } : {}), ...(el.height != null ? { height: el.height * sy } : {}), ...(el.fontSize != null ? { fontSize: Math.round(el.fontSize * sx) } : {}) }));
          setCanvasElements(prev => scaleEls(prev));
          setDocument(prev => {
            if (!prev) return prev;
            const pages = [...(prev.pages || [])];
            if (pageSizeScope === 'all') {
              return { ...prev, pages: pages.map(p => ({ ...p, pageSize: s, elements: scaleEls(p.elements || []) })) };
            }
            if (pages[currentPage]) pages[currentPage] = { ...pages[currentPage], pageSize: s };
            return { ...prev, pages };
          });
          setShowPageSize(false);
        }} className={`w-full p-2 rounded text-left text-sm transition-colors ${pageSize.name === s.name ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: pageSize.name === s.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s.name} <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.width}×{s.height}</span></button>)}
        <div className="flex gap-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}><input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="W" /><input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="H" /></div>
        <button onClick={() => {
          const s = { name: 'Custom', width: customWidth, height: customHeight };
          const oldW = pageSize.width, oldH = pageSize.height;
          const sx = s.width / oldW, sy = s.height / oldH;
          setPageSize(s);
          const scaleEls = els => els.map(el => ({ ...el, x: el.x * sx, y: el.y * sy, ...(el.width != null ? { width: el.width * sx } : {}), ...(el.height != null ? { height: el.height * sy } : {}), ...(el.fontSize != null ? { fontSize: Math.round(el.fontSize * sx) } : {}) }));
          setCanvasElements(prev => scaleEls(prev));
          setDocument(prev => {
            if (!prev) return prev;
            const pages = [...(prev.pages || [])];
            if (pageSizeScope === 'all') {
              return { ...prev, pages: pages.map(p => ({ ...p, pageSize: s, elements: scaleEls(p.elements || []) })) };
            }
            if (pages[currentPage]) pages[currentPage] = { ...pages[currentPage], pageSize: s };
            return { ...prev, pages };
          });
          setShowPageSize(false);
        }} className="zet-btn w-full text-sm">Apply</button>
      </div>
    </DraggablePanel>
  );
};

export default PageSizePanel;
