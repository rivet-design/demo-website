import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { getCalApi } from '@calcom/embed-react';
import Logo from './Logo';
import DownloadButton from './DownloadButton';
import { LiquidGlassNav } from './LiquidGlassNav';

const NavBar = () => {
  const { scrollY } = useScroll();
  const navWidth = useTransform(scrollY, [100, 300], ['100%', '80%']);

  /**
   * @effect Initializes the Cal.com embed API for booking popup
   * @deps None - runs once on mount
   */
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: 'talk-about-rivet' });
      cal('ui', {
        cssVarsPerTheme: {
          light: { 'cal-brand': '#1F2015' },
          dark: { 'cal-brand': '#1F2015' },
        },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
  }, []);

  return (
    <motion.nav
      style={{ width: navWidth }}
      className="sticky top-4 z-50 mx-auto"
    >
      <LiquidGlassNav className="rounded-lg border">
        <div
          className="flex w-full items-center justify-between px-4 py-1"
          style={{ height: 78 }}
        >
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              data-cal-namespace="talk-about-rivet"
              data-cal-link="samjgorman/talk-about-rivet"
              data-cal-config='{"layout":"month_view"}'
              className="type-label hidden cursor-pointer rounded-lg border-2 border-green bg-transparent px-3 py-1.5 text-green transition-colors hover:bg-green/10 sm:block sm:px-4 sm:py-2 sm:text-sm"
            >
              Book a call
            </button>
            <DownloadButton className="type-label cursor-pointer rounded-lg bg-green px-3 py-1.5 text-white transition-colors hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm">
              Download
            </DownloadButton>
          </div>
        </div>
      </LiquidGlassNav>
    </motion.nav>
  );
};

export default NavBar;
