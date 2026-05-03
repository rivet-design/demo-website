import { motion, AnimatePresence } from 'motion/react';
import type { Variant } from './types';

type Props = {
  variants: Variant[];
  activeIndex: number;
  /** True for ~220ms after each variant change — drives a brief scale-down. */
  isSwitching?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onApply: () => void;
};

// Wider than Rivet's 220 so longer imperative labels
// (e.g. "Switch to a brighter palette") fit without truncating.
const BAR_WIDTH = 320;
const BAR_HEIGHT = 36;

/**
 * Faithful port of the Rivet variant carousel pill
 * (src/ui/src/components/CommentCarouselLayer.tsx:628–706).
 *
 * Same dimensions (220×36), structure (chevron · label · check · chevron),
 * dark surface (`bg-main`), `primary-border` outline, and label crossfade
 * animation. Tokens are sourced from the `.rivet-variants` scope so the pill
 * keeps its native dark theme on a light host surface.
 */
const VariantPill = ({
  variants,
  activeIndex,
  isSwitching = false,
  onPrev,
  onNext,
  onApply,
}: Props) => {
  const variant = variants[activeIndex];
  return (
    <motion.div
      data-rivet-carousel-pill
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        padding: '4px',
        borderRadius: 8,
        border: '1px solid var(--primary-border)',
        background: 'var(--main)',
        boxShadow: 'var(--pill-shadow)',
      }}
      initial={{ opacity: 0, scale: 0.82, y: -4 }}
      // Same `isSwitching ? 0.985 : 1` scale as the real pill at
      // CommentCarouselLayer.tsx:640 — a quick squish on each variant change.
      animate={{ opacity: 1, scale: isSwitching ? 0.985 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.82, y: -4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.8 }}
    >
      <PillButton onClick={onPrev} ariaLabel="Previous variation">
        <Caret dir="left" />
      </PillButton>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={variant.id}
            style={{
              display: 'inline-block',
              minWidth: 0,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--content)',
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {variant.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <PillButton onClick={onApply} ariaLabel="Apply this variant">
        <Check />
      </PillButton>
      <PillButton onClick={onNext} ariaLabel="Next variation">
        <Caret dir="right" />
      </PillButton>
    </motion.div>
  );
};

const PillButton = ({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    style={{
      width: 24,
      height: 24,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      background: 'transparent',
      border: 'none',
      color: 'var(--content-muted)',
      transition: 'color 120ms',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--content)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--content-muted)';
    }}
  >
    {children}
  </button>
);

const Caret = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    {dir === 'left' ? (
      <path d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z" />
    ) : (
      <path d="M181.66 122.34l-80-80a8 8 0 0 0-11.32 11.32L164.69 128l-74.35 74.34a8 8 0 0 0 11.32 11.32l80-80a8 8 0 0 0 0-11.32Z" />
    )}
  </svg>
);

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path d="M229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69l122.34-122.35a8 8 0 0 1 11.32 11.32Z" />
  </svg>
);

export default VariantPill;
