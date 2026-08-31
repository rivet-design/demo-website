import { useState } from 'react';
import { motion, type MotionValue } from 'motion/react';
import Logo from './Logo';
import PromptInstallButton from './PromptInstallButton';
import { surfaceBackground } from '../lib/background';

const NavBar = ({
  motionOpacity,
  motionX,
  motionY,
  motionScale,
  motionRadius,
  rootRef,
  frosted = false,
}: {
  /**
   * Optional scroll-driven motion values — used by the hero's shrink
   * sequence so the nav visually shrinks/moves/rounds IN SYNC with the hero
   * card (the "entire page shrinks", not just the headline block), then
   * unwinds back to normal as the demo falls into place. All applied
   * directly on this component's own root (not a wrapping element) so its
   * `position: sticky` keeps working — a `transform` on an ANCESTOR of a
   * sticky element breaks sticky behavior; a transform on the sticky
   * element itself just visually offsets/scales it in place.
   */
  motionOpacity?: MotionValue<number>;
  motionX?: MotionValue<number>;
  motionY?: MotionValue<number>;
  motionScale?: MotionValue<number>;
  motionRadius?: MotionValue<number>;
  /** Ref callback for the root nav element — lets a parent measure it (e.g.
   * to compute its own shrink-FLIP geometry toward the same landing target
   * the hero card uses). */
  rootRef?: (el: HTMLElement | null) => void;
  /**
   * Frosted glass: the page behind the bar is blurred through a translucent
   * fill. A plain rectangle — the blur covers the bar's own height and stops
   * at its edge, with no feathered lip and no mask.
   */
  frosted?: boolean;
} = {}) => {
  // Experiment: keep the nav white throughout (isDark stays false).
  const [isDark] = useState(false);

  // The nav previously shrank its width on scroll. That behavior is removed —
  // the nav now stays a constant full-width pill, simply sticky at the top.

  // The nav used to gain a drop shadow once scrolled (a `scrolled` flag fed
  // by a window scroll listener). Both are removed — the bar stays flat.

  // The nav previously switched to the dark theme while the #demo-panel
  // section was in view, via an IntersectionObserver that called
  // setIsDark(entry.isIntersecting). That observer is removed for this
  // experiment so the nav stays light; restore it to bring the dark switch
  // back.

  return (
    <motion.nav
      ref={rootRef}
      style={{
        // Filled with the SITE background itself (surfaceBackground and
        // pageBackground both resolve to #F1EFE8), so the bar is opaque —
        // nothing scrolls through a fixed nav — while still reading as the
        // same surface as the page rather than a separate strip laid over it.
        // `transparent` hands the fill to the caller — used by the page-level
        // nav during the pinned sequence, where the surface behind it is the
        // stage's #fafafa rather than the site fill.
        ...(isDark || frosted ? undefined : surfaceBackground),
        ...(motionOpacity ? { opacity: motionOpacity } : undefined),
        ...(motionX ? { x: motionX } : undefined),
        ...(motionY ? { y: motionY } : undefined),
        ...(motionScale ? { scale: motionScale } : undefined),
        ...(motionRadius ? { borderRadius: motionRadius } : undefined),
      }}
      className={[
        // Full-bleed sticky bar pinned to the very top: bleed-page-gutter-x
        // breaks it out of the page gutters so it spans the full viewport width, and
        // top-0 leaves no gap above — so no scrolling content is ever visible
        // above or beside the nav.
        'bleed-page-gutter-x relative sticky top-0 z-[70] mb-6 shrink-0 transition-[color,background-color,box-shadow] duration-200',
        isDark ? 'bg-accent-foreground text-white' : 'text-black',
        // Flat at all times — the scrolled-state drop shadow is deliberately
        // off (it read as a seam across the shrinking page card).
        'shadow-none',
      ].join(' ')}
    >
      {/* Sits behind the row (which is z-10) and exactly covers the bar. The
          tint has to be translucent or there is nothing for the backdrop
          filter to show through. */}
      {frosted && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 backdrop-blur-lg backdrop-saturate-150"
          style={{ backgroundColor: 'rgba(250, 250, 250, 0.62)' }}
        />
      )}
      <div
        // Generous, symmetric breathing room on all four sides: the bar's own
        // height carries the vertical margin (there's no fixed height any
        // more — py sets it), and the horizontal padding steps up with the
        // viewport so the logo/links never crowd the screen edges.
        // Horizontal inset matches the footer panel's white margin
        // (--frame-inset-x), so the nav's wordmark sits on the same line as
        // the panel's edge rather than on its own separate margin.
        style={{
          paddingLeft: 'var(--frame-inset-x)',
          paddingRight: 'var(--frame-inset-x)',
        }}
        className="relative z-10 flex w-full items-center justify-between py-5"
      >
        <Logo />
        <div className="flex items-center gap-2 lg:gap-6">
          <a
            href="/about"
            className={[
              // Identical to Docs and Release notes — same type, same padding,
              // same colour. It was `type-label`/text-sm in black, which made
              // it read as a different kind of item and, because the padding
              // differed, sat at an uneven distance from its neighbours.
              'hidden cursor-pointer rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors lg:inline-block lg:px-4 lg:py-2',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-[#642e39] hover:text-[#642e39]/60',
            ].join(' ')}
          >
            About
          </a>
          <a
            href="https://docs.rivet.design/"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'hidden cursor-pointer rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors lg:inline-block lg:px-4 lg:py-2',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-[#642e39] hover:text-[#642e39]/60',
            ].join(' ')}
          >
            Docs
          </a>
          <a
            href="https://docs.rivet.design/releases"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'hidden cursor-pointer rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors lg:inline-block lg:px-4 lg:py-2',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-[#642e39] hover:text-[#642e39]/60',
            ].join(' ')}
          >
            Release notes
          </a>
          <a
            href="https://x.com/designrivet"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              // Plain coloured link, matching the desktop nav's treatment —
              // no background pill.
              'no-external-icon type-label flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors lg:hidden',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-[#ec4423] hover:text-[#ec4423]/60',
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
          <div className="hidden lg:block">
            <PromptInstallButton
              tone={isDark ? 'light' : 'orange'}
              label="Install Rivet"
            />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
