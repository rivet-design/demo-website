import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import Gallery from '../gallery/Gallery';
import { ITEMS, type GalleryItem } from '../gallery/data';
import DirectionsPanel from '../variantsDemo/DirectionsPanel';
import { useVariantsDemo } from '../variantsDemo/useVariantsDemo';
import type { DemoVariant } from '../variantsDemo/data';
import { FLUID_INITIAL_ID, FLUID_VARIANTS } from './fluidVariants';
import ScriptedCommentOverlay from './ScriptedCommentOverlay';
import {
  SCRIPT_DESIGN_H,
  SCRIPT_DESIGN_W,
  useScriptedCommentDemo,
} from './useScriptedCommentDemo';

/**
 * Desktop two-pane content for the "Explore with precision" panel, placed inside
 * a BrowserFrame: the directions list docked on the LEFT (matching core's
 * left-hand panel) and a scaled live <Gallery> with the scripted comment
 * overlay beside it — mirroring the hero's VariantsShowcase. A scripted drag
 * leaves the comment "Try simpler layouts", then layout directions generate on
 * the left; selecting one restyles the gallery.
 */

type Selected = { id: string; gallery?: DemoVariant['gallery'] } | null;

// The directions panel renders at its natural 340px width but is scaled down a
// touch for THIS demo (vs the hero) so the gallery keeps more room — smaller
// font + less wide, proportionally. The wrapper reserves the scaled width and
// over-sizes the inner height so the scaled panel still fills the shell with no
// gap. (useProximityHover is transform-safe, so the hover highlight stays put.)
const DIRECTIONS_W = 340;
const DIRECTIONS_SCALE = 0.9;
const DIRECTIONS_BOX_W = Math.round(DIRECTIONS_W * DIRECTIONS_SCALE);

// On mobile there's no room for the directions panel, so the "vary" resolves
// differently: instead of listing directions on the right, the gallery itself
// reflows into the first fluid direction — the airy two-column layout. Pull that
// direction's gallery config so the mobile shell can apply it directly.
const TWO_COLUMN_DIRECTION = FLUID_VARIANTS.find((v) => v.id === FLUID_INITIAL_ID);

// The gallery tiles are recolored to a calm grayscale set so the orange comment
// markers + selection read as the only colored elements on the surface.
const BRAND_GRAY_PAIRS = [
  ['#1c1c20', '#d1d5db'],
  ['#232328', '#f3f4f6'],
  ['#2e2e2e', '#c7c9cf'],
  ['#38383d', '#e5e7eb'],
  ['#47474d', '#f8fafc'],
  ['#5a5a61', '#d1d5db'],
] as const;

const GRAY_GALLERY_ITEMS: GalleryItem[] = ITEMS.map((item, i) => {
  const [placeholderColor, artColor] = BRAND_GRAY_PAIRS[i % BRAND_GRAY_PAIRS.length];
  return { ...item, placeholderColor, artColor };
});

// The directions controller only mounts once the comment is "applied" — before
// that the right pane shows an empty panel (no premature skeletons). Split into
// its own component so the `useVariantsDemo` hook isn't called before then.
const FluidDirections = ({
  onSelect,
}: {
  onSelect: (selected: Selected) => void;
}) => {
  const ctrl = useVariantsDemo({
    autoPlay: false,
    variants: FLUID_VARIANTS,
    initialId: FLUID_INITIAL_ID,
    // The remaining three directions stream in a touch faster here than the
    // hero's default (2800ms).
    allReadyMs: 1900,
  });

  // Restyle the gallery only once the selected direction has "generated"
  // (resolved); before that the gallery stays on its default layout.
  useEffect(() => {
    onSelect(
      ctrl.readyIds.has(ctrl.selectedId)
        ? { id: ctrl.selected.id, gallery: ctrl.selected.gallery }
        : null,
    );
  }, [ctrl.selectedId, ctrl.readyIds, ctrl.selected, onSelect]);

  return <DirectionsPanel ctrl={ctrl} />;
};

const CommentDemoShell = ({
  play,
  mobile = false,
  onDraftCreated,
  onCommentCreated,
}: {
  /** Whether the scripted drag intro plays (false → resolved state, no cursor). */
  play: boolean;
  /**
   * Mobile layout: drop the right-hand directions panel and let the gallery
   * itself reflow into the two-column layout when the comment is varied. The
   * drag/comment/vary animation is unchanged.
   */
  mobile?: boolean;
  onDraftCreated?: () => void;
  onCommentCreated?: () => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  // The design box keeps a fixed WIDTH (legible, stable sidebar proportion) but
  // its HEIGHT tracks the measured pane aspect, so a single uniform scale fills
  // the pane exactly — no letterboxing and no aspect distortion. The gallery
  // simply gets a taller/shorter canvas to render into. `scale` uses max() as a
  // belt-and-braces guarantee of full coverage if the height is ever clamped.
  const [fit, setFit] = useState({ scale: 0, designH: SCRIPT_DESIGN_H });
  const [start, setStart] = useState(!play); // non-play: timeline is moot
  const [selected, setSelected] = useState<Selected>(null);

  useLayoutEffect(() => {
    const el = leftPaneRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const designH = Math.max(
        SCRIPT_DESIGN_H,
        Math.round((h / w) * SCRIPT_DESIGN_W),
      );
      const scale = Math.max(w / SCRIPT_DESIGN_W, h / designH);
      setFit((prev) =>
        prev.scale === scale && prev.designH === designH
          ? prev
          : { scale, designH },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Start the scripted timeline when the panel scrolls to the viewport middle
  // (same trigger the live comment demo used). Only relevant when playing.
  useEffect(() => {
    if (!play) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStart(true);
          io.disconnect();
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  const script = useScriptedCommentDemo({
    enabled: play,
    start,
    designH: fit.designH,
    onDraftOpen: onDraftCreated,
    onSubmit: onCommentCreated,
  });

  const handleSelect = useCallback((next: Selected) => {
    setSelected((prev) => (prev?.id === next?.id ? prev : next));
  }, []);

  // Mobile: there's no directions panel to drive the selection, so reflow the
  // gallery into the two-column layout the moment the script reaches its varied
  // state (and clear it back to the default layout if the timeline restarts).
  const varied = script.phase === 'generating' || script.phase === 'done';
  useEffect(() => {
    if (!mobile) return;
    handleSelect(
      varied && TWO_COLUMN_DIRECTION
        ? { id: TWO_COLUMN_DIRECTION.id, gallery: TWO_COLUMN_DIRECTION.gallery }
        : null,
    );
  }, [mobile, varied, handleSelect]);

  // The directions panel only exists in the desktop two-pane layout.
  const showDirections = !mobile && varied;

  return (
    // overflow-hidden clips the directions panel while it sits off-canvas at a
    // negative margin (the core-style slide-in below).
    <div ref={rootRef} className="flex h-full overflow-hidden">
      {/* Left: scaled live gallery + scripted comment overlay. Fills the frame's
          content height (the panel's 16/11 box drives the size). */}
      <div
        ref={leftPaneRef}
        className="relative min-w-0 flex-1 overflow-hidden bg-white"
      >
        {fit.scale > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: SCRIPT_DESIGN_W,
              height: fit.designH,
              transformOrigin: 'center center',
              transform: `translate(-50%, -50%) scale(${fit.scale})`,
            }}
          >
            <div className="h-full w-full">
              {/* Light chrome so the orange comment marker + selection stand
                  out against it (the placeholder tiles stay dark, like photos). */}
              <Gallery
                variant={selected?.gallery}
                theme="light"
                items={GRAY_GALLERY_ITEMS}
              />
            </div>

            {/* Brief white veil flash on each layout change for a crossfade
                feel without remounting the gallery (which would re-trigger its
                load skeleton). */}
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 bg-white"
              />
            ) : null}

            <ScriptedCommentOverlay state={script} designH={fit.designH} />
          </div>
        ) : null}
      </div>

      {/* Left: the directions panel (desktop only, order-first). Nothing
          renders inside until the comment is "varied" (generating); then it
          slides in by recreating Rivet Core's actual panel animation
          (src/ui/src/App.tsx) — the panel keeps a FIXED width and slides via
          marginLeft (−width → 0) + opacity on the [0.22, 1, 0.36, 1] ease-out
          curve over 0.2s, so the content stays rigid during the slide. Scaled
          down slightly vs the hero's. On mobile this pane is omitted entirely;
          the gallery reflows instead. */}
      {!mobile && (
      <motion.div
        className="relative order-first h-full shrink-0"
        initial={play ? { marginLeft: -DIRECTIONS_BOX_W, opacity: 0 } : false}
        animate={{
          marginLeft: showDirections ? 0 : -DIRECTIONS_BOX_W,
          opacity: showDirections ? 1 : 0,
        }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.2 }}
        style={{
          width: DIRECTIONS_BOX_W,
          overflow: 'hidden',
          willChange: 'margin-left, opacity',
        }}
      >
        {showDirections ? (
          <div
            style={{
              width: DIRECTIONS_W,
              height: `${100 / DIRECTIONS_SCALE}%`,
              transform: `scale(${DIRECTIONS_SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            <FluidDirections onSelect={handleSelect} />
          </div>
        ) : null}
      </motion.div>
      )}
    </div>
  );
};

export default CommentDemoShell;
