import Logo from './Logo';

const X_LINK = 'https://x.com/designrivet';
const DISCORD_LINK = 'https://discord.gg/Eqn9Fcpuh4';
const DOCS_LINK = 'https://docs.rivet.design/';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full border-t py-6 sm:py-8">
      <div className="container mx-auto">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-start gap-3">
            <Logo />
            <span className="font-main text-xs text-content-subtle sm:text-sm">
              © 2026 Rivet, Inc.
            </span>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col items-start gap-2">
              <span className="font-main text-sm font-normal text-foreground">Rivet</span>
              <div className="flex flex-col gap-2.5">
                <a
                  href={DOCS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Documentation
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-main text-sm text-content-subtle transition-colors hover:text-foreground"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <span className="font-main text-sm font-normal text-foreground">Social</span>
              <div className="flex flex-col gap-2.5">
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

        <div className="mt-4 flex justify-start pt-4">
          <span className="inline-flex items-center gap-2 rounded-md bg-[#FFF0E6] px-4 py-1.5 font-main text-sm text-primary">
            <span className="leading-none">Made with</span>{' '}
            <span className="font-cta font-bold leading-none pt-[1px]">rivet</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
