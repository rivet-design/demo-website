// Landing-page visual: "Rivet connects to your design references."
//
// A CONCEPTUAL streaming RIBBON — references flow in from the three sources
// (Pinterest, Are.na, Local files) and stream sideways past Rivet in an endless
// marquee, like a living inspiration feed. Decorative only (no buttons, no
// state). Drops into a landing-page section. Built on the real Rivet design
// system (tokens in tailwind.config.ts + type-* classes in src/styles/index.css):
//   - brand orange → bg-primary (#E14017), the Rivet origin node + accent
//   - source marks  → Pinterest #E60023, Are.na accent-foreground, Files yellow
//   - surfaces      → bg-main (white), bg-secondary, border-border, rounded-lg/2xl
//   - reference fills → abstract gradients from the Rivet palette, <img>-ready

type SourceId = 'pinterest' | 'arena' | 'files';

const PinterestGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.06 2.42 7.55 5.9 9.11-.08-.77-.15-1.96.03-2.8.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.19.6 1.19 1.32 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.91-3.81-2.66 0-4.22 2-4.22 4.06 0 .8.31 1.67.69 2.14.08.09.09.17.06.27-.07.29-.23.93-.26 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.71 0-3.02 2.19-5.79 6.32-5.79 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.21.84-.8 1.9-1.2 2.54.9.28 1.85.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const ArenaGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <g fill="currentColor">
      <rect x="3" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="8.4" y="13.8" width="7.2" height="7.2" rx="1.4" />
    </g>
  </svg>
);

const FilesGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

const SOURCE_MARKS: { id: SourceId; chip: string; icon: React.ReactNode }[] = [
  { id: 'pinterest', chip: 'bg-[#E60023] text-white', icon: <PinterestGlyph /> },
  { id: 'arena', chip: 'bg-accent-foreground text-white', icon: <ArenaGlyph /> },
  { id: 'files', chip: 'bg-yellow text-accent-foreground', icon: <FilesGlyph /> },
];

// Each reference card is an abstract <img>-ready slot: varied aspect ratios,
// a gradient fill from the Rivet palette, a source tag, and a caption bar. The
// `source` ties the card back to where it streamed in from.
type RefCard = {
  source: SourceId;
  w: string;            // width (varied aspect ratios at fixed height)
  fill: string;         // gradient/solid fill (tailwind classes)
  bar: string;          // caption bar tint
  tagOnDark?: boolean;  // caption bar sits on a dark fill
};

const CARDS: RefCard[] = [
  { source: 'pinterest', w: 'w-[148px]', fill: 'bg-gradient-to-br from-[#E60023] via-primary to-[#FF7A4D]', bar: 'bg-white/40', tagOnDark: true },
  { source: 'arena', w: 'w-[96px]', fill: 'bg-gradient-to-b from-accent-foreground to-[#2c2c2e]', bar: 'bg-white/30', tagOnDark: true },
  { source: 'files', w: 'w-[124px]', fill: 'bg-gradient-to-tr from-yellow via-[#FFCE4D] to-[#FFE9A8]', bar: 'bg-black/15' },
  { source: 'pinterest', w: 'w-[110px]', fill: 'bg-gradient-to-tr from-primary to-yellow', bar: 'bg-white/40', tagOnDark: true },
  { source: 'arena', w: 'w-[132px]', fill: 'bg-secondary border border-border', bar: 'bg-border' },
];

const markFor = (id: SourceId) => SOURCE_MARKS.find((m) => m.id === id)!;

const RibbonCard = ({ card }: { card: RefCard }) => {
  const mark = markFor(card.source);
  return (
    <div
      className={`relative flex h-[104px] ${card.w} shrink-0 flex-col justify-end overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 ${card.fill}`}
    >
      {/* Source tag — abstract stand-in for "where this reference came from" */}
      <span
        className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md shadow-sm ${mark.chip}`}
      >
        {mark.icon}
      </span>
      {/* Caption bars — placeholder for an <img>'s title/meta */}
      <div className="space-y-1 p-2">
        <span className={`block h-1.5 w-3/4 rounded-full ${card.bar}`} />
        <span className={`block h-1.5 w-1/2 rounded-full ${card.bar} opacity-70`} />
      </div>
    </div>
  );
};

const ConnectorVisual = () => {
  // Two copies of the deck make a seamless -50% marquee loop.
  const stream = [...CARDS, ...CARDS];

  return (
    <div className="relative w-full max-w-xl">
      {/* Scoped, decorative-only marquee (paused for reduced motion). */}
      <style>{`
        @keyframes rivet-ribbon { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .rivet-ribbon-track { animation: rivet-ribbon 26s linear infinite; will-change: transform; }
        .group\\/ribbon:hover .rivet-ribbon-track { animation-play-state: paused; }
        @keyframes rivet-pulse { 0%,100% { transform: scale(1); opacity: .55; } 50% { transform: scale(1.35); opacity: 0; } }
        .rivet-pulse { animation: rivet-pulse 2.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rivet-ribbon-track { animation: none; }
          .rivet-pulse { animation: none; opacity: 0; }
        }
      `}</style>

      {/* Heading */}
      <div className="mb-6 flex items-center gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg ring-1 ring-primary-border/40">
          {/* Pulsing halo — references streaming in toward Rivet */}
          <span className="rivet-pulse absolute inset-0 rounded-2xl bg-primary" aria-hidden />
          <img src="/images/rivet-logo-white.png" alt="Rivet" draggable={false} className="relative h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="type-overline text-primary">An endless feed</p>
          <p className="type-heading-3 text-accent-foreground">of design references</p>
        </div>
      </div>

      {/* The streaming ribbon */}
      <div className="group/ribbon relative flex items-stretch overflow-hidden rounded-2xl border border-border bg-main p-4 shadow-sm">
        {/* Origin: the orange Rivet node anchors the left end — references read
            as flowing IN from the sources, past Rivet. */}
        <div className="relative z-20 flex shrink-0 items-center pr-4">
          <span className="relative flex h-[104px] w-12 items-center justify-center rounded-xl bg-primary shadow-md ring-1 ring-primary-border/40">
            <img src="/images/rivet-logo-white.png" alt="" aria-hidden draggable={false} className="h-6 w-6" />
          </span>
          {/* Source marks stacked at the inflow point */}
          <div className="ml-2 flex flex-col gap-1.5">
            {SOURCE_MARKS.map((m) => (
              <span
                key={m.id}
                className={`flex h-7 w-7 items-center justify-center rounded-md shadow-sm ${m.chip}`}
                aria-hidden
              >
                {m.icon}
              </span>
            ))}
          </div>
        </div>

        {/* Marquee viewport with soft edge fades */}
        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0, #000 56px, #000 calc(100% - 56px), transparent 100%)',
            maskImage:
              'linear-gradient(to right, transparent 0, #000 56px, #000 calc(100% - 56px), transparent 100%)',
          }}
          aria-hidden
        >
          <div className="rivet-ribbon-track flex w-max gap-3">
            {stream.map((card, i) => (
              <RibbonCard key={i} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// Materialized Rivet variant "StreamingRibbon" — route: /experiments/connectors-visuals/ribbon
const StreamingRibbonPreview = () => (
  <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
    <ConnectorVisual />
  </main>
);

export default StreamingRibbonPreview;
