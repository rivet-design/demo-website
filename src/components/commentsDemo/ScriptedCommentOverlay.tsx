import { AnimatePresence, motion } from 'motion/react';
import { CommentMarker, CommentPopover } from '../comments';
import type { Comment } from '../comments';
import {
  SCRIPT_DESIGN_W,
  SCRIPT_DESIGN_H,
  type ScriptedCommentState,
} from './useScriptedCommentDemo';

/**
 * Presentational overlay for the scripted comment demo. Renders the fake cursor,
 * the dashed selection box, the real CommentPopover, and the resulting
 * CommentMarker — all in DESIGN-space px inside the scaled gallery box, scoped
 * to `.rivet-comments` so the comment tokens (--primary, --primary-soft, …)
 * resolve. Driven entirely by `state` from `useScriptedCommentDemo`.
 */

const REQUEST_TEXT = 'Try simpler layouts';

// The scripted "comment" used to render the resulting marker. Pin is derived
// from the popover anchor; the dragBox mirrors the selection so a hover would
// highlight the same region as the live demo did.
const SCRIPTED_COMMENT = (
  popoverAt: { x: number; y: number },
  designH: number,
): Comment => ({
  id: 'scripted-fluid-layouts',
  pin: { xPct: popoverAt.x / SCRIPT_DESIGN_W, yPct: popoverAt.y / designH },
  instruction: REQUEST_TEXT,
  status: 'pending',
  createdAt: 0,
});

// A couple of pre-existing comments pinned to the gallery's chrome — one on the
// header beside the user profile, one over the left-hand nav — so it reads
// immediately as "you can leave comments anywhere on a real UI", not just where
// the cursor scripts one. Coordinates are FIXED design-space px (the topbar and
// sidebar are fixed-size regions, not proportional to the panel height), so the
// pins stay on their targets as the gallery scales across breakpoints. The
// scripted comment then lands as the third, freshly-added marker.
const SAMPLE_COMMENTS: { x: number; y: number; comment: Comment }[] = [
  {
    // Top-right, on the header by the user profile.
    x: 716,
    y: 30,
    comment: {
      id: 'sample-header-padding',
      pin: { xPct: 716 / SCRIPT_DESIGN_W, yPct: 30 / SCRIPT_DESIGN_H },
      instruction: 'add more padding here for the header',
      status: 'pending',
      createdAt: 0,
    },
  },
  {
    // Over the left-hand collections nav.
    x: 90,
    y: 160,
    comment: {
      id: 'sample-compact-layout',
      pin: { xPct: 90 / SCRIPT_DESIGN_W, yPct: 160 / SCRIPT_DESIGN_H },
      instruction: 'try a more compact layout',
      status: 'pending',
      createdAt: 0,
    },
  },
];

// A small arrow pointer drawn as an SVG (no system cursor is visible over the
// pointer-events-none overlay, so we paint our own).
const CursorArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 3l14 7.5-6.1 1.4-2.4 5.8L5 3z"
      fill="#1c1c20"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

// The "grabber" — the macOS open-hand (grab) cursor: a solid WHITE hand
// silhouette with a thin dark outline, matching the real system cursor. Four
// fanned fingers + a thumb over a palm; shown while the cursor is over the Vary
// button. The palm centers on the button (the open hand's hotspot is its
// center, unlike the arrow's tip), so the overlay positions it accordingly.
const CursorHand = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="#fff"
    stroke="#1c1c20"
    strokeWidth={1.4}
    strokeLinejoin="round"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M10 14V6.5C10 5.67 10.67 5 11.5 5S13 5.67 13 6.5V13h1V4.5C14 3.67 14.67 3 15.5 3S17 3.67 17 4.5V13h1V5.5C18 4.67 18.67 4 19.5 4S21 4.67 21 5.5V14h1V8.5C22 7.67 22.67 7 23.5 7S25 7.67 25 8.5V18c0 5-3 9-8 9h-2c-3 0-4.5-1.5-6-4l-4-7c-.5-1 .3-2.2 1.4-2.2.5 0 1 .25 1.3.7L10 16V14z" />
  </svg>
);

const ScriptedCommentOverlay = ({
  state,
  designH,
}: {
  state: ScriptedCommentState;
  /** Live design-box height (tracks the pane aspect so the gallery fills it). */
  designH: number;
}) => {
  const {
    cursor,
    cursorVisible,
    cursorPressed,
    overButton,
    box,
    boxOrigin,
    growBox,
    showPopover,
    varying,
    showMarker,
    popoverAt,
  } = state;

  return (
    <div
      className="rivet-comments pointer-events-none absolute inset-0"
      style={{ zIndex: 40 }}
    >
      {/* Selection box — grows from its start corner during the drag, then
          persists as the selection highlight. */}
      {box ? (
        <motion.div
          initial={
            growBox
              ? { left: boxOrigin.x, top: boxOrigin.y, width: 0, height: 0, opacity: 0 }
              : false
          }
          animate={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            opacity: 1,
          }}
          transition={{ duration: growBox ? 0.8 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            border: '1px dashed var(--primary)',
            background: 'var(--primary-soft)',
            borderRadius: 2,
            boxSizing: 'border-box',
          }}
        />
      ) : null}

      {/* Popover — real component, request pre-filled. Submit/cancel are inert
          (the timeline drives the transition, not the buttons). */}
      {showPopover ? (
        <CommentPopover
          position={popoverAt}
          containerWidth={SCRIPT_DESIGN_W}
          containerHeight={designH}
          initialValue={REQUEST_TEXT}
          varying={varying}
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      ) : null}

      {/* Pre-existing sample markers on other tiles — always present, so the
          gallery reads as a live, comment-able surface even before the scripted
          comment lands. */}
      {SAMPLE_COMMENTS.map(({ x, y, comment }, i) => (
        <CommentMarker
          key={comment.id}
          comment={comment}
          index={i}
          position={{ x, y }}
          containerHeight={designH}
          containerWidth={SCRIPT_DESIGN_W}
          onEdit={() => {}}
        />
      ))}

      {/* Resulting marker once the comment is "applied" — numbered after the
          pre-existing samples, so it reads as the freshly-added one. */}
      {showMarker ? (
        <CommentMarker
          comment={SCRIPTED_COMMENT(popoverAt, designH)}
          index={SAMPLE_COMMENTS.length}
          position={popoverAt}
          containerHeight={designH}
          containerWidth={SCRIPT_DESIGN_W}
          onEdit={() => {}}
        />
      ) : null}

      {/* Fake cursor — springs to its per-phase target, and fades out once the
          comment is applied (cursorVisible drops at the generating phase). */}
      <AnimatePresence>
        {cursorVisible ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: cursor.x,
              top: cursor.y,
              // A quick press-pulse on the Vary button (click feedback), then
              // back to rest — not a sustained shrink.
              scale: cursorPressed ? [1, 0.8, 1] : 1,
            }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{
              opacity: { duration: 0.2 },
              scale: cursorPressed
                ? { duration: 0.34, times: [0, 0.45, 1], ease: 'easeOut' }
                : { duration: 0.15 },
              left: { type: 'spring', stiffness: 90, damping: 18 },
              top: { type: 'spring', stiffness: 90, damping: 18 },
            }}
            style={{ position: 'absolute', zIndex: 70, transformOrigin: 'top left' }}
          >
            {overButton ? <CursorHand /> : <CursorArrow />}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ScriptedCommentOverlay;
