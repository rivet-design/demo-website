import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Comment, CommentStatus } from './types';

type Props = {
  comment: Comment;
  index: number;
  /** Container-local pixel position of the pin point (the tail tip) */
  position: { x: number; y: number };
  /** Container height in px — used to flip the tail near the top edge */
  containerHeight: number;
  /**
   * Container width in px. When provided, the hover preview is clamped to stay
   * within the container so a marker near an edge doesn't push its tooltip past
   * the (overflow-hidden) panel bounds and get clipped.
   */
  containerWidth?: number;
  onEdit: (commentId: string) => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
};

// Port of Rivet core's CommentMarker (src/ui/src/components/CommentMarker.tsx).
// Core intentionally does NOT communicate agent progress on the marker: a
// comment looks the same whether it's freshly placed, in flight, or complete —
// only `error` stays distinct so failures aren't silently swallowed.
const STATUS_BG: Record<CommentStatus, string> = {
  pending: 'var(--primary)',
  complete: 'var(--primary)',
  error: 'var(--accent-error)',
};

// Comment-pin geometry, matching core. A circle whose bottom-left corner is
// squared off into a short tail (border-radius: 50% 50% 50% 0), so the marker
// points down-left to its anchor — the classic chat/comment pin. The tail tip
// is the box's bottom-left corner, which is what registers on the anchor point.
const PIN_SIZE = 28;
const BADGE = 20;
const TOTAL_H = PIN_SIZE;
const POPOVER_OFFSET_Y = 8;
const ABOVE_THRESHOLD_PCT = 0.65;
const PREVIEW_W = 200;

const PREVIEW_EDGE_PAD = 8;

const CommentMarker = ({
  comment,
  index,
  position,
  containerHeight,
  containerWidth,
  onEdit,
  onHover,
  onHoverEnd,
}: Props) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(comment.id);
    },
    [comment.id, onEdit],
  );

  // Two independent flips:
  // - `markerBelowPin`: hang the pin UNDER its anchor (tail at the top-left)
  //   only when there isn't enough room above — pin too close to the top.
  //   Default is pin-above-anchor, tail at the bottom-left.
  // - `previewAboveMarker`: float the hover preview ABOVE the marker when the
  //   pin is in the lower portion of the panel, otherwise it would overflow
  //   the bottom edge of the (overflow-hidden) panel.
  // Core uses one `isAbove` for both because it's position:fixed against the
  // viewport, where overflow is harmless. In a panel-bounded port, both
  // concerns must be tracked separately.
  const markerBelowPin = position.y < TOTAL_H;
  const previewAboveMarker =
    position.y / containerHeight > ABOVE_THRESHOLD_PCT;
  const previewText = comment.instruction;

  // The anchor is the tail tip (the box's left corner) at position.x; the
  // round head sits to its right, so center the preview under the head. When
  // the container width is known, clamp so a marker near an edge keeps its
  // preview inside the panel instead of pushing it past the overflow-hidden
  // bounds (where it would be clipped behind the panel/frame).
  const headCenterLocalX = PIN_SIZE / 2;
  const previewCenteredLeft = headCenterLocalX - PREVIEW_W / 2;
  const previewLeft =
    containerWidth != null
      ? Math.min(
          Math.max(position.x + previewCenteredLeft, PREVIEW_EDGE_PAD),
          containerWidth - PREVIEW_W - PREVIEW_EDGE_PAD,
        ) - position.x
      : previewCenteredLeft;

  return (
    <div
      style={{
        position: 'absolute',
        top: markerBelowPin ? position.y : position.y - TOTAL_H,
        left: position.x,
        // Lift well above the gallery chrome + sibling markers while hovered so
        // the preview is never painted under adjacent panel content.
        zIndex: isHovered ? 80 : 36,
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverEnd?.();
      }}
      // Keep the marker click from triggering the layer's drag-to-comment.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        style={{
          position: 'relative',
          width: PIN_SIZE,
          height: PIN_SIZE,
          cursor: 'pointer',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
        }}
        onClick={handleEdit}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.7 }}
      >
        {/* Comment pin: a circle with one corner squared into a tail. The tail
            sits at the bottom-left, or flips to the top-left when the marker
            hangs below its anchor point. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--main)',
            borderRadius: markerBelowPin ? '0 50% 50% 50%' : '50% 50% 50% 0',
          }}
        />

        {/* Numbered status circle, centered in the round head. */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: BADGE,
            height: BADGE,
            left: (PIN_SIZE - BADGE) / 2,
            top: (PIN_SIZE - BADGE) / 2,
            borderRadius: '50%',
            background: STATUS_BG[comment.status],
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              color: '#fff',
            }}
          >
            {index + 1}
          </span>
        </div>
      </motion.div>

      {/* Hover preview — centered under the pin head, clamped to the panel */}
      <AnimatePresence>
        {isHovered && previewText ? (
          <motion.div
            style={{
              position: 'absolute',
              left: previewLeft,
              top: previewAboveMarker
                ? -POPOVER_OFFSET_Y
                : TOTAL_H + POPOVER_OFFSET_Y,
              transformOrigin: previewAboveMarker
                ? 'bottom center'
                : 'top center',
              width: PREVIEW_W,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--main)',
              boxShadow: 'var(--shadow-pop)',
            }}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              scale: 0.96,
              opacity: 0,
              transition: { duration: 0.06, ease: [0.55, 0, 1, 0.45] },
            }}
            transition={{ duration: 0.08, ease: [0.165, 0.84, 0.44, 1] }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.35,
                color: 'var(--content)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              {previewText}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommentMarker;
