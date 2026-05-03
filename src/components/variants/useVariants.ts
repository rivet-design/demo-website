import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Variant } from './types';

type Phase = 'loading' | 'ready';

type Options = {
  /** Container element used for the visibility check. */
  containerRef: RefObject<HTMLElement | null>;
  /** Auto-cycle interval in ms. Default 3500. */
  cycleMs?: number;
  /** Threshold for "in view" — defaults to 40% of the container visible. */
  visibilityThreshold?: number;
  /** How long the "generating" loading state plays before variants are ready. Default 1800ms. */
  loadingMs?: number;
  /** Duration the `isSwitching` flag stays true after a variant changes. Drives the pill's brief scale-down bounce. */
  switchPulseMs?: number;
};

type Result = {
  variants: Variant[];
  activeIndex: number;
  variant: Variant;
  phase: Phase;
  /** True for `switchPulseMs` after every variant change — drives Rivet's pill bounce. */
  isSwitching: boolean;
  /** True once the user has clicked a chevron / apply / arrow key — auto-cycle is permanently off. */
  paused: boolean;
  setActiveIndex: (i: number) => void;
  next: () => void;
  prev: () => void;
  applyCurrent: () => void;
};

/**
 * Drives the demo lifecycle:
 *   loading (generating overlay)  →  ready (auto-cycle, user can take over)
 *
 * Both phases are gated on visibility — the loading state doesn't start
 * playing until the panel is actually on screen, so users who scroll past
 * fast don't miss it. Auto-cycle stops permanently once the user touches a
 * control (button or arrow key). `prefers-reduced-motion` skips the cycle.
 *
 * Arrow-key navigation is registered window-wide while the panel is in
 * view — matches the real Rivet behavior at CommentCarouselLayer.tsx:415.
 */
export function useVariants(variants: Variant[], opts: Options): Result {
  const {
    containerRef,
    cycleMs = 3500,
    visibilityThreshold = 0.4,
    loadingMs = 1800,
    switchPulseMs = 220,
  } = opts;
  const [activeIndex, setActiveIndexState] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [isSwitching, setIsSwitching] = useState(false);

  const setActiveIndex = (i: number) => {
    setActiveIndexState(((i % variants.length) + variants.length) % variants.length);
    setPaused(true);
  };
  const next = () => setActiveIndex(activeIndex + 1);
  const prev = () => setActiveIndex(activeIndex - 1);
  /** No real diff to commit in the demo — Apply just pauses cycling. */
  const applyCurrent = () => setPaused(true);

  // Track visibility — gates loading timer, cycle, and arrow keys.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting),
      { threshold: visibilityThreshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef, visibilityThreshold]);

  // Loading → ready transition. Re-runs whenever visibility flips, with no
  // "did start" guard — that guard combined with the cleanup-cancels-timer
  // pattern would strand the demo on `loading` if the user scrolled past
  // mid-load (timer cancelled, guard still true, never re-scheduled).
  // Now: while inView && loading, a fresh `loadingMs` timer runs; scrolling
  // out resets it; scrolling back starts it over.
  useEffect(() => {
    if (!inView || phase !== 'loading') return;
    const id = window.setTimeout(() => setPhase('ready'), loadingMs);
    return () => window.clearTimeout(id);
  }, [inView, phase, loadingMs]);

  // Auto-cycle. Single timer kept stable via indexRef so timer refs don't
  // capture stale state.
  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;

  useEffect(() => {
    if (phase !== 'ready' || paused || !inView) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const id = window.setInterval(() => {
      const nextIdx = (indexRef.current + 1) % variants.length;
      setActiveIndexState(nextIdx);
    }, cycleMs);
    return () => window.clearInterval(id);
  }, [phase, paused, inView, cycleMs, variants.length]);

  // Pulse `isSwitching` for switchPulseMs whenever activeIndex flips. Drives
  // the pill's quick scale-down bounce on each switch (auto or manual).
  useEffect(() => {
    setIsSwitching(true);
    const id = window.setTimeout(() => setIsSwitching(false), switchPulseMs);
    return () => window.clearTimeout(id);
  }, [activeIndex, switchPulseMs]);

  // Window-wide arrow-key navigation while the panel is in view (and
  // variants are ready). Matches CommentCarouselLayer.tsx:415–445.
  // Capturing prev/next via a ref so the listener doesn't reattach on every
  // activeIndex change.
  const prevRef = useRef(prev);
  const nextRef = useRef(next);
  prevRef.current = prev;
  nextRef.current = next;
  useEffect(() => {
    if (phase !== 'ready' || !inView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevRef.current();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, inView]);

  return {
    variants,
    activeIndex,
    variant: variants[activeIndex],
    phase,
    isSwitching,
    paused,
    setActiveIndex,
    next,
    prev,
    applyCurrent,
  };
}
