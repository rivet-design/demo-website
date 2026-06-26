// Baseline "Connect your sources" UI for the connectors experiment.
//
// Shows a connector panel wiring Rivet up to three sources: Pinterest, Are.na,
// and Local files. This is the BASELINE that Rivet variants explore different
// design directions against — keep it faithful to the real Rivet design system
// (tokens from tailwind.config.ts + the type-* classes in styles/index.css):
//   - brand orange  → bg-primary / hover:bg-primary-hover (#E14017)
//   - dark surface   → accent-foreground (near-black)
//   - surfaces       → bg-main (white), border-border, rounded-lg
//   - text           → text-accent-foreground (ink), text-muted-foreground (sub)
//   - typography     → type-heading-2 / type-label-lg / type-caption / type-overline
import { useState } from 'react';

type SourceId = 'pinterest' | 'arena' | 'files';

type Source = {
  id: SourceId;
  name: string;
  description: string;
  // A short status line shown once connected (e.g. how much was synced).
  connectedDetail: string;
  // Brand tile background + the inline glyph rendered on it.
  tile: string;
  icon: React.ReactNode;
};

// Source marks. The chrome around them is pure Rivet design system; the marks
// keep just enough brand identity to be recognizable.
const PinterestGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.06 2.42 7.55 5.9 9.11-.08-.77-.15-1.96.03-2.8.17-.76 1.1-4.84 1.1-4.84s-.28-.56-.28-1.39c0-1.3.76-2.27 1.7-2.27.8 0 1.19.6 1.19 1.32 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.66 0 2.94-1.76 2.94-4.29 0-2.24-1.61-3.81-3.91-3.81-2.66 0-4.22 2-4.22 4.06 0 .8.31 1.67.69 2.14.08.09.09.17.06.27-.07.29-.23.93-.26 1.06-.04.17-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.71 0-3.02 2.19-5.79 6.32-5.79 3.32 0 5.9 2.37 5.9 5.53 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.21.84-.8 1.9-1.2 2.54.9.28 1.85.43 2.85.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const ArenaGlyph = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <g fill="currentColor">
      <rect x="3" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="13.8" y="3" width="7.2" height="7.2" rx="1.4" />
      <rect x="8.4" y="13.8" width="7.2" height="7.2" rx="1.4" />
    </g>
  </svg>
);

const FilesGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6a2 2 0 0 1 2-2h3.2a2 2 0 0 1 1.4.6L12 6h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
  </svg>
);

const SOURCES: Source[] = [
  {
    id: 'pinterest',
    name: 'Pinterest',
    description: 'Pull boards and pins in as visual references.',
    connectedDetail: '3 boards · 248 pins synced',
    tile: 'bg-[#E60023] text-white',
    icon: <PinterestGlyph />,
  },
  {
    id: 'arena',
    name: 'Are.na',
    description: 'Connect channels of collected blocks and links.',
    connectedDetail: '',
    tile: 'border border-white/15 bg-white/10 text-white',
    icon: <ArenaGlyph />,
  },
  {
    id: 'files',
    name: 'Local files',
    description: 'Index a folder of images, docs, and design files.',
    connectedDetail: '',
    tile: 'bg-yellow text-accent-foreground',
    icon: <FilesGlyph />,
  },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const Connectors = () => {
  // Pinterest starts connected so the panel shows both states at once.
  const [connected, setConnected] = useState<Record<SourceId, boolean>>({
    pinterest: true,
    arena: false,
    files: false,
  });

  const toggle = (id: SourceId) =>
    setConnected((c) => ({ ...c, [id]: !c[id] }));

  const connectedCount = Object.values(connected).filter(Boolean).length;

  return (
    <section className="w-full max-w-xl rounded-lg border border-white/10 bg-accent-foreground font-main text-white shadow-lg">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="type-heading-2 text-white">Connect your sources</h2>
          <p className="type-caption mt-1 text-white/60">
            Bring references into Rivet from the places you already collect them.
          </p>
        </div>
        <span className="type-overline shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/60">
          {connectedCount}/{SOURCES.length}
        </span>
      </header>

      {/* Source rows */}
      <ul className="divide-y divide-white/10">
        {SOURCES.map((source) => {
          const isConnected = connected[source.id];
          return (
            <li key={source.id} className="flex items-center gap-4 px-6 py-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${source.tile}`}
              >
                {source.icon}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="type-label-lg text-white">{source.name}</span>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <CheckIcon />
                      Connected
                    </span>
                  )}
                </div>
                <p className="type-caption mt-0.5 truncate text-white/60">
                  {isConnected && source.connectedDetail
                    ? source.connectedDetail
                    : source.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggle(source.id)}
                className={
                  isConnected
                    ? 'type-label shrink-0 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-white transition-colors hover:bg-white/15'
                    : 'type-label shrink-0 rounded-lg bg-primary px-3.5 py-2 text-white transition-colors hover:bg-primary-hover'
                }
              >
                {isConnected ? 'Manage' : 'Connect'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};


// Materialized Rivet variant "DarkPanel" — route: /experiments/connectors/dark-panel
const DarkPanelPreview = () => (
  <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
    <Connectors />
  </main>
);

export default DarkPanelPreview;
