// Workflow panel: "Bring your design references."
//
// Copy on the left, a loose masonry of reference cards on the right. Each card
// echoes one of the hero bento's right-hand panels — a peach panel with the
// GeometricLines line-art, or an orange panel with the CircleGridArt. Built on
// the Rivet design system.
import { useEffect, useState } from 'react';
import { GeometricLines } from './FadeInText';
import CircleGridArt from './CircleGridArt';


// Brand marks for the reference sources. Pinterest is the swirl glyph (filled
// with the brand red via currentColor) ported from Rivet Core's design-
// references panel (src/ui/src/components/ConnectorsView.tsx); Are.na uses its
// star mark (public/images/arena-logo.png).
const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden {...props}>
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.781c0-1.669.967-2.915 2.171-2.915 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.132 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.137.893 2.739.098.119.112.223.083.344-.091.379-.293 1.194-.333 1.361-.052.22-.174.266-.401.16-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.36-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146A12.004 12.004 0 0 0 12 24c6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0z" />
  </svg>
);

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

// Three panels pull their color straight from the hero backdrop blobs
// (panel-backdrop.png): teal #1FD0D3, yellow #ECE44D, dark green #214C16. Art
// strokes are picked for contrast against each fill.
const CARDS: Card[] = [
  { col: 0, aspect: 'aspect-[3/4]', motif: 'lines', bg: 'bg-[#FCE5DC]', color: '#C97557' },
  { col: 0, aspect: 'aspect-square', motif: 'grid', bg: 'bg-[#214C16]', color: '#CDE9C2' },
  { col: 1, aspect: 'aspect-[4/3]', motif: 'grid', bg: 'bg-[#1FD0D3]', color: '#0C6E70' },
  { col: 1, aspect: 'aspect-[5/6]', motif: 'lines', bg: 'bg-accent-foreground', color: 'rgba(255,255,255,0.85)' },
  { col: 2, aspect: 'aspect-[4/5]', motif: 'lines', bg: 'bg-[#ECE44D]', color: '#214C16' },
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
    <div className="relative flex w-full justify-center px-[5vw] py-12 md:py-16">
      <div
        data-guide-row
        className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16"
      >
        {/* Copy */}
        <div className="max-w-[440px]">
          <h2 className="mt-3 font-main text-[28px] font-normal leading-[1.15] tracking-[-0.01em] text-black md:text-[36px] lg:text-[44px]">
            Bring your design references
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-black/70 md:text-[17px]">
            Pull in inspiration from{' '}
            <span className="inline-flex items-center gap-1 whitespace-nowrap align-[-0.12em] font-medium text-black">
              <PinterestIcon className="text-[#E60023]" />
              Pinterest
            </span>
            ,{' '}
            <span className="inline-flex items-center gap-1 whitespace-nowrap align-[-0.12em] font-medium text-black">
              <img src="/images/arena-logo.png" alt="" aria-hidden className="h-[0.8em] w-auto" />
              Are.na
            </span>
            , and your{' '}
            <span className="inline-flex items-center gap-1 whitespace-nowrap align-[-0.12em] font-medium text-black">
              <img src="/images/macos-folder.svg" alt="" aria-hidden className="h-[1.1em] w-auto" />
              Local Files
            </span>
            . Rivet learns your taste the more you use it.
          </p>
        </div>

        {/* Reference-wall panel */}
        <div
          className="relative w-full overflow-hidden border border-black/10 bg-white"
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
