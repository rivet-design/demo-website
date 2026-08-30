import { useInView } from '../hooks/use-in-view';
import { SITE_FILL, footerBackground } from '../lib/background';

const X_LINK = 'https://x.com/designrivet';
const LINKEDIN_LINK = 'https://www.linkedin.com/company/rivetdesign';
const INSTAGRAM_LINK = 'https://www.instagram.com/rivet.design';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const MCP_LINK = 'https://docs.rivet.design/mcp-guide';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  // Fade-and-rise as the footer arrives, rather than being fully formed the
  // moment it scrolls into frame. `rootMargin: '-80px'` holds it back until
  // the block is properly in view — the hook's 200px default would fire it
  // while the footer is still below the fold and the motion would be over
  // before you could see it.
  const { ref: revealRef, inView } = useInView<HTMLDivElement>({
    rootMargin: '-80px',
  });
  const fade = (delayMs: number) => ({
    opacity: inView ? 1 : 0,
    transition: `opacity 760ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms`,
  });
  const rise = (delayMs: number) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 620ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms, transform 620ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms`,
  });

  return (
    // The fill lives on the footer ITSELF, not only on the two blocks inside
    // it. Those blocks carry negative top margins, so the footer's own box is
    // taller than what they paint — and the page's warm ground showed through
    // as a strip along the bottom.
    <footer className="w-full" style={footerBackground}>
      {/* On mobile the links sit higher (smaller pt) and the block reserves a
          deep bottom padding (pb-[26vw]) so the multicolor logo — pulled up
          ~23.8vw below — clears the link text instead of overlapping it. Desktop
          keeps the original pt-14 / pb-10. */}
      {/* Full-bleed via bleed-page-gutter-x (negative margins equal to the
          page gutter) rather than w-screen + 50%-50vw: 100vw includes the
          scrollbar, which shifted the whole block — and its page-gutter-x
          contents — a few px left of the blueprint guide rules. The negative
          margin resolves from the same --page-gutter-x the guides measure,
          so the content edges sit exactly on the rules. */}
      {/* Full-bleed positioning context. The tan panel and its clip live
          inside; the blobs are siblings of the panel so they can hang outside
          it. */}
      <div className="bleed-page-gutter-x relative px-[var(--frame-inset-x)]">
      {/* THE TAN FRAME. 8px radius on the TOP corners only, with the #fafafa
          margin down the left and right sides. It runs to the bottom of the
          page — a bottom margin left a white band under it.
          overflow-hidden, so everything inside — links,
          wordmark, comb texture, heart — is clipped to it. Its
          height is cut short by the mark's negative bottom margin below, which
          crops the wordmark AND keeps the footer short enough that the links
          stay on screen at the bottom of the page. */}
      <div
        className="relative overflow-hidden rounded-t-lg"
        style={{ backgroundColor: SITE_FILL }}
      >
      {/* relative z-20: the mark block below is pulled up over this one by
          ~144px and its inner box is pointer-events-auto (the heart's
          click-to-spin), so at a lower stacking level it covered the links and
          ate every hover and click. Content sits above the artwork. */}
      <div ref={revealRef} className="relative z-20 pt-10 pb-[30vw] md:pt-20 md:pb-8">
       <div className="page-gutter-x">
        <div className="flex w-full flex-wrap items-start gap-x-20 gap-y-8">
          {/* Rivet logo on the left, with the copyright + a small Terms/Privacy
              row directly beneath it */}
          <div className="flex flex-col items-start gap-4" style={rise(0)}>
            <img
              src="/images/rivet-app-icon.png"
              alt="Rivet"
              draggable={false}
              className="inline-block h-11 sm:h-12 w-auto"
            />
            <div className="flex flex-col items-start gap-2">
              <span className="font-aileron text-base font-medium text-black/70">
                © 2026 Rivet, Inc.
              </span>
              {/* Deliberately a step down from the column headings: this is tertiary
                  legal text, not a peer of "Rivet"/"Community". Kept at text-sm,
                  but in a darker warm tone rather than the headings' purple —
                  #6273A1 at 14px sits too light against the tan to read
                  comfortably. */}
              <div className="flex items-center gap-4 font-aileron text-sm font-medium text-[#8c8071]">
                <a href="/terms" className="transition-colors hover:text-black/70">
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-black/70"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>

          {/* Spacer to push columns to the right */}
          <div className="flex-1" />

          {/* Link columns - right aligned, each left-aligned internally */}
          <div className="flex flex-wrap gap-x-20 gap-y-8">
            <div className="flex flex-col items-start gap-4" style={rise(90)}>
              <span className="type-label-lg font-aileron font-medium text-[#6273a1]">Rivet</span>
              <div className="flex flex-col gap-3">
                <a
                  href={RELEASES_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  Releases
                </a>
                <a
                  href={MCP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  MCP
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4" style={rise(170)}>
              <span className="type-label-lg font-aileron font-medium text-[#6273a1]">Community</span>
              <div className="flex flex-col gap-3">
                <a
                  href={X_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  Twitter
                </a>
                <a
                  href={LINKEDIN_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  LinkedIn
                </a>
                <a
                  href={INSTAGRAM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-aileron text-lg font-normal text-black transition-colors hover:text-black/70"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

       </div>
      </div>

      {/* Oversized multicolor wordmark at the bottom of the footer. The block
          spans full width to carry the paper texture, but is padded by the
          shared page gutter
          so the logo aligns to the same horizontal margin as the wordmark and
          content sections above. Two layers: the wordmark as a PNG
          (rivet-footer-wordmark.png, 3170x934 @2x) because its translucent
          overlapping letterforms come from foreignObject/backdrop-filter
          layers that an SVG loaded as an <img> never paints; and the heart as
          an SVG so it stays crisp and can be animated on its own. The box
          keeps the original composite's 3170x1514 ratio, which is what the
          heart's percentage placement is measured against.

          On mobile the block is pulled up ~80% of its own rendered height
          (height ≈ 90vw × 757/1585 ≈ 43vw, so -mt-[34vw]). The content block
          above reserves pb-[37vw] so this pull lands just below the links
          rather than overlapping them; reset to 0 from md up. */}
      <div
        className="page-gutter-x pointer-events-none relative -mt-[58vw] -mb-[3vw] md:-mt-28 md:-mb-8 lg:-mt-36 lg:-mb-12"
        style={rise(240)}
      >
        {/* The comb texture, edge to edge behind the mark. Absolute against
            this element's PADDING box, which is the already-bled full width —
            so it runs to the viewport edges while the mark stays inside the
            page gutter. Same 2.097 ratio as the mark, so the two register. */}
        <img
          src="/images/rivet-footer-bars.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 block w-full"
        />
        {/* pointer-events-auto only here: the wrapper above is
            pointer-events-none so the decoration can't swallow clicks, but the
            heart needs hover. Nothing sits behind it, so nothing is blocked. */}

        <div
          className="footer-mark pointer-events-auto relative z-10"
          style={{ aspectRatio: '3170 / 1514' }}
        >
          {/* The wordmark and the heart together, as the extruded 3D build
              from rivet-brand: ~50 stacked SVG slices under CSS 3D, with
              click/drag-to-spin. An iframe rather than a port because it is a
              self-contained document — no dependencies — and inlining 260KB of
              slice markup into the bundle would cost far more than it's worth
              for one decorative element. Its .footer box already carries the
              same 1585/757 ratio and the same 38.329%/61.671% wordmark
              placement this box was built around, so it maps 1:1. */}
          <iframe
            src="/demos/footer-heart.html"
            title=""
            aria-hidden="true"
            scrolling="no"
            className="absolute inset-0 block h-full w-full border-0"
          />
        </div>
      </div>
      </div>

      {/* Outside the panel's clip and above it, so they hang over its edges —
          the one thing that is NOT contained. */}
      {/* The placement transforms (and the mirror) live on the WRAPPER; the
          drift lives on the image. `rivet-float` animates `transform`, and a
          running CSS animation beats a class transform — put both on one
          element and the blob would snap to the viewport edge, unmirrored. */}
      {/* Opacity only, no translate: these wrappers carry their placement and
          mirror as class transforms, and an inline transform from rise() would
          overwrite both — the blob would snap to the edge, unmirrored. */}
      <div
        className="pointer-events-none absolute bottom-[10%] left-0 z-30 w-[7%] -translate-x-[6%] -scale-x-100"
        style={fade(360)}
      >
        <img
          src="/images/footer-blob-left.svg"
          alt=""
          draggable={false}
          className="rivet-float block w-full"
          // Offset from the right-hand cluster so the two never drift in step.
          style={{ animationDuration: '9s', animationDelay: '0.6s' }}
        />
      </div>
      <div
        className="pointer-events-none absolute right-0 top-[34%] z-30 w-[13%] translate-x-[4%]"
        style={fade(440)}
      >
        <img
          src="/images/footer-blob-right.svg"
          alt=""
          draggable={false}
          className="rivet-float block w-full"
          style={{ animationDuration: '7.5s', animationDelay: '1.4s' }}
        />
      </div>
      </div>
    </footer>
  );
};

export default Footer;
