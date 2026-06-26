// Landing-page visual: "Rivet connects to your design references."
//
// "Polaroid scrapbook" — the references Rivet pulls in are shown as tactile
// POLAROID-style cards: a thick white frame around an abstract image area
// (gradient/color fills from the Rivet palette) with a caption strip beneath.
// Cards are hand-placed at slight angles, overlapping, pinned or taped to the
// board like a moodboard. A small orange Rivet node + source marks keep the
// light conceptual tie to the reference feed. Decorative only (no buttons, no
// state). Built on the real Rivet design system (tokens in tailwind.config.ts +
// type-* classes in src/styles/index.css):
//   - brand orange → bg-primary (#E14017), the single accent (Rivet node, pin)
//   - source marks  → Pinterest #E60023, Are.na accent-foreground, Files yellow
//   - surfaces      → bg-main (white) frame, border-border, bg-secondary board
// Each card's image area is ready to later hold an <img> in place of the fill.

type SourceId = 'pinterest' | 'arena' | 'files';

const PinterestGlyph = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.06 2.42 7.55 5.9 9.11-.08-.77-.15-1.96.03-2.8.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.19.6 1.19 1.32 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.91-3.81-2.66 0-4.22 2-4.22 4.06 0 .8.31 1.67.69 2.14.08.09.09.17.06.27-.07.29-.23.93-.26 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.71 0-3.02 2.19-5.79 6.32-5.79 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.21.84-.8 1.9-1.2 2.54.9.28 1.85.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const ArenaGlyph = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
    <g fill="currentColor">
      <rect x="3" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="8.4" y="13.8" width="7.2" height="7.2" rx="1.4" />
    </g>
  </svg>
);

const FilesGlyph = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

const SOURCE_MARK: Record<SourceId, { icon: React.ReactNode; ink: string; label: string }> = {
  pinterest: { icon: <PinterestGlyph />, ink: 'text-[#E60023]', label: 'Pinterest' },
  arena: { icon: <ArenaGlyph />, ink: 'text-accent-foreground', label: 'Are.na' },
  files: { icon: <FilesGlyph />, ink: 'text-yellow-border', label: 'Local files' },
};

// Each reference is a polaroid: an abstract image fill (swappable for an <img>),
// a caption, the source it was pulled from, and a hand-placed rotation/offset.
// "tape" pins it with a translucent strip; "pin" tacks it with an orange dot.
type Card = {
  source: SourceId;
  caption: string;
  fill: string; // image-area stand-in (gradient/color from the Rivet palette)
  rotate: string;
  x: string;
  y: string;
  pin: 'tape' | 'pin';
  float: 'rivet-float-a' | 'rivet-float-b' | 'rivet-float-c';
};

const CARDS: Card[] = [
  {
    source: 'pinterest',
    caption: 'warm gradient',
    fill: 'bg-gradient-to-br from-primary via-[#E60023] to-primary-border',
    rotate: '-7deg',
    x: '4%',
    y: '4%',
    pin: 'tape',
    float: 'rivet-float-a',
  },
  {
    source: 'arena',
    caption: 'archival grid',
    fill: 'bg-gradient-to-b from-accent-foreground to-[#2b2b2b]',
    rotate: '6deg',
    x: '37%',
    y: '0%',
    pin: 'pin',
    float: 'rivet-float-b',
  },
  {
    source: 'files',
    caption: 'sunlit study',
    fill: 'bg-gradient-to-tr from-yellow via-yellow-border to-primary',
    rotate: '-4deg',
    x: '8%',
    y: '46%',
    pin: 'pin',
    float: 'rivet-float-c',
  },
  {
    source: 'arena',
    caption: 'paper texture',
    fill: 'bg-gradient-to-br from-secondary via-main to-border',
    rotate: '9deg',
    x: '52%',
    y: '44%',
    pin: 'tape',
    float: 'rivet-float-a',
  },
];

const Polaroid = ({ card, z }: { card: Card; z: number }) => {
  const mark = SOURCE_MARK[card.source];
  return (
    <figure
      className={`absolute w-[150px] ${card.float}`}
      style={{ left: card.x, top: card.y, zIndex: z }}
      aria-hidden
    >
      <div
        className="relative rounded-[3px] bg-main p-2.5 pb-1 shadow-[0_10px_24px_-8px_rgba(31,32,21,0.35)] ring-1 ring-black/5"
        style={{ transform: `rotate(${card.rotate})` }}
      >
        {/* Pinned or taped to the board */}
        {card.pin === 'tape' ? (
          <span className="absolute -top-2.5 left-1/2 h-5 w-12 -translate-x-1/2 -rotate-2 rounded-[2px] bg-yellow/55 shadow-sm ring-1 ring-yellow-border/30 backdrop-blur-[1px]" />
        ) : (
          <span className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-primary shadow-md ring-2 ring-primary-border/50" />
        )}

        {/* Image area — swap this fill for an <img> later */}
        <div className={`relative aspect-square w-full overflow-hidden rounded-[2px] ${card.fill}`}>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
          {/* Source mark watermark, tying the reference back to its feed */}
          <span className={`absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-main/90 shadow-sm ${mark.ink}`}>
            {mark.icon}
          </span>
        </div>

        {/* Caption strip */}
        <figcaption className="flex items-center gap-1.5 px-0.5 pt-2 pb-1">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="type-caption font-bia truncate text-accent-foreground">{card.caption}</span>
        </figcaption>
      </div>
    </figure>
  );
};

const ConnectorVisual = () => {
  return (
    <div className="relative w-full max-w-xl">
      {/* Scoped, decorative-only ambient float (off for reduced motion). */}
      <style>{`
        @keyframes rivet-float-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes rivet-float-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
        @keyframes rivet-float-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .rivet-float-a{animation:rivet-float-a 5.5s ease-in-out infinite}
        .rivet-float-b{animation:rivet-float-b 6.5s ease-in-out infinite}
        .rivet-float-c{animation:rivet-float-c 5s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          .rivet-float-a,.rivet-float-b,.rivet-float-c{animation:none}
        }
      `}</style>

      {/* Header: the orange Rivet node, source of the pulled references */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg ring-1 ring-primary-border/40">
          <img src="/images/rivet-logo-white.png" alt="Rivet" draggable={false} className="h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="type-overline text-primary">Rivet pulls from</p>
          <p className="type-heading-3 text-accent-foreground">your design references</p>
        </div>
      </div>

      {/* The scrapbook board — references pinned at hand-placed angles */}
      <div className="relative rounded-2xl border border-border bg-secondary/60 p-4">
        {/* Source marks present on the board, tying back to the feed */}
        <div className="mb-1 flex items-center gap-3 px-1">
          {(['pinterest', 'arena', 'files'] as SourceId[]).map((id) => {
            const m = SOURCE_MARK[id];
            return (
              <span key={id} className={`flex items-center gap-1.5 ${m.ink}`}>
                {m.icon}
                <span className="type-caption text-muted-foreground">{m.label}</span>
              </span>
            );
          })}
        </div>

        {/* Pinned references. Fixed height gives the absolute layer room. */}
        <div className="relative h-[420px]">
          {CARDS.map((card, i) => (
            <Polaroid key={`${card.source}-${i}`} card={card} z={10 + i} />
          ))}
        </div>
      </div>
    </div>
  );
};


// Materialized Rivet variant "PolaroidScrapbook" — route: /experiments/connectors-visuals/polaroid
const PolaroidScrapbookPreview = () => (
  <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
    <ConnectorVisual />
  </main>
);

export default PolaroidScrapbookPreview;
