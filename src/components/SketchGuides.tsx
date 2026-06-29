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
 * backdrop BEHIND the content panels (the panels intentionally render over
 * them).
 *
 * Entrance: the whole overlay fades in once on first mount (a single, simple
 * opacity transition on the <svg>). No per-band or scroll-driven reveal — every
 * guide appears together. Redraws (resize / page-height change) render fully
 * opaque immediately.
 */

const ORANGE = '#E14017';
const NS = 'http://www.w3.org/2000/svg';

// Sparkle/inkblot marks at guide intersections — flagged off for now while we
// dial in the lines. Flip to true to bring them back.
const SHOW_SPARKLES = false;

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
  // The entrance fade only plays on the FIRST draw. Every later draw (resize /
  // page-height change) re-runs the draw effect, which rebuilds the SVG from
  // scratch — so we must NOT re-hide the overlay then, or a continuous resize
  // keeps re-priming it to opacity 0 and the guides disappear. After the first
  // draw, redraws render fully opaque.
  const firstDrawRef = useRef(true);
  // w/h track the full content container; vh is the viewport height (used to
  // place the hero divider near the top); top is the nav's measured bottom edge
  // so the frame starts right at the nav rather than a guessed offset.
  const [size, setSize] = useState({
    w: 0,
    h: 0,
    vh: 0,
    top: 0,
    divider: 0,
    heroBottom: 0,
    rows: [] as number[],
  });

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
      const nav = parent.querySelector('nav') as HTMLElement | null;
      // The nav is sticky. While the page is scrolled, `offsetTop` reflects the
      // sticky position, so a resize can report "nav bottom" thousands of px
      // down the document and redraw the vertical guides only near the footer.
      // The guide frame should start below the nav's in-flow box at page top.
      const top = nav ? Math.round(nav.offsetHeight) : 88;
      // During aggressive responsive reflow a resize/load callback can run
      // before the page has a usable content box. Keep the last valid drawing
      // instead of replacing it with inverted or zero-length guide geometry.
      if (w <= 0 || h - top <= 80) return;
      // Anchor the hero divider to the TOP edge of the variant showcase panel so
      // the line sits just above it and tracks its (resized) height, instead of
      // a fixed viewport fraction that would cut through the panel.
      const showcase = parent.querySelector('#hero-showcase') as HTMLElement | null;
      const divider = showcase
        ? Math.round(showcase.offsetTop)
        : Math.round(vh * 0.34);
      // Bottom edge of the hero asset (the showcase panel) so we can draw a rule
      // flush along its base, mirroring the divider that hugs its top.
      const heroBottom = showcase
        ? Math.round(showcase.offsetTop + showcase.offsetHeight)
        : 0;
      // Horizontal rule positions framing each workflow panel (the grey panel
      // backgrounds were removed — these blueprint lines delineate them now).
      // [data-guide-row] sits on the VISUAL panel itself (the aspect-ratio box),
      // NOT the grid row: a grid row also contains the copy column, which can be
      // taller than the panel at some widths, so framing the row would draw the
      // rule below the panel's real edge. We draw a rule just above and below the
      // panel (HUG px OUT) so the lines hug it. Measured via rects (relative to
      // the overlay's parent) so the offsetParent chain doesn't matter. The gap
      // must stay > 0: the panels (z-10) are opaque and paint over their own
      // edges, so a rule sitting flush (HUG = 0) is hidden behind the panel. The
      // rules are drawn flat (no bow), so a hair's-breadth offset keeps them
      // visible while reading as flush against the panel with no white gap.
      const HUG = 1;
      const parentTop = parent.getBoundingClientRect().top;
      const rowEls = Array.from(
        parent.querySelectorAll('[data-guide-row]'),
      ) as HTMLElement[];
      const rows: number[] = [];
      rowEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        // Skip display:none panels — e.g. the comment section's mobile/desktop
        // variants, only one of which is laid out at a time. A hidden one rects
        // to all-zeros and would otherwise plant a bogus rule near the page top.
        if (r.width === 0 && r.height === 0) return;
        rows.push(Math.round(r.top - parentTop - HUG));
        rows.push(Math.round(r.bottom - parentTop + HUG));
      });
      setSize((prev) =>
        prev.w === w &&
        prev.h === h &&
        prev.vh === vh &&
        prev.top === top &&
        prev.divider === divider &&
        prev.heroBottom === heroBottom &&
        prev.rows.join(',') === rows.join(',')
          ? prev
          : { w, h, vh, top, divider, heroBottom, rows },
      );
    };
    measure();
    // Observe the framed panels themselves (and the hero asset), not just the
    // parent container. The panels size their height from CSS aspect-ratio, so a
    // viewport resize changes a panel's own box — observing it fires the callback
    // AFTER that height is committed, and getBoundingClientRect() (which forces a
    // layout flush) then reads the settled geometry. Watching only the parent
    // could miss or lag a panel's reflow, leaving a rule at its previous edge.
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    parent
      .querySelectorAll('[data-guide-row], #hero-showcase')
      .forEach((el) => ro.observe(el));
    window.addEventListener('resize', measure);
    // Layout-settled triggers the ResizeObserver doesn't reliably catch:
    //  - window 'load': late images (arena/folder marks, halftone bg) finish
    //    decoding and reflow the panels.
    //  - fonts.ready: the web font swaps in and text blocks change height,
    //    which can net-zero the parent height (so RO never fires) while still
    //    moving every row position.
    //  - visibilitychange: a page loaded in a BACKGROUND tab measures against
    //    not-yet-settled layout (and rAF is paused — see the draw effect). When
    //    the tab is focused, re-measure so the guides match the real geometry
    //    instead of staying stuck on the stale first pass.
    window.addEventListener('load', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    const onVisible = () => {
      if (!document.hidden) measure();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || size.w === 0 || size.h === 0) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    const { w, h, vh, top, divider, heroBottom, rows } = size;
    // Very subtle hand-drawn character — nearly straight with a faint waver. A
    // fixed seed per stroke keeps the wobble stable so it never "jitters".
    const base = { stroke: ORANGE, strokeWidth: 1.2, roughness: 0.4, bowing: 0.5 };

    const Lx = Math.round(w * 0.05); // left margin (matches the page's 5vw gutter)
    const Rx = Math.round(w * 0.95); // right margin
    const Ty = top || 88; // at the nav's bottom edge
    const My = divider || Math.round(vh * 0.34); // top edge of the showcase panel
    const By = h - 40; // bottom rule, at the very end of the page

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Verticals run the full page height as a SINGLE stroke. (They used to be
    // split into stacked segments to support a per-band scroll reveal; without
    // that reveal the segmentation only made the line read as broken where the
    // independently-perturbed segment endpoints failed to meet.)
    const vline = (x: number, y1: number, y2: number, seed: number, dashed = false) => {
      const g = rc.line(x, y1, x, y2, {
        ...base,
        seed,
        ...(dashed ? { strokeLineDash: [7, 7] } : {}),
      });
      g.setAttribute('opacity', '0.5');
      svg.appendChild(g);
    };

    const hline = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      seed: number,
      dashed = false,
      // Framing rules that hug a panel are drawn nearly straight (no bow): a
      // bowed full-bleed line arcs several px into the opaque panel and gets
      // painted over, which is why a flush rule used to "disappear". Flat rules
      // stay put, so they can sit ~1px off the edge and read as flush with no
      // visible white gap.
      flat = false,
    ) => {
      const g = rc.line(x1, y1, x2, y2, {
        ...base,
        ...(flat ? { bowing: 0 } : {}),
        seed,
        ...(dashed ? { strokeLineDash: [7, 7] } : {}),
      });
      g.setAttribute('opacity', '0.5');
      svg.appendChild(g);
    };

    // Full-bleed horizontals: at the nav, the hero divider, and the page bottom.
    hline(0, Ty, w, Ty, 11);
    // The hero asset (z-10) paints its backdrop over anything drawn at its exact
    // edge. Drawn flat (no bow) the rule stays straight, so a hair's-breadth
    // offset clears the backdrop while reading as flush against the asset.
    const HERO_RULE_GAP = 1;
    hline(0, My - HERO_RULE_GAP, w, My - HERO_RULE_GAP, 12, false, true);
    // Rule along the bottom of the hero asset, mirroring the divider above.
    if (heroBottom) hline(0, heroBottom + HERO_RULE_GAP, w, heroBottom + HERO_RULE_GAP, 16, false, true);
    hline(0, By, w, By, 13);
    // Per-panel rules framing each workflow panel (top of each + bottom of the
    // last), now that the grey panel backgrounds are gone. Flat so they hug the
    // panel edge with no visible gap.
    rows.forEach((ry, i) => hline(0, ry, w, ry, 20 + i, false, true));
    // Margin verticals run the FULL page height — left solid, right dashed.
    vline(Lx, Ty, By, 14);
    vline(Rx, Ty, By, 15, true);

    // Sparkles at the prominent corners / crossings. Flagged off for now.
    if (SHOW_SPARKLES) {
      (
        [
          [Lx, Ty],
          [Rx, Ty],
          [Lx, My],
          [Rx, My],
          [Lx, By],
          [Rx, By],
        ] as const
      ).forEach(([x, y]) => {
        svg.appendChild(sparkle(x, y));
      });
    }

    // Entrance: fade the whole overlay in once, on the first draw. Every guide
    // appears together — no per-band or scroll-driven reveal. Every other draw
    // (StrictMode's second pass, resize redraws) renders fully opaque straight
    // away — and must explicitly reset opacity to 1, since a first-draw fade
    // whose rAF got cancelled mid-flight would otherwise leave the SVG at 0.
    //
    // document.hidden guard: rAF is paused in a backgrounded tab, so if the page
    // first draws while hidden the fade-in callback never fires and the overlay
    // stays stuck at opacity 0 until you focus the tab. Skip the fade entirely
    // when hidden — show the guides immediately so they're correct on return.
    if (!firstDrawRef.current || reduceMotion || document.hidden) {
      svg.style.opacity = '1';
      if (document.hidden) firstDrawRef.current = false;
      return;
    }
    firstDrawRef.current = false;
    svg.style.opacity = '0';
    svg.style.transition = 'opacity 600ms ease-out';
    const raf = window.requestAnimationFrame(() => {
      svg.style.opacity = '1';
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      width={size.w}
      height={size.h}
      // overflow-visible: an outer <svg> clips to its width/height by default, so
      // if the measured page height is ever a hair short, guides below that y get
      // cut off. Letting it overflow keeps every line drawn regardless.
      className="pointer-events-none absolute left-0 top-0 z-0 block overflow-visible"
    />
  );
};

export default SketchGuides;
