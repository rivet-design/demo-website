import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';

const RIPPLE_SHAPES = ['circle', 'triangle', 'square'] as const;
type RippleShape = (typeof RIPPLE_SHAPES)[number];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

// Hash-based pseudo-random in [0, 1) — deterministic per seed.
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type CellProps = {
  cx: number;
  cy: number;
  pathR: number;
  strokeWidth: number;
  shape: RippleShape;
  scale: number;
  color: string;
};

// Memoized so cells whose props don't change skip re-render — critical for
// keeping rAF-driven hover updates cheap (only the ~dozen cells inside the
// morph zone re-render each frame).
const Cell = memo(
  ({ cx, cy, pathR, strokeWidth, shape, scale, color }: CellProps) => {
    const common = { fill: 'none', stroke: color, strokeWidth };
    let path: ReactElement;
    if (shape === 'square') {
      path = (
        <rect
          {...common}
          x={-pathR}
          y={-pathR}
          width={pathR * 2}
          height={pathR * 2}
        />
      );
    } else if (shape === 'triangle') {
      const points = [
        `0,${-pathR}`,
        `${pathR * COS30},${pathR * SIN30}`,
        `${-pathR * COS30},${pathR * SIN30}`,
      ].join(' ');
      path = <polygon {...common} points={points} />;
    } else {
      path = <circle {...common} cx={0} cy={0} r={pathR} />;
    }
    return <g transform={`translate(${cx} ${cy}) scale(${scale})`}>{path}</g>;
  },
);
Cell.displayName = 'Cell';

type Props = {
  /** Stroke color for the cells. Default 'black'. */
  color?: string;
  /** Column count. Default 12. Higher = tighter column spacing. */
  cols?: number;
  /** Vertical density knob (and target gap before the row count is rounded
   *  to fit the container). Default 24. Lower = more rows, denser feel. */
  spacing?: number;
};

/**
 * Decorative grid. Stroke weight is heaviest at the top (filled dots) and
 * thins down to outline rings at the bottom — Mike Tessier "Unoriginal Idea"
 * inspiration. On hover, an organic blob around the cursor (radius wobbles
 * by angle) cycles its cells through random shapes at a deliberate pace as
 * long as the user keeps hovering.
 *
 * Sized to fill the nearest positioned ancestor (uses ResizeObserver). Pass a
 * `color` to use against any background — defaults to black for the orange
 * hero panel; pass `rgba(255,255,255,0.4)` (or similar) for use over a dark
 * surface like the footer.
 */
const CircleGridArt = ({
  color = 'black',
  cols = 12,
  spacing = 24,
}: Props) => {
  const maxRows = 14;
  const minRows = 3;
  const gridPadding = 18;
  const outerR = 4;
  const fallbackWidth = (cols + 2) * spacing;
  const fallbackHeight = (maxRows + 2) * spacing;

  const shapeDuration = 1600;
  const rampFraction = 0.09;
  const frameInterval = 1000 / 30;
  const baseRadius = 50;

  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const [, setTick] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({
    width: fallbackWidth,
    height: fallbackHeight,
  });

  useLayoutEffect(() => {
    const panel = svgRef.current?.parentElement;
    if (!panel) return;

    const measure = () => {
      const { width: rawWidth, height: rawHeight } =
        panel.getBoundingClientRect();
      const width = Math.round(rawWidth);
      const height = Math.round(rawHeight);
      if (width === 0 || height === 0) return;
      setSvgSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, []);

  const verticalSpan = Math.max(
    0,
    svgSize.height - 2 * (gridPadding + outerR),
  );
  const rows = Math.max(
    minRows,
    Math.min(maxRows, Math.floor(verticalSpan / spacing) + 1),
  );
  const rowSpacing = rows > 1 ? verticalSpan / (rows - 1) : 0;
  const startY = gridPadding + outerR;

  const horizontalSpan = Math.max(
    0,
    svgSize.width - 2 * (gridPadding + outerR),
  );
  const columnSpacing =
    cols > 1 ? Math.max(8, horizontalSpan / (cols - 1)) : 0;
  const startX = gridPadding + outerR;

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (
        cursorRef.current !== null &&
        now - lastFrameRef.current >= frameInterval
      ) {
        lastFrameRef.current = now;
        setTick((n) => (n + 1) % 1_000_000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameInterval]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const localPt = pt.matrixTransform(ctm.inverse());
    if (cursorRef.current === null) {
      startTimeRef.current = performance.now();
    }
    cursorRef.current = { x: localPt.x, y: localPt.y };
  };

  const handleMouseLeave = () => {
    cursorRef.current = null;
    setTick((n) => (n + 1) % 1_000_000);
  };

  const cursor = cursorRef.current;
  const elapsed = cursor ? performance.now() - startTimeRef.current : 0;

  const cells: ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const norm = rows === 1 ? 0 : r / (rows - 1);
      const t = 1 - norm;
      const innerR = (1 - t) * (outerR - 1);
      const strokeWidth = outerR - innerR;
      const pathR = (outerR + innerR) / 2;

      const cx = startX + c * columnSpacing;
      const cy = startY + r * rowSpacing;

      let shape: RippleShape = 'circle';
      let scale = 1;

      if (cursor) {
        const dx = cx - cursor.x;
        const dy = cy - cursor.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const wobble = 14 * Math.sin(angle * 3) + 7 * Math.sin(angle * 7);
        const boundary = baseRadius + wobble;
        if (dist < boundary) {
          const cellPhase = pseudoRandom(r * 7 + c * 13) * shapeDuration;
          const localElapsed = elapsed + cellPhase;

          const cycleNum = Math.floor(localElapsed / shapeDuration);
          const seed = r * 131 + c * 37 + cycleNum * 17;
          const idx = Math.floor(pseudoRandom(seed) * RIPPLE_SHAPES.length);
          shape = RIPPLE_SHAPES[idx];

          const stageProgress =
            (localElapsed % shapeDuration) / shapeDuration;
          let ramp = 1;
          if (stageProgress < rampFraction) {
            const t2 = stageProgress / rampFraction;
            ramp = 1 - (1 - t2) ** 3;
          } else if (stageProgress > 1 - rampFraction) {
            const t2 = (stageProgress - (1 - rampFraction)) / rampFraction;
            ramp = 1 - t2 ** 3;
          }
          scale = ramp;
        }
      }

      cells.push(
        <Cell
          key={`${r}-${c}`}
          cx={cx}
          cy={cy}
          pathR={pathR}
          strokeWidth={strokeWidth}
          shape={shape}
          scale={scale}
          color={color}
        />,
      );
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 block h-full w-full"
      aria-hidden
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {cells}
    </svg>
  );
};

export default CircleGridArt;
