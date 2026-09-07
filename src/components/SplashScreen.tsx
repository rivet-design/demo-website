import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  RIVET_ICON_SRC,
  RIVET_TEXT_SRC,
  RIVET_TEXT_NATIVE_ASPECT,
  RIVET_TEXT_TO_ICON_HEIGHT,
  RIVET_LOCKUP_GAP_RATIO,
} from '../lib/rivetLockup';

// Very fast strobe through five treatments of the mark, twice through, cut
// short at the start of the second gradient pass so it lands on metallic
// last. Then it settles on the flat resting icon instead of freezing
// mid-flash. The mark stays small and centered — like the crop-marked
// thumbnails in the source Figma file — not full-bleed.
const FLASH_FRAME_MS = 85;
const SETTLE_FADE_MS = 260;
const SETTLE_HOLD_MS = 220;
// Canvas → full-screen and the lockup's text reveal run together, not as
// separate sequential steps — the wordmark is already moving into place as
// soon as the canvas starts expanding.
const EXPAND_MS = 980;
// Kept short on purpose: the canvas filling tan and the lockup shrinking
// into place (which is also what kicks off the hero's blur-fade-slide-up,
// via rivet:splash-landing) should read as one continuous motion, not two
// separate beats with a pause between them.
const EXPAND_HOLD_MS = 50;
const LAND_MS = 540;
const LAND_HOLD_MS = 120;
const EXIT_FADE_MS = 300;
// Shared by the canvas expand AND the lockup opening (see the aliases below).
// Still a dramatic ease-in-out — quiet wind-up, strong middle, long glide —
// but deliberately NOT full expo (was 0.87/0.13). The canvas sweeps ~1600px
// while the wordmark's clip travels ~170px, so on a violently-peaked curve
// the canvas visually runs away from the wordmark even though both are on
// the identical timing function. Lowering the peak keeps the two reading as
// one gesture, which matters more here than raw drama.
const EXPAND_EASE = 'cubic-bezier(0.62, 0, 0.30, 1)';
// The lockup opening (icon/text gap + the wordmark's clip) shares the canvas's
// CURVE exactly — that's what keeps the two feeling like one gesture — but
// runs a touch shorter, so the wordmark resolves before the canvas finishes
// its last pixels. Both start together; the wordmark simply gets there first,
// which reads as the logo leading and the canvas settling in behind it. The
// lead is held on the CANVAS side — slow the expand rather than speeding the
// wordmark up — because the wordmark's clip only travels ~170px and shortening
// it further makes it snap rather than unveil. Currently 980 vs 800: a 180ms lead.
const LOCKUP_OPEN_MS = 800;
const LOCKUP_EASE = EXPAND_EASE;
// Expo out for the FLIP onto the real hero lockup: leaves instantly, then
// decelerates almost forever, so it shoots toward the hero and eases in late.
const LAND_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
// Whichever of the two opening beats finishes last gates `landing`.
const OPEN_TOTAL_MS = Math.max(EXPAND_MS, LOCKUP_OPEN_MS);

const CANVAS_FILL = '#F1EFE8';
const OUTER_FILL = '#fafafa';
const SMALL_SIZE = 'clamp(150px, 16vmin, 240px)';
// Fixed regardless of canvas size (3.5% of SMALL_SIZE, decoupled from the
// growing box) — the ticks must never scale up as the canvas stretches.
const TICK_SIZE = 'clamp(5px, 0.56vmin, 8.4px)';

// The icon's own tight box — not padded inside a bigger invisible box — so
// its bounding rect is exactly what a FLIP transition measures, matching
// the hero lockup's icon box one-for-one.
const ICON_SCALE = 0.44;
const ICON_SIZE = `calc((${SMALL_SIZE}) * ${ICON_SCALE})`;
// The flash strobe renders at its original full SMALL_SIZE despite living
// inside the smaller ICON_SIZE box — done via transform: scale() (which
// can't be knocked off-center by any max-width/margin edge case) rather
// than an oversized explicit width, which is what was actually causing the
// off-center crop.
const FLASH_SCALE = 1 / ICON_SCALE;
const LOCKUP_GAP = `calc((${ICON_SIZE}) * ${RIVET_LOCKUP_GAP_RATIO})`;
const TEXT_HEIGHT = `calc((${ICON_SIZE}) * ${RIVET_TEXT_TO_ICON_HEIGHT})`;
const TEXT_WIDTH_FULL = `calc((${ICON_SIZE}) * ${RIVET_TEXT_TO_ICON_HEIGHT} * ${RIVET_TEXT_NATIVE_ASPECT})`;

const FLASH_FRAMES = [
  '/images/splash/splash-gradient-tight.png',
  '/images/splash/splash-outline-tight.png',
  '/images/splash/splash-sketch-tight.png',
  '/images/splash/splash-collage-tight.png',
  '/images/splash/splash-metallic-tight.png',
  '/images/splash/splash-outline-tight.png',
  '/images/splash/splash-sketch-tight.png',
  '/images/splash/splash-collage-tight.png',
  '/images/splash/splash-metallic-tight.png',
] as const;

type Phase = 'loading' | 'flashing' | 'settled' | 'expanding' | 'landing' | 'exiting' | 'done';

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

// Registration-mark corner ticks, reproduced from the Figma source (Rectangle
// 43567/43568): each sits flush with the canvas's edge and extends outward
// into the corner it marks.
const CORNER_TICKS = [
  { asset: '/images/splash/corner-tl.svg', position: 'top-0 left-0 -translate-x-full -translate-y-full', rotate: '-rotate-90 -scale-y-100' },
  { asset: '/images/splash/corner-tr.svg', position: 'top-0 right-0 translate-x-full -translate-y-full', rotate: '-rotate-90' },
  { asset: '/images/splash/corner-tl.svg', position: 'bottom-0 left-0 -translate-x-full translate-y-full', rotate: '-rotate-90 -scale-y-100' },
  { asset: '/images/splash/corner-tr.svg', position: 'bottom-0 right-0 translate-x-full translate-y-full', rotate: '-rotate-90' },
];

const IDENTITY_TRANSFORM = 'translate(0px, 0px) scale(1)';

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [frameIndex, setFrameIndex] = useState(0);
  const [landTransform, setLandTransform] = useState(IDENTITY_TRANSFORM);
  const lockupRef = useRef<HTMLDivElement>(null);

  // Preload every frame so the strobe cadence isn't stalled by network fetches.
  useEffect(() => {
    let cancelled = false;
    const sources = Array.from(new Set<string>([...FLASH_FRAMES, RIVET_ICON_SRC]));
    Promise.all(sources.map(preload)).then(() => {
      if (!cancelled) setPhase('flashing');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'flashing') return;
    if (frameIndex >= FLASH_FRAMES.length - 1) {
      const id = window.setTimeout(() => setPhase('settled'), FLASH_FRAME_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setFrameIndex((i) => i + 1), FLASH_FRAME_MS);
    return () => window.clearTimeout(id);
  }, [phase, frameIndex]);

  useEffect(() => {
    if (phase !== 'settled') return;
    const id = window.setTimeout(() => setPhase('expanding'), SETTLE_FADE_MS + SETTLE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Canvas → full screen and the text reveal run together here — one
  // transition, not a chain of separate stretch/reveal/cover steps.
  useEffect(() => {
    if (phase !== 'expanding') return;
    const id = window.setTimeout(() => setPhase('landing'), OPEN_TOTAL_MS + EXPAND_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Landing: measure the real hero lockup (#hero-lockup) and scale/move this
  // lockup onto it — a FLIP transition. Both lockups share identical icon/
  // gap/text ratios (see lib/rivetLockup.ts), so one width-based scale keeps
  // every sub-element aligned, not just the overall box. If the target isn't
  // in the DOM for any reason, this just skips the movement.
  useEffect(() => {
    if (phase !== 'landing') return;
    const heroEl = document.getElementById('hero-lockup');
    const lockupEl = lockupRef.current;
    if (heroEl && lockupEl) {
      const heroRect = heroEl.getBoundingClientRect();
      const lockupRect = lockupEl.getBoundingClientRect();
      if (lockupRect.width > 0) {
        const scale = heroRect.width / lockupRect.width;
        const dx = heroRect.left + heroRect.width / 2 - (lockupRect.left + lockupRect.width / 2);
        const dy = heroRect.top + heroRect.height / 2 - (lockupRect.top + lockupRect.height / 2);
        setLandTransform(`translate(${dx}px, ${dy}px) scale(${scale})`);
      }
    }
    // Tell the page the lockup is shrinking into place — the hero copy below
    // it starts its own fade-in right now, still hidden behind the splash,
    // so it's already mid-animation by the time the splash's opacity fade
    // reveals it (rather than popping in fully-formed afterward).
    window.dispatchEvent(new Event('rivet:splash-landing'));
    const id = window.setTimeout(() => setPhase('exiting'), LAND_MS + LAND_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    // The splash's lockup has finished its FLIP and is now sitting exactly on
    // top of the real #hero-lockup. Tell the page it can show its own copy:
    // until this moment the hero keeps its lockup hidden, so there is only
    // ever ONE rivet mark on screen — the splash's, travelling — instead of
    // the real one appearing underneath mid-flight and reading as a
    // duplicate. Both are superimposed for this fade, so the swap is
    // invisible.
    window.dispatchEvent(new Event('rivet:splash-lockup-landed'));
    const id = window.setTimeout(() => setPhase('done'), EXIT_FADE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Lock scroll while the splash owns the viewport — the visitor must land on
  // the full-size hero, not part-way into the scroll-driven shrink sequence.
  // Locked on BOTH <html> and <body>: which one is the scrolling element
  // varies by browser/document, and overflow:hidden on the wrong one alone
  // leaves the page scrollable behind the splash.
  useEffect(() => {
    if (phase === 'done') return;
    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [phase]);

  if (phase === 'done') return null;

  const isSettling = phase !== 'loading' && phase !== 'flashing';
  const isLanding = phase === 'landing' || phase === 'exiting';
  const isExpanded = phase === 'expanding' || isLanding;

  // Small resting square → full-screen cover, same fill as the real page
  // (--background) underneath so the final fade-out is seamless. Corner
  // ticks track whichever size is live. The FILL is painted by a separate
  // layer inside (see chromeFade) rather than on this box, so the backdrop
  // can dissolve independently of the lockup riding on top of it.
  const canvasStyle: CSSProperties = {
    width: isExpanded ? '100vw' : SMALL_SIZE,
    height: isExpanded ? '100vh' : SMALL_SIZE,
    transition: `width ${EXPAND_MS}ms ${EXPAND_EASE}, height ${EXPAND_MS}ms ${EXPAND_EASE}`,
  };

  // Everything that ISN'T the lockup — the outer ground, the canvas fill, the
  // corner ticks — dissolves across the landing beat, so the real page shows
  // through WHILE the lockup is still sliding up and scaling into place. That
  // overlap is the point: the hero's headline/CTAs are already blur-fading up
  // underneath instead of waiting for an opaque splash to finish and pop off.
  // The lockup itself stays fully opaque right through the landing and only
  // goes with the root's own fade at `exiting` — by which point it sits
  // exactly on the real hero lockup, so the swap is invisible.
  const chromeFade: CSSProperties = {
    opacity: isLanding ? 0 : 1,
    transition: `opacity ${LAND_MS}ms ${LAND_EASE}`,
  };

  return (
      <div
        role="presentation"
        aria-hidden="true"
        className={`fixed inset-0 z-[999] flex items-center justify-center transition-opacity ${
          phase === 'exiting' ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        style={{
          transitionDuration: `${EXIT_FADE_MS}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
    >
      {/* Outer ground. Its own layer (not the root's background-color) so it
          can dissolve during the landing while the lockup above stays solid. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: OUTER_FILL, ...chromeFade }}
      />
      {/* Outer margin stays the original fafafa the whole time — the tan
          canvas fill only ever shows up inside the canvas box itself, and
          only takes over the full screen once it covers it. */}
      <div className="relative" style={canvasStyle}>
        {/* The tan canvas fill, as its own dissolving layer. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: CANVAS_FILL, ...chromeFade }}
        />
        {/* The lockup: pinned icon + text-reveal, kept together as one unit
            so it can be measured and FLIP'd onto the real hero wordmark. */}
        <div
          ref={lockupRef}
          className="absolute inset-0 m-auto flex items-center"
          style={{
            width: 'max-content',
            height: ICON_SIZE,
            gap: isExpanded ? LOCKUP_GAP : '0px',
            transform: isLanding ? landTransform : IDENTITY_TRANSFORM,
            transformOrigin: 'center center',
            // Gap keeps the original lockup curve; only the landing FLIP gets
            // the dramatic expo-out.
            transition: `transform ${LAND_MS}ms ${LAND_EASE}, gap ${LOCKUP_OPEN_MS}ms ${LOCKUP_EASE}`,
          }}
        >
          {/* Icon: one file, never fades out and never swapped for anything
              else — the flash strobe settles on it and it stays exactly
              as-is through the whole reveal, lockup, and landing. */}
          <div className="relative" style={{ width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }}>
            {/* Flash strobe fills its own ICON_SIZE box exactly, then is
                scaled up around its own center to its original full
                SMALL_SIZE — a transform, so it can't be knocked off-center
                by any max-width/margin edge case. Gone (opacity 0) well
                before it would ever affect layout or the FLIP measurement. */}
            {phase !== 'loading' && (
              <img
                src={FLASH_FRAMES[frameIndex]}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
                  isSettling ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  transform: `scale(${FLASH_SCALE})`,
                  transitionDuration: `${SETTLE_FADE_MS}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 1, 1)',
                }}
              />
            )}
            <img
              src={RIVET_ICON_SRC}
              alt="Rivet"
              className={`absolute inset-0 h-full w-full object-contain transition-opacity ${
                isSettling ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDuration: `${SETTLE_FADE_MS}ms`, transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }}
            />
          </div>

          {/* Text reveal: widens 0 → TEXT_WIDTH_FULL in lockstep with the
              canvas's own expand transition (same EXPAND_MS), unclipping
              the (fixed-size) "rivet" text beside the icon as the canvas
              opens up — not after it. Growing this box is also what pushes
              the whole (centered) lockup's left edge — the icon — a bit to
              the left as it opens up. */}
          <div
            className="overflow-hidden"
            style={{
              width: isExpanded ? TEXT_WIDTH_FULL : '0px',
              height: TEXT_HEIGHT,
              transition: `width ${LOCKUP_OPEN_MS}ms ${LOCKUP_EASE}`,
            }}
          >
            <img
              src={RIVET_TEXT_SRC}
              alt=""
              style={{
                display: 'block',
                height: TEXT_HEIGHT,
                width: TEXT_WIDTH_FULL,
                maxWidth: 'none',
              }}
            />
          </div>
        </div>

        {CORNER_TICKS.map(({ asset, position, rotate }, i) => (
          <div
            key={i}
            className={`absolute ${position}`}
            style={{ width: TICK_SIZE, height: TICK_SIZE, ...chromeFade }}
          >
            <img src={asset} alt="" className={`block h-full w-full ${rotate}`} />
          </div>
        ))}
      </div>
      </div>
  );
}
