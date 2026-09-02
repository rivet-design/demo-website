import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import RivetMark from './RivetMark';
import BrowserFrame from './BrowserFrame';
import AgentTerminal from './sandbox/AgentTerminal';
import { HERO_SESSION, REFERENCES_SESSION } from './sandbox/terminalScript';
import DirectionsPanel from './variantsDemo/DirectionsPanel';
import { useVariantsDemo } from './variantsDemo/useVariantsDemo';
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
// Cream at the top so the heading has a quiet ground to sit on, then warming
// through pink into the full vermilion at the base.
const CARD_GRADIENT =
  'linear-gradient(to bottom, #fafafa 0%, #fbf3ef 30%, #f6cfc2 55%, #f0a08b 76%, #e8552f 100%)';

// Warmth returning to the OPEN card, where the full gradient has washed out:
// the same vermilion the gradient ends on, pooled in the bottom-right corner
// and falling away diagonally. Zero-alpha stops carry the colour rather than
// `transparent`, which interpolates through transparent black and greys the
// fade in some engines.
// Many shallow stops rather than three steep ones. A short falloff banded
// visibly against the flat card, and the hard #e8552f centre stop gave it an
// edge where it met the ground.
const CARD_CORNER_GLOW =
  'radial-gradient(135% 105% at 100% 104%, rgba(232, 85, 47, 0.88) 0%, rgba(232, 85, 47, 0.757) 12%, rgba(232, 85, 47, 0.581) 24%, rgba(232, 85, 47, 0.405) 36%, rgba(232, 85, 47, 0.255) 48%, rgba(232, 85, 47, 0.141) 60%, rgba(232, 85, 47, 0.062) 72%, rgba(232, 85, 47, 0.018) 84%, rgba(232, 85, 47, 0) 100%)';

// For cards whose window sits over the bottom-right, where the corner glow
// would be hidden behind it. Anchored to the bottom-LEFT corner, so the warmth
// rises out of the open side.
const CARD_LEFT_GLOW =
  'radial-gradient(135% 105% at 0% 104%, rgba(232, 85, 47, 0.88) 0%, rgba(232, 85, 47, 0.757) 12%, rgba(232, 85, 47, 0.581) 24%, rgba(232, 85, 47, 0.405) 36%, rgba(232, 85, 47, 0.255) 48%, rgba(232, 85, 47, 0.141) 60%, rgba(232, 85, 47, 0.062) 72%, rgba(232, 85, 47, 0.018) 84%, rgba(232, 85, 47, 0) 100%)';

// Centred on the bottom EDGE rather than a corner, for the card whose window
// sits in the middle: the warmth rises evenly from underneath it instead of
// pooling to one side.
const CARD_BOTTOM_GLOW =
  'radial-gradient(105% 72% at 50% 112%, rgba(232, 85, 47, 0.88) 0%, rgba(232, 85, 47, 0.757) 12%, rgba(232, 85, 47, 0.581) 24%, rgba(232, 85, 47, 0.405) 36%, rgba(232, 85, 47, 0.255) 48%, rgba(232, 85, 47, 0.141) 60%, rgba(232, 85, 47, 0.062) 72%, rgba(232, 85, 47, 0.018) 84%, rgba(232, 85, 47, 0) 100%)';

// One curve for every transition in the section, so the widening, the wash-out
// and the reveal all move as one gesture rather than three.
const CARDS = [
  {
    title: ['One-click install', 'from your agent'],
    art: '/images/cards/oneclick.png',
    glow: CARD_CORNER_GLOW,
    texture: '/images/cards/texture-stepped.png',
    detail: ['Use Rivet with your Claude, Codex, and Cursor'],
    // Drifts on the left, behind the terminal window, rather than sitting
    // centred — the terminal is the subject here and the icons are set dressing.
    hoverArt: '/images/cards/agents-float.png',
    hoverArtClass: 'left-[7%] top-[58%] w-[31%] max-w-[172px]',
    // The live hero agent window, cropped by the card's right edge.
    session: HERO_SESSION,
    // Anchored right and running off the card's edge, so it reads as a crop
    // of a larger screen.
    sessionClass: 'left-[30%] top-[33%] h-[52%] w-[85%]',
    directions: false,
  },
  {
    title: ['Connect your', 'design references'],
    art: '/images/cards/connectref.png',
    glow: CARD_BOTTOM_GLOW,
    texture: '/images/cards/bgtexutre2.png',
    detail: [
      'Pull in inspiration from Pinterest,',
      'Are.na, and your Local Files.',
    ],
    hoverArt: null,
    hoverArtClass: null,
    // Reading dropped images and an Are.na channel.
    session: REFERENCES_SESSION,
    // Centred and fully inside the card: here the window IS the subject, and
    // the references have to be seen landing on its composer.
    sessionClass: 'left-1/2 top-[34%] h-[54%] w-[76%] -translate-x-1/2',
    directions: false,
  },
  {
    title: ['Explore dozens', 'of different ideas'],
    art: '/images/cards/exploreee.png',
    glow: CARD_LEFT_GLOW,
    texture: '/images/cards/bgtexture3.png',
    // Broken by hand after "that": the copy column is fixed to the closed
    // card's width, so where it wraps is predictable — and left to itself it
    // put "you can" on line one and orphaned the rest.
    detail: ['Rivet generates design directions', 'that you can compare and refine'],
    hoverArt: null,
    hoverArtClass: null,
    session: null,
    sessionClass: null,
    // The Directions panel mid-run, generating into a window cropped by the
    // card's right edge — the same crop the agent window uses on card one.
    directions: true,
  },
] as const;

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
// The card's width is the slow part — it has the furthest to travel and it is
// what the eye follows.
const EXPAND_MS = 620;
// The card's ground washes out to plain white when it opens, so the icons and
// the copy sit on a clear surface instead of on the vermilion end of the
// gradient. The texture stays — only the colour goes.
const WASH_MS = 320;
// The shape art just fades; it used to slide out the bottom as well, which
// read as too much movement for something that is only getting out of the way.
// Short, and shorter still on the way OUT — it is only clearing the frame, so
// there is nothing to watch. It has to be gone well before the card finishes
// widening at 620ms, or it lingers over the content arriving underneath.
const ART_FADE_MS = 110;
// Coming back it can take its time, since by then it is the thing being
// looked at.
const ART_RETURN_MS = 260;
// Barely eased. This sat on an ease-IN, which held the art at full strength
// for the first stretch and then dropped it — read as a lag before anything
// happened. A near-symmetric curve starts thinning straight away and still
// settles smoothly rather than cutting off the way linear does.
const ART_FADE_EASE = 'cubic-bezier(0.33, 0, 0.67, 1)';
// Feathers the art's right edge while a card is opening — see the art layer.
const ART_EDGE_FADE = 'linear-gradient(to right, #000 88%, transparent 100%)';
const ARRIVE_MS = 340;

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
// Shared by the headline and its measurement probe. They MUST render in the
// same face, weight and tracking — the probe's width is what sets the
// headline's size, so a weight that differs by even one step sizes the type
// off the wrong metrics and wraps it to three lines.
const TITLE_FONT = 'font-aileron font-normal';
// Fallback until the probe has been read, in multiples of font-size.
const TITLE_RATIO = 21;

/**
 * The Directions panel mid-generation, inside window chrome — what Rivet is
 * actually doing when it explores directions.
 *
 * `start` is the card's own open state, so the run begins when the card opens
 * rather than on mount: the skeletons and the directions streaming in are the
 * point, and a panel that had already finished generating by the time anyone
 * hovered it would show none of that. Closing resets it, so it replays.
 */
// The window renders at 1/SCALE of its box and is then scaled back down, so
// its contents are laid out in MORE css pixels than the box has. Sizing the
// box down instead would just crop the list; this fits more of it in.
const DIRECTIONS_SCALE = 0.66;

const DirectionsWindow = ({ open }: { open: boolean }) => {
  const ctrl = useVariantsDemo({ start: open, autoPlay: true });

  return (
    <div
      style={{
        width: `${100 / DIRECTIONS_SCALE}%`,
        height: `${100 / DIRECTIONS_SCALE}%`,
        transform: `scale(${DIRECTIONS_SCALE})`,
        transformOrigin: 'top left',
      }}
    >
      <BrowserFrame url="localhost:4000" className="h-full w-full">
        <div className="flex h-full w-full">
          {/* The panel needs a positioned box to fill: `desktop` mode expects
              to be dropped into one the showcase owns. */}
          <div className="relative h-full w-[64%] shrink-0">
            <DirectionsPanel ctrl={ctrl} desktop />
          </div>
          <div className="h-full flex-1 bg-white" />
        </div>
      </BrowserFrame>
    </div>
  );
};

/** `transition` for something that arrives when a card opens: a plain fade. */
const arrive = () => `opacity ${ARRIVE_MS}ms ${EASE}`;

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
            className={`mt-6 ${TITLE_FONT} text-[30px] leading-[1.14] text-black lg:mt-0`}
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
            className={`pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap ${TITLE_FONT}`}
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
        {/* No leave handler anywhere. Whichever card you touched last stays
            open when the pointer goes — resetting on leave meant the row
            snapped back to the first card every time you left it, and (when
            the handler was per-card) the 24px gap between cards counted as
            leaving, so crossing it flashed the wrong card open mid-move. */}
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
  onHover: (i: number) => void;
}) => {
  const isOpen = hovered === index;
  // Stacked on mobile, so the stagger plays out card by card; at lg they share
  // a row and it reads as one gesture.
  const reveal = useScrollReveal<HTMLElement>({ delay: index * 80 });

  return (
              <article
                ref={reveal.ref}
                onMouseEnter={() => onHover(index)}
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
                {/* The card's ground: gradient, then texture. Separate layers
                    rather than backgrounds on the article, because the
                    gradient has to fade on its own — a background-image has
                    nothing to transition to, so washing out means fading a
                    layer, not changing a paint. The texture does NOT fade: an
                    open card keeps the same pattern as its neighbours, just
                    without the colour under it. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: CARD_GRADIENT,
                    opacity: isOpen ? 0 : 1,
                    transition: `opacity ${WASH_MS}ms ${EASE}`,
                  }}
                />
                {/* Under the texture, so the pinstripe reads over it the
                    same way it reads over the closed card's gradient. Fades in
                    as that gradient fades out, on the same clock. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: card.glow,
                    opacity: isOpen ? 1 : 0,
                    transition: `opacity ${WASH_MS}ms ${EASE}`,
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
                {/* Fades out of the way when the card opens, so the icons
                    below have the card to themselves. */}
                {/* Fixed to the CLOSED card's width, not w-full: the art is
                    still on screen while the card is widening, and a
                    full-width image stretches with it. Pinned to the left edge
                    so what stays visible is the same crop it had at rest. */}
                <img
                  src={card.art}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute bottom-0 left-0 block max-w-none"
                  style={{
                    width: restW ?? '100%',
                    // Only while OPENING. The art is fixed to the closed
                    // card's width, so a widening card exposes its right edge
                    // for as long as it is still fading, and feathering means
                    // what shows there is a dissolve rather than a hard cut.
                    // At rest the art already ends exactly at the card's edge,
                    // where the same mask just reads as the artwork fading out
                    // early. Switching it with the fade hides the switch.
                    WebkitMaskImage: isOpen ? ART_EDGE_FADE : undefined,
                    maskImage: isOpen ? ART_EDGE_FADE : undefined,
                    opacity: isOpen ? 0 : 1,
                    transition: isOpen
                      ? `opacity ${ART_FADE_MS}ms ${ART_FADE_EASE}`
                      : `opacity ${ART_RETURN_MS}ms ${EASE}`,
                  }}
                />

                {/* Revealed by the wash-out: it sits under the copy, centred,
                    and scales up a touch as it fades in so it reads as
                    arriving rather than switching on. Kept off the DOM
                    entirely for cards that have none. */}
                {card.hoverArt && (
                  // Wrapper carries the arrival (opacity + rise); the inner
                  // element carries the idle drift. They have to be separate
                  // elements — one `transform` can't run a transition and a
                  // keyframe animation at once, and the animation would win,
                  // cancelling the rise.
                  <div
                    // z-20 puts the icons above everything else in the card —
                    // they and the terminal window overlap, and DOM order
                    // alone had the window (which comes later) on top.
                    className={`pointer-events-none absolute z-20 block -translate-y-1/2 ${card.hoverArtClass}`}
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transition: arrive(),
                    }}
                  >
                    <img
                      src={card.hoverArt}
                      alt=""
                      draggable={false}
                      className="rivet-float block w-full"
                    />
                  </div>
                )}

                {/* The Directions panel mid-run, cropped by the card's right
                    edge — the same bleed the card art uses.
                    pointer-events-none: it plays on its own and there is
                    nothing to operate. Left live, its scrollable list ate the
                    page's wheel events whenever the cursor crossed it. */}
                {card.directions && (
                  <div
                    className="pointer-events-none absolute left-[28%] top-[36%] h-[64%] w-full"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transition: arrive(),
                    }}
                  >
                    <DirectionsWindow open={isOpen} />
                  </div>
                )}

                {/* The hero's agent window, anchored to the bottom-right and
                    running past the card's right edge. Kept mounted rather
                    than toggled so the script is already mid-session when the
                    card opens; AgentTerminal's own useInView pauses playback
                    while it's scrolled away. */}
                {/* overflow-hidden + a matching radius on this wrapper as
                    well as on the window itself: the card carries a blur
                    filter from its scroll reveal, and a filtered ancestor is
                    enough to leave a descendant's own rounded clip ragged at
                    the corners. Clipping again here fixes it. */}
                {card.session && (
                  <div
                    className={`absolute overflow-hidden rounded-2xl ${card.sessionClass}`}
                    style={{
                      opacity: isOpen ? 1 : 0,
                      // Only live while the card is open: an opacity-0 layer
                      // still hit-tests, so a closed card would have an
                      // invisible terminal swallowing clicks over most of it.
                      pointerEvents: isOpen ? 'auto' : 'none',
                      transition: arrive(),
                    }}
                  >
                    <AgentTerminal
                      compact
                      script={card.session}
                      className="h-full w-full"
                    />
                  </div>
                )}

                {/* Fixed to the CLOSED card's width so the copy never
                    re-wraps as the card opens and shuts. Left to fill the
                    card, every line reflowed mid-transition — the text was
                    animating along with the box. */}
                <div
                  className="relative z-10 p-6 lg:p-7"
                  style={restW ? { width: restW } : undefined}
                >
                  {/* Weight is FAKED, not switched. Aileron ships as separate
                      files rather than a variable font, so font-weight has
                      nothing to tween between — it snapped, and because Bold
                      is ~7% wider the line jumped sideways at the same
                      instant. A text-shadow in the text's own colour thickens
                      the strokes instead: it is animatable, and it costs no
                      layout, so the glyphs stay exactly where they are. */}
                  <h3
                    className="font-aileron text-[22px] font-normal leading-[1.18] text-[#642e39] lg:text-[24px]"
                    style={{
                      textShadow: isOpen
                        ? '0 0 0.55px currentColor, 0 0 0.55px currentColor'
                        : '0 0 0 rgba(100, 46, 57, 0)',
                      transition: `text-shadow ${ARRIVE_MS}ms ${EASE}`,
                    }}
                  >
                    {card.title[0]}
                    <br />
                    {card.title[1]}
                  </h3>
                  {card.detail && (
                    // Always in the DOM and always taking its space, so
                    // revealing it never reflows the heading above.
                    <p
                      // No max-width: 34ch resolved to ~280px here while the
                      // line itself measures 297px at 15px, so the cap alone
                      // was breaking "Cursor" onto a second line. The card's
                      // own padding is the only constraint it needs — the
                      // line fits inside an open card with room to spare.
                      className="mt-3 font-aileron text-[15px] leading-[1.45] text-[#642e39]/80"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transition: arrive(),
                      }}
                    >
                      {card.detail.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </article>
  );
};

// Memoized: it takes no props, so it never needs to re-render when the App
// re-renders (e.g. during the hero intro's state churn).
export default memo(AgentTerminalSection);
