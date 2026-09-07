import { useEffect, useState } from 'react';
import { useTransform, type MotionValue } from 'motion/react';

// Scroll-scrubbed FLIP: continuously blends the hero's real DOM from its
// natural full-size position/scale into a landing target's rect (optionally
// enlarged via targetScale), driven by `progress` (0 → 1). Same delta math as
// the one-shot splash→hero-lockup FLIP in SplashScreen.tsx, made continuous —
// since the source and target are in-flow siblings that scroll together at
// 1:1, the delta between their rects is scroll-position-invariant and only
// needs remeasuring on resize, not on every scroll frame.

type Rect = { dx: number; dy: number; scale: number };

const IDENTITY: Rect = { dx: 0, dy: 0, scale: 1 };

type UseHeroShrinkFlipOptions = {
  /** The hero copy element (lockup + headline + CTAs) that should shrink. */
  sourceEl: HTMLElement | null;
  /** The landing target — the element the hero shrinks toward. */
  targetEl: HTMLElement | null;
  /**
   * Scales the target's own measured rect around its center before landing
   * there, instead of landing at the target's literal size — e.g. 1.1 lands
   * at a card 10% bigger than the target element itself. Defaults to 1 (land
   * at the target's real size).
   */
  targetScale?: number;
  /** 0 → 1 scroll progress driving the blend. */
  progress: MotionValue<number>;
  /** When false, the hero never moves (reduced-motion / mobile). */
  enabled: boolean;
};

const useHeroShrinkFlip = ({
  sourceEl,
  targetEl,
  targetScale = 1,
  progress,
  enabled,
}: UseHeroShrinkFlipOptions) => {
  const [rect, setRect] = useState<Rect>(IDENTITY);

  // Plain object refs wouldn't re-trigger this effect when the target mounts
  // later (BrowserFrame's content pane isn't in the DOM until `heroRevealed`
  // flips true) — sourceEl/targetEl are state, set via callback refs, so a
  // null→element transition IS a dependency change and re-measures.
  useEffect(() => {
    if (!enabled || !sourceEl || !targetEl) {
      setRect(IDENTITY);
      return;
    }

    const measure = () => {
      const sourceRect = sourceEl.getBoundingClientRect();
      const rawTargetRect = targetEl.getBoundingClientRect();
      if (sourceRect.width === 0 || rawTargetRect.width === 0) return;
      // Enlarge the target rect around its own center before landing there
      // (uniform scale, same single-factor technique as SplashScreen's FLIP —
      // height follows the same factor as width).
      const targetWidth = rawTargetRect.width * targetScale;
      const targetCenterX = rawTargetRect.left + rawTargetRect.width / 2;
      const targetCenterY = rawTargetRect.top + rawTargetRect.height / 2;
      const scale = targetWidth / sourceRect.width;
      const dx = targetCenterX - (sourceRect.left + sourceRect.width / 2);
      const dy = targetCenterY - (sourceRect.top + sourceRect.height / 2);
      setRect({ dx, dy, scale });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(sourceEl);
    ro.observe(targetEl);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled, sourceEl, targetEl, targetScale]);

  // Array-range interpolation (not a closure-based transformer) so each
  // render's latest `rect` is picked up correctly as it's remeasured.
  const x = useTransform(progress, [0, 1], [0, rect.dx]);
  const y = useTransform(progress, [0, 1], [0, rect.dy]);
  const scale = useTransform(progress, [0, 1], [1, rect.scale]);

  // Raw numbers too — callers that need a DIFFERENT progress curve than the
  // plain 0→1 blend above (e.g. a synced element that also needs to unwind
  // back to identity later) build their own multi-point useTransform from
  // these instead of composing on top of x/y/scale.
  return { x, y, scale, rect };
};

export default useHeroShrinkFlip;
