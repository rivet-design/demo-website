// Workflow panel: "Bring your design references."
//
// Copy on the left, a loose masonry of reference cards on the right. Each card
// echoes one of the hero bento's right-hand panels — a peach panel with the
// GeometricLines line-art, or an orange panel with the CircleGridArt. Built on
// the Rivet design system.
import { useEffect, useState } from 'react';
import PaperTexture from './PaperTexture';
import { GeometricLines } from './FadeInText';
import CircleGridArt from './CircleGridArt';

const SECTION_BG = '#F0EFE9';

// lg+ gets a denser grid (more rows) than small screens, where the cards are
// narrow and want fewer, more-spaced dots.
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
};

// Each card echoes one of the hero bento's right-hand panels — line-art or
// circle-grid — but every card gets a unique background + art color from the
// Rivet palette so the wall reads as a varied set of references.
type Motif = 'lines' | 'grid';
type Card = {
  col: 0 | 1 | 2;
  aspect: string;
  motif: Motif;
  bg: string; // background color (tailwind class)
  color: string; // art stroke color
};

const CARDS: Card[] = [
  { col: 0, aspect: 'aspect-[3/4]', motif: 'lines', bg: 'bg-[#FCE5DC]', color: '#C97557' },
  { col: 0, aspect: 'aspect-square', motif: 'grid', bg: 'bg-[#3E2A6B]', color: '#E3D6FF' },
  { col: 1, aspect: 'aspect-[4/3]', motif: 'grid', bg: 'bg-primary', color: '#FFFFFF' },
  { col: 1, aspect: 'aspect-[5/6]', motif: 'lines', bg: 'bg-accent-foreground', color: 'rgba(255,255,255,0.85)' },
  { col: 2, aspect: 'aspect-[4/5]', motif: 'lines', bg: 'bg-secondary', color: '#E14017' },
  { col: 2, aspect: 'aspect-square', motif: 'grid', bg: 'bg-green', color: '#FCE5DC' },
];

const COLUMNS: Card[][] = [
  CARDS.filter((c) => c.col === 0),
  CARDS.filter((c) => c.col === 1),
  CARDS.filter((c) => c.col === 2),
];

const CardFace = ({
  card,
  gridSpacing,
}: {
  card: Card;
  gridSpacing: number;
}) => (
  <div className={`relative ${card.aspect} overflow-hidden rounded-xl ${card.bg}`}>
    {/* Hero-bento motifs, recolored per card for variety. Fewer columns keeps
        the grid from overrunning the right edge on narrow (mobile) cards;
        spacing (row density) tightens on desktop for a few more rows. */}
    {card.motif === 'lines' ? (
      <GeometricLines color={card.color} />
    ) : (
      <CircleGridArt color={card.color} cols={5} spacing={gridSpacing} />
    )}
  </div>
);

const ReferencesDemoSection = () => {
  // More dot rows on desktop, fewer (well-spaced) on small screens.
  const gridSpacing = useIsDesktop() ? 22 : 30;
  return (
    <div
      style={{ background: SECTION_BG }}
      className="relative flex w-full justify-center px-[5vw] py-16 md:py-24"
    >
      <PaperTexture className="-z-10" />
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        {/* Copy */}
        <div className="max-w-[440px]">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Bring your design references
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Pull in inspiration from Pinterest, Are.na, and your local files.
            Rivet learns your taste the more you use it.
          </p>
        </div>

        {/* Reference-wall panel */}
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white"
          style={{ aspectRatio: '16 / 11' }}
        >
          {/* The masonry wall — bleeds gently past the panel edges for an
              immersive, never-ending feel. */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
            <div className="flex w-full max-w-[520px] items-start gap-3 sm:gap-4" aria-hidden>
              {COLUMNS.map((col, ci) => (
                <div
                  key={ci}
                  className="flex flex-1 flex-col gap-3 sm:gap-4"
                  style={{ marginTop: ci === 1 ? '32px' : ci === 2 ? '14px' : 0 }}
                >
                  {col.map((card, i) => (
                    <CardFace key={i} card={card} gridSpacing={gridSpacing} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Soft top/bottom fades so the bleeding wall reads as intentional. */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default ReferencesDemoSection;
