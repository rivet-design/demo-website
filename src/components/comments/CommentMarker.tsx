import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Comment, CommentStatus } from './types';

type Props = {
  comment: Comment;
  index: number;
  /** Container-local pixel position of the marker tip */
  position: { x: number; y: number };
  /** Container height in px — used to flip the caret upward near the bottom edge */
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

const STATUS_BG: Record<CommentStatus, string> = {
  pending: 'var(--primary)',
  complete: 'var(--accent-success)',
  error: 'var(--accent-error)',
};

const BUBBLE_W = 36;
const BUBBLE_H = 28;
const CARET_SIZE = 10;
const CARET_HALF = CARET_SIZE / 2;
const TIP_X = BUBBLE_W / 2;
const TOTAL_H = BUBBLE_H + CARET_HALF;
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
  // - `markerBelowPin`: place the marker UNDER the pin only when there isn't
  //   enough room above (pin too close to the top). Default is marker-above-pin
  //   so the bubble doesn't cover content the pin is anchored to.
  // - `previewAboveMarker`: float the hover preview ABOVE the marker when the
  //   pin is in the lower portion of the panel, otherwise it would overflow
  //   the bottom edge of the (overflow-hidden) panel.
  // The original Rivet impl uses one `isAbove` for both because it's
  // position:fixed against the viewport, where overflow is harmless. In a
  // panel-bounded port, both concerns must be tracked separately.
  const markerBelowPin = position.y < TOTAL_H;
  const previewAboveMarker =
    position.y / containerHeight > ABOVE_THRESHOLD_PCT;
  const previewText = comment.instruction;

  // The hover preview is positioned relative to the marker root (which sits at
  // `position.x - TIP_X`). Centered on the pin by default; when the container
  // width is known, clamp its absolute left so a marker near an edge keeps its
  // preview inside the panel instead of pushing it past the overflow-hidden
  // bounds (where it would be clipped behind the panel/frame).
  const rootLeft = position.x - TIP_X;
  const previewCenteredLeft = TIP_X - PREVIEW_W / 2;
  const previewLeft =
    containerWidth != null
      ? Math.min(
          Math.max(rootLeft + previewCenteredLeft, PREVIEW_EDGE_PAD),
          containerWidth - PREVIEW_W - PREVIEW_EDGE_PAD,
        ) - rootLeft
      : previewCenteredLeft;

  return (
    <div
      style={{
        position: 'absolute',
        top: markerBelowPin ? position.y : position.y - TOTAL_H,
        left: position.x - TIP_X,
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
          cursor: 'pointer',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
        }}
        onClick={handleEdit}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.7 }}
      >
        {/* Caret */}
        <div
          style={{
            position: 'absolute',
            background: 'var(--main)',
            width: CARET_SIZE,
            height: CARET_SIZE,
            left: (BUBBLE_W - CARET_SIZE) / 2,
            top: markerBelowPin ? -CARET_HALF : BUBBLE_H - CARET_HALF,
            transform: 'rotate(45deg)',
            borderRadius: 3,
          }}
        />

        {/* Bubble — dark capsule with a status-colored circle inside */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: 'var(--main)',
            width: BUBBLE_W,
            height: BUBBLE_H,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: STATUS_BG[comment.status],
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1,
                color: '#fff',
              }}
            >
              {index + 1}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Hover preview */}
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
