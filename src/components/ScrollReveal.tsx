import { type ReactNode } from 'react';

import { useScrollReveal } from '../hooks/use-scroll-reveal';

/**
 * Wrapper form of the page's scroll gesture — see `useScrollReveal`, which owns
 * the behaviour and the timings. Use the hook directly wherever a wrapper
 * element would get in the way (a grid child, or a node that already carries
 * its own ref and style).
 */
type ScrollRevealProps = {
  children: ReactNode;
  /** Stagger, in ms. */
  delay?: number;
  className?: string;
};

const ScrollReveal = ({ children, delay = 0, className }: ScrollRevealProps) => {
  const { ref, style } = useScrollReveal<HTMLDivElement>({ delay });

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default ScrollReveal;
