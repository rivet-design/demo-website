import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

/**
 * The page's one scroll gesture: a block sharpens as it arrives and goes soft
 * again once you've scrolled past it.
 *
 *   arriving  blur + fade + a short rise, out of nothing
 *   leaving   blur ONLY — it stays opaque and in place, so scrolling past
 *             defocuses the block rather than deleting it
 *
 * Every section on the page runs through this, so the timings live here rather
 * than being re-typed per component — that drift is what left the hero demo
 * sliding away perfectly sharp while everything under it went soft.
 *
 * Which half applies is decided by WHERE the block is, not by a seen-latch: a
 * block sitting above the observed band has gone past, anything else hasn't
 * arrived yet. A latch can't tell those apart for a block that starts on
 * screen — which the hero does.
 *
 * "Above the band" is measured against the band's own top edge, NOT the
 * window's. Comparing to the window (`top < 0`) leaves a whole 42%-tall dead
 * zone where a block has left the band but not yet left the screen: it counted
 * as 'before' there and hid itself again, so scrolling a section up towards the
 * nav made it fade out backwards while the content under it stayed sharp.
 */
const DURATION_MS = 700;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const BLUR = '10px';
const RISE = '22px';

// Asymmetric on purpose. The small bottom inset lets a block sharpen as soon as
// it clears the fold; the large top inset means it counts as gone once it
// passes the upper 42% of the viewport — roughly when the next section takes
// over. A symmetric band leaves it sharp until it is almost entirely
// off-screen, so the blur-out is never actually seen.
const ROOT_MARGIN = '-42% 0px -10% 0px';

export type ScrollRevealPhase = 'before' | 'in' | 'past';

export type ScrollRevealOptions<T extends HTMLElement> = {
  /** Stagger, in ms. */
  delay?: number;
  /**
   * Observe an element the caller already holds a ref to, instead of the one
   * this hook makes. Needed wherever the target is spoken for — the hero
   * showcase and the pinned stage are both measured elsewhere.
   */
  ref?: RefObject<T>;
  /**
   * Whether this block owns its own arrival. Off for blocks handed in by
   * something else (the hero, which the splash reveals), which start sharp and
   * only ever pick up the LEAVING half.
   */
  entrance?: boolean;
  /**
   * Whether this block goes soft again on the way out. Off for a block that
   * shares a section with something still sharp below it — a heading defocusing
   * while its own cards are crisp reads as a bug, not as depth.
   */
  leave?: boolean;
  /** Skip observing entirely; `style` comes back empty and phase stays 'in'. */
  disabled?: boolean;
};

export const useScrollReveal = <T extends HTMLElement>({
  delay = 0,
  ref: externalRef,
  entrance = true,
  leave = true,
  disabled = false,
}: ScrollRevealOptions<T> = {}) => {
  const ownRef = useRef<T>(null);
  const ref = externalRef ?? ownRef;
  const [phase, setPhase] = useState<ScrollRevealPhase>(
    entrance && !disabled ? 'before' : 'in',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    // SSR / very old browsers: leave everything sharp and in place.
    if (typeof IntersectionObserver === 'undefined') {
      setPhase('in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('in');
          return;
        }
        const band = entry.rootBounds;
        const past = band
          ? entry.boundingClientRect.bottom <= band.top
          : entry.boundingClientRect.top < 0;
        setPhase(past ? 'past' : 'before');
      },
      { rootMargin: ROOT_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, disabled]);

  // A block without its own entrance never renders the 'before' state — it is
  // already on screen when something else hands it in.
  const waiting = entrance && phase === 'before' && !disabled;
  const soft = waiting || (leave && phase === 'past');

  const style: CSSProperties = disabled
    ? {}
    : {
        opacity: waiting ? 0 : 1,
        transform: waiting ? `translateY(${RISE})` : 'translateY(0)',
        filter: soft ? `blur(${BLUR})` : 'blur(0px)',
        transition:
          `opacity ${DURATION_MS}ms ${EASE} ${delay}ms,` +
          `transform ${DURATION_MS}ms ${EASE} ${delay}ms,` +
          `filter ${DURATION_MS}ms ${EASE} ${delay}ms`,
      };

  return { ref, phase, style, isPast: phase === 'past' };
};

/**
 * The leaving half on its own, for a block whose entrance is driven by someone
 * else's style object — merge this after theirs. No delay: a stagger on the way
 * out reads as lag.
 */
export const scrollRevealLeaveStyle: CSSProperties = {
  filter: `blur(${BLUR})`,
  transition: `filter ${DURATION_MS}ms ${EASE}`,
};
