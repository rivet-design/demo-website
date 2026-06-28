import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import Gallery from '../gallery/Gallery';
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
 * a BrowserFrame: a scaled live <Gallery> with the scripted comment overlay on
 * the LEFT, and the directions list on the RIGHT — mirroring the hero's
 * VariantsShowcase. A scripted drag leaves the comment "try more fluid layouts",
 * then layout directions generate on the right; selecting one restyles the
 * gallery on the left.
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
  onDraftCreated,
  onCommentCreated,
}: {
  /** Whether the scripted drag intro plays (false → resolved state, no cursor). */
  play: boolean;
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

  const showDirections = script.phase === 'generating' || script.phase === 'done';

  return (
    <div ref={rootRef} className="flex h-full">
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
              <Gallery variant={selected?.gallery} />
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

      {/* Right: the directions panel. Nothing renders here until the comment is
          "varied" (generating); then it slides in by recreating Rivet Core's
          actual panel animation (src/ui/src/App.tsx) — a width 0 → open collapse
          + opacity fade on the [0.19, 1, 0.22, 1] ease-out curve over 0.45s,
          overflow-hidden. Scaled down slightly vs the hero's. */}
      <motion.div
        className="relative h-full shrink-0"
        initial={play ? { width: 0, opacity: 0 } : false}
        animate={{
          width: showDirections ? DIRECTIONS_BOX_W : 0,
          opacity: showDirections ? 1 : 0,
        }}
        transition={{ ease: [0.19, 1, 0.22, 1], duration: 0.45 }}
        style={{ overflow: 'hidden', willChange: 'width' }}
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
    </div>
  );
};

export default CommentDemoShell;
