import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

/**
 * The page's one scroll gesture: a block fades in with a short rise as it
 * arrives, and stays crisp on the way out. The scroll blur was cut for being
 * too distracting — everywhere except the hero, which keeps its leaving blur
 * via `scrollRevealLeaveStyle` below.
 *
 * Every section on the page runs through this, so the timings live here rather
 * than being re-typed per component.
 *
 * Whether a block has arrived is decided by WHERE it is, not by a seen-latch: a
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

// Asymmetric on purpose. The small bottom inset lets a block reveal as soon as
// it clears the fold; the large top inset means it counts as 'past' once it
// passes the upper 42% of the viewport — roughly when the next section takes
// over. `isPast` consumers key off that boundary.
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
  /** Skip observing entirely; `style` comes back empty and phase stays 'in'. */
  disabled?: boolean;
};

export const useScrollReveal = <T extends HTMLElement>({
  delay = 0,
  ref: externalRef,
  entrance = true,
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

  const style: CSSProperties = disabled
    ? {}
    : {
        opacity: waiting ? 0 : 1,
        transform: waiting ? `translateY(${RISE})` : 'translateY(0)',
        transition:
          `opacity ${DURATION_MS}ms ${EASE} ${delay}ms,` +
          `transform ${DURATION_MS}ms ${EASE} ${delay}ms`,
      };

  return { ref, phase, style, isPast: phase === 'past' };
};

/**
 * The leaving blur on its own — the hero is the only block that still
 * defocuses on the way out, and its entrance is driven by someone else's style
 * object, so merge this after theirs. No delay: a stagger on the way out reads
 * as lag.
 */
export const scrollRevealLeaveStyle: CSSProperties = {
  filter: `blur(${BLUR})`,
  transition: `filter ${DURATION_MS}ms ${EASE}`,
};
