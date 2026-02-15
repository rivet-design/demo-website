import { Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';

const X_LINK = 'https://x.com/designrivet';
const LINKEDIN_LINK = 'https://www.linkedin.com/company/rivetdesign';
const EMAIL = 'sam@tryrivet.design';
const YC_LINK = 'https://www.ycombinator.com/companies/rivet-design';

const Footer = () => {
  return (
    <footer className="w-full border-t py-6 sm:py-8">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Logo />
            <span className="font-main text-xs text-content-subtle sm:text-sm">
              © 2026 Rivet, Inc.
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={YC_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center text-content-subtle transition-all hover:bg-secondary hover:text-foreground sm:h-10 sm:w-10"
              aria-label="Y Combinator"
            >
              <span className="font-main text-lg font-bold sm:text-xl">Y</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="flex h-9 w-9 items-center justify-center text-content-subtle transition-all hover:bg-secondary hover:text-foreground sm:h-10 sm:w-10"
              aria-label="Email"
            >
              <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <a
              href={LINKEDIN_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center text-content-subtle transition-all hover:bg-secondary hover:text-foreground sm:h-10 sm:w-10"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <a
              href={X_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center text-content-subtle transition-all hover:bg-secondary hover:text-foreground sm:h-10 sm:w-10"
              aria-label="X (Twitter)"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-4 flex justify-center pt-4 md:justify-start">
          <span className="inline-flex items-center gap-2 rounded-md bg-[#FFF0E6] px-4 py-1.5 font-main text-sm text-primary">
            <span className="leading-none">Made with</span>{' '}
            <span className="font-cta font-bold leading-none">rivet</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
