import { AnimatePresence, motion } from 'motion/react';
import { CommentMarker, CommentPopover } from '../comments';
import type { Comment } from '../comments';
import {
  SCRIPT_DESIGN_W,
  type ScriptedCommentState,
} from './useScriptedCommentDemo';

/**
 * Presentational overlay for the scripted comment demo. Renders the fake cursor,
 * the dashed selection box, the real CommentPopover, and the resulting
 * CommentMarker — all in DESIGN-space px inside the scaled gallery box, scoped
 * to `.rivet-comments` so the comment tokens (--primary, --primary-soft, …)
 * resolve. Driven entirely by `state` from `useScriptedCommentDemo`.
 */

const REQUEST_TEXT = 'try more fluid layouts';

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

const ScriptedCommentOverlay = ({
  state,
  designH,
}: {
  state: ScriptedCommentState;
  /** Live design-box height (tracks the pane aspect so the gallery fills it). */
  designH: number;
}) => {
  const { cursor, cursorVisible, box, growBox, showPopover, showMarker, popoverAt } =
    state;

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
              ? { left: box.left, top: box.top, width: 0, height: 0, opacity: 0 }
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
          onSubmit={() => {}}
          onCancel={() => {}}
        />
      ) : null}

      {/* Resulting marker once the comment is "applied". */}
      {showMarker ? (
        <CommentMarker
          comment={SCRIPTED_COMMENT(popoverAt, designH)}
          index={0}
          position={popoverAt}
          containerHeight={designH}
          onEdit={() => {}}
        />
      ) : null}

      {/* Fake cursor — springs to its per-phase target, and fades out once the
          comment is applied (cursorVisible drops at the generating phase). */}
      <AnimatePresence>
        {cursorVisible ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: cursor.x, top: cursor.y }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{
              opacity: { duration: 0.2 },
              left: { type: 'spring', stiffness: 90, damping: 18 },
              top: { type: 'spring', stiffness: 90, damping: 18 },
            }}
            style={{ position: 'absolute', zIndex: 70 }}
          >
            <CursorArrow />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ScriptedCommentOverlay;
