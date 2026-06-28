import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the referenced element is within (or near) the viewport.
 *
 * Used to pause off-screen animation loops (scripted terminals, rAF tickers)
 * so they don't keep re-rendering and competing with the compositor while the
 * user scrolls elsewhere on the page. The default 200px rootMargin starts work
 * just before the element enters view so there's no visible "cold start".
 */
export const useInView = <T extends Element>(
  options: IntersectionObserverInit = { rootMargin: '200px' },
) => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // SSR / very old browsers: assume visible so content still animates.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting),
      options,
    );
    io.observe(el);
    return () => io.disconnect();
    // options is captured once on mount; callers pass a stable intent, not a
    // changing target. Re-subscribing on every render would defeat the purpose.
  }, []);

  return { ref, inView };
};
