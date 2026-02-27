const X_LINK = 'https://x.com/designrivet';
const DISCORD_LINK = 'https://discord.gg/Eqn9Fcpuh4';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full border-t pt-4 sm:pt-5">
      <div className="w-full">
        <div className="flex w-full justify-between">
          <div className="flex flex-col items-start gap-1">
            <span className="font-main text-base font-normal text-foreground">Rivet</span>
            <div className="flex flex-col gap-1.5">
              <a
                href={DOCS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-main text-base text-content-subtle transition-colors hover:text-foreground"
              >
                Docs
              </a>
              <a
                href={RELEASES_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-main text-base text-content-subtle transition-colors hover:text-foreground"
              >
                Releases
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="font-main text-base text-content-subtle transition-colors hover:text-foreground"
              >
                Email
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="font-main text-base font-normal text-foreground">Social</span>
            <div className="flex flex-col gap-1.5">
              <a
                href={DISCORD_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-main text-base text-content-subtle transition-colors hover:text-foreground"
              >
                Discord
              </a>
              <a
                href={X_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-main text-base text-content-subtle transition-colors hover:text-foreground"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col items-start gap-2 pt-3">
          <span className="font-main text-sm text-content-subtle">
            © 2026 Rivet, Inc.
          </span>
        </div>
      </div>

      <div className="mt-6 w-screen overflow-hidden bg-[#FFF0E6] pt-6" style={{ marginLeft: 'calc(50% - 50vw)' }}>
        <span
          className="flex w-full items-baseline justify-center whitespace-nowrap text-primary"
          style={{ fontSize: '11vw', lineHeight: 1.1 }}
        >
          <span className="font-main">Made with&nbsp;</span>
          <span className="font-cta font-bold">rivet</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
