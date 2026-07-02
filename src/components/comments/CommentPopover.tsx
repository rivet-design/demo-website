import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, At, CardsThree, Image, Trash } from '@phosphor-icons/react';
import SparkleLoader from '../variantsDemo/SparkleLoader';

/**
 * Port of Rivet core's CommentPopover (src/ui/src/components/CommentPopover.tsx)
 * in its chat-composer form: a borderless auto-growing textarea over an action
 * bar — utility icons (attach / reference) on the left, the Vary pill and the
 * circular arrow send button on the right. Backend coupling is replaced by the
 * onSubmit/onCancel callbacks; the attach/reference icons are decorative.
 */

type Props = {
  /** Container-local pixel position to anchor the popover */
  position: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  initialValue?: string;
  canDelete?: boolean;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  /**
   * Externally force the "Vary" button into its in-button generating state —
   * used by the scripted demo to show the button being clicked without a real
   * pointer event. OR'd with the internal state so real clicks still work.
   */
  varying?: boolean;
};

const POPOVER_W = 320;
const PAD = 12;
const OFFSET_Y = 14;
const FLIP_THRESHOLD_PCT = 0.6;
// Matches core's COMMENT_TEXTAREA_MAX_HEIGHT_REM.
const TEXTAREA_MAX_HEIGHT = '7.5rem';

// Chat-composer growth: the textarea starts at one row and grows with content
// (up to the max height), instead of reserving a fixed multi-row block.
const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const CommentPopover = ({
  position,
  containerWidth,
  containerHeight,
  initialValue = '',
  canDelete = false,
  onSubmit,
  onCancel,
  onDelete,
  varying: varyingProp = false,
}: Props) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverHeight, setPopoverHeight] = useState(0);
  // "Vary" shows an in-button ASCII generating state (like the variant rows)
  // before it resolves. The timer is cleared if the popover unmounts first.
  // The controlled `varyingProp` (scripted demo) is OR'd in below.
  const [internalVarying, setInternalVarying] = useState(false);
  const varying = varyingProp || internalVarying;
  const varyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (varyTimerRef.current) clearTimeout(varyTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    // preventScroll keeps an already-open popover from yanking the viewport
    // when the comment demo is below the fold on initial load.
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.setSelectionRange(initialValue.length, initialValue.length);
  }, [initialValue.length]);

  useEffect(() => {
    if (popoverRef.current) {
      setPopoverHeight(popoverRef.current.offsetHeight);
    }
  }, [value]);

  const isAbove = position.y / containerHeight > FLIP_THRESHOLD_PCT;
  const idealLeft = position.x - POPOVER_W / 2;
  const maxLeft = containerWidth - POPOVER_W - PAD;
  const left = Math.max(PAD, Math.min(idealLeft, maxLeft));
  const top = isAbove ? position.y - OFFSET_Y - popoverHeight : position.y + OFFSET_Y;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSubmit(trimmed);
  };

  const handleVary = () => {
    const trimmed = value.trim();
    if (!trimmed || varying) return;
    setInternalVarying(true);
    // Fake the generation: the ASCII loader animates in-button, then the
    // comment lands — mirroring a variant row that loads then resolves.
    varyTimerRef.current = setTimeout(() => onSubmit(trimmed), 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const isSaveEnabled = value.trim() !== '';

  return (
    <motion.div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top,
        left,
        width: POPOVER_W,
        background: 'var(--main)',
        borderRadius: 12,
        padding: 16,
        boxShadow: 'var(--shadow-pop)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        // Core anchors the entrance scale just under the card's top edge.
        transformOrigin: 'center 24px',
      }}
      initial={{ scale: 0.82, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        scale: 0.82,
        opacity: 0,
        transition: { duration: 0.1, ease: [0.55, 0, 1, 0.45] },
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.8 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={(el) => {
          inputRef.current = el;
          if (el) autoResize(el);
        }}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          autoResize(e.target);
        }}
        onKeyDown={handleKeyDown}
        placeholder="What should change?"
        rows={1}
        className="placeholder:text-[color:var(--content-subtle)]"
        style={{
          width: '100%',
          resize: 'none',
          border: 'none',
          borderRadius: 8,
          background: 'var(--main-light)',
          padding: 12,
          fontSize: 14,
          lineHeight: '20px',
          color: 'var(--content)',
          outline: 'none',
          maxHeight: TEXTAREA_MAX_HEIGHT,
          overflowY: 'auto',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left cluster: delete (existing comments) + the composer utilities.
            Attach/reference are decorative in the demo — they complete the
            core composer's silhouette without a backend. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {canDelete && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              title="Delete comment"
              aria-label="Delete comment"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--content-subtle)',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'color 120ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  'var(--accent-error)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  'var(--content-subtle)';
              }}
            >
              <Trash size={16} weight="bold" />
            </button>
          ) : null}
          <button
            type="button"
            title="Attach images"
            aria-label="Attach images"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--content-subtle)',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--content)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--content-subtle)';
            }}
          >
            <Image size={16} weight="bold" />
          </button>
          <button
            type="button"
            title="Reference a direction"
            aria-label="Reference a direction"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--content-subtle)',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 120ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--content)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--content-subtle)';
            }}
          >
            <At size={16} weight="bold" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* "Vary" — core's filled secondary pill. Clicking it shows an
              in-button ASCII generating state, like the variant rows. */}
          <button
            type="button"
            onClick={handleVary}
            disabled={!isSaveEnabled || varying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 78,
              background: 'var(--main-input)',
              border: 'none',
              color: 'var(--content)',
              fontSize: 14,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 999,
              opacity: isSaveEnabled ? 1 : 0.5,
              cursor: isSaveEnabled && !varying ? 'pointer' : 'not-allowed',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
              if (isSaveEnabled && !varying) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--main-hover)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--main-input)';
            }}
          >
            {varying ? (
              <SparkleLoader className="text-[14px] text-[color:var(--content)]" />
            ) : (
              <>
                <CardsThree size={16} weight="bold" />
                <span>Vary</span>
              </>
            )}
          </button>
          {/* Send — core's circular arrow submit ("Send to agent"). */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isSaveEnabled || varying}
            title="Send to agent"
            aria-label="Send to agent"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              padding: 8,
              borderRadius: 999,
              opacity: isSaveEnabled && !varying ? 1 : 0.5,
              cursor: isSaveEnabled && !varying ? 'pointer' : 'not-allowed',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
              if (isSaveEnabled && !varying) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--primary-hover)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--primary)';
            }}
          >
            <ArrowUp size={16} weight="bold" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentPopover;
