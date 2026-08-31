import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import RivetMark from './RivetMark';
import { useScrollReveal } from '../hooks/use-scroll-reveal';

/**
 * "Rivet helps designers explore more ideas" — the animated mark and the
 * statement, over three feature cards.
 *
 * Header and cards share ONE grid definition, which is what puts the headline
 * flush with the second card's left edge: the mark takes column 1, the copy
 * spans 2–3, and each card takes a column below. Aligning by eye with a
 * padding value would drift the moment the gap or the column count changed.
 *
 * Each card is a stack of layers — a warm gradient ground, the pinstripe
 * field, the rounded-shape art, then the copy. The art and the texture are
 * anchored to the BOTTOM and bleed off both edges, so the composition reads as
 * a crop of something larger rather than a picture placed in a box.
 *
 * Hovering a card widens it and washes its gradient out to the bare panel, so
 * whatever the card is really about can step forward. The width lives on the
 * GRID (a template-columns transition), not on the card, because a card that
 * grew on its own would overlap its neighbours instead of pushing them.
 */
const CARDS = [
  {
    title: ['One-click install', 'from your agent'],
    art: '/images/cards/oneclick.png',
    texture: '/images/cards/texture-stepped.png',
    detail: 'Use Rivet with your Claude, Codex, and Cursor',
    hoverArt: '/images/cards/agents-cluster.png',
  },
  {
    title: ['Connect your', 'design references'],
    art: '/images/cards/connectref.png',
    texture: '/images/cards/bgtexutre2.png',
    detail: null,
    hoverArt: null,
  },
  {
    title: ['Explore dozens', 'of different ideas'],
    art: '/images/cards/exploreee.png',
    texture: '/images/cards/bgtexture3.png',
    detail: null,
    hoverArt: null,
  },
] as const;

// Cream at the top so the heading has a quiet ground to sit on, then warming
// through pink into the full vermilion at the base.
const CARD_GRADIENT =
  'linear-gradient(to bottom, #fafafa 0%, #fbf3ef 30%, #f6cfc2 55%, #f0a08b 76%, #e8552f 100%)';

// Header only — the cards row is flex (see below).
const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6';
// One curve for every transition in the section, so the widening, the wash-out
// and the reveal all move as one gesture rather than three.
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
// The card's width is the slow part — it has the furthest to travel and it is
// what the eye follows.
const EXPAND_MS = 620;
// Nothing waits for anything else. Delaying the arriving half until the
// leaving half finished made the detail copy feel like it was loading rather
// than revealing. Instead the LEAVING layers are quick, so they are gone
// almost immediately and the two states barely coexist even though both start
// on the same frame.
const WASH_MS = 200;
const SLIDE_MS = 360;
const ARRIVE_MS = 280;

const AgentTerminalSection = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  // leave:false — the headline belongs to the cards below it, which are still
  // sharp long after the heading has crossed the blur-out band.
  const header = useScrollReveal<HTMLDivElement>({ leave: false });

  // The cards' height is LOCKED to what the aspect ratio gives them at rest.
  // Without this, widening a card also grows it vertically — aspect-ratio
  // derives height from width — and since the three share a grid row, all
  // three grew. Measured from the first card's resting width, so it still
  // tracks the viewport.
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hovered;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      // Never measure mid-hover: the first card may be the expanded one.
      if (hoveredRef.current !== null) return;
      const card = grid.firstElementChild as HTMLElement | null;
      if (!card) return;
      const w = card.getBoundingClientRect().width;
      if (w > 0) setRowH((w * 52) / 39);
    };
    measure();
    // Observes the GRID, so it fires on viewport changes — a card widening on
    // hover doesn't resize the grid, so it can't feed back into this.
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="page-gutter-x relative w-full overflow-hidden pb-24 pt-8 lg:pb-40 lg:pt-16">
      <div className="relative z-10">
        {/* Header. Same columns as the cards below, so the copy starts exactly
            where the "Connect your design references" card does. Reveals on its
            own rather than with the cards: stacked on mobile it clears the fold
            well before they do. */}
        <div
          ref={header.ref}
          className={`${GRID} mb-10 lg:mb-14`}
          style={header.style}
        >
          <div className="flex items-start">
            <RivetMark className="h-auto w-[104px] lg:w-[132px]" />
          </div>
          {/* font-aileron carries the -2% tracking from its own utility, so it
              isn't repeated here. Hard break after "more" — the measure alone
              wouldn't reliably land "ideas" at the head of line two. */}
          <h2 className="font-aileron text-[30px] font-normal leading-[1.14] text-black lg:col-span-2 lg:text-[52px]">
            Rivet helps designers explore more
            <br />
            ideas for the software they craft.
          </h2>
        </div>

        {/* Flex, not grid. A transitioned grid-template-columns proved
            unreliable here — the track sizes and the gap didn't resolve
            together, leaving a dead gap beside the widened card. flex-grow is
            a single animatable number per card and the gap stays fixed, so the
            widths always add up. */}
        <div ref={gridRef} className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          {CARDS.map((card, i) => (
            <Card
              key={card.art}
              card={card}
              index={i}
              hovered={hovered}
              rowH={rowH}
              onHover={setHovered}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * One feature card. Split out of the map so each can hold its OWN scroll
 * reveal. The section used to be wrapped as a single block, which reads fine at
 * lg where the three sit side by side and cross the fold together — but on
 * mobile they stack, so the section stays "in view" for the whole scroll and no
 * card ever went soft.
 */
const Card = ({
  card,
  index,
  hovered,
  rowH,
  onHover,
}: {
  card: (typeof CARDS)[number];
  index: number;
  hovered: number | null;
  rowH: number | null;
  onHover: (i: number | null) => void;
}) => {
  const isOpen = hovered === index;
  // Stacked on mobile, so the stagger plays out card by card; at lg they share
  // a row and it reads as one gesture.
  const reveal = useScrollReveal<HTMLElement>({ delay: index * 80 });

  return (
              <article
                ref={reveal.ref}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                // 30px on three corners with the bottom-right left square — the
                // brand's own silhouette, the same asymmetry the app icon has.
                // overflow-hidden is what lets the art bleed: each layer is
                // wider than it needs to be and gets clipped to that shape, so
                // the corners stay clean even where the art runs past them.
                // The grow/basis pair is scoped to lg through a variable
                // because an inline style can't carry a breakpoint. It has to
                // be: below lg the row is a COLUMN, where flex-basis:0 governs
                // the main axis — height — so it beat the explicit height and
                // collapsed all three cards to 2px hairlines.
                className="relative aspect-[39/52] shrink-0 overflow-hidden rounded-[30px] rounded-br-none border-[0.5px] border-[#63729d] bg-[#f1efe8] lg:aspect-auto lg:shrink lg:[flex-basis:0] lg:[flex-grow:var(--card-grow)]"
                // flex-basis 0 with grow doing the work, so the three widths
                // are pure ratios of the free space. Explicit height wins over
                // aspect-ratio, which is what keeps the expansion horizontal;
                // until measured, aspect-ratio still shapes the first paint.
                style={
                  {
                    ...reveal.style,
                    '--card-grow': hovered === null ? 1 : isOpen ? 1.9 : 1,
                    ...(rowH ? { height: rowH } : null),
                    // One declaration or the other wins outright, so the
                    // widening and the reveal share a single transition list.
                    transition: [
                      `flex-grow ${EXPAND_MS}ms ${EASE}`,
                      reveal.style.transition,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  } as CSSProperties
                }
              >
                {/* Gradient, texture and art each fade on their own layer.
                    They can't live on the article as a background, because a
                    background-image has nothing to transition to — washing out
                    means fading a layer, not changing a paint. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: CARD_GRADIENT,
                    opacity: isOpen ? 0 : 1,
                    transition: `opacity ${WASH_MS}ms ${EASE}`,
                  }}
                />
                <img
                  src={card.texture}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-x-0 bottom-0 block w-full"
                  style={{
                    opacity: isOpen ? 0.35 : 1,
                    transition: `opacity ${WASH_MS}ms ${EASE}`,
                  }}
                />
                {/* Slides out the bottom rather than fading — the shapes read
                    as moving off the card, not dissolving in place. The card's
                    own overflow-hidden does the hiding, so no opacity change
                    is needed and none is used. */}
                <img
                  src={card.art}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-x-0 bottom-0 block w-full"
                  style={{
                    transform: `translateY(${isOpen ? '104%' : '0%'})`,
                    transition: `transform ${SLIDE_MS}ms ${EASE}`,
                  }}
                />

                {/* Revealed by the wash-out: it sits under the copy, centred,
                    and scales up a touch as it fades in so it reads as
                    arriving rather than switching on. Kept off the DOM
                    entirely for cards that have none. */}
                {card.hoverArt && (
                  <img
                    src={card.hoverArt}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-[58%] block w-[62%] max-w-[380px] -translate-x-1/2 -translate-y-1/2"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: `translate(-50%, -50%) scale(${isOpen ? 1 : 0.9})`,
                      transition: `opacity ${ARRIVE_MS}ms ${EASE}, transform ${ARRIVE_MS}ms ${EASE}`,
                    }}
                  />
                )}

                <div className="relative z-10 p-6 lg:p-7">
                  <h3 className="font-aileron text-[22px] font-normal leading-[1.18] text-[#642e39] lg:text-[24px]">
                    {card.title[0]}
                    <br />
                    {card.title[1]}
                  </h3>
                  {card.detail && (
                    // Always in the DOM and always taking its space, so
                    // revealing it never reflows the heading above.
                    <p
                      className="mt-3 max-w-[34ch] font-aileron text-[15px] leading-[1.45] text-[#642e39]/80"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen
                          ? 'translateY(0)'
                          : 'translateY(6px)',
                        transition: `opacity ${ARRIVE_MS}ms ${EASE}, transform ${ARRIVE_MS}ms ${EASE}`,
                      }}
                    >
                      {card.detail}
                    </p>
                  )}
                </div>
              </article>
  );
};

// Memoized: it takes no props, so it never needs to re-render when the App
// re-renders (e.g. during the hero intro's state churn).
export default memo(AgentTerminalSection);
