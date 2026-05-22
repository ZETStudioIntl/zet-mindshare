import React, { useState } from 'react';

export const ResizableDivider = ({ onResize }) => {
  const [dragging, setDragging] = useState(false);
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const handleMouseMove = (ev) => { onResize(ev.clientX - startX); };
    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ width: 4, cursor: 'col-resize', background: 'rgba(255,255,255,0.1)', flexShrink: 0, transition: dragging ? 'none' : 'background 0.2s', zIndex: 10 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
      onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
    />
  );
};

