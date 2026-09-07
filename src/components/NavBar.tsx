import { useState, type CSSProperties } from 'react';
import { motion, type MotionValue } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import Logo from './Logo';
import PromptInstallButton from './PromptInstallButton';
import { surfaceBackground, withAlpha } from '../lib/background';

// How much of the ground shows through the frosted bar.
const FROSTED_ALPHA = 0.62;
// Only reached when `fill` carries an image instead of a colour.
const FALLBACK_FILL = '#fafafa';

// Temporarily off while the About page is rebuilt (see the about-page-rebuild
// branch); flip back on when it merges. Hides the link in the desktop nav, the
// mobile overflow menu, and the footer's Rivet column — the /about route
// itself keeps working.
export const SHOW_ABOUT_LINK = false;

const NavBar = ({
  motionOpacity,
  motionX,
  motionY,
  motionScale,
  motionRadius,
  rootRef,
  frosted = false,
  fill = surfaceBackground,
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
  /**
   * The ground this nav sits on. Defaults to the tan site fill — the hero.
   * Pages whose ground is something else pass it, or the bar comes out a
   * different colour from the page directly under it.
   */
  fill?: CSSProperties;
} = {}) => {
  // Experiment: keep the nav white throughout (isDark stays false).
  const [isDark] = useState(false);

  // Mobile overflow menu (the page links, behind the top-right icon button).
  // Controlled only so the menu rows can close it on click — the outside-click
  // and positioning plumbing lives in the shared Popover, not here.
  const [menuOpen, setMenuOpen] = useState(false);

  // The nav previously shrank its width on scroll. That behavior is removed —
  // the nav now stays a constant full-width pill, simply sticky at the top.

  // The nav used to gain a drop shadow once scrolled (a `scrolled` flag fed
  // by a window scroll listener). Both are removed — the bar stays flat.

  // The nav previously switched to the dark theme while the #demo-panel
  // section was in view, via an IntersectionObserver that called
  // setIsDark(entry.isIntersecting). That observer is removed for this
  // experiment so the nav stays light; restore it to bring the dark switch
  // back.

  // The frosted tint needs the colour on its own; `fill` may also carry a
  // background-image (the paper-texture flag), which can't be made
  // translucent this way.
  const fillColor =
    typeof fill.backgroundColor === 'string' ? fill.backgroundColor : FALLBACK_FILL;

  return (
    <motion.nav
      ref={rootRef}
      style={{
        // Filled with the ground the bar actually SITS ON, so it is opaque —
        // nothing scrolls through a fixed nav — while still reading as the
        // same surface as the page rather than a strip laid over it. Which
        // ground that is depends on the page: the tan hero card here, the
        // #fafafa page ground on the blog pages, so the caller passes it.
        // `transparent` hands the fill to the caller — used by the page-level
        // nav during the pinned sequence, where the surface behind it is the
        // stage's #fafafa rather than the site fill.
        ...(isDark || frosted ? undefined : fill),
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
          // Same colour as the ground, just translucent — the tint follows
          // `fill` rather than being its own hardcoded near-white, so a
          // frosted bar over a tan surface is tinted tan.
          style={{ backgroundColor: withAlpha(fillColor, FROSTED_ALPHA) }}
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
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-6">
          {SHOW_ABOUT_LINK && (
            <a
              href="/about"
              className={[
                // Identical to Docs and Release notes — same type, same padding,
                // same colour. It was `type-label`/text-sm in black, which made
                // it read as a different kind of item and, because the padding
                // differed, sat at an uneven distance from its neighbours.
                'hidden cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors md:inline-block lg:px-4 lg:py-2',
                isDark
                  ? 'text-white hover:text-white/60'
                  : 'text-[#642e39] hover:text-[#642e39]/60',
              ].join(' ')}
            >
              About
            </a>
          )}
          <a
            href="https://docs.rivet.design/"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'hidden cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors md:inline-block lg:px-4 lg:py-2',
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
              'hidden cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] transition-colors md:inline-block lg:px-4 lg:py-2',
              isDark
                ? 'text-white hover:text-white/60'
                : 'text-[#642e39] hover:text-[#642e39]/60',
            ].join(' ')}
          >
            Release notes
          </a>
          {/* On phones the nav's action slot belongs to the community, not the
              install flow. SECONDARY treatment (the hero's "Watch demo"
              outline), not the orange primary — an orange pill up here fought
              the hero's own primary CTA right below it. The three page links
              tuck into the overflow menu beside it. md is the ONLY swap point
              for all of it. */}
          <a
            href="https://x.com/designrivet"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'no-external-icon type-label-lg flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border-[0.5px] px-[16px] py-[8px] text-sm font-normal transition-colors md:hidden',
              isDark
                ? 'border-white/70 text-white hover:bg-white/10'
                : 'border-[#642e39] text-[#642e39] hover:bg-[#642e39]/5',
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
          {/* Overflow menu: the page links, behind an icon button at the far
              right. A dropdown rather than a drawer — three items don't earn a
              full-screen takeover. The shared Popover owns dismissal and
              positioning; this component only decides what's inside. */}
          <Popover className="md:hidden" open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
              className={[
                'flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg transition-colors',
                isDark
                  ? 'text-white hover:bg-white/10'
                  : 'text-[#642e39] hover:bg-[#642e39]/10',
              ].join(' ')}
            >
              <span className="sr-only">Menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="min-w-[180px] rounded-xl border border-black/10 bg-white p-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]"
            >
              {[
                ...(SHOW_ABOUT_LINK ? [{ label: 'About', href: '/about' }] : []),
                { label: 'Docs', href: 'https://docs.rivet.design/' },
                {
                  label: 'Release notes',
                  href: 'https://docs.rivet.design/releases',
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  {...(item.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : null)}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-aileron text-base leading-[1.164] tracking-[-0.16px] text-[#642e39] transition-colors hover:bg-[#642e39]/5"
                >
                  {item.label}
                </a>
              ))}
            </PopoverContent>
          </Popover>
          <div className="hidden md:block">
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
