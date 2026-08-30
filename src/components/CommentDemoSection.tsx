import { memo, useState } from 'react';
import { telemetry } from '@/lib/telemetry';
import CommentDemoShell from './commentsDemo/CommentDemoShell';
import BrowserFrame from './BrowserFrame';
import ReplayButton from './ReplayButton';

const REQUEST_TEXT = 'Try simpler layouts';

/**
 * Workflow panel: "Explore with precision."
 *
 * Mirrors the hero: inside the browser shell, a live gallery preview sits on the
 * LEFT and a Directions list on the RIGHT. A scripted drag leaves the comment
 * "Try simpler layouts", layout directions generate on the right, and
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
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    return {
      playDesktop: motionOK && desktop,
      playMobile: motionOK && !desktop,
    };
  });

  // Replay support: bumping a run id remounts that breakpoint's shell, which
  // restarts the scripted drag/comment/vary sequence. An explicit replay also
  // forces play=true — the user asked for the animation, so it runs even if
  // the initial mount skipped playback (e.g. reduced motion or the other
  // breakpoint was active at load).
  const [desktopRun, setDesktopRun] = useState(0);
  const [mobileRun, setMobileRun] = useState(0);

  const handleDraftCreated = () => {
    telemetry.trackCommentDemoDraftCreated({
      source: 'drag',
      hasDragBox: true,
    });
  };
  const handleCommentCreated = () => {
    telemetry.trackCommentDemoCommentCreated({
      commentId: 'scripted-fluid-layouts',
      instructionLength: REQUEST_TEXT.length,
      hasDragBox: true,
    });
  };

  return (
    <div className="page-gutter-x relative flex w-full justify-center py-8 lg:py-16">
      <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[2.5fr_1fr]">
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
            className="relative block aspect-panel-portrait w-full overflow-visible bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 lg:hidden"
            style={{ backgroundImage: "url('/images/bg3.webp')" }}
          >
            <BrowserFrame url="localhost:3000" className="h-full w-full">
              <CommentDemoShell
                key={mobileRun}
                mobile
                play={playMobile || mobileRun > 0}
                onDraftCreated={handleDraftCreated}
                onCommentCreated={handleCommentCreated}
              />
            </BrowserFrame>
            <ReplayButton onClick={() => setMobileRun((n) => n + 1)} />
          </div>

          {/* Desktop: the scripted two-pane shell (gallery + directions) inside a
              browser window, over the same multicolor backdrop as the agent
              panel. Same w-full + 16/11 box as the other workflow panels so all
              three match in size; the frame and shell fill it (h-full). */}
          <div
            className="relative hidden w-full overflow-hidden bg-cover bg-center p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-6 lg:block lg:p-8"
            style={{
              backgroundImage: "url('/images/bg3.webp')",
              aspectRatio: '16 / 11',
            }}
          >
            <BrowserFrame
              url="localhost:3000"
              draggable
              className="h-full w-full"
            >
              <CommentDemoShell
                key={desktopRun}
                play={playDesktop || desktopRun > 0}
                onDraftCreated={handleDraftCreated}
                onCommentCreated={handleCommentCreated}
              />
            </BrowserFrame>
            <ReplayButton onClick={() => setDesktopRun((n) => n + 1)} />
          </div>
        </div>

        {/* Copy is the outer (right) column at lg. Shared copy-block padding
            keeps workflow panel title/subtitle spacing consistent. */}
        {/* lg:ml-auto pins the copy to the column's right edge, and lg:pr-8
            insets the text off the right guide rule by the same 2rem the
            references panel's copy keeps off the LEFT rule (its lg:pl-8). */}
        <div className="workflow-copy-block order-1 lg:order-2 lg:ml-auto lg:pr-8">
          <h2 className="workflow-title-size max-w-[18ch] font-main font-normal leading-[1.15] tracking-[-0.01em] text-black">
            Explore more ideas with precision.
          </h2>
          <p className="landing-subtext mt-4 text-black/70">
            Vary layout, color, motion, type and more, then compare the
            changes in Rivet.
          </p>
        </div>
      </div>
    </div>
  );
};

// Memoized: takes no props, so App re-renders don't cascade into it.
export default memo(CommentDemoSection);
