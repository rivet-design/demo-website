import { useEffect, useState, type ReactNode } from 'react';

import { useInView } from '../hooks/use-in-view';

/**
 * Blur-fades a block in as it arrives, and blurs it back out as you scroll
 * past — two different gestures, deliberately:
 *
 *   arriving  blur + fade + a short rise, out of nothing
 *   leaving   blur ONLY — it stays opaque and in place, so scrolling past
 *             defocuses the block rather than deleting it
 *
 * The observer alone can't tell "not yet arrived" from "already passed" (both
 * are just `inView: false`), so a latch records whether the block has ever
 * been seen and the out-state changes shape once it has.
 */
type ScrollRevealProps = {
  children: ReactNode;
  /** Stagger, in ms. */
  delay?: number;
  className?: string;
};

const ScrollReveal = ({ children, delay = 0, className }: ScrollRevealProps) => {
  // Asymmetric on purpose. The small bottom inset lets a block sharpen as soon
  // as it clears the fold; the large top inset means it counts as gone once it
  // passes the upper 42% of the viewport — roughly when the next section takes
  // over. A symmetric band leaves it sharp until it is almost entirely
  // off-screen, so the blur-out is never actually seen.
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '-42% 0px -10% 0px',
  });
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  const left = !inView && seen;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView || left ? 1 : 0,
        transform: inView || left ? 'translateY(0)' : 'translateY(22px)',
        filter: inView ? 'blur(0px)' : 'blur(10px)',
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
