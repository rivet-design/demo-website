import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import Logo from './Logo';
import DownloadButton from './DownloadButton';

const NavBar = () => {
  const navRef = useRef<HTMLElement>(null);
  const [isDark, setIsDark] = useState(false);

  const { scrollY } = useScroll();
  const navWidth = useTransform(scrollY, [100, 300], ['100%', '80%']);

  useEffect(() => {
    const panel = document.getElementById('demo-panel');
    if (!panel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsDark(entry.isIntersecting);
      },
      {
        rootMargin: '0px 0px -90% 0px',
        threshold: 0,
      }
    );

    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.nav
      ref={navRef}
      style={{ width: navWidth }}
      className={[
        'sticky top-4 z-[70] mx-auto overflow-hidden rounded-lg border transition-colors duration-150',
        isDark
          ? 'border-accent-foreground bg-accent-foreground text-white'
          : 'border-border bg-main text-black',
      ].join(' ')}
    >
      <div
        className="flex w-full items-center justify-between px-4 py-1"
        style={{ height: 78 }}
      >
        <Logo />
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="https://docs.rivet.design/releases"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark ? 'text-white hover:text-white/60' : 'text-black hover:text-black/60',
            ].join(' ')}
          >
            Releases
          </a>
          <a
            href="https://docs.rivet.design/mcp-guide"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label hidden cursor-pointer rounded-lg px-2 py-1.5 transition-colors md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark ? 'text-white hover:text-white/60' : 'text-black hover:text-black/60',
            ].join(' ')}
          >
            MCP
          </a>
          <a
            href="https://x.com/designrivet"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'no-external-icon type-label flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors md:hidden',
              isDark
                ? 'bg-white text-accent-foreground hover:text-accent-foreground/80'
                : 'bg-green text-white hover:text-white/60',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Community
          </a>
          <DownloadButton
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark
                ? 'bg-white text-accent-foreground hover:bg-white/80'
                : 'bg-accent-foreground text-white hover:bg-[hsl(0_0%_20%)]',
            ].join(' ')}
          >
            Download
          </DownloadButton>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
