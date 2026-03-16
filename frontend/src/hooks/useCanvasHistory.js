import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export const useCanvasHistory = () => {
  const historyRef = useRef([]);
  const indexRef = useRef(-1);
  const [, tick] = useState(0);

  const push = useCallback((elements) => {
    const snapshot = JSON.parse(JSON.stringify(elements));
    // Trim future states if we're in the middle of history
    const trimmed = historyRef.current.slice(0, indexRef.current + 1);
    trimmed.push(snapshot);
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    indexRef.current = trimmed.length - 1;
    tick(n => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    tick(n => n + 1);
    return JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current += 1;
    tick(n => n + 1);
    return JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
  }, []);

  const reset = useCallback((elements) => {
    historyRef.current = [JSON.parse(JSON.stringify(elements))];
    indexRef.current = 0;
    tick(n => n + 1);
  }, []);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
  };
};
