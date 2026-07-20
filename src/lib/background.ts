import type { CSSProperties } from 'react';

/**
 * Simple FE flag: render the paper texture background, or a plain "vanilla"
 * white. Flip to `false` for the flat white treatment everywhere (page
 * background + sticky nav fill).
 */
export const USE_PAPER_TEXTURE = false;

const PAPER_TEXTURE = "url('/images/paper-texture.png')";

/**
 * Background for the full-page scrolling container (landing + variants page).
 * Paper texture tiles vertically; white when the flag is off.
 */
export const pageBackground: { className: string; style: CSSProperties } =
  USE_PAPER_TEXTURE
    ? {
        className: 'bg-repeat-y',
        style: { backgroundImage: PAPER_TEXTURE, backgroundSize: '100% auto' },
      }
    : { className: 'bg-white', style: {} };

/**
 * Background for an opaque surface that must hide content scrolling beneath it
 * (the sticky nav). Covers; white when the flag is off.
 */
export const surfaceBackground: CSSProperties = USE_PAPER_TEXTURE
  ? {
      backgroundImage: PAPER_TEXTURE,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  : { backgroundColor: '#ffffff' };

/**
 * Footer-specific background. Flat white so the multicolor wordmark reads as
 * solid color (its letters multiply against each other, not against a textured
 * backdrop).
 */
export const footerBackground: CSSProperties = {
  backgroundColor: '#f5f5f5',
};
