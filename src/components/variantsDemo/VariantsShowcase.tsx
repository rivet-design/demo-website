import { useEffect, useRef, useState } from 'react';
import DirectionsPanel from './DirectionsPanel';
import { useVariantsDemo } from './useVariantsDemo';

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

  return (
    <div
      className={`flex flex-col sm:flex-row ${heightClassName}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview — the variant itself. Hero of the shell: full height beside
          the panel on desktop, top section above it when stacked on mobile. */}
      <div className="relative min-h-0 min-w-0 flex-1 bg-white">
        {ctrl.variants
          .filter((v) => visited.has(v.src))
          .map((v) => {
            const isActive = v.src === ctrl.selected.src;
            const isPrev = v.src === prevSrc;
            const opacity = isActive ? (activeLoaded ? 1 : 0) : isPrev ? 1 : 0;
            return (
              <iframe
                key={v.src}
                src={v.src}
                title={v.label}
                onLoad={() => setLoaded((s) => new Set(s).add(v.src))}
                style={{ opacity, zIndex: isActive ? 20 : isPrev ? 10 : 0 }}
                className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ease-in-out ${
                  isActive ? '' : 'pointer-events-none'
                }`}
              />
            );
          })}
        {!activeLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white">
            <span className="animate-pulse text-sm text-black/40">
              Loading {ctrl.selected.label}…
            </span>
          </div>
        )}
      </div>

      {/* Directions panel — right side, inside the shell */}
      <DirectionsPanel ctrl={ctrl} />
    </div>
  );
};

export default VariantsShowcase;
