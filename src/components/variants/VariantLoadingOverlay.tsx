import { motion } from 'motion/react';

/**
 * Loading state shown while variants are "generating". Two parts:
 *
 * 1. A dashed orange outline + light orange tint on the element being varied
 *    — matches CommentCarouselLayer.tsx:710 (`1px dashed var(--color-primary)`,
 *    `rgba(225,64,23,0.06)` fill).
 * 2. Just the braille sparkle in primary orange floating above the dashed box's
 *    top-left edge — direct port of CommentCarouselLayer.tsx:729–741. No chip,
 *    no label; the dashed box + animated sparkle carry the message.
 */
const VariantLoadingOverlay = () => (
  <motion.div
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      border: '1px dashed #E14017',
      background: 'rgba(225, 64, 23, 0.06)',
      borderRadius: 2,
      boxSizing: 'border-box',
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 1.04 }}
    transition={{ duration: 0.22, ease: [0.32, 0.72, 0.34, 1] }}
  >
    <Sparkle />
  </motion.div>
);

/**
 * Six-frame braille animation, cycled via CSS `steps(6)` — direct port from
 * CommentCarouselLayer.tsx:46 + index.css:235. The strip is 6em tall; the
 * outer 1em window reveals one frame at a time. No JS interval; one timer
 * in the browser regardless of how many overlays are on screen.
 */
const SPARKLE_FRAMES = ['⡡⠊⢔⠡', '⠊⡰⡡⡘', '⢔⢅⠈⢢', '⡁⢂⠆⡍', '⢔⠨⢑⢐', '⠨⡑⡠⠊'];

const Sparkle = () => (
  <span
    aria-hidden="true"
    style={{
      position: 'absolute',
      // Floats above the dashed box's top-left corner — same as the real
      // Rivet impl at CommentCarouselLayer.tsx:730 (`translateY(-100%)` from
      // top: 0). Renders into the gallery's topbar region, which is inside
      // the panel so it stays visible.
      top: 0,
      left: 0,
      transform: 'translateY(-100%)',
      display: 'inline-block',
      overflow: 'hidden',
      height: '1em',
      lineHeight: 1,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 14,
      color: '#E14017',
    }}
  >
    <span
      className="rivet-variants-sparkle-strip"
      style={{ display: 'block' }}
    >
      {SPARKLE_FRAMES.map((frame, i) => (
        <span
          key={i}
          style={{ display: 'block', height: '1em', lineHeight: '1em' }}
        >
          {frame}
        </span>
      ))}
    </span>
  </span>
);

export default VariantLoadingOverlay;
