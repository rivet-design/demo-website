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
        'sticky top-4 z-50 mx-auto rounded-lg border transition-colors duration-150',
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
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://docs.rivet.design/releases"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label cursor-pointer rounded-lg px-3 py-1.5 transition-colors sm:px-4 sm:py-2 sm:text-sm',
              isDark ? 'text-white hover:text-white/60' : 'text-black hover:text-black/50',
            ].join(' ')}
          >
            Releases
          </a>
          <a
            href="https://discord.gg/Eqn9Fcpuh4"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors sm:px-4 sm:py-2 sm:text-sm',
              isDark
                ? 'bg-white text-accent-foreground hover:text-accent-foreground/80 sm:bg-transparent sm:text-white sm:hover:text-white/60'
                : 'bg-green text-white hover:text-white/60 sm:bg-transparent sm:text-black sm:hover:text-black/50',
            ].join(' ')}
          >
            Community
          </a>
          <DownloadButton
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:inline-block sm:px-4 sm:py-2 sm:text-sm',
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
