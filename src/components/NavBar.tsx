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
              href="https://discord.gg/qccDTZDBgX"
              target="_blank"
              rel="noopener noreferrer"
              className="type-label flex cursor-pointer items-center gap-2 rounded-lg bg-green px-3 py-1.5 text-white transition-colors hover:bg-green-hover sm:border-2 sm:border-green sm:bg-transparent sm:text-green sm:hover:bg-green/10 sm:px-4 sm:py-2 sm:text-sm"
            >
              <img src="/images/discord-icon.svg" alt="Discord" width={20} height={20} className="h-5 w-5 brightness-0 invert sm:brightness-100 sm:invert-0" />
              <span className="hidden sm:inline">Join the community</span>
              <span className="sm:hidden">Community</span>
            </a>
            <DownloadButton className="type-label hidden cursor-pointer rounded-lg bg-green px-3 py-1.5 text-white transition-colors hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-50 sm:inline-block sm:px-4 sm:py-2 sm:text-sm">
              Download
            </DownloadButton>
          </div>
        </div>
      </LiquidGlassNav>
    </motion.nav>
  );
};

export default NavBar;
