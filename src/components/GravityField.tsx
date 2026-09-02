import { useEffect, useRef } from 'react';

import { useInView } from '../hooks/use-in-view';

/**
 * A field of Rivet marks on a grid, every one of them turning to face the
 * pointer — and orbiting a slow invisible target when the pointer is absent.
 * Ported from the `rivet-gravity` prototype.
 *
 * Two departures from that prototype, both because this runs inside a page
 * rather than as a standalone document: it measures its own container instead
 * of the window (so it can sit behind one section), and the render loop is
 * gated on visibility — a full-width canvas repainting every frame while
 * scrolled past is pure waste.
 */

// The three sub-paths of the mark, and its centre in the source's 336x337 box.
const PATH_A =
  'M185.2 16.9245C175.855 7.57953 160.704 7.57951 151.359 16.9245L26.718 141.565C17.3731 150.91 17.373 166.061 26.718 175.406L72.1177 220.806C81.4627 230.151 96.614 230.151 105.959 220.806L240.262 86.5033C244.27 82.4946 244.27 75.9951 240.262 71.9863L185.2 16.9245Z';
const PATH_B =
  'M309.829 175.413C319.174 166.068 319.174 150.917 309.829 141.572L185.189 16.931C175.844 7.586 160.692 7.58599 151.348 16.931L88.7259 79.5526L230.287 221.114C239.632 230.459 254.783 230.459 264.128 221.114L309.829 175.413Z';
const PATH_C =
  'M167.545 197.004L112.734 251.815C104.671 259.878 104.671 272.949 112.734 281.012L152.425 320.703C160.487 328.765 173.559 328.765 181.621 320.703L221.834 280.49C229.897 272.428 229.897 259.356 221.834 251.293L167.545 197.004Z';
const CX = 168;
const CY = 168.5;

// Granularity of the canvas's height. See `build()`.
const BUCKET_PX = 240;

type GravityFieldProps = {
  /** Fill for the marks. */
  color?: string;
  /** Grid pitch in px — smaller means denser. */
  cell?: number;
  /** Mark size relative to the 336x337 source box. */
  scale?: number;
  className?: string;
  /** Applied to the canvas, e.g. a mask that fades the field out. */
  style?: React.CSSProperties;
};

const GravityField = ({
  color = '#ece7d9',
  cell = 38,
  scale = 0.11,
  className = '',
  style,
}: GravityFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref: hostRef, inView } = useInView<HTMLDivElement>({
    rootMargin: '120px',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || !inView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const a = new Path2D(PATH_A);
    const b = new Path2D(PATH_B);
    const c = new Path2D(PATH_C);

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let maxDist = 1;
    let angles = new Float32Array(0);

    const build = () => {
      const rect = host.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      // Height is rounded UP to a bucket instead of tracked exactly. When a
      // section grows — the install accordion opening — the ResizeObserver
      // fires every frame of the transition, and each rebuild reallocates the
      // backing store at DPR 2 and clears it. That per-frame reallocation is
      // what made the field stutter while everything else moved smoothly.
      // Bucketing turns ~20 reallocations into one or two; in between, the
      // canvas is simply taller than it needs to be and the section's own
      // overflow-hidden crops it. The grid lays out from the top-left, so the
      // marks already on screen do not shift when the bucket changes.
      const nextH = Math.max(
        BUCKET_PX,
        Math.ceil(rect.height / BUCKET_PX) * BUCKET_PX,
      );
      if (nextW === w && nextH === h) return;
      w = nextW;
      h = nextH;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;

      cols = Math.ceil(w / cell) + 2;
      rows = Math.ceil(h / cell) + 2;
      maxDist = Math.sqrt(w * w + h * h) / 2;
      // Preserve eased angles across a resize so it doesn't snap.
      const next = new Float32Array(cols * rows);
      next.set(angles.subarray(0, Math.min(angles.length, next.length)));
      angles = next;
    };

    // Pointer is tracked in the host's own coordinates, not the page's.
    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 && pointer.x <= rect.width &&
        pointer.y >= 0 && pointer.y <= rect.height;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    let raf = 0;
    const tick = (now: number) => {
      // Idle: a slow orbit, so the field is never completely still. Centred on
      // the BUCKETED box rather than the visible one, which puts it slightly
      // low — invisible at this scale, and not worth a second measurement.
      let tx: number;
      let ty: number;
      if (pointer.active) {
        tx = pointer.x;
        ty = pointer.y;
      } else {
        const t = now / 1000;
        const R = Math.min(w, h) * 0.28;
        tx = w / 2 + Math.cos(t * 0.25) * R;
        ty = h / 2 + Math.sin(t * 0.25) * R;
      }

      ctx.clearRect(0, 0, w, h);

      let idx = 0;
      for (let r = -1; r < rows - 1; r++) {
        const cy = r * cell + cell / 2;
        for (let col = -1; col < cols - 1; col++, idx++) {
          const cx = col * cell + cell / 2;

          const dx = tx - cx;
          const dy = ty - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const desired = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

          let cur = angles[idx];
          const delta = ((desired - cur + 540) % 360) - 180;
          // Nearer marks turn faster — that lag is what reads as gravity.
          const ease = reduceMotion
            ? 0.4
            : Math.max(0.035, 0.15 - (dist / maxDist) * 0.11);
          cur += delta * ease;
          angles[idx] = cur;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((cur * Math.PI) / 180);
          ctx.scale(scale, scale);
          ctx.translate(-CX, -CY);
          ctx.fill(a);
          ctx.fill(b);
          ctx.fill(c);
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    build();
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(build);
    ro.observe(host);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [inView, color, cell, scale, hostRef]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" style={style} />
    </div>
  );
};

export default GravityField;
