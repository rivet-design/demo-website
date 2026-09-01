import {
  memo,
  useLayoutEffect,
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
 * whatever the card is really about can step forward. Only that card changes
 * size — its neighbours keep their resting width and are pushed aside, with
 * the row sliding to keep the hovered card in frame.
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
const SLIDE_MS = 360;
const ARRIVE_MS = 280;
// How much wider the open card is than a closed one. Also sets all three
// widths, since open + closed + closed has to add back up to the row: at 1.9
// the open card took nearly half of it and the two closed ones were left far
// narrower than the 39:52 they are drawn at. At 1.3 the closed pair sits just
// about at that ratio and the open card is a little over a third of the row.
const OPEN_SCALE = 1.3;
// Must match the row's `lg:gap-6` and Tailwind's `lg` breakpoint — the widths
// are computed here, so the arithmetic has to know the gap it is subtracting.
const GAP_PX = 24;
const LG_PX = 1024;
// The headline, as its two hard-broken lines. Line one is also what gets
// measured to size the type, so it lives here rather than inline in the JSX.
const TITLE_LINES = [
  'Rivet helps designers explore more',
  'ideas for the software they craft.',
];
// Font-size the hidden probe is rendered at. Big enough that rounding in the
// measured width is noise.
const PROBE_PX = 100;
// Fallback until the probe has been read, in multiples of font-size.
const TITLE_RATIO = 21;

const AgentTerminalSection = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  // leave:false — the headline belongs to the cards below it, which are still
  // sharp long after the heading has crossed the blur-out band.
  const header = useScrollReveal<HTMLDivElement>({ leave: false });

  // ONE card is always open. Without a default the row had no fixed total
  // width — opening a card overflowed the container and the whole stack had to
  // slide to compensate. With one always open the three widths add up to the
  // row on every frame, so hovering only ever hands the open state from one
  // card to another and nothing shifts.
  //
  // Which also sets the widths: open + collapsed + collapsed must equal the
  // row, so the collapsed width is the row divided by OPEN_SCALE + 2 rather
  // than by 3.
  //
  // Measured off the ROW, not off a card: a card's width is an output of this,
  // so measuring one would feed back into itself.
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowW, setRowW] = useState<number | null>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const desktop = window.matchMedia(`(min-width: ${LG_PX}px)`);
    const measure = () => {
      // Below lg the row is a COLUMN: the cards are full-width, nothing
      // expands, and aspect-[39/52] gives them their height on its own.
      if (!desktop.matches) {
        setRowW(null);
        return;
      }
      const w = grid.getBoundingClientRect().width;
      if (w > 0) setRowW(w - GAP_PX * (CARDS.length - 1));
    };
    measure();
    // The row's own width never changes on hover — the widths always sum back
    // to it — so this can't feed back into itself.
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    desktop.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      desktop.removeEventListener('change', measure);
    };
  }, []);

  const restW = rowW === null ? null : rowW / (OPEN_SCALE + 2);
  // Height comes from an EQUAL third, not from the collapsed width, so the
  // cards keep the proportions they were drawn at instead of getting shorter
  // to match a narrower resting card.
  const rowH = rowW === null ? null : (rowW / CARDS.length) * (52 / 39);
  // Only on desktop, where the widths make it necessary. On mobile there is no
  // hover, so a default would just leave the first card permanently washed out.
  const openIndex = rowW === null ? hovered : (hovered ?? 0);

  // The headline starts at the SECOND card's left edge. That used to fall out
  // of a shared three-column grid, but the cards are no longer equal columns —
  // the open one is 1.9x the others — so the grid put the headline a full card
  // short of where card two now begins. Measured from the same numbers the
  // cards are sized with, and pinned to the RESTING layout so the headline
  // doesn't slide every time the open card changes.
  const openW = rowW === null ? 0 : (rowW / (OPEN_SCALE + 2)) * OPEN_SCALE;
  const headX = rowW === null ? null : openW + GAP_PX;
  const headW = rowW === null ? null : rowW + GAP_PX - openW;
  // Half the row's width instead of two thirds means the headline no longer
  // holds two lines at 52px, so the size follows the column: it is the largest
  // size at which line one still fits, capped at the original 52.
  //
  // The ratio is MEASURED, not a constant — a hidden copy of that line, set
  // nowrap at a known size, gives its width in multiples of font-size for
  // whatever face actually rendered. A hardcoded number silently wraps to
  // three lines the first time the copy or the typeface changes.
  const probeRef = useRef<HTMLSpanElement>(null);
  const [titleRatio, setTitleRatio] = useState(TITLE_RATIO);
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const measure = () => {
      const w = probe.getBoundingClientRect().width;
      if (w > 0) setTitleRatio(w / PROBE_PX);
    };
    measure();
    // Aileron may still be swapping in, and the fallback face is a different
    // width — re-read once it has actually landed.
    document.fonts?.ready.then(measure).catch(() => {});
  }, []);
  const titlePx =
    headW === null ? null : Math.max(26, Math.min(52, headW / titleRatio));

  return (
    <div className="page-gutter-x relative w-full overflow-hidden pb-24 pt-8 lg:pb-40 lg:pt-16">
      <div className="relative z-10">
        {/* Header. Same columns as the cards below, so the copy starts exactly
            where the "Connect your design references" card does. Reveals on its
            own rather than with the cards: stacked on mobile it clears the fold
            well before they do. */}
        <div
          ref={header.ref}
          // min-h matches the mark's own height: it is absolute at lg, so
          // without this a shorter headline would let the mark hang out of the
          // header and eat into the gap above the cards.
          className="relative mb-12 lg:mb-24 lg:min-h-[132px]"
          style={header.style}
        >
          {/* Absolute at lg so the headline's own offset places it, rather
              than a column track — stacked below that, it sits in flow above
              the copy as before. */}
          <div className="flex items-start lg:absolute lg:left-0 lg:top-0">
            <RivetMark className="h-auto w-[104px] lg:w-[132px]" />
          </div>
          {/* font-aileron carries the -2% tracking from its own utility, so it
              isn't repeated here. Hard break after "more" — the measure alone
              wouldn't reliably land "ideas" at the head of line two. */}
          <h2
            className="mt-6 font-aileron text-[30px] font-normal leading-[1.14] text-black lg:mt-0"
            style={
              headX === null
                ? undefined
                : { marginLeft: headX, width: headW ?? undefined, fontSize: titlePx ?? undefined }
            }
          >
            {TITLE_LINES[0]}
            <br />
            {TITLE_LINES[1]}
          </h2>
          {/* Measurement probe. Absolute and hidden, so it costs no layout. */}
          <span
            ref={probeRef}
            aria-hidden
            className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-aileron font-normal"
            style={{ fontSize: PROBE_PX }}
          >
            {TITLE_LINES[0]}
          </span>
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
              hovered={openIndex}
              restW={restW}
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
  restW,
  rowH,
  onHover,
}: {
  card: (typeof CARDS)[number];
  index: number;
  hovered: number | null;
  restW: number | null;
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
                // The grow/basis pair is only the pre-measurement default,
                // and it is scoped to lg because below that the row is a
                // COLUMN, where flex-basis:0 governs the main axis — height —
                // and collapsed all three cards to 2px hairlines.
                className="relative aspect-[39/52] shrink-0 overflow-hidden rounded-[30px] rounded-br-none border-[0.5px] border-[#63729d] bg-[#fafafa] lg:aspect-auto lg:shrink lg:[flex-basis:0] lg:[flex-grow:1]"
                // Explicit height wins over aspect-ratio, which is what keeps
                // the expansion horizontal.
                style={
                  {
                    ...reveal.style,
                    // `flex: none` so the inline width actually governs — the
                    // flex-basis/grow pair in the class list is only the
                    // pre-measurement default, and flex-basis would otherwise
                    // win over width outright. Absent below lg, where the
                    // class list's column layout is what's wanted.
                    ...(restW
                      ? {
                          flex: 'none',
                          width: restW * (isOpen ? OPEN_SCALE : 1),
                        }
                      : null),
                    ...(rowH ? { height: rowH } : null),
                    // One declaration or the other wins outright, so the
                    // widening and the reveal share a single transition list.
                    transition: [
                      `width ${EXPAND_MS}ms ${EASE}`,
                      reveal.style.transition,
                    ]
                      .filter(Boolean)
                      .join(', '),
                  } as CSSProperties
                }
              >
                {/* The card's ground: gradient, then texture. Neither
                    changes on hover — every card carries the same background
                    open or closed, so the row reads as one set. Only the
                    shape art moves and the detail copy arrives. Separate
                    layers rather than backgrounds on the article because the
                    art above them has to slide independently. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: CARD_GRADIENT,
                  }}
                />
                <img
                  src={card.texture}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-x-0 bottom-0 block w-full"
                  style={{
                    opacity: 1,
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
