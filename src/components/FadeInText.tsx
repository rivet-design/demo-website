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

const VIEW_W = 420;
const VIEW_H = 180;
// Each segment fades out over this window, then is dropped.
const TRAIL_LIFETIME = 1400;
// Cap stored points to bound work if cursor moves fast.
const MAX_POINTS = 120;

type TrailPoint = { x: number; y: number; t: number };

/**
 * Decorative pattern for the peach hero panel — large thin solid circles
 * partially extending off-frame, intersected by a dashed grid. On hover, the
 * cursor draws a temporary trail: each segment is rendered as its own line so
 * older segments can fade individually before being dropped.
 */
export const GeometricLines = () => {
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

  return (
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden
        onMouseMove={handleMouseMove}
      >
        {/* Dashed grid — quiet structure */}
        <line x1="0" y1="60" x2="420" y2="60" stroke="#D9907A" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />
        <line x1="0" y1="120" x2="420" y2="120" stroke="#D9907A" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />
        <line x1="355" y1="0" x2="355" y2="180" stroke="#D9907A" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.55" />

        {/* Large thin solid circles, partially out of frame */}
        <circle cx="160" cy="-30" r="90" stroke="#C97557" strokeWidth="0.8" fill="none" opacity="0.75" />
        <circle cx="395" cy="60" r="115" stroke="#C97557" strokeWidth="0.8" fill="none" opacity="0.75" />

        {/* Cursor trail — same stroke weight + color as the circles so it
            reads as part of the same geometry. */}
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const age = now - p.t;
          if (age > TRAIL_LIFETIME) return null;
          const opacity = (1 - age / TRAIL_LIFETIME) * 0.85;
          return (
            <line
              key={p.t}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="#C97557"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default FadeInText;
