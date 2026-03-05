import { motion, useScroll, useTransform } from 'motion/react';
import Logo from './Logo';
import DownloadButton from './DownloadButton';
import { LiquidGlassNav } from './LiquidGlassNav';

const NavBar = () => {
  const { scrollY } = useScroll();
  const navWidth = useTransform(scrollY, [100, 300], ['100%', '80%']);

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
            <a
              href="https://docs.rivet.design/"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label cursor-pointer rounded-lg px-3 py-1.5 text-black transition-colors hover:text-black/50 sm:px-4 sm:py-2 sm:text-sm"
            >
              Docs
            </a>
            <a
              href="https://discord.gg/Eqn9Fcpuh4"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label flex cursor-pointer items-center gap-2 rounded-lg bg-green px-3 py-1.5 text-white transition-colors hover:text-white/60 sm:bg-transparent sm:text-black sm:hover:text-black/50 sm:px-4 sm:py-2 sm:text-sm"
            >
              Community
            </a>
            <DownloadButton className="type-label hidden cursor-pointer rounded-lg bg-accent-foreground px-3 py-1.5 text-white transition-colors hover:bg-[hsl(0_0%_20%)] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-block sm:px-4 sm:py-2 sm:text-sm">
              Download
            </DownloadButton>
          </div>
        </div>
      </LiquidGlassNav>
    </motion.nav>
  );
};

export default NavBar;
