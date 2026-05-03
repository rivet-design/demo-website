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

const CommentMarker = ({
  comment,
  index,
  position,
  containerHeight,
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

  const isAbove = position.y / containerHeight > ABOVE_THRESHOLD_PCT;
  const previewText = comment.instruction;

  return (
    <div
      style={{
        position: 'absolute',
        top: isAbove ? position.y : position.y - TOTAL_H,
        left: position.x - TIP_X,
        zIndex: isHovered ? 55 : 36,
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
            top: isAbove ? -CARET_HALF : BUBBLE_H - CARET_HALF,
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
              left: TIP_X - PREVIEW_W / 2,
              top: isAbove ? -POPOVER_OFFSET_Y : TOTAL_H + POPOVER_OFFSET_Y,
              transformOrigin: isAbove ? 'bottom center' : 'top center',
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
