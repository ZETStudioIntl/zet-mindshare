import React, { useEffect, useState, useCallback, useRef } from 'react';

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) dp[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      dp[i][j] = b[i-1] === a[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j]);
  return dp[b.length][a.length];
}

function makeWavy(width) {
  if (width <= 0) return '';
  let d = 'M 0 3';
  for (let x = 0; x < width; x += 6) {
    d += ` Q ${x + 3} ${x % 12 < 6 ? 1 : 5} ${x + 6} 3`;
  }
  return d;
}

function measureWordPositions(el, plainText, errors, zoom, pageLeft, pageTop) {
  if (!errors.length || !plainText) return [];

  const div = document.createElement('div');
  div.style.cssText = [
    `position:fixed`, `top:-9999px`, `left:-9999px`,
    `width:${el.width || 400}px`,
    `font-family:${el.fontFamily || 'Arial'},sans-serif`,
    `font-size:${el.fontSize || 16}px`,
    `font-weight:${el.bold ? 'bold' : 'normal'}`,
    `font-style:${el.italic ? 'italic' : 'normal'}`,
    `line-height:${el.lineHeight || 1.5}`,
    `text-align:${el.textAlign || 'left'}`,
    `white-space:pre-wrap`,
    `word-break:break-word`,
    `visibility:hidden`,
    `pointer-events:none`,
    `box-sizing:border-box`,
  ].join(';');
  div.textContent = plainText;
  document.body.appendChild(div);

  const divRect = div.getBoundingClientRect();
  const results = [];

  for (const error of errors) {
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let acc = 0;
    while (node) {
      const end = acc + node.length;
      if (acc <= error.offset && error.offset < end) {
        const localOff = error.offset - acc;
        try {
          const range = document.createRange();
          range.setStart(node, localOff);
          range.setEnd(node, Math.min(localOff + error.length, node.length));
          const rect = range.getBoundingClientRect();
          const relX = (rect.left - divRect.left) * zoom;
          const relY = (rect.top - divRect.top) * zoom;
          results.push({
            error,
            x: pageLeft + el.x * zoom + relX,
            y: pageTop + el.y * zoom + relY,
            width: Math.max(4, rect.width * zoom),
            lineH: rect.height * zoom,
          });
        } catch (_) {}
        break;
      }
      acc = end;
      node = walker.nextNode();
    }
  }

  document.body.removeChild(div);
  return results;
}

export default function SpellCheckLayer({
  spellErrors, canvasElements, document: doc,
  currentPage, zoom, tanıList, canvasContainerRef, onWordClick,
}) {
  const [underlines, setUnderlines] = useState([]);
  const rafRef = useRef(null);
  const layerRef = useRef(null);

  const compute = useCallback(() => {
    if (!canvasContainerRef?.current || !layerRef.current) return;
    const container = canvasContainerRef.current;
    const layerRect = layerRef.current.getBoundingClientRect();
    const result = [];

    const allPages = doc?.pages || [];
    allPages.forEach((page, pageIdx) => {
      const pageEl = container.querySelector(`[data-testid="canvas-page-${pageIdx}"]`);
      if (!pageEl) return;
      const pageRect = pageEl.getBoundingClientRect();
      // Positions relative to the SpellCheckLayer's own top-left corner
      const pageLeft = pageRect.left - layerRect.left;
      const pageTop = pageRect.top - layerRect.top;
      const els = pageIdx === currentPage ? canvasElements : (page.elements || []);

      els.forEach(el => {
        if (el.type !== 'text') return;
        const rawErrors = spellErrors[el.id];
        if (!rawErrors?.length) return;
        const isAllCaps = w => w.length > 0 && /^[A-ZÇĞİÖŞÜ0-9\s.,\-()':!?/\\]+$/.test(w) && /[A-ZÇĞİÖŞÜ]/.test(w);
        const activeErrors = rawErrors.filter(e => !tanıList[e.word] && !isAllCaps(e.word));
        if (!activeErrors.length) return;

        const plainText = el.content || el.htmlContent?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '') || '';
        const positions = measureWordPositions(el, plainText, activeErrors, zoom, pageLeft, pageTop);
        positions.forEach(p => result.push({ ...p, elementId: el.id }));
      });
    });

    setUnderlines(result);
  }, [spellErrors, canvasElements, doc, currentPage, zoom, tanıList, canvasContainerRef]);

  // Scroll listener — recompute positions when canvas is scrolled
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

  return (
    <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      {underlines.map((u, i) => (
        <div
          key={`sp-${u.elementId}-${u.error.offset}-${i}`}
          style={{
            position: 'absolute',
            left: u.x,
            top: u.y + u.lineH,
            width: u.width,
            height: 6,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { onWordClick(e, u.elementId, u.error); }}
        >
          <svg width={u.width} height={6} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
            <path d={makeWavy(u.width)} stroke="#ef4444" strokeWidth={1.5} fill="none" />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function SpellPopup({ popup, tanıList, onApply, onTanı, onClose }) {
  if (!popup) return null;

  const tanıHints = Object.keys(tanıList)
    .filter(w => w !== popup.error.word && levenshtein(w, popup.error.word) <= 2)
    .map(w => w)
    .slice(0, 2);

  const suggestions = [...new Set([...popup.error.suggestions, ...tanıHints])].slice(0, 3);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          left: Math.min(popup.x, window.innerWidth - 200),
          top: popup.y + 10,
          background: 'var(--zet-bg-card)',
          border: '1px solid var(--zet-border)',
          borderRadius: 12,
          padding: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 999,
          minWidth: 170,
          maxWidth: 220,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 10, color: 'var(--zet-text-muted)', marginBottom: 6, fontWeight: 600 }}>
          "{popup.error.word}" — yazım hatası
        </div>

        {suggestions.length > 0 ? suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onApply(popup.elementId, popup.error, s)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '5px 8px', borderRadius: 6, border: 'none',
              background: 'transparent', color: 'var(--zet-text)',
              fontSize: 13, cursor: 'pointer', fontWeight: i === 0 ? 600 : 400,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {s}
            {tanıList[s] !== undefined || Object.values(tanıList).includes(s)
              ? <span style={{ marginLeft: 4, fontSize: 9, color: '#4ca8ad' }}>tanı</span>
              : null}
          </button>
        )) : (
          <div style={{ fontSize: 11, color: 'var(--zet-text-muted)', padding: '4px 8px' }}>Öneri bulunamadı</div>
        )}

        <div style={{ borderTop: '1px solid var(--zet-border)', marginTop: 6, paddingTop: 6 }}>
          <button
            onClick={() => onTanı(popup.error.word, suggestions[0] || '')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', padding: '4px 8px', borderRadius: 6,
              border: 'none', background: 'transparent',
              color: '#4ca8ad', fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,168,173,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Tanı — bu kelimeyi öğren
          </button>
        </div>
      </div>
    </>
  );
}
