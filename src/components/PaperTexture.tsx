// Reusable handmade-paper texture overlay: three SVG noise layers generated
// with feTurbulence and blended in `multiply` so any surface beneath it picks
// up an uneven, fibrous, paper-like character:
//   - mottle: low-frequency cloudy unevenness (the most visible layer),
//   - grain:  fine speckle,
//   - fibers: longer directional streaks.
//
// Renders as an absolutely-positioned layer filling its nearest positioned
// ancestor. Pass `className="-z-10"` to sit it behind static content (so it
// blends with the panel's background color but stays under the content).
const PaperTexture = ({ className = '' }: { className?: string }) => (
  <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
    {/* Cloudy mottle — low frequency, the layer you actually notice. */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-multiply">
      <filter id="paper-mottle">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.016 0.022"
          numOctaves="3"
          seed="3"
          result="m"
        />
        <feColorMatrix in="m" type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-mottle)" />
    </svg>

    {/* Fine grain. */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.30] mix-blend-multiply">
      <filter id="paper-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.55"
          numOctaves="4"
          seed="5"
          stitchTiles="stitch"
          result="g"
        />
        <feColorMatrix in="g" type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>

    {/* Longer directional fibers. */}
    <svg className="absolute inset-0 h-full w-full opacity-[0.16] mix-blend-multiply">
      <filter id="paper-fiber">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.45"
          numOctaves="2"
          seed="9"
          result="f"
        />
        <feColorMatrix in="f" type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-fiber)" />
    </svg>
  </div>
);

export default PaperTexture;
