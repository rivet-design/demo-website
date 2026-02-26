const X_LINK = 'https://x.com/designrivet';
const DISCORD_LINK = 'https://discord.gg/Eqn9Fcpuh4';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full border-t py-4 sm:py-5">
      <div className="container mx-auto">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-baseline gap-2 rounded-md bg-[#FFF0E6] px-4 py-2 font-main text-4xl text-primary">
              <span className="leading-none">Made with</span>{' '}
              <span className="font-cta font-bold leading-none">rivet</span>
            </span>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col items-start gap-1">
              <span className="font-main text-sm font-normal text-foreground">Rivet</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={DOCS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Docs
                </a>
                <a
                  href={RELEASES_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Releases
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1">
              <span className="font-main text-sm font-normal text-foreground">Social</span>
              <div className="flex flex-col gap-1.5">
                <a
                  href={DISCORD_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Discord
                </a>
                <a
                  href={X_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-start gap-2 pt-3">
          <span className="font-main text-xs text-content-subtle">
            © 2026 Rivet, Inc.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
