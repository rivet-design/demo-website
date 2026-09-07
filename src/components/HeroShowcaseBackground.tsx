// The hero's decorative backdrop. Was previously rebuilt from individual
// Figma layers so it could smart-animate on scroll (see git history), but
// that per-asset sync kept drifting out of date with the Figma file — for
// now this is just the latest flattened export, static, no scroll animation.
// `contain` (not `cover`) — the image has its own outline + corner radius
// baked in right at the edges, and this container's aspect ratio doesn't
// exactly match the image's, so `cover` was cropping a sliver off the sides
// and cutting into that border.
const HeroShowcaseBackground = ({
  /** Override the artwork — the left-aligned direction uses its own panel. */
  src = '/images/hero-showcase-bg.png',
  /**
   * `cover` instead of `contain`. The default contains the art so its baked-in
   * border isn't clipped, but that letterboxes badly in a portrait box — which
   * is the shape the mobile panel needs — so mobile fills and accepts the crop.
   */
  fill = false,
}: { src?: string; fill?: boolean } = {}) => (
  <div
    // Rounded on its own rather than relying on a clipping parent: the mobile
    // panel deliberately lets FloatingShapes overhang its edges, so it can't
    // carry `overflow-hidden` to round this off.
    className={`pointer-events-none absolute inset-0 -z-10 rounded-lg bg-center bg-no-repeat ${
      fill ? 'bg-cover' : 'bg-contain'
    }`}
    style={{ backgroundImage: `url('${src}')` }}
  />
);

export default HeroShowcaseBackground;
