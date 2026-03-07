import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, GripVertical } from 'lucide-react';

export const DraggablePanel = ({ children, title, onClose, initialPosition = { x: 100, y: 100 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-drag-handle')) {
      setDragging(true);
      offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setPosition({ 
        x: e.clientX - offsetRef.current.x, 
        y: e.clientY - offsetRef.current.y 
      });
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      data-testid={`draggable-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="fixed zet-card shadow-2xl z-50 min-w-[280px] animate-fadeIn"
      style={{ 
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: 0,
        top: 0,
        willChange: dragging ? 'transform' : 'auto',
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
