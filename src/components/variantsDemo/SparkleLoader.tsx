/**
 * Port of rivet/src/ui/src/components/SparkleLoader.tsx — a braille glyph strip
 * that scrolls on a CSS keyframe (`.rivet-sparkle-strip` in index.css), so there
 * are no per-frame React re-renders.
 */
const SPARKLE_FRAMES = ['⡡⠊⢔⠡', '⠊⡰⡡⡘', '⢔⢅⠈⢢', '⡁⢂⠆⡍', '⢔⠨⢑⢐', '⠨⡑⡠⠊'];

const SparkleLoader = ({
  className,
  'data-testid': dataTestId,
}: { className?: string; 'data-testid'?: string } = {}) => (
  <div
    className={`rivet-sparkle relative overflow-hidden font-mono leading-none ${
      className ?? 'text-base text-[var(--content)]'
    }`}
    style={{ height: '1em', width: '4ch' }}
    aria-hidden="true"
    data-testid={dataTestId}
  >
    <div className="rivet-sparkle-strip">
      {SPARKLE_FRAMES.map((frame, i) => (
        <span
          key={i}
          className="block"
          style={{ height: '1em', lineHeight: '1em' }}
        >
          {frame}
        </span>
      ))}
    </div>
  </div>
);

export default SparkleLoader;
