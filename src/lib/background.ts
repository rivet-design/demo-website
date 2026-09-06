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
/** The site's own fill. Exported so surfaces that must MATCH the background
 *  (the nav) can interpolate to it rather than hardcoding the hex. */
export const SITE_FILL = '#F1EFE8';

/** The page's own ground everywhere past the hero. The tan SITE_FILL is no
 *  longer a background — it is the fill of the inset panels that sit on this. */
export const FOOTER_FILL = '#fafafa';

/**
 * A hex colour as rgba() at the given alpha. Used by the frosted nav, whose
 * tint has to be the SAME colour as the ground it sits on — just translucent,
 * so the backdrop filter has something to blur through.
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const pageBackground: { className: string; style: CSSProperties } =
  USE_PAPER_TEXTURE
    ? {
        className: 'bg-repeat-y',
        style: { backgroundImage: PAPER_TEXTURE, backgroundSize: '100% auto' },
      }
    : { className: '', style: { backgroundColor: FOOTER_FILL } };

/**
 * The tan surface: the hero card during the pinned sequence (the page itself
 * shrinking on the #fafafa stage), and the nav that sits on it.
 */
export const surfaceBackground: CSSProperties = USE_PAPER_TEXTURE
  ? {
      backgroundImage: PAPER_TEXTURE,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  : { backgroundColor: SITE_FILL };

/**
 * Footer-specific background — same flat site fill as everywhere else.
 */
export const footerBackground: CSSProperties = {
  backgroundColor: FOOTER_FILL,
};
