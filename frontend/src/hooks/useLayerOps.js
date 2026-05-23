import { useState } from 'react';

export const useLayerOps = ({ canvasElements, setCanvasElements, history, handleSaveHistory, selectedElement, selectedElements, setSelectedElement, setSelectedElements, setShowMirror }) => {
  const [clipboard, setClipboard] = useState(null);

  const moveLayerUp = (id) => {
    const idx = canvasElements.findIndex(el => el.id === id);
    if (idx < canvasElements.length - 1) {
      const updated = [...canvasElements];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      setCanvasElements(updated); history.push(updated);
    }
  };

  const moveLayerDown = (id) => {
    const idx = canvasElements.findIndex(el => el.id === id);
    if (idx > 0) {
      const updated = [...canvasElements];
      [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
      setCanvasElements(updated); history.push(updated);
    }
  };

  const toggleLayerVisibility = (id) => {
    const updated = canvasElements.map(el => el.id === id ? { ...el, hidden: !el.hidden } : el);
    setCanvasElements(updated);
  };

  const toggleLayerLock = (id) => {
    const updated = canvasElements.map(el => el.id === id ? { ...el, locked: !el.locked } : el);
    setCanvasElements(updated);
  };

  const copyElement = () => {
    if (selectedElements.length > 0) {
      const els = canvasElements.filter(e => selectedElements.includes(e.id));
      setClipboard(els.map(el => ({ ...el, id: null })));
    } else if (selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el) setClipboard({ ...el, id: null });
    }
  };

  const pasteElement = () => {
    if (!clipboard) return;
    if (Array.isArray(clipboard)) {
      const now = Date.now();
      const newEls = clipboard.map((el, i) => ({ ...el, id: `el_${now}_${i}`, x: (el.x || 0) + 20, y: (el.y || 0) + 20 }));
      const updated = [...canvasElements, ...newEls];
      setCanvasElements(updated);
      history.push(updated);
      setSelectedElements(newEls.map(e => e.id));
      setSelectedElement(null);
    } else {
      const newEl = { ...clipboard, id: `el_${Date.now()}`, x: (clipboard.x || 0) + 20, y: (clipboard.y || 0) + 20 };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated);
      history.push(updated);
      setSelectedElement(newEl.id);
      setSelectedElements([]);
    }
  };

  const alignElements = (direction) => {
    if (selectedElements.length < 2) return;
    const els = canvasElements.filter(e => selectedElements.includes(e.id));
    const getW = e => e.width || 80;
    const getH = e => e.type === 'text' ? (e.fontSize || 16) * Math.max(1, (e.content || '').split('\n').length) * (e.lineHeight || 1.5) : (e.height || 80);
    let updated;
    if (direction === 'left') {
      const minX = Math.min(...els.map(e => e.x));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, x: minX } : e);
    } else if (direction === 'right') {
      const maxR = Math.max(...els.map(e => e.x + getW(e)));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, x: maxR - getW(e) } : e);
    } else if (direction === 'center-h') {
      const minX = Math.min(...els.map(e => e.x)); const maxR = Math.max(...els.map(e => e.x + getW(e)));
      const cx = (minX + maxR) / 2;
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, x: cx - getW(e) / 2 } : e);
    } else if (direction === 'top') {
      const minY = Math.min(...els.map(e => e.y));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, y: minY } : e);
    } else if (direction === 'bottom') {
      const maxB = Math.max(...els.map(e => e.y + getH(e)));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, y: maxB - getH(e) } : e);
    } else if (direction === 'center-v') {
      const minY = Math.min(...els.map(e => e.y)); const maxB = Math.max(...els.map(e => e.y + getH(e)));
      const cy = (minY + maxB) / 2;
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, y: cy - getH(e) / 2 } : e);
    } else if (direction === 'dist-h') {
      const sorted = [...els].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + getW(e), 0);
      const span = sorted[sorted.length - 1].x + getW(sorted[sorted.length - 1]) - sorted[0].x;
      const gap = (span - totalW) / (sorted.length - 1);
      let cursor = sorted[0].x;
      const positions = Object.fromEntries(sorted.map(e => { const x = cursor; cursor += getW(e) + gap; return [e.id, x]; }));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, x: positions[e.id] } : e);
    } else if (direction === 'dist-v') {
      const sorted = [...els].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + getH(e), 0);
      const span = sorted[sorted.length - 1].y + getH(sorted[sorted.length - 1]) - sorted[0].y;
      const gap = (span - totalH) / (sorted.length - 1);
      let cursor = sorted[0].y;
      const positions = Object.fromEntries(sorted.map(e => { const y = cursor; cursor += getH(e) + gap; return [e.id, y]; }));
      updated = canvasElements.map(e => selectedElements.includes(e.id) ? { ...e, y: positions[e.id] } : e);
    } else return;
    setCanvasElements(updated);
    handleSaveHistory(updated);
  };

  const mirrorElement = (axis) => {
    if (!selectedElement) return;
    const updated = canvasElements.map(el => {
      if (el.id === selectedElement) {
        const currentScaleX = el.scaleX || 1;
        const currentScaleY = el.scaleY || 1;
        if (axis === 'horizontal') {
          return { ...el, scaleX: currentScaleX * -1 };
        } else if (axis === 'vertical') {
          return { ...el, scaleY: currentScaleY * -1 };
        }
      }
      return el;
    });
    setCanvasElements(updated);
    history.push(updated);
  };

  const rotateElement = (angle) => {
    if (!selectedElement) return;
    const updated = canvasElements.map(el => {
      if (el.id === selectedElement) {
        return { ...el, rotation: (el.rotation || 0) + angle };
      }
      return el;
    });
    setCanvasElements(updated);
    history.push(updated);
  };

  const copyElementById = (id) => {
    const el = canvasElements.find(e => e.id === id);
    if (el) {
      setClipboard({ ...el, id: null });
      const newEl = { ...el, id: `el_${Date.now()}`, x: (el.x || 0) + 20, y: (el.y || 0) + 20 };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated);
      history.push(updated);
      setSelectedElement(newEl.id);
    }
  };

  const mirrorElementById = (id) => {
    setSelectedElement(id);
    setShowMirror(true);
  };

  return {
    moveLayerUp, moveLayerDown, toggleLayerVisibility, toggleLayerLock,
    copyElement, pasteElement, alignElements,
    mirrorElement, rotateElement, copyElementById, mirrorElementById,
  };
};
