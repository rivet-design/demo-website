// Landing-page visual: "Rivet pulls in your design references."
//
// SCATTERED MOODBOARD — a decorative, conceptual visual (no buttons, no state).
// The hero is a loose, OVERLAPPING pile of abstract reference cards, tossed at
// varied sizes / aspect ratios / rotations, like images strewn across a desk.
// Each card is a clean placeholder (palette gradient fill + a tiny caption bar)
// ready to later hold an <img>. A small orange Rivet node + the three source
// marks (Pinterest / Are.na / Files) keep a light tie to the reference feed.
//
// Built on the real Rivet design system (tokens in tailwind.config.ts + type-*
// classes in src/styles/index.css):
//   - brand orange  → bg-primary (#E14017), the single accent + Rivet node
//   - source marks  → Pinterest #E60023, Are.na accent-foreground, Files yellow
//   - surfaces      → bg-main (white), bg-secondary, border-border, bg-yellow,
//                     rounded-lg/2xl, shadow
//   - inline SVG only, no deps, no external images; motion is CSS-only and
//     respects prefers-reduced-motion.

type SourceId = 'pinterest' | 'arena' | 'files';

const PinterestGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.06 2.42 7.55 5.9 9.11-.08-.77-.15-1.96.03-2.8.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.19.6 1.19 1.32 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.91-3.81-2.66 0-4.22 2-4.22 4.06 0 .8.31 1.67.69 2.14.08.09.09.17.06.27-.07.29-.23.93-.26 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.71 0-3.02 2.19-5.79 6.32-5.79 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.21.84-.8 1.9-1.2 2.54.9.28 1.85.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const ArenaGlyph = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
    <g fill="currentColor">
      <rect x="3" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="8.4" y="13.8" width="7.2" height="7.2" rx="1.4" />
    </g>
  </svg>
);

const FilesGlyph = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

const SOURCE_MARKS: { id: SourceId; chip: string; icon: React.ReactNode }[] = [
  { id: 'pinterest', chip: 'bg-[#E60023] text-white', icon: <PinterestGlyph /> },
  { id: 'arena', chip: 'bg-accent-foreground text-white', icon: <ArenaGlyph /> },
  { id: 'files', chip: 'bg-yellow text-accent-foreground', icon: <FilesGlyph /> },
];

// The scattered pile. Each card is an abstract reference placeholder positioned
// freeform (absolute, % from center) with its own size, rotation and fill drawn
// from the Rivet palette. Loose overlap + varied aspect ratios make it read like
// a hand-tossed moodboard rather than a grid. `float` keys an ambient drift.
type RefCard = {
  // position relative to the pile center
  x: string;
  y: string;
  w: number;
  h: number;
  rotate: string;
  z: number;
  fill: string; // background utility classes for the placeholder fill
  bar: string; // caption-bar tint
  source?: SourceId; // optional little source mark in the corner
  float: 'a' | 'b' | 'c' | 'd' | 'e';
};

const PILE: RefCard[] = [
  // big archival Are.na block, anchored back-left, slight left tilt
  {
    x: '-46%', y: '2%', w: 150, h: 196, rotate: '-9deg', z: 1,
    fill: 'bg-gradient-to-br from-secondary to-main',
    bar: 'bg-border', source: 'arena', float: 'a',
  },
  // warm Pinterest pin, tall, tucked behind center
  {
    x: '8%', y: '-30%', w: 116, h: 168, rotate: '7deg', z: 2,
    fill: 'bg-gradient-to-b from-[#E60023] to-primary',
    bar: 'bg-white/40', source: 'pinterest', float: 'b',
  },
  // sunny Files square, lower-right, ready for a doc/image thumb
  {
    x: '40%', y: '20%', w: 134, h: 134, rotate: '-6deg', z: 3,
    fill: 'bg-gradient-to-tr from-yellow to-main',
    bar: 'bg-black/15', source: 'files', float: 'c',
  },
  // brand-orange hero card — the freshest reference, front and center
  {
    x: '-8%', y: '14%', w: 122, h: 150, rotate: '4deg', z: 4,
    fill: 'bg-gradient-to-br from-primary to-primary-border',
    bar: 'bg-white/45', float: 'd',
  },
  // small clean wide swatch peeking out top-right
  {
    x: '34%', y: '-34%', w: 104, h: 78, rotate: '11deg', z: 2,
    fill: 'bg-gradient-to-r from-main to-secondary',
    bar: 'bg-border', float: 'e',
  },
];

const ConnectorVisual = () => {
  return (
    <div className="relative w-full max-w-xl">
      {/* Scoped, decorative-only ambient drift (off for reduced motion). */}
      <style>{`
        @keyframes rivet-drift-a { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-3px,-5px) rotate(-0.6deg)} }
        @keyframes rivet-drift-b { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(2px,4px) rotate(0.6deg)} }
        @keyframes rivet-drift-c { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(3px,-3px) rotate(0.5deg)} }
        @keyframes rivet-drift-d { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-2px,3px) rotate(-0.5deg)} }
        @keyframes rivet-drift-e { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(4px,-4px) rotate(0.8deg)} }
        @keyframes rivet-pulse { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.08)} }
        .rivet-drift-a{animation:rivet-drift-a 6.5s ease-in-out infinite}
        .rivet-drift-b{animation:rivet-drift-b 7.5s ease-in-out infinite}
        .rivet-drift-c{animation:rivet-drift-c 6s ease-in-out infinite}
        .rivet-drift-d{animation:rivet-drift-d 8s ease-in-out infinite}
        .rivet-drift-e{animation:rivet-drift-e 5.5s ease-in-out infinite}
        .rivet-pulse{animation:rivet-pulse 4s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          .rivet-drift-a,.rivet-drift-b,.rivet-drift-c,.rivet-drift-d,.rivet-drift-e,.rivet-pulse{animation:none}
        }
      `}</style>

      {/* Header: the orange Rivet node keeps the conceptual tie to the feed. */}
      <div className="relative mb-2 flex items-center gap-4">
        <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg ring-1 ring-primary-border/40">
          <img src="/images/rivet-logo-white.png" alt="Rivet" draggable={false} className="h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="type-overline text-primary">Rivet pulls in</p>
          <p className="type-heading-3 text-accent-foreground">your design references</p>
        </div>
      </div>

      {/* The scattered moodboard pile — the hero. */}
      <div className="relative mx-auto h-[360px] w-full" aria-hidden>
        {/* soft warm glow grounding the pile */}
        <div className="rivet-pulse absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {PILE.map((c, i) => {
            const mark = c.source ? SOURCE_MARKS.find((m) => m.id === c.source) : undefined;
            return (
              <div
                key={i}
                className={`rivet-drift-${c.float} absolute`}
                style={{
                  width: c.w,
                  height: c.h,
                  left: c.x,
                  top: c.y,
                  marginLeft: -c.w / 2,
                  marginTop: -c.h / 2,
                  zIndex: c.z,
                }}
              >
                <div
                  className={`flex h-full w-full flex-col justify-end overflow-hidden rounded-xl border border-border/60 shadow-xl ring-1 ring-black/5 ${c.fill}`}
                  style={{ transform: `rotate(${c.rotate})` }}
                >
                  {/* tiny source mark in the corner, if this card came from a source */}
                  {mark && (
                    <span
                      className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md shadow-sm ${mark.chip}`}
                    >
                      {mark.icon}
                    </span>
                  )}
                  {/* caption bar — placeholder for a later label, keeps it img-ready */}
                  <div className="m-2 flex items-center gap-1.5">
                    <span className={`h-1.5 flex-1 rounded-full ${c.bar}`} />
                    <span className={`h-1.5 w-3 rounded-full ${c.bar} opacity-60`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer caption + the three source marks, a quiet legend for the pile. */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="type-caption text-muted-foreground">A live moodboard, pulled together</p>
        <div className="flex items-center gap-2">
          {SOURCE_MARKS.map((m) => (
            <span
              key={m.id}
              className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${m.chip}`}
              aria-hidden
            >
              {m.icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};


// Materialized Rivet variant "ScatteredMoodboard" — route: /experiments/connectors-visuals/scattered
const ScatteredMoodboardPreview = () => (
  <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
    <ConnectorVisual />
  </main>
);

export default ScatteredMoodboardPreview;
