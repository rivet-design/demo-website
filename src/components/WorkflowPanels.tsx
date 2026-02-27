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

const WorkflowPanels = () => {
  return (
    <>
      {/* ── Mobile: stacked sections ───────────────────────────────────── */}
      <div className="md:hidden">
        {STEPS.map((step) => (
          <div key={step.number} style={{ padding: '6vh 6vw', background: 'white' }}>
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

      {/* ── Desktop: stacking sticky panels ────────────────────────────── */}
      {/*
        Each wrapper gives the panel its scroll budget.
        The sticky card inside pins at top: 0 for the full budget,
        then the next panel slides up (higher z-index) and covers it.
        The white background on each card means the incoming panel
        cleanly covers the outgoing one.
      */}
      <div className="hidden md:block">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            style={{ height: i < STEPS.length - 1 ? '150vh' : '100vh' }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                height: '100vh',
                background: 'white',
                zIndex: i + 1,
                overflow: 'hidden',
              }}
            >
              {/* Text — sits in white space above-left of the dark card */}
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
                    maxHeight: '90%',
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
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WorkflowPanels;
