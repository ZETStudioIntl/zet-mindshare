import React from 'react';
import { motion } from 'framer-motion';
import { SPRING_FAST, haptic } from '../lib/animations';

const SpringButton = React.forwardRef(function SpringButton(
  { children, onClick, hapticMs = 15, className, style, disabled, ...rest },
  ref
) {
  const handleClick = (e) => {
    if (!disabled) haptic(hapticMs);
    onClick?.(e);
  };

  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={SPRING_FAST}
      onClick={handleClick}
      className={className}
      style={style}
      disabled={disabled}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export default SpringButton;
