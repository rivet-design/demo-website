import { useRef, useState } from 'react';
import { telemetry } from '@/lib/telemetry';
import { CommentLayer } from './comments';
import type { Comment } from './comments';
import Gallery from './gallery/Gallery';
import PaperTexture from './PaperTexture';

const SECTION_BG = '#F0EFE9';
const R2_MEDIA_URL = 'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev';
const MOBILE_VIDEO_SRC = `${R2_MEDIA_URL}/media/vid_landing.webm`;
const MOBILE_POSTER_SRC = '/images/rivet-demo@2x.png';

/**
 * Side-by-side workflow panel: copy on the left, an interactive mini-app on the
 * right. Comments are scoped to the panel — drag inside it to leave a comment;
 * everything resets on page reload.
 *
 * `mt-6 md:mt-10` lets the page's white bg show through, so this panel reads as
 * a separate entity from the video panel above (rather than one big gray slab).
 */
/**
 * Pre-seeded comments shown on first paint. Coordinates are percentages of the
 * comment panel — they survive resizing because the panel has a fixed 16:10
 * aspect ratio. Numbers tuned against the gallery layout (52px topbar,
 * 220px sidebar) for reasonable alignment across breakpoints.
 */
const SEEDED_COMMENTS: Comment[] = [
  {
    id: 'seed-all-works',
    pin: { xPct: 0.15, yPct: 0.19 },
    instruction: 'Make this slightly bolder',
    status: 'pending',
    createdAt: 0,
  },
  {
    id: 'seed-collections',
    pin: { xPct: 0.27, yPct: 0.478 },
    dragBox: {
      leftPct: 0.005,
      topPct: 0.16,
      widthPct: 0.265,
      heightPct: 0.318,
    },
    instruction: 'Could we group these by date?',
    status: 'pending',
    createdAt: 0,
  },
];

/** Pin for the open draft popover — sits over a top-row gallery item. */
const SEEDED_DRAFT = {
  pin: { xPct: 0.58, yPct: 0.35 },
};

const CommentDemoSection = () => {
  const [comments, setComments] = useState<Comment[]>(SEEDED_COMMENTS);

  // Diff comments transitions to fire telemetry on user-driven create/edit/
  // delete actions. We don't capture instruction text (PII-adjacent) — only
  // its length and a stable comment id.
  const prevCommentsRef = useRef<Comment[]>(SEEDED_COMMENTS);
  const handleCommentsChange = (next: Comment[]) => {
    const prev = prevCommentsRef.current;
    const prevById = new Map(prev.map((c) => [c.id, c]));
    const nextById = new Map(next.map((c) => [c.id, c]));

    for (const c of next) {
      if (!prevById.has(c.id)) {
        telemetry.trackCommentDemoCommentCreated({
          commentId: c.id,
          instructionLength: c.instruction.length,
          hasDragBox: !!c.dragBox,
        });
      }
    }
    for (const c of prev) {
      if (!nextById.has(c.id)) {
        telemetry.trackCommentDemoCommentDeleted({ commentId: c.id });
      }
    }
    for (const c of next) {
      const prior = prevById.get(c.id);
      if (prior && prior.instruction !== c.instruction) {
        telemetry.trackCommentDemoCommentEdited({
          commentId: c.id,
          instructionLength: c.instruction.length,
        });
      }
    }

    prevCommentsRef.current = next;
    setComments(next);
  };

  return (
    <div
      style={{ background: SECTION_BG }}
      className="relative flex w-full justify-center px-[5vw] py-16 md:py-24"
    >
      <PaperTexture className="-z-10" />
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-16">
        {/* DOM order is panel-then-text so that at lg+ the panel sits in the
            first (1.7fr) column on the left. On stacked mobile/tablet we want
            the title above the panel, so flip with `order-` classes below. */}
        <div
          className="relative order-2 w-full overflow-visible lg:order-1"
          style={{ aspectRatio: '16 / 10' }}
        >
          {/* Mobile: static video — interactive version doesn't translate to
              touch and the gallery is too dense for small screens. */}
          <div className="block h-full w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] md:hidden">
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

          {/* Desktop: full interactive comments + gallery */}
          <div className="hidden h-full w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] md:block">
            <CommentLayer
              active
              comments={comments}
              onCommentsChange={handleCommentsChange}
              initialDraft={SEEDED_DRAFT}
              openInitialDraftOnVisible
              scrollableSelector=".rivet-gallery .content"
              onDraftCreated={telemetry.trackCommentDemoDraftCreated.bind(
                telemetry,
              )}
            >
              <Gallery />
            </CommentLayer>
          </div>
        </div>

        <div className="order-1 max-w-[440px] lg:order-2">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Refine visual details
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Share precise design feedback with an agent to get the details of a
            design direction just right. Then generate a link to share with your
            team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommentDemoSection;
