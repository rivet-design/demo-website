import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CardsThree } from '@phosphor-icons/react';
import SparkleLoader from '../variantsDemo/SparkleLoader';

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
};

const POPOVER_W = 320;
const PAD = 12;
const OFFSET_Y = 14;
const FLIP_THRESHOLD_PCT = 0.6;

const CommentPopover = ({
  position,
  containerWidth,
  containerHeight,
  initialValue = '',
  canDelete = false,
  onSubmit,
  onCancel,
  onDelete,
}: Props) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverHeight, setPopoverHeight] = useState(0);
  // Drives the orange focus border + ring on the textarea — matches the
  // Tailwind `focus:border-primary focus:ring-1 focus:ring-primary/30` rule
  // on the real popover at src/ui/src/components/CommentPopover.tsx:436.
  // Defaults true because the textarea is auto-focused on mount; saves a
  // 1-frame flash where the border would render gray before onFocus fires.
  const [isFocused, setIsFocused] = useState(true);
  // "Vary" shows an in-button ASCII generating state (like the variant rows)
  // before it resolves. The timer is cleared if the popover unmounts first.
  const [varying, setVarying] = useState(false);
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
    setVarying(true);
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
        transformOrigin: isAbove ? 'bottom center' : 'top center',
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
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="What should change?"
        rows={3}
        style={{
          width: '100%',
          resize: 'none',
          borderRadius: 8,
          border: `1px solid ${isFocused ? 'var(--primary)' : 'var(--divider)'}`,
          boxShadow: isFocused
            ? '0 0 0 1px rgba(225, 64, 23, 0.3)'
            : 'none',
          transition: 'border-color 100ms, box-shadow 100ms',
          background: 'var(--main-light)',
          padding: 12,
          fontSize: 13,
          lineHeight: 1.4,
          color: 'var(--content)',
          outline: 'none',
          maxHeight: '9rem',
          overflowY: 'auto',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
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
                padding: 6,
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              <TrashIcon />
            </button>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* "Vary" — the very secondary button (outlined, fills on hover),
              symmetric with Rivet Core. Clicking it shows an in-button ASCII
              generating state, like the variant rows. */}
          <button
            type="button"
            onClick={handleVary}
            disabled={!isSaveEnabled || varying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 82,
              background: 'transparent',
              border: '1px solid var(--main-border)',
              color: 'var(--content)',
              fontSize: 13,
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 999,
              opacity: isSaveEnabled ? 1 : 0.5,
              cursor: isSaveEnabled && !varying ? 'pointer' : 'not-allowed',
              transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
              if (isSaveEnabled && !varying) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'var(--main-input)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'transparent';
            }}
          >
            {varying ? (
              <SparkleLoader className="text-[13px] text-[color:var(--content)]" />
            ) : (
              <>
                <CardsThree size={16} weight="bold" />
                <span>Vary</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isSaveEnabled || varying}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              padding: '6px 20px',
              borderRadius: 999,
              opacity: isSaveEnabled && !varying ? 1 : 0.5,
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
            {initialValue ? 'Save' : 'Apply'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Zm-80-104v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Zm48 0v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Z" />
  </svg>
);

export default CommentPopover;
