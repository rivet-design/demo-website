import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';

// Loose brand shapes scattered around the hero showcase, per the Figma
// composition (Rivet Brand Exploration, node 805:6730) — unlike the shapes
// baked into HeroShowcaseBackground, these sit as free-floating accents that
// bleed past the showcase's own edges and drift gently in place. Same fixed
// design-canvas + cover-scale technique as HeroShowcaseBackground/
// VariantsShowcase, so they stay locked to the showcase's other layers at any
// viewport width.
const DESIGN_W = 1409;
const DESIGN_H = 713;

const SHAPES: {
  src: string;
  left: number;
  top: number;
  w: number;
  h: number;
  duration: number;
  delay: number;
}[] = [
  {
    src: '/images/floating/pill-row.svg',
    left: 1388,
    top: 30,
    w: 147.19,
    h: 65.43,
    duration: 9,
    delay: 1.2,
  },
  {
    src: '/images/floating/circle-arc.svg',
    left: 1309,
    top: 547.1,
    w: 257.59,
    h: 149.12,
    duration: 8.5,
    delay: 0.6,
  },
  {
    src: '/images/floating/union-big.svg',
    left: -260,
    top: 99,
    w: 287,
    h: 246,
    duration: 10,
    delay: 2,
  },
];

type FloatingShapesProps = {
  /**
   * Entry offset in px. Shapes on the RIGHT half of the design canvas are
   * pushed by +offset, shapes on the LEFT by -offset, so animating this to 0
   * slides each shape in from its own nearest edge rather than sweeping the
   * whole group in from one side.
   */
  offsetX?: MotionValue<number>;
  /**
   * Repositions the loose shapes for the left-aligned direction: the left
   * cluster drops to the bottom corner (the copy now occupies where it used to
   * sit) and pushes further off-canvas, the top-right pill drops down the
   * side, and the brown cluster pushes further out to the right edge.
   */
  leftAlignedLayout?: boolean;
};

const FloatingShapes = ({ offsetX, leftAlignedLayout }: FloatingShapesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: DESIGN_W, h: DESIGN_H });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = Math.max(box.w / DESIGN_W, box.h / DESIGN_H);

  // Hooks can't be called inside the map, so both directions are derived once.
  const zero = useMotionValue(0);
  const rightX = offsetX ?? zero;
  const leftX = useTransform(rightX, (v) => -v);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {SHAPES.map((shape) => {
          const fromRight = shape.left + shape.w / 2 > DESIGN_W / 2;
          let { left, top } = shape;
          if (leftAlignedLayout) {
            if (!fromRight) {
              // out of the headline's way, and further past the edge
              left -= 40;
              top = DESIGN_H - shape.h * 0.55;
            } else if (shape.top < DESIGN_H / 2) {
              top += 170; // the top-right pill slides down the side
            } else {
              left += 40; // the brown cluster pushes back out
            }
          }
          return (
            // The entry offset lives on a WRAPPER, not on the <img>: the
            // `rivet-float` drift is a CSS animation on `transform`, and a CSS
            // animation beats an inline transform — putting `x` on the image
            // would simply be ignored while the drift is running.
            <motion.div
              key={shape.src}
              className="absolute"
              style={{
                x: fromRight ? rightX : leftX,
                left,
                top,
                width: shape.w,
                height: shape.h,
              }}
            >
              <img
                src={shape.src}
                alt=""
                className="rivet-float absolute inset-0 h-full w-full"
                style={{
                  animationDuration: `${shape.duration}s`,
                  animationDelay: `${shape.delay}s`,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingShapes;
