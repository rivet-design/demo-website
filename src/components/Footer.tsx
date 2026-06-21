const X_LINK = 'https://x.com/designrivet';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const MCP_LINK = 'https://docs.rivet.design/mcp-guide';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full">
      <div
        className="w-screen border-t border-border bg-white pt-14 pb-10"
        style={{ marginLeft: 'calc(50% - 50vw)' }}
      >
       <div className="px-[5vw]">
        <div className="flex w-full flex-wrap items-start gap-x-16 gap-y-6">
          {/* Rivet logo on the left */}
          <div className="flex flex-col items-start">
            <img
              src="/images/rivet-logo.png"
              alt="Rivet"
              draggable={false}
              className="inline-block h-11 sm:h-12 w-auto rounded-xl"
            />
          </div>

          {/* Spacer to push columns to the right */}
          <div className="flex-1" />

          {/* Link columns - right aligned, each left-aligned internally */}
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-semibold text-accent-foreground">Rivet</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={DOCS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Docs
                </a>
                <a
                  href={RELEASES_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Releases
                </a>
                <a
                  href={MCP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  MCP
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-semibold text-accent-foreground">Community</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={X_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Twitter
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-semibold text-accent-foreground">Legal</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href="/terms"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="font-main text-base font-medium text-black/80 transition-colors hover:text-black"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-2">
          <span className="font-main text-sm font-medium text-black/70">
            © 2026 Rivet, Inc.
          </span>
        </div>
       </div>
      </div>

      {/* Temporarily hidden — restore when desired */}
      {/* <div className="w-screen overflow-hidden bg-[#FFF0E6] pt-6" style={{ marginLeft: 'calc(50% - 50vw)' }}>
        <span
          className="flex w-full items-baseline justify-center whitespace-nowrap text-primary"
          style={{ fontSize: '11vw', lineHeight: 1.1 }}
        >
          <span className="font-main">Made with&nbsp;</span>
          <img
            src="/images/rivet-wordmark-orange.svg"
            alt="rivet"
            draggable={false}
            className="inline-block h-[0.72em] w-auto"
          />
        </span>
      </div> */}
    </footer>
  );
};

export default Footer;
