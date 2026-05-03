import { useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  useVariants,
  VariantPill,
  VariantLoadingOverlay,
} from './variants';
import { VARIANTS } from './variants/data';
import Gallery from './gallery/Gallery';

const SECTION_BG = '#F0EFE9';

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
  const v = useVariants(VARIANTS, { containerRef: panelRef });

  // While loading, hold on the Original (index 0) — variants don't render
  // until they're "generated".
  const galleryVariant = v.phase === 'loading' ? VARIANTS[0] : v.variant;

  return (
    <div
      style={{ background: SECTION_BG }}
      className="flex w-full justify-center px-[5vw] py-16 md:py-24"
    >
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <div className="max-w-[440px]">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Try different design directions
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Select anything in your real app and generate UI variants to cycle through.
          </p>
        </div>

        <div
          ref={panelRef}
          className="relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          style={{ aspectRatio: '16 / 11' }}
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
                    onPrev={v.prev}
                    onNext={v.next}
                    onApply={v.applyCurrent}
                  />
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantsDemoSection;
