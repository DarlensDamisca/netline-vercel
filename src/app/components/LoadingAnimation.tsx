'use client';

import { motion } from 'framer-motion';

type LoadingAnimationProps = {
  size?: number; // en pixels
  colorClass?: string;
};

export const LoadingAnimation = ({
  size = 64,
  colorClass = 'border-primary',
}: LoadingAnimationProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-4 ${colorClass} border-t-transparent`}
        style={{ width: size, height: size }}
      />
      <span className="sr-only">Chargement en cours...</span>
    </motion.div>
  );
};
