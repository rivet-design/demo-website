import { useEffect, useRef, useState } from 'react';
import DirectionsPanel from './DirectionsPanel';
import SparkleLoader from './SparkleLoader';
import { useVariantsDemo } from './useVariantsDemo';

// Each variant page is rendered at a fixed, generously-tall logical viewport so
// it fits without an internal scroll (a scrolling iframe would trap the page's
// wheel scroll). The whole iframe is then contain-scaled to fit the preview
// pane, and scrolling="no" guarantees no wheel capture even if a page overflows.
const DESIGN_W = 1280;
const DESIGN_H = 820;

/**
 * The Rivet variants interaction — the inner content of a BrowserFrame: a
 * full-height variant preview on the left and the Directions panel on the
 * right. Self-contained (owns the controller + iframe lifecycle) so it can be
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
}: {
  heightClassName?: string;
  /** When false, the showcase stays pinned to the initial variant (no loop). */
  autoPlay?: boolean;
  /** Pin the showcase to a specific variant on mount. */
  initialVariantId?: string;
}) => {
  const ctrl = useVariantsDemo({ autoPlay, initialId: initialVariantId });
  const [visited, setVisited] = useState<Set<string>>(
    () => new Set([ctrl.selected.src]),
  );
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const prevSelectedRef = useRef(ctrl.selected.src);
  const previewRef = useRef<HTMLDivElement>(null);
  const [paneSize, setPaneSize] = useState({ w: 0, h: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

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
    if (prevSelectedRef.current !== ctrl.selected.src) {
      setPrevSrc(prevSelectedRef.current);
      prevSelectedRef.current = ctrl.selected.src;
    }
  }, [ctrl.selected.src]);

  // Arrow-key cycling, scoped to hover so it doesn't capture page scroll.
  useEffect(() => {
    if (!hovered) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
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

  // Desktop: the shell height is driven by the variant — scale to fit WIDTH so
  // there's no letterbox, and collapse the shell (and the RHS panel) to exactly
  // that height. Mobile: keep the passed height and contain the page within it.
  const measured = paneSize.w > 0;
  const fitScale = !measured
    ? 0
    : isDesktop
      ? paneSize.w / DESIGN_W
      : Math.min(paneSize.w / DESIGN_W, paneSize.h / DESIGN_H);
  const desktopHeight = measured ? DESIGN_H * (paneSize.w / DESIGN_W) : 0;

  return (
    <div
      className={`flex flex-col sm:flex-row ${
        isDesktop && measured ? '' : heightClassName
      }`}
      style={
        isDesktop && measured
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
                  width: DESIGN_W,
                  height: DESIGN_H,
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${fitScale})`,
                  transformOrigin: 'center center',
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
      </div>

      {/* Directions panel — right side, inside the shell */}
      <DirectionsPanel ctrl={ctrl} />
    </div>
  );
};

export default VariantsShowcase;
