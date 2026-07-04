import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { telemetry } from '@/lib/telemetry';
import {
  useVariants,
  VariantPill,
  VariantLoadingOverlay,
} from './variants';
import { VARIANTS } from './variants/data';
import Gallery from './gallery/Gallery';
import PaperTexture from './PaperTexture';

const SECTION_BG = '#F0EFE9';

// Internal "design" dimensions the gallery + overlay are authored against.
// A ResizeObserver scales this inner box to fit the outer panel's real width,
// so the 220px sidebar / 52px topbar / overlay coordinates all stay
// proportional on every viewport instead of getting squeezed on mobile.
const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = (DESIGN_WIDTH * 11) / 16;

/**
 * Same workflow-panel layout as the comments section — copy on the left,
 * an interactive panel on the right. Demo runs the variant lifecycle:
 * loading → ready (auto-cycle) → user takeover via chips, chevrons, or
 * arrow keys. The gallery's `.content` area is the "selected element";
 * variants restyle just that region (palette + layout) so the gallery's
 * topbar and sidebar remain stable visual anchors.
 *
 * Top margin matches the comments section so the page bg shows between
 * the two demo panels.
 */
const VariantsDemoSection = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const v = useVariants(VARIANTS, { containerRef: panelRef });

  // Measure the panel and fit the design-width inner box to it. useLayoutEffect
  // sets the initial scale before paint to avoid a one-frame flash at 1.0.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    setScale(el.getBoundingClientRect().width / DESIGN_WIDTH);
    const ro = new ResizeObserver((entries) => {
      setScale(entries[0].contentRect.width / DESIGN_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // While loading, hold on the Original (index 0) — variants don't render
  // until they're "generated".
  const galleryVariant = v.phase === 'loading' ? VARIANTS[0] : v.variant;

  // Track lifecycle phase changes — fires once on mount for loading,
  // then once when the demo enters ready.
  const prevPhaseRef = useRef<typeof v.phase | null>(null);
  useEffect(() => {
    if (prevPhaseRef.current === v.phase) return;
    if (v.phase === 'loading') {
      telemetry.trackVariantsDemoLoadingStarted({
        variantCount: VARIANTS.length,
      });
    } else if (v.phase === 'ready') {
      telemetry.trackVariantsDemoReady({ variantCount: VARIANTS.length });
    }
    prevPhaseRef.current = v.phase;
  }, [v.phase]);

  const handlePrev = () => {
    telemetry.trackVariantsDemoPillNavigation({
      direction: 'prev',
      fromIndex: v.activeIndex,
      fromVariantId: v.variant.id,
    });
    v.prev();
  };
  const handleNext = () => {
    telemetry.trackVariantsDemoPillNavigation({
      direction: 'next',
      fromIndex: v.activeIndex,
      fromVariantId: v.variant.id,
    });
    v.next();
  };
  const handleApply = () => {
    telemetry.trackVariantsDemoApplyClicked({
      variantIndex: v.activeIndex,
      variantId: v.variant.id,
    });
    v.applyCurrent();
  };

  return (
    <div
      style={{ background: SECTION_BG }}
      className="page-gutter-x relative flex w-full justify-center py-16 md:py-24"
    >
      <PaperTexture className="-z-10" />
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        {/* Copy is the outer (left) column at lg; lg:pl-8 keeps it off the
            page's left guide rule (consistent across all workflow panels). */}
        <div className="max-w-[440px] lg:pl-8">
          <h2 className="hero-title-size mt-3 font-main font-normal leading-[1.12] tracking-[-0.01em] text-black">
            Explore lots of design directions
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Fully explore the design space for any interface, big or small.
          </p>
        </div>

        <div
          ref={panelRef}
          className="relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          style={{ aspectRatio: '16 / 11' }}
        >
          {/* Fixed design-space inner box. Everything inside is authored in
              DESIGN_WIDTH × DESIGN_HEIGHT pixels (matching the gallery's
              220px sidebar / 52px topbar / overlay coords) and scaled to
              fit the outer panel. Keeps the demo legible at every viewport. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: DESIGN_WIDTH,
              height: DESIGN_HEIGHT,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
          >
            {/* Gallery target — what the variants restyle. */}
            <div className="h-full w-full">
              <Gallery variant={galleryVariant} />
            </div>

            {/* Variants overlay — wraps the gallery's `.content` area only.
                Numbers match the gallery's grid: 52px topbar, 220px sidebar.
                z-index sits above the gallery's sticky `.content-header`
                (z-index: 10) so the dashed box, sparkle, and pill render in
                front of the header. */}
            <div
              className="rivet-variants pointer-events-none absolute"
              style={{
                top: 52,
                left: 220,
                right: 0,
                bottom: 0,
                zIndex: 20,
              }}
            >
              <AnimatePresence>
                {v.phase === 'loading' ? (
                  <VariantLoadingOverlay key="loading" />
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {v.phase === 'ready' ? (
                  <div
                    key="pill"
                    className="pointer-events-auto absolute"
                    style={{
                      top: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <VariantPill
                      variants={v.variants}
                      activeIndex={v.activeIndex}
                      isSwitching={v.isSwitching}
                      onPrev={handlePrev}
                      onNext={handleNext}
                      onApply={handleApply}
                    />
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantsDemoSection;
