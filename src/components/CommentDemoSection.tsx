import { memo, useState } from 'react';
import { telemetry } from '@/lib/telemetry';
import CommentDemoShell from './commentsDemo/CommentDemoShell';
import BrowserFrame from './BrowserFrame';

const REQUEST_TEXT = 'Try a simpler layout';

/**
 * Workflow panel: "Explore with precision."
 *
 * Mirrors the hero: inside the browser shell, a live gallery preview sits on the
 * LEFT and a Directions list on the RIGHT. A scripted drag leaves the comment
 * "Try a simpler layout", layout directions generate on the right, and
 * selecting one restyles the gallery on the left. The "Explore with precision"
 * copy stays beside the shell (the section keeps its two-column grid).
 */
const CommentDemoSection = () => {
  // Both the mobile and desktop shells are mounted at once (CSS shows one,
  // hides the other), so gate playback per-breakpoint: only the on-screen shell
  // runs the scripted cursor; the hidden one renders its resolved state. With
  // reduced motion neither plays. Measured once at mount — same as the hero.
  const [{ playDesktop, playMobile }] = useState(() => {
    if (typeof window === 'undefined')
      return { playDesktop: false, playMobile: false };
    const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    return { playDesktop: motionOK && desktop, playMobile: motionOK && !desktop };
  });

  const handleDraftCreated = () => {
    telemetry.trackCommentDemoDraftCreated({ source: 'drag', hasDragBox: true });
  };
  const handleCommentCreated = () => {
    telemetry.trackCommentDemoCommentCreated({
      commentId: 'scripted-fluid-layouts',
      instructionLength: REQUEST_TEXT.length,
      hasDragBox: true,
    });
  };

  return (
    <div className="relative flex w-full justify-center px-[5vw] py-12 md:py-16">
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[2.5fr_1fr] lg:gap-16">
        {/* DOM order is panel-then-text so that at lg+ the panel sits in the
            first (2.5fr) column on the left. On stacked mobile/tablet we want
            the title above the panel, so flip with `order-` classes below. */}
        <div className="order-2 w-full lg:order-1">
          {/* Mobile: the same scripted drag/comment/vary shell, but in its
              single-pane mobile layout — no directions panel; the gallery itself
              reflows into the two-column layout when the comment is varied. A
              taller (portrait) box leverages the vertical real estate to show
              more of the masonry grid. */}
          <div
            data-guide-row
            className="aspect-panel-portrait block w-full overflow-visible bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 md:hidden"
            style={{ backgroundImage: "url('/images/bg3.webp')" }}
          >
            <BrowserFrame url="localhost:3000" className="h-full w-full">
              <CommentDemoShell
                mobile
                play={playMobile}
                onDraftCreated={handleDraftCreated}
                onCommentCreated={handleCommentCreated}
              />
            </BrowserFrame>
          </div>

          {/* Desktop: the scripted two-pane shell (gallery + directions) inside a
              browser window, over the same multicolor backdrop as the agent
              panel. Same w-full + 16/11 box as the other workflow panels so all
              three match in size; the frame and shell fill it (h-full). */}
          <div
            data-guide-row
            className="hidden w-full overflow-hidden bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 md:block md:p-8"
            style={{
              backgroundImage: "url('/images/bg3.webp')",
              aspectRatio: '16 / 11',
            }}
          >
            <BrowserFrame url="localhost:3000" draggable className="h-full w-full">
              <CommentDemoShell
                play={playDesktop}
                onDraftCreated={handleDraftCreated}
                onCommentCreated={handleCommentCreated}
              />
            </BrowserFrame>
          </div>
        </div>

        {/* Copy is the outer (right) column at lg; lg:pr-8 keeps it off the
            page's right guide rule (consistent across all workflow panels). */}
        <div className="order-1 max-w-[440px] lg:order-2 lg:pr-8">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Explore with precision.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Comment on any part of your interface and Rivet explores focused
            design directions for just that region.
          </p>
        </div>
      </div>
    </div>
  );
};

// Memoized: takes no props, so App re-renders don't cascade into it.
export default memo(CommentDemoSection);
