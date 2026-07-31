export const SPRING = { type: 'spring', stiffness: 300, damping: 30 };
export const SPRING_FAST = { type: 'spring', stiffness: 420, damping: 28 };
export const SPRING_GENTLE = { type: 'spring', stiffness: 200, damping: 28 };

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 35 } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const MODAL_TRANSITION = {
  initial: { opacity: 0, scale: 0.95, y: 14 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: SPRING },
  exit:    { opacity: 0, scale: 0.95, y: 8,  transition: { duration: 0.15 } },
};

export const SHEET_TRANSITION = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0,      transition: SPRING },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.2 } },
};

export const STAGGER_CONTAINER = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: SPRING },
};

export const haptic = (ms = 15) => {
  try { navigator.vibrate?.(ms); } catch {}
};
