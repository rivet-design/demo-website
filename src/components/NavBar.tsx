import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { surfaceBackground } from '../lib/background';

const NavBar = () => {
  // Experiment: keep the nav white throughout (isDark stays false).
  const [isDark] = useState(false);

  // The nav previously shrank its width on scroll. That behavior is removed —
  // the nav now stays a constant full-width pill, simply sticky at the top.

  // Slight elevation once the page is scrolled, so the stuck nav reads as a
  // layer floating over the content instead of blending into it. Lenis
  // animates native window scroll, so window.scrollY / the window scroll
  // event work as usual. A small threshold keeps the flat, seamless look
  // while the page is at (or within a hair of) the very top.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The nav previously switched to the dark theme while the #demo-panel
  // section was in view, via an IntersectionObserver that called
  // setIsDark(entry.isIntersecting). That observer is removed for this
  // experiment so the nav stays light; restore it to bring the dark switch
  // back.

  return (
    <motion.nav
      style={
        // Opaque fill so page content doesn't show through the sticky nav. The
        // nav is z-[70], so this paints above the scrolling page content while
        // the nav's own content paints above it. Paper texture or vanilla
        // white per the FE flag.
        isDark ? undefined : surfaceBackground
      }
      className={[
        // Full-bleed sticky bar pinned to the very top: bleed-page-gutter-x
        // breaks it out of the page gutters so it spans the full viewport width, and
        // top-0 leaves no gap above — so no scrolling content is ever visible
        // above or beside the nav.
        'bleed-page-gutter-x relative sticky top-0 z-[70] transition-[color,background-color,box-shadow] duration-200',
        isDark ? 'bg-accent-foreground text-white' : 'text-black',
        scrolled
          ? 'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_3px_10px_rgba(0,0,0,0.035)]'
          : 'shadow-none',
      ].join(' ')}
    >
      <div
        className="relative z-10 flex w-full items-center justify-between px-[calc(var(--page-gutter-x)+1rem)] py-1 lg:px-[calc(var(--page-gutter-x)+2rem)] min-[1920px]:px-[calc(var(--page-gutter-x)+1rem)]"
        style={{ height: 60 }}
      >
        <Logo />
        <div className="flex items-center gap-2 lg:gap-3">
          <a
            href="https://docs.rivet.design/"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors lg:inline-block lg:px-4 lg:py-2 lg:text-sm',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-black hover:text-black/60',
            ].join(' ')}
          >
            Docs
          </a>
          <a
            href="https://docs.rivet.design/releases"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'type-label hidden cursor-pointer rounded-lg px-3 py-1.5 transition-colors lg:inline-block lg:px-4 lg:py-2 lg:text-sm',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-black hover:text-black/60',
            ].join(' ')}
          >
            Release notes
          </a>
          <a
            href="https://x.com/designrivet"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'no-external-icon type-label flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors lg:hidden',
              isDark
                ? 'bg-white text-accent-foreground hover:text-accent-foreground/80'
                : 'bg-green text-white hover:text-white/60',
            ].join(' ')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Community
          </a>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
