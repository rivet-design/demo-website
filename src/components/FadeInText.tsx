import { motion } from 'motion/react';
import { ReactNode } from 'react';

type FadeInTextProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
};

const FadeInText = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  yOffset = 20,
}: FadeInTextProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        ease: [0.34, 1.56, 0.64, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInText;
