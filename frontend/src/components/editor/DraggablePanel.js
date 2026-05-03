import React, { useRef, useCallback, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const DraggablePanel = ({ children, title, onClose, initialPosition = { x: 100, y: 100 } }) => {
  const panelRef = useRef(null);
  const posRef = useRef(initialPosition);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const clampToViewport = useCallback((x, y) => {
    if (!panelRef.current) return { x, y };
    const pw = panelRef.current.offsetWidth || 280;
    const ph = panelRef.current.offsetHeight || 100;
    return {
      x: clamp(x, 0, window.innerWidth - pw),
      y: clamp(y, 0, window.innerHeight - ph),
    };
  }, []);

  const applyPos = useCallback((x, y) => {
    const { x: cx, y: cy } = clampToViewport(x, y);
    posRef.current = { x: cx, y: cy };
    if (panelRef.current) {
      panelRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    }
  }, [clampToViewport]);

  useEffect(() => {
    // On mobile use bottom-sheet position — center horizontally, near bottom
    const isMobile = window.innerWidth < 640;
    const startX = isMobile
      ? Math.max(0, (window.innerWidth - (panelRef.current?.offsetWidth || 280)) / 2)
      : initialPosition.x;
    const startY = isMobile
      ? Math.max(0, window.innerHeight - (panelRef.current?.offsetHeight || 300) - 80)
      : initialPosition.y;
    applyPos(startX, startY);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse drag ──
  const handleMouseDown = useCallback((e) => {
    if (!e.target.closest('.panel-drag-handle')) return;
    draggingRef.current = true;
    offsetRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    if (panelRef.current) panelRef.current.style.willChange = 'transform';
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      applyPos(e.clientX - offsetRef.current.x, e.clientY - offsetRef.current.y);
    };
    const onUp = () => {
      draggingRef.current = false;
      if (panelRef.current) panelRef.current.style.willChange = 'auto';
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [applyPos]);

  // ── Touch drag ──
  const handleTouchStart = useCallback((e) => {
    if (!e.target.closest('.panel-drag-handle')) return;
    const t = e.touches[0];
    draggingRef.current = true;
    offsetRef.current = { x: t.clientX - posRef.current.x, y: t.clientY - posRef.current.y };
    if (panelRef.current) panelRef.current.style.willChange = 'transform';
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onTouchMove = (e) => {
      if (!draggingRef.current) return;
      const t = e.touches[0];
      applyPos(t.clientX - offsetRef.current.x, t.clientY - offsetRef.current.y);
      e.preventDefault();
    };
    const onTouchEnd = () => {
      draggingRef.current = false;
      if (panelRef.current) panelRef.current.style.willChange = 'auto';
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [applyPos]);

  return (
    <div
      ref={panelRef}
      data-testid={`draggable-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="fixed zet-card shadow-2xl z-50 animate-fadeIn"
      style={{
        left: 0,
        top: 0,
        backfaceVisibility: 'hidden',
        minWidth: window.innerWidth < 640 ? `${Math.min(window.innerWidth - 16, 320)}px` : '280px',
        maxWidth: window.innerWidth < 640 ? `${window.innerWidth - 16}px` : '420px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="panel-drag-handle p-3 border-b flex items-center justify-between cursor-move select-none sticky top-0 z-10"
        style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-card)' }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{title}</span>
        </div>
        <button
          data-testid={`close-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};
