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
 * all the way down the page and scroll with the content. Sits at z-20 — above
 * the page content (z-10) so the margin rules read as a blueprint overlay
 * framing the layout (otherwise the hero's full-width showcase panel and the
 * section backgrounds occlude them), but below the sticky nav (z-70). It is
 * pointer-events-none, so it never intercepts interaction.
 *
 * Entrance: the guides reveal ON SCROLL — each stroke/sparkle fades in once it
 * enters the viewport (via an IntersectionObserver on stacked "tripwire" markers
 * down the page), and within each revealed band the marks fade in one-at-a-time
 * with a short SEQUENTIAL stagger. Above-the-fold marks reveal (staggered) on
 * mount; the lower reaches of the full-height grid draw themselves in as the
 * reader scrolls down to them.
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
  // The cinematic scroll-reveal only plays on the FIRST draw. Every later draw
  // (resize / page-height change) re-runs the draw effect, which rebuilds the
  // SVG from scratch — so we must NOT re-hide the strokes then, or a continuous
  // resize keeps re-priming them to opacity 0 and cancelling the reveal pass,
  // and the guides disappear. After the first draw, redraws render fully opaque.
  const firstDrawRef = useRef(true);
  // w/h track the full content container; vh is the viewport height (used to
  // place the hero divider near the top); top is the nav's measured bottom edge
  // so the frame starts right at the nav rather than a guessed offset.
  const [size, setSize] = useState({ w: 0, h: 0, vh: 0, top: 0 });

  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const w = parent.clientWidth;
      // offsetHeight (not scrollHeight): the in-flow content height, which
      // EXCLUDES this absolutely-positioned SVG. scrollHeight would feed the
      // SVG's own height back into the measurement and ratchet the page taller
      // than its content — leaving dead scroll space below the footer.
      const h = parent.offsetHeight;
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

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animate the scroll-reveal only on the first draw. On any redraw (resize),
    // strokes are committed at their final opacity straight away so they persist.
    const animate = firstDrawRef.current && !reduceMotion;

    // Each reveal-able element is registered with the page Y at which it should
    // begin appearing (its top for long verticals, its midpoint otherwise) and
    // the opacity it animates to. The `reveals` array order is the draw order,
    // which becomes the sequential fade order within each revealed band.
    type Reveal = { el: SVGElement; y: number; to: number };
    const reveals: Reveal[] = [];

    const prime = (el: SVGElement, y: number, to: number) => {
      el.setAttribute('opacity', String(to));
      if (!animate) return;
      el.style.opacity = '0';
      el.style.transition = 'opacity 500ms ease-out';
      reveals.push({ el, y, to });
    };

    // A vertical that spans [y1, y2] is split into stacked segments so the lower
    // portions can reveal independently as the reader scrolls down to them.
    const SEG = Math.max(1, Math.round(vh * 0.6)); // ~0.6 viewport per segment
    const vline = (x: number, y1: number, y2: number, seed: number, dashed = false) => {
      for (let sy = y1; sy < y2; sy += SEG) {
        const ey = Math.min(sy + SEG, y2);
        const g = rc.line(x, sy, x, ey, {
          ...base,
          seed,
          ...(dashed ? { strokeLineDash: [7, 7] } : {}),
        });
        prime(g, sy, 0.5);
        svg.appendChild(g);
      }
    };

    const hline = (
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
      prime(g, (y1 + y2) / 2, 0.5);
      svg.appendChild(g);
    };

    // Full-bleed horizontals: at the nav, the hero divider, and the page bottom.
    hline(0, Ty, w, Ty, 11);
    hline(0, My, w, My, 12);
    hline(0, By, w, By, 13);
    // Margin verticals run the FULL page height — left solid, right dashed.
    vline(Lx, Ty, By, 14);
    vline(Rx, Ty, By, 15, true);
    // Inset content-column line, from the hero divider to the bottom.
    vline(Ix, My, By, 16);

    // Sparkles at the prominent corners / crossings. Pushed last so they fade in
    // after the lines within their band.
    (
      [
        [Lx, Ty],
        [Rx, Ty],
        [Lx, My],
        [Rx, My],
        [Ix, My],
        [Lx, By],
        [Rx, By],
      ] as const
    ).forEach(([x, y]) => {
      const s = sparkle(x, y);
      prime(s, y, 0.75);
      svg.appendChild(s);
    });

    if (!animate || reveals.length === 0) return;
    // First animated draw done — every subsequent redraw renders fully opaque.
    firstDrawRef.current = false;

    // Reveal-on-scroll. This previously watched invisible SVG <rect> "tripwire"
    // markers with an IntersectionObserver, but IO observing SVG child elements
    // is unreliable across browsers — some bands (notably the right-margin
    // verticals) would intermittently never fire, leaving those strokes stuck
    // at opacity 0 ("the drawing animation didn't trigger"). Drive the reveal
    // directly off the SVG's measured viewport position instead: on mount and on
    // every scroll/resize, reveal any still-hidden stroke that has crossed into
    // view, staggered in draw order so each newly-visible band still sketches
    // itself in one mark at a time.
    const STAGGER = 100; // ms between successive marks within a reveal batch
    let raf = 0;
    const revealVisible = () => {
      raf = 0;
      // Viewport-relative top of the overlay; a stroke at local y sits at
      // svgTop + y on screen. Using the live rect makes this correct whether the
      // page scrolls on window or on an ancestor container.
      const svgTop = svg.getBoundingClientRect().top;
      const cutoff = window.innerHeight * 0.9; // reveal slightly before fully in view
      let i = 0; // sequential index within this reveal batch
      for (const r of reveals) {
        if (r.el.style.opacity !== '0') continue; // already revealed
        if (svgTop + r.y <= cutoff) {
          r.el.style.transitionDelay = `${i * STAGGER}ms`;
          r.el.style.opacity = String(r.to);
          i += 1;
        }
      }
    };
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(revealVisible);
    };

    // Reveal above-the-fold marks on mount, then follow the scroll down. Resize
    // is handled by the measure effect (which redraws fully opaque), so we only
    // listen for scroll here.
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
    };
  }, [size]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      width={size.w}
      height={size.h}
      className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
    />
  );
};

export default SketchGuides;
