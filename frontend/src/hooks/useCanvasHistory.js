import { useState, useCallback } from 'react';

const MAX_HISTORY = 50;

export const useCanvasHistory = (initialElements = []) => {
  const [history, setHistory] = useState([initialElements]);
  const [index, setIndex] = useState(0);

  const push = useCallback((elements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, index + 1);
      const next = [...trimmed, [...elements]];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [index]);

  const undo = useCallback(() => {
    if (index <= 0) return null;
    const newIndex = index - 1;
    setIndex(newIndex);
    return [...history[newIndex]];
  }, [history, index]);

  const redo = useCallback(() => {
    if (index >= history.length - 1) return null;
    const newIndex = index + 1;
    setIndex(newIndex);
    return [...history[newIndex]];
  }, [history, index]);

  const reset = useCallback((elements) => {
    setHistory([elements]);
    setIndex(0);
  }, []);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
