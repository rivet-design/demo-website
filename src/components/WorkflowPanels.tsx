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

/*
 * Each card is absolutely inset within the single sticky viewport container.
 * Cards 1+ start at translateY(100%) and slide to translateY(0%) as the
 * user scrolls through the card's share of the section scroll budget.
 * Higher z-index cards cover lower ones — stacking effect.
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

  // Entrance: this card slides up from below during its scroll range
  const y = useTransform(
    scrollYProgress,
    [(index - 1) / TOTAL, index / TOTAL],
    ['100%', '0%'],
  );

  // Being-covered: blur this card as the *next* card slides in over it.
  // For the last card the output is always 0px so nothing changes.
  const blur = useTransform(
    scrollYProgress,
    [index / TOTAL, isLast ? 1 : (index + 1) / TOTAL],
    ['blur(0px)', isLast ? 'blur(0px)' : 'blur(8px)'],
  );

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'white',
        zIndex: index + 1,
        overflow: 'hidden',
        // Card 0 is the base — always at 0. Cards 1+ slide in from below.
        y: index === 0 ? 0 : y,
        filter: blur,
      }}
    >
      {/* Text — in the white space above-left of the dark card */}
      <div
        style={{
          position: 'absolute',
          top: '5vh',
          left: '5vw',
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
            fontFamily: 'Pixel, sans-serif',
          }}
        >
          {step.number}
        </span>
        <h2
          style={{
            fontSize: 'clamp(26px, 2.8vw, 48px)',
            fontWeight: 600,
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
            fontSize: 'clamp(14px, 1.1vw, 17px)',
            color: '#555',
            lineHeight: 1.65,
            maxWidth: 380,
            margin: 0,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* Dark video card — inset from all edges */}
      <div
        style={{
          position: 'absolute',
          top: '24vh',
          left: '5vw',
          right: '5vw',
          bottom: '4vh',
          background: step.bg,
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            aspectRatio: '1 / 1',
            height: '90%',
          }}
        >
          <video
            src={step.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 12,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const WorkflowPanels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  /*
   * scrollYProgress goes 0→1 as the section scrolls from its top edge
   * aligned with the viewport top to its bottom edge aligned with the
   * viewport bottom. Section is TOTAL×100vh tall, giving 100vh of scroll
   * budget per card.
   */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <>
      {/* ── Mobile: stacked sections ────────────────────────────────────── */}
      <div className="md:hidden">
        {STEPS.map((step) => (
          <div
            key={step.number}
            style={{ padding: '6vh 6vw', background: 'white' }}
          >
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
                fontSize: 24,
                fontWeight: 600,
                color: '#111',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              {step.title}
            </h2>
            <p
              style={{
                fontSize: 15,
                color: '#555',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              {step.description}
            </p>
            <div
              style={{
                background: step.bg,
                borderRadius: 14,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
              }}
            >
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
      <div
        ref={sectionRef}
        className="hidden md:block"
        style={{ height: `${TOTAL * 100}vh`, position: 'relative' }}
      >
        {/* Single sticky container — pins for the full section scroll range */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
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
