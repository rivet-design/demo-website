import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';

const ASSET_BASE = 'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev';

type Step = {
  number: string;
  title: string;
  description: string;
  videoSrc: string;
  bg: string;
};

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Leave comments',
    description:
      "You're sharing feedback, but with your agent rather than another human. Design is a visual exercise.",
    videoSrc: `${ASSET_BASE}/media/select_sq.mp4`,
    bg: '#141D24',
  },
  {
    number: '02',
    title: 'Agents do the work',
    description:
      'Your comments kick off agent sessions with Claude. Your feedback gets implemented.',
    videoSrc: `${ASSET_BASE}/media/polish_sq.mp4`,
    bg: '#1F2015',
  },
  {
    number: '03',
    title: 'Refine the details',
    description:
      'Use built-in visual tools for working with layout, typography, color and positioning.',
    videoSrc: `${ASSET_BASE}/media/publish_sq.mp4`,
    bg: '#2A1C35',
  },
];

const TOTAL = STEPS.length;

// Off-white section background — visible in the margins around each card
const SECTION_BG = '#F0EFE9';

/*
 * Each card is absolutely positioned within the single sticky container.
 * Cards slide up from 100% → 0% during their scroll window, then lock.
 * A white overlay fades in once the *next* card is ~30% into its slide,
 * giving the "receding into background" effect on the outgoing card.
 *
 * Function-based useTransform is used throughout so clamping is explicit
 * JS Math — avoiding motion's unreliable string-unit clamp behaviour.
 */
const PanelCard = ({
  step,
  index,
  scrollYProgress,
}: {
  step: Step;
  index: number;
  scrollYProgress: MotionValue<number>;
}) => {
  const isLast = index === TOTAL - 1;

  // Top offset: 27px at rest, eases to 55px once scrolling begins
  const cardTop = useTransform(scrollYProgress, (v) => {
    const t = Math.max(0, Math.min(1, v / 0.08));
    return `${27 + t * 28}px`;
  });

  // Entrance: translateY 100% → 0%, then locked at 0% for remaining scroll
  const y = useTransform(scrollYProgress, (v) => {
    const start = (index - 1) / TOTAL;
    const end = index / TOTAL;
    const t = Math.max(0, Math.min(1, (v - start) / (end - start)));
    return `${(1 - t) * 100}%`;
  });

  // White overlay: 0 until next card is ~30% visible, then ramps to 0.92
  const overlayOpacity = useTransform(scrollYProgress, (v) => {
    if (isLast) return 0;
    const start = (index + 0.3) / TOTAL;
    const end = (index + 1) / TOTAL;
    const t = Math.max(0, Math.min(1, (v - start) / (end - start)));
    return t * 0.92;
  });

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: cardTop,
        left: '5vw',
        right: '5vw',
        bottom: 0,
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: index + 1,
        y: index === 0 ? 0 : y,
      }}
    >
      {/* ── White header ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'white',
          padding: '3vh 3vw 2.5vh',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: '#999',
            marginBottom: 10,
          }}
        >
          {step.number}
        </span>
        <h2
          style={{
            fontSize: 'clamp(24px, 2.6vw, 44px)',
            fontWeight: 400,
            color: '#111',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          {step.title}
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#555',
            lineHeight: 1.65,
            maxWidth: 480,
            margin: 0,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* ── Dark video section ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          background: step.bg,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 0,
        }}
      >
        <div style={{ aspectRatio: '1 / 1', height: '90%' }}>
          <video
            src={step.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* ── White overlay — fades in as next card slides over this one ───── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'white',
          opacity: overlayOpacity,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
};

const WorkflowPanels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <>
      {/* ── Mobile: stacked cards ───────────────────────────────────────── */}
      <div className="md:hidden" style={{ background: SECTION_BG, padding: '4vw' }}>
        {STEPS.map((step) => (
          <div
            key={step.number}
            style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}
          >
            <div style={{ background: 'white', padding: '20px 20px 16px' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#999',
                  marginBottom: 8,
                }}
              >
                {step.number}
              </span>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: '#111',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {step.title}
              </h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>
                {step.description}
              </p>
            </div>
            <div style={{ background: step.bg, aspectRatio: '1 / 1' }}>
              <video
                src={step.videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: scroll-driven card stack ───────────────────────────── */}
      {/*
        Section is TOTAL×100vh tall. scrollYProgress goes 0→1 over
        (sectionHeight - viewportHeight) = 200vh of scroll, giving each
        card ~67vh of scroll budget to enter and settle.
      */}
      <div
        ref={sectionRef}
        className="hidden md:block"
        style={{
          height: `${TOTAL * 100}vh`,
          position: 'relative',
          background: SECTION_BG,
          paddingTop: '8vh',
        }}
      >
        {/* Single sticky container — pins for the full section scroll range */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            background: SECTION_BG,
          }}
        >
          {STEPS.map((step, i) => (
            <PanelCard
              key={step.number}
              step={step}
              index={i}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default WorkflowPanels;
