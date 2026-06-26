// Renders text as hand-drawn, hollow letterforms — like ink traced by hand.
//
// Two layers of effect:
//   1. An outlined stroke with a transparent fill (-webkit-text-stroke) so the
//      letters read as hollow, like the sketched "rivet" wordmark.
//   2. An SVG roughen filter (feTurbulence -> feDisplacementMap) warps the
//      rendered glyphs so the outline comes out uneven and wobbly instead of
//      crisp vector — the hand-drawn, paper-textured feel.
//
// It stays real, selectable, responsive HTML text (wraps normally); the filter
// just displaces the painted pixels.
const HandDrawnText = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={`relative inline-block ${className}`}>
    {/* Filter definition (zero-size; just registers #handdrawn-ink). */}
    <svg width="0" height="0" aria-hidden className="absolute">
      <filter id="handdrawn-ink" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.013 0.02"
          numOctaves="2"
          seed="4"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="3.6"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
    <span
      style={{
        WebkitTextStroke: '1.1px #2b2b2b',
        WebkitTextFillColor: 'transparent',
        filter: 'url(#handdrawn-ink)',
      }}
    >
      {children}
    </span>
  </span>
);

export default HandDrawnText;
