const X_LINK = 'https://x.com/designrivet';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const MCP_LINK = 'https://docs.rivet.design/mcp-guide';
const EMAIL = 'sam@tryrivet.design';

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="w-full">
      <div
        className="w-screen bg-accent-foreground pt-10 pb-12 sm:pt-12"
        style={{ marginLeft: 'calc(50% - 50vw)' }}
      >
       <div className="px-[5vw]">
        <div className="flex w-full flex-wrap items-start gap-x-16 gap-y-6">
          {/* "Made with rivet" wordmark and social icons on the left */}
          <div className="mt-8 flex flex-col items-start gap-8">
            <span className="flex items-baseline whitespace-nowrap text-white text-4xl sm:text-5xl leading-none">
              <span className="font-main">Made with&nbsp;</span>
              <img
                src="/images/rivet-wordmark-white.svg"
                alt="rivet"
                draggable={false}
                className="inline-block h-[0.72em] w-auto"
              />
            </span>
            <div className="ml-0.5 flex items-center gap-6">
              <a
                href={X_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="no-external-icon flex items-center text-white/60 transition-colors hover:text-white"
              >
                <TwitterIcon />
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center text-white/60 transition-colors hover:text-white"
              >
                <EmailIcon />
              </a>
            </div>
          </div>

          {/* Spacer to push columns to the right */}
          <div className="flex-1" />

          {/* Link columns - right aligned, each left-aligned internally */}
          <div className="mt-8 flex flex-wrap gap-x-16 gap-y-6">
            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-normal text-white">Rivet</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={DOCS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Docs
                </a>
                <a
                  href={RELEASES_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Releases
                </a>
                <a
                  href={MCP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  MCP
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-normal text-white">Community</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={X_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Twitter
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <span className="type-label-lg font-normal text-white">Legal</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href="/terms"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="font-main text-base text-white/60 transition-colors hover:text-white"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 mb-8 flex flex-col items-start gap-2">
          <span className="font-main text-sm text-white/50">
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
