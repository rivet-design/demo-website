/**
 * The page's column grid, measured off the live layout.
 *
 * Both the grid overlay and the marks field read the grid from here rather
 * than each deriving it: when they computed it separately their columns drifted
 * a few px apart, and a mark that is *near* the line it is supposed to be on is
 * worse than no mark at all.
 *
 * Measured, never replicated. The gutter is a vw-based clamp on :root, and vw
 * counts the scrollbar that the frame's padding box does not — so the numbers
 * come from the element, not from the custom property.
 */

/** Gutter as a share of the content width. 0.517% ≈ 7.4px at 1440. */
export const GRID_GUTTER_RATIO = 0.00517;

export type PageGrid = {
  /** The frame's box in viewport coordinates — for `position: fixed` layers. */
  rect: DOMRect;
  /** Gutter width in px, i.e. the frame's horizontal padding. */
  pad: number;
  /** The content width the columns divide. */
  width: number;
  columnWidth: number;
  gutter: number;
  /**
   * Every vertical line the grid actually draws, in FRAME coordinates: each
   * column's left edge, then the content box's right edge. Not an even
   * division — the gutters make the last line's spacing its own.
   */
  lines: number[];
};

export const measurePageGrid = (columns: number): PageGrid | null => {
  const frame = document.querySelector<HTMLElement>('[data-page-frame]');
  if (!frame) return null;

  const pad = Number.parseFloat(getComputedStyle(frame).paddingLeft) || 0;
  const width = frame.clientWidth - pad * 2;
  const gutter = width * GRID_GUTTER_RATIO;
  const columnWidth = (width - (columns - 1) * gutter) / columns;
  if (width <= 0 || columnWidth <= 0.5) return null;

  const lines: number[] = [];
  for (let c = 0; c < columns; c += 1) lines.push(pad + c * (columnWidth + gutter));
  lines.push(pad + width);

  return { rect: frame.getBoundingClientRect(), pad, width, columnWidth, gutter, lines };
};
