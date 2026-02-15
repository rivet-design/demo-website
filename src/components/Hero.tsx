import { motion } from 'motion/react';

type HeroProps = {
  title: string;
  subtitle?: string;
};

const Hero = ({ title, subtitle }: HeroProps) => {
  return (
    <div className="w-full max-w-4xl text-center">
      <motion.h1
        className="type-display-hero text-white md:text-6xl lg:text-7xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {title}
      </motion.h1>
      {subtitle ? (
        <motion.p
          className="type-subtitle mt-6 text-content-subtle md:text-xl lg:text-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </div>
  );
};

export default Hero;
