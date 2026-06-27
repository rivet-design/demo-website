import { footerBackground } from '../lib/background';

const X_LINK = 'https://x.com/designrivet';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const MCP_LINK = 'https://docs.rivet.design/mcp-guide';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full">
      {/* On mobile the links sit higher (smaller pt) and the block reserves a
          deep bottom padding (pb-[20vw]) so the multicolor logo — pulled up
          ~18vw below — clears the link text instead of overlapping it. Desktop
          keeps the original pt-14 / pb-10. */}
      <div
        className="w-screen border-t border-border pt-8 pb-[20vw] md:pt-14 md:pb-10"
        style={{ marginLeft: 'calc(50% - 50vw)', ...footerBackground }}
      >
       <div className="px-[5vw]">
        <div className="flex w-full flex-wrap items-start gap-x-20 gap-y-8">
          {/* Rivet logo on the left, with the copyright directly beneath it */}
          <div className="flex flex-col items-start gap-4">
            <img
              src="/images/rivet-logo.png"
              alt="Rivet"
              draggable={false}
              className="inline-block h-11 sm:h-12 w-auto rounded-xl"
            />
            <span className="font-main text-base font-medium text-black/70">
              © 2026 Rivet, Inc.
            </span>
          </div>

          {/* Spacer to push columns to the right */}
          <div className="flex-1" />

          {/* Link columns - right aligned, each left-aligned internally */}
          <div className="flex flex-wrap gap-x-20 gap-y-8">
            <div className="flex flex-col items-start gap-4">
              <span className="type-label-lg font-semibold text-accent-foreground">Rivet</span>
              <div className="flex flex-col gap-3">
                <a
                  href={DOCS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Docs
                </a>
                <a
                  href={RELEASES_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Releases
                </a>
                <a
                  href={MCP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  MCP
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <span className="type-label-lg font-semibold text-accent-foreground">Community</span>
              <div className="flex flex-col gap-3">
                <a
                  href={X_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Twitter
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <span className="type-label-lg font-semibold text-accent-foreground">Legal</span>
              <div className="flex flex-col gap-3">
                <a
                  href="/terms"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="font-main text-lg font-medium text-black/80 transition-colors hover:text-black"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>

       </div>
      </div>

      {/* Oversized multicolor wordmark at the bottom of the footer. The block
          spans full width to carry the paper texture, but is padded by px-[5vw]
          so the logo aligns to the same horizontal margin as the wordmark and
          content sections above. The full asset (rivet-multicolor.svg, viewBox
          "0 0 1884 797") is rendered at the padded content width; the inner
          wrapper is shorter than the rendered logo (aspect-ratio 1884 / 478 ≈
          top 60%) with overflow hidden — so the top ~60% shows and the bottom
          ~40% (the lower half of the wordmark) is clipped off below the page edge.

          On mobile the logo block is pulled up ~80% of its own rendered height
          (-mt-[18vw]; height ≈ 90vw × 478/1884 ≈ 22.8vw). The content block
          above reserves pb-[20vw] so this pull lands just below the links rather
          than overlapping them; reset to 0 from md up. */}
      <div
        className="w-screen px-[5vw] -mt-[18vw] md:mt-0"
        style={{ marginLeft: 'calc(50% - 50vw)', ...footerBackground }}
      >
        {/* object-cover + object-top crops the bottom while anchoring the top
            (the hand-drawn dot over the "i"). This is independent of the SVG's
            intrinsic size, which WebKit/iOS Safari resolves differently from
            Chromium (mixed fixed + 100% dims) — without it, Safari could clip
            the top and drop the dot. */}
        <div className="overflow-hidden" style={{ aspectRatio: '1884 / 478' }}>
          <img
            src="/images/rivet-multicolor.svg"
            alt="rivet"
            draggable={false}
            className="block h-full w-full object-cover object-top mix-blend-multiply"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
