// Landing-page visual: "Rivet connects to your design references."
//
// "Drifting masonry" — instead of a settings feed, the focus is on how the
// pulled-in REFERENCES look: a loose, Pinterest-style masonry of clean
// placeholder cards (varied aspect ratios, staggered columns, abstract palette
// fills ready for an <img>). A very subtle ambient drift keeps the wall alive.
// Decorative only (no buttons, no state). Built on the real Rivet design system
// (tokens in tailwind.config.ts + type-* classes in src/styles/index.css):
//   - brand orange → bg-primary (#E14017), the single accent (Rivet node + label)
//   - source marks  → Pinterest #E60023, Are.na accent-foreground, Files yellow
//   - surfaces      → bg-main (white), bg-secondary, border-border, rounded-lg/2xl
//   - sunlight      → bg-yellow as a warm secondary tint

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
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

const SOURCE_MARK: Record<SourceId, { name: string; chip: string; icon: React.ReactNode }> = {
  pinterest: { name: 'Pinterest', chip: 'bg-[#E60023] text-white', icon: <PinterestGlyph /> },
  arena: { name: 'Are.na', chip: 'bg-accent-foreground text-white', icon: <ArenaGlyph /> },
  files: { name: 'Local files', chip: 'bg-yellow text-accent-foreground', icon: <FilesGlyph /> },
};

// Each card is a clean placeholder: an abstract fill from the Rivet palette and
// a varied aspect ratio, ready to swap for an <img>. `col` + `drift` stagger the
// masonry so the wall reads organic, not gridded. The source tag ties each
// reference back to where Rivet pulled it from.
type Card = {
  source: SourceId;
  col: 0 | 1 | 2;
  aspect: string;
  fill: string; // a gradient/solid fill — the abstract placeholder image
  drift: 'rivet-drift-a' | 'rivet-drift-b' | 'rivet-drift-c' | 'rivet-drift-d';
};

const CARDS: Card[] = [
  // left column — tall, then a stub
  { source: 'pinterest', col: 0, aspect: 'aspect-[3/4]', fill: 'bg-gradient-to-br from-[#E60023] via-primary to-[#FF8A4C]', drift: 'rivet-drift-a' },
  { source: 'files', col: 0, aspect: 'aspect-square', fill: 'bg-gradient-to-tr from-yellow via-yellow to-[#FFE9A8]', drift: 'rivet-drift-c' },
  // middle column — wide letterbox, then a portrait
  { source: 'arena', col: 1, aspect: 'aspect-[4/3]', fill: 'bg-secondary border border-border', drift: 'rivet-drift-b' },
  { source: 'pinterest', col: 1, aspect: 'aspect-[5/6]', fill: 'bg-gradient-to-b from-primary to-accent-foreground', drift: 'rivet-drift-d' },
  // right column — single dark archival block
  { source: 'arena', col: 2, aspect: 'aspect-[4/5]', fill: 'bg-accent-foreground', drift: 'rivet-drift-a' },
];

const COLUMNS: Card[][] = [
  CARDS.filter((c) => c.col === 0),
  CARDS.filter((c) => c.col === 1),
  CARDS.filter((c) => c.col === 2),
];

// Inner texture for a placeholder: a couple of soft tonal bands so the fill
// doesn't read flat — a stand-in for the imagery that will live here.
const CardFace = ({ card }: { card: Card }) => {
  const mark = SOURCE_MARK[card.source];
  return (
    <div className={`group relative ${card.aspect} overflow-hidden rounded-xl shadow-md ${card.fill}`}>
      {/* abstract placeholder texture */}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10" />
      <span aria-hidden className="absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/15 blur-md" />

      {/* source mark anchoring the reference back to Rivet's pull */}
      <span
        className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 ${mark.chip}`}
        title={mark.name}
      >
        {mark.icon}
      </span>
    </div>
  );
};

const ConnectorVisual = () => {
  return (
    <div className="relative w-full max-w-xl">
      {/* Scoped, decorative-only ambient drift (off for reduced motion). Tiny
          staggered translateY so the masonry breathes without distracting. */}
      <style>{`
        @keyframes rivet-drift-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes rivet-drift-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        @keyframes rivet-drift-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes rivet-drift-d { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        .rivet-drift-a{animation:rivet-drift-a 7s ease-in-out infinite}
        .rivet-drift-b{animation:rivet-drift-b 8.5s ease-in-out infinite .4s}
        .rivet-drift-c{animation:rivet-drift-c 6.5s ease-in-out infinite .8s}
        .rivet-drift-d{animation:rivet-drift-d 9s ease-in-out infinite .2s}
        @media (prefers-reduced-motion: reduce){
          .rivet-drift-a,.rivet-drift-b,.rivet-drift-c,.rivet-drift-d{animation:none}
        }
      `}</style>

      {/* Header: the orange Rivet node anchors the wall — references "hang" off it */}
      <div className="mb-7 flex items-center gap-4">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg ring-1 ring-primary-border/40">
          <img src="/images/rivet-logo-white.png" alt="Rivet" draggable={false} className="h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="type-overline text-primary">Reference wall</p>
          <p className="type-heading-3 text-accent-foreground">pulled in by Rivet</p>
        </div>
      </div>

      {/* The masonry — three staggered columns of varied-ratio placeholders */}
      <div className="flex items-start gap-3 sm:gap-4" aria-hidden>
        {COLUMNS.map((col, ci) => (
          <div
            key={ci}
            className="flex flex-1 flex-col gap-3 sm:gap-4"
            style={{ marginTop: ci === 1 ? '28px' : ci === 2 ? '12px' : 0 }}
          >
            {col.map((card, i) => (
              <div key={i} className={card.drift}>
                <CardFace card={card} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Small anchor label tying the wall to its sources */}
      <div className="mt-6 flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E60023] text-white shadow-sm">
            <PinterestGlyph />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-foreground text-white shadow-sm">
            <ArenaGlyph />
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow text-accent-foreground shadow-sm">
            <FilesGlyph />
          </span>
        </span>
        <p className="type-caption text-muted-foreground">
          References gathered from Pinterest, Are.na &amp; local files
        </p>
      </div>
    </div>
  );
};


// Materialized Rivet variant "DriftingMasonry" — route: /experiments/connectors-visuals/masonry
const DriftingMasonryPreview = () => (
  <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
    <ConnectorVisual />
  </main>
);

export default DriftingMasonryPreview;
