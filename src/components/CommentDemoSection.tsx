import { memo, useState } from 'react';
import { telemetry } from '@/lib/telemetry';
import CommentDemoShell from './commentsDemo/CommentDemoShell';
import BrowserFrame from './BrowserFrame';

const R2_MEDIA_URL = 'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev';
const MOBILE_VIDEO_SRC = `${R2_MEDIA_URL}/media/vid_landing.webm`;
const MOBILE_POSTER_SRC = '/images/rivet-demo@2x.png';

const REQUEST_TEXT = 'try more fluid layouts';

/**
 * Workflow panel: "Explore with precision."
 *
 * Mirrors the hero: inside the browser shell, a live gallery preview sits on the
 * LEFT and a Directions list on the RIGHT. A scripted drag leaves the comment
 * "try more fluid layouts", layout directions generate on the right, and
 * selecting one restyles the gallery on the left. The "Explore with precision"
 * copy stays beside the shell (the section keeps its two-column grid).
 */
const CommentDemoSection = () => {
  // The scripted intro plays only on desktop with motion allowed — same gate as
  // the hero (App.tsx `playHeroIntro`). Otherwise the demo renders its resolved
  // state with no fake cursor.
  const [play] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      window.matchMedia('(min-width: 768px)').matches,
  );

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
          {/* Mobile: static video — the interactive drag/variants demo doesn't
              translate to touch and is too dense for small screens. */}
          <div
            data-guide-row
            className="block w-full overflow-hidden border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] md:hidden"
            style={{ aspectRatio: '16 / 10' }}
          >
            <video
              src={MOBILE_VIDEO_SRC}
              poster={MOBILE_POSTER_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Rivet comments demo"
              className="h-full w-full object-cover"
            />
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
                play={play}
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
