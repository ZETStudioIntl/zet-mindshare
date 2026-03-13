import React, { useRef, useCallback, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';

export const DraggablePanel = ({ children, title, onClose, initialPosition = { x: 100, y: 100 } }) => {
  const panelRef = useRef(null);
  const posRef = useRef(initialPosition);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = `translate3d(${initialPosition.x}px, ${initialPosition.y}px, 0)`;
      posRef.current = initialPosition;
    }
  }, []);

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
      const nx = e.clientX - offsetRef.current.x;
      const ny = e.clientY - offsetRef.current.y;
      posRef.current = { x: nx, y: ny };
      if (panelRef.current) {
        panelRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
      }
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
  }, []);

  return (
    <div
      ref={panelRef}
      data-testid={`draggable-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="fixed zet-card shadow-2xl z-50 min-w-[280px] animate-fadeIn"
      style={{ 
        left: 0,
        top: 0,
        backfaceVisibility: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="panel-drag-handle p-3 border-b flex items-center justify-between cursor-move select-none" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{title}</span>
        </div>
        <button data-testid={`close-panel-${title.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};
