import { useEffect, useState } from 'react';

/**
 * The About masthead picture, arriving the way the splash lockup does: a short
 * strobe through a set of rasters that settles on the real one.
 *
 * Same cadence and same rule as SplashScreen — every frame is preloaded before
 * the strobe starts, so the timing is the timer's and not the network's. Each
 * frame is drawn into the FINAL picture's box (`object-fit: cover` on a fixed
 * aspect ratio), so the rasters' own proportions never move the layout: the
 * container is the width of the picture it ends on.
 */

/** Per-frame hold. The splash's own strobe rate. */
const FRAME_MS = 85;
/** How many times the set runs before it settles. */
const LOOPS = 3;

const preload = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

type Props = {
  /** The picture the strobe settles on. */
  src: string;
  alt: string;
  /** The frames it runs through on the way there. */
  frames: string[];
  className?: string;
};

const HeroCycle = ({ src, alt, frames, className }: Props) => {
  // The real picture closes the set, so the strobe always lands on it.
  const cycle = [...frames, src];
  const total = cycle.length * LOOPS;
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    // NOT gated on prefers-reduced-motion: iOS turns that on under Low Power
    // Mode, which silently skipped the strobe for every such phone. The
    // sequence is a set of in-place image swaps — nothing moves — and it
    // settles on the real picture within ~1.7s either way.
    let cancelled = false;
    Promise.all(cycle.map(preload)).then(() => {
      if (!cancelled) setStep(0);
    });
    return () => {
      cancelled = true;
    };
    // The set is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === null || step >= total - 1) return;
    const id = window.setTimeout(() => setStep((n) => (n === null ? n : n + 1)), FRAME_MS);
    return () => window.clearTimeout(id);
  }, [step, total]);

  // Before the frames land, the final picture is simply what shows.
  const shown = step === null ? src : cycle[step % cycle.length];

  return <img className={className} src={shown} alt={alt} />;
};

export default HeroCycle;
