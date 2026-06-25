// Hand-drawn "marker scribble" ellipse looped around a word, like an annotation.
//
// Reads as sketched, not a clean vector oval, via:
//   1. Several overlapping passes at different sizes/rotations/weights.
//   2. A spiral connector + an overshoot tail so the loop doesn't tidily close.
//   3. An SVG roughen filter (feTurbulence -> feDisplacementMap) for jitter.
//
// IMPORTANT: the scribble is sized by a `<span>` wrapper (positioned with em
// insets so it scales with the word at any resolution), and the SVG fills that
// wrapper at width/height 100%. An absolutely-positioned <svg> sized only by
// left/right/top/bottom is unreliable — SVG is a *replaced element*, so some
// mobile browsers (Safari/iOS) fall back to its intrinsic size instead of the
// inset box, rendering it the wrong size and outside the word. Sizing a normal
// element (the span) and letting the SVG fill it avoids that entirely.
//
// Drop inside a `relative inline-block` wrapper around the target word.
const SketchCircle = () => (
  <span
    aria-hidden
    className="pointer-events-none absolute -inset-x-[0.7em] -top-[0.62em] -bottom-[0.62em] overflow-visible sm:-inset-x-[0.78em] sm:-top-[0.5em] sm:-bottom-[0.45em]"
  >
    <svg
      viewBox="0 0 340 170"
      preserveAspectRatio="none"
      className="h-full w-full overflow-visible"
    >
      <defs>
        <filter id="sketch-rough" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g
        fill="none"
        stroke="#2b2b2b"
        strokeLinecap="round"
        filter="url(#sketch-rough)"
      >
        {/* Heavy bold outer loop — the confident first pass. */}
        <ellipse
          cx="168"
          cy="82"
          rx="152"
          ry="60"
          transform="rotate(-9 170 84)"
          strokeWidth="5.2"
          opacity="0.92"
        />
        {/* Medium second pass, slightly tighter and rotated differently. */}
        <ellipse
          cx="172"
          cy="86"
          rx="146"
          ry="54"
          transform="rotate(-4 170 84)"
          strokeWidth="3"
          opacity="0.8"
        />
        {/* Thin inner pass for the layered scribble depth. */}
        <ellipse
          cx="170"
          cy="89"
          rx="150"
          ry="49"
          transform="rotate(-1.5 170 84)"
          strokeWidth="2"
          opacity="0.6"
        />
        {/* Spiral connector — a diagonal sweep across the lower-left so the
            passes read as one continuous looping motion. */}
        <path d="M30 120 C 58 78, 112 52, 156 45" strokeWidth="2.6" opacity="0.7" />
        {/* Overshoot tail — the marker hooking out past the loop at lower-left. */}
        <path d="M44 138 C 16 150, 20 168, 52 162" strokeWidth="4.4" opacity="0.88" />
      </g>
    </svg>
  </span>
);

export default SketchCircle;
