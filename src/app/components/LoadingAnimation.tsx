'use client';

import { motion } from 'framer-motion';

export const LoadingAnimation = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin" />
    </motion.div>
  );
};
