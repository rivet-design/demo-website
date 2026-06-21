import PaperTexture from './PaperTexture';

// A sheet of handmade paper to lay content on. Procedural (no image asset):
//   - a warm cream base with the shared PaperTexture overlay (fine grain +
//     longer fibers) for an uneven, fibrous mottle,
//   - RIPPED edges: the whole sheet is masked to a torn outline — a rectangle
//     warped by a feTurbulence -> feDisplacementMap filter — so the silhouette
//     looks torn rather than a clean rounded rectangle,
//   - a `drop-shadow` (not box-shadow) on the wrapper so the shadow follows the
//     ripped edge instead of a clean rectangle.

// Torn-edge mask: a white rect displaced by fractal noise. White = paper kept,
// the jagged boundary = the rip. Built as a data-URI SVG so it can drive
// CSS `mask-image`.
const TORN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='none'>" +
  "<filter id='t'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.014 0.02' numOctaves='3' seed='7' result='n'/>" +
  "<feDisplacementMap in='SourceGraphic' in2='n' scale='20' xChannelSelector='R' yChannelSelector='G'/>" +
  "</filter>" +
  "<rect x='14' y='14' width='372' height='272' rx='4' fill='white' filter='url(#t)'/>" +
  "</svg>";
const TORN_MASK = `url("data:image/svg+xml,${encodeURIComponent(TORN_SVG)}")`;

const PaperSheet = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  // Outer wrapper carries the drop-shadow so it traces the masked (torn) shape.
  <div
    className={`relative ${className}`}
    style={{ filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.42))' }}
  >
    {/* Inner sheet, masked to the torn outline. */}
    <div
      className="relative overflow-hidden bg-[#ECE7DB]"
      style={{
        WebkitMaskImage: TORN_MASK,
        maskImage: TORN_MASK,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      {/* Grain + fibers. */}
      <PaperTexture />

      {/* Content above the texture. */}
      <div className="relative">{children}</div>
    </div>
  </div>
);

export default PaperSheet;
