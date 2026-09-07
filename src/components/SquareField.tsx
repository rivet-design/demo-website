import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { measurePageGrid } from '../lib/pageGrid';

/**
 * The marks field: Rivet's corner squares, set out across the page in fours —
 * the same bracket a picture wears, drawn around empty space instead.
 *
 * Four rules, and nothing else:
 *   - four marks to a box, on the corners of a rectangle
 *   - the sides are the page's own column lines (lib/pageGrid, the source the
 *     grid overlay draws from), so a box is always on the grid
 *   - the top and bottom are lines from ONE shared row set, so two boxes at
 *     the same height are aligned with each other exactly — and that set is
 *     seeded with the rows the pictures' corner marks already sit on, so a
 *     drawn box lines up with the real marks rather than near them
 *   - the space it encloses is empty — every candidate is tested against the
 *     laid-out content and dropped on any overlap
 */

const COLUMNS = 12;
/** Two widths only. More sizes read as noise rather than as a system. */
const SPANS = [2, 3] as const;
/** Fills stretches of page with no corner mark to borrow a row from. */
const ROW_PITCH = 96;
/** Share of the clear candidates that are kept. */
const FILL = 0.14;
/** At most this many boxes, so a tall page does not fill up with them. */
const MAX_BOXES = 10;
/** Breathing room around content a box must not touch, in px. */
const PADDING = 12;
/** The page's own blocks, whose surrounding gaps are off-limits. */
const SECTIONS = '.masthead, .chapter, .pull-quote, .wide-figure, .closing-row';
/** How far the dead band reaches past each section's edges, in px. */
const SECTION_MARGIN = 220;
/** Order the four corners arrive in, so a box draws itself. */
const CORNER_STEP_MS = 55;
/** Anything that counts as occupied. */
const CONTENT = 'h1, h2, h3, p, figure, .about-hero, .article-label, .closing-row__field';

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Mark = { x: number; y: number; corner: Corner; opacity: number; delay: number };
type Box = { top: number; left: number; right: number; bottom: number };

const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Layout position within `stop`, walking the offsetParent chain. offsetTop is
 * a layout value, so unlike getBoundingClientRect it ignores the scroll-reveal
 * transforms blocks sit under while they arrive — measuring those would peg
 * every row 22px off until its block had finished animating.
 */
const layoutBox = (el: HTMLElement, stop: HTMLElement): Box => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== stop) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left: x, top: y, right: x + el.offsetWidth, bottom: y + el.offsetHeight };
};

const overlaps = (a: Box, b: Box, pad: number) =>
  a.left < b.right + pad &&
  a.right > b.left - pad &&
  a.top < b.bottom + pad &&
  a.bottom > b.top - pad;

const SquareField = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [shown, setShown] = useState<Set<number>>(() => new Set());

  const measure = useCallback(() => {
    const el = ref.current;
    const host = el?.offsetParent as HTMLElement | null;
    const grid = measurePageGrid(COLUMNS);
    if (!el || !host || !grid) return;

    const parts = [...document.querySelectorAll<HTMLElement>(CONTENT)]
      .filter((n) => n.offsetWidth > 0 && n.offsetHeight > 0)
      .map((n) => layoutBox(n, host));
    // A free-standing box also keeps out of the composed rows entirely. The
    // blank space inside one of those is the row's own — the gap between the
    // wide picture's copy and its sign-off is holding them apart, not waiting
    // to be filled — and a box dropped in it on some unrelated y reads as
    // belonging to that row rather than to the page — the masthead's gap
    // between picture and lede is the same case. The numbered rows get their
    // own boxes instead, below.
    const occupied = [
      ...parts,
      // .closing-row is listed too: its texture layer is what stood in for it
      // here, and that layer is hidden at the collapsed breakpoint — which let
      // a box drop straight into the block beside "Join Rivet".
      // .chapter, not .tool-row: a row's box only spans columns 5-12, so the
      // empty half-page beside the table falls outside every one of them —
      // which let free-standing boxes land there at arbitrary heights, mixed
      // in among the row boxes that ARE aligned to their pictures. Excluding
      // the chapter whole leaves that zone to the row boxes alone.
      ...[
        ...document.querySelectorAll<HTMLElement>('.masthead, .chapter, .wide-figure, .closing-row'),
      ].map((n) => layoutBox(n, host)),
      // The clear bands BETWEEN sections — the bands only, never the sections
      // themselves, or a section's own interior would be closed off with them.
      // A box floating in one of those gaps belongs to neither side of it —
      // just above the table's opening rule, or in the run-out between the
      // sign-off and the closing block — and reads as something that escaped
      // rather than something placed.
      ...[...document.querySelectorAll<HTMLElement>(SECTIONS)].flatMap((n) => {
        const b = layoutBox(n, host);
        return [
          { ...b, top: b.top - SECTION_MARGIN, bottom: b.top },
          { ...b, top: b.bottom, bottom: b.bottom + SECTION_MARGIN },
        ];
      }),
    ];

    // The one shared row set: the rows the pictures' corner marks already sit
    // on, with plain pitch rows filling any stretch that has none. Every box
    // takes its top and bottom from here, so boxes at the same height line up
    // with each other and with the real marks.
    const rows = [
      ...new Set(
        [...document.querySelectorAll<HTMLElement>('.image-corner')].map((c) =>
          Math.round(layoutBox(c, host).top + c.offsetHeight / 2),
        ),
      ),
    ].sort((p, q) => p - q);
    for (let y = ROW_PITCH; y < el.offsetHeight; y += ROW_PITCH) {
      if (!rows.some((r) => Math.abs(r - y) < ROW_PITCH * 0.6)) rows.push(y);
    }
    rows.sort((p, q) => p - q);
    if (rows.length < 2) return;

    const { lines } = grid;
    const placed: Box[] = [];
    const next: Mark[] = [];

    for (let r = 0; r < rows.length - 1 && placed.length < MAX_BOXES; r += 1) {
      for (let c = 0; c < lines.length - 1; c += 1) {
        const seed = r * 977 + c + 1;
        if (rand(seed) > FILL) continue;

        const span = SPANS[Math.floor(rand(seed + 5) * SPANS.length)];
        // A box needs both of its right-hand lines to exist; near the edge
        // there is nothing to measure, so skip rather than clamp — a clamped
        // box would be a different width from every other one.
        if (c + span >= lines.length) continue;

        // Adjacent rows, so every box in a band is the same height as its
        // neighbours and their tops AND bottoms agree.
        const box = {
          top: rows[r],
          bottom: rows[r + 1],
          left: lines[c],
          right: lines[c + span],
        };
        if (box.bottom - box.top < 40) continue;
        if (occupied.some((o) => overlaps(box, o, PADDING))) continue;
        if (placed.some((o) => overlaps(box, o, PADDING))) continue;
        placed.push(box);

        // One weight and one stagger for the whole box: its four corners are
        // one object, and lighting them independently would undo that.
        const opacity = 0.25 + rand(seed + 91) * 0.35;
        const delay = Math.round(rand(seed + 17) * 420);
          const corners: [number, number, Corner][] = [
            [box.left, box.top, 'tl'],
            [box.right, box.top, 'tr'],
            [box.left, box.bottom, 'bl'],
            [box.right, box.bottom, 'br'],
          ];
        corners.forEach(([x, y, corner], i) => {
          next.push({ x, y, corner, opacity, delay: delay + i * CORNER_STEP_MS });
        });
      }
    }
    /**
     * One box per numbered row. Each takes its top and bottom from that row's
     * own picture, so it sits on exactly the same two horizontal axes as the
     * picture's corner marks rather than near them.
     *
     * The sides are chosen ONCE for the whole table, not per row: a column
     * pair that clears every row's content is picked first, and every row box
     * then uses it. Choosing per row gave each box its own width and left the
     * set looking scattered rather than measured.
     */
    const tableRows = [...document.querySelectorAll<HTMLElement>('.tool-row')]
      .map((row) => {
        const figure = row.querySelector<HTMLElement>('.tool-row__figure');
        if (!figure) return null;
        const ys = [...figure.querySelectorAll<HTMLElement>('.image-corner')].map(
          (c) => layoutBox(c, host).top + c.offsetHeight / 2,
        );
        if (ys.length < 2) return null;
        return {
          top: Math.min(...ys),
          bottom: Math.max(...ys),
          // Tested against THIS row's own content and the chapter heading
          // beside it, not the whole page: the box lives inside the row, so
          // the only things it can collide with are the things in the row.
          near: [
            ...row.querySelectorAll<HTMLElement>(CONTENT),
            ...document.querySelectorAll<HTMLElement>('.chapter__title'),
          ]
            .filter((n) => n.offsetWidth > 0 && n.offsetHeight > 0)
            .map((n) => layoutBox(n, host)),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (tableRows.length > 0) {
      let best: { c: number; span: number; rows: typeof tableRows } | null = null;
      for (const span of SPANS) {
        for (let c = 0; c + span < lines.length; c += 1) {
          const fits = tableRows.filter(
            (r) =>
              !r.near.some((o) =>
                overlaps({ top: r.top, bottom: r.bottom, left: lines[c], right: lines[c + span] }, o, PADDING),
              ),
          );
          if (!best || fits.length > best.rows.length) best = { c, span, rows: fits };
        }
      }
      if (best) {
        best.rows.forEach((r, i) => {
          const box = {
            top: r.top,
            bottom: r.bottom,
            left: lines[best!.c],
            right: lines[best!.c + best!.span],
          };
          const opacity = 0.25 + rand(i * 313 + 91) * 0.35;
          const delay = Math.round(rand(i * 313 + 17) * 420);
          const corners: [number, number, Corner][] = [
            [box.left, box.top, 'tl'],
            [box.right, box.top, 'tr'],
            [box.left, box.bottom, 'bl'],
            [box.right, box.bottom, 'br'],
          ];
          corners.forEach(([x, y, corner], n) => {
            next.push({ x, y, corner, opacity, delay: delay + n * CORNER_STEP_MS });
          });
        });
      }
    }

    setMarks(next);
    setShown(new Set());
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    const frame = document.querySelector<HTMLElement>('[data-page-frame]');
    if (!el || !frame) return;
    // After a frame: the rows come from laid-out corner marks, and the
    // pictures they hang off are still being sized on the first pass.
    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el || marks.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const arrived: number[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          arrived.push(Number((entry.target as HTMLElement).dataset.i));
          io.unobserve(entry.target);
        }
        if (arrived.length > 0) setShown((prev) => new Set([...prev, ...arrived]));
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    el.querySelectorAll('[data-i]').forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [marks]);

  return (
    <div ref={ref} aria-hidden className="square-field">
      {marks.map((mark, i) => (
        <span
          key={i}
          data-i={i}
          className={`square-field__mark square-field__mark--${mark.corner}${
            shown.has(i) ? ' is-in' : ''
          }`}
          style={
            {
              left: `${mark.x}px`,
              top: `${mark.y}px`,
              '--sq-o': mark.opacity,
              '--sq-d': `${mark.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default SquareField;
