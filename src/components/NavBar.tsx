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
        'sticky top-4 z-50 mx-auto overflow-hidden rounded-lg border transition-colors duration-150',
        isDark
          ? 'border-green bg-green text-white'
          : 'border-green/[0.08] bg-[#FAF9F7] text-green',
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
              'no-external-icon type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark ? 'text-white hover:text-white/60' : 'text-green hover:text-green/60',
            ].join(' ')}
          >
            Releases
          </a>
          <a
            href="https://docs.rivet.design/mcp-guide"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'no-external-icon type-label hidden cursor-pointer rounded-lg px-2 py-1.5 transition-colors md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark ? 'text-white hover:text-white/60' : 'text-green hover:text-green/60',
            ].join(' ')}
          >
            MCP
          </a>
          <a
            href="https://discord.gg/Eqn9Fcpuh4"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'no-external-icon type-label flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors md:px-4 md:py-2 md:text-sm',
              isDark
                ? 'bg-white text-green hover:text-green/80 md:bg-transparent md:text-white md:hover:text-white/60'
                : 'bg-primary text-white hover:bg-primary-hover md:bg-transparent md:text-green md:hover:text-green/60',
            ].join(' ')}
          >
            Community
          </a>
          <DownloadButton
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:inline-block md:px-4 md:py-2 md:text-sm',
              isDark
                ? 'bg-white text-green hover:bg-white/80'
                : 'bg-green text-white hover:bg-green-hover',
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
