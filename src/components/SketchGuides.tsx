import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

/**
 * Hand-drawn "blueprint" guide lines for the landing page — wobbly Rivet-orange
 * margin/column rules with little sparkle marks where they cross. Drawn with
 * Rough.js so every stroke has a genuine (but very subtle) hand-sketched waver,
 * seeded so it stays put across re-renders.
 *
 * The overlay is absolutely positioned inside the scrolling content container
 * and sized to the container's FULL height, so the verticals run from the nav
 * all the way down the page and scroll with the content. Sits at z-0 over the
 * paper background; page content is lifted to z-10 so the guides read as a
 * backdrop behind it.
 */

const ORANGE = '#E14017';
const NS = 'http://www.w3.org/2000/svg';

// A crisp little 4-point sparkle (the brand's twinkle motif) placed at guide
// intersections.
const sparkle = (cx: number, cy: number, r = 8, inner = 1.8): SVGPathElement => {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute(
    'd',
    `M ${cx} ${cy - r} L ${cx + inner} ${cy - inner} L ${cx + r} ${cy} ` +
      `L ${cx + inner} ${cy + inner} L ${cx} ${cy + r} L ${cx - inner} ${cy + inner} ` +
      `L ${cx - r} ${cy} L ${cx - inner} ${cy - inner} Z`,
  );
  p.setAttribute('fill', ORANGE);
  p.setAttribute('opacity', '0.75');
  return p;
};

const SketchGuides = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  // w/h track the full content container; vh is the viewport height (used to
  // place the hero divider near the top); top is the nav's measured bottom edge
  // so the frame starts right at the nav rather than a guessed offset.
  const [size, setSize] = useState({ w: 0, h: 0, vh: 0, top: 0 });

  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const w = parent.clientWidth;
      const h = parent.scrollHeight;
      const vh = window.innerHeight;
      const nav = parent.querySelector('nav');
      const top = nav
        ? Math.round((nav as HTMLElement).offsetTop + (nav as HTMLElement).offsetHeight)
        : 88;
      setSize((prev) =>
        prev.w === w && prev.h === h && prev.vh === vh && prev.top === top
          ? prev
          : { w, h, vh, top },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || size.w === 0 || size.h === 0) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    const { w, h, vh, top } = size;
    // Very subtle hand-drawn character — nearly straight with a faint waver. A
    // fixed seed per stroke keeps the wobble stable so it never "jitters".
    const base = { stroke: ORANGE, strokeWidth: 1.2, roughness: 0.4, bowing: 0.5 };

    const Lx = Math.round(w * 0.05); // left margin (matches the page's 5vw gutter)
    const Rx = Math.round(w * 0.95); // right margin
    const Ix = Math.round(w * 0.15); // inset content-column line
    const Ty = top || 88; // at the nav's bottom edge
    const My = Math.round(vh * 0.34); // hero / content divider
    const By = h - 40; // bottom rule, at the very end of the page

    const line = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      seed: number,
      dashed = false,
    ) => {
      const g = rc.line(x1, y1, x2, y2, {
        ...base,
        seed,
        ...(dashed ? { strokeLineDash: [7, 7] } : {}),
      });
      g.setAttribute('opacity', '0.5');
      svg.appendChild(g);
    };

    // Full-bleed horizontals: at the nav, the hero divider, and the page bottom.
    line(0, Ty, w, Ty, 11);
    line(0, My, w, My, 12);
    line(0, By, w, By, 13);
    // Margin verticals run the FULL page height — left solid, right dashed.
    line(Lx, Ty, Lx, By, 14);
    line(Rx, Ty, Rx, By, 15, true);
    // Inset content-column line, from the hero divider to the bottom.
    line(Ix, My, Ix, By, 16);

    // Sparkles at the prominent corners / crossings.
    [
      [Lx, Ty],
      [Rx, Ty],
      [Lx, My],
      [Rx, My],
      [Ix, My],
      [Lx, By],
      [Rx, By],
    ].forEach(([x, y]) => svg.appendChild(sparkle(x, y)));
  }, [size]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      width={size.w}
      height={size.h}
      className="pointer-events-none absolute left-0 top-0 z-0 hidden md:block"
    />
  );
};

export default SketchGuides;
