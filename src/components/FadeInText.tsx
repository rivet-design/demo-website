import { ReactNode, useEffect, useRef, useState } from 'react';

type FadeInTextProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
};

const FadeInText = ({
  children,
  className = '',
}: FadeInTextProps) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const PENCIL_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='white' stroke='white' stroke-width='1.5' stroke-linejoin='round' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z'/%3E%3Cpath fill='white' stroke='white' stroke-width='1.5' stroke-linejoin='round' d='M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3Cpath fill='%23222' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z'/%3E%3Cpath fill='%23222' d='M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E\") 3 21, crosshair";

const VIEW_W = 420;
const VIEW_H = 180;
// Each segment fades out over this window, then is dropped.
const TRAIL_LIFETIME = 1400;
// Cap stored points to bound work if cursor moves fast.
const MAX_POINTS = 120;

type TrailPoint = { x: number; y: number; t: number };

// Mid-point quadratic bezier smoothing — eliminates jagged joins by routing
// the path through midpoints and using each raw sample only as a control point.
const buildSmoothPath = (pts: TrailPoint[]): string => {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${(pts[0].x + pts[1].x) / 2} ${(pts[0].y + pts[1].y) / 2}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
};

/**
 * Decorative pattern for the peach hero panel — large thin solid circles
 * partially extending off-frame, intersected by a dashed grid. On hover, the
 * cursor draws a smooth bezier trail that fades out over time.
 */
export const GeometricLines = ({ color = '#C97557' }: { color?: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<TrailPoint[]>([]);

  // rAF loop trims expired points so the trail fades smoothly even when the
  // cursor isn't moving. Returns the same array reference when nothing
  // expires, so React skips the re-render.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPoints((prev) => {
        if (prev.length === 0) return prev;
        const cutoff = performance.now() - TRAIL_LIFETIME;
        const idx = prev.findIndex((p) => p.t >= cutoff);
        if (idx <= 0) return idx === 0 ? prev : [];
        return prev.slice(idx);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    // Use the SVG's screen CTM so the mapping accounts for
    // preserveAspectRatio="xMidYMid slice" cropping. A naive
    // (cx / rect.width) * VIEW_W is off by the cropped margin and makes the
    // trail visibly trail behind the cursor.
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    setPoints((prev) => {
      const next = [...prev, { x: local.x, y: local.y, t: performance.now() }];
      return next.length > MAX_POINTS
        ? next.slice(next.length - MAX_POINTS)
        : next;
    });
  };

  const now = performance.now();

  // Split the trail into 4 segments rendered oldest→newest with increasing
  // opacity. Each segment overlaps its neighbour by one point so bezier
  // curves join seamlessly with no gap or hard edge.
  const TRAIL_SEGS = 4;
  const segSize = points.length > 0 ? Math.ceil(points.length / TRAIL_SEGS) : 0;
  const trailPaths = points.length >= 2
    ? Array.from({ length: TRAIL_SEGS }, (_, i) => {
        const start = Math.max(0, i * segSize - 1);
        const end = Math.min(points.length, (i + 1) * segSize + 1);
        const slice = points.slice(start, end);
        if (slice.length < 2) return null;
        const age = now - slice[0].t;
        const opacity = Math.max(0, (1 - age / TRAIL_LIFETIME) * 0.85);
        return (
          <path
            key={i}
            d={buildSmoothPath(slice)}
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={opacity}
            vectorEffect="non-scaling-stroke"
          />
        );
      })
    : [];

  return (
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ cursor: PENCIL_CURSOR }}
        aria-hidden
        onMouseMove={handleMouseMove}
      >
        {/* Dashed grid — quiet structure */}
        <line x1="0" y1="60" x2="420" y2="60" stroke={color} strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />
        <line x1="0" y1="120" x2="420" y2="120" stroke={color} strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />
        <line x1="355" y1="0" x2="355" y2="180" stroke={color} strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />

        {/* Large thin solid circles, partially out of frame */}
        <circle cx="160" cy="-30" r="90" stroke={color} strokeWidth="0.8" fill="none" opacity="0.75" />
        <circle cx="395" cy="60" r="115" stroke={color} strokeWidth="0.8" fill="none" opacity="0.75" />

        {/* Cursor trail — smooth bezier curve matching the circle geometry. */}
        {trailPaths}
      </svg>
    </div>
  );
};

export default FadeInText;
