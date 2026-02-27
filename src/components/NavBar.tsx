import { motion, useScroll, useTransform } from 'motion/react';
import DownloadButton from './DownloadButton';

const NavBar = () => {
  const { scrollYProgress, scrollY } = useScroll();
  
  // Transform values for scroll-activated effects
  const navScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  const navWidth = useTransform(scrollY, [0, 300], ['100%', '92%']);
  const navBlur = useTransform(scrollY, [0, 100], ['backdrop-blur-xl', 'backdrop-blur-3xl']);
  const navBgOpacity = useTransform(scrollY, [0, 100], ['bg-white/50', 'bg-white/70']);

  return (
    <motion.nav
      style={{ width: navWidth, scale: navScale }}
      className="sticky top-6 z-50 mx-auto transition-all duration-300"
    >
      <motion.div 
        style={{ 
          backdropFilter: navBlur,
          backgroundColor: navBgOpacity
        }}
        className={`relative flex w-full items-center justify-between rounded-2xl border border-rivet-dark/10 px-6 py-4 shadow-xl shadow-rivet-dark/5 overflow-hidden`}
      >
        {/* Scroll Progress Bar */}
        <motion.div 
          className="absolute bottom-0 left-0 h-[2px] bg-primary z-50"
          style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
        />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
          <span className="font-sans font-bold text-xl tracking-tighter uppercase">Rivet</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="https://discord.gg/Eqn9Fcpuh4"
            target="_blank"
            rel="noopener noreferrer"
            className="type-label flex items-center gap-2 rounded-lg px-4 py-2 text-rivet-dark/60 transition-colors hover:text-primary"
          >
            <span className="hidden sm:inline">Community</span>
            <span className="sm:hidden">Discord</span>
          </a>
          <DownloadButton className="type-label-lg rounded-lg bg-rivet-dark px-5 py-2.5 text-white transition-all hover:bg-rivet-dark-hover active:scale-95 shadow-sm">
            Download
          </DownloadButton>
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default NavBar;
