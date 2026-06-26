// Landing-page visual: "Rivet connects to your design references."
//
// A CONCEPTUAL list — kept as a vertical list/feed, but each row is treated as
// a living moodboard that pulls in a fan of abstract visual "references" rather
// than a B2B settings row. Decorative only (no buttons, no state). Drops into a
// landing-page section. Built on the real Rivet design system (tokens in
// tailwind.config.ts + type-* classes in src/styles/index.css):
//   - brand orange → bg-primary (#E14017), the feed spine + accent
//   - source marks  → Pinterest #E60023, Are.na accent-foreground, Files yellow
//   - surfaces      → bg-main (white), border-border, rounded-lg/2xl, shadow

type SourceId = 'pinterest' | 'arena' | 'files';

const PinterestGlyph = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.06 2.42 7.55 5.9 9.11-.08-.77-.15-1.96.03-2.8.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.19.6 1.19 1.32 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.91-3.81-2.66 0-4.22 2-4.22 4.06 0 .8.31 1.67.69 2.14.08.09.09.17.06.27-.07.29-.23.93-.26 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.71 0-3.02 2.19-5.79 6.32-5.79 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.21.84-.8 1.9-1.2 2.54.9.28 1.85.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const ArenaGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <g fill="currentColor">
      <rect x="3" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="8.4" y="13.8" width="7.2" height="7.2" rx="1.4" />
    </g>
  </svg>
);

const FilesGlyph = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

// Each source carries its own "reference" swatches — abstract stand-ins for the
// imagery it pulls in. Themed by hue so each row feels like that source's
// moodboard: Pinterest warm, Are.na archival/monochrome, Local files sunny.
type Swatch = { cls: string; bar?: string };
const SOURCES: {
  id: SourceId;
  name: string;
  kicker: string;
  chip: string;
  icon: React.ReactNode;
  swatches: Swatch[];
}[] = [
  {
    id: 'pinterest',
    name: 'Pinterest',
    kicker: 'boards & pins',
    chip: 'bg-[#E60023] text-white',
    icon: <PinterestGlyph />,
    swatches: [
      { cls: 'bg-[#E60023]', bar: 'bg-white/35' },
      { cls: 'bg-primary', bar: 'bg-white/35' },
      { cls: 'bg-yellow', bar: 'bg-black/15' },
    ],
  },
  {
    id: 'arena',
    name: 'Are.na',
    kicker: 'channels & blocks',
    chip: 'bg-accent-foreground text-white',
    icon: <ArenaGlyph />,
    swatches: [
      { cls: 'bg-accent-foreground', bar: 'bg-white/25' },
      { cls: 'bg-main border border-border', bar: 'bg-border' },
      { cls: 'bg-secondary', bar: 'bg-border' },
    ],
  },
  {
    id: 'files',
    name: 'Local files',
    kicker: 'images & docs',
    chip: 'bg-yellow text-accent-foreground',
    icon: <FilesGlyph />,
    swatches: [
      { cls: 'bg-yellow', bar: 'bg-black/15' },
      { cls: 'bg-secondary', bar: 'bg-border' },
      { cls: 'bg-accent-foreground', bar: 'bg-white/25' },
    ],
  },
];

// Each fanned swatch gets a little rotation + offset so the cluster reads like
// a hand-tossed pile of references rather than a tidy grid.
const FAN = [
  { rotate: '-8deg', y: '6px', ambient: 'rivet-float-a' },
  { rotate: '5deg', y: '-4px', ambient: 'rivet-float-b' },
  { rotate: '-3deg', y: '2px', ambient: 'rivet-float-c' },
];

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

      {/* Feed spine: a thread running down the left, originating at the orange
          Rivet node — everything below "hangs" off Rivet. */}
      <div
        className="absolute left-[27px] top-7 bottom-7 w-px bg-gradient-to-b from-primary/60 via-border to-border"
        aria-hidden
      />

      {/* Origin node */}
      <div className="relative mb-8 flex items-center gap-4">
        <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg ring-1 ring-primary-border/40">
          <img src="/images/rivet-logo-white.png" alt="Rivet" draggable={false} className="h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="type-overline text-primary">Rivet pulls from</p>
          <p className="type-heading-3 text-accent-foreground">your design references</p>
        </div>
      </div>

      {/* The conceptual list */}
      <ul className="flex flex-col gap-7">
        {SOURCES.map((source) => (
          <li key={source.id} className="relative flex items-center gap-5">
            {/* Node on the spine */}
            <span className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${source.chip}`}>
              {source.icon}
            </span>

            {/* Identity */}
            <div className="min-w-0 leading-tight">
              <p className="type-heading-3 text-accent-foreground">{source.name}</p>
              <p className="type-caption text-muted-foreground">{source.kicker}</p>
            </div>

            <div className="flex-1" />

            {/* Fan of pulled-in references */}
            <div className="flex shrink-0 items-center pr-1" aria-hidden>
              {source.swatches.map((sw, i) => (
                <div
                  key={i}
                  className={FAN[i].ambient}
                  style={{ marginLeft: i === 0 ? 0 : '-14px', zIndex: 10 - i }}
                >
                  <div
                    className={`flex h-16 w-12 flex-col justify-end overflow-hidden rounded-lg shadow-md ${sw.cls}`}
                    style={{ transform: `rotate(${FAN[i].rotate}) translateY(${FAN[i].y})` }}
                  >
                    <span className={`m-1 h-1.5 rounded-full ${sw.bar ?? 'bg-white/30'}`} />
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectorVisual;
