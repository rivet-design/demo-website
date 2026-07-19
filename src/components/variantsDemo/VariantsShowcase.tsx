import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import DirectionsPanel from './DirectionsPanel';
import SparkleLoader from './SparkleLoader';
import { useVariantsDemo } from './useVariantsDemo';

// Each variant page is rendered at a fixed, generously-tall logical viewport so
// it fits without an internal scroll (a scrolling iframe would trap the page's
// wheel scroll). The whole iframe is then contain-scaled to fit the preview
// pane, and scrolling="no" guarantees no wheel capture even if a page overflows.
const DESIGN_W = 1280;
const DESIGN_H = 820;

// Portrait (mobile hero): render each page at a mobile-layout width so its OWN
// responsive layout kicks in (the demo pages stack below ~720px). On tablet-ish
// widths, use the available pane width instead of zooming a 412px phone viewport;
// cap below the desktop breakpoint so the sample app stays in its mobile layout.
const PORTRAIT_MIN_W = 412;
const PORTRAIT_MAX_W = 700;
const PORTRAIT_H_TO_W = 920 / 412;

// On narrower desktops the width-driven shell height collapses (the preview pane
// gets short), which leaves the shell too short to host the floating hero chat.
// Keep the shell at a reasonable minimum height so it stays a believable browser
// window and the chat always fits inside it.
const MIN_DESKTOP_H = 440;

// Panel width bounds — mirrors core's App.tsx (PANEL_MIN/MAX/DEFAULT_WIDTH_PX):
// drag-resizable within [274, 395], default ≈ the midpoint scaled up 10%,
// persisted across visits.
const PANEL_MIN_W = 274;
const PANEL_MAX_W = 395;
const PANEL_DEFAULT_W = Math.min(
  PANEL_MAX_W,
  Math.round(((PANEL_MIN_W + PANEL_MAX_W) / 2) * 1.1),
);
const PANEL_WIDTH_KEY = 'rivet-demo:panelWidth';
const clampPanelWidth = (w: number) =>
  Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, w));

// Slide open/close — core's crisp transform-only ease-out.
const PANEL_SLIDE = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

/**
 * The Rivet variants interaction — the inner content of a BrowserFrame: the
 * Directions panel docked on the left (matching core's left-hand panel) and a
 * full-height variant preview beside it. Self-contained (owns the controller +
 * iframe lifecycle) so it can be
 * dropped into the /variants page or the landing hero alike.
 *
 * Iframes are mounted lazily and kept alive (stacked, opacity-toggled) so
 * cycling is an instant crossfade rather than a reload. The incoming frame only
 * reveals once loaded; the previous frame stays opaque beneath it so the
 * dissolve is clean.
 *
 * Up/Down arrows cycle directions, but only while the pointer is over the
 * showcase — so it never hijacks page scrolling on the landing page.
 */
const VariantsShowcase = ({
  heightClassName = 'h-[60vh] min-h-[460px]',
  autoPlay = true,
  initialVariantId,
  loadDelayMs = 0,
  showDirections = true,
  autoAdvanceMs,
  portrait = false,
}: {
  heightClassName?: string;
  /** When false, the showcase stays pinned to the initial variant (no loop). */
  autoPlay?: boolean;
  /** Pin the showcase to a specific variant on mount. */
  initialVariantId?: string;
  /** Delay before the fake "generating" sequence starts (to sequence after an intro). */
  loadDelayMs?: number;
  /**
   * Render the right-hand Directions panel. Off for the mobile hero, where
   * there isn't room — the preview just cycles options on its own.
   */
  showDirections?: boolean;
  /** Auto-advance interval when autoPlay is on (default 1500ms). */
  autoAdvanceMs?: number;
  /**
   * Render each variant at a phone width (its mobile-first layout), fit to the
   * pane width and top-anchored, instead of the 1280px desktop layout. For the
   * mobile hero, where the pane is a vertical rectangle.
   */
  portrait?: boolean;
}) => {
  const ctrl = useVariantsDemo({
    autoPlay,
    initialId: initialVariantId,
    startDelayMs: loadDelayMs,
    autoAdvanceMs,
  });
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set([ctrl.selected.src]),
  );
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [hovered, setHovered] = useState(false);
  // The crossfade underlay = the variant we're transitioning FROM. Track it
  // synchronously during render: an effect-updated value lags one render, so on
  // the click that selects a new variant it still points at the one BEFORE the
  // previous — flashing the wrong variant beneath the incoming fade. Computing
  // it inline keeps the underlay correct, so the dissolve is always clean.
  const curSrcRef = useRef(ctrl.selected.src);
  const prevSrcRef = useRef<string | null>(null);
  if (curSrcRef.current !== ctrl.selected.src) {
    prevSrcRef.current = curSrcRef.current;
    curSrcRef.current = ctrl.selected.src;
  }
  const prevSrc = prevSrcRef.current;
  const previewRef = useRef<HTMLDivElement>(null);
  const [paneSize, setPaneSize] = useState({ w: 0, h: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const reduceMotion = useReducedMotion();

  // --- Panel width / open state (port of core's App.tsx panel plumbing) ---
  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(PANEL_WIDTH_KEY));
      return Number.isFinite(stored) && stored > 0
        ? clampPanelWidth(stored)
        : PANEL_DEFAULT_W;
    } catch {
      return PANEL_DEFAULT_W;
    }
  });
  const [panelOpen, setPanelOpen] = useState(true);
  // Layout width is only reserved after the open slide settles, and released
  // up-front on close, so the preview iframe reflows exactly once per toggle —
  // hidden behind the covering panel (core's isPanelSpaceReserved).
  const [panelSpaceReserved, setPanelSpaceReserved] = useState(true);
  const [resizingPanel, setResizingPanel] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
    } catch {
      // Storage unavailable (private mode) — width just won't persist.
    }
  }, [panelWidth]);

  const startPanelResize = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = panelWidth;
      setResizingPanel(true);
      const onMove = (ev: PointerEvent) =>
        setPanelWidth(clampPanelWidth(startWidth + (ev.clientX - startX)));
      const end = () => {
        setResizingPanel(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    [panelWidth],
  );

  const resetPanelWidth = useCallback(
    () => setPanelWidth(PANEL_DEFAULT_W),
    [],
  );

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => {
      if (open) setPanelSpaceReserved(false);
      return !open;
    });
  }, []);

  // Measure the preview pane so each variant page can be contain-scaled to fit.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setPaneSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Side-by-side (variant + panel) only at sm+; below that the layout stacks.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setVisited((s) =>
      s.has(ctrl.selected.src) ? s : new Set(s).add(ctrl.selected.src),
    );
  }, [ctrl.selected.src]);

  // Arrow-key cycling, scoped to hover so it doesn't capture page scroll.
  useEffect(() => {
    if (!hovered) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable)
        return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        ctrl.cycle(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        ctrl.cycle(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hovered, ctrl]);

  const activeLoaded = loaded.has(ctrl.selected.src);
  // The preview only reveals once the direction has "generated" (faked) AND its
  // iframe has loaded — so the shell shows a generating state on first paint.
  const selectedReady = ctrl.readyIds.has(ctrl.selected.id);
  const activeReady = activeLoaded && selectedReady;

  const measured = paneSize.w > 0;
  const portraitViewportW =
    portrait && measured
      ? Math.min(Math.max(paneSize.w, PORTRAIT_MIN_W), PORTRAIT_MAX_W)
      : PORTRAIT_MIN_W;
  const portraitViewportH = Math.round(portraitViewportW * PORTRAIT_H_TO_W);

  // Desktop: the shell height is driven by the variant — scale to fit WIDTH so
  // there's no letterbox, and collapse the shell (and the RHS panel) to exactly
  // that height. Mobile: keep the passed height and contain the page within it.
  const fixedDesktopHeight = isDesktop && measured && !portrait;
  const desktopHeight = measured
    ? Math.max(DESIGN_H * (paneSize.w / DESIGN_W), MIN_DESKTOP_H)
    : 0;
  // Portrait: render at phone width and fit to the pane WIDTH (top-anchored, so
  // overflow clips). Desktop: fit-to-width, and once floored to MIN_DESKTOP_H
  // cover the taller box. Tablet/mobile-landscape: contain.
  const fitScale = !measured
    ? 0
    : portrait
      ? paneSize.w / portraitViewportW
      : isDesktop
        ? Math.max(paneSize.w / DESIGN_W, desktopHeight / DESIGN_H)
        : Math.min(paneSize.w / DESIGN_W, paneSize.h / DESIGN_H);

  return (
    <div
      className={`relative flex flex-col overflow-hidden sm:flex-row ${
        fixedDesktopHeight ? '' : heightClassName
      }`}
      style={
        fixedDesktopHeight
          ? { height: desktopHeight, minHeight: desktopHeight }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview — the variant itself. Hero of the shell: full height beside
          the panel on desktop, top section above it when stacked on mobile. */}
      <div
        ref={previewRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-white"
      >
        {ctrl.variants
          .filter((v) => visited.has(v.src))
          .map((v) => {
            const isActive = v.src === ctrl.selected.src;
            const isPrev = v.src === prevSrc;
            const opacity = isActive ? (activeReady ? 1 : 0) : isPrev ? 1 : 0;
            return (
              <iframe
                key={v.src}
                src={v.src}
                title={v.label}
                scrolling="no"
                onLoad={() => setLoaded((s) => new Set(s).add(v.src))}
                style={{
                  width: portrait ? portraitViewportW : DESIGN_W,
                  height: portrait ? portraitViewportH : DESIGN_H,
                  position: 'absolute',
                  left: '50%',
                  top: portrait ? 0 : '50%',
                  transform: portrait
                    ? `translateX(-50%) scale(${fitScale})`
                    : `translate(-50%, -50%) scale(${fitScale})`,
                  transformOrigin: portrait ? 'top center' : 'center center',
                  opacity,
                  zIndex: isActive ? 20 : isPrev ? 10 : 0,
                }}
                className={`border-0 transition-opacity duration-300 ease-in-out ${
                  isActive ? '' : 'pointer-events-none'
                }`}
              />
            );
          })}
        {!activeReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-white">
            {selectedReady ? (
              <span className="animate-pulse text-sm text-black/40">
                Loading {ctrl.selected.label}…
              </span>
            ) : (
              <>
                <SparkleLoader className="text-sm text-black/40" />
                <span className="text-sm text-black/40">
                  Generating directions…
                </span>
              </>
            )}
          </div>
        )}

        {/* Control-bar launcher — port of core's RivetPanelLauncher: the
            floating circle with the Rivet mark that toggles the panel, parked
            at its default bottom-right spot in the sample app. */}
        {showDirections && isDesktop && (
          <motion.button
            type="button"
            aria-label={panelOpen ? 'Close panel' : 'Open panel'}
            title={panelOpen ? 'Close panel' : 'Open panel'}
            onClick={togglePanel}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className="absolute bottom-4 right-4 z-40 flex h-11 w-11 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1c1c20] shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.1)] transition-[background-color,box-shadow] duration-150 hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
          >
            <img
              src="/images/riv-logo-white.svg"
              alt=""
              className="h-4 w-4"
              draggable={false}
            />
          </motion.button>
        )}
      </div>

      {/* Directions panel — docked on the LEFT at sm+, stacked below the
          preview on mobile. Hidden for the mobile hero, where the preview
          cycles options on its own. Desktop mirrors core's App.tsx: a spacer
          reserves the layout width while an absolutely-positioned wrapper
          slides the opaque panel with a transform-only animation. */}
      {showDirections && isDesktop && (
        <>
          <div
            aria-hidden
            className="order-first h-full shrink-0"
            style={{ width: panelSpaceReserved ? panelWidth : 0 }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 z-30"
            style={{ width: panelWidth, willChange: 'transform' }}
            initial={false}
            animate={{ x: panelOpen ? 0 : -panelWidth }}
            transition={reduceMotion ? { duration: 0 } : PANEL_SLIDE}
            onAnimationComplete={() => {
              if (panelOpen) setPanelSpaceReserved(true);
            }}
          >
            <DirectionsPanel
              ctrl={ctrl}
              desktop
              onClose={togglePanel}
              onResizeStart={startPanelResize}
              onResizeReset={resetPanelWidth}
              resizing={resizingPanel}
            />
          </motion.div>
        </>
      )}
      {showDirections && !isDesktop && <DirectionsPanel ctrl={ctrl} />}

      {/* While drag-resizing, shield the preview iframe so it can't swallow
          pointer events mid-drag (core's resize overlay). */}
      {resizingPanel && (
        <div className="fixed inset-0 z-[100] cursor-col-resize" />
      )}
    </div>
  );
};

export default VariantsShowcase;
