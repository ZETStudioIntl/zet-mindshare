import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';

function findWordPositions(el, searchWord, zoom, pageLeft, pageTop) {
  if (!searchWord) return [];
  const plainText = (el.content || (el.htmlContent || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')).trim();
  if (!plainText.toLowerCase().includes(searchWord.toLowerCase())) return [];

  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed', 'top:-9999px', 'left:-9999px',
    `width:${el.width || 400}px`,
    `font-family:${el.fontFamily || 'Arial'},sans-serif`,
    `font-size:${el.fontSize || 16}px`,
    `font-weight:${el.bold ? 'bold' : 'normal'}`,
    `font-style:${el.italic ? 'italic' : 'normal'}`,
    `line-height:${el.lineHeight || 1.5}`,
    `text-align:${el.textAlign || 'left'}`,
    'white-space:pre-wrap', 'word-break:break-word',
    'visibility:hidden', 'pointer-events:none', 'box-sizing:border-box',
  ].join(';');
  div.textContent = plainText;
  document.body.appendChild(div);
  const divRect = div.getBoundingClientRect();
  const results = [];
  const textLower = plainText.toLowerCase();
  const searchLower = searchWord.toLowerCase();
  let from = 0;

  while (true) {
    const idx = textLower.indexOf(searchLower, from);
    if (idx === -1) break;
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let acc = 0;
    let done = false;
    while (node && !done) {
      const end = acc + node.length;
      if (acc <= idx && idx < end) {
        const localOff = idx - acc;
        try {
          const range = document.createRange();
          range.setStart(node, localOff);
          range.setEnd(node, Math.min(localOff + searchWord.length, node.length));
          const rects = Array.from(range.getClientRects());
          if (rects.length > 0) {
            const r = rects[0];
            results.push({
              x: (r.left - divRect.left) * zoom + pageLeft + el.x * zoom,
              y: (r.top - divRect.top) * zoom + pageTop + el.y * zoom,
              w: r.width * zoom,
              h: r.height * zoom,
            });
          }
        } catch {}
        done = true;
      }
      acc = end;
      node = walker.nextNode();
    }
    from = idx + searchWord.length;
  }

  document.body.removeChild(div);
  return results;
}

export default function PatchLayer({ canvasElements, document: doc, currentPage, zoom, canvasContainerRef }) {
  const { patchCorrections, handlePatchAccept, handlePatchIgnore } = useContext(EditorStateContext);
  const [marks, setMarks] = useState([]);
  const [hoveredKey, setHoveredKey] = useState(null);
  const layerRef = useRef(null);
  const rafRef = useRef(null);

  const compute = useCallback(() => {
    if (!canvasContainerRef?.current || !layerRef.current || !patchCorrections.length) {
      setMarks([]);
      return;
    }
    const container = canvasContainerRef.current;
    const layerRect = layerRef.current.getBoundingClientRect();
    const result = [];
    const allPages = doc?.pages || [];

    allPages.forEach((page, pageIdx) => {
      const pageEl = container.querySelector(`[data-testid="canvas-page-${pageIdx}"]`);
      if (!pageEl) return;
      const pageRect = pageEl.getBoundingClientRect();
      const pageLeft = pageRect.left - layerRect.left;
      const pageTop = pageRect.top - layerRect.top;
      const els = pageIdx === currentPage ? canvasElements : (page.elements || []);

      els.forEach(el => {
        if (el.type !== 'text') return;
        patchCorrections.forEach(corr => {
          if (!corr.original) return;
          const positions = findWordPositions(el, corr.original, zoom, pageLeft, pageTop);
          positions.forEach((pos, pi) => {
            result.push({ ...pos, corrId: corr.id, type: corr.type, suggestion: corr.suggestion, key: `${corr.id}-${el.id}-${pi}` });
          });
        });
      });
    });

    setMarks(result);
  }, [patchCorrections, canvasElements, doc, currentPage, zoom, canvasContainerRef]);

  useEffect(() => {
    const container = canvasContainerRef?.current;
    if (!container) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [canvasContainerRef, compute]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(compute);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [compute]);

  if (!patchCorrections.length) return null;

  return (
    <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 31 }}>
      {marks.map(m => {
        const color = m.type === 'spelling' ? '#a855f7' : '#f59e0b';
        const isHov = hoveredKey === m.key;
        return (
          <div
            key={m.key}
            style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h + 3, pointerEvents: 'auto' }}
            onMouseEnter={() => setHoveredKey(m.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Underline */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2, background: color, borderRadius: 1 }} />
            {/* Hover buton grubu */}
            {isHov && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                display: 'flex', gap: 4, zIndex: 200, pointerEvents: 'auto',
              }}>
                {m.suggestion && (
                  <button
                    onClick={e => { e.stopPropagation(); handlePatchAccept(m.corrId); setHoveredKey(null); }}
                    style={{
                      padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: color, color: '#fff', fontSize: 10, fontWeight: 600,
                      fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}>
                    → {m.suggestion}
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handlePatchIgnore(m.corrId); setHoveredKey(null); }}
                  style={{
                    padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.5)', cursor: 'pointer',
                    background: 'var(--zet-bg-card, #1a1a2e)', color: '#fca5a5', fontSize: 10, fontWeight: 600,
                    fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}>
                  Kaldır
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
