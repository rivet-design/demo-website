import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * A realistic macOS-style browser/window chrome that can wrap any media —
 * a screenshot <img>, a <video>/mp4, or any arbitrary children.
 *
 * Renders the title bar with the red / yellow / green "traffic light" dots on
 * the left, an optional URL/title pill in the center, and the content below.
 *
 * When `draggable`, the title bar acts as a window drag handle and the frame
 * can be moved anywhere within its parent container (movement is clamped so the
 * window never leaves the container bounds).
 */
const BrowserFrame = ({
  children,
  url,
  draggable = false,
  animateOpen = false,
  openDelayMs = 32,
  className = '',
}: {
  children: ReactNode;
  /** Optional address-bar URL shown in the center omnibox (Chrome-style). */
  url?: string;
  /** When true, the title bar drags the window within its parent container. */
  draggable?: boolean;
  /**
   * When true, the window plays a macOS-style "maximize from minimized" open on
   * mount: the backdrop shows first, then the frame scales up into place.
   */
  animateOpen?: boolean;
  /**
   * How long to stay "minimized" before the open animation fires. Defaults to
   * one frame; raise it to sequence the open after some other intro (e.g. the
   * hero's agent chat typing first).
   */
  openDelayMs?: number;
  className?: string;
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Open-animation lifecycle: `entered` drives the scale/opacity to their final
  // values; `settled` drops the CSS transition afterwards so dragging stays snappy.
  const [entered, setEntered] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!animateOpen) return;
    // Respect reduced-motion: land fully open with no movement.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true);
      setSettled(true);
      return;
    }
    // Start expanding the moment the page paints — just one frame's delay so the
    // small/transparent start state lands before we flip to the open state (else
    // the browser has nothing to transition from). The second timer fires after
    // the transform settles so we can shed the transition.
    const OPEN_DELAY = Math.max(0, openDelayMs);
    const OPEN_DURATION = 600;
    const start = setTimeout(() => setEntered(true), OPEN_DELAY);
    const done = setTimeout(() => setSettled(true), OPEN_DELAY + OPEN_DURATION + 40);
    return () => {
      clearTimeout(start);
      clearTimeout(done);
    };
  }, [animateOpen, openDelayMs]);
  // Geometry captured at drag start so move math is cheap and clamp-correct.
  const drag = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    const frame = frameRef.current;
    const container = frame?.parentElement;
    if (!frame || !container) return;

    const frameRect = frame.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // Natural (untranslated) top-left of the frame.
    const naturalLeft = frameRect.left - offset.x;
    const naturalTop = frameRect.top - offset.y;

    drag.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
      // Keep the window fully inside the container.
      minX: containerRect.left - naturalLeft,
      maxX: containerRect.right - (naturalLeft + frameRect.width),
      minY: containerRect.top - naturalTop,
      maxY: containerRect.bottom - (naturalTop + frameRect.height),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setOffset({
      x: clamp(d.startX + (e.clientX - d.pointerX), d.minX, d.maxX),
      y: clamp(d.startY + (e.clientY - d.pointerY), d.minY, d.maxY),
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Drag offset and the open animation both live on the root transform.
  const dragTransform = draggable
    ? `translate3d(${offset.x}px, ${offset.y}px, 0)`
    : '';
  // Start small and a touch low (as if rising from the dock), settle at 1:1.
  const openTransform = animateOpen
    ? entered
      ? 'scale(1)'
      : 'scale(0.35) translateY(14%)'
    : '';
  const transform = `${dragTransform} ${openTransform}`.trim();

  const rootStyle: CSSProperties = {};
  if (transform) rootStyle.transform = transform;
  if (animateOpen) {
    rootStyle.opacity = entered ? 1 : 0;
    // Grow from near the bottom-center, the macOS un-minimize direction.
    rootStyle.transformOrigin = '50% 92%';
    rootStyle.willChange = 'transform, opacity';
    if (!settled) {
      rootStyle.transition =
        'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out';
    }
  }

  return (
    <div
      ref={frameRef}
      style={rootStyle}
      className={`flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)] ${className}`}
    >
      {/* Title bar — doubles as the window drag handle when draggable. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`flex h-10 items-center gap-3 border-b border-black/10 bg-[#f1f1f2] px-4 ${
          draggable ? 'cursor-grab touch-none select-none active:cursor-grabbing' : ''
        }`}
      >
        {/* Traffic lights. The glyphs (× − +) only appear while the group is
            hovered, matching macOS / Chrome behaviour; each button also darkens
            on its own hover. */}
        <div className="group flex items-center gap-2">
          <button
            type="button"
            aria-label="Close"
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-inset ring-black/10 transition-colors hover:bg-[#ee4840]"
          >
            <span className="text-[7px] font-bold leading-none text-black/55 opacity-0 transition-opacity group-hover:opacity-100">
              ✕
            </span>
          </button>
          <button
            type="button"
            aria-label="Minimize"
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-inset ring-black/10 transition-colors hover:bg-[#f0ad1c]"
          >
            <span className="text-[10px] font-bold leading-none text-black/55 opacity-0 transition-opacity group-hover:opacity-100">
              −
            </span>
          </button>
          <button
            type="button"
            aria-label="Maximize"
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-inset ring-black/10 transition-colors hover:bg-[#1eb135]"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-2 w-2 text-black/55 opacity-0 transition-opacity group-hover:opacity-100"
              fill="currentColor"
              aria-hidden
            >
              {/* Top-left wedge */}
              <path d="M2 2 H8 L2 8 Z" />
              {/* Bottom-right wedge */}
              <path d="M14 14 H8 L14 8 Z" />
            </svg>
          </button>
        </div>

        {/* Center omnibox (Chrome-style address bar). */}
        {url && (
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex min-w-0 max-w-[28rem] flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] text-black/60 ring-1 ring-inset ring-black/10">
              {/* Lock icon */}
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3 shrink-0 text-black/40"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 1a3 3 0 0 0-3 3v2H4.5A1.5 1.5 0 0 0 3 7.5v5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 6H11V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 0 1 3 0v2Z" />
              </svg>
              <span className="truncate">{url}</span>
            </div>
          </div>
        )}

        {/* Spacer to keep the omnibox visually centered against the lights. */}
        {url && <div className="w-[52px] shrink-0" aria-hidden />}
      </div>

      {/* Content — fills the remaining height when the frame has a fixed height
          (e.g. an aspect-ratio panel); sizes to its children otherwise. */}
      <div className="min-h-0 flex-1 bg-white">{children}</div>
    </div>
  );
};

export default BrowserFrame;
