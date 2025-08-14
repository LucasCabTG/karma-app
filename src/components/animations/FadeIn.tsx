// Archivo: src/components/animations/FadeIn.tsx
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export function FadeIn({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // La animación solo ocurre una vez
    threshold: 0.1,    // Se activa cuando el 10% del elemento es visible
  });

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}